# AntMeta Platform — Bug Report

**Date:** 2026-04-03  
**Tester:** Claude Code (Playwright MCP automated browser test)  
**Environment:** `http://localhost:3000` — Next.js 16 dev server, Windows 11  
**Branch:** `main`  
**Supabase Project:** `thnwxsbuewjsdqlettni.supabase.co`  
**Test Users Created:**
- Admin: `testadmin@antmeta.ai` / `TestAdmin@123` (role: `admin`)
- Client: `testclient@antmeta.ai` / `TestClient@123` (role: `client`)

---

## Summary

| # | Severity | Area | Title | Status |
|---|---|---|---|---|
| 1 | Medium | Admin UI | Wrong topbar title on `/admin/masters` | ✅ Fixed 2026-04-03 |
| 2 | Medium | Admin UI | Wrong topbar title on `/admin/invoices` | ✅ Fixed 2026-04-03 |
| 3 | High | Mobile | Dashboard layout broken on mobile viewports | ✅ Fixed 2026-04-03 |
| 4 | Low | API | `/api/clients/me` returns 404 for users with no DB profile record | ✅ Fixed 2026-04-03 |
| 5 | Critical | Security | Client-role users can access the entire admin portal | ✅ Fixed 2026-04-03 |
| 6 | Low | Admin UI | `/admin/notification-templates` shows blank body with no empty state | ✅ Fixed 2026-04-03 |

---

## Bug Details

---

### Bug #1 — Wrong Topbar Title on `/admin/masters`

**Severity:** Medium  
**Status:** Open  
**Reported:** 2026-04-03

**Description:**  
Navigating to `/admin/masters` renders the correct page content (Master Accounts table), but the topbar heading and breadcrumb display "Dashboard" instead of the expected "Masters" or "Master Accounts".

**Steps to Reproduce:**
1. Log in as admin
2. Navigate to `/admin/masters`
3. Observe the topbar heading

**Expected:** Topbar shows `Master Accounts`  
**Actual:** Topbar shows `Dashboard`

**Root Cause:**  
The route `/admin/masters` is missing from the `TITLES` map.

**Affected File:**  
`src/lib/constants/screen-titles.ts` — missing entry `"/admin/masters": "Master Accounts"`

**Fix:**  
Add to `TITLES`:
```ts
"/admin/masters": "Master Accounts",
```

---

### Bug #2 — Wrong Topbar Title on `/admin/invoices`

**Severity:** Medium  
**Status:** Open  
**Reported:** 2026-04-03

**Description:**  
Navigating to `/admin/invoices` renders the correct page content (Invoices list), but the topbar heading and breadcrumb display "Dashboard" instead of "Invoices".

**Steps to Reproduce:**
1. Log in as admin
2. Navigate to `/admin/invoices`
3. Observe the topbar heading

**Expected:** Topbar shows `Invoices`  
**Actual:** Topbar shows `Dashboard`

**Root Cause:**  
The route `/admin/invoices` is missing from the `TITLES` map. (Note: `/admin/invoicing` is present, but `/admin/invoices` is a separate route and is absent.)

**Affected File:**  
`src/lib/constants/screen-titles.ts` — missing entry `"/admin/invoices": "Invoices"`

**Fix:**  
Add to `TITLES`:
```ts
"/admin/invoices": "Invoices",
```

---

### Bug #3 — Dashboard Layout Broken on Mobile Viewports

**Severity:** High  
**Status:** Open  
**Reported:** 2026-04-03

**Description:**  
On mobile viewports (tested at 375×812), all dashboard pages (both `/admin/*` and `/client/*`) show a severely broken layout. The main content is pushed to the far right of the screen, with approximately 60% of the viewport being an empty black/dark space on the left. The sidebar is `fixed` positioned and does not collapse off-screen — it occupies the left space even when `mobileMenuOpen` is `false`.

**Steps to Reproduce:**
1. Log in as client
2. Resize browser to 375px wide (or use mobile DevTools)
3. Navigate to `/client/dashboard`
4. Observe layout

**Expected:** Sidebar hidden off-screen on mobile; main content fills full viewport width  
**Actual:** Sidebar occupies ~280px on the left as invisible dead space; content crammed on right

**Root Cause:**  
The dashboard layout wrapper (`src/app/(dashboard)/layout.tsx`) uses `flex h-screen` with a `Sidebar` component. The `<aside>` in `sidebar.tsx` is `fixed md:static`. On mobile, when the sidebar is `fixed` and translated off-screen (`-translate-x-full`), the `flex-1` main content div still believes the sidebar occupies 280px of horizontal space because the layout uses `flex` with no responsive width correction on the content pane.

**Affected Files:**
- `src/app/(dashboard)/layout.tsx` — main layout wrapper
- `src/components/layout/sidebar.tsx` — aside element (line 82)

**Fix:**  
In `layout.tsx`, the content wrapper needs `w-full` on mobile since the sidebar is `fixed` (not in flow) on small screens:
```tsx
<div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
```
In `sidebar.tsx`, the `<aside>` is already `fixed md:static` — this is correct. The issue is the parent flex container treats it as in-flow on desktop (correct via `md:static`) but the content div doesn't compensate for mobile. Adding `md:pl-0` is not needed since the sidebar is `fixed` on mobile — the real fix is ensuring the content div does not inherit a left offset. Verify no `ml-[280px]` or padding-left is applied at mobile breakpoints.

---

### Bug #4 — `/api/clients/me` Returns 404 for Users Without a DB Profile Record

**Severity:** Low  
**Status:** Open  
**Reported:** 2026-04-03

