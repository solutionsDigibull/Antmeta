# Setup Guide

Local development setup for the AntMeta platform.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Supabase account | Free tier sufficient |
| Razorpay account | Test mode for development |
| Git | Any recent version |

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd antmeta-nextjs
npm install
```

---

## 2. Supabase Project Setup

### 2a. Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Note your **Project URL** and **anon key** from **Settings → API**

### 2b. Run migrations

The migrations are in `supabase/migrations/`. Apply them in order.

**Option A — Supabase CLI (recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref <project-ref>

# Push all migrations
supabase db push
```

**Option B — SQL Editor (manual)**

Open your Supabase dashboard → SQL Editor, then run each file in order:

```
supabase/migrations/001_initial_schema.sql   # All 17 tables
supabase/migrations/002_rls_policies.sql     # Row Level Security
supabase/migrations/003_functions.sql        # SQL functions + triggers
```

### 2c. Seed development data (optional)

```bash
supabase db seed
# or run supabase/seed.sql in the SQL Editor
```

The seed creates:
- 3 subscription plans (Standard, Premium, Exclusive)
- 3 master accounts (M1 ALPHA, M2 DELTA, M3 SIGMA)
- 12 users (1 admin + 11 clients)
- 4 partners, 7 client records, KYC docs, invoices, tickets

### 2d. Enable Auth providers

In Supabase dashboard → **Authentication → Providers**:
- Email: enabled (with "Confirm email" enabled for OTP flow)

In **Authentication → Email Templates**:
- Confirm signup: customise the OTP email as needed

### 2e. Create Storage bucket for KYC documents

In **Storage → New bucket**:
- Name: `kyc-documents`
- Public: **No** (private)
- Add RLS policy: authenticated users can upload to their own folder

---

## 3. Environment Variables

Create `.env.local` in the project root:

```env
# ─── Supabase ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# ─── Razorpay ────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<razorpay-secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# ─── DigiLocker (optional — KYC) ─────────────────────────────────────────────
DIGILOCKER_CLIENT_ID=<digilocker-client-id>
DIGILOCKER_CLIENT_SECRET=<digilocker-client-secret>
DIGILOCKER_REDIRECT_URI=http://localhost:3000/api/kyc/digilocker/callback

# ─── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to find each value

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key (keep secret!) |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Webhooks → Secret |
| `DIGILOCKER_CLIENT_ID` | DigiLocker developer portal |

---

## 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app will redirect unauthenticated users to `/login`.

---

## 5. Create Your First Admin User

After running seed data, an admin user is included. To create a fresh one:

1. Sign up at `/signup` with any email
2. Verify OTP
3. In Supabase SQL Editor, promote to admin:

```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

---

## 6. Razorpay Webhook (Local Testing)

Razorpay can't reach `localhost` directly. Use **ngrok** or **Cloudflare Tunnel**:

```bash
# Install ngrok
npm install -g ngrok

# Expose local port 3000
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL → Razorpay Dashboard → Webhooks → Add URL:
```
https://xxxx.ngrok.io/api/payments/webhook
```

Events to subscribe:
- `order.paid`
- `payment_link.paid`
- `refund.processed`

---

## 7. Useful Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build (checks TypeScript + Next.js)
npm run start    # Serve production build
npm run lint     # ESLint check
```

---

## 8. Common Issues

### "Missing Supabase environment variables"
The Supabase client falls back to placeholder strings during build. Ensure `.env.local` exists and `NEXT_PUBLIC_SUPABASE_URL` is set before running `npm run dev`.

### RLS blocking queries
If you see empty results or 403 errors, check that:
1. You're passing the auth cookie correctly (the SSR client uses `createServerClient` with cookies)
2. The user's role in `users.role` matches the RLS policy

### OTP not received
Check Supabase → Authentication → Logs. In development, Supabase has a rate limit of 4 OTPs/hour per email.

### Razorpay order creation fails
Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are test-mode keys (`rzp_test_...`). Live keys require a verified Razorpay account.
