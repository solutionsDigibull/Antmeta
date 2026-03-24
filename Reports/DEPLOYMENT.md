# Deployment Guide

Production deployment uses **Vercel** (Next.js) + **Supabase** (managed database + auth + storage).

---

## Prerequisites

- Vercel account
- Supabase project (Production project, not free tier for production workloads)
- Razorpay live account (go-live approval required)
- Domain name (for CSP, HSTS, and DigiLocker redirect URI)

---

## 1. Supabase Production Setup

### 1a. Create a production project

Create a separate Supabase project for production (do not use your dev project). Choose a region geographically close to your users.

### 1b. Run migrations

```bash
# Link to production project
supabase link --project-ref <prod-project-ref>

# Push all migrations
supabase db push
```

Verify in Supabase dashboard → Table Editor that all 17 tables exist.

### 1c. Configure Auth

Dashboard → Authentication → Settings:
- **Site URL:** `https://yourdomain.com`
- **Redirect URLs:** Add `https://yourdomain.com/api/kyc/digilocker/callback`
- **Email templates:** Customise the OTP email with your branding

### 1d. Create KYC Storage Bucket

Dashboard → Storage → New bucket:
- Name: `kyc-documents`
- Public: **No**
- Add RLS policies for authenticated upload

### 1e. Retrieve Keys

Dashboard → Settings → API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon / public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

---

## 2. Razorpay Live Setup

1. Complete Razorpay KYC / business verification to access live mode
2. Dashboard → Settings → API Keys → **Generate Live Key**
3. Copy `Key ID` → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
4. Copy `Key Secret` → `RAZORPAY_KEY_SECRET`
5. Dashboard → Webhooks → Add webhook:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Secret: create a strong random string → `RAZORPAY_WEBHOOK_SECRET`
   - Events: `order.paid`, `payment_link.paid`, `refund.processed`

---

## 3. Vercel Deployment

### 3a. Connect repository

1. Vercel dashboard → New Project → Import Git repository
2. Select the AntMeta repository
3. Framework: **Next.js** (auto-detected)
4. Root directory: `/` (default)

### 3b. Configure environment variables

In Vercel → Project → Settings → Environment Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<prod-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>

RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<live-secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

DIGILOCKER_CLIENT_ID=<digilocker-client-id>
DIGILOCKER_CLIENT_SECRET=<digilocker-client-secret>
DIGILOCKER_REDIRECT_URI=https://yourdomain.com/api/kyc/digilocker/callback

NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Set environment scope: **Production** (and optionally Preview/Development separately).

### 3c. Deploy

```bash
# Manual deploy via Vercel CLI
npm install -g vercel
vercel --prod

# Or push to main branch if auto-deploy is configured
git push origin main
```

### 3d. Custom domain

Vercel → Project → Settings → Domains → Add domain → follow DNS instructions.

---

## 4. Build Configuration

The project uses default Next.js build settings. No custom build commands needed.

**Build command:** `npm run build`
**Output directory:** `.next`
**Install command:** `npm install`
**Node.js version:** 18.x (set in Vercel project settings)

### Build-time environment

`NEXT_PUBLIC_*` variables must be set at **build time** (not just runtime). Vercel inlines them during `next build`. Set them before triggering a deployment.

---

## 5. Security Checklist for Production

| Item | Action |
|------|--------|
| Service role key | Never expose in client bundles. Only in server-side API routes. |
| Razorpay key secret | Never expose. Only in server-side API routes. |
| Webhook secret | Verify every webhook call with HMAC-SHA256. Already implemented. |
| HSTS | Configured in `next.config.ts` — activates once on HTTPS. |
| CSP | Configured in `next.config.ts` — review if adding new third-party services. |
| RLS | Verify RLS is enabled on all tables in Supabase dashboard. |
| Supabase backups | Enable Point-in-Time Recovery (PITR) on the Supabase paid plan. |

---

## 6. Database Migrations in Production

Never apply migrations directly to a production database during business hours. Recommended process:

```bash
# 1. Test migration on staging first
supabase link --project-ref <staging-project-ref>
supabase db push

# 2. Review diff
supabase db diff

# 3. Apply to production during low-traffic window
supabase link --project-ref <prod-project-ref>
supabase db push
```

---

## 7. Monitoring & Observability

### Vercel
- **Deployment logs:** Vercel dashboard → Deployments → select deploy → Logs
- **Function logs:** Vercel dashboard → Functions → select API route
- **Analytics:** Enable Vercel Analytics for Core Web Vitals

### Supabase
- **Database metrics:** Supabase dashboard → Reports
- **Auth logs:** Supabase dashboard → Authentication → Logs
- **API logs:** Supabase dashboard → Logs → API

### Recommended Additions
- **Error tracking:** Sentry (`@sentry/nextjs`) — captures unhandled exceptions
- **Uptime monitoring:** Better Uptime or UptimeRobot for endpoint health checks
- **Alerts:** Razorpay dashboard → Alerts for payment failure spikes

---

## 8. Rollback

### Vercel

```bash
# Via CLI
vercel rollback <deployment-url>

# Via dashboard: Vercel → Deployments → select previous deployment → Promote to Production
```

### Database

If a migration causes issues:
1. Supabase supports point-in-time recovery (paid plans)
2. Write a rollback migration file and apply it

---

## 9. Environment-Specific Config

| Setting | Development | Production |
|---------|-------------|------------|
| Supabase project | Dev project | Separate prod project |
| Razorpay keys | `rzp_test_...` | `rzp_live_...` |
| App URL | `http://localhost:3000` | `https://yourdomain.com` |
| DigiLocker redirect | `http://localhost:3000/api/...` | `https://yourdomain.com/api/...` |
| HSTS | Inactive (HTTP) | Active (HTTPS) |

---

## 10. Vercel Edge / Region Configuration

The platform serves Indian users — set Vercel function region to `bom1` (Mumbai):

In `vercel.json` (create if not present):

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "regions": ["bom1"]
    }
  }
}
```

This reduces latency for Supabase queries (Supabase project should also be in `ap-south-1` / Mumbai).
