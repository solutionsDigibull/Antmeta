# AntMeta Platform -- Project Overview

## 1. What is AntMeta?

AntMeta is a **Client Onboarding & Management Platform** for an algorithmic trading business operating in the Indian market. It is designed as a **Progressive Web App (PWA)** that serves two user personas:

- **Admin Portal** -- Internal team managing clients, KYC, subscriptions, trading operations, and analytics
- **Client Portal** -- End-users monitoring their portfolio, P&L, subscriptions, and support

The platform is currently **frontend-complete with mock data**. No backend/API integration exists yet. The UI is finalized and should not be modified without explicit instruction.

---

## 2. Business Domain

### Trading Algorithms (Master Accounts)

| Algorithm | ID | Asset Class | Description |
|-----------|----|-------------|-------------|
| ALPHA Strategy | M1 | BTC/ETH Futures | Primary algorithm, highest success rate (99%) |
| DELTA Strategy | M2 | BTC/ETH Options | Secondary, currently under review (87% success) |
| SIGMA Strategy | M3 | SOL/ETH Futures | Third algorithm, strong performance (98%) |

Clients subscribe to one or more algorithms. Trades are copy-traded from master accounts to client accounts via exchange API integration.

### Subscription Plans

| Plan | Price | Algorithms | Billing |
|------|-------|------------|---------|
| Standard | Rs.4,500/Quarter | M1 ALPHA only | Fixed quarterly |
| Premium | Rs.9,000/Quarter | All 3 (M1+M2+M3) | Fixed quarterly |
| Exclusive/TraaS | 25% of profits | Admin configured | 90-day profit-sharing cycles |

- **Currency:** INR (Indian Rupees)
- **GST:** Applicable on invoices
- **Payment:** Razorpay integration planned

### KYC Verification

Two verification flows based on account type:

**Individual:** PAN Card, Aadhaar Card
**Corporate:** Incorporation Certificate, Company PAN, Director PAN + Aadhaar, GST Certificate, AOA & MOA

KYC status: `pending` -> `verified` or `rejected`

### Partner/Affiliate Program

Partners refer clients and earn revenue share from TraaS billing. Partners are tracked by:
- Number of referred clients
- Total AUM under their referrals
- P&L performance
- Revenue generated

---

## 3. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Component Library | Shadcn/UI (New York style) | Latest |
| Theme | next-themes | 0.4.6 |
| Toast Notifications | Sonner | 2.x |
| Icons | Custom SVG Icon component + Lucide React | - |
| Fonts | Inter (body) + Poppins (headings) | Google Fonts |
| Package Manager | npm | - |

### Planned Integrations (Not Yet Implemented)

| Service | Purpose | Key Details |
|---------|---------|-------------|
| Supabase | Database, auth, realtime, storage | `@supabase/supabase-js`. Phone OTP (Twilio), JWT auth, RLS, `postgres_changes` realtime, Edge Functions (Deno) |
| Razorpay | Payment processing | `razorpay` npm. Orders API + Checkout.js (Standard/Premium), Payment Links (TraaS). UPI, cards, netbanking, wallets, EMI. All amounts in paise. |
| Delta Exchange | Copy trading (crypto derivatives) | REST `api.india.delta.exchange/v2` + WebSocket. HMAC-SHA256 auth, IP whitelist required. Symbols: `BTCUSD`, `ETHUSD` (concatenated). |
| DigiLocker | KYC — Aadhaar verification | OAuth 2.0 + PKCE. Pulls UIDAI-signed eAadhaar XML (legally valid original). Partner registration with MeitY required. |
| NSDL/Protean (or Setu) | KYC — PAN verification | Auto-verify PAN against Income Tax database. Returns validity + name match. |

---

## 4. Project Structure

