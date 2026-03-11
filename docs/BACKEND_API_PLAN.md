# AntMeta Platform -- Backend & API Plan

This document outlines the backend architecture, API design, and database schema planned for the AntMeta platform. The frontend is complete with mock data; this plan defines how to replace mocks with a real backend.

---

## 1. Planned Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Database | Supabase (PostgreSQL) | Real-time subscriptions, built-in auth, RLS policies |
| Authentication | Supabase Auth | Phone OTP (Twilio), email magic link, JWT (1-hr expiry), MFA (TOTP/Phone) |
| API Layer | Next.js API Routes (App Router) | Co-located with frontend, edge-ready |
| Payments | Razorpay (`razorpay` npm) | UPI, cards, netbanking, Payment Links for TraaS. Base: `api.razorpay.com/v1` |
| KYC - Aadhaar | DigiLocker API | OAuth 2.0 + PKCE. UIDAI-signed eAadhaar XML (legally valid under IT Rules 2016) |
| KYC - PAN | NSDL/Protean OPV (or Setu) | PAN auto-verification against Income Tax database |
| Exchange | Delta Exchange API | REST (`api.india.delta.exchange/v2`) + WebSocket. Crypto derivatives copy trading |
| File Storage | Supabase Storage | KYC document uploads (private buckets, RLS, signed URLs, max 5GB) |
| Real-time | Supabase Realtime | `postgres_changes`, `broadcast`, `presence` channels |
| Email/SMS | Twilio + Resend / AWS SES | Twilio for OTP (TRAI DLT required), Resend for transactional email |
| Cron Jobs | Supabase `pg_cron` + `pg_net` + Edge Functions (Deno) | Billing cycles, P&L sync, overdue checks |

---

## 2. Database Schema

### Core Tables

#### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT UNIQUE NOT NULL
phone           TEXT UNIQUE
name            TEXT NOT NULL
role            TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('super_admin', 'admin', 'support', 'client'))
account_type    TEXT NOT NULL DEFAULT 'individual' CHECK (account_type IN ('individual', 'corporate'))
avatar_url      TEXT
status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `clients`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
client_id       TEXT UNIQUE NOT NULL  -- Format: 260116XXXXXX
pan             TEXT
plan_id         UUID REFERENCES plans(id) ON DELETE SET NULL
kyc_status      TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected'))
partner_id      UUID REFERENCES partners(id) ON DELETE SET NULL
algo_config     JSONB NOT NULL DEFAULT '{}'  -- Which algorithms are active
aum             DECIMAL(15,2) NOT NULL DEFAULT 0.00
status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive'))
joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `plans`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL  -- Standard, Premium, Exclusive/TraaS
slug            TEXT UNIQUE NOT NULL
price           DECIMAL(12,2)  -- NULL for TraaS (profit-sharing)
billing_type    TEXT NOT NULL CHECK (billing_type IN ('fixed_quarterly', 'profit_sharing'))
profit_share_pct DECIMAL(5,2)  -- 25% for TraaS
algorithms      TEXT[] NOT NULL DEFAULT '{}'  -- ['M1'] or ['M1','M2','M3']
features        JSONB NOT NULL DEFAULT '[]'
is_active       BOOLEAN NOT NULL DEFAULT TRUE
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `master_accounts`
```sql
id              TEXT PRIMARY KEY  -- M1, M2, M3
name            TEXT NOT NULL  -- ALPHA Strategy, DELTA Strategy, SIGMA Strategy
asset_class     TEXT NOT NULL  -- BTC/ETH Futures, etc.
status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'inactive'))
success_rate    DECIMAL(5,2)
total_trades    INTEGER NOT NULL DEFAULT 0
total_pnl       DECIMAL(15,2) NOT NULL DEFAULT 0.00
total_clients   INTEGER NOT NULL DEFAULT 0
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `partners`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE SET NULL
name            TEXT NOT NULL
total_clients   INTEGER NOT NULL DEFAULT 0
total_aum       DECIMAL(15,2) NOT NULL DEFAULT 0.00
total_pnl       DECIMAL(15,2) NOT NULL DEFAULT 0.00
total_revenue   DECIMAL(15,2) NOT NULL DEFAULT 0.00
status          TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('active', 'review', 'inactive'))
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `kyc_documents`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE
document_type   TEXT NOT NULL  -- pan, aadhaar, incorporation_cert, gst_cert, etc.
file_url        TEXT
file_name       TEXT
status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'))
reviewer_id     UUID REFERENCES users(id) ON DELETE SET NULL
reviewer_note   TEXT
reviewed_at     TIMESTAMPTZ
uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- DigiLocker integration fields
digilocker_doc_id    TEXT       -- DigiLocker document URI (e.g. in.gov.uidai-ADHAR-{hash})
digilocker_verified  BOOLEAN NOT NULL DEFAULT FALSE
```

