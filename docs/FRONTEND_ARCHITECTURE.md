# AntMeta Platform -- Frontend Architecture

## 1. Routing Architecture

### App Router with Route Groups

The application uses Next.js App Router with two route groups that share the root layout but have distinct sub-layouts:

```
src/app/
├── layout.tsx          # Root: fonts, providers, toaster
├── page.tsx            # Redirect -> /login
├── globals.css         # Theme variables + Tailwind
├── (auth)/             # No sidebar, centered card layout
│   └── layout.tsx      # BackgroundEffects + theme toggle
└── (dashboard)/        # Sidebar + topbar layout
    └── layout.tsx      # Sidebar, Topbar, BackgroundEffects
```

### Root Layout Provider Stack

```tsx
<html>
  <body>
    <ThemeProvider>          // Dark/light mode via next-themes
      <AuthProvider>         // User state, login/logout/signup
        <SidebarProvider>    // Sidebar toggle state
          <TooltipProvider>  // Radix tooltip context
            {children}
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
      <Toaster />            // Sonner toast notifications
    </ThemeProvider>
  </body>
</html>
```

### Auth Layout
- Centered card (max-width 440px) with background effects
- Theme toggle button (fixed top-right)
- No sidebar or navigation

### Dashboard Layout
- Full-height flex layout: `Sidebar | Main Content`
- `Sidebar`: Fixed 280px width, collapsible on mobile
- `Topbar`: Sticky header with page title, breadcrumb, search, notifications, theme toggle, IST clock
- `Main`: Scrollable content area (max-width 1200px)

---

## 2. Pages Inventory

### Auth Pages (4)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | `LoginPage` | Dual-portal login (admin/client toggle) |
| `/signup` | `SignupPage` | Client registration (mobile, name, email, type, password) |
| `/verify-otp` | `VerifyOtpPage` | 6-digit OTP verification after signup |
| `/forgot-password` | `ForgotPasswordPage` | Password reset flow |

### Admin Pages (22)

| Section | Route | Page Title | Key Features |
|---------|-------|------------|--------------|
| **Main** | `/admin/dashboard` | Dashboard | KPI cards, AUM trend chart, master accounts, KYC queue, activity feed, recent invoices |
| **Operations** | `/admin/clients` | Client Directory | Searchable/filterable client table, add client modal with plan selection |
| | `/admin/kyc-verification` | KYC Verification | KPI cards, tabbed queue (all/individual/corporate), per-document review panel |
| | `/admin/partners` | Partners | Partner directory and performance |
| **Trading** | `/admin/exchange-setup` | Exchange Setup | Exchange API connection management |
| | `/admin/copy-trading` | Copy Trading | Master account -> client copy trade config |
| **Billing** | `/admin/plan-management` | Plan Management | Subscription plan CRUD |
| | `/admin/billing-cycles` | Billing Cycles (TraaS) | 90-day profit-sharing billing |
| | `/admin/invoicing` | Invoicing | Invoice generation and tracking |
| | `/admin/transaction-logs` | Transaction Logs | Payment transaction history |
| **Insights** | `/admin/pnl-analytics` | P&L Analytics | Profit/loss charts and breakdowns |
| | `/admin/performance-metrics` | Performance Metrics | Algorithm performance tracking |
| | `/admin/partner-performance` | Partner Performance | Partner ROI and referral metrics |
| **System** | `/admin/tickets` | Ticket Management | Support ticket queue |
| | `/admin/live-chat` | Live Chat | Real-time client support |
| | `/admin/help-center` | Help Center | Knowledge base management |
| | `/admin/user-guidelines` | User Guidelines | Platform usage documentation |
| | `/admin/faqs` | FAQs | FAQ management |
| | `/admin/user-roles` | User & Role Mgmt | Role-based access control |
| | `/admin/admin-security` | Admin Security (2FA) | Two-factor authentication setup |
| | `/admin/audit-logs` | Audit Logs | System activity logging |
| | `/admin/notification-templates` | Notification Templates | Email/SMS template management |

### Client Pages (8)