```
antmeta-nextjs/
├── public/
│   └── am_logo.png              # AntMeta logo
├── src/
│   ├── app/
│   │   ├── globals.css           # CSS variables, theme, Tailwind config
│   │   ├── layout.tsx            # Root layout (providers, fonts)
│   │   ├── page.tsx              # Root redirect -> /login
│   │   ├── (auth)/               # Auth route group
│   │   │   ├── layout.tsx        # Centered card layout + theme toggle
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify-otp/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   └── (dashboard)/          # Dashboard route group
│   │       ├── layout.tsx        # Sidebar + Topbar + Background
│   │       ├── admin/            # 22 admin pages
│   │       │   ├── dashboard/
│   │       │   ├── clients/
│   │       │   ├── kyc-verification/
│   │       │   ├── partners/
│   │       │   ├── exchange-setup/
│   │       │   ├── copy-trading/
│   │       │   ├── plan-management/
│   │       │   ├── billing-cycles/
│   │       │   ├── invoicing/
│   │       │   ├── transaction-logs/
│   │       │   ├── pnl-analytics/
│   │       │   ├── performance-metrics/
│   │       │   ├── partner-performance/
│   │       │   ├── tickets/
│   │       │   ├── live-chat/
│   │       │   ├── help-center/
│   │       │   ├── user-guidelines/
│   │       │   ├── faqs/
│   │       │   ├── user-roles/
│   │       │   ├── admin-security/
│   │       │   ├── audit-logs/
│   │       │   └── notification-templates/
│   │       └── client/           # 8 client pages
│   │           ├── dashboard/
│   │           ├── profile/
│   │           ├── exchange-setup/
│   │           ├── subscription/
│   │           ├── pnl-analytics/
│   │           ├── invoices/
│   │           ├── support/
│   │           └── become-partner/
│   ├── components/
│   │   ├── icons/index.tsx       # Custom SVG icon system
│   │   ├── layout/
│   │   │   ├── sidebar.tsx       # Collapsible navigation sidebar
│   │   │   ├── topbar.tsx        # Header with search, clock, theme
│   │   │   └── background-effects.tsx  # Radial gradient + grid overlay
│   │   ├── shared/               # Reusable business components
│   │   │   ├── alert-box.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── filter-bar.tsx
│   │   │   ├── info-grid.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── panel.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── search-input.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── tab-switcher.tsx
│   │   │   └── user-avatar.tsx
│   │   └── ui/                   # Shadcn/UI primitives
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sonner.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       └── tooltip.tsx
│   ├── hooks/
│   │   ├── use-auth.ts           # Auth context consumer
│   │   ├── use-clock.ts          # IST real-time clock
│   │   └── use-sidebar.ts        # Sidebar state consumer
│   ├── lib/
│   │   ├── utils.ts              # cn() utility (clsx + tailwind-merge)
│   │   ├── constants/
│   │   │   ├── routes.ts         # All route paths
│   │   │   ├── plans.ts          # Subscription plan definitions
│   │   │   └── screen-titles.ts  # Page title mappings
│   │   ├── data/                 # Mock data
│   │   │   ├── clients.ts
│   │   │   ├── invoices.ts
│   │   │   ├── kyc-queue.ts
│   │   │   ├── masters.ts
│   │   │   ├── navigation.ts
│   │   │   ├── partners.ts
│   │   │   └── tickets.ts
│   │   └── types/
│   │       └── index.ts          # All TypeScript interfaces
│   └── providers/
│       ├── auth-provider.tsx     # Mock auth context
│       ├── sidebar-provider.tsx  # Sidebar open/close state
│       └── theme-provider.tsx    # Dark/light mode (next-themes)
├── docs/                         # Business documents (binary formats)
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # 23 agent definitions
│   ├── commands/                 # 25 custom commands
│   ├── hooks/                    # Pre/post tool use hooks
│   ├── skills/                   # 17 skill definitions
│   └── settings.local.json      # Local settings & hook config
├── .mcp.json                     # 13 MCP server configurations
├── components.json               # Shadcn/UI configuration
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 5. Key Architecture Decisions

### Route Groups
- `(auth)` -- Login, signup, OTP verification, password reset. Centered card layout, no sidebar.
- `(dashboard)` -- All admin and client pages. Sidebar + topbar layout.

### Provider Hierarchy
```
ThemeProvider (next-themes, dark mode default)
  └── AuthProvider (user state, login/signup/logout)
      └── SidebarProvider (nav item open state, mobile menu)
          └── TooltipProvider (Radix UI)
              └── {children}
```

### Component Design Pattern
- **Shared components** (`src/components/shared/`) are domain-aware, opinionated components built for this platform: KpiCard, Panel, DataTable, StatusBadge, Modal, etc.
- **UI components** (`src/components/ui/`) are unstyled Shadcn/UI primitives from Radix UI.
- All shared components are client components (`"use client"`).

### Mock Authentication
Auth is entirely client-side with no persistence:
- Admin login: any email + password (4+ chars) -> mock admin user
- Client login: any mobile/email + password -> mock client user
- Signup: validates fields, sends to OTP page, any 6-digit code verifies
- No tokens, sessions, or API calls

### Theming
- CSS custom properties for all colors, defined in `globals.css`
- Light and dark mode with separate color palettes
- `@theme inline` block bridges CSS variables to Tailwind utility classes
- Glassmorphism effects via `backdrop-blur` and semi-transparent backgrounds

---

## 6. Current State & Limitations

| Aspect | Status |
|--------|--------|
| Frontend UI | Complete and finalized |
| Authentication | Mock (context-based, no persistence) |
| Database | None (mock data in TypeScript files) |
| API Routes | None |
| Payment Integration | Not implemented |
| Exchange API Integration | Not implemented |
| Real-time Features | Not implemented |
| Testing | No tests written |
| PWA Features | Not configured |
| Deployment | Not deployed |

---

## 7. Business Documents

The `docs/` folder contains business reference documents in binary formats (not readable as code):

| Document | Format | Content |
|----------|--------|---------|
| ANT Analytics Lead Drivers - 75 Fields | .xlsx | Lead tracking fields |
| Ant Analytics Lead Drivers - Client Info Sheet | .xlsx | Client information schema |
| AntMeta Client CRM document | .docx | CRM workflow and data model |
| AntMeta_AI_Business_Logic_Prompts (v1.0) | .xlsx | Business logic rules (old) |
| AntMeta_Business_Logic_Prompts_v2 | .xlsx | Business logic rules (current) |
| AntMeta_BusinessLogic_ClientReview | .xlsx | Client review business logic |
| AntMeta_Proposal | .pdf | Company proposal document |
| BuLLGTM-Strategy-For-Ant-Analytics | .pdf | Go-to-market strategy |
| Client Onboarding & Management Platform - Scope of Work | .docx | PWA scope of work |
