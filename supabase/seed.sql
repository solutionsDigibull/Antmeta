-- =============================================================================
-- AntMeta Platform - Seed Data
-- Deterministic UUIDs for FK references. Matches mock data exactly.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
INSERT INTO plans (id, name, slug, price, billing_type, profit_share_pct, algorithms, features) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Standard', 'standard', 4500.00, 'fixed_quarterly', NULL, ARRAY['M1'], '["Basic dashboard", "Email support", "Monthly reports", "GST invoicing"]'::jsonb),
  ('00000000-0000-0000-0000-000000000102', 'Premium', 'premium', 9000.00, 'fixed_quarterly', NULL, ARRAY['M1','M2','M3'], '["Advanced analytics", "Priority support", "Weekly reports", "Custom alerts"]'::jsonb),
  ('00000000-0000-0000-0000-000000000103', 'Exclusive', 'exclusive', NULL, 'profit_sharing', 25.00, ARRAY['M1','M2','M3'], '["Dedicated account manager", "Custom strategy", "Real-time reports", "24/7 support"]'::jsonb);

-- ---------------------------------------------------------------------------
-- Master Accounts
-- ---------------------------------------------------------------------------
INSERT INTO master_accounts (id, name, asset_class, status, success_rate, total_trades, total_pnl, total_clients) VALUES
  ('M1', 'ALPHA Strategy', 'BTC/ETH Futures', 'active', 99.00, 1124, 1420000.00, 112),
  ('M2', 'DELTA Strategy', 'BTC/ETH Options', 'review', 87.00, 487, -380000.00, 54),
  ('M3', 'SIGMA Strategy', 'SOL/ETH Futures', 'active', 98.00, 236, 860000.00, 38);

-- ---------------------------------------------------------------------------
-- Users (admin + clients)
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, phone, name, role, account_type, status) VALUES
  -- Admin user
  ('00000000-0000-0000-0000-000000000001', 'admin@antmeta.in', '+919000000001', 'Raghav S.', 'super_admin', 'individual', 'active'),
  -- Client users
  ('00000000-0000-0000-0000-000000000011', 'rajesh@email.com', '+919876543210', 'Rajesh Kumar', 'client', 'individual', 'active'),
  ('00000000-0000-0000-0000-000000000012', 'finance@techcorp.in', '+919123456789', 'TechCorp Pvt Ltd', 'client', 'corporate', 'active'),
  ('00000000-0000-0000-0000-000000000013', 'priya.m@gmail.com', '+918765432109', 'Priya Menon', 'client', 'individual', 'active'),
  ('00000000-0000-0000-0000-000000000014', 'arun@ventures.co', '+917654321098', 'Arun Ventures LLP', 'client', 'corporate', 'active'),
  ('00000000-0000-0000-0000-000000000015', 'kiran.s@hotmail.com', '+919988776655', 'Kiran Sharma', 'client', 'individual', 'active'),
  -- Partner users
  ('00000000-0000-0000-0000-000000000021', 'info@finedge.com', '+919100000001', 'FinEdge Advisors', 'client', 'corporate', 'active'),
  ('00000000-0000-0000-0000-000000000022', 'contact@wealtharc.com', '+919100000002', 'WealthArc Capital', 'client', 'corporate', 'active'),
  ('00000000-0000-0000-0000-000000000023', 'hello@cryptoedge.in', '+919100000003', 'CryptoEdge Mumbai', 'client', 'corporate', 'active'),
  ('00000000-0000-0000-0000-000000000024', 'team@algotrade.in', '+919100000004', 'AlgoTrade Bangalore', 'client', 'corporate', 'active'),
  -- Extra KYC users
  ('00000000-0000-0000-0000-000000000016', 'preethi@email.com', '+919200000001', 'Preethi Nair', 'client', 'individual', 'active'),
  ('00000000-0000-0000-0000-000000000017', 'contact@sunrise.in', '+919200000002', 'Sunrise Fintech', 'client', 'corporate', 'active');

