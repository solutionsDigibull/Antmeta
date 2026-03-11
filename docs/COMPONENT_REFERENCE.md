# AntMeta Platform -- Component Reference

## 1. Layout Components

### `Sidebar` (`src/components/layout/sidebar.tsx`)

The main navigation sidebar. Renders admin or client navigation based on current path.

**Behavior:**
- Desktop: Static 280px sidebar, always visible
- Mobile: Hidden by default, slides in from left with backdrop overlay
- Navigation items can be flat (single page) or grouped (collapsible with sub-items)
- Active state determined by current pathname match
- User chip displays avatar, name, role, and online indicator
- Logout button in footer

**Dependencies:** `useAuth`, `useSidebar`, `ADMIN_NAV`, `CLIENT_NAV`, `Icon`, `UserAvatar`

---

### `Topbar` (`src/components/layout/topbar.tsx`)

Sticky header bar displayed on all dashboard pages.

**Features:**
- Mobile hamburger menu button
- Dynamic page title (from `TITLES` constant)
- Breadcrumb path: `traders.antmeta.ai / {portal} / {title}`
- Search input (desktop only, currently cosmetic)
- Notification bell with red dot indicator
- Theme toggle (dark/light)
- IST clock (live, updates every second)

**Dependencies:** `useAuth`, `useSidebar`, `useClock`, `TITLES`, `Icon`

---

### `BackgroundEffects` (`src/components/layout/background-effects.tsx`)

Fixed background overlay applied to both auth and dashboard layouts.

**Renders:**
1. Radial gradient background using `--am-radial-bg` CSS variable
2. 60px grid pattern using CSS `linear-gradient` lines

Both layers are fixed position, z-index 0, pointer-events none.

---

## 2. Shared Components

### `KpiCard` (`src/components/shared/kpi-card.tsx`)

Large metric display card used for dashboard KPIs.

```tsx
<KpiCard
  value="248"              // Large display value (Poppins, 32px)
  label="Total Clients"    // Description text
  sub="112 Individual..."  // Optional footer with separator line
  color="var(--am-danger)" // Optional custom color for value
/>
```

**Styling:** Glass card with `backdrop-blur-[10px]`, border, rounded-xl.

---

### `Panel` (`src/components/shared/panel.tsx`)

Section container used across all pages. Most common component.

```tsx
<Panel
  title="Master Accounts"   // Poppins heading
  subtitle="Live performance" // Optional subtext
  pip="b"                    // Pip color: b=primary, t=teal, g=gold, p=purple, r=danger
  right={<button>View All</button>}  // Optional right-side content in header
  topBar={<div>...</div>}   // Optional content above header
>
  {children}
</Panel>
```

**Pip colors:** Each panel has a small glowing dot indicator:
- `b` = Primary blue (default)
- `t` = Teal accent
- `g` = Gold
- `p` = Purple
- `r` = Danger red

---

### `DataTable` (`src/components/shared/data-table.tsx`)

Responsive data table with styled headers and scrollable container.

```tsx
<DataTable headers={["ID", "Name", "Status"]}>
  <tr>
    <Td bold>001</Td>
    <Td>John Doe</Td>
    <Td><StatusBadge variant="ok">Active</StatusBadge></Td>
  </tr>
</DataTable>
```

### `Td`

Table cell component with styling options:
- `bold` -- White/primary text, font-bold
- `color` -- Custom text color
- Default: secondary text color

---

### `StatusBadge` (`src/components/shared/status-badge.tsx`)

Colored inline badge for status indicators.

```tsx
<StatusBadge variant="ok">Active</StatusBadge>
<StatusBadge variant="warn">Pending</StatusBadge>
<StatusBadge variant="bad">Rejected</StatusBadge>
<StatusBadge variant="blue">Individual</StatusBadge>
<StatusBadge variant="purple">Premium</StatusBadge>
<StatusBadge variant="teal">Standard</StatusBadge>
```

| Variant | Background | Text Color | Use Case |
|---------|-----------|------------|----------|
| `ok` | Success light | Success | Active, approved, paid |
| `warn` | Gold light | Gold | Pending, review |
| `bad` | Danger light | Danger | Rejected, overdue, inactive |
| `blue` | Primary light | Primary | Individual type, info |
| `purple` | Purple light | Purple | Special status |
| `teal` | Accent light | Accent | Plan badges |

---

### `Modal` (`src/components/shared/modal.tsx`)

Dialog overlay with backdrop blur.

```tsx
<Modal
  open={showModal}
  onClose={() => setShowModal(false)}
  title="Add New Client"
  width={640}  // Default: 540
>
  {/* Modal content */}
</Modal>
```

**Behavior:**
- Backdrop click closes modal
- Content click stops propagation
- Close button (X) in header
- Max height 90vh with scroll
- z-index 200

---

### `FilterBar` (`src/components/shared/filter-bar.tsx`)

Horizontal container for search and filter controls above tables.

```tsx
<FilterBar>
  <SearchInput placeholder="Search..." />
  <FilterSelect>
    <option>All Types</option>
  </FilterSelect>
  <FilterRight>
    <button>Export CSV</button>
    <button>+ Add</button>
  </FilterRight>
</FilterBar>
```

Three sub-components:
- `FilterBar` -- Flex container with gap and wrapping
- `FilterSelect` -- Styled `<select>` element
- `FilterRight` -- Right-aligned actions (`ml-auto`)

---

### `SearchInput` (`src/components/shared/search-input.tsx`)

Search input with magnifying glass icon.

