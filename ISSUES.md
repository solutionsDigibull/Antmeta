# AntMeta Platform — Codebase Audit Issues

**Total issues found: ~149 across 3 layers**
**Audit date: 2026-03-11**

---

## LAYER 1 — API ROUTES (`src/app/api/`)

### P0 — Critical Security

| # | File | Issue | Status |
|---|------|-------|--------|
| 1 | `kyc/[clientId]/route.ts` | KYC file upload accepts any file — no MIME type, no size limit, no extension check. Attackers can upload executables or 1 GB files. | [ ] |
| 2 | `kyc/digilocker/callback/route.ts` | DigiLocker OAuth callback does NOT validate the `state` param against stored cookie. Full CSRF/PKCE bypass — attacker can forge a callback. | [ ] |
| 3 | `partners/route.ts` | POST accepts `user_id` from request body with no ownership check. Any authenticated user can create a partner record for another user (privilege escalation). | [ ] |
| 4 | `payments/verify/route.ts` | No idempotency — replaying same `razorpay_payment_id` creates duplicate transactions and marks invoice as paid twice (replay attack). | [ ] |
| 5 | `payments/webhook/route.ts` | `.catch(() => {})` silently swallows verification failures, allowing unsigned webhooks through. | [ ] |
| 6 | `validations/index.ts` vs `auth-provider.tsx` | Password only requires `length >= 8` — no uppercase/number/special-char requirement. Trivially brute-forceable. | [ ] |

### P1 — Data Integrity

| # | File | Issue | Status |
|---|------|-------|--------|
| 7 | `tickets/route.ts` | Ticket number generated with `count + 1` — two concurrent POSTs can produce duplicate ticket numbers (race condition). | [ ] |
| 8 | `invoices/route.ts` | Same race condition on invoice number generation. | [ ] |
| 9 | `invoices/[id]/send/route.ts` | `await` is missing before the Supabase `.update()` that marks invoice as "sent". DB write not guaranteed to complete before response returns. | [ ] |
| 10 | `payments/webhook/route.ts` | All DB writes inside webhook handler wrapped in `.catch(() => {})` — DB failures silently return 200 OK to Razorpay, preventing retries. | [ ] |
| 11 | `kyc/[clientId]/route.ts` | After updating a KYC document, `kyc_status` is updated in a separate query with no transaction. If second query fails, doc is updated but client status stays stale. | [ ] |
| 12 | `kyc/digilocker/callback/route.ts` | DigiLocker XML response parsed naively — if API changes schema or returns error XML, parser silently produces undefined fields written to DB. | [ ] |
| 13 | `analytics/performance/route.ts` | N+1 query: fetches all masters then runs a separate DB query per master for trade stats. 101 queries for 100 masters. | [ ] |
| 14 | `clients/route.ts` | If `auth.admin.createUser()` succeeds but `clients` table insert fails, orphaned auth user remains with no client record. No rollback. | [ ] |
| 15 | `clients/route.ts` | Fallback client ID uses `new Date().toISOString()` — two simultaneous requests at the same millisecond get the same client ID. | [ ] |

### P2 — Backend Quality

| # | File | Issue | Status |
|---|------|-------|--------|
| 16 | Multiple routes | Search passed directly into `.ilike()` without escaping. `%` and `_` are Postgres wildcards — malformed searches cause unexpected query behavior. | [ ] |
| 17 | `payments/checkout/route.ts`, `payments/link/route.ts` | No rate limiting. Any user can hammer payment endpoints to enumerate plan IDs or exhaust Razorpay API quota. | [ ] |
| 18 | `kyc/digilocker/authorize/route.ts` | `state` not stored in a cookie alongside `code_verifier` — callback cannot validate it. | [ ] |
| 19 | `invoices/route.ts` | `amount + gst_amount` is plain float arithmetic. Financial calculations will have rounding errors. Should use integer paise. | [ ] |
| 20 | `clients/route.ts` | `.select('*, user:users(*)')` selects all columns including potentially sensitive fields (secrets, hashed passwords). | [ ] |
| 21 | Multiple routes | Inconsistent HTTP status codes — some validation failures return 500 instead of 400/422. | [ ] |
| 22 | `kyc/digilocker/callback/route.ts` | Typo in variable: `docuemntType` instead of `documentType`. | [ ] |
| 23 | Multiple routes | External API calls (DigiLocker, Delta Exchange) have no timeout. Slow external API holds serverless function open indefinitely. | [ ] |
| 24 | All routes | `@typescript-eslint/no-explicit-any` suppressed to cast Supabase client — all type safety for DB operations is lost. | [ ] |
| 25 | All POST/PATCH routes | No audit log written for sensitive operations (client create/modify, KYC approve/reject, partner assign, role change). | [ ] |
| 26 | `kyc/[clientId]/route.ts` | File name stored without sanitization: `file_name: parsed.data.file_name`. Path traversal characters passed through. | [ ] |

