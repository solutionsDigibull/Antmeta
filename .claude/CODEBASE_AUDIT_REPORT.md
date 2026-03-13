# AntMeta Platform - Codebase Audit Report

**Date:** 2026-03-11
**Auditor:** Claude Code (Opus 4.6)
**Scope:** Full codebase review - 124 files across 9 categories
**Branch:** master (commit 7f86958)

---

## 1. EXECUTIVE SUMMARY

AntMeta is an algorithmic trading client onboarding and management platform built with Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, and Supabase. The platform features a dual-portal architecture (Admin with 22 pages, Client with 8 pages) and 34 backend API routes.

### Current State
- **Frontend:** Complete with polished UI, dark/light theme, glassmorphism design
- **Backend:** 34 API routes implemented with Supabase integration
- **Data:** All pages use hardcoded mock data with optional API fallback
- **Integrations:** Supabase Auth, Razorpay payments, DigiLocker KYC (all partially implemented)

### Risk Assessment

| Priority | Count | Category |
|----------|-------|----------|
| P0 Critical | 4 | Security vulnerabilities requiring immediate fix |
| P1 High | 15+ | Data integrity, race conditions, missing validation |
| P2 Medium | 20+ | Error handling, authorization gaps, query performance |
| P3 Low | 30+ | UX issues, accessibility, unbound forms |
| P4 Patterns | 100+ | Mock data, toast-only actions across all 30 pages |

---

## 2. TECHNOLOGY STACK ANALYSIS

### 2.1 Dependencies (package.json)

**Production Dependencies:**
| Package | Version | Status |
|---------|---------|--------|
| next | 16.1.6 | Current |
| react / react-dom | 19.2.3 | Current |
| @supabase/supabase-js | ^2.99.0 | Current |
| @supabase/ssr | ^0.9.0 | Current |
| radix-ui | ^1.4.3 | Current (shadcn primitives) |
| zod | ^4.3.6 | Current |
| lucide-react | ^0.575.0 | Current |
| sonner | ^2.0.7 | Current |
| next-themes | ^0.4.6 | Current |
| tailwind-merge | ^3.5.0 | Current |
| clsx | ^2.1.1 | Current |
| class-variance-authority | ^0.7.1 | Current |

**Missing Dependencies:**
| Package | Purpose | Impact |
|---------|---------|--------|
| razorpay | Payment SDK | Currently using raw fetch() - fragile, untyped responses |
| vitest/jest | Testing | Zero test coverage - no test framework installed |
| recharts/chart.js | Charts | All charts manually built with SVG - hard to maintain |
| @tanstack/react-query | Data fetching | No caching, no deduplication, manual useEffect patterns |

### 2.2 Configuration Files

