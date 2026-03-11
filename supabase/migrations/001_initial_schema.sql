-- =============================================================================
-- AntMeta Platform - Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Creates all 17 core tables for the AntMeta algorithmic trading
--              client onboarding and management platform.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- UTILITY: updated_at trigger function (defined early; used across tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE 1: users
-- Core identity table. Supabase Auth UIDs are used as PKs.
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  phone         TEXT        UNIQUE,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'client'
                            CHECK (role IN ('super_admin', 'admin', 'support', 'client')),
  account_type  TEXT        NOT NULL DEFAULT 'individual'
                            CHECK (account_type IN ('individual', 'corporate')),
  avatar_url    TEXT,
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email   ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role    ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status  ON users (status);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 2: plans
-- Subscription plan definitions.
-- =============================================================================
CREATE TABLE IF NOT EXISTS plans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  slug              TEXT        UNIQUE NOT NULL,
  price             DECIMAL(12, 2),           -- NULL for profit-sharing plans
  billing_type      TEXT        NOT NULL
                                CHECK (billing_type IN ('fixed_quarterly', 'profit_sharing')),
  profit_share_pct  DECIMAL(5, 2),            -- e.g. 25.00 for TraaS
  algorithms        TEXT[]      NOT NULL DEFAULT '{}',
  features          JSONB       NOT NULL DEFAULT '[]',
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_slug      ON plans (slug);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans (is_active);

-- =============================================================================
-- TABLE 3: master_accounts
-- Trading master accounts (M1, M2, M3) that clients copy-trade from.
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_accounts (
  id            TEXT        PRIMARY KEY,   -- 'M1', 'M2', 'M3'
  name          TEXT        NOT NULL,
  asset_class   TEXT        NOT NULL,      -- e.g. 'BTC/ETH Futures'
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'review', 'inactive')),
  success_rate  DECIMAL(5, 2),            -- percentage e.g. 99.00
  total_trades  INTEGER     NOT NULL DEFAULT 0,
  total_pnl     DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_clients INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_accounts_status ON master_accounts (status);

CREATE TRIGGER trg_master_accounts_updated_at
  BEFORE UPDATE ON master_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 4: partners