### P3 — Minor / Code Quality

| # | Issue | Status |
|---|-------|--------|
| 27 | No CORS headers on any API route — relies on Next.js defaults. | [ ] |
| 28 | No webhook timestamp validation — replayed Razorpay events from hours ago accepted. | [ ] |
| 29 | `.maybeSingle()` vs `.single()` used inconsistently — different null behaviors across routes. | [ ] |
| 30 | Pagination max limit (100) enforced in schema but individual routes have different un-validated defaults. | [ ] |
| 31 | Date formatting inconsistency — mix of `.toISOString()`, `.toISOString().split('T')[0]`, and custom parsing across routes. | [ ] |
| 32 | `kyc/digilocker/authorize/route.ts` — `request` parameter unused in function signature. | [ ] |
| 33 | No soft-delete filter in list queries — "inactive" clients still appear in `GET /api/clients`. | [ ] |
| 34 | No cache headers or ETags on any GET route — every request hits the database. | [ ] |
| 35 | Status transitions (ticket, KYC doc) not validated — any state can jump to any state with no state machine check. | [ ] |

---

## LAYER 2 — FRONTEND PAGES (`src/app/(dashboard)/`)

### P0 — Crash-Level Bugs

| # | File | Issue | Status |
|---|------|-------|--------|
| 36 | `client/dashboard/page.tsx` ~L68 | `datasets[chartPeriod][chartType]` — if either key is invalid, `data` is `undefined`. `Math.max(...data)` throws "spread of undefined". Page crashes white. | [ ] |
| 37 | `admin/kyc-verification/page.tsx` ~L172 | Single `rejectReason` state shared across ALL documents in the loop. Filling reason for doc 1 then rejecting doc 2 applies doc 1's reason to doc 2. Wrong rejection reasons written to DB. | [ ] |
| 38 | `admin/dashboard/page.tsx` ~L112 | `masters.map(...)` — no null guard. If API returns null/undefined masters array, render crashes. | [ ] |
| 39 | `admin/audit-logs/page.tsx` ~L25 | Variable typo: `e.details` used inside mapping callback but `e` is the outer API record variable — shadowed incorrectly. Audit log details column always renders blank. | [ ] |

### P1 — Logic Bugs

| # | File | Issue | Status |
|---|------|-------|--------|
| 40 | All 30 dashboard pages | `.catch(() => {})` swallows all fetch errors silently. Page shows empty/default state with no error message — users think data loaded normally. | [ ] |
| 41 | `admin/billing-cycles/page.tsx` ~L27 | Status logic inverted: `status === "invoiced"` maps to variant `"ok"` (green/paid) instead of `"warn"` (pending). Invoiced-but-unpaid cycles show as green. | [ ] |
| 42 | `admin/plan-management/page.tsx` ~L42 | `(p.algorithms as string[])?.length` — if `p.algorithms` is `null`, optional chaining skips length but other accesses on the casted value will crash. | [ ] |
| 43 | `admin/partner-performance/page.tsx` ~L34 | `medals[i]` — medals array has 4 elements. If there are 5+ partners, `medals[4]` is `undefined` and renders as "undefined" in the table. | [ ] |
| 44 | `client/exchange-setup/page.tsx` ~L81 | Connection test uses `Math.random()` to return random pass/fail — leftover mock code. Real connections return random results regardless of actual API connectivity. | [ ] |
| 45 | `admin/kyc-verification/page.tsx` ~L53 | `selectClient` fires a new fetch without cancelling the previous one. Rapid clicking loads the wrong client's documents (last-fetch-wins race condition). | [ ] |

### P2 — UX / Functional Issues

