# AntMeta Platform -- Business Logic Reference

## 1. User Roles & Permissions

### Role Hierarchy

| Role | Access Level | Description |
|------|-------------|-------------|
| Super Admin | Full access | Platform owner, can manage all settings, users, and data |
| Admin | Admin portal | Operational staff, can manage clients, KYC, billing |
| Support | Limited admin | Can view tickets, respond to clients, limited data access |
| Client | Client portal | End-user, can view own data only |
| Partner | Extended client | Client + can view referred client aggregate data |

### Portal Access

- **Admin Portal** (`/admin/*`): Super Admin, Admin, Support roles
- **Client Portal** (`/client/*`): Client, Partner roles
- Admin accounts are provisioned internally (no self-registration)
- Client accounts are created via self-signup or admin provisioning

---

## 2. Client Onboarding Flow

### Self-Registration (Client Portal)

```
1. Client visits /signup
2. Fills: Mobile (+91), Name, Email (optional), Account Type, Password
3. Submits -> OTP sent to mobile
4. Enters 6-digit OTP at /verify-otp
5. Account created with status: "pending", KYC: "pending"
6. Client redirected to /client/dashboard
7. Admin assigns subscription plan
8. Client uploads KYC documents
9. Admin reviews and approves/rejects KYC
10. Upon KYC approval + plan assignment -> status: "active"
11. Exchange API keys connected
12. Copy trading begins
```

### Admin-Provisioned (Admin Portal)

```
1. Admin clicks "+ Add Client" on /admin/clients
2. Fills: Name, Mobile, Email, Account Type
3. Selects subscription plan (Standard/Premium/Exclusive)
4. Client account created -> KYC pending
5. Client receives invite via SMS/email
6. Client logs in, uploads KYC documents
7. Same flow from step 9 above
```

---

## 3. KYC Verification

### Verification Methods

| Method | Documents | How It Works | Legal Status |
|--------|-----------|-------------|-------------|
| **DigiLocker** | Aadhaar Card | OAuth 2.0 + PKCE flow. Client authenticates on DigiLocker's hosted page, system pulls UIDAI-signed eAadhaar XML | Legally equivalent to physical original (IT Rules 2016, Rule 9A) |
| **NSDL/Protean OPV** | PAN Card | PAN number + name + DOB submitted, auto-verified against Income Tax database. Response: `pan_status: "E"` (valid), name match `Y`/`N` | Official government verification |
| **Manual Upload** | All other documents | Client uploads file to Supabase Storage (private bucket), admin reviews manually | Requires admin visual verification |

### Document Requirements

| Account Type | Required Documents |
|-------------|-------------------|
| Individual | PAN Card (NSDL auto-verify), Aadhaar Card (DigiLocker preferred, manual upload fallback) |
| Corporate | Incorporation Certificate (manual), Company PAN (NSDL auto-verify), Director PAN + Aadhaar (DigiLocker + NSDL), GST Registration Certificate (manual), AOA & MOA (manual) |

### DigiLocker Verification Flow (Aadhaar)

```
Client clicks "Verify via DigiLocker" on /client/profile
    ↓
Server generates OAuth URL with PKCE challenge (code_challenge_method: S256)
  Redirect to: digilocker.meripehchaan.gov.in/public/oauth2/1/authorize
  Scope: files.issueddocs | req_doctype: ADHAR
    ↓
Client authenticates on DigiLocker's hosted page (Aadhaar + OTP + PIN)
  (If no DigiLocker account, one is auto-created using Aadhaar number)
    ↓
DigiLocker redirects back to /api/kyc/digilocker/callback with authorization code
    ↓
Server exchanges code for access token (POST api.digitallocker.gov.in/public/oauth2/1/token)
    ↓
Server fetches eAadhaar XML (GET /public/oauth2/3/xml/eaadhaar)
  XML contains: name, gender, DOB, address, Base64 photo, UIDAI digital signature
    ↓
Server stores document reference:
  digilocker_doc_id = "in.gov.uidai-ADHAR-{hash}" (URI format)
  digilocker_verified = TRUE
  status = "verified" (auto-verified, no admin review needed)
    ↓
Name from eAadhaar XML cross-matched against client profile for consistency
    ↓
Server revokes DigiLocker session token
```

