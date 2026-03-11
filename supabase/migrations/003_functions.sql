-- =============================================================================
-- AntMeta Platform - Database Functions
-- Migration: 003_functions.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- generate_client_id(): Format 260116XXXXXX based on current date + sequence
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_client_id()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  seq INTEGER;
  new_id TEXT;
BEGIN
  prefix := TO_CHAR(NOW(), 'YYMMDD');
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(client_id FROM 7) AS INTEGER)), 99999
  ) + 1
  INTO seq
  FROM clients
  WHERE client_id LIKE prefix || '%';

  new_id := prefix || LPAD(seq::TEXT, 6, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- get_dashboard_kpis(): Admin dashboard aggregate KPIs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clients', (SELECT COUNT(*) FROM clients WHERE status != 'inactive'),
    'active_clients', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
    'pending_clients', (SELECT COUNT(*) FROM clients WHERE status = 'pending'),
    'total_aum', (SELECT COALESCE(SUM(aum), 0) FROM clients WHERE status = 'active'),
    'total_pnl', (SELECT COALESCE(SUM(total_pnl), 0) FROM master_accounts),
    'pending_kyc', (SELECT COUNT(*) FROM clients WHERE kyc_status = 'pending'),
    'open_tickets', (SELECT COUNT(*) FROM tickets WHERE status IN ('open', 'in_progress')),
    'overdue_invoices', (SELECT COUNT(*) FROM invoices WHERE status = 'overdue'),
    'total_partners', (SELECT COUNT(*) FROM partners WHERE status = 'active'),
    'revenue_mtd', (
      SELECT COALESCE(SUM(total_amount), 0) FROM invoices
      WHERE status = 'paid'
        AND paid_at >= DATE_TRUNC('month', NOW())
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- get_client_pnl_summary(p_client_id UUID): P&L summary for a client
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_client_pnl_summary(p_client_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_pnl', (
      SELECT COALESCE(SUM(cumulative_pnl), 0)
      FROM pnl_snapshots
      WHERE client_id = p_client_id
        AND date = (SELECT MAX(date) FROM pnl_snapshots WHERE client_id = p_client_id)
    ),
    'mtd_pnl', (
      SELECT COALESCE(SUM(daily_pnl), 0)
      FROM pnl_snapshots
      WHERE client_id = p_client_id
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'current_aum', (
      SELECT COALESCE(aum, 0) FROM clients WHERE id = p_client_id
    ),
    'max_drawdown', (
      SELECT COALESCE(MAX(drawdown_pct), 0)
      FROM pnl_snapshots
      WHERE client_id = p_client_id
    ),
    'total_trades', (
      SELECT COUNT(*) FROM trades WHERE client_id = p_client_id
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- calculate_traas_billing(p_cycle_id UUID): Calculate TraaS profit sharing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_traas_billing(p_cycle_id UUID)
RETURNS JSON AS $$
DECLARE
  cycle_rec RECORD;
  gross DECIMAL(15,2);
  share DECIMAL(15,2);
  result JSON;
BEGIN
  SELECT * INTO cycle_rec FROM billing_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Cycle not found');
  END IF;

  gross := cycle_rec.ending_aum - cycle_rec.starting_aum;
  IF gross > 0 THEN
    share := gross * 0.25;
  ELSE
    share := 0;
  END IF;

  UPDATE billing_cycles
  SET gross_pnl = gross,
      platform_share = share,
      status = 'closed'
  WHERE id = p_cycle_id;

  SELECT json_build_object(
    'cycle_id', p_cycle_id,
    'starting_aum', cycle_rec.starting_aum,
    'ending_aum', cycle_rec.ending_aum,
    'gross_pnl', gross,
    'platform_share', share,
    'billable', gross > 0
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Trigger: auto-create user row when auth.users row is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, name, role, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

COMMIT;
