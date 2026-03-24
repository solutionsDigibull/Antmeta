/**
 * AntMeta Responsive UI Test — Authenticated
 * Tests all pages at mobile (390×844), tablet (768×1024), desktop (1440×900)
 * Excludes KYC upload flows and Razorpay checkout
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT  = "./test-results-auth";
const ADMIN_EMAIL  = "test-admin@antmeta.in";
const ADMIN_PASS   = "Admin@Test123!";
const CLIENT_EMAIL = "test-client@antmeta.in";
const CLIENT_PASS  = "Client@Test123!";

const VIEWPORTS = [
  { name: "mobile",  width: 390,  height: 844  },
  { name: "tablet",  width: 768,  height: 1024 },
  { name: "desktop", width: 1440, height: 900  },
];

const issues = [];
const passed = [];
function log(msg) { process.stdout.write(msg + "\n"); }
function pass(page, vp, check) { passed.push({ page, vp, check }); log(`  ✓ [${vp}] ${check}`); }
function fail(page, vp, check, detail="") { issues.push({ page, vp, check, detail }); log(`  ✗ [${vp}] ${check}${detail ? " — "+detail : ""}`); }

async function ss(pw, name, vp) {
  const dir = path.join(OUT, vp, name.replace(/[/\\:*?"<>|]/g, "-"));
  fs.mkdirSync(dir, { recursive: true });
  await pw.screenshot({ path: path.join(dir, "full.png"), fullPage: true });
}

async function chk(pw, sel, pageName, vp, label) {
  try {
    const el = pw.locator(sel).first();
    if ((await el.count()) > 0 && await el.isVisible()) { pass(pageName, vp, label); return true; }
    fail(pageName, vp, label, `not found: ${sel}`); return false;
  } catch(e) { fail(pageName, vp, label, e.message.split("\n")[0]); return false; }
}

async function noOverflow(pw, pageName, vp) {
  const over = await pw.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
  over ? fail(pageName, vp, "No horizontal overflow",
              `scrollWidth=${await pw.evaluate(()=>document.body.scrollWidth)} > viewWidth=${await pw.evaluate(()=>window.innerWidth)}`)
       : pass(pageName, vp, "No horizontal overflow");
}

// ─── Login helper ─────────────────────────────────────────────────────────────
async function loginAs(pw, email, password, isAdmin) {
  await pw.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await pw.waitForTimeout(2000);

  // Toggle portal type (both portals accept email with @)
  const portalText = isAdmin ? "admin Portal" : "client Portal";
  try {
    await pw.locator(`div:has-text('${isAdmin ? "Admin Portal" : "Client Portal"}')`).last().click({ timeout: 3000 });
    await pw.waitForTimeout(500);
  } catch(e) { /* may already be on correct tab */ }

  // Fill credentials using type=text input (login form uses type="text" not type="email")
  const inputEl = pw.locator("input[type=text], input[type=email]").first();
  await inputEl.waitFor({ state: "visible", timeout: 10000 });
  await inputEl.fill(email);
  await pw.locator("input[type=password]").first().fill(password);
  await pw.locator("button:has-text('Sign In')").first().click();
  await pw.waitForURL(url => !url.includes("/login"), { timeout: 15000 }).catch(() => {});
  await pw.waitForTimeout(2000);

  const url = pw.url();
  const ok = url.includes("/admin") || url.includes("/client");
  log(`  ${ok ? "✓" : "✗"} Login → ${url}`);
  return ok;
}

// ─── Page check helper ────────────────────────────────────────────────────────
async function testPage(pw, url, pageName, checks, vp, isAuthPage = false) {
  try {
    await pw.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await pw.waitForTimeout(1500);

    // For dashboard pages only: check we weren't redirected away
    if (!isAuthPage && pw.url().includes("/login")) {
      fail(pageName, vp, "Page accessible (session valid)", "redirected to login");
      return;
    }

    await ss(pw, pageName, vp);
    await noOverflow(pw, pageName, vp);
    for (const [label, sel] of checks) await chk(pw, sel, pageName, vp, label);
  } catch(e) { fail(pageName, vp, "Page load", e.message.split("\n")[0]); }
}