### PAN Auto-Verification Flow

```
Client enters PAN number on /client/profile
    ↓
Server calls NSDL/Protean OPV API (or Setu proxy):
  POST with { pan, name, dob }
    ↓
Response: pan_status "E" (valid) + name match "Y"/"N" + Aadhaar-PAN seeding status
    ↓
If valid + name matches:
  PAN document status = "verified" (auto-verified)
Else:
  Flag for manual review or re-entry
```

### Document Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending` | Document not yet uploaded/verified | Client must upload or verify via DigiLocker |
| `verified` | Document verified (manually by admin, or auto via DigiLocker/NSDL) | No action needed |
| `rejected` | Document invalid/unreadable | Client re-uploads |

**Note:** The database uses a 3-state model (`pending` → `verified` / `rejected`). Documents not applicable to the account type are simply not created as rows.

### KYC Review Flow

```
Document uploaded by client (or verified via DigiLocker/NSDL)
    ↓
If DigiLocker/NSDL verified:
  Auto-verified (status: "verified", no admin review needed)
    ↓
If manual upload:
  Appears in admin KYC Queue (/admin/kyc-verification)
    ↓
  Admin reviews document:
    ├── Verify -> document status: "verified"
    ├── Reject -> document status: "rejected" + reason
    └── Request re-upload
    ↓
When ALL required docs verified:
  Admin clicks "Fully Approve KYC"
    ↓
  Client KYC status: "verified"
  Client status: "active" (if plan assigned)
```

### KYC Progress Calculation

```
progress = (verified_docs / total_required_docs) * 100
```

Corporate example (TechCorp):
- 5 documents required
- 3 verified, 1 pending (awaiting review), 1 pending (not yet uploaded)
- Progress: 60% (3/5 verified)

---

## 4. Subscription Plans

### Standard Plan
- **Price:** Rs.4,500 per quarter (= 450,000 paise in Razorpay API)
- **Algorithm:** M1 ALPHA only
- **Features:** Basic dashboard, email support, monthly reports, GST invoicing
- **Billing:** Fixed quarterly via Razorpay Checkout (server creates order -> client pays via UPI/card/netbanking)
- **Renewal:** Auto-renewal via Razorpay Subscriptions API (plan + total_count), or manual order per cycle
- **Webhook:** `order.paid` triggers invoice status update to "paid"

### Premium Plan
- **Price:** Rs.9,000 per quarter (= 900,000 paise in Razorpay API)
- **Algorithms:** All 3 (M1 ALPHA + M2 DELTA + M3 SIGMA)
- **Features:** Advanced analytics, priority support, weekly reports, custom alerts
- **Billing:** Fixed quarterly via Razorpay Checkout (same flow as Standard)
- **Renewal:** Auto-renewal via Razorpay Subscriptions API, or manual order per cycle
- **Webhook:** `subscription.charged` for recurring, `order.paid` for one-time

### Exclusive / TraaS (Trading as a Service)
- **Price:** 25% of net profits
- **Algorithms:** Admin-configured (custom strategy)
- **Features:** Dedicated account manager, custom strategy, real-time reports, 24/7 support
- **Billing:** 90-day billing cycles, profit-sharing calculation
- **Payment:** Razorpay Payment Links (`POST /v1/payment_links`) — shareable URL sent via SMS/email, default 6-month expiry
- **Webhook:** `payment_link.paid` triggers invoice status update

### TraaS Billing Cycle

