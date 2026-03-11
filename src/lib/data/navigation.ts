import { NavItem } from "@/lib/types";

export const ADMIN_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", ico: "home", sec: "MAIN" },
  { id: "clients", label: "Customers", ico: "users", sec: "OPERATIONS", sub: [
    { id: "client-directory", label: "Client Directory" },
    { id: "kyc-verification", label: "KYC Verification", badge: 12, bt: "warn" },
    { id: "partners", label: "Partners" },
  ]},
  { id: "trading", label: "Trading Operations", ico: "chart", sub: [
    { id: "exchange-setup", label: "Exchange Setup" },
    { id: "copy-trading", label: "Copy Trading" },
  ]},
  { id: "billing", label: "Subscriptions & Billing", ico: "bill", sub: [
    { id: "plan-management", label: "Plan Management" },
    { id: "billing-cycles", label: "Billing Cycles (TraaS)" },
    { id: "invoicing", label: "Invoicing" },
    { id: "txn-logs", label: "Transaction Logs" },
  ]},
  { id: "analytics", label: "Analytics & Reporting", ico: "analytics", sec: "INSIGHTS", sub: [
    { id: "pnl-analytics", label: "P&L Analytics" },
    { id: "perf-metrics", label: "Performance Metrics" },
    { id: "partner-perf", label: "Partner Performance" },
  ]},
  { id: "support-admin", label: "Support", ico: "support", sec: "SYSTEM", badge: 3, bt: "bad", sub: [
    { id: "tickets", label: "Ticket Management" },
    { id: "live-chat", label: "Live Chat" },
    { id: "help-center", label: "Help Center" },
    { id: "user-guidelines", label: "User Guidelines" },
    { id: "faqs", label: "FAQs" },
  ]},
  { id: "settings", label: "System Settings", ico: "settings", sub: [
    { id: "user-roles", label: "User & Role Management" },
    { id: "admin-security", label: "Admin Security (2FA)" },
    { id: "audit-logs", label: "Audit Logs" },
    { id: "notif-templates", label: "Notification Templates" },
  ]},
];

export const CLIENT_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", ico: "home", sec: "MAIN" },
  { id: "my-profile", label: "My Profile", ico: "user", sec: "ACCOUNT" },
  { id: "exchange-setup-c", label: "Exchange Setup", ico: "link" },
  { id: "subscription", label: "My Subscription", ico: "bill" },
  { id: "pnl-client", label: "P&L Analytics", ico: "chart", sec: "TRADING" },
  { id: "invoices-client", label: "Invoices", ico: "doc" },
  { id: "support-client", label: "Support", ico: "support", sec: "HELP", badge: 1, bt: "bad" },
  { id: "become-partner", label: "Become a Partner", ico: "star" },
];
