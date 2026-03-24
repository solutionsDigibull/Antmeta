# API Reference

All endpoints are under `/api/`. Every request requires a valid Supabase session cookie unless noted otherwise.

**Base URL:** `https://yourdomain.com/api`

**Auth:** Supabase JWT via httpOnly cookie (set at login/OTP verification). Pass via browser automatically or via `Authorization: Bearer <token>` header.

**Common Responses:**

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Not authenticated |
| `403` | Forbidden (insufficient role) |
| `404` | Not found |
| `500` | Server error |

---

## Auth

### `POST /api/auth/complete-profile`

Creates `users` and `clients` DB rows after OTP verification. Idempotent — safe to call multiple times.

**Auth:** Required (session must be valid after OTP)

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "accountType": "individual"
}
```

**Response `200`:**
```json
{ "user": { "id": "uuid", "client_id": "260324100001" } }
```

---

## Clients

### `GET /api/clients`

List all clients. Admin only.

**Auth:** Admin / super_admin

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by `active`, `pending`, `inactive` |
| `kyc_status` | string | Filter by `pending`, `verified`, `rejected` |
| `plan_id` | string | Filter by plan UUID |
| `search` | string | Search by name or email |
| `page` | number | Page number (default: 1) |
| `limit` | number | Per page (default: 20, max: 100) |

**Response `200`:**
```json
{
  "clients": [ { "id": "uuid", "client_id": "260324100001", "name": "...", ... } ],
  "total": 248,
  "page": 1,
  "limit": 20
}
```

---

### `POST /api/clients`

Create a new client. Admin only.

**Auth:** Admin / super_admin

**Body:**
```json
{
  "name": "Jane Corp",
  "email": "jane@corp.com",
  "phone": "+919876543210",
  "accountType": "corporate",
  "pan": "ABCDE1234F",
  "planId": "uuid"
}
```

**Response `201`:**
```json
{ "client": { "id": "uuid", "client_id": "260324100002" } }
```

---

### `GET /api/clients/[id]`

Get a single client by ID.

**Auth:** Admin (any client), or client (own record only)

**Response `200`:**
```json
{
  "client": {
    "id": "uuid",
    "client_id": "260324100001",
    "name": "...",
    "kyc_status": "verified",
    "plan": { "name": "Standard", "price": 4500 },
    "aum": 2500000
  }
}
```

---

### `GET /api/clients/me`

Get the authenticated user's own client record.

**Auth:** Any authenticated client

**Response `200`:**
```json
{ "client": { ... }, "user": { ... } }
```

---

## Users

### `GET /api/users`

List all platform users. Admin only.

**Auth:** Admin / super_admin

**Response `200`:**
```json
{ "users": [ { "id": "uuid", "name": "...", "role": "client", "status": "active" } ] }
```

---

### `PATCH /api/users/profile`

Update the authenticated user's own profile.

**Auth:** Any authenticated user

**Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "phone": "+919876543210",
  "avatar_url": "https://..."
}
```

**Response `200`:**
```json
{ "user": { ... } }
```

---

### `PATCH /api/users/[id]/role`

Change a user's role. Admin only.

**Auth:** Admin / super_admin

**Body:**
```json
{ "role": "support" }
```

Valid roles: `super_admin`, `admin`, `support`, `client`

**Response `200`:**
```json
{ "user": { "id": "uuid", "role": "support" } }
```

---

## Partners

### `GET /api/partners`

List all partners.

**Auth:** Admin / super_admin

**Response `200`:**
```json
{
  "partners": [
    {
      "id": "uuid",
      "name": "FinEdge",
      "total_clients": 34,
      "total_aum": 12000000,
      "total_revenue": 340000,
      "status": "active"
    }
  ]
}
```

---

### `POST /api/partners`

Create a new partner.

**Auth:** Admin / super_admin

**Body:**
```json
{
  "name": "FinEdge Capital",
  "userId": "uuid"
}
```

`userId` is optional — links the partner to an existing user account.

**Response `201`:**
```json
{ "partner": { "id": "uuid", "name": "FinEdge Capital" } }
```

---

### `GET /api/partners/[id]`
### `PATCH /api/partners/[id]`
### `DELETE /api/partners/[id]`

Get, update, or deactivate a partner. Admin only.

