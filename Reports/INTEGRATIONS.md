# Integrations

---

## 1. Razorpay — Payment Processing

Razorpay handles invoice payments and payment links. All integration code lives in `src/lib/payments/razorpay.ts`.

### Flow

```
1. Admin creates invoice in /admin/invoices
2. Client clicks "Pay Now" on /client/invoices
3. POST /api/payments/checkout
   → createOrder(amount, currency, invoiceId)
   → Razorpay returns order_id
4. Razorpay Checkout JS popup (frontend)
5. Client completes payment
6. POST /api/payments/verify
   → verifyPaymentSignature(orderId, paymentId, signature)
   → invoice marked 'paid' in DB
7. Razorpay webhook → POST /api/payments/webhook (async)
   → verifyWebhookSignature(body, signature)
   → creates transaction record
   → idempotency check prevents double-processing
```

### Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### Functions (`src/lib/payments/razorpay.ts`)

| Function | Description |
|----------|-------------|
| `createOrder(amount, currency, receipt)` | Creates a Razorpay order — returns `{ id, amount, currency }` |
| `createPaymentLink(amount, description, customerEmail, customerName)` | Creates a shareable payment link |
| `verifyPaymentSignature(orderId, paymentId, signature)` | Verifies `order_id + \| + payment_id` HMAC-SHA256 |
| `verifyWebhookSignature(body, signature)` | Verifies webhook body HMAC-SHA256 — uses `timingSafeEqual` |

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `order.paid` | Marks invoice `paid`, stores `razorpay_payment_id`, creates transaction |
| `payment_link.paid` | Same as `order.paid` |
| `refund.processed` | Creates `refund` transaction record |

### Webhook Setup (Production)

1. Razorpay Dashboard → Webhooks → Add new webhook
2. URL: `https://yourdomain.com/api/payments/webhook`
3. Secret: value of `RAZORPAY_WEBHOOK_SECRET`
4. Events: `order.paid`, `payment_link.paid`, `refund.processed`

### Local Testing

```bash
# Install ngrok
npx ngrok http 3000

# Copy https URL → Razorpay Dashboard → Webhooks
# e.g. https://abc123.ngrok.io/api/payments/webhook
```

---

## 2. DigiLocker — KYC Verification

DigiLocker is India's government digital document wallet. Integration provides OAuth-based Aadhaar and other document verification.

### Flow

```
1. Client clicks "Verify with DigiLocker" on /client/profile
2. GET /api/kyc/digilocker/authorize
   → redirects to DigiLocker OAuth authorization URL
3. User logs in to DigiLocker, grants permission
4. DigiLocker redirects to /api/kyc/digilocker/callback?code=...
5. Callback exchanges code for access token
6. Fetches document from DigiLocker API
7. Stores document URL in kyc_documents with digilocker_verified = true
```

### Environment Variables

```env
DIGILOCKER_CLIENT_ID=<from-digilocker-developer-portal>
DIGILOCKER_CLIENT_SECRET=<from-digilocker-developer-portal>
DIGILOCKER_REDIRECT_URI=https://yourdomain.com/api/kyc/digilocker/callback
```

### Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/kyc/digilocker/authorize` | GET | Redirects to DigiLocker OAuth URL |
| `/api/kyc/digilocker/callback` | GET | Handles OAuth callback, stores verified document |

### Status

These endpoints are implemented but require valid DigiLocker developer credentials to test. Register at: [digilocker.gov.in/developers](https://digilocker.gov.in/developers)

### Database Fields

In `kyc_documents`:
- `digilocker_doc_id` — DigiLocker document reference ID
- `digilocker_verified` — `TRUE` if verified via DigiLocker (vs manual upload)

---

## 3. Supabase Auth

Supabase Auth handles user identity with email OTP (one-time password) for signup and password-based login.

### Auth Flow

```
Signup:
  supabase.auth.signInWithOtp({ email, options: { data: { name, account_type } } })
  → OTP email sent
  → /verify-otp page
  → supabase.auth.verifyOtp({ email, token, type: 'email' })
  → POST /api/auth/complete-profile  (creates users + clients DB rows)
  → redirect to dashboard

Login:
  supabase.auth.signInWithPassword({ email, password })
  → session cookie set
  → redirect to dashboard

Logout:
  supabase.auth.signOut()
  → session cleared
  → redirect to /login
```

### SSR Session Handling

- `src/lib/supabase/server.ts` — `createClient()` reads session from cookies
- `src/middleware.ts` — calls `updateSession()` on every request to refresh tokens
- Cookies are `httpOnly`, `Secure`, `SameSite=Lax`

### Two Supabase Clients

| Client | File | Used For |
|--------|------|---------|
| Anon client | `supabase/client.ts`, `supabase/server.ts` | All normal operations (RLS enforced) |
| Service role client | `supabase/server.ts` → `createServiceRoleClient()` | Webhooks, privileged ops (bypasses RLS) |

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) must never be exposed to the browser.

