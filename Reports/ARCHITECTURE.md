# Architecture

## Overview

AntMeta is a **Next.js 16 App Router** application backed by **Supabase** (PostgreSQL + Auth + Storage + Realtime). It follows a layered architecture with clear separation between the frontend UI, API route handlers, library utilities, and the database.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                        │
│   React 19 + Tailwind CSS v4 + shadcn/ui + Lucide icons        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                     Next.js App Router                          │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐ │
│  │  Page (RSC)   │  │  Page (Client)│  │  API Route Handler  │ │
│  │  /admin/...   │  │  /client/...  │  │  /api/...           │ │
│  └───────┬───────┘  └───────┬───────┘  └──────────┬──────────┘ │
│          │                  │                       │            │
│  ┌───────▼──────────────────▼───────────────────────▼─────────┐ │
│  │                    src/lib/                                 │ │
│  │  supabase/   payments/   types/   validations/  api-helpers│ │
│  └───────────────────────────┬───────────────────────────────┘ │
└──────────────────────────────┼──────────────────────────────────┘
                               │ Supabase JS SDK
┌──────────────────────────────▼──────────────────────────────────┐
│                         Supabase                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ Auth     │  │PostgreSQL│  │ Storage  │  │   Realtime     │ │
│  │ (OTP)    │  │ 17 tables│  │ KYC docs │  │ subscriptions  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    External Services                            │
│  ┌──────────────┐   ┌───────────────┐   ┌────────────────────┐ │
│  │  Razorpay    │   │  DigiLocker   │   │  Delta Exchange    │ │
│  │  (payments)  │   │  (KYC OAuth)  │   │  (trading API)     │ │
│  └──────────────┘   └───────────────┘   └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group — no dashboard layout
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/              # Route group — shared dashboard layout
│   │   ├── layout.tsx            # Sidebar + Topbar wrapper
│   │   ├── admin/                # 24 admin pages
│   │   └── client/               # 8 client pages
│   ├── api/                      # Next.js API route handlers (40+)
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── partners/
│   │   ├── kyc/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── exchange/
│   │   ├── tickets/
│   │   ├── analytics/
│   │   ├── masters/
│   │   ├── plans/
│   │   ├── notifications/
│   │   ├── audit-logs/
│   │   ├── billing-cycles/
│   │   ├── transactions/
│   │   └── users/
│   ├── layout.tsx                # Root layout (providers)
│   └── page.tsx                  # Root redirect
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (18)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (15 more)
│   ├── shared/                   # Platform-specific components (11)
│   │   ├── panel.tsx             # Section card wrapper
│   │   ├── data-table.tsx        # Reusable table
│   │   ├── kpi-card.tsx          # Metric display card
│   │   ├── status-badge.tsx      # Coloured status pill
│   │   ├── modal.tsx             # Dialog wrapper
│   │   ├── filter-bar.tsx        # Filter toolbar
│   │   ├── search-input.tsx      # Search field
│   │   ├── tab-switcher.tsx      # Tab navigation
│   │   ├── alert-box.tsx         # Info/warning alert
│   │   ├── progress-bar.tsx      # Visual progress
│   │   ├── user-avatar.tsx       # Avatar with initials
│   │   └── info-grid.tsx         # 2-column info layout
│   └── layout/
│       ├── sidebar.tsx           # Role-based navigation sidebar
│       ├── topbar.tsx            # Header with user menu
│       └── background-effects.tsx
│
├── hooks/
│   ├── use-auth.ts               # Access AuthContext
│   ├── use-clock.ts              # Real-time clock
│   ├── use-notifications.ts      # Notification state
│   └── use-sidebar.ts            # Sidebar collapsed state
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client + service role client
│   │   ├── middleware.ts         # Session update helper
│   │   ├── types.ts              # Auto-generated DB types (670 lines)
│   │   ├── converters.ts         # DB row → UI type converters + formatters
│   │   ├── realtime-channels.ts  # Realtime channel definitions
│   │   └── index.ts              # Barrel export
│   ├── payments/
│   │   └── razorpay.ts           # createOrder, createPaymentLink, verify signatures
│   ├── types/
│   │   └── index.ts              # Core UI TypeScript interfaces
│   ├── validations/
│   │   └── index.ts              # All Zod schemas
│   ├── constants/
│   │   ├── routes.ts             # Route path constants
│   │   ├── plans.ts              # Plan definitions
│   │   └── screen-titles.ts      # Page title map
│   ├── data/
│   │   └── navigation.ts         # Sidebar nav item definitions
│   └── api-helpers.ts            # Auth helpers + HTTP response factories
│
├── providers/
│   ├── auth-provider.tsx         # Auth state + methods
│   ├── sidebar-provider.tsx      # Sidebar state
│   └── theme-provider.tsx        # next-themes dark/light
│
└── middleware.ts                 # Supabase session refresh on every request
```

---

## Request Lifecycle

### Page Request (Server Component)
```
Browser → Next.js middleware (updateSession) → RSC renders → Supabase query with server client → HTML to browser
```

### API Request
```
Browser fetch → /api/[route]/route.ts
  → getAuthenticatedUser()           # Verify JWT, extract user + role
  → isAdminRole() / role check       # Authorize
  → Zod schema.parse(body)           # Validate input
  → supabase.from('table')...        # Query with anon client (RLS enforced)
  → NextResponse.json(data)          # Return response