**PATCH Body (all optional):**
```json
{
  "name": "Updated Name",
  "status": "active"
}
```

---

## KYC

### `GET /api/kyc/[id]`

Get KYC documents for a client. `[id]` is the client UUID.

**Auth:** Admin / support, or client (own documents)

**Response `200`:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "document_type": "pan",
      "status": "verified",
      "file_url": "https://...",
      "reviewed_at": "2026-01-15T10:00:00Z",
      "reviewer_note": null
    }
  ]
}
```

---

### `POST /api/kyc/[id]`

Upload a KYC document for a client. `[id]` is the client UUID.

**Auth:** Client (own documents only)

**Body:**
```json
{
  "document_type": "pan",
  "file_url": "https://thnwxsbuewjsdqlettni.supabase.co/storage/v1/object/...",
  "file_name": "pan_card.pdf"
}
```

Valid document types: `pan`, `aadhaar`, `gst`, `moa`, `certificate_of_incorporation`, `board_resolution`, `address_proof`

File URL must be a Supabase storage URL.

**Response `201`:**
```json
{ "document": { "id": "uuid", "status": "pending" } }
```

---

### `GET /api/kyc/[id]/review`

Get review details for a KYC document. `[id]` is the **document** UUID.

**Auth:** Admin / support

---

### `PATCH /api/kyc/[id]/review`

Review (approve or reject) a KYC document. `[id]` is the **document** UUID.

**Auth:** Admin / support

**Body:**
```json
{
  "status": "verified",
  "reviewer_note": "Document looks clear"
}
```

Or to reject:
```json
{
  "status": "rejected",
  "reviewer_note": "PAN number does not match records"
}
```

Side effect: if all documents for a client are `verified`, the client's `kyc_status` is auto-updated to `verified`.

**Response `200`:**
```json
{ "document": { "id": "uuid", "status": "verified" } }
```

---

### `GET /api/kyc/queue`

Get all pending KYC submissions for admin review.

**Auth:** Admin / support

**Response `200`:**
```json
{
  "queue": [
    {
      "client_id": "uuid",
      "client_name": "...",
      "account_type": "individual",
      "pending_documents": 2,
      "submitted_at": "2026-01-10T08:00:00Z"
    }
  ]
}
```

---

### `GET /api/kyc/digilocker/authorize`

Redirects the user to DigiLocker OAuth authorization page.

**Auth:** Client

---

### `GET /api/kyc/digilocker/callback`

Handles DigiLocker OAuth callback. Exchanges code for token, fetches document, stores it.

**Auth:** None (OAuth redirect)

---

## Invoices

### `GET /api/invoices`

List invoices. Admins see all; clients see own.

**Auth:** Any authenticated user

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by `pending`, `paid`, `overdue`, `cancelled` |
| `client_id` | string | Filter by client (admin only) |
| `page` | number | Page number |
| `limit` | number | Per page (default: 20) |

**Response `200`:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoice_number": "INV-2602-001",
      "amount": 4500,
      "gst_amount": 810,
      "total_amount": 5310,
      "type": "Standard",
      "status": "pending",
      "due_date": "2026-03-31"
    }
  ],
  "total": 42
}
```

---

### `POST /api/invoices`

Create a new invoice. Admin only.

**Auth:** Admin / super_admin

**Body:**
```json
{
  "client_id": "uuid",
  "amount": 4500,
  "gst_amount": 810,
  "type": "Standard",
  "due_date": "2026-03-31"
}
```

`invoice_number` is auto-generated in format `INV-YYMM-seq`.

**Response `201`:**
```json
{ "invoice": { "id": "uuid", "invoice_number": "INV-2603-042" } }
```

---

### `GET /api/invoices/[id]`
### `PATCH /api/invoices/[id]`

Get or update an invoice. Clients can view own; admins can update any.

**PATCH Body (all optional):**
```json
{
  "status": "paid",
  "payment_method": "razorpay",
  "payment_ref": "pay_xxxxxxxxxxxxx"
}
```

---

### `POST /api/invoices/[id]/send`

Send a Razorpay payment link to the client for this invoice.

**Auth:** Admin / super_admin

**Response `200`:**
```json
{ "payment_link_url": "https://rzp.io/..." }
```

---

## Payments

### `POST /api/payments/checkout`