-- Referring partner / affiliate accounts.
-- =============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES users (id) ON DELETE SET NULL,
  name           TEXT        NOT NULL,
  total_clients  INTEGER     NOT NULL DEFAULT 0,
  total_aum      DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_pnl      DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_revenue  DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status         TEXT        NOT NULL DEFAULT 'review'
                             CHECK (status IN ('active', 'review', 'inactive')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners (user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status  ON partners (status);

CREATE TRIGGER trg_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE 5: clients
-- Client profile linked to a user. Holds plan, KYC status, trading config.
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  client_id   TEXT        UNIQUE NOT NULL,   -- format: 260116XXXXXX
  pan         TEXT,
  plan_id     UUID        REFERENCES plans (id) ON DELETE SET NULL,
  kyc_status  TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  partner_id  UUID        REFERENCES partners (id) ON DELETE SET NULL,
  algo_config JSONB       NOT NULL DEFAULT '{}',
  aum         DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('active', 'pending', 'inactive')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id    ON clients (user_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_id  ON clients (client_id);
CREATE INDEX IF NOT EXISTS idx_clients_plan_id    ON clients (plan_id);
CREATE INDEX IF NOT EXISTS idx_clients_partner_id ON clients (partner_id);
CREATE INDEX IF NOT EXISTS idx_clients_kyc_status ON clients (kyc_status);
CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients (status);

-- =============================================================================
-- TABLE 6: kyc_documents
-- KYC document submissions. Supports both manual upload and DigiLocker.
-- =============================================================================
CREATE TABLE IF NOT EXISTS kyc_documents (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID        NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  document_type        TEXT        NOT NULL,  -- 'pan', 'aadhaar', 'gst', 'moa', etc.
  file_url             TEXT,
  file_name            TEXT,
  status               TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'verified', 'rejected')),
  reviewer_id          UUID        REFERENCES users (id) ON DELETE SET NULL,
  reviewer_note        TEXT,
  reviewed_at          TIMESTAMPTZ,
  uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- DigiLocker integration fields
  digilocker_doc_id    TEXT,
  digilocker_verified  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_client_id  ON kyc_documents (client_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status     ON kyc_documents (status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_reviewer   ON kyc_documents (reviewer_id);

-- =============================================================================
-- TABLE 7: invoices
-- Billing invoices per client. Razorpay integration fields included.
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number      TEXT        UNIQUE NOT NULL,  -- e.g. INV-2602-023
  client_id           UUID        NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  amount              DECIMAL(12, 2) NOT NULL,      -- pre-GST amount
  gst_amount          DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_amount        DECIMAL(12, 2) NOT NULL,      -- amount + gst_amount
  type                TEXT        NOT NULL,          -- 'Standard', 'Premium', 'Exclusive', etc.
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date            DATE        NOT NULL,
  paid_at             TIMESTAMPTZ,
  payment_method      TEXT,                          -- 'razorpay', 'bank_transfer', etc.
  payment_ref         TEXT,
  -- Razorpay integration
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id      ON invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status         ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date       ON invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices (invoice_number);

-- =============================================================================
-- TABLE 8: transactions
-- Financial transaction ledger, linked to invoices.
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID        REFERENCES invoices (id) ON DELETE SET NULL,
  client_id   UUID        NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  amount      DECIMAL(12, 2) NOT NULL,
  type        TEXT        NOT NULL
              CHECK (type IN ('payment', 'refund', 'adjustment')),
  gateway     TEXT        NOT NULL DEFAULT 'razorpay',
  gateway_ref TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice_id ON transactions (invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id  ON transactions (client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status     ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);

-- =============================================================================
-- TABLE 9: trades
-- Individual trade records executed on Delta Exchange via master accounts.
-- =============================================================================
CREATE TABLE IF NOT EXISTS trades (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   TEXT        NOT NULL REFERENCES master_accounts (id) ON DELETE RESTRICT,
  client_id   UUID        NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  -- Delta Exchange compatible symbol format e.g. 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'
  symbol      TEXT        NOT NULL,
  side        TEXT        NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity    DECIMAL(20, 8) NOT NULL,
  price       DECIMAL(20, 8) NOT NULL,
  pnl         DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status      TEXT        NOT NULL DEFAULT 'open'
              CHECK (status IN ('open', 'closed', 'cancelled')),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_master_id   ON trades (master_id);
CREATE INDEX IF NOT EXISTS idx_trades_client_id   ON trades (client_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol      ON trades (symbol);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades (executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_status      ON trades (status);

-- =============================================================================
-- TABLE 10: pnl_snapshots
-- Daily P&L snapshots per client per master account.
-- =============================================================================
CREATE TABLE IF NOT EXISTS pnl_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID        NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  master_id       TEXT        NOT NULL REFERENCES master_accounts (id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  daily_pnl       DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  cumulative_pnl  DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  aum             DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  drawdown_pct    DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  UNIQUE (client_id, master_id, date)
);

CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_client_id ON pnl_snapshots (client_id);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_master_id ON pnl_snapshots (master_id);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_date      ON pnl_snapshots (date);

-- =============================================================================
-- TABLE 11: tickets
-- Support tickets raised by clients.
-- =============================================================================
CREATE TABLE IF NOT EXISTS tickets (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number  TEXT        UNIQUE NOT NULL,  -- e.g. TKT-001
  client_id      UUID        NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  subject        TEXT        NOT NULL,
  description    TEXT,
  priority       TEXT        NOT NULL DEFAULT 'medium'
                             CHECK (priority IN ('high', 'medium', 'low')),
  status         TEXT        NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to    UUID        REFERENCES users (id) ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_client_id     ON tickets (client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status        ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority      ON tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to   ON tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at    ON tickets (created_at);

-- =============================================================================
-- TABLE 12: ticket_messages
-- Threaded messages within a support ticket.
-- =============================================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  message     TEXT        NOT NULL,
  is_internal BOOLEAN     NOT NULL DEFAULT FALSE,  -- internal admin notes
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id  ON ticket_messages (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id  ON ticket_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages (created_at);

-- =============================================================================
-- TABLE 13: exchange_connections
-- Client API key bindings to Delta Exchange (hashed for security).
-- =============================================================================
CREATE TABLE IF NOT EXISTS exchange_connections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID        NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  exchange        TEXT        NOT NULL DEFAULT 'delta_exchange',
  api_key_hash    TEXT        NOT NULL,   -- SHA-256 hash of actual API key
  api_secret_hash TEXT        NOT NULL,   -- SHA-256 hash of actual secret
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  last_verified   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_connections_client_id  ON exchange_connections (client_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_is_active  ON exchange_connections (is_active);

-- =============================================================================
-- TABLE 14: audit_logs
-- Immutable audit trail of all significant platform actions.
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES users (id) ON DELETE SET NULL,
  action        TEXT        NOT NULL,         -- e.g. 'kyc.approve', 'invoice.create'
  resource_type TEXT        NOT NULL,         -- e.g. 'kyc_document', 'invoice'
  resource_id   TEXT,                         -- UUID or TEXT PK of the affected resource
  details       JSONB       NOT NULL DEFAULT '{}',
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action        ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs (created_at);

-- =============================================================================
-- TABLE 15: notification_templates
-- Reusable message templates for email, SMS, push, and in-app notifications.
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        UNIQUE NOT NULL,   -- e.g. 'kyc_approved', 'invoice_due'
  channel       TEXT        NOT NULL
                            CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
  subject       TEXT,                          -- email subject
  body_template TEXT        NOT NULL,
  variables     TEXT[]      NOT NULL DEFAULT '{}',  -- e.g. ['{{client_name}}', '{{amount}}']
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_channel   ON notification_templates (channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates (is_active);

-- =============================================================================
-- TABLE 16: notifications
-- Per-user notification inbox.
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  template_id UUID        REFERENCES notification_templates (id) ON DELETE SET NULL,
  channel     TEXT        NOT NULL
              CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  data        JSONB       NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at    ON notifications (read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);

-- =============================================================================
-- TABLE 17: billing_cycles
-- Quarterly billing cycle records, used for TraaS profit-share calculation.
-- =============================================================================
CREATE TABLE IF NOT EXISTS billing_cycles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID        NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  cycle_start    DATE        NOT NULL,
  cycle_end      DATE        NOT NULL,
  starting_aum   DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  ending_aum     DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  gross_pnl      DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  platform_share DECIMAL(15, 2) NOT NULL DEFAULT 0.00,  -- 25% of gross_pnl for TraaS
  invoice_id     UUID        REFERENCES invoices (id) ON DELETE SET NULL,
  status         TEXT        NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'closed', 'invoiced')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_client_id   ON billing_cycles (client_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_invoice_id  ON billing_cycles (invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status      ON billing_cycles (status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_cycle_start ON billing_cycles (cycle_start);

COMMIT;
