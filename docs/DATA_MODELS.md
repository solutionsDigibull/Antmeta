# AntMeta Platform -- Data Models & Type Reference

## 1. Current TypeScript Interfaces

All types are defined in `src/lib/types/index.ts`.

### User

```typescript
interface User {
  name: string;          // Display name (e.g., "Raghav S.")
  role: string;          // Display role (e.g., "Super Admin", "Individual Client")
  type: "admin" | "client";  // Portal type
  id: string;            // User ID (e.g., "ADMIN001", "260116100001")
}
```

### Client

```typescript
interface Client {
  id: string;            // Client ID, format: 260116XXXXXX
  name: string;          // Full name or company name
  type: "individual" | "corporate";
  mob: string;           // Phone with country code (+91 XXXXXXXXXX)
  email: string;
  pan: string;           // PAN card number (Indian tax ID)
  plan: string;          // "Standard" | "Premium" | "Exclusive"
  kyc: "pending" | "verified" | "rejected";
  status: "active" | "pending" | "inactive";
  algo: string;          // Active algorithms (e.g., "M1 ALPHA", "M1+M2+M3")
  partner: string;       // Referring partner name or "None"
  aum: string;           // Assets under management (e.g., "Rs.4.2L")
  pnl: string;           // MTD P&L (e.g., "+Rs.38,400")
  joined: string;        // Join date (e.g., "15 Jan 2026")
}
```

### Master (Trading Algorithm)

```typescript
interface Master {
  id: string;            // M1, M2, M3
  name: string;          // Strategy name (ALPHA, DELTA, SIGMA)
  assets: string;        // Asset class (e.g., "BTC/ETH Futures")
  clients: number;       // Number of subscribed clients
  pnl: string;           // Total P&L (e.g., "+Rs.14.2L")
  status: "active" | "review";
  rate: string;          // Success rate percentage (e.g., "99%")
  trades: number;        // Total trades executed
}
```

### Partner

```typescript
interface Partner {
  id: string;            // P001, P002, etc.
  name: string;          // Partner/company name
  clients: number;       // Number of referred clients
  aum: string;           // Total AUM of referred clients
  pnl: string;           // Aggregate P&L
  rev: string;           // Revenue earned
  status: "active" | "review";
}
```

### Invoice

```typescript
interface Invoice {
  id: string;            // Format: INV-YYMM-XXX
  client: string;        // Client name
  amt: string;           // Invoice amount (e.g., "Rs.4,425")
  type: string;          // Plan type (e.g., "Standard", "Premium TraaS")
  status: "overdue" | "pending" | "paid";
  due: string;           // Due date (e.g., "10 Feb 2026")
}
```

### Ticket

```typescript
interface Ticket {
  id: string;            // Format: TKT-XXX
  client: string;        // Client name
  subj: string;          // Ticket subject
  pri: "high" | "medium" | "low";
  status: "open" | "resolved";
  time: string;          // Relative time (e.g., "2h ago")
}
```

### KYCItem

```typescript
interface KYCItem {
  id: string;            // Client ID or KYC queue ID
  name: string;          // Client name
  type: "individual" | "corporate";
  docs: string[];        // Document status list (e.g., ["PAN check", "Aadhaar pending"])
  time: string;          // Submission time (e.g., "2h ago")
}
```

### Navigation

```typescript
interface NavSubItem {
  id: string;            // Route identifier
  label: string;         // Display text
  badge?: number;        // Notification count
  bt?: "warn" | "bad";   // Badge type (gold or red)
}

interface NavItem {
  id: string;
  label: string;
  ico: string;           // Icon name (from Icon component)
  sec?: string;          // Section header (e.g., "MAIN", "OPERATIONS")
  sub?: NavSubItem[];    // Nested items (collapsible)
  badge?: number;
  bt?: "warn" | "bad";
}
```

### SignupData

```typescript
interface SignupData {
  mobile: string;        // 10-digit Indian mobile number
  name: string;          // Full name
  email: string;         // Optional email
  accountType: "individual" | "corporate";
  password: string;      // Min 8 characters
  confirmPw: string;     // Must match password
}
```

---

## 2. Mock Data Summary

### Clients (`src/lib/data/clients.ts`)

5 sample clients covering:
- Individual and corporate types
- All three plans (Standard, Premium, Exclusive)
- All KYC statuses (pending, verified, rejected)
- All activity statuses (active, pending, inactive)
- With and without partner referrals