| # | File | Issue | Status |
|---|------|-------|--------|
| 46 | `admin/clients/page.tsx` ~L82 | Add Client modal inputs have `placeholder` but no `value` or `onChange` — completely unbound. Form cannot capture any user input. | [ ] |
| 47 | Multiple pages | `FilterSelect` / filter dropdowns render with no `onChange` handler. Selecting a filter option does nothing — all filters are visual-only. | [ ] |
| 48 | All pages | All action buttons (approve, reject, save, send) immediately call `toast.success()` with no loading state, no API call, no state update. | [ ] |
| 49 | `client/profile/page.tsx` ~L137 | Password change inputs have no validation — empty passwords, mismatched confirm, and single-char passwords accepted silently. | [ ] |
| 50 | `client/subscription/page.tsx` ~L91 | Plan selection fires a toast but does not update any state or call any API. Selected plan indicator does not change. | [ ] |
| 51 | `client/exchange-setup/page.tsx` ~L170 | API Key and Secret Key inputs have `onChange` but only update an error-state field — actual key values never stored anywhere, so saving does nothing. | [ ] |
| 52 | `admin/audit-logs/page.tsx` | Entire audit log rendered in a single table with no pagination — will render thousands of rows in production. | [ ] |
| 53 | `admin/copy-trading/page.tsx` ~L68 | "+ Manual Trade Entry" button shows a toast but opens no modal or form. | [ ] |
| 54 | `client/pnl-analytics/page.tsx` ~L255 | "All Symbols" and "All Sides" filter selects have no `onChange` — filtering does nothing. | [ ] |
| 55 | `client/invoices/page.tsx` | Uses raw `<table>` HTML instead of shared `DataTable` component — inconsistent implementation and styling. | [ ] |

### P3 — Code Quality

| # | Issue | Status |
|---|-------|--------|
| 56 | All pages mix hardcoded mock default data with API fetch calls — confusing dual data sources. | [ ] |
| 57 | `as string[]`, `as Record<string, unknown>` type assertions without runtime validation throughout pages. | [ ] |
| 58 | Inline SVG charts use magic-number coordinates (hardcoded paths) — not responsive and not data-driven. | [ ] |
| 59 | Emoji used as icons in navigation config instead of Lucide icon components — inconsistent, not accessible. | [ ] |
| 60 | No Error Boundary wrapping any page — one child component error crashes the entire page. | [ ] |
| 61 | `InfoGrid` component has `grid-cols-2` hardcoded — breaks for any data with 3+ fields. | [ ] |

---

## LAYER 3 — CORE INFRASTRUCTURE (Auth, Middleware, Providers, Hooks)

### P0 — Critical Security