#### `invoices`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
invoice_number  TEXT UNIQUE NOT NULL  -- Format: INV-YYMM-XXX
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT
amount          DECIMAL(12,2) NOT NULL      -- pre-GST amount
gst_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00
total_amount    DECIMAL(12,2) NOT NULL      -- amount + gst_amount
type            TEXT NOT NULL  -- Standard, Premium, Exclusive, etc.
status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
due_date        DATE NOT NULL
paid_at         TIMESTAMPTZ
payment_method  TEXT           -- razorpay, bank_transfer, etc.
payment_ref     TEXT
-- Razorpay integration
razorpay_order_id   TEXT       -- Razorpay order reference (from POST /v1/orders)
razorpay_payment_id TEXT       -- Razorpay payment reference (from checkout callback)
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `transactions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT
amount          DECIMAL(12,2) NOT NULL
type            TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'adjustment'))
gateway         TEXT NOT NULL DEFAULT 'razorpay'  -- razorpay, bank_transfer
gateway_ref     TEXT           -- Razorpay payment_id or refund_id
status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded'))
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `trades`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
master_id       TEXT NOT NULL REFERENCES master_accounts(id) ON DELETE RESTRICT
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT
-- Delta Exchange symbol format: BTCUSD, ETHUSD, SOLUSD (concatenated, no slash)
symbol          TEXT NOT NULL
side            TEXT NOT NULL CHECK (side IN ('buy', 'sell'))
quantity        DECIMAL(20,8) NOT NULL
price           DECIMAL(20,8) NOT NULL
pnl             DECIMAL(15,2) NOT NULL DEFAULT 0.00
status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled'))
executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `pnl_snapshots`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE
master_id       TEXT NOT NULL REFERENCES master_accounts(id) ON DELETE CASCADE
date            DATE NOT NULL
daily_pnl       DECIMAL(15,2) NOT NULL DEFAULT 0.00
cumulative_pnl  DECIMAL(15,2) NOT NULL DEFAULT 0.00
aum             DECIMAL(15,2) NOT NULL DEFAULT 0.00
drawdown_pct    DECIMAL(6,2) NOT NULL DEFAULT 0.00
UNIQUE(client_id, master_id, date)
```