| ID | Name | Type | Plan | KYC | Status |
|----|------|------|------|-----|--------|
| 260116100001 | Rajesh Kumar | Individual | Standard | Pending | Active |
| 260116100002 | TechCorp Pvt Ltd | Corporate | Premium | Verified | Active |
| 260116100003 | Priya Menon | Individual | Exclusive | Verified | Active |
| 260116100004 | Arun Ventures LLP | Corporate | Premium | Pending | Pending |
| 260116100005 | Kiran Sharma | Individual | Standard | Rejected | Inactive |

### Master Accounts (`src/lib/data/masters.ts`)

3 trading algorithms:

| ID | Name | Assets | Clients | P&L | Rate | Status |
|----|------|--------|---------|-----|------|--------|
| M1 | ALPHA Strategy | BTC/ETH Futures | 112 | +Rs.14.2L | 99% | Active |
| M2 | DELTA Strategy | BTC/ETH Options | 54 | -Rs.3.8L | 87% | Review |
| M3 | SIGMA Strategy | SOL/ETH Futures | 38 | +Rs.8.6L | 98% | Active |

### Partners (`src/lib/data/partners.ts`)

4 partner firms:

| ID | Name | Clients | AUM | Revenue | Status |
|----|------|---------|-----|---------|--------|
| P001 | FinEdge Advisors | 34 | Rs.1.12Cr | Rs.2.1L | Active |
| P002 | WealthArc Capital | 28 | Rs.94.6L | Rs.1.52L | Active |
| P003 | CryptoEdge Mumbai | 22 | Rs.78.2L | Rs.0 | Review |
| P004 | AlgoTrade Bangalore | 18 | Rs.62.4L | Rs.97K | Active |

### Invoices (`src/lib/data/invoices.ts`)

4 sample invoices covering all statuses:

| ID | Client | Amount | Type | Status |
|----|--------|--------|------|--------|
| INV-2602-023 | Rajesh Kumar | Rs.4,425 | Standard | Overdue |
| INV-2602-024 | TechCorp Pvt | Rs.32,250 | Premium TraaS | Pending |
| INV-2602-025 | Priya Menon | Rs.8,850 | Exclusive | Paid |
| INV-2602-026 | Arun Ventures | Rs.12,600 | Premium | Overdue |

### KYC Queue (`src/lib/data/kyc-queue.ts`)

4 pending KYC reviews:

| ID | Name | Type | Documents | Time |
|----|------|------|-----------|------|
| 260116100001 | Rajesh Kumar | Individual | PAN (done), Aadhaar (pending) | 2h ago |
| 260116100004 | Arun Ventures LLP | Corporate | Cert, Co PAN (done), Dir PAN, GST, MOA (pending) | 5h ago |
| KYC006 | Preethi Nair | Individual | PAN, Aadhaar (done) | 8h ago |
| KYC007 | Sunrise Fintech | Corporate | Cert, Co PAN, Dir PAN, GST (done), MOA (pending) | 12h ago |

### Tickets (`src/lib/data/tickets.ts`)

4 support tickets:

| ID | Client | Subject | Priority | Status |
|----|--------|---------|----------|--------|
| TKT-001 | Rajesh Kumar | Copy trade not activating | High | Open |
| TKT-002 | TechCorp Pvt | GST invoice not downloading | Medium | Open |
| TKT-003 | Priya Menon | API key connection error | High | Open |
| TKT-004 | Kiran Sharma | KYC document rejected | Low | Resolved |

### Navigation (`src/lib/data/navigation.ts`)

Two navigation configs:
- `ADMIN_NAV`: 7 top-level items with 22 sub-items across sections (MAIN, OPERATIONS, INSIGHTS, SYSTEM)
- `CLIENT_NAV`: 8 flat items across sections (MAIN, ACCOUNT, TRADING, HELP)

---

## 3. Constants

### Routes (`src/lib/constants/routes.ts`)

All application routes as a typed constant object:
- 4 auth routes
- 22 admin routes (namespaced under `ROUTES.ADMIN`)
- 8 client routes (namespaced under `ROUTES.CLIENT`)

### Plans (`src/lib/constants/plans.ts`)

3 subscription plan definitions with name, price, algorithm access, and feature lists.

### Screen Titles (`src/lib/constants/screen-titles.ts`)

Route-to-title mapping for 30 dashboard pages, used by the Topbar component.

---

## 4. Indian-Specific Formatting

| Format | Example | Context |
|--------|---------|---------|
| Currency | Rs.4,500 | Indian Rupee symbol |
| Lakhs | Rs.4.2L | 1L = Rs.1,00,000 |
| Crores | Rs.4.82Cr | 1Cr = Rs.1,00,00,000 |
| PAN | ABCDE1234F | 10-char alphanumeric |
| Phone | +91 9876543210 | Indian country code |
| GST | Applied on invoices | Goods and Services Tax |
| Aadhaar | 12-digit UID | National identity number |