```
Day 1: Cycle starts, starting AUM recorded
    ↓
Day 90: Cycle ends, ending AUM recorded
    ↓
Gross P&L = Ending AUM - Starting AUM
    ↓
If Gross P&L > 0:
  Platform Share = Gross P&L * 25%
  Invoice generated for Platform Share amount
  Payment link sent to client
Else:
  No charge (loss carried forward)
    ↓
New 90-day cycle begins
```

---

## 5. Trading Operations

### Master Accounts

Three proprietary trading algorithms operate on master accounts:

| Master | Strategy | Assets | Risk Profile |
|--------|----------|--------|-------------|
| M1 ALPHA | Momentum/trend-following | BTC/ETH Futures | Conservative |
| M2 DELTA | Options strategies | BTC/ETH Options | Moderate |
| M3 SIGMA | Multi-asset momentum | SOL/ETH Futures | Aggressive |

### Copy Trading Logic (via Delta Exchange API)

Delta Exchange has no built-in copy trading API. The system implements it by placing proportional orders on each client's account.

```
Master Account places a trade on Delta Exchange
    ↓
System detects trade via WebSocket `usertrades` channel (wss://api.india.delta.exchange/v2/ws)
    ↓
System identifies all subscribed clients for that master
    ↓
For each client:
  1. Check exchange_connections.is_active = TRUE
  2. Calculate proportional position size based on client AUM vs master AUM
  3. Place order on client's Delta Exchange account:
     POST /v2/orders { product_symbol, side, size, order_type }
     (Auth: client's API key + HMAC-SHA256 signature + timestamp + User-Agent)
  4. Record trade in `trades` table (symbol: BTCUSD format, no slash)
  5. Update client P&L via /v2/positions/margined
```

**Important constraints:**
- IP whitelisting required on every client API key (server IP must be added)
- Signature expires in **5 seconds** — NTP clock sync critical
- Prices sent as **strings**, sizes as **integers**
- Batch orders available (`POST /v2/orders/batch`, max 50) for efficiency
- Rate limit: 500 operations/sec per symbol, 10,000 weight/5min total

### AUM Monitoring & Alerts

- System monitors total AUM across all clients
- **Alert threshold:** 10% drop in total AUM within 30 days
- When triggered: Red alert banner on admin dashboard
- Alert includes: Previous AUM, current AUM, % drop, contributing algorithm
- Admin can dismiss after acknowledgment

### Performance Metrics

| Metric | Definition |
|--------|-----------|
| Success Rate | % of profitable trades / total trades |
| Total P&L | Cumulative profit/loss across all clients |
| Active Copies | Number of active copy trading connections |
| Trades Today | Number of trades executed in current day |
| Max Drawdown | Largest peak-to-trough decline in portfolio value |
| MTD Return | Month-to-date return as percentage |

---

## 6. Partner Program

### Becoming a Partner

```
Client navigates to /client/become-partner
    ↓
Fills application form
    ↓
Application submitted (status: "review")
    ↓
Admin reviews at /admin/partners
    ↓
Approve -> Partner status: "active"
    ↓
Partner receives unique referral link/code
    ↓
Referred clients linked to partner's account
```

### Partner Revenue Model

Partners earn revenue through TraaS billing of their referred clients:
- When a referred client's TraaS billing cycle generates profit
- Partner receives a commission from the platform's 25% share
- Commission rate varies (negotiated per partner)

### Partner Performance Metrics

| Metric | Description |
|--------|-------------|
| Total Clients | Number of successfully referred clients |
| Total AUM | Combined AUM of all referred clients |
| Total P&L | Aggregate P&L of referred clients |
| Revenue | Total commissions earned |

---

## 7. Invoicing & Payments

### Invoice Types

| Type | Trigger | Amount |
|------|---------|--------|
| Standard | Quarterly renewal | Rs.4,500 |
| Premium | Quarterly renewal | Rs.9,000 |
| Premium TraaS | 90-day cycle end | 25% of profits |
| Exclusive | 90-day cycle end | 25% of profits |

### Invoice Lifecycle