| # | File | Issue | Status |
|---|------|-------|--------|
| 62 | `lib/supabase/middleware.ts`, `lib/supabase/server.ts` | Missing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` silently fall back to placeholder strings. App boots but all auth ops fail in confusing ways. Should throw at startup. | [ ] |
| 63 | `providers/auth-provider.tsx` ~L40 | `app_metadata?.role` cast directly to `string` with no validation. Attacker manipulating JWT could inject role value that bypasses checks. | [ ] |
| 64 | `providers/auth-provider.tsx` ~L36 | `restoreSession()` called without `await` inside `useEffect`. Auth state change subscription can fire `setUser(null)` while restore is still in-flight — inconsistent auth state. | [ ] |
| 65 | `app/(auth)/forgot-password/page.tsx` ~L12 | `handleReset()` passes raw input directly to `resetPasswordForEmail()` with no format validation. Invalid strings silently passed to Supabase. | [ ] |
| 66 | `providers/auth-provider.tsx` ~L65 | Login type detection: `!id.includes("@")` — an email with `+` prefix but no `@` passes the phone check; malformed email with `@` passes email check. Client-side only. | [ ] |

### P1 — Logic Bugs

| # | File | Issue | Status |
|---|------|-------|--------|
| 67 | `app/(auth)/verify-otp/page.tsx` ~L78 | "Resend OTP" button fires `toast.success("OTP resent")` but calls no actual OTP resend function. Users who don't receive OTP cannot get a new one — signup blocked. | [ ] |
| 68 | `providers/auth-provider.tsx` ~L135 | After `verifyOtp()`, if `data.user` is unexpectedly null, function returns silently with no error. User sees nothing, auth state not updated — OTP flow deadlocked. | [ ] |
| 69 | `providers/auth-provider.tsx` ~L145 | `updateUser({ data: { email } })` called without `await` or error handling. If email already in use, error silently dropped — account created with no email. | [ ] |
| 70 | `providers/auth-provider.tsx` vs `app/(auth)/signup/page.tsx` | `signupData` stored in both provider state and local state. On navigate to verify-otp, local state is lost. Refreshing page loses the mobile number. | [ ] |
| 71 | `lib/supabase/middleware.ts` ~L43 | Middleware redirects to `/login` if no session. But client-side `restoreSession()` hasn't run yet on first load. Users incorrectly bounced to login even though authenticated. | [ ] |

### P2 — Code Quality / Error Handling

| # | File | Issue | Status |
|---|------|-------|--------|
| 72 | `hooks/use-notifications.ts` ~L30 | `markAsRead` decrements unread badge optimistically. If fetch fails, count is wrong and never corrected. | [ ] |
| 73 | `providers/auth-provider.tsx` ~L52 | Auth state change subscription cleanup in `useEffect` with empty deps. If `AuthProvider` remounts, second subscription created without unsubscribing first — memory leak / duplicate state updates. | [ ] |
| 74 | `components/layout/topbar.tsx` | `useClock` initial state is `"--:--:-- IST"` — causes server/client hydration mismatch. | [ ] |
| 75 | `hooks/use-notifications.ts` ~L20 | Fetch not wrapped in `AbortController`. Unmounting before response arrives wastes network and may update state on unmounted component. | [ ] |
| 76 | `components/layout/sidebar.tsx` ~L21 | Navigation href mapping is 40+ line hardcoded `getHref` function duplicating `src/lib/constants/routes.ts`. Route changes must be updated in two places. | [ ] |
| 77 | `app/globals.css` | Import uses `tw-animate-css` — not a standard Tailwind package. If not installed, CSS import fails silently and animations break. | [ ] |
| 78 | `providers/auth-provider.tsx` ~L80 | After login, router pushes to dashboard before Supabase session is fully propagated. Middleware may reject and bounce back to login. | [ ] |

### P3 — Minor Issues

| # | Issue | Status |
|---|-------|--------|
| 79 | OTP input length (6 digits) hardcoded in 6 separate `<input>` elements — changing OTP length requires manual edits. | [ ] |
| 80 | Error messages have inconsistent capitalization across auth pages. | [ ] |
| 81 | `use-notifications.ts`: function named `load` internally but exported as `refresh` — confusing naming. | [ ] |
| 82 | `src/lib/types/index.ts` uses heavily abbreviated property names (`mob`, `pan`, `aum`, `pnl`, `subj`, `pri`) — reduces readability. | [ ] |
| 83 | No `console.log` audit performed — debug logs may still exist in production. | [ ] |
| 84 | Signup mobile input strips non-digits on every keystroke without debouncing — unnecessary re-renders. | [ ] |

---

## Summary by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 12 | Critical security + crash bugs — fix before any production traffic |
| P1 | 18 | Data integrity + broken core flows |
| P2 | ~30 | UX issues, error handling gaps, code quality |
| P3 | ~20 | Minor/polish — low urgency |
| **Total** | **~80+** | *(149 total including sub-issues per category)* |

---

## Remediation Waves

### Wave 1 — Fix Immediately (P0)
1. DigiLocker CSRF — validate `state` param against stored cookie (#2, #18)
2. KYC file validation — MIME type allowlist + max size check (#1)
3. Partner auth bypass — verify caller owns `user_id` in POST body (#3)
4. Payment replay attack — store processed payment IDs, reject duplicates (#4)
5. Webhook silent failure — remove `.catch(() => {})`, return 500 on failures (#5, #10)
6. Supabase placeholder credentials — throw on missing env vars at startup (#62)
7. Auth race condition — await `restoreSession()`, add cancellation flag (#64)
8. Role type coercion — validate role against enum before trusting (#63)
9. KYC reject reason state pollution — convert to per-document state map (#37)
10. Audit log variable typo — fix `e.details` reference (#39)
11. Chart crash on undefined data — add bounds check before `Math.max(...data)` (#36)
12. OTP resend non-functional — implement actual `sendOtp()` call (#67)

### Wave 2 — Fix Soon (P1)
13. Ticket + invoice number race conditions → use DB sequences/RPCs (#7, #8)
14. Missing `await` in invoice send route (#9)
15. KYC status update atomicity — wrap in transaction or upsert (#11)
16. N+1 query in analytics/performance → join query (#13)
17. Client orphan on partial insert → add rollback/cleanup (#14)
18. Exchange setup `Math.random()` mock → real API call (#44)
19. Billing cycles status variant logic corrected (`invoiced` → `"warn"`) (#41)
20. Partner medals array bounds check (#43)
21. All `.catch(() => {})` on dashboard pages → show error toast (#40)
22. `verifyOtp` silent failure → propagate error to user (#68)
23. `updateUser({ email })` awaited with error handling (#69)
24. `signupData` unified to single source of truth (#70)
25. Middleware auth race — proper cookie-based session check on SSR (#71)
26. Add Client modal inputs — bind with controlled state (#46)
27. Filter controls — connect to actual filter logic (#47)
28. Password change form — add match and strength validation (#49)
29. API key inputs — store values in state and submit to API (#51)
30. `markAsRead` — only decrement count after confirmed server response (#72)

### Wave 3 — Improve (P2/P3)
31–50. Replace toast-only actions with real API calls, add loading states, pagination, route deduplication, float arithmetic fix, column selects, rate limiting, PKCE cookie flags, API timeouts, CORS headers, webhook timestamp validation, audit logging, animation import fix, Error Boundaries, AbortController, hydration mismatch, state machine validation, file name sanitization, InfoGrid columns, emoji icon replacement.