// ─── Sidebar behavior ──────────────────────────────────────────────────────────
async function checkSidebar(pw, pageName, vp, width) {
  const sb = pw.locator("aside, [class*=sidebar]").first();
  if (await sb.count() === 0) { fail(pageName, vp, "Sidebar element present"); return; }

  if (width <= 390) {
    // Mobile: sidebar should be hidden; hamburger/menu button should exist
    const sbBox = await sb.boundingBox().catch(() => null);
    const hiddenOffscreen = !sbBox || sbBox.x < -50 || !await sb.isVisible();

    // Look for a toggle button (any button not inside main content)
    const menuBtn = pw.locator("button[class*=menu], button[class*=ham], button[aria-label*=menu i], [class*=topbar] button, header button").first();
    const hasMenu = await menuBtn.count() > 0;

    if (hiddenOffscreen || !await sb.isVisible()) {
      pass(pageName, vp, "Sidebar hidden on mobile");
    } else {
      fail(pageName, vp, "Sidebar hidden on mobile", "sidebar is visible/on-screen on mobile");
    }

    if (hasMenu) {
      pass(pageName, vp, "Menu toggle button exists on mobile");
      try {
        await menuBtn.click({ timeout: 2000 });
        await pw.waitForTimeout(600);
        const nowVisible = await sb.isVisible().catch(() => false);
        nowVisible
          ? pass(pageName, vp, "Sidebar opens on menu button click")
          : fail(pageName, vp, "Sidebar opens on menu button click");
        await ss(pw, pageName + "-sidebar-open", vp);
        // Close it again
        await menuBtn.click({ timeout: 2000 }).catch(() => {});
      } catch(e) { fail(pageName, vp, "Sidebar toggle click", e.message.split("\n")[0]); }
    } else {
      fail(pageName, vp, "Menu toggle button exists on mobile");
    }
  } else {
    const visible = await sb.isVisible();
    visible
      ? pass(pageName, vp, `Sidebar visible on ${vp}`)
      : fail(pageName, vp, `Sidebar visible on ${vp}`);
  }
}

// ─── PAGE DEFINITIONS ──────────────────────────────────────────────────────────

const AUTH_PAGES = [
  { url: "/login", name: "auth-login", checks: [
    ["Admin Portal tab (div toggle)", ":text-is('admin Portal'), :text('Admin Portal')"],
    ["Client Portal tab (div toggle)", ":text('Client Portal')"],
    ["Email or Mobile input (type=text)", "input[type=text]"],
    ["Password input", "input[type=password]"],
    ["Sign In button", "button:has-text('Sign In')"],
    ["Forgot Password button", "button:has-text('Forgot Password')"],
    ["Security audit note OR Admin info", ":text('security audit'), :text('provisioned')"],
  ]},
  { url: "/signup", name: "auth-signup", checks: [
    ["AntMeta brand header", ":text('AntMeta')"],
    ["Email input (type=email)", "input[type=email]"],
    ["Full name input", "input[placeholder='Your full name']"],
    ["Mobile tel input (+91 prefix visible)", "input[type=tel]"],
    ["+91 prefix label", ":text('+91')"],
    ["Individual account type div", ":text-is('Individual')"],
    ["Corporate account type div", ":text-is('Corporate')"],
    ["Password input", "input[placeholder='Min 8 chars']"],
    ["Confirm password input", "input[placeholder='Repeat password']"],
    ["Create Account button", "button:has-text('Create Account')"],
    ["Sign In button (footer)", "button:has-text('Sign In')"],
  ]},
  { url: "/verify-otp", name: "auth-verify-otp", checks: [
    ["OTP input boxes (×6)", "input[maxlength='1']"],
    ["Verify & Continue button", "button:has-text('Verify')"],
    ["Resend OTP button", "button:has-text('Resend OTP')"],
    ["Back link/button", ":text('Back')"],
  ]},
  { url: "/forgot-password", name: "auth-forgot-password", checks: [
    ["Email/Mobile input", "input[type=text], input[type=email]"],
    ["Send Reset Link button", "button:has-text('Send Reset Link')"],
    ["Back to Sign In link", ":text('Back to Sign In')"],
  ]},
];

