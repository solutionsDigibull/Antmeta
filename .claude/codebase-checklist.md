# AntMeta Codebase Checklist

**Generated:** 2026-03-11 | **Files Reviewed:** ~116 | **Status:** Complete Review

---

## PART 1: CONFIG & ROOT FILES

### package.json
- [x] Next.js 16.1.6, React 19.2.3, TypeScript 5
- [x] Supabase SSR + JS client
- [x] Shadcn/UI (radix-ui), Tailwind CSS 4, zod validation
- [x] Lucide React icons, sonner toasts, next-themes
- [ ] Missing: No test framework (jest/vitest) installed
- [ ] Missing: No Razorpay SDK in dependencies (uses raw fetch in razorpay.ts)
- [ ] Missing: No chart library (recharts/chart.js) — all charts are manual SVG

### tsconfig.json
- [x] Strict mode enabled
- [x] Bundler module resolution
- [x] Path alias `@/*` → `./src/*`

### next.config.ts
- [x] Supabase image remote patterns configured
- [x] Security headers on API routes (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [ ] Missing: CSP (Content-Security-Policy) header
- [ ] Missing: CORS configuration

### eslint.config.mjs
- [x] Core Web Vitals + TypeScript rules

### globals.css
- [x] Full CSS variable system (light + dark theme)
- [x] Shadcn overrides mapped to custom variables
- [x] Tailwind @theme inline block for custom colors
- [x] Custom scrollbar styling
- [x] Responsive table class

### Root Layout (src/app/layout.tsx)
- [x] Providers: Theme > Auth > Sidebar > Tooltip
- [x] Google Fonts: Inter + Poppins
- [x] Toaster (sonner) at bottom-right
- [x] suppressHydrationWarning on html tag

### Root Page (src/app/page.tsx)
- [x] Client component redirecting to /login

### Middleware (src/middleware.ts)
- [x] Supabase session update via middleware
- [x] Matcher excludes static assets

---

## PART 2: PROVIDERS & HOOKS

### auth-provider.tsx
- [x] Supabase Auth integration (login, signup, OTP, logout)
- [x] Session restoration on mount
- [x] Auth state change listener
- [x] Email/phone routing (email for admin, phone for client)
- [ ] **BUG:** Password validation checks `pw.length < 4` but message says "at least 8 characters"
- [ ] **BUG:** `sendOtp()` called without await — signup returns true before OTP is confirmed sent
- [ ] **ISSUE:** Race condition on sequential `updateUser()` calls post-OTP verification
- [ ] **ISSUE:** Hardcoded `+91` phone prefix (India-only, not configurable)
- [ ] **ISSUE:** Type cast with `as Parameters<typeof...>[0]` — fragile

### theme-provider.tsx
- [x] Wrapper around next-themes, class-based, dark default
- [x] Clean — no issues

### sidebar-provider.tsx
- [x] Nav item expansion + mobile menu toggle
- [x] Clean — no issues

### use-auth.ts
- [x] Standard context hook with error boundary
- [x] Clean — no issues

### use-clock.ts
- [x] IST clock updating every second
- [ ] **MINOR:** Fragile timezone logic — should use `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`

### use-sidebar.ts
- [x] Standard context hook
- [x] Clean — no issues

### use-notifications.ts
- [x] Fetches from /api/notifications, polls every 30s
- [x] Optimistic markAsRead
- [ ] **BUG:** `fetchNotifications` defined but never called — effect creates its own `load()` function
- [ ] **ISSUE:** Silent error suppression (empty catch block)
- [ ] **ISSUE:** No AbortController for cleanup on unmount
- [ ] **ISSUE:** Possible race condition on out-of-order fetches

---

## PART 3: LIB FILES

### supabase/client.ts
- [x] Browser-side Supabase client
- [ ] **ISSUE:** Placeholder fallback credentials during build — masks config issues

### supabase/server.ts
- [x] Server-side + service role clients
- [ ] **ISSUE:** Silent catch blocks in cookie setAll() — no logging

### supabase/middleware.ts
- [x] Session update + route protection
- [ ] **ISSUE:** Hardcoded placeholder URLs
- [ ] **ISSUE:** Assumes `app_metadata?.role` exists without null check

### supabase/types.ts
- [x] Comprehensive schema (14+ tables)
- [x] Type helpers (Tables, InsertTables, UpdateTables)
- [ ] **ISSUE:** RLS policies not defined in code — assumed in Supabase

### supabase/converters.ts
- [x] DB row → frontend display type converters
- [x] Formatters (INR, PnL, Date, RelativeTime)
- [ ] **ISSUE:** Hardcoded algorithm mapping (M1→ALPHA, M2→DELTA, M3→SIGMA)
- [ ] **ISSUE:** No null safety in algoConfigToString()
- [ ] **ISSUE:** Hardcoded INR currency, no multi-currency support

### supabase/realtime-channels.ts
- [x] 5 subscription functions (PnL, Trade, KYC, Tickets, Notifications)
- [ ] **ISSUE:** No error callback on .subscribe()
- [ ] **ISSUE:** No unsubscribe pattern documented — memory leak risk
- [ ] **ISSUE:** Type safety lost (payloads cast to Record<string, unknown>)
- [ ] **ISSUE:** No retry logic on network failure

### supabase/index.ts
- [x] Barrel export (18 exports)
- [ ] **MINOR:** Does NOT export realtime-channels

### api-client.ts
- [x] Generic fetch wrapper
- [ ] **ISSUE:** Only handles GET
- [ ] **ISSUE:** No timeout, retry, or error detail
- [ ] **ISSUE:** No Content-Type negotiation

### api-helpers.ts
- [x] Auth, role checks, error response helpers
- [ ] **ISSUE:** Uses @typescript-eslint/no-explicit-any
- [ ] **ISSUE:** No logging for auth failures
- [ ] **ISSUE:** Hardcoded role list (duplicated from schema)

### utils.ts
- [x] `cn()` function (clsx + tailwind-merge)
- [x] Clean — no issues

### validations/index.ts
- [x] Zod schemas for clients, tickets, invoices, KYC, partners, users, plans, notifications, pagination
- [ ] **ISSUE:** Phone validation assumes +91 (India-only)
- [ ] **ISSUE:** Duplicate PAN regex
- [ ] **ISSUE:** Missing auth schemas (login, signup, OTP)
- [ ] **ISSUE:** Plan features field mismatch (array vs Json)

### payments/razorpay.ts
- [x] Order creation, payment links, signature verification
- [ ] **ISSUE:** Non-null assertion on env vars — crashes if missing
- [ ] **ISSUE:** Hardcoded INR in createPaymentLink
- [ ] **ISSUE:** No input validation (negative amounts possible)
- [ ] **ISSUE:** Response not typed (could be error response)
- [ ] **ISSUE:** Error messages leak internals
- [ ] **ISSUE:** No idempotency keys
- [ ] **ISSUE:** No refund function

---

## PART 4: CONSTANTS, DATA & TYPES

### constants/routes.ts
- [x] Centralized route config (auth, admin 20+, client 8)
- [x] const-asserted for type safety
- [x] Clean — no issues

### constants/plans.ts
- [x] 3 plans (Standard, Premium, Exclusive/TraaS)
- [ ] **ISSUE:** No Plan type definition
- [ ] **ISSUE:** No numeric pricing for calculations

### constants/screen-titles.ts
- [x] 23 route-to-title mappings
- [ ] **ISSUE:** Not validated against ROUTES — manual sync required

### lib/data/*.ts (6 mock data files)
- [x] clients.ts — 5 clients
- [x] invoices.ts — 4 invoices
- [x] kyc-queue.ts — 4 KYC items
- [x] masters.ts — 3 algorithms
- [x] partners.ts — 4 partners
- [x] tickets.ts — 4 tickets
- [ ] **ISSUE:** ALL numeric values stored as formatted strings (₹4,425, +₹14.2L, 99%)
- [ ] **ISSUE:** Relative timestamps ("2h ago") become stale
- [ ] **ISSUE:** No UUIDs — sequential IDs
- [ ] **ISSUE:** KYC IDs don't all match client IDs
- [ ] **ISSUE:** Invoice amounts not linked to client IDs (uses names)
- [ ] **ISSUE:** Document status embedded in emoji strings ("PAN ✓")

### lib/data/navigation.ts
- [x] ADMIN_NAV (6 sections, 20+ items) + CLIENT_NAV (8 items)
- [ ] **ISSUE:** Badge values hardcoded (12, 3, 1)
- [ ] **ISSUE:** Icon names are unvalidated strings

### lib/types/index.ts
- [x] 10 interfaces (User, Client, Master, Partner, Invoice, Ticket, KYCItem, NavSubItem, NavItem, SignupData)
- [ ] **ISSUE:** Missing Plan type
- [ ] **ISSUE:** ALL numeric fields (amt, pnl, aum, rev, rate) are strings
- [ ] **ISSUE:** No createdAt/updatedAt timestamps on any entity
- [ ] **ISSUE:** No UUID patterns
- [ ] **ISSUE:** Narrow union types allow contradictory states

---

## PART 5: API ROUTES (34 routes)

### Security — CRITICAL
- [ ] **CRITICAL:** DigiLocker PKCE bypass — code_verifier returned to client, not stored server-side
- [ ] **CRITICAL:** DigiLocker state parameter not validated against stored value
- [ ] **CRITICAL:** KYC POST has no schema validation — document_type, file_url used directly
- [ ] **CRITICAL:** Partner POST has no role check — anyone can create a partner

### Race Conditions — HIGH
- [ ] **HIGH:** Invoice number generation — count query + manual sequence (concurrent creates)
- [ ] **HIGH:** Ticket number generation — same pattern
- [ ] **HIGH:** Webhook handler — duplicate webhooks create duplicate transactions

### N+1 Query Problems — HIGH
- [ ] **HIGH:** KYC queue — fetches documents per client in loop
- [ ] **HIGH:** Performance metrics — counts trades per master separately
- [ ] **HIGH:** Ticket messages — inline select with nested query

### Missing Validation — HIGH
- [ ] **HIGH:** KYC upload — no file size limits, no virus scan
- [ ] **HIGH:** Role update — no validation target role is valid
- [ ] **HIGH:** Invoice PATCH — no validation of amount/GST modifications
- [ ] **HIGH:** Ticket messages POST — no access control, no content validation

### Error Handling — HIGH
- [ ] **HIGH:** KYC review — second update after approve has no error check
- [ ] **HIGH:** Payment verify — silent update, no validation invoice exists
- [ ] **HIGH:** Webhook — missing null checks on payload.payment.entity.amount
- [ ] **HIGH:** DigiLocker callback — empty catch block

### Authorization Gaps — MEDIUM
- [ ] **MEDIUM:** Notification mark-read — no check user owns notification
- [ ] **MEDIUM:** Partner GET/PATCH — no authorization check
- [ ] **MEDIUM:** Analytics PnL — no master-level filtering for clients

### Missing Features — MEDIUM
- [ ] **MEDIUM:** No idempotency on payment checkout
- [ ] **MEDIUM:** No audit trail on role changes
- [ ] **MEDIUM:** No pagination on users list or audit logs
- [ ] **MEDIUM:** Invoice send route has TODO — incomplete Razorpay integration

---

## PART 6: COMPONENTS

### Shared Components (12 files)
- [x] alert-box, data-table, filter-bar, info-grid, kpi-card, modal, panel, progress-bar, search-input, status-badge, tab-switcher, user-avatar
- [ ] **ISSUE:** Color variant naming inconsistent across components (w/d/s/i vs ok/warn/bad vs b/t/g/p/r)
- [ ] **ISSUE:** Modal missing ESC key support, focus trap, aria-modal, role="dialog"
- [ ] **ISSUE:** TabSwitcher missing keyboard nav (Arrow keys), aria-tablist
- [ ] **ISSUE:** ProgressBar missing aria-valuenow/min/max
- [ ] **ISSUE:** SearchInput has no debounce
- [ ] **ISSUE:** DataTable imports `cn` but never uses it
- [ ] **ISSUE:** Icon component name prop is `string` — should be union type of valid keys

### Layout Components (3 files)
- [x] sidebar.tsx — dual portal nav, mobile overlay, collapsible sections
- [x] topbar.tsx — title, breadcrumb, search, notifications, theme, clock
- [x] background-effects.tsx — decorative gradients + grid
- [ ] **ISSUE:** Sidebar has 32 hardcoded route mappings (should be in constants)
- [ ] **ISSUE:** Topbar search input is non-functional (no state/onChange)
- [ ] **ISSUE:** Topbar theme toggle uses emoji — not accessible
- [ ] **ISSUE:** Sidebar missing aria-expanded, role="navigation"

---

## PART 7: AUTH PAGES (5 pages)

### login/page.tsx
- [x] Dual mode toggle (Admin/Client)
- [x] Email/Mobile + Password form
- [ ] **ISSUE:** No loading state during login
- [ ] **ISSUE:** No client-side input validation
- [ ] **ISSUE:** Hardcoded admin placeholder "admin@antmeta.ai"

### signup/page.tsx
- [x] Mobile, name, email, account type, password fields
- [ ] **ISSUE:** No client-side validation (password match, min length, email format)
- [ ] **ISSUE:** No loading state
- [ ] **ISSUE:** Mobile format not validated beyond removing non-digits

### verify-otp/page.tsx
- [x] 6-digit OTP input with auto-focus
- [ ] **ISSUE:** Resend OTP is mocked (toast only)
- [ ] **ISSUE:** No OTP expiry timer/cooldown
- [ ] **ISSUE:** No loading state during verification

### forgot-password/page.tsx
- [x] Supabase resetPasswordForEmail integration
- [ ] **ISSUE:** No input validation (email/phone format)
- [ ] **ISSUE:** Raw Supabase error messages exposed to user
- [ ] **ISSUE:** No loading state

---

## PART 8: ADMIN PAGES (22 pages)

### Common Patterns Across All Admin Pages
- [ ] **PATTERN:** All use mock data with optional API fallback
- [ ] **PATTERN:** API fetches have `.catch(() => {})` — silent failures
- [ ] **PATTERN:** ~90% of buttons only show toast (no real actions)
- [ ] **PATTERN:** Filter selections don't actually filter data
- [ ] **PATTERN:** Modal form inputs don't bind to component state
- [ ] **PATTERN:** No loading/error states for async operations
- [ ] **PATTERN:** No pagination on data tables
- [ ] **PATTERN:** No real-time WebSocket integration

### Individual Pages Reviewed
- [x] admin-security — 2FA settings, sessions (all mock)
- [x] audit-logs — action trail table (hardcoded, no search)
- [x] billing-cycles — TraaS billing (hardcoded, no integration)
- [x] clients — CRUD + plan selection (modal inputs unbound)
- [x] copy-trading — master monitoring (hardcoded metrics)
- [x] dashboard — KPIs, AUM chart, activity (hardcoded SVG path)
- [x] exchange-setup — Delta API config (hardcoded IP, mock tests)
- [x] faqs — FAQ management (hardcoded, no CRUD logic)
- [x] help-center — 5-tab docs hub (255 lines, should be split)
- [x] invoicing — invoice management (API fetch, no error handling)
- [x] kyc-verification — KYC review (detail panel always shows same client)
- [x] live-chat — chat interface (no Supabase Realtime)
- [x] notification-templates — SMS/Email templates (all mock)
- [x] partner-performance — leaderboard (hardcoded, no sort)
- [x] partners — partner directory (toast-only buttons)
- [x] performance-metrics — algorithm analytics (hardcoded heatmap)
- [x] plan-management — plan cards (hardcoded, no edit)
- [x] pnl-analytics — P&L charts (filters don't work)
- [x] tickets — support tickets (toast-only reply/resolve)
- [x] transaction-logs — payment history (hardcoded, no filter)
- [x] user-guidelines — doc management (search doesn't work)
- [x] user-roles — RBAC (hardcoded permissions, no enforcement)

---

## PART 9: CLIENT PAGES (8 pages)

### Common Patterns Across All Client Pages
- [ ] **PATTERN:** Same mock data + toast-only pattern as admin pages
- [ ] **PATTERN:** Custom SVG charts instead of chart library
- [ ] **PATTERN:** Uncontrolled form inputs (no value/onChange binding)

### Individual Pages Reviewed
- [x] dashboard — KPIs, performance chart (hardcoded datasets)
- [x] profile — KYC docs, password change (account type always "individual", file upload mock)
- [x] exchange-setup — Delta API setup (Math.random() test results, hardcoded IP)
- [x] invoices — invoice list (mixed mock+API, silent error on fetch)
- [x] pnl-analytics — P&L charts (period filter state unused, SVG paths hardcoded)
- [x] subscription — plan display (hardcoded plans, no real upgrade)
- [x] become-partner — application form (all inputs uncontrolled, no validation)
- [x] support — 5-tab support hub (all mock: tickets, guidelines, FAQs, contact)

---

## SUMMARY STATISTICS

| Category | Total | Issues Found |
|----------|-------|-------------|
| Config & Root | 8 files | 3 |
| Providers & Hooks | 7 files | 11 |
| Lib/Supabase | 7 files | 14 |
| Lib/Other | 5 files | 15 |
| Constants & Data | 11 files | 18 |
| API Routes | 34 files | 30+ |
| Components | 16 files | 14 |
| Auth Pages | 5 files | 12 |
| Admin Pages | 23 files | 22+ (patterns) |
| Client Pages | 8 files | 8+ (patterns) |
| **TOTAL** | **~124 files** | **~150+ issues** |

### By Severity
| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 4 | DigiLocker PKCE bypass, KYC no validation, partner auth gap |
| HIGH | 15+ | Race conditions, N+1 queries, missing validation, error handling |
| MEDIUM | 20+ | Authorization gaps, missing features, inconsistencies |
| LOW/PATTERN | 100+ | Mock data, toast-only buttons, unbound inputs, no loading states |

---

## PRIORITY ACTION ITEMS

### P0 — Security Fixes
1. Fix DigiLocker PKCE flow (store code_verifier server-side)
2. Add schema validation to KYC upload endpoint
3. Add role check to partner creation endpoint
4. Fix password validation (4 vs 8 char mismatch)

### P1 — Data Integrity
5. Fix invoice/ticket number generation (use DB sequences)
6. Add idempotency to webhook handler
7. Add null checks to payment webhook payload
8. Fix sendOtp() missing await

### P2 — Backend Quality
9. Add error handling to all API fetches (replace `.catch(() => {})`)
10. Fix N+1 queries (KYC queue, performance metrics)
11. Add missing auth schemas to validations
12. Add AbortController to useNotifications

### P3 — Frontend Quality
13. Add loading states to all auth forms
14. Bind modal/form inputs to component state
15. Make filters actually filter data
16. Add proper accessibility (aria attributes, keyboard nav)

### P4 — Architecture
17. Install test framework and add tests
18. Move hardcoded route maps from sidebar to constants
19. Consolidate color variant naming across components
20. Add Chart library instead of manual SVG
