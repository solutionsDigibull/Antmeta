/**
 * AntMeta Responsive UI Test
 * Tests all pages at mobile (390×844), tablet (768×1024), desktop (1440×900)
 * Excludes KYC upload flows and Razorpay checkout flows
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT = "./test-results";

const VIEWPORTS = [
  { name: "mobile",   width: 390,  height: 844  },
  { name: "tablet",   width: 768,  height: 1024 },
  { name: "desktop",  width: 1440, height: 900  },
];

// Issues collected across all tests
const issues = [];
const passed = [];

function log(msg) { console.log(msg); }
function pass(page, vp, check) {
  passed.push({ page, vp, check });
  log(`  ✓ [${vp}] ${check}`);
}
function fail(page, vp, check, detail = "") {
  issues.push({ page, vp, check, detail });
  log(`  ✗ [${vp}] ${check}${detail ? " — " + detail : ""}`);
}

async function ss(page, name, vp) {
  const dir = path.join(OUT, vp.name, name.replace(/\//g, "-").replace(/^-/, ""));
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, "full.png"), fullPage: true });
}

async function checkVisible(pw, selector, pageName, vp, label) {
  try {
    const el = pw.locator(selector).first();
    const count = await el.count();
    if (count > 0 && await el.isVisible()) {
      pass(pageName, vp.name, label);
      return true;
    }
    fail(pageName, vp.name, label, `${selector} not visible`);
    return false;
  } catch(e) {
    fail(pageName, vp.name, label, e.message);
    return false;
  }
}

async function checkNotOverflowing(pw, pageName, vp) {
  const overflow = await pw.evaluate(() => {
    const body = document.body;
    return body.scrollWidth > window.innerWidth;
  });
  if (overflow) {
    fail(pageName, vp.name, "No horizontal overflow", `body scrollWidth > innerWidth`);
  } else {
    pass(pageName, vp.name, "No horizontal overflow");
  }
}

async function runPage(browser, url, pageName, checks, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const pw = await ctx.newPage();
  try {
    await pw.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await pw.waitForTimeout(1500);
    await ss(pw, pageName, vp);
    await checkNotOverflowing(pw, pageName, vp);
    for (const [label, selector] of checks) {
      await checkVisible(pw, selector, pageName, vp, label);
    }
  } catch (e) {
    fail(pageName, vp.name, "Page load", e.message);
  } finally {
    await ctx.close();
  }
}

// ─── AUTH PAGES (no login needed) ─────────────────────────────────────────────

const AUTH_PAGES = [
  {
    url: "/login",
    name: "login",
    checks: [
      ["Admin/Client toggle", "button:has-text('Admin'), [role=tab]:has-text('Admin'), button:has-text('Client')"],
      ["Email/ID input field", "input[type=email], input[type=text], input[placeholder*='email' i], input[placeholder*='mobile' i]"],
      ["Password field", "input[type=password]"],
      ["Login submit button", "button[type=submit], button:has-text('Login'), button:has-text('Sign In')"],
      ["Forgot password link", "a:has-text('Forgot'), button:has-text('Forgot')"],
    ],
  },
  {
    url: "/signup",
    name: "signup",
    checks: [
      ["Name input", "input[placeholder*='name' i], input[name=name]"],
      ["Email input", "input[type=email], input[placeholder*='email' i]"],
      ["Password input", "input[type=password]"],
      ["Account type toggle (Individual/Corporate)", "button:has-text('Individual'), button:has-text('Corporate'), [role=tab]:has-text('Individual')"],
      ["Submit button", "button[type=submit], button:has-text('Create'), button:has-text('Sign Up'), button:has-text('Register')"],
      ["Login link", "a:has-text('Login'), a:has-text('Sign in')"],
    ],
  },
  {
    url: "/verify-otp",
    name: "verify-otp",
    checks: [
      ["OTP input boxes", "input[maxlength='1'], input[type=tel][maxlength], input[inputmode=numeric]"],
      ["Resend OTP button", "button:has-text('Resend')"],
      ["Back button", "button:has-text('Back'), a:has-text('Back')"],
    ],
  },
  {
    url: "/forgot-password",
    name: "forgot-password",
    checks: [
      ["Email/mobile input", "input[type=email], input[type=text]"],
      ["Reset button", "button[type=submit], button:has-text('Reset'), button:has-text('Send')"],
      ["Back to login link", "a:has-text('Login'), a:has-text('Back'), button:has-text('Back')"],
    ],
  },
];

// ─── ADMIN PAGES (will redirect to login if not authenticated) ─────────────────

const ADMIN_PAGES = [
  {
    url: "/admin/dashboard",
    name: "admin-dashboard",
    checks: [
      ["KPI cards area", "[class*=kpi], [class*=card], .grid"],
      ["AUM or chart section", "[class*=chart], [class*=trend], [class*=aum], svg, canvas"],
      ["Sidebar or nav", "nav, aside, [class*=sidebar]"],
    ],
  },
  {
    url: "/admin/clients",
    name: "admin-clients",
    checks: [
      ["Search input", "input[placeholder*=search i], input[type=search]"],
      ["Add client button", "button:has-text('Add'), button:has-text('Client')"],
      ["Table or list", "table, [role=table], [class*=table]"],
    ],
  },
  {
    url: "/admin/partners",
    name: "admin-partners",
    checks: [
      ["Add partner button", "button:has-text('Add'), button:has-text('Partner')"],
      ["Table or list", "table, [role=table], [class*=table]"],
    ],
  },
  {
    url: "/admin/tickets",
    name: "admin-tickets",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Ticket table", "table, [role=table], [class*=table]"],
      ["Reply button", "button:has-text('Reply'), button:has-text('Respond')"],
    ],
  },
  {
    url: "/admin/live-chat",
    name: "admin-live-chat",
    checks: [
      ["Ticket sidebar", "aside, [class*=sidebar], [class*=ticket-list]"],
      ["Chat area", "[class*=chat], [class*=messages], main"],
      ["Message input", "input[placeholder*=message i], textarea[placeholder*=message i], input[type=text]"],
      ["Send button", "button:has-text('Send')"],
    ],
  },
  {
    url: "/admin/exchange-setup",
    name: "admin-exchange-setup",
    checks: [
      ["Server IP display", "code, [class*=ip], [class*=code]"],
      ["Copy button", "button:has-text('Copy')"],
      ["API Health table", "table, [role=table], [class*=table]"],
      ["Test connections button", "button:has-text('Test')"],
    ],
  },
  {
    url: "/admin/copy-trading",
    name: "admin-copy-trading",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Master account cards", "[class*=master], [class*=algo], [class*=card]"],
    ],
  },
  {
    url: "/admin/plan-management",
    name: "admin-plan-management",
    checks: [
      ["Plan cards or table", "[class*=plan], [class*=card], table"],
    ],
  },
  {
    url: "/admin/billing-cycles",
    name: "admin-billing-cycles",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Billing table", "table, [role=table]"],
      ["Run billing button", "button:has-text('Run'), button:has-text('Billing'), button:has-text('Cycle')"],
    ],
  },
  {
    url: "/admin/invoices",
    name: "admin-invoices",
    checks: [
      ["Invoice table", "table, [role=table]"],
      ["Status badges", "[class*=badge], [class*=status]"],
    ],
  },
  {
    url: "/admin/pnl-analytics",
    name: "admin-pnl-analytics",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Chart or sparkline", "svg, canvas, [class*=chart], [class*=sparkline]"],
      ["Filter controls", "select, [role=combobox], [class*=filter]"],
    ],
  },
  {
    url: "/admin/transaction-logs",
    name: "admin-transaction-logs",
    checks: [
      ["Filter controls", "select, [class*=filter], [role=combobox]"],
      ["Transaction table", "table, [role=table]"],
    ],
  },
  {
    url: "/admin/partner-performance",
    name: "admin-partner-performance",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Leaderboard table", "table, [role=table]"],
    ],
  },
  {
    url: "/admin/notification-templates",
    name: "admin-notification-templates",
    checks: [
      ["New template button", "button:has-text('New'), button:has-text('Template'), button:has-text('Add')"],
      ["Template cards", "[class*=template], [class*=card]"],
    ],
  },
  {
    url: "/admin/audit-logs",
    name: "admin-audit-logs",
    checks: [
      ["Audit log table", "table, [role=table]"],
      ["Filter or export", "button:has-text('Export'), select, [class*=filter]"],
    ],
  },
  {
    url: "/admin/user-roles",
    name: "admin-user-roles",
    checks: [
      ["User list or table", "table, [role=table], [class*=list]"],
    ],
  },
  {
    url: "/admin/admin-security",
    name: "admin-security",
    checks: [
      ["Settings content", "form, [class*=settings], [class*=security]"],
    ],
  },
  {
    url: "/admin/kyc-verification",
    name: "admin-kyc-verification",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Queue list", "[class*=queue], [class*=list], table"],
    ],
  },
  {
    url: "/admin/masters",
    name: "admin-masters",
    checks: [
      ["Master cards or table", "[class*=master], [class*=card], table"],
    ],
  },
  {
    url: "/admin/performance-metrics",
    name: "admin-performance-metrics",
    checks: [
      ["Metrics content", "[class*=metric], [class*=card], .grid"],
    ],
  },
  {
    url: "/admin/faqs",
    name: "admin-faqs",
    checks: [
      ["FAQ items", "[class*=accordion], [class*=faq], [class*=collapse]"],
    ],
  },
  {
    url: "/admin/help-center",
    name: "admin-help-center",
    checks: [
      ["Help content", "main, article, [class*=content]"],
    ],
  },
  {
    url: "/admin/user-guidelines",
    name: "admin-user-guidelines",
    checks: [
      ["Guidelines content", "main, article, [class*=content]"],
    ],
  },
];

// ─── CLIENT PAGES ──────────────────────────────────────────────────────────────

const CLIENT_PAGES = [
  {
    url: "/client/dashboard",
    name: "client-dashboard",
    checks: [
      ["KPI cards", "[class*=kpi], [class*=card], .grid"],
      ["Performance chart", "svg, canvas, [class*=chart]"],
      ["Quick actions", "[class*=action], [class*=quick]"],
      ["Period selector", "button:has-text('Daily'), button:has-text('Weekly'), button:has-text('Monthly')"],
    ],
  },
  {
    url: "/client/profile",
    name: "client-profile",
    checks: [
      ["Name input", "input[placeholder*=name i], input[name=name]"],
      ["Save changes button", "button:has-text('Save')"],
      ["KYC tab", "[role=tab]:has-text('KYC'), button:has-text('KYC')"],
      ["Change password section", "input[type=password]"],
    ],
  },
  {
    url: "/client/exchange-setup",
    name: "client-exchange-setup",
    checks: [
      ["Connection status banner", "[class*=banner], [class*=status], [class*=alert]"],
      ["IP copy button", "button:has-text('Copy')"],
      ["API key input", "input[type=password], input[placeholder*=api i], input[placeholder*=key i]"],
      ["Test connection button", "button:has-text('Test')"],
      ["Save keys button", "button:has-text('Save')"],
    ],
  },
  {
    url: "/client/subscription",
    name: "client-subscription",
    checks: [
      ["Plan info", "[class*=plan], [class*=card], [class*=subscription]"],
    ],
  },
  {
    url: "/client/pnl-analytics",
    name: "client-pnl-analytics",
    checks: [
      ["Chart area", "svg, canvas, [class*=chart]"],
      ["Filter controls", "select, [role=combobox], [class*=filter]"],
    ],
  },
  {
    url: "/client/invoices",
    name: "client-invoices",
    checks: [
      ["Invoice table or list", "table, [role=table], [class*=invoice]"],
      ["Status badges", "[class*=badge], [class*=status]"],
    ],
  },
  {
    url: "/client/support",
    name: "client-support",
    checks: [
      ["Support tabs", "[role=tab], [class*=tab]"],
      ["Ticket list or raise button", "button:has-text('Raise'), [class*=ticket], table"],
      ["FAQ accordion", "[class*=accordion], [class*=faq]"],
      ["Contact support cards", "[class*=contact], [class*=card]"],
    ],
  },
  {
    url: "/client/become-partner",
    name: "client-become-partner",
    checks: [
      ["Partner program info", "[class*=partner], [class*=program], [class*=card]"],
      ["Application form", "form, [class*=form]"],
      ["Submit button", "button[type=submit], button:has-text('Submit'), button:has-text('Apply')"],
      ["Business name input", "input[placeholder*=business i], input[placeholder*=name i]"],
    ],
  },
];

// ─── NAVIGATION CHECK ──────────────────────────────────────────────────────────

async function checkNavigation(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const pw = await ctx.newPage();
  try {
    await pw.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await pw.waitForTimeout(1000);
    // After login redirect will go to /login anyway since no session
    // Check basic chrome
    await checkVisible(pw, "nav, header, [class*=topbar]", "navigation", vp, "Header/nav exists on login page");
    await ss(pw, "nav-login", vp);
  } catch(e) {
    fail("navigation", vp.name, "Nav check", e.message);
  } finally {
    await ctx.close();
  }
}

// ─── SIDEBAR COLLAPSE TEST (navigate to admin page, check redirect/sidebar) ────

async function checkSidebar(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const pw = await ctx.newPage();
  try {
    // Navigate to admin dashboard - will redirect to login if no session
    const res = await pw.goto(`${BASE}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await pw.waitForTimeout(1000);
    const url = pw.url();
    if (url.includes("/login")) {
      pass("sidebar", vp.name, "Auth redirect works (unauthenticated → login)");
    } else {
      // If somehow on dashboard, check sidebar
      const sidebar = await pw.locator("aside, nav[class*=sidebar], [class*=sidebar]").count();
      if (sidebar > 0) {
        pass("sidebar", vp.name, "Sidebar exists on dashboard");
        if (vp.width <= 390) {
          const hamburger = await pw.locator("button[class*=menu], button[class*=hamburger], button[aria-label*=menu i]").count();
          if (hamburger > 0) {
            pass("sidebar", vp.name, "Hamburger menu exists on mobile");
          } else {
            fail("sidebar", vp.name, "Hamburger menu on mobile", "No hamburger button found");
          }
        }
      } else {
        fail("sidebar", vp.name, "Sidebar exists on dashboard", "No sidebar found");
      }
    }
    await ss(pw, "sidebar-test", vp);
  } catch(e) {
    fail("sidebar", vp.name, "Sidebar test", e.message);
  } finally {
    await ctx.close();
  }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  log("\n╔══════════════════════════════════════════════════════════════╗");
  log("║         AntMeta Responsive UI Test Suite                     ║");
  log("╚══════════════════════════════════════════════════════════════╝\n");

  for (const vp of VIEWPORTS) {
    log(`\n${"═".repeat(64)}`);
    log(`VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}×${vp.height})`);
    log("═".repeat(64));

    // Auth pages
    log("\n── AUTHENTICATION PAGES ──");
    for (const p of AUTH_PAGES) {
      log(`\n  📄 ${p.name} (${p.url})`);
      await runPage(browser, p.url, p.name, p.checks, vp);
    }

    // Admin pages
    log("\n── ADMIN PORTAL PAGES ──");
    for (const p of ADMIN_PAGES) {
      log(`\n  📄 ${p.name} (${p.url})`);
      await runPage(browser, p.url, p.name, p.checks, vp);
    }

    // Client pages
    log("\n── CLIENT PORTAL PAGES ──");
    for (const p of CLIENT_PAGES) {
      log(`\n  📄 ${p.name} (${p.url})`);
      await runPage(browser, p.url, p.name, p.checks, vp);
    }

    // Navigation & sidebar
    log("\n── NAVIGATION & LAYOUT ──");
    await checkNavigation(browser, vp);
    await checkSidebar(browser, vp);
  }

  await browser.close();

  // ─── REPORT ─────────────────────────────────────────────────────────────────
  const total = passed.length + issues.length;
  const pct = total > 0 ? Math.round((passed.length / total) * 100) : 0;

  log(`\n${"═".repeat(64)}`);
  log("SUMMARY");
  log("═".repeat(64));
  log(`Total checks: ${total}`);
  log(`Passed:       ${passed.length} (${pct}%)`);
  log(`Issues:       ${issues.length}`);

  if (issues.length > 0) {
    log(`\n${"─".repeat(64)}`);
    log("ISSUES FOUND:");
    log("─".repeat(64));
    const byPage = {};
    for (const i of issues) {
      if (!byPage[i.page]) byPage[i.page] = {};
      if (!byPage[i.page][i.vp]) byPage[i.page][i.vp] = [];
      byPage[i.page][i.vp].push(`${i.check}${i.detail ? ": " + i.detail : ""}`);
    }
    for (const [page, vps] of Object.entries(byPage)) {
      log(`\n  PAGE: ${page}`);
      for (const [vp, items] of Object.entries(vps)) {
        log(`    [${vp}]`);
        for (const item of items) log(`      • ${item}`);
      }
    }
  }

  // Write JSON report
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ passed, issues, total, pct }, null, 2));
  log(`\n📁 Screenshots saved to: ${OUT}/`);
  log(`📋 Report saved to:      ${OUT}/report.json`);
  log(`\n${issues.length === 0 ? "🟢 ALL CHECKS PASSED" : `🔴 ${issues.length} ISSUE(S) FOUND`}\n`);
}

main().catch(console.error);
