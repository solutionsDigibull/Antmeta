# AntMeta Platform -- Setup & Development Guide

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| npm | 10+ | Package manager |
| Git | 2.40+ | Version control |

---

## 2. Getting Started

### Clone & Install

```bash
git clone <repository-url>
cd antmeta-nextjs
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root page redirects to `/login`.

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 3. Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server with hot reload |
| `build` | `next build` | Create production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |

---

## 4. Testing the Application

### Admin Login
1. Navigate to `/login`
2. Select "Admin Portal" tab
3. Enter any email (must contain `@`) and password (4+ chars)
4. You'll be redirected to `/admin/dashboard`

### Client Login
1. Navigate to `/login`
2. Select "Client Portal" tab
3. Enter any identifier and password (4+ chars)
4. You'll be redirected to `/client/dashboard`

### Client Signup
1. Navigate to `/signup`
2. Fill in mobile (10 digits), name, optional email, account type, password (8+ chars)
3. Click "Create Account" -> redirected to `/verify-otp`
4. Enter any 6-digit code -> redirected to `/client/dashboard`

### Theme Toggle
- Click the sun/moon icon in the topbar (dashboard) or top-right corner (auth pages)
- Default theme is dark mode

---

## 5. Project Configuration

### TypeScript (`tsconfig.json`)
- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Module resolution: bundler

### Shadcn/UI (`components.json`)
- Style: New York
- Icon library: Lucide
- CSS variables enabled
- Aliases configured for `@/components`, `@/lib`, `@/hooks`

### Next.js (`next.config.ts`)
- Default configuration (no custom options yet)
- Ready for image domains, redirects, headers, etc.

---

## 6. Adding New Pages

### Admin Page

1. Create directory: `src/app/(dashboard)/admin/<page-name>/`
2. Create `page.tsx` with `"use client"` directive
3. Add route to `src/lib/constants/routes.ts`
4. Add title to `src/lib/constants/screen-titles.ts`
5. Add nav item to `ADMIN_NAV` in `src/lib/data/navigation.ts`
6. Add route mapping in `Sidebar` component (`getHref` function)

### Client Page

Same steps but under `src/app/(dashboard)/client/<page-name>/` and use `CLIENT_NAV`.

---

## 7. Adding New Components

### Shared Component (business-specific)

Create in `src/components/shared/`:
```tsx
"use client";

interface MyComponentProps {
  // props
}

export function MyComponent({ ...props }: MyComponentProps) {
  return (
    // JSX using am-* Tailwind classes
  );
}
```

### Shadcn/UI Component

```bash
npx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`.

---

## 8. Styling Guidelines

### Color Usage

| Color | Tailwind Class | Use For |
|-------|---------------|---------|
| Primary (teal-blue) | `bg-am-primary`, `text-am-primary` | Primary actions, links, active states |
| Accent (teal) | `bg-am-accent`, `text-am-accent` | Secondary actions, teal badges |
| Gold | `bg-am-gold`, `text-am-gold` | Warnings, pending states |
| Danger | `bg-am-danger`, `text-am-danger` | Errors, destructive actions, negative P&L |
| Success | `bg-am-success`, `text-am-success` | Success states, positive P&L |
| Purple | `bg-am-purple`, `text-am-purple` | Special accents |

### Background Layers

| Class | Purpose |
|-------|---------|
| `bg-am-bg` | Page background |
| `bg-am-bg-surface` | Sidebar, elevated surfaces |
| `bg-am-bg-card` | Cards, panels (semi-transparent) |
| `bg-am-topbar-bg` | Topbar (blurred) |
| `bg-am-input-bg` | Form inputs |

### Text Hierarchy

| Class | Purpose |
|-------|---------|
| `text-am-text` | Primary text |
| `text-am-text-2` | Secondary text |
| `text-am-text-3` | Tertiary/muted text |
| `text-am-text-4` | Labels |

### Component Patterns

- Use `Panel` for all section containers
- Use `KpiCard` for metric displays
- Use `DataTable` + `Td` for tabular data
- Use `StatusBadge` for status indicators
- Use `Modal` for dialogs
- Use `FilterBar` + `FilterSelect` + `SearchInput` for table controls
- Use `toast()` from Sonner for all action feedback

---

## 9. Environment Variables (Future)

When backend integration begins, these will be needed:

```env
# ============================================================
# Supabase
# ============================================================
# Client-safe (exposed to browser, used with RLS)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=                # Safe for client — RLS enforced

# Server-only (NEVER expose to browser — bypasses all RLS)
SUPABASE_SERVICE_ROLE_KEY=                    # Admin-level access
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

# ============================================================
# Razorpay (https://api.razorpay.com/v1)
# ============================================================
# Server-only (HTTP Basic Auth: key_id as username, key_secret as password)
RAZORPAY_KEY_ID=rzp_test_...                 # Test: rzp_test_*, Live: rzp_live_*
RAZORPAY_KEY_SECRET=                          # Used for API auth + payment signature verification
RAZORPAY_WEBHOOK_SECRET=                      # Set in Dashboard -> Webhooks, used for X-Razorpay-Signature validation

# Client-safe (used in checkout.js on frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...     # Public key for Razorpay Checkout

# ============================================================
# Delta Exchange (https://api.india.delta.exchange/v2)
# ============================================================
# Server-only (used for HMAC-SHA256 signature generation)
DELTA_EXCHANGE_API_KEY=                       # Created at delta.exchange/app/account/manageapikeys
DELTA_EXCHANGE_API_SECRET=                    # Shown only once — store securely
# Testnet: use https://cdn-ind.testnet.deltaex.org with separate testnet keys

# ============================================================
# DigiLocker (https://api.digitallocker.gov.in)
# ============================================================
# Server-only (OAuth 2.0 credentials from partner registration)
DIGILOCKER_CLIENT_ID=                         # App key from DigiLocker partner onboarding
DIGILOCKER_CLIENT_SECRET=                     # App secret from DigiLocker partner onboarding
DIGILOCKER_REDIRECT_URI=                      # Must be pre-registered with DigiLocker

# ============================================================
# PAN Verification (NSDL/Protean OPV or Setu proxy)
# ============================================================
# Option A: Direct NSDL (requires DSC certificate)
# NSDL_USER_ID=
# NSDL_DSC_PATH=                              # Path to .pfx DSC file

# Option B: Setu (recommended — simpler auth, sandbox available)
SETU_CLIENT_ID=
SETU_CLIENT_SECRET=
SETU_PRODUCT_INSTANCE_ID=
# Sandbox: https://dg-sandbox.setu.co | Production: https://dg.setu.co

# ============================================================
# Communication
# ============================================================
RESEND_API_KEY=                               # Transactional email (invoices, KYC status)
TWILIO_ACCOUNT_SID=                           # SMS OTP for Supabase Auth (TRAI DLT registered)
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=                          # Sender number for OTP
MSG91_AUTH_KEY=                                # Alternative SMS for transaction alerts
```

---

## 10. Deployment (Future)

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 11. Claude Code Tooling

This project has extensive Claude Code configuration in `.claude/`:

| Category | Count | Location |
|----------|-------|----------|
| Skills | 17 | `.claude/skills/` |
| Agents | 23 | `.claude/agents/` |
| Commands | 25 | `.claude/commands/` |
| Hooks | 12 | `.claude/settings.local.json` |
| MCPs | 13 | `.mcp.json` |
| Settings | 9 | `.claude/settings.local.json` |

See `.claude/` directory for individual skill/agent/command definitions.