#### `tickets`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_number   TEXT UNIQUE NOT NULL  -- Format: TKT-XXX
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT
subject         TEXT NOT NULL
description     TEXT
priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'))
status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL
resolved_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `ticket_messages`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE
sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
message         TEXT NOT NULL
is_internal     BOOLEAN NOT NULL DEFAULT FALSE  -- Admin-only notes
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `exchange_connections`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE
exchange        TEXT NOT NULL DEFAULT 'delta_exchange'
api_key_hash    TEXT NOT NULL  -- SHA-256 hash of actual API key
api_secret_hash TEXT NOT NULL  -- SHA-256 hash of actual secret
is_active       BOOLEAN NOT NULL DEFAULT TRUE
last_verified   TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `audit_logs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE SET NULL
action          TEXT NOT NULL           -- e.g. 'kyc.approve', 'invoice.create'
resource_type   TEXT NOT NULL           -- e.g. 'kyc_document', 'invoice'
resource_id     TEXT
details         JSONB NOT NULL DEFAULT '{}'
ip_address      INET
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `notification_templates`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT UNIQUE NOT NULL     -- e.g. 'kyc_approved', 'invoice_due'
channel         TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app'))
subject         TEXT                     -- email subject
body_template   TEXT NOT NULL
variables       TEXT[] NOT NULL DEFAULT '{}'  -- e.g. ['{{client_name}}', '{{amount}}']
is_active       BOOLEAN NOT NULL DEFAULT TRUE
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `notifications`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
template_id     UUID REFERENCES notification_templates(id) ON DELETE SET NULL
channel         TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app'))
title           TEXT NOT NULL
body            TEXT NOT NULL
data            JSONB NOT NULL DEFAULT '{}'
read_at         TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

#### `billing_cycles`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT
cycle_start     DATE NOT NULL
cycle_end       DATE NOT NULL
starting_aum    DECIMAL(15,2) NOT NULL DEFAULT 0.00
ending_aum      DECIMAL(15,2) NOT NULL DEFAULT 0.00
gross_pnl       DECIMAL(15,2) NOT NULL DEFAULT 0.00
platform_share  DECIMAL(15,2) NOT NULL DEFAULT 0.00  -- 25% of gross_pnl for TraaS
invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL
status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'invoiced'))
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

---

## 3. API Routes Design

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Email/phone + password login |
| POST | `/api/auth/signup` | Client registration |
| POST | `/api/auth/verify-otp` | OTP verification |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Set new password |
| POST | `/api/auth/logout` | Session invalidation |
| GET | `/api/auth/session` | Current session info |

### Clients

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/clients` | List all clients (admin, paginated) |
| GET | `/api/clients/:id` | Get client details |
| POST | `/api/clients` | Create new client (admin) |
| PATCH | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Deactivate client |
| GET | `/api/clients/:id/pnl` | Client P&L history |
| GET | `/api/clients/:id/trades` | Client trade history |

### KYC

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/kyc/queue` | Pending KYC reviews (admin) |
| GET | `/api/kyc/:clientId` | KYC documents for client |
| POST | `/api/kyc/:clientId/upload` | Upload KYC document (manual) to Supabase Storage |
| PATCH | `/api/kyc/:documentId/review` | Approve/reject document (admin) |
| PATCH | `/api/kyc/:clientId/finalize` | Final approve/reject KYC (admin) |
| GET | `/api/kyc/digilocker/authorize` | Initiate DigiLocker OAuth + PKCE flow (returns redirect URL) |
| GET | `/api/kyc/digilocker/callback` | DigiLocker OAuth callback (exchanges code for token, fetches eAadhaar) |
| POST | `/api/kyc/verify-pan` | Auto-verify PAN via NSDL/Setu API |

### Plans & Subscriptions

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/plans` | List all plans |
| POST | `/api/plans` | Create plan (admin) |
| PATCH | `/api/plans/:id` | Update plan (admin) |
| GET | `/api/subscriptions/:clientId` | Client's subscription |
| POST | `/api/subscriptions` | Subscribe client to plan |
| PATCH | `/api/subscriptions/:id` | Upgrade/downgrade |
| DELETE | `/api/subscriptions/:id` | Cancel subscription |

### Invoicing & Billing

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/invoices` | List invoices (admin: all, client: own) |
| GET | `/api/invoices/:id` | Invoice details |
| POST | `/api/invoices` | Generate invoice (admin) |
| POST | `/api/invoices/:id/send` | Send Razorpay Payment Link to client (TraaS) |
| POST | `/api/invoices/:id/pay` | Create Razorpay order for checkout (Standard/Premium) |
| POST | `/api/invoices/:id/verify` | Verify Razorpay payment signature after checkout |
| POST | `/api/webhooks/razorpay` | Razorpay webhook handler (order.paid, payment_link.paid, refund.processed) |
| GET | `/api/billing-cycles` | TraaS billing cycles |
| GET | `/api/transactions` | Transaction log |

### Trading

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/masters` | Master account list |
| GET | `/api/masters/:id/performance` | Master account metrics |
| GET | `/api/exchange/status` | Exchange connection status |
| POST | `/api/exchange/connect` | Connect exchange API |
| DELETE | `/api/exchange/:id` | Disconnect exchange |
| GET | `/api/copy-trading/config` | Copy trading settings |
| PATCH | `/api/copy-trading/config` | Update copy trading settings |