Create a Razorpay order for an invoice.

**Auth:** Client (own invoice), or admin

**Body:**
```json
{ "invoice_id": "uuid" }
```

**Response `200`:**
```json
{
  "order_id": "order_xxxxxxxxxxxxx",
  "amount": 531000,
  "currency": "INR",
  "razorpay_key": "rzp_test_..."
}
```

Amount is in paise (multiply by 100).

---

### `POST /api/payments/verify`

Verify payment signature after Razorpay checkout completes.

**Auth:** Client

**Body:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_hash"
}
```

**Response `200`:**
```json
{ "success": true, "invoice_id": "uuid" }
```

---

### `POST /api/payments/webhook`

Razorpay webhook handler. Called by Razorpay directly — not from the browser.

**Auth:** None (webhook secret verification via HMAC-SHA256)

**Headers required:**
```
x-razorpay-signature: <hmac-sha256>
```

**Response `200`:**
```json
{ "received": true }
```

---

### `GET /api/payments/link`
### `POST /api/payments/link`

Manage Razorpay payment links.

**POST Body:**
```json
{
  "invoice_id": "uuid",
  "customer_email": "client@example.com",
  "customer_name": "John Doe"
}
```

---

## Exchange

### `GET /api/exchange`

Get the authenticated client's exchange connection status.

**Auth:** Client

**Response `200`:**
```json
{
  "connected": true,
  "exchange": "delta_exchange",
  "last_verified": "2026-03-20T10:00:00Z",
  "is_active": true
}
```

---

### `POST /api/exchange`

Save (or update) Delta Exchange API credentials. Keys are hashed before storage.

**Auth:** Client

**Body:**
```json
{
  "api_key": "live_api_key_here",
  "api_secret": "live_secret_here"
}
```

**Response `200`:**
```json
{ "saved": true }
```

---

### `DELETE /api/exchange`

Deactivate the exchange connection.

**Auth:** Client

**Response `200`:**
```json
{ "deactivated": true }
```

---

### `GET /api/exchange/test`

Test if the stored API credentials can connect to Delta Exchange.

**Auth:** Client

**Response `200`:**
```json
{ "connected": true, "exchange": "delta_exchange" }
```

---

### `GET /api/exchange/connections`

Get all client exchange connections for admin monitoring.

**Auth:** Admin / super_admin

**Response `200`:**
```json
{
  "connections": [
    {
      "client_id": "uuid",
      "client_name": "...",
      "exchange": "delta_exchange",
      "is_active": true,
      "last_verified": "2026-03-20T10:00:00Z",
      "status": "connected"
    }
  ]
}
```

---

## Tickets

### `GET /api/tickets`

List tickets. Clients see own; admins see all.

**Auth:** Any authenticated user

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `open`, `in_progress`, `resolved`, `closed` |
| `priority` | string | `high`, `medium`, `low` |
| `assigned_to` | string | Filter by assignee UUID (admin) |
| `limit` | number | Per page |

**Response `200`:**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "ticket_number": "TKT-001",
      "subject": "Exchange connection issue",
      "priority": "high",
      "status": "open",
      "created_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/tickets`

Create a new support ticket.

**Auth:** Client

**Body:**
```json
{
  "subject": "Cannot connect to Delta Exchange",
  "description": "Getting 401 error when testing API connection.",
  "priority": "high"
}
```

**Response `201`:**
```json
{ "ticket": { "id": "uuid", "ticket_number": "TKT-042" } }
```

---

### `GET /api/tickets/[id]`
### `PATCH /api/tickets/[id]`

Get or update a ticket.

**PATCH Body (admin):**
```json
{
  "status": "resolved",
  "assigned_to": "uuid",
  "priority": "low"
}
```

---

### `GET /api/tickets/[id]/messages`

Get all messages for a ticket.