```tsx
<SearchInput
  placeholder="Search name, ID..."
  value={query}
  onChange={setQuery}
  className="w-[220px]"
/>
```

---

### `TabSwitcher` (`src/components/shared/tab-switcher.tsx`)

Segmented control for tab-based filtering.

```tsx
<TabSwitcher
  tabs={[
    ["all", "All Pending (12)"],
    ["individual", "Individual"],
    ["corporate", "Corporate"]
  ]}
  active={tab}
  onChange={setTab}
/>
```

**Styling:** Dark background with primary-colored active tab. Equal width for all tabs.

---

### `InfoGrid` (`src/components/shared/info-grid.tsx`)

Two-column key-value display grid.

```tsx
<InfoGrid
  items={[
    ["Algorithm", "M1 ALPHA"],
    ["Renewal", "15 Apr 2026"],
    ["Days Left", "51 days"],
    ["Auto-Renew", "Enabled"],
  ]}
/>
```

Each item: `[label, value, optionalColor?]`

---

### `UserAvatar` (`src/components/shared/user-avatar.tsx`)

Circular avatar with gradient background and initials.

```tsx
<UserAvatar name="Rajesh Kumar" size={34} />
// Renders: gradient circle with "RK" initials
```

**Gradient:** `from-am-secondary to-am-primary`

---

### `ProgressBar` (`src/components/shared/progress-bar.tsx`)

Animated horizontal progress indicator.

```tsx
<ProgressBar width="67%" color="wa" />
```

| Color | Token | Meaning |
|-------|-------|---------|
| `b` | Primary | Default |
| `t` | Accent | Teal |
| `ok` | Success | Complete |
| `wa` | Gold | Warning |
| `r` | Danger | Alert |

---

### `AlertBox` (`src/components/shared/alert-box.tsx`)

Colored alert banner with icon.

```tsx
<AlertBox variant="i">Admin accounts are provisioned by the super-admin.</AlertBox>
<AlertBox variant="w">AUM drop detected.</AlertBox>
<AlertBox variant="d">KYC rejected.</AlertBox>
<AlertBox variant="s">Account created.</AlertBox>
```

| Variant | Color | Icon | Use Case |
|---------|-------|------|----------|
| `i` | Primary (info) | Info circle | Informational |
| `w` | Gold (warning) | Warning triangle | Warnings |
| `d` | Red (danger) | Close/X | Errors |
| `s` | Green (success) | Check circle | Confirmations |

---

## 3. Icon System

### `Icon` (`src/components/icons/index.tsx`)

Custom SVG icon component with 16+ built-in icons.

```tsx
<Icon name="home" size={16} className="text-am-primary" />
```

**Props:**
- `name` -- Icon identifier (see table below)
- `size` -- Width and height in pixels (default: 15)
- `className` -- Additional CSS classes

**Available Icons:**

| Name | Description | Used In |
|------|-------------|---------|
| `home` | House outline | Dashboard nav |
| `users` | Multiple people | Clients nav |
| `user` | Single person | Profile nav |
| `chart` | Trending up line | Analytics/trading nav |
| `bill` | Document with lines | Billing nav |
| `analytics` | Bar chart | Insights nav |
| `support` | Headset/help | Support nav |
| `settings` | Gear | Settings nav |
| `link` | Chain links | Exchange setup nav |
| `doc` | Document | Invoices nav |
| `star` | Star outline | Partner nav |
| `search` | Magnifying glass | Search inputs |
| `bell` | Notification bell | Topbar |
| `close` | X mark | Modals, dismiss |
| `chevron` | Right arrow | Nav expand/collapse |
| `check` | Circle with check | Success states |
| `info` | Circle with i | Info alerts |
| `warn` | Triangle with ! | Warning alerts |
| `logout` | Arrow exiting door | Sidebar footer |

All icons use `stroke="currentColor"` so they inherit text color from parent.

---

## 4. Shadcn/UI Primitives

Installed in `src/components/ui/`, these are unstyled Radix UI components themed with CSS variables:

| Component | Import | Primary Usage |
|-----------|--------|---------------|
| `Accordion` | `@/components/ui/accordion` | FAQ sections |
| `Alert` | `@/components/ui/alert` | System alerts |
| `Avatar` | `@/components/ui/avatar` | User images |
| `Badge` | `@/components/ui/badge` | Labels |
| `Button` | `@/components/ui/button` | Actions |
| `Card` | `@/components/ui/card` | Content cards |
| `Dialog` | `@/components/ui/dialog` | Modal dialogs |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Context menus |
| `Input` | `@/components/ui/input` | Form fields |
| `Label` | `@/components/ui/label` | Form labels |
| `Progress` | `@/components/ui/progress` | Progress bars |
| `ScrollArea` | `@/components/ui/scroll-area` | Scrollable containers |
| `Select` | `@/components/ui/select` | Dropdowns |
| `Separator` | `@/components/ui/separator` | Dividers |
| `Sheet` | `@/components/ui/sheet` | Side panels |
| `Sonner` | `@/components/ui/sonner` | Toast provider |
| `Table` | `@/components/ui/table` | Data tables |
| `Tabs` | `@/components/ui/tabs` | Tab navigation |
| `Textarea` | `@/components/ui/textarea` | Multi-line input |
| `Tooltip` | `@/components/ui/tooltip` | Hover tooltips |

Note: The platform primarily uses custom shared components (Panel, DataTable, etc.) rather than Shadcn/UI primitives directly. The Shadcn components are available for future use.