-- ---------------------------------------------------------------------------
-- Partners
-- ---------------------------------------------------------------------------
INSERT INTO partners (id, user_id, name, total_clients, total_aum, total_pnl, total_revenue, status) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000021', 'FinEdge Advisors', 34, 11200000.00, 840000.00, 210000.00, 'active'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000022', 'WealthArc Capital', 28, 9460000.00, 610000.00, 152000.00, 'active'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000023', 'CryptoEdge Mumbai', 22, 7820000.00, -120000.00, 0.00, 'review'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000024', 'AlgoTrade Bangalore', 18, 6240000.00, 390000.00, 97000.00, 'active');

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
INSERT INTO clients (id, user_id, client_id, pan, plan_id, kyc_status, partner_id, algo_config, aum, status, joined_at) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000011', '260116100001', 'ABCDE1234F', '00000000-0000-0000-0000-000000000101', 'pending', '00000000-0000-0000-0000-000000000201', '{"M1": true}'::jsonb, 420000.00, 'active', '2026-01-15T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000012', '260116100002', 'TCRP1234X', '00000000-0000-0000-0000-000000000102', 'verified', '00000000-0000-0000-0000-000000000202', '{"M1": true, "M2": true, "M3": true}'::jsonb, 1850000.00, 'active', '2026-01-20T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000013', '260116100003', 'PMNM5678G', '00000000-0000-0000-0000-000000000103', 'verified', NULL, '{"M2": true}'::jsonb, 980000.00, 'active', '2026-02-02T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000014', '260116100004', 'AVLL9012H', '00000000-0000-0000-0000-000000000102', 'pending', NULL, '{}'::jsonb, 0.00, 'pending', '2026-02-10T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000015', '260116100005', 'KSRM3456J', '00000000-0000-0000-0000-000000000101', 'rejected', '00000000-0000-0000-0000-000000000204', '{}'::jsonb, 0.00, 'inactive', '2026-02-12T00:00:00Z'),
  -- Extra KYC clients
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000016', 'KYC006', NULL, NULL, 'pending', NULL, '{}'::jsonb, 0.00, 'pending', '2026-02-15T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000017', 'KYC007', NULL, NULL, 'pending', NULL, '{}'::jsonb, 0.00, 'pending', '2026-02-16T00:00:00Z');

-- ---------------------------------------------------------------------------
-- KYC Documents
-- ---------------------------------------------------------------------------
INSERT INTO kyc_documents (id, client_id, document_type, status, uploaded_at) VALUES
  -- Rajesh Kumar: PAN verified, Aadhaar pending
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'pan', 'verified', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', 'aadhaar', 'pending', NOW() - INTERVAL '2 hours'),
  -- Arun Ventures: Cert+Co PAN verified, Dir PAN+GST+MOA pending
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000304', 'incorporation_cert', 'verified', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000304', 'company_pan', 'verified', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000304', 'director_pan', 'pending', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000304', 'gst_cert', 'pending', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000304', 'moa', 'pending', NOW() - INTERVAL '5 hours'),
  -- Preethi Nair: both done
  ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000306', 'pan', 'verified', NOW() - INTERVAL '8 hours'),
  ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000306', 'aadhaar', 'verified', NOW() - INTERVAL '8 hours'),
  -- Sunrise Fintech: all done except MOA
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000307', 'incorporation_cert', 'verified', NOW() - INTERVAL '12 hours'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000307', 'company_pan', 'verified', NOW() - INTERVAL '12 hours'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000307', 'director_pan', 'verified', NOW() - INTERVAL '12 hours'),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000307', 'gst_cert', 'verified', NOW() - INTERVAL '12 hours'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000307', 'moa', 'pending', NOW() - INTERVAL '12 hours');

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
INSERT INTO invoices (id, invoice_number, client_id, amount, gst_amount, total_amount, type, status, due_date, created_at) VALUES
  ('00000000-0000-0000-0000-000000000501', 'INV-2602-023', '00000000-0000-0000-0000-000000000301', 3750.00, 675.00, 4425.00, 'Standard', 'overdue', '2026-02-10', '2026-01-15T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000502', 'INV-2602-024', '00000000-0000-0000-0000-000000000302', 27330.51, 4919.49, 32250.00, 'Premium TraaS', 'pending', '2026-02-28', '2026-02-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000503', 'INV-2602-025', '00000000-0000-0000-0000-000000000303', 7500.00, 1350.00, 8850.00, 'Exclusive', 'paid', '2026-02-15', '2026-02-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000504', 'INV-2602-026', '00000000-0000-0000-0000-000000000304', 10677.97, 1922.03, 12600.00, 'Premium', 'overdue', '2026-02-05', '2026-01-20T00:00:00Z');

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------
INSERT INTO tickets (id, ticket_number, client_id, subject, description, priority, status, created_at) VALUES
  ('00000000-0000-0000-0000-000000000601', 'TKT-001', '00000000-0000-0000-0000-000000000301', 'Copy trade not activating', 'My copy trading setup shows connected but trades are not being copied.', 'high', 'open', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000602', 'TKT-002', '00000000-0000-0000-0000-000000000302', 'GST invoice not downloading', 'Cannot download GST invoice for February billing.', 'medium', 'open', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0000-000000000603', 'TKT-003', '00000000-0000-0000-0000-000000000303', 'API key connection error', 'Getting authentication error when connecting Delta Exchange API keys.', 'high', 'open', NOW() - INTERVAL '8 hours'),
  ('00000000-0000-0000-0000-000000000604', 'TKT-004', '00000000-0000-0000-0000-000000000305', 'KYC document rejected', 'My Aadhaar card scan was rejected. Can you clarify what format is needed?', 'low', 'resolved', NOW() - INTERVAL '1 day');

