# AntMeta Platform -- Documentation Index

## Master Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Full project overview -- what AntMeta is, tech stack, project structure, architecture decisions, current state |
| [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) | Routing, layouts, provider hierarchy, pages inventory, component architecture, state management, styling system, navigation structure |
| [BACKEND_API_PLAN.md](./BACKEND_API_PLAN.md) | Planned backend stack, complete database schema (17 tables), API routes (60+ endpoints), RLS policies, real-time subscriptions, cron jobs, migration strategy |
| [DATA_MODELS.md](./DATA_MODELS.md) | TypeScript interfaces, mock data inventory, constants reference, Indian-specific formatting |
| [COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md) | Detailed reference for all 12 shared components, icon system (16+ icons), 20 Shadcn/UI primitives -- props, usage examples, styling |
| [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | User roles, onboarding flows, KYC verification, subscription plans, trading operations, partner program, invoicing, support system, security |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Prerequisites, installation, running the app, testing instructions, configuration, adding pages/components, styling guidelines, deployment |

## Quick Reference

### Project At a Glance

- **Product:** Algorithmic Trading Client Onboarding & Management Platform (PWA)
- **Stack:** Next.js 16.1.6 + React 19.2.3 + TypeScript 5 + Tailwind CSS 4 + Shadcn/UI
- **Status:** Frontend complete (30 pages), mock data, no backend yet
- **Portals:** Admin (22 pages) + Client (8 pages) + Auth (4 pages)
- **Market:** Indian algorithmic trading (INR currency, PAN/Aadhaar KYC)

### Key Directories

```
src/app/(auth)/          -- 4 auth pages
src/app/(dashboard)/     -- 30 dashboard pages (22 admin + 8 client)
src/components/shared/   -- 12 reusable business components
src/components/ui/       -- 20 Shadcn/UI primitives
src/lib/data/            -- 7 mock data files
src/lib/types/           -- TypeScript interfaces
src/lib/constants/       -- Routes, plans, screen titles
src/providers/           -- 3 context providers
src/hooks/               -- 3 custom hooks
```

### Business Docs (Binary)

The `docs/` folder also contains original business documents in Excel/Word/PDF formats:
- Scope of Work (.docx)
- Business Logic Prompts v2 (.xlsx)
- Client CRM Document (.docx)
- GTM Strategy (.pdf)
- Proposal (.pdf)
- Lead Driver Sheets (.xlsx)

These are reference documents from the business team and are not readable as code.
