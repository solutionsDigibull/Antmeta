# Database Reference

AntMeta uses **Supabase** (PostgreSQL) with Row Level Security enabled on all 17 tables. Schema is managed via versioned SQL migration files in `supabase/migrations/`.

---

## Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | All 17 tables, indexes, `updated_at` triggers |
| `002_rls_policies.sql` | RLS enable + policies per role |
| `003_functions.sql` | SQL functions + auth trigger |

Apply order matters — run 001 → 002 → 003.

---

## Tables

### 1. `users`
Core identity table. Primary key is the same UUID as `auth.users`.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `email` | `TEXT` | UNIQUE NOT NULL |
| `phone` | `TEXT` | UNIQUE |
| `name` | `TEXT` | NOT NULL |
| `role` | `TEXT` | NOT NULL, default `'client'`, CHECK IN (`super_admin`, `admin`, `support`, `client`) |
| `account_type` | `TEXT` | NOT NULL, default `'individual'`, CHECK IN (`individual`, `corporate`) |
| `avatar_url` | `TEXT` | nullable |
| `status` | `TEXT` | NOT NULL, default `'active'`, CHECK IN (`active`, `inactive`, `suspended`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default NOW() |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated via trigger |

**Indexes:** `email`, `role`, `status`

---

### 2. `plans`
Subscription plan definitions.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `name` | `TEXT` | NOT NULL |
| `slug` | `TEXT` | UNIQUE NOT NULL |
| `price` | `DECIMAL(12,2)` | nullable (NULL for profit-sharing plans) |
| `billing_type` | `TEXT` | NOT NULL, CHECK IN (`fixed_quarterly`, `profit_sharing`) |
| `profit_share_pct` | `DECIMAL(5,2)` | nullable (e.g. `25.00` for TraaS) |
| `algorithms` | `TEXT[]` | NOT NULL, default `'{}'` |
| `features` | `JSONB` | NOT NULL, default `'[]'` |
| `is_active` | `BOOLEAN` | NOT NULL, default `TRUE` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

**Seed data:**
- Standard — ₹4,500/quarter, `fixed_quarterly`
- Premium — ₹9,000/quarter, `fixed_quarterly`
- Exclusive — 25% profit share, `profit_sharing` (TraaS)

---

### 3. `master_accounts`
Trading master algorithms clients copy-trade from.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` | PK (`'M1'`, `'M2'`, `'M3'`) |
| `name` | `TEXT` | NOT NULL |
| `asset_class` | `TEXT` | NOT NULL (e.g. `'BTC/ETH Futures'`) |
| `status` | `TEXT` | NOT NULL, CHECK IN (`active`, `review`, `inactive`) |
| `success_rate` | `DECIMAL(5,2)` | nullable (percentage) |
| `total_trades` | `INTEGER` | NOT NULL, default `0` |
| `total_pnl` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `total_clients` | `INTEGER` | NOT NULL, default `0` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated |

**Seed data:** M1 ALPHA (99% win rate), M2 DELTA (87%), M3 SIGMA (98%)

---

### 4. `partners`
Affiliate/referral partner accounts.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `users.id` ON DELETE SET NULL |
| `name` | `TEXT` | NOT NULL |
| `total_clients` | `INTEGER` | NOT NULL, default `0` |
| `total_aum` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `total_pnl` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `total_revenue` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `status` | `TEXT` | NOT NULL, default `'review'`, CHECK IN (`active`, `review`, `inactive`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, auto-updated |

---

### 5. `clients`
Client profile linked to a user. Holds plan, KYC status, trading configuration.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `client_id` | `TEXT` | UNIQUE NOT NULL (format: `YYMMDDXXXXXX`) |
| `pan` | `TEXT` | nullable |
| `plan_id` | `UUID` | FK → `plans.id` ON DELETE SET NULL |
| `kyc_status` | `TEXT` | NOT NULL, default `'pending'`, CHECK IN (`pending`, `verified`, `rejected`) |
| `partner_id` | `UUID` | FK → `partners.id` ON DELETE SET NULL |
| `algo_config` | `JSONB` | NOT NULL, default `'{}'` |
| `aum` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `status` | `TEXT` | NOT NULL, default `'pending'`, CHECK IN (`active`, `pending`, `inactive`) |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL, default NOW() |

**Indexes:** `user_id`, `client_id`, `plan_id`, `partner_id`, `kyc_status`, `status`

---

### 6. `kyc_documents`
KYC document submissions. Supports manual upload and DigiLocker.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE CASCADE |
| `document_type` | `TEXT` | NOT NULL (`pan`, `aadhaar`, `gst`, `moa`, etc.) |
| `file_url` | `TEXT` | nullable |
| `file_name` | `TEXT` | nullable |
| `status` | `TEXT` | NOT NULL, default `'pending'`, CHECK IN (`pending`, `verified`, `rejected`) |
| `reviewer_id` | `UUID` | FK → `users.id` ON DELETE SET NULL |
| `reviewer_note` | `TEXT` | nullable |
| `reviewed_at` | `TIMESTAMPTZ` | nullable |
| `uploaded_at` | `TIMESTAMPTZ` | NOT NULL, default NOW() |
| `digilocker_doc_id` | `TEXT` | nullable |
| `digilocker_verified` | `BOOLEAN` | NOT NULL, default `FALSE` |

---

### 7. `invoices`
Billing invoices per client with Razorpay integration fields.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `invoice_number` | `TEXT` | UNIQUE NOT NULL (e.g. `INV-2602-023`) |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE RESTRICT |
| `amount` | `DECIMAL(12,2)` | NOT NULL (pre-GST) |
| `gst_amount` | `DECIMAL(12,2)` | NOT NULL, default `0.00` |
| `total_amount` | `DECIMAL(12,2)` | NOT NULL (amount + gst) |
| `type` | `TEXT` | NOT NULL (`Standard`, `Premium`, `Exclusive`) |
| `status` | `TEXT` | NOT NULL, default `'pending'`, CHECK IN (`pending`, `paid`, `overdue`, `cancelled`) |
| `due_date` | `DATE` | NOT NULL |
| `paid_at` | `TIMESTAMPTZ` | nullable |
| `payment_method` | `TEXT` | nullable |
| `payment_ref` | `TEXT` | nullable |
| `razorpay_order_id` | `TEXT` | nullable |
| `razorpay_payment_id` | `TEXT` | nullable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 8. `transactions`
Financial transaction ledger linked to invoices.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `invoice_id` | `UUID` | FK → `invoices.id` ON DELETE SET NULL |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE RESTRICT |
| `amount` | `DECIMAL(12,2)` | NOT NULL |
| `type` | `TEXT` | NOT NULL, CHECK IN (`payment`, `refund`, `adjustment`) |
| `gateway` | `TEXT` | NOT NULL, default `'razorpay'` |
| `gateway_ref` | `TEXT` | nullable |
| `status` | `TEXT` | NOT NULL, default `'pending'`, CHECK IN (`pending`, `success`, `failed`, `refunded`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 9. `trades`
Individual trade records executed via master accounts on Delta Exchange.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `master_id` | `TEXT` | NOT NULL, FK → `master_accounts.id` |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` |
| `symbol` | `TEXT` | NOT NULL (e.g. `BTCUSDT`, `ETHUSDT`) |
| `side` | `TEXT` | NOT NULL, CHECK IN (`buy`, `sell`) |
| `quantity` | `DECIMAL(20,8)` | NOT NULL |
| `price` | `DECIMAL(20,8)` | NOT NULL |
| `pnl` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `status` | `TEXT` | NOT NULL, default `'open'`, CHECK IN (`open`, `closed`, `cancelled`) |
| `executed_at` | `TIMESTAMPTZ` | NOT NULL, default NOW() |

---

### 10. `pnl_snapshots`
Daily P&L snapshots per client per master account.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE CASCADE |
| `master_id` | `TEXT` | NOT NULL, FK → `master_accounts.id` ON DELETE CASCADE |
| `date` | `DATE` | NOT NULL |
| `daily_pnl` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `cumulative_pnl` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `aum` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `drawdown_pct` | `DECIMAL(6,2)` | NOT NULL, default `0.00` |

**Unique constraint:** `(client_id, master_id, date)`

---

### 11. `tickets`
Support tickets raised by clients.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `ticket_number` | `TEXT` | UNIQUE NOT NULL (e.g. `TKT-001`) |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE RESTRICT |
| `subject` | `TEXT` | NOT NULL |
| `description` | `TEXT` | nullable |
| `priority` | `TEXT` | NOT NULL, default `'medium'`, CHECK IN (`high`, `medium`, `low`) |
| `status` | `TEXT` | NOT NULL, default `'open'`, CHECK IN (`open`, `in_progress`, `resolved`, `closed`) |
| `assigned_to` | `UUID` | FK → `users.id` ON DELETE SET NULL |
| `resolved_at` | `TIMESTAMPTZ` | nullable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 12. `ticket_messages`
Threaded messages within a support ticket.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `ticket_id` | `UUID` | NOT NULL, FK → `tickets.id` ON DELETE CASCADE |
| `sender_id` | `UUID` | NOT NULL, FK → `users.id` ON DELETE RESTRICT |
| `message` | `TEXT` | NOT NULL |
| `is_internal` | `BOOLEAN` | NOT NULL, default `FALSE` (internal admin notes) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 13. `exchange_connections`
Delta Exchange API credentials (hashed — never stored plaintext).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE CASCADE |
| `exchange` | `TEXT` | NOT NULL, default `'delta_exchange'` |
| `api_key_hash` | `TEXT` | NOT NULL (SHA-256 of actual key) |
| `api_secret_hash` | `TEXT` | NOT NULL (SHA-256 of actual secret) |
| `is_active` | `BOOLEAN` | NOT NULL, default `TRUE` |
| `last_verified` | `TIMESTAMPTZ` | nullable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 14. `audit_logs`
Immutable audit trail. No `UPDATE` or `DELETE` policies exist on this table.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `users.id` ON DELETE SET NULL |
| `action` | `TEXT` | NOT NULL (e.g. `kyc.approve`, `invoice.create`) |
| `resource_type` | `TEXT` | NOT NULL (e.g. `kyc_document`, `invoice`) |
| `resource_id` | `TEXT` | nullable |
| `details` | `JSONB` | NOT NULL, default `'{}'` |
| `ip_address` | `INET` | nullable |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 15. `notification_templates`
Reusable message templates for email, SMS, push, and in-app channels.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `name` | `TEXT` | UNIQUE NOT NULL (e.g. `kyc_approved`, `invoice_due`) |
| `channel` | `TEXT` | NOT NULL, CHECK IN (`email`, `sms`, `push`, `in_app`) |
| `subject` | `TEXT` | nullable (email subject) |
| `body_template` | `TEXT` | NOT NULL |
| `variables` | `TEXT[]` | NOT NULL (e.g. `['{{client_name}}', '{{amount}}']`) |
| `is_active` | `BOOLEAN` | NOT NULL, default `TRUE` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 16. `notifications`
Per-user notification inbox.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `template_id` | `UUID` | FK → `notification_templates.id` ON DELETE SET NULL |
| `channel` | `TEXT` | NOT NULL, CHECK IN (`email`, `sms`, `push`, `in_app`) |
| `title` | `TEXT` | NOT NULL |
| `body` | `TEXT` | NOT NULL |
| `data` | `JSONB` | NOT NULL, default `'{}'` |
| `read_at` | `TIMESTAMPTZ` | nullable (NULL = unread) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

### 17. `billing_cycles`
Quarterly billing cycles. Drives TraaS profit-share calculation.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `client_id` | `UUID` | NOT NULL, FK → `clients.id` ON DELETE RESTRICT |
| `cycle_start` | `DATE` | NOT NULL |
| `cycle_end` | `DATE` | NOT NULL |
| `starting_aum` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `ending_aum` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `gross_pnl` | `DECIMAL(15,2)` | NOT NULL, default `0.00` |
| `platform_share` | `DECIMAL(15,2)` | NOT NULL, default `0.00` (25% of gross_pnl) |
| `invoice_id` | `UUID` | FK → `invoices.id` ON DELETE SET NULL |
| `status` | `TEXT` | NOT NULL, default `'open'`, CHECK IN (`open`, `closed`, `invoiced`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL |

---

## SQL Functions

All functions are `SECURITY DEFINER` and defined in `003_functions.sql`.

### `generate_client_id() → TEXT`
Generates a unique client ID in format `YYMMDDXXXXXX`.
- Prefix: current date as `YYMMDD`
- Suffix: sequential 6-digit number starting from `100000`

```sql
SELECT generate_client_id();
-- → '260324100001'
```

---

### `get_dashboard_kpis() → JSON`
Returns aggregate KPIs for the admin dashboard.

```json
{
  "total_clients": 248,
  "active_clients": 184,
  "pending_clients": 64,
  "total_aum": 48200000.00,
  "total_pnl": 1240000.00,
  "pending_kyc": 12,
  "open_tickets": 7,
  "overdue_invoices": 3,
  "total_partners": 4,
  "revenue_mtd": 180000.00
}
```

---

### `get_client_pnl_summary(p_client_id UUID) → JSON`
Returns P&L summary for a specific client.

```json
{
  "total_pnl": 124000.00,
  "mtd_pnl": 18500.00,
  "current_aum": 2500000.00,
  "max_drawdown": 4.20,
  "total_trades": 847
}
```

---

### `calculate_traas_billing(p_cycle_id UUID) → JSON`
Calculates and closes a billing cycle, recording 25% profit share.

```json
{
  "cycle_id": "uuid...",
  "starting_aum": 2000000.00,
  "ending_aum": 2500000.00,
  "gross_pnl": 500000.00,
  "platform_share": 125000.00,
  "billable": true
}
```

Side effects: updates `billing_cycles` row — sets `gross_pnl`, `platform_share`, `status = 'closed'`.

---

### `handle_new_auth_user()` — trigger
Fires `AFTER INSERT ON auth.users`. Auto-creates a row in `public.users` using metadata from the auth signup payload.

---

## RLS Policy Summary

| Table | Client Can Read | Client Can Write | Admin Can Read | Admin Can Write |
|-------|-----------------|-----------------|----------------|-----------------|
| `users` | Own row | Own row | All | All |
| `clients` | Own row | Own row | All | All |
| `plans` | All | — | All | All |
| `master_accounts` | All | — | All | All |
| `partners` | Own (if user linked) | — | All | All |
| `kyc_documents` | Own | Own | All | All (review) |
| `invoices` | Own | — | All | All |
| `transactions` | Own | — | All | All |
| `tickets` | Own | Own | All | All |
| `ticket_messages` | Own ticket | Own ticket | All | All |
| `exchange_connections` | Own | Own | All | — |
| `pnl_snapshots` | Own | — | All | All |
| `trades` | Own | — | All | All |
| `billing_cycles` | Own | — | All | All |
| `notifications` | Own | Own (read_at) | All | All |
| `notification_templates` | Active only | — | All | All |
| `audit_logs` | — | — | All | INSERT only |

> Support role has the same READ access as admin, and can write to `tickets`, `ticket_messages`, and review `kyc_documents`.

---

## Entity Relationship Diagram

```
auth.users ──────────────────── users
                                  │
                    ┌─────────────┤
                    │             │
                  clients ◄───── partners
                    │
        ┌───────────┼───────────────────────┐
        │           │           │           │
  kyc_documents  invoices  tickets  exchange_connections
                    │           │
              transactions  ticket_messages

  pnl_snapshots ───► clients
  pnl_snapshots ───► master_accounts
  trades        ───► master_accounts
  billing_cycles ──► clients
  billing_cycles ──► invoices
  notifications ───► users
  notifications ───► notification_templates
  audit_logs    ───► users
```