---

## 4. Supabase Storage — KYC Documents

KYC documents are uploaded to Supabase Storage (private bucket).

### Setup

1. Supabase Dashboard → Storage → New bucket
2. Name: `kyc-documents`
3. Public: **No**
4. Add RLS: authenticated users can upload to `kyc-documents/{user_id}/`

### Upload Flow

```
Client selects file on /client/profile
  → upload to Supabase Storage via client-side SDK
  → get public/signed URL
  → POST /api/kyc/{clientId}  { file_url, file_name, document_type }
  → server validates URL is from *.supabase.co (security check)
  → saved to kyc_documents table
```

### Security

The API route `POST /api/kyc/[id]` validates that `file_url` matches the pattern `*.supabase.co` to prevent SSRF via external URLs.

Allowed file types: `pdf`, `jpg`, `jpeg`, `png`, `webp` (enforced in Zod schema).

---

## 5. Supabase Realtime

Supabase Realtime enables live updates via WebSocket subscriptions.

### Channel Definitions

Defined in `src/lib/supabase/realtime-channels.ts`.

| Channel | Table | Events | Used In |
|---------|-------|--------|---------|
| `kyc-updates` | `kyc_documents` | INSERT, UPDATE | Admin KYC queue |
| `ticket-messages` | `ticket_messages` | INSERT | Live chat |
| `notifications` | `notifications` | INSERT | Notification bell |
| `pnl-updates` | `pnl_snapshots` | INSERT | Dashboard chart |

### Current Status

Channel definitions are complete but are not yet consumed in the UI components. To activate, subscribe in relevant pages:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

supabase
  .channel('ticket-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ticket_messages',
    filter: `ticket_id=eq.${ticketId}`,
  }, (payload) => {
    setMessages(prev => [...prev, payload.new])
  })
  .subscribe()
```

---

## 6. Delta Exchange — Trading API

Clients connect their Delta Exchange accounts by providing API keys. These are stored as SHA-256 hashes — the platform never stores raw keys.

### Connection Flow

```
/client/exchange-setup
  → Enter API key + API secret
  → POST /api/exchange
    → hash(apiKey) + hash(apiSecret) via crypto.subtle (SHA-256)
    → upsert into exchange_connections table
  → GET /api/exchange/test
    → retrieve stored hashes
    → attempt Delta Exchange API call (e.g. GET /v2/profile)
    → return connection status
```

### Server IP Whitelist

Clients must whitelist the platform server IP in their Delta Exchange account:
```
13.235.112.48
```

This is displayed on both `/client/exchange-setup` and `/admin/exchange-setup`.

### Admin View

`GET /api/exchange/connections` returns all client connections with status (`connected`, `api-added`, `not-verified`) for the admin health monitor on `/admin/exchange-setup`.

---

## 7. Content Security Policy

The CSP is configured in `next.config.ts` and restricts what resources can be loaded:

| Directive | Allowed Sources |
|-----------|----------------|
| `default-src` | `'self'` |
| `script-src` | `'self'` + Razorpay checkout |
| `connect-src` | `'self'` + Supabase REST + Supabase WebSocket + Razorpay API |
| `frame-src` | Razorpay API + Razorpay checkout |
| `img-src` | `'self'` + data: + blob: + `*.supabase.co` |
| `style-src` | `'self'` + `'unsafe-inline'` + Google Fonts |
| `font-src` | `'self'` + Google Fonts |