| Section | Route | Page Title | Key Features |
|---------|-------|------------|--------------|
| **Main** | `/client/dashboard` | Dashboard | KPI cards (P&L, return, drawdown, portfolio), current plan, quick actions, performance chart |
| **Account** | `/client/profile` | My Profile | Personal/corporate info, KYC status |
| | `/client/exchange-setup` | Exchange Setup | API key connection to exchanges |
| | `/client/subscription` | My Subscription | Current plan, upgrade, renewal |
| **Trading** | `/client/pnl-analytics` | P&L Analytics | Personal trading performance |
| | `/client/invoices` | Invoices | Invoice history and payments |
| **Help** | `/client/support` | Support | Ticket submission and chat |
| | `/client/become-partner` | Become a Partner | Partner program application |

---

## 3. Component Architecture

### Layout Components (`src/components/layout/`)

#### `Sidebar`
- Reads navigation config from `ADMIN_NAV` / `CLIENT_NAV` based on current path
- Collapsible groups with chevron rotation animation
- Badge indicators (warning=gold, danger=red)
- Mobile: slide-in overlay with backdrop
- Desktop: static 280px sidebar
- User chip with avatar, name, role, online indicator
- Logout button in footer

#### `Topbar`
- Dynamic page title from `TITLES` constant lookup
- Breadcrumb: `traders.antmeta.ai / {portal} / {title}`
- Search input (desktop only, cosmetic)
- Notification bell with red dot
- Theme toggle (sun/moon)
- IST clock (updates every second via `useClock`)

#### `BackgroundEffects`
- Two fixed overlays (z-0, pointer-events-none):
  1. Radial gradient background (dark: multi-stop, light: linear)
  2. 60px grid pattern overlay

### Shared Components (`src/components/shared/`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `KpiCard` | `value, label, sub?, color?` | Metric display card (e.g., "248 Total Clients") |
| `Panel` | `title, subtitle?, pip?, right?, topBar?, children` | Section container with colored pip indicator |
| `DataTable` | `headers, children` | Responsive table with header row |
| `Td` | `children, bold?, color?` | Table cell with styling variants |
| `StatusBadge` | `variant?, children` | Colored badge (ok/warn/bad/blue/purple/teal) |
| `Modal` | `open, onClose, title, children, width?` | Dialog overlay with backdrop blur |
| `FilterBar` | `children` | Horizontal flex container for filters |
| `FilterSelect` | `...select props` | Styled select dropdown |
| `FilterRight` | `children` | Right-aligned filter actions |
| `SearchInput` | `placeholder?, value?, onChange?` | Search field with icon |
| `TabSwitcher` | `tabs, active, onChange` | Segmented control tabs |
| `InfoGrid` | `items: [label, value, color?][]` | Two-column key-value grid |
| `UserAvatar` | `name, size?` | Gradient circle with initials |
| `ProgressBar` | `width, color?` | Animated progress indicator |
| `AlertBox` | `variant?, children` | Colored info/warning/error/success alert |

### Icon System (`src/components/icons/`)

Custom SVG icon component wrapping 16 icon definitions:

```
home, users, user, chart, bill, analytics, support, settings,
link, doc, star, search, bell, close, chevron, check, info, warn, logout
```

Usage: `<Icon name="home" size={16} className="..." />`

All icons use `stroke="currentColor"` for theme compatibility.

### UI Primitives (`src/components/ui/`)

Shadcn/UI components (New York style) built on Radix UI:

```
accordion, alert, avatar, badge, button, card, dialog,
dropdown-menu, input, label, progress, scroll-area, select,
separator, sheet, sonner, table, tabs, textarea, tooltip
```

---

## 4. State Management

### Auth State (`AuthProvider`)

```typescript
interface AuthContextValue {
  user: User | null;            // Current user object
  loginType: "admin" | "client"; // Portal selection
  setLoginType: (t) => void;
  login: (id, pw) => void;      // Mock login
  signup: (data) => boolean;     // Mock signup
  verifyOtp: (code) => void;     // Mock OTP verification
  logout: () => void;
  signupData: SignupData;        // Signup form state
  setSignupData: Dispatch;
  loginError: string;            // Error message
  setLoginError: (e) => void;
}
```

**Login flow:** Enter credentials -> basic validation -> create mock User -> redirect to dashboard
**Signup flow:** Fill form -> validate -> redirect to OTP page -> enter 6 digits -> create user -> redirect to client dashboard

### Sidebar State (`SidebarProvider`)