**Response `200`:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "sender_name": "Support Agent",
      "message": "We're looking into this now.",
      "is_internal": false,
      "created_at": "2026-03-01T11:00:00Z"
    }
  ]
}
```

---

### `POST /api/tickets/[id]/messages`

Send a message on a ticket.

**Auth:** Ticket owner or admin/support

**Body:**
```json
{
  "message": "Please check the IP whitelist.",
  "is_internal": false
}
```

---

## Analytics

### `GET /api/analytics/dashboard`

Admin dashboard KPIs (calls `get_dashboard_kpis()` SQL function).

**Auth:** Admin / super_admin

**Response `200`:**
```json
{
  "total_clients": 248,
  "active_clients": 184,
  "total_aum": 48200000,
  "pending_kyc": 12,
  "open_tickets": 7,
  "overdue_invoices": 3,
  "revenue_mtd": 180000
}
```

---

### `GET /api/analytics/pnl`

P&L analytics. Clients get own data; admins can scope by `client_id`.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `client_id` | string | Client UUID (admin only) |
| `master_id` | string | `M1`, `M2`, or `M3` |
| `period` | string | `30d`, `90d`, `1y` |

**Response `200`:**
```json
{
  "mtd_pnl": 18500,
  "return_mtd": 0.74,
  "max_drawdown": 4.2,
  "portfolio_value": 2518500,
  "snapshots": [
    { "date": "2026-03-01", "daily_pnl": 1200, "cumulative_pnl": 18500 }
  ]
}
```

---

### `GET /api/analytics/performance`

Platform-wide performance metrics.

**Auth:** Admin / super_admin

---

### `GET /api/analytics/partners`

Partner analytics — AUM, revenue, client count per partner.

**Auth:** Admin / super_admin

---

### `GET /api/analytics/aum-trend`

AUM trend data for chart (last 30 days by default).

**Auth:** Admin / super_admin

---

## Masters

### `GET /api/masters`

List all master accounts with performance data.

**Auth:** Any authenticated user

**Response `200`:**
```json
{
  "masters": [
    {
      "id": "M1",
      "name": "M1 ALPHA",
      "asset_class": "BTC/ETH Futures",
      "status": "active",
      "success_rate": 99.0,
      "total_trades": 12400,
      "total_pnl": 8240000,
      "total_clients": 98
    }
  ]
}
```

---

## Plans

### `GET /api/plans`

List all active subscription plans.

**Auth:** Any authenticated user

**Response `200`:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Standard",
      "slug": "standard",
      "price": 4500,
      "billing_type": "fixed_quarterly",
      "features": ["M1 access", "Monthly reports"],
      "algorithms": ["M1"]
    }
  ]
}
```

---

## Transactions

### `GET /api/transactions`

List payment transactions. Clients see own; admins see all.

**Auth:** Any authenticated user

---

## Billing Cycles

### `GET /api/billing-cycles`

List billing cycles. Clients see own; admins see all.

**Auth:** Any authenticated user

---

## Notifications

### `GET /api/notifications`

Get authenticated user's notifications.

**Auth:** Any authenticated user

**Response `200`:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "KYC Approved",
      "body": "Your PAN document has been verified.",
      "read_at": null,
      "created_at": "2026-03-20T09:00:00Z"
    }
  ],
  "unread_count": 3
}
```

---

### `PATCH /api/notifications/[id]`

Mark a notification as read.

**Auth:** Notification owner

**Response `200`:**
```json
{ "notification": { "id": "uuid", "read_at": "2026-03-24T10:00:00Z" } }
```

---

### `GET /api/notification-templates`
### `POST /api/notification-templates`

Manage notification templates. Admin only.

**POST Body:**
```json
{
  "name": "invoice_due",
  "channel": "email",
  "subject": "Invoice Due — {{invoice_number}}",
  "body_template": "Dear {{client_name}}, your invoice {{invoice_number}} of ₹{{amount}} is due on {{due_date}}.",
  "variables": ["{{client_name}}", "{{invoice_number}}", "{{amount}}", "{{due_date}}"]
}
```

---

## Audit Logs

### `GET /api/audit-logs`

List audit trail entries. Admin only.

**Auth:** Admin / super_admin

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `user_id` | string | Filter by actor |
| `action` | string | Filter by action (e.g. `kyc.approve`) |
| `resource_type` | string | Filter by resource |
| `from` | string | ISO date start |
| `to` | string | ISO date end |
| `limit` | number | Per page |

**Response `200`:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "kyc.approve",
      "resource_type": "kyc_document",
      "resource_id": "uuid",
      "details": {},
      "ip_address": "103.x.x.x",
      "created_at": "2026-03-20T09:00:00Z"
    }
  ]
}
```