### Analytics

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/dashboard` | Admin dashboard KPIs |
| GET | `/api/analytics/aum-trend` | AUM trend data |
| GET | `/api/analytics/pnl` | P&L analytics data |
| GET | `/api/analytics/performance` | Performance metrics |
| GET | `/api/analytics/partners` | Partner performance |

### Partners

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/partners` | List partners (admin) |
| GET | `/api/partners/:id` | Partner details |
| POST | `/api/partners/apply` | Apply to become partner (client) |
| PATCH | `/api/partners/:id` | Update partner status (admin) |

### Support

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tickets` | List tickets |
| GET | `/api/tickets/:id` | Ticket details + messages |
| POST | `/api/tickets` | Create ticket |
| PATCH | `/api/tickets/:id` | Update ticket status |
| POST | `/api/tickets/:id/messages` | Add message to ticket |

### System

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/audit-logs` | Audit log entries (admin) |
| GET | `/api/notifications` | User notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification read |
| GET | `/api/notification-templates` | Template list (admin) |
| POST | `/api/notification-templates` | Create template (admin) |
| GET | `/api/users` | User management (admin) |
| PATCH | `/api/users/:id/role` | Update user role (admin) |

---

## 4. Row-Level Security (RLS) Policies

### Key Principles
1. **Clients** can only read/write their own data
2. **Admins** can read all data, write based on role
3. **Partners** can see aggregated data for their referred clients
4. **Super Admin** has full access

### Example Policies

```sql
-- Use (SELECT auth.uid()) instead of bare auth.uid() for 94-99.9% performance gain
-- Always specify TO authenticated/anon to avoid unnecessary policy evaluation

-- Clients can only see their own client record
CREATE POLICY "clients_own_data" ON clients
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admins can see all clients (check role from JWT app_metadata)
CREATE POLICY "admins_all_clients" ON clients
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );

-- Clients can only see their own invoices
CREATE POLICY "invoices_own_data" ON invoices
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

-- KYC documents: clients upload, admins review
CREATE POLICY "kyc_client_upload" ON kyc_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "kyc_admin_review" ON kyc_documents
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.jwt()->'app_metadata'->>'role') IN ('admin', 'super_admin')
  );
```

---

## 5. Real-time Subscriptions

Uses Supabase Realtime with `postgres_changes` and `broadcast` channel types.

| Channel | Type | Event/Table | Filter | Consumer | Purpose |
|---------|------|-------------|--------|----------|---------|
| `pnl-updates` | `postgres_changes` | INSERT on `pnl_snapshots` | `client_id=eq.{id}` | Client dashboard | Live P&L numbers |
| `trade-feed` | `postgres_changes` | INSERT on `trades` | `client_id=eq.{id}` | Client P&L page | Trade execution notifications |
| `kyc-status` | `postgres_changes` | UPDATE on `kyc_documents` | `client_id=eq.{id}` | Client profile | KYC status changes |
| `ticket-messages` | `postgres_changes` | INSERT on `ticket_messages` | `ticket_id=eq.{id}` | Support chat | Live chat messages |
| `notifications` | `postgres_changes` | INSERT on `notifications` | `user_id=eq.{id}` | All users | Toast/bell notifications |
| `aum-alerts` | `broadcast` | Custom event | — | Admin dashboard | AUM threshold alerts |

**Notes:**
- Filter operators: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in` (max 100 values)
- To receive old record on UPDATE/DELETE: `ALTER TABLE <table> REPLICA IDENTITY FULL;`
- DELETE events cannot be filtered by column
- Use `presence` channel for online admin/client tracking

---

## 6. Background Jobs / Cron

Implemented via Supabase `pg_cron` + `pg_net` extensions invoking Edge Functions (Deno runtime).

| Job | Cron Expression | Description |
|-----|----------------|-------------|
| P&L Sync | `*/5 * * * *` | Fetch latest P&L from Delta Exchange `/v2/positions/margined`, update `pnl_snapshots` |
| Invoice Generation | `0 3 1 1,4,7,10 *` | Generate quarterly invoices for fixed-plan clients (1st of Jan/Apr/Jul/Oct, 3AM UTC) |
| TraaS Billing | Daily check | Check `billing_cycles` for 90-day completion, calculate profit-sharing, generate invoices |
| Overdue Check | `30 3 * * *` | Mark overdue invoices, send reminders (daily 9AM IST = 3:30 UTC) |
| AUM Alert Check | `*/15 * * * *` | Check for >10% AUM drops via Delta Exchange `/v2/wallet/balances`, trigger broadcast alert |
| Exchange Health | `*/30 * * * *` | Verify Delta Exchange connections via `/v2/account/user`, update `last_verified` |
| KYC Reminder | `30 4 * * *` | Remind clients with pending KYC (daily 10AM IST = 4:30 UTC) |

**Cron setup pattern (pg_cron + pg_net):**
```sql
SELECT cron.schedule(
  'pnl-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/sync-pnl',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);