```
Pending -> Paid (Razorpay order.paid / payment_link.paid webhook)
        -> Overdue (if past due_date, set by daily cron check)
        -> Cancelled (admin action)
```

### Invoice Number Format
`INV-YYMM-XXX` (e.g., INV-2602-023)
- YY: Year (26 = 2026)
- MM: Month (02 = February)
- XXX: Sequential number

### GST Handling
- GST applied on all fixed-price invoices
- GST breakdown shown on invoice
- GST-compliant invoicing for Indian tax requirements

### Payment Methods (Planned — via Razorpay)

**Standard/Premium (Razorpay Checkout):**
- UPI (Google Pay, standard UPI, RuPay Credit on UPI)
- Debit/Credit Cards (3DS 2.0, saved cards, CVV-less)
- Netbanking (all major Indian banks)
- Wallets (Amazon Pay, PayPal, Bajaj Pay)
- EMI (credit card, debit card, cardless)
- Pay Later (BNPL)

**TraaS (Razorpay Payment Links):**
- Same methods as above, delivered as a shareable URL
- `notify.sms: true` + `notify.email: true` for automatic delivery
- `reminder_enable: true` for auto payment reminders
- Default expiry: 6 months (configurable via `expire_by` Unix timestamp)

**All amounts in paise** (Razorpay requirement): Rs.1 = 100 paise. Example: Rs.4,500 = `450000`

**Signature verification mandatory** on every payment before updating invoice status:
`HMAC_SHA256(order_id + "|" + payment_id, key_secret) === razorpay_signature`

---

## 8. Support System

### Ticket Priorities

| Priority | SLA (Planned) | Examples |
|----------|--------------|---------|
| High | 4 hours | System outage, trade execution failure, copy trade not activating |
| Medium | 24 hours | Invoice issues, API errors, documentation requests |
| Low | 48 hours | Feature requests, general inquiries |

### Ticket Lifecycle

```
Open -> In Progress -> Resolved -> Closed
```

### Support Channels
- **Tickets:** Async support via /client/support
- **Live Chat:** Real-time support via /admin/live-chat
- **Help Center:** Self-service documentation
- **FAQs:** Common questions and answers
- **User Guidelines:** Platform usage instructions

---

## 9. Security & Audit

### Admin Security
- 2FA (Two-Factor Authentication) for admin accounts
- Login attempts logged for security audit
- Session management with expiry

### Audit Logging
All admin actions are logged:
- Who performed the action
- What action was taken
- What resource was affected
- When it occurred
- IP address

### Data Protection
- PAN and Aadhaar numbers stored encrypted
- Exchange API keys encrypted at rest
- KYC documents stored in secure storage
- Role-based access to sensitive data

---

## 10. Notification Templates

### Template Types

| Channel | Use Cases |
|---------|-----------|
| Email | Welcome, KYC status, invoice, payment confirmation |
| SMS | OTP, trade alerts, payment reminders |
| Push | Trade executions, P&L alerts |
| In-App | All system notifications |

### Key Notifications

| Event | Channels | Recipients |
|-------|----------|-----------|
| Account Created | Email, SMS | Client |
| KYC Approved/Rejected | Email, SMS, In-App | Client |
| Invoice Generated | Email, In-App | Client |
| Payment Received | Email, In-App | Client, Admin |
| Payment Overdue | Email, SMS | Client |
| Trade Executed | Push, In-App | Client |
| AUM Alert | In-App | Admin |
| New Ticket | In-App | Admin |
| Ticket Resolved | Email, In-App | Client |

---

## 11. Client ID Format

Client IDs follow the format: `260116XXXXXX`

| Segment | Value | Meaning |
|---------|-------|---------|
| 26 | Year (2026) | Registration year |
| 01 | Month (January) | Registration month |
| 16 | Day | Registration day |
| XXXXXX | Sequence | Auto-incremented |

Example: `260116100001` = First client registered on 16 Jan 2026