const ADMIN_PAGES = [
  { url: "/admin/dashboard", name: "admin-dashboard", checks: [
    ["AntMeta logo in sidebar", "img[alt='AntMeta'], [class*=sidebar] img, [class*=brand]"],
    ["KPI: Total Clients", ":text('Total Clients')"],
    ["KPI: Total AUM", ":text('AUM')"],
    ["KPI: Active Partners", ":text('Partners')"],
    ["AUM trend chart (SVG)", "svg"],
    ["Master accounts section", ":text('ALPHA')"],
    ["KYC queue section", ":text('KYC')"],
    ["Recent invoices section", ":text('Invoice')"],
    ["Activity feed", ":text('Activity')"],
  ]},
  { url: "/admin/clients", name: "admin-clients", checks: [
    ["Page heading", "h1, h2"],
    ["Search input", "input[type=search], input[placeholder*=search i]"],
    ["Add Client button", "button:has-text('Client'), button:has-text('Add')"],
    ["Client table", "table"],
    ["Table column headers", "th"],
    ["KYC status badges", ":text('verified'), :text('Verified'), :text('pending'), :text('Pending')"],
  ]},
  { url: "/admin/partners", name: "admin-partners", checks: [
    ["Page heading", "h1, h2"],
    ["KPI: Total Partners", ":text('Partners')"],
    ["KPI: Revenue", ":text('Revenue')"],
    ["Add Partner button", "button:has-text('Partner')"],
    ["Partners table", "table"],
  ]},
  { url: "/admin/kyc-verification", name: "admin-kyc-verification", checks: [
    ["Page heading", "h1, h2"],
    ["KPI: Pending", ":text('Pending')"],
    ["KPI: Approved", ":text('Approved')"],
    ["Individual/Corporate filter tabs", ":text('Individual'), :text('Corporate')"],
  ]},
  { url: "/admin/tickets", name: "admin-tickets", checks: [
    ["Page heading", "h1, h2"],
    ["KPI: Open tickets", ":text('Open')"],
    ["KPI: Resolved", ":text('Resolved')"],
    ["Tickets table", "table"],
    ["Reply button", "button:has-text('Reply')"],
  ]},
  { url: "/admin/live-chat", name: "admin-live-chat", checks: [
    ["Page heading", "h1, h2"],
    ["Ticket list panel", ":text('Tickets'), :text('ticket')"],
    ["Message input area", "input[type=text], textarea"],
    ["Send button", "button:has-text('Send')"],
  ]},
  { url: "/admin/exchange-setup", name: "admin-exchange-setup", checks: [
    ["Page heading", "h1, h2"],
    ["Server IP display", ":text('13.235')"],
    ["Copy IP button", "button:has-text('Copy')"],
    ["Client API health table", "table"],
    ["Test Connections button", "button:has-text('Test')"],
  ]},
  { url: "/admin/copy-trading", name: "admin-copy-trading", checks: [
    ["Page heading", "h1, h2"],
    ["KPI: Active Copies", ":text('Active')"],
    ["Master: M1 ALPHA", ":text('ALPHA')"],
    ["Master: M2 DELTA", ":text('DELTA')"],
    ["Master: M3 SIGMA", ":text('SIGMA')"],
    ["Pause/Settings buttons", "button:has-text('Pause'), button:has-text('Settings')"],
  ]},
  { url: "/admin/plan-management", name: "admin-plan-management", checks: [
    ["Page heading", "h1, h2"],
    ["Standard plan", ":text('Standard')"],
    ["Premium plan", ":text('Premium')"],
    ["Exclusive plan", ":text('Exclusive')"],
  ]},
  { url: "/admin/billing-cycles", name: "admin-billing-cycles", checks: [
    ["Page heading", "h1, h2"],
    ["KPI: Cycle Revenue", ":text('Revenue'), :text('Cycle')"],
    ["Billing table", "table"],
    ["Run Billing button", "button:has-text('Billing'), button:has-text('Run')"],
  ]},
  { url: "/admin/invoices", name: "admin-invoices", checks: [
    ["Page heading", "h1, h2"],
    ["Invoice table", "table"],
    ["Paid status", ":text('Paid')"],
    ["Pending status", ":text('Pending')"],
  ]},
  { url: "/admin/pnl-analytics", name: "admin-pnl-analytics", checks: [
    ["Page heading", "h1, h2"],
    ["P&L KPI cards", ":text('P&L'), :text('MTD')"],
    ["Chart SVG", "svg"],
    ["Time period filter", ":text('30'), :text('90'), :text('YTD')"],
  ]},
  { url: "/admin/transaction-logs", name: "admin-transaction-logs", checks: [
    ["Page heading", "h1, h2"],
    ["Transaction table", "table"],
    ["Gateway filter", ":text('Gateway'), :text('Razorpay')"],
    ["Status badges", ":text('SUCCESS'), :text('PENDING'), :text('FAILED')"],
  ]},
  { url: "/admin/partner-performance", name: "admin-partner-performance", checks: [
    ["Page heading", "h1, h2"],
    ["KPI cards", ":text('Partner')"],
    ["Leaderboard table", "table"],
  ]},
  { url: "/admin/notification-templates", name: "admin-notification-templates", checks: [
    ["Page heading", "h1, h2"],
    ["New Template button", "button:has-text('Template'), button:has-text('New')"],
    ["Template cards or list", ":text('Template'), :text('template')"],
  ]},
  { url: "/admin/audit-logs", name: "admin-audit-logs", checks: [
    ["Page heading", "h1, h2"],
    ["Audit log table", "table"],
    ["Export button", "button:has-text('Export')"],
    ["Timestamp column", ":text('Timestamp'), :text('Time'), th"],
  ]},
  { url: "/admin/user-roles", name: "admin-user-roles", checks: [
    ["Page heading", "h1, h2"],
    ["User list content", "table, :text('Role')"],
  ]},
  { url: "/admin/admin-security", name: "admin-security", checks: [
    ["Page heading", "h1, h2"],
    ["Security content", ":text('Security'), :text('security')"],
  ]},
  { url: "/admin/performance-metrics", name: "admin-performance-metrics", checks: [
    ["Page heading", "h1, h2"],
    ["Metrics content", ":text('Performance'), :text('Metric')"],
  ]},
  { url: "/admin/masters", name: "admin-masters", checks: [
    ["Page heading", "h1, h2"],
    ["Master accounts list", ":text('ALPHA'), :text('Master')"],
  ]},
  { url: "/admin/faqs", name: "admin-faqs", checks: [
    ["Page heading", "h1, h2"],
    ["FAQ accordion items", "[class*=accordion], :text('FAQ'), :text('?')"],
  ]},
  { url: "/admin/help-center", name: "admin-help-center", checks: [
    ["Page heading", "h1, h2"],
    ["Help content", ":text('Help'), :text('Guide')"],
  ]},
  { url: "/admin/user-guidelines", name: "admin-user-guidelines", checks: [
    ["Page heading", "h1, h2"],
    ["Guidelines content", ":text('Guidelines'), :text('KYC'), :text('Policy')"],
  ]},
];