```

---

## 7. Integration Points

### Delta Exchange (Crypto Derivatives Trading)

**Base URLs:**
| Environment | REST | WebSocket |
|---|---|---|
| Production | `https://api.india.delta.exchange` | `wss://api.india.delta.exchange/v2/ws` |
| Testnet | `https://cdn-ind.testnet.deltaex.org` | `wss://cdn-ind.testnet.deltaex.org/v2/ws` |

**Authentication:** HMAC-SHA256 signature. Required headers: `api-key`, `signature`, `timestamp`, `User-Agent` (mandatory — omitting causes 403). Signature validity window: **5 seconds** (clock sync critical).

**Key REST Endpoints (all prefixed `/v2/`):**
| Endpoint | Purpose |
|---|---|
| `POST /v2/orders` | Place order (limit/market/stop) |
| `DELETE /v2/orders` | Cancel order |
| `GET /v2/positions/margined` | All open positions |
| `GET /v2/wallet/balances` | Account balances |
| `GET /v2/orders/history` | Closed/cancelled orders |
| `GET /v2/fills` | Trade execution history |
| `GET /v2/products` | All trading products |
| `POST /v2/orders/batch` | Batch create (max 50 orders) |

**WebSocket Channels:**
| Channel | Type | Purpose |
|---|---|---|
| `v2_ticker` | Public | Real-time price tickers |
| `l2_orderbook` | Public | Level 2 order book |
| `all_trades` | Public | Public trade stream |
| `orders` | Private | Order status updates |
| `positions` | Private | Position changes |
| `usertrades` | Private | Personal trade stream |

**Symbol format:** Concatenated, no slash — `BTCUSD`, `ETHUSD`, `SOLUSD` (not `BTC/USD`).

**Rate limits:** 10,000 weight units per 5-min rolling window. Orders = 5 weight, reads = 3, history = 10, batch = 25. Per-product limit: 500 ops/sec.

**IP whitelisting:** Required for trading-permission API keys. Must whitelist server IP (e.g. `13.235.112.48`).

**Copy trading approach:** No built-in copy trading API. System places proportional orders on client sub-accounts via standard order endpoints. Sub-accounts supported via `/v2/account/subaccounts` + `/v2/wallet/transfer`.

**Order types:** `limit_order`, `market_order`, stop-loss (via `stop_order_type`), bracket orders (TP + SL pair via `/v2/orders/bracket`). Time-in-force: `gtc`, `ioc`. Supports `post_only`, `reduce_only`, trailing stops.

**Data format:** Prices are **strings** (preserve precision), sizes are **integers**, timestamps in ISO 8601 (responses) / Unix seconds (auth headers). Pagination is cursor-based.

### Razorpay (Payment Gateway)

**Base URL:** `https://api.razorpay.com/v1`
**Auth:** HTTP Basic Auth (`key_id` as username, `key_secret` as password). All API calls server-side only (CORS blocked on frontend).

**npm package:** `razorpay` — `npm i razorpay`

**Key Endpoints:**
| Endpoint | Purpose |
|---|---|
| `POST /v1/orders` | Create order (required before every payment) |
| `POST /v1/payments/:id/capture` | Capture authorized payment |
| `POST /v1/payments/:id/refund` | Refund payment |
| `POST /v1/payment_links` | Create shareable payment link (for TraaS invoices) |
| `POST /v1/subscriptions` | Create recurring subscription |
| `GET /v1/payments/:id` | Fetch payment details |

