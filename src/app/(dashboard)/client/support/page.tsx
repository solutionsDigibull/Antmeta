"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { TabSwitcher } from "@/components/shared/tab-switcher";
import { FilterSelect } from "@/components/shared/filter-bar";
import { Icon } from "@/components/icons";

const clientTabs: [string, string][] = [
  ["tickets", "\u{1F3AB} My Tickets"],
  ["raise", "\u270F\uFE0F Raise Ticket"],
  ["guidelines", "\u{1F4D8} User Guidelines"],
  ["faq", "\u2753 FAQs"],
  ["contact", "\u{1F4DE} Contact"],
];

const tickets = [
  {
    id: "TKT-001",
    s: "Copy trade not activating",
    p: "high" as const,
    st: "open" as const,
    time: "2h ago",
    resp: "Team investigating your API connection",
  },
  {
    id: "TKT-003",
    s: "Invoice download not working",
    p: "medium" as const,
    st: "in-progress" as const,
    time: "1d ago",
    resp: "Fix deployed, please retry",
  },
  {
    id: "TKT-004",
    s: "API key rotation query",
    p: "low" as const,
    st: "resolved" as const,
    time: "5d ago",
    resp: "Regenerate key via Exchange Setup page",
  },
];

const guidelineCategories = [
  {
    cat: "Individual KYC",
    c: "bg-am-primary",
    docs: [
      { t: "PAN Card Upload Guide", tp: "PDF" },
      { t: "Aadhaar DigiLocker Guide", tp: "PDF" },
    ],
  },
  {
    cat: "Corporate KYC",
    c: "bg-am-gold",
    docs: [
      { t: "6-Document Checklist", tp: "PDF" },
      { t: "Director KYC Guide", tp: "PDF" },
    ],
  },
  {
    cat: "Algorithm Guides",
    c: "bg-am-accent",
    docs: [
      { t: "Copy Trading Introduction", tp: "PDF" },
      { t: "P&L Calculation Video", tp: "Video" },
    ],
  },
];

const faqs = [
  { q: "How do I upload my PAN card?", a: "Go to Profile \u2192 KYC Documents \u2192 Upload PAN. The system auto-verifies via NSDL API.", cat: "KYC" },
  { q: "What is copy trading?", a: "Copy trading replicates trades from ANT\u2019s master accounts to your exchange account proportionally.", cat: "Trading" },
  { q: "How is P&L calculated?", a: "P&L is synced from Delta Exchange every 4 hours. Premium clients see per-algorithm breakdown.", cat: "Trading" },
  { q: "What plans are available?", a: "Standard (₹4,500/Q), Premium (₹9,000/Q), Exclusive/TraaS (25% of profits every 90 days).", cat: "Billing" },
  { q: "How do I connect Delta Exchange?", a: "Go to Exchange Setup, whitelist IP 13.235.112.48, create API key with Read+Trade permissions, paste into AntMeta.", cat: "Technical" },
];

const contactChannels = [
  { ico: "\u{1F4AC}", l: "Live Chat", s: "Mon–Fri, 9AM–6PM IST", btn: "Open Chat" },
  { ico: "\u{1F4F1}", l: "WhatsApp Support", s: "+91 98765 00000", btn: "WhatsApp" },
  { ico: "\u{1F4E2}", l: "Telegram Channel", s: "@AntMetaTraders", btn: "Join" },
  { ico: "\u{1F4E7}", l: "Email Support", s: "support@antmeta.in", btn: "Email" },
];