-- ---------------------------------------------------------------------------
-- PnL Snapshots (sample for active clients)
-- ---------------------------------------------------------------------------
INSERT INTO pnl_snapshots (client_id, master_id, date, daily_pnl, cumulative_pnl, aum, drawdown_pct) VALUES
  ('00000000-0000-0000-0000-000000000301', 'M1', CURRENT_DATE, 2400.00, 38400.00, 420000.00, 1.20),
  ('00000000-0000-0000-0000-000000000302', 'M1', CURRENT_DATE, 8000.00, 62000.00, 1850000.00, 0.80),
  ('00000000-0000-0000-0000-000000000302', 'M2', CURRENT_DATE, -3000.00, -8000.00, 1850000.00, 3.50),
  ('00000000-0000-0000-0000-000000000302', 'M3', CURRENT_DATE, 5000.00, 70000.00, 1850000.00, 0.90),
  ('00000000-0000-0000-0000-000000000303', 'M2', CURRENT_DATE, 4200.00, 84000.00, 980000.00, 1.50);

-- ---------------------------------------------------------------------------
-- Notification Templates
-- ---------------------------------------------------------------------------
INSERT INTO notification_templates (name, channel, subject, body_template, variables) VALUES
  ('kyc_approved', 'in_app', 'KYC Approved', 'Your KYC verification has been approved. You can now start trading.', ARRAY['{{client_name}}']::text[]),
  ('kyc_rejected', 'in_app', 'KYC Rejected', 'Your KYC document {{document_type}} was rejected: {{reason}}', ARRAY['{{client_name}}', '{{document_type}}', '{{reason}}']::text[]),
  ('invoice_generated', 'email', 'New Invoice Generated', 'Invoice {{invoice_number}} for {{amount}} has been generated. Due date: {{due_date}}.', ARRAY['{{client_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}']::text[]),
  ('payment_received', 'in_app', 'Payment Received', 'Payment of {{amount}} received for invoice {{invoice_number}}.', ARRAY['{{client_name}}', '{{amount}}', '{{invoice_number}}']::text[]),
  ('payment_overdue', 'sms', 'Payment Overdue', 'Your invoice {{invoice_number}} of {{amount}} is overdue. Please pay at your earliest.', ARRAY['{{client_name}}', '{{invoice_number}}', '{{amount}}']::text[]),
  ('trade_executed', 'push', 'Trade Executed', '{{side}} {{quantity}} {{symbol}} at {{price}} on {{master_name}}.', ARRAY['{{client_name}}', '{{side}}', '{{quantity}}', '{{symbol}}', '{{price}}', '{{master_name}}']::text[]),
  ('welcome', 'email', 'Welcome to AntMeta', 'Welcome to AntMeta, {{client_name}}! Complete your KYC to start trading.', ARRAY['{{client_name}}']::text[]);

COMMIT;