**Payment flow (Standard/Premium subscriptions):**
1. Server creates order via `POST /v1/orders` (amount in **paise**: Rs.4,500 = 450000)
2. Frontend loads `checkout.razorpay.com/v1/checkout.js` with `order_id`
3. Client pays via UPI/card/netbanking
4. Frontend receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
5. Server verifies signature: `HMAC_SHA256(order_id + "|" + payment_id, key_secret)`
6. On match, capture payment and update invoice

**Payment flow (TraaS — Payment Links):**
1. Server creates payment link via `POST /v1/payment_links` with invoice amount
2. Link sent to client via SMS/email (`notify.sms: true`, `notify.email: true`)
3. Client pays at the link URL (default expiry: 6 months)
4. Webhook `payment_link.paid` fires on completion

**Supported payment methods (India):**
UPI (Google Pay, standard UPI, RuPay Credit on UPI), debit/credit cards (3DS 2.0), netbanking (all major banks), wallets (Amazon Pay, PayPal, Bajaj Pay), EMI (credit card, debit card, cardless), Pay Later (BNPL), bank transfer

**Key webhook events:**
| Event | When |
|---|---|
| `payment.authorized` | Payment authorized, not yet captured |
| `payment.captured` | Payment captured successfully |
| `payment.failed` | Payment failed |
| `order.paid` | Order fully paid (contains order + payment entities — preferred) |
| `refund.processed` | Refund completed |
| `subscription.charged` | Recurring subscription charge succeeded |
| `subscription.halted` | All retries exhausted, manual intervention needed |
| `payment_link.paid` | Payment link paid (for TraaS) |

**Webhook verification:** `X-Razorpay-Signature` header = HMAC-SHA256 hex digest of raw body using webhook secret. Must verify against **raw** (unparsed) request body.

**Important constraints:**
- All amounts in **paise** (smallest subunit) — Rs.1 = 100 paise
- Orders are mandatory — payments without `order_id` are auto-refunded
- Signature verification is mandatory before fulfilling any order
- `notes` field: max 15 key-value pairs, 256 chars per value
- Test keys prefixed `rzp_test_`, live keys `rzp_live_`

### DigiLocker (KYC — Aadhaar Verification)

**Auth flow:** OAuth 2.0 Authorization Code + PKCE (code_challenge_method: `S256` only).

**Base URLs:**
| Purpose | URL |
|---|---|
| OAuth authorization | `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize` |
| Token + API | `https://api.digitallocker.gov.in` |

**KYC verification flow:**
1. Client clicks "Verify via DigiLocker" — redirect to DigiLocker with `client_id`, `redirect_uri`, `scope=files.issueddocs`, PKCE challenge
2. Client authenticates with Aadhaar + OTP + PIN on DigiLocker's hosted page
3. DigiLocker redirects back with authorization `code`
4. Server exchanges code for access token (`POST /public/oauth2/1/token`)
5. Server fetches issued documents list (`GET /public/oauth2/1/files/issued`)
6. Server downloads eAadhaar XML (`GET /public/oauth2/3/xml/eaadhaar`) — **UIDAI digitally signed**, legally equivalent to physical original
7. Store `digilocker_doc_id` (URI format: `in.gov.uidai-ADHAR-{hash}`) and set `digilocker_verified = TRUE`
8. Cross-match name from eAadhaar XML against client profile

**Document URI format:** `{orgId}-{docType}-{documentIdentifier}` (e.g., `in.gov.uidai-ADHAR-e4b8736fd30e54d61b5780e8077b5b60`)

**Key document type codes:** `ADHAR` (Aadhaar), `PANCR` (PAN), `DRVLC` (Driving License)

**Sandbox:** NOT publicly available — gated behind formal partner registration with MeitY. Third-party providers (Setu, Decentro) offer sandbox wrappers for faster development.

**Partner registration:** Required — formal application at `digilocker.gov.in/web/partners/requesters`. Needs official domain email, CIN/GSTIN/PAN, signed T&C on company letterhead, detailed use case. Committee review (weeks to months).