export default function SupportClientPage() {
  const [tab, setTab] = useState("tickets");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div>
      <TabSwitcher tabs={clientTabs} active={tab} onChange={setTab} />

      {/* My Tickets */}
      {tab === "tickets" && (
        <Panel
          title="My Tickets"
          pip="r"
          right={
            <button
              onClick={() => setTab("raise")}
              className="bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-xs rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
            >
              + Raise Ticket
            </button>
          }
        >
          {tickets.map((tk) => (
            <div
              key={tk.id}
              className="p-3 bg-black/20 rounded-lg border border-am-border-faint mb-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-am-text">{tk.id}</span>
                  <StatusBadge variant={tk.p === "high" ? "bad" : tk.p === "medium" ? "warn" : "blue"}>
                    {tk.p}
                  </StatusBadge>
                </div>
                <StatusBadge
                  variant={tk.st === "open" ? "warn" : tk.st === "in-progress" ? "blue" : "ok"}
                >
                  {tk.st}
                </StatusBadge>
              </div>
              <div className="text-sm text-am-text font-semibold mb-1">{tk.s}</div>
              <div className="text-[13px] text-am-text-3 mb-1">{tk.time}</div>
              <div className="text-[13px] text-am-text-2 bg-am-input-bg py-1.5 px-2 rounded-md border-l-[3px] border-am-primary">
                Latest response: {tk.resp}
              </div>
            </div>
          ))}
        </Panel>
      )}

      {/* Raise Ticket */}
      {tab === "raise" && (
        <Panel title="Raise a New Ticket" pip="b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">
                Category *
              </label>
              <FilterSelect style={{ width: "100%" }}>
                <option>Select category</option>
                <option>KYC Issue</option>
                <option>Trading / Copy Trading</option>
                <option>Billing & Invoices</option>
                <option>API / Technical</option>
                <option>Account Access</option>
                <option>Other</option>
              </FilterSelect>
            </div>
            <div>
              <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">
                Priority
              </label>
              <FilterSelect style={{ width: "100%" }}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </FilterSelect>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">
              Subject *
            </label>
            <input
              placeholder="Brief description of your issue"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">
              Description *
            </label>
            <textarea
              rows={4}
              placeholder="Explain your issue in detail…"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none resize-y"
            />
          </div>
          <div className="mb-3.5">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">
              Attach Screenshot (Optional)
            </label>
            <div
              className="border-2 border-dashed border-am-border rounded-lg py-4 text-center cursor-pointer bg-[rgba(0,147,182,.03)]"
              onClick={() => toast("File picker opened")}
            >
              <div className="text-sm text-am-text-3">
                {"\u{1F4CE}"} Click to attach or drag & drop (PNG, JPG, PDF up to 10 MB)
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              toast.success("Ticket TKT-090 created! You\u2019ll receive a confirmation email.");
              setTab("tickets");
            }}
            className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center"
          >
            Submit Ticket {"\u2192"}
          </button>
        </Panel>
      )}

      {/* User Guidelines */}
      {tab === "guidelines" && (
        <div>
          <div className="flex items-center gap-1.5 bg-am-input-bg border border-am-border rounded-lg py-1.5 px-3 w-[280px] mb-3">
            <Icon name="search" size={12} />
            <input
              placeholder="Search guidelines…"
              className="bg-transparent border-none outline-none font-sans text-sm text-am-text-2 w-full"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {guidelineCategories.map((c) => (
              <Panel
                key={c.cat}
                title={c.cat}
                pip="b"
                topBar={<div className={`h-[3px] ${c.c}`} />}
              >
                {c.docs.map((d) => (
                  <div
                    key={d.t}
                    className="flex items-center gap-2 py-2 border-b border-am-border-faint"
                  >
                    <span className="text-base">{d.tp === "PDF" ? "\u{1F4C4}" : "\u{1F3AC}"}</span>
                    <div className="flex-1 text-sm text-am-text-2">{d.t}</div>
                    <button
                      onClick={() => toast("Viewing document")}
                      className="text-xs font-semibold text-am-text-3 hover:text-am-text px-1.5 py-0.5 cursor-pointer transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => toast.success("Downloaded")}
                      className="text-xs font-semibold text-am-text-3 hover:text-am-text px-1.5 py-0.5 cursor-pointer transition-colors"
                    >
                      {"\u2193"}
                    </button>
                  </div>
                ))}
              </Panel>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {tab === "faq" && (
        <Panel title="Frequently Asked Questions" pip="b">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-am-border-faint">
              <div
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="flex items-center gap-2.5 py-3 cursor-pointer"
              >
                <div
                  className="text-sm text-am-primary transition-transform duration-200"
                  style={{ transform: expandedFaq === i ? "rotate(90deg)" : "none" }}
                >
                  {"\u25B6"}
                </div>
                <div className="flex-1 text-sm font-semibold text-am-text">{f.q}</div>
                <StatusBadge variant="blue">{f.cat}</StatusBadge>
              </div>
              {expandedFaq === i && (
                <div className="pb-3 pl-6 text-sm text-am-text-2 leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </Panel>
      )}

      {/* Contact Support */}
      {tab === "contact" && (
        <Panel title="Contact Support" pip="b">
          {contactChannels.map((ch, i) => (
            <div key={i} className="flex items-center gap-2.5 py-3 border-b border-am-border-faint">
              <div className="w-9 h-9 rounded-lg bg-am-primary-light flex items-center justify-center text-lg shrink-0">
                {ch.ico}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{ch.l}</div>
                <div className="text-[13px] text-am-text-3">{ch.s}</div>
              </div>
              <button
                onClick={() => toast(`Opening ${ch.l}`)}
                className="text-xs font-semibold bg-am-secondary/20 text-am-secondary border border-am-secondary/30 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-am-secondary/30 transition-colors"
              >
                {ch.btn}
              </button>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