**next.config.ts** - Properly configured with:
- Supabase image remote patterns
- Security headers on API routes (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Missing: Content-Security-Policy header, CORS configuration

**tsconfig.json** - Strict mode enabled, bundler resolution, `@/*` path alias

**eslint.config.mjs** - Core Web Vitals + TypeScript rules active

**globals.css** - Comprehensive CSS variable system with 30+ custom properties, light/dark themes, shadcn overrides, scrollbar styling

---

## 3. ARCHITECTURE OVERVIEW

### 3.1 Directory Structure

```
src/
  app/
    (auth)/          # 4 auth pages + layout
    (dashboard)/
      admin/         # 22 admin pages
      client/        # 8 client pages
      layout.tsx     # Dashboard shell (sidebar + topbar)
    api/             # 34 API route handlers
    layout.tsx       # Root layout (providers)
    page.tsx         # Redirect to /login
    globals.css      # Theme variables
  components/
    icons/           # Custom SVG icon library (23 icons)
    layout/          # Sidebar, Topbar, BackgroundEffects
    shared/          # 12 reusable components
    ui/              # 16 shadcn/ui primitives
  hooks/             # 4 custom hooks
  lib/
    constants/       # Routes, plans, screen titles
    data/            # 6 mock data files
    payments/        # Razorpay integration
    supabase/        # 7 Supabase modules
    types/           # TypeScript interfaces
    validations/     # Zod schemas
  providers/         # Auth, Theme, Sidebar
  middleware.ts      # Supabase session + route protection
```

### 3.2 Provider Architecture

```
<html>
  <body>
    <ThemeProvider>          # next-themes (class-based, dark default)
      <AuthProvider>         # Supabase Auth state management
        <SidebarProvider>    # Nav expansion + mobile menu
          <TooltipProvider>  # Radix tooltip context
            {children}
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
      <Toaster />            # Sonner toast notifications
    </ThemeProvider>
  </body>
</html>
```

### 3.3 Route Protection Flow

```
Request → middleware.ts → updateSession()
  ├── Refresh Supabase session cookies
  ├── Auth pages (/login, /signup, etc.)
  │   └── If authenticated → redirect to dashboard
  ├── Admin routes (/admin/*)
  │   └── If not admin role → redirect to client dashboard
  ├── Protected routes
  │   └── If not authenticated → redirect to login
  └── Pass through
```

### 3.4 Data Flow Pattern (Current)

```
Page Component (use client)
  ├── useState() with hardcoded mock data as initial value
  ├── useEffect() → fetch("/api/endpoint")
  │   ├── Success → setState(apiData)
  │   └── Failure → .catch(() => {}) // silent, keeps mock data
  ├── Render with data (mock or API)
  └── Actions → toast("Feature coming soon") // no real mutations
```

---

## 4. SECURITY FINDINGS

### 4.1 CRITICAL - DigiLocker PKCE Bypass

**Files:** `src/app/api/kyc/digilocker/authorize/route.ts`, `callback/route.ts`
**Severity:** CRITICAL

The DigiLocker OAuth PKCE flow has fundamental security flaws:

1. **code_verifier returned to client** - The authorize endpoint generates a PKCE code_verifier but returns it in the JSON response to the browser. PKCE requires the verifier to be stored server-side (in a session/database) and never exposed to the client.

2. **state parameter not validated** - The callback endpoint checks that `state` exists but never validates it against a stored value. This enables CSRF attacks.

3. **Empty catch block** - The callback has a blanket try/catch that silently swallows all errors including security failures.

**Impact:** An attacker could potentially bypass KYC verification by manipulating the OAuth flow.

**Fix:** Store code_verifier and state in server-side session (Supabase table or encrypted cookie). Validate state on callback. Add proper error logging.

### 4.2 CRITICAL - KYC Upload No Validation

**File:** `src/app/api/kyc/[clientId]/route.ts`
**Severity:** CRITICAL

The POST endpoint for KYC document upload accepts `document_type`, `file_url`, and `file_name` directly from the request body without any Zod schema validation. There are no file size limits, no content-type verification, and no malicious file detection.

**Impact:** Arbitrary file upload, potential stored XSS via file names, path traversal via file_url.

**Fix:** Add Zod schema validation, validate document_type against allowed enum, sanitize file_name, validate file_url format, add file size limits in Supabase Storage policies.

### 4.3 CRITICAL - Partner Creation No Auth

**File:** `src/app/api/partners/route.ts`
**Severity:** CRITICAL

The GET endpoint correctly requires admin role, but the POST endpoint has no role check at all. Any authenticated user can create a partner record for any user_id.

**Impact:** Unauthorized privilege escalation - any client can make themselves a partner.

**Fix:** Add `isAdminRole` check to POST handler.

### 4.4 HIGH - Password Validation Mismatch

**File:** `src/providers/auth-provider.tsx`
**Severity:** HIGH

The login function validates `pw.length < 4` but displays the error message "Password must be at least 8 characters". Users can set 4-7 character passwords that pass validation but are cryptographically weak.

**Fix:** Change validation to `pw.length < 8` to match the error message.

### 4.5 HIGH - Razorpay Error Leakage

**File:** `src/lib/payments/razorpay.ts`
**Severity:** HIGH

Error messages from Razorpay API calls are thrown directly as `"Razorpay X error: {status}"` which can leak internal infrastructure details to the client.

**Fix:** Map Razorpay errors to user-friendly messages, log original errors server-side.

### 4.6 MEDIUM - Notification Ownership

**File:** `src/app/api/notifications/[id]/read/route.ts`
**Severity:** MEDIUM

The mark-as-read endpoint updates any notification by ID without checking if the authenticated user owns that notification.

**Fix:** Add `user_id` filter to the update query.

### 4.7 MEDIUM - Raw Supabase Errors Exposed

**File:** `src/app/(auth)/forgot-password/page.tsx`
**Severity:** MEDIUM

Supabase Auth error messages (including internal details like rate limiting info, account status) are shown directly to users via toast.

**Fix:** Map error codes to user-friendly messages.
## 5. DATA INTEGRITY & BACKEND ISSUES

### 5.1 Race Conditions in Sequential ID Generation

**Files:** `src/app/api/invoices/route.ts`, `src/app/api/tickets/route.ts`
**Severity:** HIGH

Both invoice and ticket number generation use a count-then-increment pattern:
```
1. Query: SELECT COUNT(*) FROM invoices
2. Generate: INV-{month}-{count + 1}
3. Insert with generated number
```

Under concurrent requests, two requests can read the same count and generate duplicate IDs.

**Fix:** Use PostgreSQL sequences (`nextval()`) or Supabase RPC function with `FOR UPDATE` locking.

### 5.2 Webhook Idempotency

**File:** `src/app/api/payments/webhook/route.ts`
**Severity:** HIGH

The Razorpay webhook handler processes events without checking if they've already been processed. Razorpay can send the same webhook multiple times, creating duplicate transaction records and potentially double-crediting accounts.

Additional issues in the webhook handler:
- Missing null checks on `event.payload.payment?.entity?.amount`
- Uses `any` type cast to bypass TypeScript
- No logging for unhandled event types
- Refund handler assumes `notes.client_id` exists

**Fix:** Add idempotency key check (store `razorpay_payment_id` and skip if exists), add null guards, add proper typing.

### 5.3 Missing Await on sendOtp()

**File:** `src/providers/auth-provider.tsx`
**Severity:** HIGH

The `signup()` function calls `sendOtp()` without awaiting it. The function returns `true` (success) before the OTP is actually sent. If OTP sending fails, the user is redirected to the verification page with no OTP delivered.

**Fix:** Add `await` before `sendOtp()` call and handle its error.

### 5.4 N+1 Query Problems

**Severity:** HIGH

Three API endpoints execute queries inside loops:

| Endpoint | Issue | Impact |
|----------|-------|--------|
| `/api/kyc/queue` | Fetches documents per client in a loop | 1 + N queries for N clients |
| `/api/analytics/performance` | Counts trades per master separately | 1 + N queries for N masters |
| `/api/tickets/[id]` | Inline select with nested messages | Potentially inefficient join |

**Fix:** Use Supabase joins or RPC functions to fetch related data in a single query.

### 5.5 Payment Verification Timing

**File:** `src/app/api/payments/verify/route.ts`
**Severity:** MEDIUM

The verify endpoint sets `paid_at` timestamp based on the client's request time, not the actual payment time from Razorpay. The update has no error handling and doesn't validate the invoice exists before updating.

**Fix:** Use webhook-based payment confirmation (already exists but needs idempotency). If client-side verify is needed, fetch payment timestamp from Razorpay API.

### 5.6 KYC Review Error Handling

**File:** `src/app/api/kyc/[documentId]/review/route.ts`
**Severity:** MEDIUM

After approving a document, a second database update checks if all documents are verified to update the client's overall KYC status. This second update has no error check. If it fails, the document is marked approved but the client's KYC status is stale.

Also accesses `data.client_id` without null check on `data`.

### 5.7 Role Update Dual Write

**File:** `src/app/api/users/[id]/role/route.ts`
**Severity:** MEDIUM

Updates both the `users` table and Supabase Auth `app_metadata` in sequence. If the second update fails, the role in the database and auth metadata diverge. No validation that the target role is valid. No audit logging of role changes.

---

## 6. TYPE SYSTEM & DATA MODELING

### 6.1 Frontend Types - Numeric Values as Strings

**File:** `src/lib/types/index.ts`
**Severity:** HIGH (Design Debt)

All numeric fields across every entity are typed as `string`:

| Interface | Fields as strings |
|-----------|-------------------|
| Client | aum, pnl |
| Master | pnl, rate |
| Partner | clients (count), aum, pnl, rev |
| Invoice | amt |
| KYCItem | docs (contains "PAN checkmark", "Aadhaar hourglass") |

This means:
- Cannot sort by amount, P&L, or AUM
- Cannot aggregate or calculate totals
- Cannot validate ranges (negative amounts)
- Display formatting (₹, L, Cr) baked into data

**Fix:** Separate numeric values from display formatting. Store raw numbers, format at render time using the converters in `supabase/converters.ts`.

### 6.2 Missing Type Definitions

- No `Plan` interface despite `plans.ts` existing
- No `AuditLog` interface
- No `Transaction` interface
- No `BillingCycle` interface
- `SignupData` has no validation constraints

### 6.3 Missing Timestamps

No entity has `createdAt` or `updatedAt` fields. The Supabase schema (types.ts) includes these fields, but the frontend types don't map them.

### 6.4 Contradictory State Combinations

Union types are too narrow and allow invalid state combinations:
- Client with `status: "pending"` but `kyc: "rejected"` (contradictory)
- Master with negative P&L but `status: "active"` (should auto-trigger review)

### 6.5 Mock Data Issues

**Files:** `src/lib/data/*.ts` (6 files)

| Issue | Files Affected |
|-------|---------------|
| Sequential IDs instead of UUIDs | All 6 files |
| Relative timestamps ("2h ago") become stale | kyc-queue, tickets |
| Emoji in data ("PAN checkmark", "Aadhaar hourglass") | kyc-queue |
| Invoice amounts as "₹4,425" strings | invoices |
| Client references by name not ID | invoices |
| Orphaned KYC records (IDs not matching clients) | kyc-queue |

---

## 7. API ROUTES ANALYSIS

### 7.1 Route Inventory (34 routes)

| Category | Routes | Methods |
|----------|--------|---------|
| Clients | `/api/clients`, `/api/clients/[id]` | GET, POST, PATCH, DELETE |
| KYC | `/api/kyc/queue`, `/api/kyc/[clientId]`, `/api/kyc/[documentId]/review`, `/api/kyc/digilocker/authorize`, `/api/kyc/digilocker/callback` | GET, POST, PATCH |
| Invoices | `/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/send` | GET, POST, PATCH |
| Payments | `/api/payments/checkout`, `/api/payments/verify`, `/api/payments/link`, `/api/payments/webhook` | POST |
| Tickets | `/api/tickets`, `/api/tickets/[id]`, `/api/tickets/[id]/messages` | GET, POST, PATCH |
| Partners | `/api/partners`, `/api/partners/[id]` | GET, POST, PATCH |
| Analytics | `/api/analytics/dashboard`, `/api/analytics/aum-trend`, `/api/analytics/pnl`, `/api/analytics/performance`, `/api/analytics/partners` | GET |
| Users | `/api/users`, `/api/users/[id]/role` | GET, PATCH |
| Other | `/api/plans`, `/api/masters`, `/api/transactions`, `/api/notifications`, `/api/notifications/[id]/read`, `/api/notification-templates`, `/api/audit-logs`, `/api/billing-cycles` | GET, POST, PATCH |

### 7.2 Authentication Pattern

All routes use `getAuthenticatedUser()` from `api-helpers.ts`. This is consistent and good. However:
- One route (partner POST) skips auth role check
- Notification mark-read doesn't verify ownership
- Ticket messages don't verify user belongs to ticket

### 7.3 Validation Coverage

| Route | Has Zod Validation | Issue |
|-------|--------------------|-------|
| POST /api/clients | Yes | Good |
| POST /api/invoices | Yes | Good |
| POST /api/tickets | Yes | Good |
| POST /api/kyc/[clientId] | **No** | Critical - accepts raw body |
| PATCH /api/invoices/[id] | Partial | No amount/GST validation |
| PATCH /api/users/[id]/role | **No** | No role enum validation |
| POST /api/partners | Partial | Missing role check |
| POST /api/tickets/[id]/messages | **No** | No content validation |

### 7.4 Pagination

Only `/api/transactions` and `/api/notifications` implement pagination. All other list endpoints return unbounded results, which will cause performance issues at scale.

### 7.5 Missing API Features

- No rate limiting on any endpoint
- No request logging or audit trail
- No API versioning
- No health check endpoint
- No bulk operations
- Invoice send route has a TODO comment - incomplete
## 8. COMPONENT ANALYSIS

### 8.1 Shared Components (12 files)

All components in `src/components/shared/` are well-structured, use Tailwind CSS variables, and follow consistent patterns. Key concerns:

**Color Variant Inconsistency:**
| Component | Variants Used |
|-----------|--------------|
| AlertBox | w, d, s, i |
| Panel | b, t, g, p, r |
| ProgressBar | b, t, ok, wa, r |
| StatusBadge | ok, warn, bad, blue, purple, teal |

These should use a single consistent naming convention.

**Accessibility Gaps:**
| Component | Missing |
|-----------|---------|
| Modal | ESC key close, focus trap, aria-modal, role="dialog" |
| TabSwitcher | Keyboard nav (Arrow/Home/End), role="tablist", aria-selected |
| ProgressBar | aria-valuenow, aria-valuemin, aria-valuemax |
| SearchInput | aria-label, debounce |
| AlertBox | aria-role, aria-live |

**Minor Issues:**
- DataTable imports `cn` utility but never uses it
- Icon component `name` prop is `string` instead of union type of valid icon keys
- Modal has no footer slot for action buttons
- SearchInput has no debounce (fires on every keystroke)
- UserAvatar renders empty circle for empty name string

### 8.2 Layout Components (3 files)

**sidebar.tsx (Critical Maintainability Issue)**

The sidebar contains 32 hardcoded route mappings (24 admin + 8 client) as inline objects within the component. These should be derived from the existing `ROUTES` constant or `navigation.ts` data.

Additional issues:
- Missing `aria-expanded` on collapsible nav sections
- Missing `role="navigation"`
- Mobile menu doesn't auto-close on sub-item click
- `getHref()` silently falls back to dashboard for unknown IDs

**topbar.tsx**
- Search input is decorative only (no state, no onChange handler)
- Theme toggle uses emoji characters - not accessible
- Hydration hack using `mounted` state for theme icon
- "Admin Panel" / "Client Portal" strings hardcoded

**background-effects.tsx**
- Clean implementation, no issues
- Two fixed-position decorative divs with gradients and grid pattern

### 8.3 UI Components (16 shadcn/ui files)

Standard shadcn/ui components - no modifications needed:
accordion, alert, avatar, badge, button, card, dialog, dropdown-menu, input, label, progress, scroll-area, select, separator, sheet, sonner, table, tabs, textarea, tooltip

### 8.4 Icons (1 file)

Custom SVG icon library with 23 icons (home, users, chart, bill, analytics, support, settings, link, doc, star, search, bell, close, chevron, check, info, warn, logout, etc.)

Issue: `name` prop typed as `string` - renders `undefined` for invalid names with no error.

---

## 9. PAGE-BY-PAGE ANALYSIS

### 9.1 Auth Pages (5 pages)

**Common Issues Across All Auth Pages:**
- No loading states during async operations (login, signup, OTP verify, password reset)
- No client-side form validation before API calls
- No rate limiting on form submissions

| Page | Specific Issues |
|------|----------------|
| login | Hardcoded admin placeholder "admin@antmeta.ai"; no input validation |
| signup | Password match not checked; mobile format not validated; email format not checked when provided |
| verify-otp | "Resend OTP" is mock (toast only); no expiry timer; no cooldown |
| forgot-password | Raw Supabase errors shown to user; no email/phone format validation |
| layout | Theme toggle uses emoji; no accessibility labels |

### 9.2 Admin Pages (22 pages) - Common Patterns

Every admin page follows this identical pattern:

```tsx
"use client";
// 1. Import mock data + shared components
import { MOCK_DATA } from "@/lib/data/...";

export default function AdminPage() {
  // 2. State initialized with mock data
  const [data, setData] = useState(MOCK_DATA);

  // 3. Optional API fetch (silent failure)
  useEffect(() => {
    fetch("/api/endpoint")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {}); // silent
  }, []);

  // 4. Action buttons → toast only
  const handleAction = () => toast.success("Coming soon");

  // 5. Render with KpiCards, DataTable, Panel, StatusBadge
}
```

**Issues present in ALL 22 admin pages:**
1. Mock data as initial state
2. API fetches with `.catch(() => {})` - no error UI
3. ~90% of buttons show toast notifications only
4. Filter dropdowns render but don't filter data
5. No loading skeletons or error boundaries
6. No pagination on data tables
7. No real-time updates (WebSocket/Supabase Realtime not connected)

**Page-Specific Notable Issues:**

| Page | Notable Issue |
|------|--------------|
| dashboard | AUM chart SVG path is hardcoded, not computed from data |
| clients | Add Client modal inputs not bound to state - typing does nothing |
| kyc-verification | Detail panel always shows same hardcoded client regardless of selection |
| live-chat | No Supabase Realtime despite being a chat feature |
| help-center | 255 lines - should be split into sub-components |
| exchange-setup | Server IP "13.235.112.48" hardcoded in component |
| pnl-analytics | Filter state exists but never applied to chart/data |
| transaction-logs | Filter dropdowns render but have no effect |
| user-roles | Permission matrix hardcoded, no actual RBAC enforcement |

### 9.3 Client Pages (8 pages) - Common Patterns

Same patterns as admin pages, plus:

| Page | Notable Issue |
|------|--------------|
| dashboard | Custom SVG chart with hardcoded datasets; export button is toast |
| profile | Account type hardcoded to "individual"; corporate path never reached; form inputs uncontrolled |
| exchange-setup | Uses `Math.random()` for connection test results; hardcoded server IP |
| invoices | Mixed mock + API pattern; "Pay Now" references Cashfree but project uses Razorpay |
| pnl-analytics | Period filter state managed but never used; SVG paths static |
| subscription | Plan data hardcoded; upgrade/switch buttons are toast only |
| become-partner | All form inputs uncontrolled (no value/onChange); no validation |
| support | 5-tab hub, all content hardcoded; raise ticket form uncontrolled; search non-functional |

---

## 10. SUPABASE INTEGRATION ANALYSIS

### 10.1 Client Configuration

Three files create Supabase clients:
- `supabase/client.ts` - Browser-side (SSR-aware)
- `supabase/server.ts` - Server-side (cookie-based) + Service Role
- `supabase/middleware.ts` - Middleware (session refresh)

All three use placeholder fallback credentials during build time. This masks missing environment variables.

### 10.2 Database Schema (types.ts)

Comprehensive schema with 14+ tables:
- users, clients, plans, masters, partners
- invoices, transactions, billing_cycles
- tickets, ticket_messages
- kyc_documents, notifications, notification_templates
- audit_logs, pnl_snapshots

The schema includes proper column types, nullable fields, and foreign key relationships. RLS policies are not defined in code (assumed to be in Supabase dashboard).

### 10.3 Converters (converters.ts)

Well-structured DB-to-frontend converters with formatters:
- `formatINR()` - Indian Rupee formatting
- `formatPnl()` - P&L with +/- and color
- `formatDate()` - Date display
- `relativeTime()` - "2h ago" format
- `dbClientToClient()`, `dbInvoiceToInvoice()`, etc.

Issues: Hardcoded algorithm names (M1=ALPHA, M2=DELTA, M3=SIGMA), no null safety in `algoConfigToString()`.

### 10.4 Realtime Channels (realtime-channels.ts)

Five subscription functions defined:
1. `subscribeToPnlUpdates()` - P&L snapshot changes
2. `subscribeToTradeFeed()` - Trade inserts
3. `subscribeToKycStatus()` - KYC document updates
4. `subscribeToTicketMessages()` - Ticket message inserts
5. `subscribeToNotifications()` - Notification inserts

**None of these are currently used by any page component.** They exist as infrastructure but are not connected.

Issues: No error callbacks, no retry logic, type safety lost via `Record<string, unknown>` cast, no documented unsubscribe pattern.

### 10.5 Validations (validations/index.ts)

Zod schemas exist for: clients, tickets, invoices, KYC, partners, users, plans, notifications, pagination.

Missing schemas: login, signup, OTP verification, password reset.

Issue: Phone validation hardcoded to `+91` format, duplicate PAN regex, plan features field type mismatch (array vs Json).
## 11. PAYMENT INTEGRATION ANALYSIS

### 11.1 Razorpay Implementation (razorpay.ts)

The payment integration uses raw `fetch()` calls to the Razorpay API instead of the official `razorpay` npm package. This means:
- No TypeScript types for request/response
- No built-in error handling or retries
- No SDK-level validation

**Functions Implemented:**
| Function | Purpose | Issues |
|----------|---------|--------|
| `createOrder()` | Create Razorpay order | No input validation (negative amounts accepted), response untyped |
| `createPaymentLink()` | Generate payment link | Hardcoded INR currency (inconsistent with createOrder which accepts currency param) |
| `verifyPaymentSignature()` | Client-side signature check | Works correctly |
| `verifyWebhookSignature()` | Server-side webhook validation | Exists but never connected to webhook route properly |

**Missing Functions:**
- Refund processing
- Payment status check
- Subscription management
- Customer management

### 11.2 Payment Flow Issues

1. **Checkout route** creates orders without checking if invoice is already paid
2. **Verify route** sets `paid_at` based on client request time, not actual payment time
3. **Webhook route** has no idempotency - duplicate webhooks create duplicate records
4. **Invoice send route** has a TODO comment - Razorpay integration incomplete
5. **Client invoices page** references "Cashfree checkout" but project uses Razorpay

---

## 12. HOOKS & STATE MANAGEMENT

### 12.1 useAuth

Clean context hook. No issues.

### 12.2 useClock

Returns formatted IST time string, updates every second.

Issue: Uses manual UTC offset calculation (`now.getTime() + 5.5 * 3600000`) instead of `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`. The manual approach is fragile and doesn't handle edge cases.

### 12.3 useSidebar

Clean context hook. No issues.

### 12.4 useNotifications

Polls `/api/notifications` every 30 seconds with optimistic `markAsRead`.

Issues:
- `fetchNotifications` callback is defined but never called (the useEffect creates its own `load()`)
- Silent error suppression in empty catch block
- No AbortController for cleanup on unmount
- Race condition: out-of-order responses can overwrite newer data with stale data
- `cancelled` flag is a workaround - should use AbortController

---

## 13. ACCESSIBILITY AUDIT

### 13.1 Critical Gaps

| Component/Page | Issue | WCAG Criterion |
|----------------|-------|----------------|
| Modal | No focus trap, no ESC close, no aria-modal | 2.1.2 No Keyboard Trap |
| TabSwitcher | No keyboard navigation (Arrow keys) | 2.1.1 Keyboard |
| TabSwitcher | No role="tablist", aria-selected | 4.1.2 Name, Role, Value |
| ProgressBar | No aria-valuenow/min/max | 4.1.2 Name, Role, Value |
| Sidebar | No aria-expanded on collapsible sections | 4.1.2 Name, Role, Value |
| Sidebar | No role="navigation" | 1.3.1 Info and Relationships |
| Topbar | No skip-to-content link | 2.4.1 Bypass Blocks |
| Topbar | Theme toggle uses emoji, no aria-label | 1.1.1 Non-text Content |
| SearchInput | No aria-label | 1.1.1 Non-text Content |
| Auth layout | Theme toggle emoji, no ARIA labels | 1.1.1 Non-text Content |
| All forms | No loading state announcements | 4.1.3 Status Messages |
| SVG Charts | No aria labels for screen readers | 1.1.1 Non-text Content |
| AlertBox | No aria-role or aria-live | 4.1.3 Status Messages |

### 13.2 Positive Findings

- Color contrast appears adequate (tested via CSS variable values)
- Semantic HTML structure used (header, main, nav concepts)
- Form labels present on auth pages
- Responsive design handles mobile viewports
- Touch targets appear adequate (buttons/links)

---

## 14. PERFORMANCE CONSIDERATIONS

### 14.1 Current Concerns

| Area | Issue | Impact |
|------|-------|--------|
| Bundle size | No chart library but manual SVG in every chart page | Repeated code |
| API calls | No caching, deduplication, or SWR/React Query | Redundant fetches |
| Polling | useNotifications polls every 30s regardless of visibility | Unnecessary network |
| N+1 queries | 3 API routes with loop-based queries | Slow at scale |
| No pagination | Most list endpoints return all records | Memory issues at scale |
| No code splitting | All admin/client pages in same bundle group | Large initial load |
| Background effects | Two full-screen gradient divs on every page | Minor GPU cost |

### 14.2 Positive Performance Patterns

- Next.js App Router with automatic code splitting per route
- Supabase SSR with cookie-based auth (no token in URL)
- Font optimization via next/font/google
- Image optimization configured for Supabase Storage
- Tailwind CSS 4 with tree-shaking

---

## 15. RECOMMENDATIONS & ROADMAP

### Phase 1: Security Fixes (P0) - Immediate

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 1 | Fix DigiLocker PKCE - store code_verifier server-side | kyc/digilocker/*.ts | 2-3 hours |
| 2 | Add Zod validation to KYC upload | kyc/[clientId]/route.ts, validations | 1 hour |
| 3 | Add role check to partner POST | partners/route.ts | 15 min |
| 4 | Fix password validation (4 → 8) | auth-provider.tsx | 5 min |
| 5 | Sanitize Razorpay error messages | payments/razorpay.ts | 30 min |
| 6 | Add notification ownership check | notifications/[id]/read/route.ts | 15 min |
| 7 | Sanitize Supabase error messages | forgot-password/page.tsx | 30 min |

### Phase 2: Data Integrity (P1) - This Sprint

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 8 | Use DB sequences for invoice/ticket IDs | invoices/route.ts, tickets/route.ts | 2 hours |
| 9 | Add webhook idempotency | payments/webhook/route.ts | 2 hours |
| 10 | Add null checks to webhook handler | payments/webhook/route.ts | 1 hour |
| 11 | Await sendOtp() in signup | auth-provider.tsx | 15 min |
| 12 | Fix role update dual write | users/[id]/role/route.ts | 1 hour |
| 13 | Fix N+1 queries | kyc/queue, analytics/performance | 3 hours |

### Phase 3: Backend Quality (P2) - Next Sprint

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 14 | Add error handling to all .catch(() => {}) | All 30 page files | 4 hours |
| 15 | Add loading/error states to auth forms | 4 auth pages | 2 hours |
| 16 | Add missing validation schemas | validations/index.ts | 2 hours |
| 17 | Fix useNotifications (AbortController, race condition) | use-notifications.ts | 1 hour |
| 18 | Add pagination to list endpoints | users, audit-logs, etc. | 3 hours |
| 19 | Add proper Razorpay SDK | package.json, razorpay.ts | 3 hours |

### Phase 4: Frontend Quality (P3) - Upcoming

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 20 | Bind form inputs to state | clients, kyc-verification, become-partner, support, profile | 4 hours |
| 21 | Make filters functional | pnl-analytics, transaction-logs, audit-logs, user-guidelines | 3 hours |
| 22 | Fix KYC detail panel (show selected client) | kyc-verification/page.tsx | 1 hour |
| 23 | Connect Supabase Realtime channels | live-chat, dashboard, notifications | 4 hours |
| 24 | Add chart library (recharts) | dashboard, pnl-analytics, performance-metrics | 6 hours |

### Phase 5: Architecture (P4) - Planned

| # | Task | Effort |
|---|------|--------|
| 25 | Install vitest + write critical path tests | 8 hours |
| 26 | Move sidebar route maps to constants | 2 hours |
| 27 | Consolidate color variant naming | 3 hours |
| 28 | Add accessibility (aria, keyboard nav, focus traps) | 6 hours |
| 29 | Add CSP header + CORS config | 2 hours |
| 30 | Refactor types (numeric fields, timestamps, UUIDs) | 4 hours |

---

## 16. POSITIVE FINDINGS

Despite the issues identified, the codebase has strong foundations:

1. **Consistent Architecture** - All pages follow predictable patterns making them easy to enhance
2. **Clean Provider Pattern** - Auth, Theme, Sidebar providers are well-structured
3. **Comprehensive Route Constants** - Centralized, const-asserted route definitions
4. **Good Supabase Schema** - 14+ tables with proper types, nullable fields, relationships
5. **Security Headers** - API routes have X-Content-Type-Options, X-Frame-Options, Referrer-Policy
6. **Dark Mode** - Full CSS variable system supporting light/dark themes
7. **Responsive Design** - Mobile-first layout with sidebar overlay and responsive grids
8. **Zod Validation** - Schema validation exists for most POST/PATCH endpoints
9. **Type Safety** - Strict TypeScript, comprehensive database types
10. **Converter Layer** - Clean separation between DB rows and display types
11. **Component Library** - 12 reusable shared components + 16 shadcn/ui primitives
12. **Modern Stack** - Latest versions of Next.js, React, Tailwind, TypeScript

---

## APPENDIX A: FILE INVENTORY

### Source Files by Category

| Category | Count | Location |
|----------|-------|----------|
| Config files | 5 | Root directory |
| Root app files | 4 | src/app/ |
| Auth pages | 5 | src/app/(auth)/ |
| Admin pages | 22 | src/app/(dashboard)/admin/ |
| Client pages | 8 | src/app/(dashboard)/client/ |
| Dashboard layout | 1 | src/app/(dashboard)/ |
| API routes | 34 | src/app/api/ |
| Shared components | 12 | src/components/shared/ |
| Layout components | 3 | src/components/layout/ |
| UI components | 16 | src/components/ui/ |
| Icons | 1 | src/components/icons/ |
| Hooks | 4 | src/hooks/ |
| Providers | 3 | src/providers/ |
| Supabase lib | 7 | src/lib/supabase/ |
| Other lib | 5 | src/lib/ |
| Constants | 3 | src/lib/constants/ |
| Mock data | 7 | src/lib/data/ |
| Types | 1 | src/lib/types/ |
| Middleware | 1 | src/ |
| **Total** | **~142** | |

### API Routes by HTTP Method

| Method | Count | Purpose |
|--------|-------|---------|
| GET | 22 | List/detail endpoints |
| POST | 12 | Create endpoints |
| PATCH | 8 | Update endpoints |
| DELETE | 1 | Soft delete (clients) |

---

*End of Report*