### NSDL/Protean PAN Verification (KYC — PAN Auto-Verify)

**Endpoint:** `POST https://opvapi.egov-nsdl.com/TIN/PanInquiryAPIBackEnd` (production)
**Auth:** Digital Signature Certificate (DSC) in PKCS#7 format — entity registration with Protean required.

**Request:** JSON with `pan`, `name`, `dob` fields (batch: 1–5 PANs per call).
**Response:** `pan_status: "E"` (valid), name match `Y`/`N`, Aadhaar-PAN seeding status.

**Alternative (recommended for faster integration):** Third-party providers like **Setu** (`POST https://dg.setu.co/api/verify/pan`) — simpler auth (client_id/secret), no DSC required, sandbox available.

### Supabase (Database, Auth, Realtime, Storage)

**SDK:** `@supabase/supabase-js`

**Auth details:**
- Phone OTP: `signInWithOtp({ phone })` + `verifyOtp({ phone, token, type: 'sms' })` — 6-digit code, 1-hour validity, 60-sec rate limit per number
- SMS via Twilio (TRAI DLT registration required for India)
- JWT expiry: 1 hour default. `getUser()` for server-side validation (never trust `getSession()` for auth checks)
- MFA: TOTP + Phone factors supported. JWT `aal` claim: `aal1` (password/OTP), `aal2` (2FA verified)
- Sign-out scopes: `global` (all sessions), `local` (current), `others` (all except current)

**RLS best practices:**
- Always use `(SELECT auth.uid())` (not bare `auth.uid()`) for function caching — **94–99.9% performance improvement**
- Always specify `TO authenticated` or `TO anon` on policies
- Index columns used in `USING` clauses
- Admin check: `auth.jwt()->'app_metadata'->>'role' = 'admin'`

**Realtime channel types:**
- `postgres_changes` — listen to INSERT/UPDATE/DELETE on tables (filter: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `in`)
- `broadcast` — low-latency client-to-client (cursor sharing, notifications)
- `presence` — online status tracking (events: `sync`, `join`, `leave`)

**Storage:** Private buckets with RLS on `storage.objects`. Max upload: 5GB (resumable TUS for >6MB). Signed URLs for KYC document access. Image transforms on Pro plan.