const CLIENT_PAGES = [
  { url: "/client/dashboard", name: "client-dashboard", checks: [
    ["KPI: MTD P&L", ":text('MTD'), :text('P&L')"],
    ["KPI: Portfolio Value", ":text('Portfolio')"],
    ["Current plan panel", ":text('Plan'), :text('plan')"],
    ["Quick actions area", ":text('Analytics'), :text('Exchange'), :text('Support')"],
    ["Performance chart SVG", "svg"],
    ["Revenue/Transactions toggle", "button:has-text('Revenue'), button:has-text('Transactions')"],
    ["Period selector buttons", "button:has-text('Daily'), button:has-text('Weekly'), button:has-text('Monthly')"],
    ["Export CSV button", "button:has-text('Export'), button:has-text('CSV')"],
  ]},
  { url: "/client/profile", name: "client-profile", checks: [
    ["Page heading", "h1, h2"],
    ["Avatar section", "[class*=avatar], [class*=profile]"],
    ["Name input", "input[placeholder*='full name' i]"],
    ["Mobile input", "input[type=tel], input[placeholder*='mobile' i]"],
    ["Save Changes button", "button:has-text('Save')"],
    ["Current password input", "input[placeholder*='current' i], input[type=password]"],
    ["Change Password button", "button:has-text('Change Password'), button:has-text('Update Password')"],
    ["KYC tab", ":text('KYC Status'), :text('KYC')"],
  ]},
  { url: "/client/exchange-setup", name: "client-exchange-setup", checks: [
    ["Page heading", "h1, h2"],
    ["Connection status", ":text('Connected'), :text('Not Connected')"],
    ["Server IP: 13.235", ":text('13.235')"],
    ["Copy IP button", "button:has-text('Copy')"],
    ["API Key password input", "input[type=password]"],
    ["Test Connection button", "button:has-text('Test')"],
    ["Save Keys button", "button:has-text('Save')"],
  ]},
  { url: "/client/subscription", name: "client-subscription", checks: [
    ["Page heading", "h1, h2"],
    ["Plan name", ":text('Standard'), :text('Premium'), :text('Exclusive'), :text('Plan')"],
    ["Renewal info", ":text('Renewal'), :text('renew'), :text('Quarter')"],
  ]},
  { url: "/client/pnl-analytics", name: "client-pnl-analytics", checks: [
    ["Page heading", "h1, h2"],
    ["Chart/equity curve SVG", "svg, canvas"],
    ["P&L metrics", ":text('P&L'), :text('Return')"],
  ]},
  { url: "/client/invoices", name: "client-invoices", checks: [
    ["Page heading", "h1, h2"],
    ["Invoice content", ":text('Invoice'), :text('Amount')"],
    ["Payment status", ":text('Paid'), :text('Pending'), :text('Due')"],
  ]},
  { url: "/client/support", name: "client-support", checks: [
    ["Page heading", "h1, h2"],
    ["My Tickets tab", ":text('My Tickets'), :text('Tickets')"],
    ["Raise Ticket tab", ":text('Raise Ticket'), :text('Raise')"],
    ["FAQs tab", ":text('FAQ')"],
    ["Contact Support tab", ":text('Contact')"],
    ["WhatsApp contact", ":text('WhatsApp')"],
    ["Telegram contact", ":text('Telegram')"],
    ["Email contact", ":text('support@antmeta')"],
  ]},
  { url: "/client/become-partner", name: "client-become-partner", checks: [
    ["Page heading", "h1, h2"],
    ["25% revenue benefit", ":text('25%')"],
    ["Partner program benefits", ":text('TraaS'), :text('Revenue'), :text('Partner')"],
    ["Business/Entity name input", "input"],
    ["Experience dropdown", "select, [role=combobox]"],
    ["Submit Application button", "button:has-text('Submit'), button:has-text('Apply')"],
  ]},
];

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  log("\n╔══════════════════════════════════════════════════════════════╗");
  log("║    AntMeta Responsive UI Test — Authenticated                ║");
  log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── PHASE 1: Auth pages (no session needed) ────────────────────────────────
  log("═".repeat(64));
  log("PHASE 1 — AUTH PAGES");
  log("═".repeat(64));

  for (const vp of VIEWPORTS) {
    log(`\n▶ Viewport: ${vp.name.toUpperCase()} (${vp.width}×${vp.height})`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const pw = await ctx.newPage();
    for (const p of AUTH_PAGES) {
      log(`\n  📄 ${p.name}`);
      await testPage(pw, p.url, p.name, p.checks, vp.name, true);
    }
    await ctx.close();
  }

  // ── PHASE 2: Admin portal ─────────────────────────────────────────────────
  log("\n" + "═".repeat(64));
  log("PHASE 2 — ADMIN PORTAL");
  log("═".repeat(64));

  for (const vp of VIEWPORTS) {
    log(`\n▶ Viewport: ${vp.name.toUpperCase()} (${vp.width}×${vp.height})`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const pw = await ctx.newPage();

    log("\n  🔐 Logging in as admin...");
    const ok = await loginAs(pw, ADMIN_EMAIL, ADMIN_PASS, true);
    if (!ok) { log("  ✗ Login failed, skipping admin pages"); await ctx.close(); continue; }

    for (const p of ADMIN_PAGES) {
      log(`\n  📄 ${p.name}`);
      await testPage(pw, p.url, p.name, p.checks, vp.name, false);
    }

    // Sidebar check on dashboard
    log(`\n  📐 Checking sidebar behavior`);
    await pw.goto(`${BASE}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await pw.waitForTimeout(1500);
    await checkSidebar(pw, "admin-sidebar", vp.name, vp.width);

    await ctx.close();
  }

  // ── PHASE 3: Client portal ────────────────────────────────────────────────
  log("\n" + "═".repeat(64));
  log("PHASE 3 — CLIENT PORTAL");
  log("═".repeat(64));

  for (const vp of VIEWPORTS) {
    log(`\n▶ Viewport: ${vp.name.toUpperCase()} (${vp.width}×${vp.height})`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const pw = await ctx.newPage();

    log("\n  🔐 Logging in as client...");
    const ok = await loginAs(pw, CLIENT_EMAIL, CLIENT_PASS, false);
    if (!ok) { log("  ✗ Login failed, skipping client pages"); await ctx.close(); continue; }

    for (const p of CLIENT_PAGES) {
      log(`\n  📄 ${p.name}`);
      await testPage(pw, p.url, p.name, p.checks, vp.name, false);
    }

    // Sidebar check on dashboard
    log(`\n  📐 Checking sidebar behavior`);
    await pw.goto(`${BASE}/client/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await pw.waitForTimeout(1500);
    await checkSidebar(pw, "client-sidebar", vp.name, vp.width);

    await ctx.close();
  }

  await browser.close();

  // ─── Report ─────────────────────────────────────────────────────────────────
  const total = passed.length + issues.length;
  const pct = total > 0 ? Math.round((passed.length / total) * 100) : 0;

  log("\n" + "═".repeat(64));
  log("FINAL SUMMARY");
  log("═".repeat(64));
  log(`Total checks : ${total}`);
  log(`Passed       : ${passed.length} (${pct}%)`);
  log(`Issues       : ${issues.length}`);

  if (issues.length > 0) {
    log("\n" + "─".repeat(64));
    log("ISSUES BY PAGE + BREAKPOINT:");
    log("─".repeat(64));
    const byPage = {};
    for (const i of issues) {
      (byPage[i.page] ??= {})[i.vp] ??= [];
      byPage[i.page][i.vp].push(`${i.check}${i.detail ? " → "+i.detail : ""}`);
    }
    for (const [page, vps] of Object.entries(byPage)) {
      log(`\n  PAGE: ${page}`);
      for (const [vp, items] of Object.entries(vps)) {
        log(`    [${vp}]`);
        for (const item of items) log(`      • ${item}`);
      }
    }
  }

  const report = { summary: { total, passed: passed.length, issues: issues.length, passRate: pct + "%" }, passed, issues };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  log(`\n📁 Screenshots : ${OUT}/`);
  log(`📋 Report JSON : ${OUT}/report.json`);
  log(`\n${issues.length === 0 ? "🟢 ALL CHECKS PASSED" : `🔴 ${issues.length} ISSUE(S) FOUND`}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