**Description:**  
Three client-facing pages (`/client/profile`, `/client/support`, `/client/become-partner`) trigger a `GET /api/clients/me` request that returns `404 Not Found` when the authenticated user has no corresponding record in the `public.clients` table. This generates console errors and may cause blank/broken UI states on those pages.

**Steps to Reproduce:**
1. Create a Supabase auth user directly (bypassing the normal signup → OTP → complete-profile flow)
2. Log in as that user
3. Navigate to `/client/profile`
4. Open DevTools → Console — observe `404` error

**Expected:** API returns a minimal profile or graceful empty state  
**Actual:** API returns 404, triggering console errors and leaving Name/Email fields blank on the profile page

**Root Cause:**  
The `/api/clients/me` route queries `public.clients` by `user_id`. If the `complete-profile` step was skipped (e.g. the user was created directly via Supabase admin API, or the profile completion step failed silently), no row exists — the API returns 404 instead of a graceful empty response.

**Affected Files:**
- `src/app/api/clients/me/route.ts` — returns 404 when no record found
- `src/app/api/auth/complete-profile/route.ts` — must always create the clients record on signup

**Fix:**  
In `/api/clients/me`, when no client row is found, return a `200` with a minimal empty profile object rather than `404`:
```ts
if (!client) {
  return NextResponse.json({ id: null, name: null, email: user.email, kyc_status: "pending" }, { status: 200 });
}
```
Also add error handling in `complete-profile` to retry or log failures so the client record is always created.

---

### Bug #5 — Client-Role Users Can Access the Entire Admin Portal (CRITICAL SECURITY)

**Severity:** Critical  
**Status:** Open  
**Reported:** 2026-04-03

**Description:**  
A user authenticated with `role: "client"` in `app_metadata` can navigate directly to any `/admin/*` route and view the full admin dashboard, client directory, KYC queue, billing, analytics, and all other admin pages — with no redirect or access denial. There is no role-based route guard protecting the admin portal.

**Steps to Reproduce:**
1. Log in as a client user (e.g. `testclient@antmeta.ai`)
2. Directly navigate to `http://localhost:3000/admin/dashboard`
3. Observe — full admin dashboard renders with all data visible

**Expected:** Client users are redirected to `/client/dashboard` when attempting to access `/admin/*` routes  
**Actual:** Full admin portal is accessible — client user sees all 248 clients, KYC queue, AUM data, billing cycles, etc.

**Root Cause:**  
`src/app/(dashboard)/layout.tsx` has no role check — it renders `<Sidebar>` and `{children}` for any authenticated user. The sidebar does switch nav configs based on `pathname.startsWith("/admin")` (a URL check in `sidebar.tsx` line 18), but this is purely cosmetic. There is no server-side or client-side guard that validates the user's role before rendering admin page content.

**Affected Files:**
- `src/app/(dashboard)/layout.tsx` — needs role guard
- `src/components/layout/sidebar.tsx` — role-based nav is cosmetic only (line 18)
- Optionally: `src/middleware.ts` (if it exists) — ideal place for server-side role enforcement

**Fix:**  
Add a role check in `layout.tsx`. Using the `useAuth()` hook, redirect to `/client/dashboard` if a non-admin user lands on an `/admin/*` path:
```tsx
const { user } = useAuth();
const pathname = usePathname();
const router = useRouter();

useEffect(() => {
  if (!user) return;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdmin = ["admin", "super_admin", "support"].includes(user.role);
  if (isAdminRoute && !isAdmin) {
    router.replace("/client/dashboard");
  }
}, [user, pathname]);
```
For stronger enforcement, also add this check in Next.js middleware (`middleware.ts`) to block at the server level before the page renders.

---

### Bug #6 — Notification Templates Page Shows Blank Body (No Empty State)

**Severity:** Low  
**Status:** Open  
**Reported:** 2026-04-03

**Description:**  
The `/admin/notification-templates` page renders with only the topbar, sidebar, and a "+ New Template" button. The main content area is completely empty — no template list, no loading spinner, and no empty state message to guide the user.

**Steps to Reproduce:**
1. Log in as admin
2. Navigate to `/admin/notification-templates`
3. Observe the main content area below the "+ New Template" button

**Expected:** Either a list of templates, or an empty state (e.g. "No templates yet. Click '+ New Template' to create one.")  
**Actual:** Blank dark content area with no feedback

**Root Cause:**  
The page component likely renders an empty array from the API with no conditional empty state UI. The `GET /api/notification-templates` either returns an empty array or the component lacks a fallback render when `templates.length === 0`.

**Affected File:**  
`src/app/(dashboard)/admin/notification-templates/page.tsx`

**Fix:**  
Add an empty state block:
```tsx
{templates.length === 0 && (
  <div className="text-center py-16 text-am-text-3">
    No templates yet. Click &quot;+ New Template&quot; to create your first one.
  </div>
)}
```

---

## Fix Priority Order

| Priority | Bug | Reason |
|---|---|---|
| 1 | **#5 Security** | Client users can view all admin data — fix immediately |
| 2 | **#3 Mobile layout** | Affects all users on phones — high visibility |
| 3 | **#1 & #2 Topbar titles** | Quick one-line fixes, polish |
| 4 | **#4 API 404** | Low impact but can cause confusion for real users |
| 5 | **#6 Empty state** | UX polish — low urgency |

---

## Test Environment Notes

- SMTP is using placeholder credentials (`your-email@gmail.com`) — OTP emails will not send in current state
- Razorpay keys not yet configured — payment flows untested
- Master accounts table is empty — copy-trading pages show "No master accounts found"
- `public.clients` table has no records for test users (created via Supabase admin API, bypassing normal signup flow)
