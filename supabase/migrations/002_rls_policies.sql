-- =============================================================================
-- AntMeta Platform - Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- =============================================================================

BEGIN;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE pnl_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: check if current user is admin/super_admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT (SELECT auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_support()
RETURNS BOOLEAN AS $$
  SELECT (SELECT auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin', 'support');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- USERS
-- =============================================================================
CREATE POLICY "users_own_read" ON users
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "users_admin_read" ON users
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "users_admin_update" ON users
  FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "users_own_update" ON users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

-- =============================================================================
-- CLIENTS
-- =============================================================================
CREATE POLICY "clients_own_read" ON clients
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "clients_admin_all" ON clients
  FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "clients_partner_read" ON clients
  FOR SELECT TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = (SELECT auth.uid())
    )
  );

-- =============================================================================
-- PLANS (public read, admin write)
-- =============================================================================
CREATE POLICY "plans_read" ON plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "plans_admin_write" ON plans
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- MASTER ACCOUNTS (public read, admin write)
-- =============================================================================
CREATE POLICY "masters_read" ON master_accounts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "masters_admin_write" ON master_accounts
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- PARTNERS
-- =============================================================================
CREATE POLICY "partners_own_read" ON partners
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "partners_admin_all" ON partners
  FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "partners_insert" ON partners
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================================================
-- KYC DOCUMENTS
-- =============================================================================
CREATE POLICY "kyc_client_read" ON kyc_documents
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "kyc_client_insert" ON kyc_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "kyc_admin_all" ON kyc_documents
  FOR ALL TO authenticated
  USING (is_admin_or_support());

-- =============================================================================
-- INVOICES
-- =============================================================================
CREATE POLICY "invoices_client_read" ON invoices
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- TRANSACTIONS
-- =============================================================================
CREATE POLICY "transactions_client_read" ON transactions
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "transactions_admin_all" ON transactions
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- TRADES
-- =============================================================================
CREATE POLICY "trades_client_read" ON trades
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "trades_admin_all" ON trades
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- PNL SNAPSHOTS
-- =============================================================================
CREATE POLICY "pnl_client_read" ON pnl_snapshots
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "pnl_admin_all" ON pnl_snapshots
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- TICKETS
-- =============================================================================
CREATE POLICY "tickets_client_read" ON tickets
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "tickets_client_insert" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "tickets_admin_all" ON tickets
  FOR ALL TO authenticated
  USING (is_admin_or_support());

-- =============================================================================
-- TICKET MESSAGES
-- =============================================================================
CREATE POLICY "ticket_messages_client_read" ON ticket_messages
  FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN clients c ON c.id = t.client_id
      WHERE c.user_id = (SELECT auth.uid())
    )
    AND is_internal = FALSE
  );

CREATE POLICY "ticket_messages_client_insert" ON ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN clients c ON c.id = t.client_id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ticket_messages_admin_all" ON ticket_messages
  FOR ALL TO authenticated
  USING (is_admin_or_support());

-- =============================================================================
-- EXCHANGE CONNECTIONS
-- =============================================================================
CREATE POLICY "exchange_client_own" ON exchange_connections
  FOR ALL TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "exchange_admin_read" ON exchange_connections
  FOR SELECT TO authenticated
  USING (is_admin());

-- =============================================================================
-- AUDIT LOGS (admin read only, insert via service role)
-- =============================================================================
CREATE POLICY "audit_admin_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- =============================================================================
-- NOTIFICATION TEMPLATES (admin all, no client access)
-- =============================================================================
CREATE POLICY "notif_templates_admin_all" ON notification_templates
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE POLICY "notifications_own_read" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_admin_all" ON notifications
  FOR ALL TO authenticated
  USING (is_admin());

-- =============================================================================
-- BILLING CYCLES
-- =============================================================================
CREATE POLICY "billing_client_read" ON billing_cycles
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "billing_admin_all" ON billing_cycles
  FOR ALL TO authenticated
  USING (is_admin());

COMMIT;