**Edge Functions:** Deno runtime. Scheduled via `pg_cron` + `pg_net`. Auto-injected secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`.

**Migrations CLI:**
```bash
supabase migration new <name>   # create timestamped .sql file
supabase db reset               # apply all migrations locally
supabase db push                # push to remote
supabase db pull                # pull remote schema
```

### Communication
- **Twilio** -- SMS OTP for Supabase Auth (TRAI DLT registration required for India), WhatsApp delivery option
- **MSG91** -- Alternative SMS provider for transaction alerts
- **Resend / AWS SES** -- Email invoices, KYC status, newsletters
- **Web Push** -- Browser notifications for trade executions

---

## 8. Security Considerations

| Concern | Approach |
|---------|----------|
| Exchange API Keys | Encrypt at rest (AES-256). SHA-256 hashes stored in `exchange_connections`. Delta Exchange requires IP whitelisting on their end. |
| Authentication | Supabase Auth: JWT (1-hour expiry), single-use refresh tokens (10-sec reuse window). Use `getUser()` server-side, never trust `getSession()`. |
| Authorization | RLS policies with `(SELECT auth.uid())` caching + `TO authenticated` scoping. Role check via `auth.jwt()->'app_metadata'->>'role'`. |
| Rate Limiting | Next.js middleware rate limiter per IP/user. Delta Exchange: 10,000 weight/5min. Razorpay: respect HTTP 429. |
| Input Validation | Zod schemas on all API routes |
| Payment Security | Razorpay signature verification (HMAC-SHA256) mandatory on every payment. Raw body for webhook validation. Never expose `RAZORPAY_KEY_SECRET` to client. |
| CSRF | SameSite cookies + CSRF tokens |
| PAN/Aadhaar PII | Encrypted storage, masked display, audit log access. DigiLocker eAadhaar XML is UIDAI-signed (legally equivalent to physical original under IT Rules 2016, Rule 9A). |
| 2FA | Supabase MFA: TOTP + Phone factors. JWT `aal` claim: `aal1` (password/OTP), `aal2` (2FA verified). Enforce `aal2` in admin RLS policies. |
| Audit Trail | All admin actions logged to `audit_logs` table |
| DigiLocker | OAuth 2.0 + PKCE (S256). User always redirected to DigiLocker's own hosted page — consent cannot be bypassed. |

---

## 9. Migration Strategy (Mock -> Real)

### Phase 1: Auth & Database
1. Set up Supabase project, install `@supabase/supabase-js`
2. Run `supabase/migrations/001_initial_schema.sql` via `supabase db push`
3. Configure Supabase Auth: phone OTP via Twilio (TRAI DLT registered), email magic link
4. Replace `AuthProvider` mock with `supabase.auth.signInWithOtp()` / `verifyOtp()`
5. Add Next.js middleware for route protection using `supabase.auth.getUser()`
6. Configure MFA (TOTP) for admin accounts, enforce `aal2` in admin RLS policies
7. Create `AFTER INSERT ON auth.users` trigger to auto-populate `users` table

### Phase 2: Core Data & CRUD
1. Seed database with mock data from `src/lib/data/*.ts`
2. Replace mock imports with `supabase.from('table').select()` queries
3. Add loading states and error handling to pages
4. Implement API routes for clients, KYC, invoices, plans
5. Connect modals and forms to real API calls
6. Add optimistic updates with `revalidatePath()`

### Phase 3: KYC Integration
1. Register as DigiLocker Authorized Partner (or integrate via Setu/Decentro for faster development)
2. Implement OAuth 2.0 + PKCE flow for DigiLocker Aadhaar verification
3. Integrate NSDL PAN verification (direct with DSC, or via Setu `POST /api/verify/pan`)
4. Store `digilocker_doc_id` + `digilocker_verified` on auto-verification
5. Manual upload path: Supabase Storage private bucket with RLS scoped to `auth.uid()` folder
6. Admin review queue reads from `kyc_documents` where `status = 'pending'` and `digilocker_verified = FALSE`

### Phase 4: Payments
1. Set up Razorpay account, obtain `rzp_test_` keys for development
2. Install `razorpay` npm package, initialize with `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
3. Fixed plans: Create Razorpay orders (`POST /v1/orders`, amount in paise), integrate `checkout.js` on frontend
4. TraaS: Generate Razorpay Payment Links (`POST /v1/payment_links`) with `notify.sms: true`
5. Implement webhook handler at `/api/webhooks/razorpay` — verify `X-Razorpay-Signature` against raw body
6. Handle events: `order.paid` (preferred over `payment.captured`), `payment_link.paid`, `refund.processed`
7. Store `razorpay_order_id` + `razorpay_payment_id` on `invoices` table, update status
8. Optional: Razorpay Subscriptions API for auto-recurring Standard/Premium billing

### Phase 5: Trading
1. Generate Delta Exchange API keys with Trading permission, whitelist server IP
2. Implement signature generation: `HMAC_SHA256(METHOD + TIMESTAMP + PATH + QUERY + BODY, secret)`
3. Ensure server clock is NTP-synced (signature validity window: 5 seconds)
4. Include mandatory `User-Agent` header on all requests
5. Implement order placement via `POST /v2/orders` for copy trading
6. Set up WebSocket connection to `wss://api.india.delta.exchange/v2/ws` for `positions` + `orders` channels
7. Set up P&L sync cron via `pg_cron` + Edge Function calling `/v2/positions/margined` + `/v2/wallet/balances`
8. Use testnet (`cdn-ind.testnet.deltaex.org`) during development

### Phase 6: Real-time & Notifications
1. Configure Supabase Realtime `postgres_changes` channels for P&L, trades, KYC, tickets, notifications
2. Use `broadcast` channel for AUM alert events
3. Use `presence` channel for online admin tracking in live chat
4. Set up `pg_cron` jobs for scheduled Edge Functions (invoice generation, overdue checks, KYC reminders)
5. Implement email notifications via Resend/SES, SMS via Twilio/MSG91
6. Add Web Push notifications for trade executions