```typescript
interface SidebarContextValue {
  openNavItems: Record<string, boolean>;  // Which nav groups are expanded
  toggleNavItem: (id: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}
```

### Theme State
Managed by `next-themes` with `defaultTheme="dark"`. Toggle between `dark` and `light` class on `<html>`.

### Local Component State
Pages use `useState` for:
- Filter selections
- Modal open/close
- Tab active state
- Chart period/type selection
- Hover tooltips

No global state library (Redux, Zustand, etc.) is used.

---

## 5. Styling System

### CSS Variable Architecture

All colors are defined as CSS custom properties in `globals.css`:

**Light mode (`:root`):**
- Primary: `#0077A8` (teal-blue)
- Backgrounds: Light grays and whites
- Text: Dark slate hierarchy

**Dark mode (`.dark`):**
- Primary: `#0093B6` (brighter teal-blue)
- Backgrounds: Deep navy (`#04101E`)
- Text: Light blue-white hierarchy

### Tailwind Integration

CSS variables are bridged to Tailwind via `@theme inline`:
```css
--color-am-primary: var(--am-primary);
--color-am-bg-card: var(--am-bg-card);
/* ... 25+ custom color tokens */
```

This enables usage like: `bg-am-primary`, `text-am-text-3`, `border-am-border`

### Design Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--am-primary` | `#0077A8` | `#0093B6` | Primary actions, links, active states |
| `--am-accent` | `#00796B` | `#009688` | Teal accent, secondary actions |
| `--am-gold` | `#E8920A` | `#F4A020` | Warnings, pending states |
| `--am-danger` | `#DC2626` | `#EF4444` | Errors, destructive actions |
| `--am-success` | `#16A34A` | `#22C55E` | Success, positive P&L |
| `--am-purple` | `#7C3AED` | `#8B5CF6` | Special accents |
| `--am-secondary` | `#2E5A8F` | `#1E3A5F` | Secondary blue |

### Visual Effects
- **Glassmorphism:** `backdrop-blur-[10px]` + semi-transparent backgrounds on cards
- **Grid overlay:** 60px CSS grid pattern on dashboard background
- **Radial gradients:** Multi-stop radial backgrounds (dark mode)
- **Glow effects:** `shadow-[0_0_6px_var(--am-primary)]` on pip indicators
- **Smooth scrollbar:** Custom WebKit scrollbar (6px width, themed thumb)

---

## 6. Navigation Architecture

### Admin Navigation Structure

```
MAIN
  └── Dashboard

OPERATIONS
  ├── Customers
  │   ├── Client Directory
  │   ├── KYC Verification [badge: 12, gold]
  │   └── Partners
  └── Trading Operations
      ├── Exchange Setup
      └── Copy Trading

  Subscriptions & Billing
  ├── Plan Management
  ├── Billing Cycles (TraaS)
  ├── Invoicing
  └── Transaction Logs

INSIGHTS
  └── Analytics & Reporting
      ├── P&L Analytics
      ├── Performance Metrics
      └── Partner Performance

SYSTEM
  ├── Support [badge: 3, red]
  │   ├── Ticket Management
  │   ├── Live Chat
  │   ├── Help Center
  │   ├── User Guidelines
  │   └── FAQs
  └── System Settings
      ├── User & Role Management
      ├── Admin Security (2FA)
      ├── Audit Logs
      └── Notification Templates
```

### Client Navigation Structure

```
MAIN
  └── Dashboard

ACCOUNT
  ├── My Profile
  ├── Exchange Setup
  └── My Subscription

TRADING
  ├── P&L Analytics
  └── Invoices

HELP
  ├── Support [badge: 1, red]
  └── Become a Partner
```

---

## 7. Data Flow (Current Mock)

```
TypeScript mock data files (src/lib/data/)
    ↓
Imported directly by page components
    ↓
Rendered in DataTable/Panel/KpiCard components
    ↓
Actions (approve, reject, add) trigger toast notifications only
```

No data mutations persist. All actions are cosmetic (toasts).

---

## 8. Font Configuration

```tsx
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins"
});
```

- **Inter** (`font-sans`): Body text, labels, data
- **Poppins** (`font-poppins`): Headings, KPI values, brand text

Applied via CSS variable classes on `<body>`.