```

### Auth Signup Flow
```
/signup form submit
  → auth-provider.signup()
  → supabase.auth.signInWithOtp({ email })   # Send OTP
  → redirect to /verify-otp

/verify-otp OTP submit
  → auth-provider.verifyOtp()
  → supabase.auth.verifyOtp({ email, token, type: 'email' })
  → POST /api/auth/complete-profile  # Create users + clients DB rows
  → redirect to /client/dashboard
```

### Payment Flow
```
/client/invoices → "Pay Now"
  → POST /api/payments/checkout      # createOrder() → Razorpay order
  → Razorpay Checkout JS popup
  → User pays
  → POST /api/payments/verify        # verifyPaymentSignature() → mark invoice paid
  → Razorpay webhook → POST /api/payments/webhook  # async confirmation
```

---

## Authentication & Authorization

### Auth Stack
- **Supabase Auth** manages sessions via `httpOnly` cookies (SSR-safe)
- `src/middleware.ts` calls `updateSession()` on every request to refresh tokens
- `src/lib/supabase/server.ts` exposes `createClient()` (anon) and `createServiceRoleClient()` (admin ops)

### Role Hierarchy
```
super_admin
  └── admin
        └── support
              └── client
```

### Enforcement Points
1. **Database (RLS)** — `supabase/migrations/002_rls_policies.sql` — every table
2. **API routes** — `getAuthenticatedUser()` + `isAdminRole()` / `isAdminOrSupport()`
3. **Frontend** — sidebar items and page content gated by `user.role`

---

## Data Flow: Type System

```
Supabase DB row (snake_case)
  → src/lib/supabase/types.ts  (Tables<'clients'>.Row)
  → src/lib/supabase/converters.ts  (dbClientToClient())
  → src/lib/types/index.ts  (Client interface, camelCase)
  → React component props
```

Formatters in `converters.ts`:
- `formatINR(amount)` — e.g. `₹4.82 Cr`
- `formatPnl(amount)` — e.g. `+₹1.2L` / `-₹45K`
- `formatDate(iso)` — e.g. `Jan 15, 2026`
- `formatRelativeTime(iso)` — e.g. `5m ago`

---

## Shared Component Patterns

### KpiCard
```tsx
<KpiCard
  label="Total AUM"
  value="₹4.82 Cr"
  sub="+11.2% this month"
  color="green"
/>
```

### Panel
```tsx
<Panel title="Recent Invoices" pip="blue" right={<Button>Export</Button>}>
  <DataTable headers={[...]} rows={[...]} />
</Panel>
```

### StatusBadge
```tsx
<StatusBadge variant="ok">Active</StatusBadge>
<StatusBadge variant="bad">Overdue</StatusBadge>
<StatusBadge variant="warn">Pending</StatusBadge>
```

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS enforced via HSTS (2-year, preload) |
| Headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Auth | Supabase JWT in httpOnly cookies |
| Database | RLS on every table, service role only in server-side handlers |
| Input | Zod schemas validate all API inputs |
| Storage | KYC file URLs validated to `*.supabase.co` domain |
| Exchange keys | SHA-256 hashed before storage |
| Webhooks | Razorpay HMAC verified with `timingSafeEqual` |
| Audit | Every significant action logged to `audit_logs` |

---

## Performance Considerations

- **React Server Components** used for all data-heavy admin pages — no client-side fetch waterfall
- **Supabase RLS** evaluated server-side — no app-layer data leakage
- **Indexes** on all FK columns and common filter columns (status, date, kyc_status)
- **Pagination** implemented on all list endpoints via `limit` / `offset` query params
- **Next.js image optimization** — Supabase storage URLs whitelisted in `next.config.ts`
- **CSP** prevents loading of unauthorised third-party scripts
