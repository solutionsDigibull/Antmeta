"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterSelect } from "@/components/shared/filter-bar";
import { AlertBox } from "@/components/shared/alert-box";
import { SearchInput } from "@/components/shared/search-input";
import { Icon } from "@/components/icons";

const tabsList: [string, string][] = [
  ["guidelines", "User Guidelines"],
  ["faqs", "FAQs"],
  ["tickets-overview", "Tickets Overview"],
  ["contact-cfg", "Contact Config"],
  ["doc-upload", "Document Upload"],
];

const guidelineCategories = [
  {
    cat: "Individual KYC", c: "var(--am-primary)", docs: [
      { t: "PAN Card Upload Guide", ver: "v2.1", type: "PDF", size: "1.2 MB", views: 234, date: "15 Feb 2026" },
      { t: "Aadhaar DigiLocker Verification", ver: "v1.4", type: "PDF", size: "890 KB", views: 189, date: "10 Feb 2026" },
      { t: "Name Mismatch Resolution", ver: "v1.0", type: "DOC", size: "340 KB", views: 156, date: "05 Feb 2026" },
    ]
  },
  {
    cat: "Corporate KYC", c: "var(--am-gold)", docs: [
      { t: "6-Document Checklist Guide", ver: "v3.0", type: "PDF", size: "2.1 MB", views: 98, date: "12 Feb 2026" },
      { t: "Director KYC Requirements", ver: "v1.2", type: "PDF", size: "1.5 MB", views: 76, date: "08 Feb 2026" },
      { t: "GSTIN Cross-check Process", ver: "v1.1", type: "Video", size: "Link", views: 54, date: "01 Feb 2026" },
    ]
  },
  {
    cat: "Algorithm Guides", c: "var(--am-accent)", docs: [
      { t: "Copy Trading Introduction", ver: "v2.0", type: "PDF", size: "3.4 MB", views: 312, date: "18 Feb 2026" },
      { t: "M1 ALPHA Strategy Deep Dive", ver: "v1.8", type: "PDF", size: "2.8 MB", views: 248, date: "14 Feb 2026" },
      { t: "P&L Calculation Methodology", ver: "v1.5", type: "DOC", size: "1.1 MB", views: 187, date: "10 Feb 2026" },
    ]
  },
];

const faqData = [
  { q: "How do I upload my PAN card?", cat: "KYC", views: 412, status: "published" },
  { q: "What is copy trading and how does it work?", cat: "Trading", views: 389, status: "published" },
  { q: "How is my P&L calculated?", cat: "Trading", views: 267, status: "published" },
  { q: "What are the subscription plans available?", cat: "Billing", views: 234, status: "published" },
  { q: "How do I connect my Delta Exchange account?", cat: "Technical", views: 198, status: "published" },
  { q: "What documents are needed for Corporate KYC?", cat: "KYC", views: 156, status: "draft" },
];

const recentUploads = [
  { t: "Copy Trading Introduction v2.0", by: "Raghav S.", dt: "18 Feb 2026", sz: "3.4 MB", tp: "PDF" },
  { t: "PAN Card Upload Guide v2.1", by: "Sathish K.", dt: "15 Feb 2026", sz: "1.2 MB", tp: "PDF" },
  { t: "6-Document Checklist v3.0", by: "Raghav S.", dt: "12 Feb 2026", sz: "2.1 MB", tp: "PDF" },
  { t: "GSTIN Cross-check Process", by: "Meera R.", dt: "01 Feb 2026", sz: "Link", tp: "Video" },
];

export default function HelpCenter() {
  const [tab, setTab] = useState("guidelines");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-black/20 border border-am-border rounded-[10px] p-1 mb-3.5">
        {tabsList.map(([id, label]) => (
          <div
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 text-center py-2 px-1.5 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all ${
              tab === id ? "bg-am-primary text-white" : "text-am-text-3 hover:text-am-text-2"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* User Guidelines Tab */}
      {tab === "guidelines" && (
        <div>
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <SearchInput placeholder="Search guidelines..." className="w-[260px]" />
            <button onClick={() => toast.info("Upload document dialog opened")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ Upload Document</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {guidelineCategories.map(c => (
              <Panel key={c.cat} title={c.cat} pip="b" topBar={<div className="h-[3px]" style={{ background: c.c }} />} right={<span className="text-[13px] text-am-text-3">{c.docs.length} docs</span>}>
                {c.docs.map(d => (
                  <div key={d.t} className="py-2.5 border-b border-am-border-faint">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-am-text">{d.t}</div>
                      <StatusBadge variant={d.type === "PDF" ? "blue" : d.type === "Video" ? "teal" : "warn"}>{d.type}</StatusBadge>
                    </div>
                    <div className="flex gap-3 text-xs text-am-text-3">
                      <span>{d.ver}</span><span>{d.size}</span><span>{d.views} views</span><span>{d.date}</span>
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <button onClick={() => toast.info(`Editing: ${d.t}`)} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Edit</button>
                      <button onClick={() => toast.success(`Downloading: ${d.t}`)} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Download</button>
                      <button onClick={() => toast.success(`Deleted: ${d.t} (audit logged)`)} className="text-am-danger text-xs font-semibold cursor-pointer">Delete</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => toast.success("Add article")} className="w-full bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold py-2 rounded-lg cursor-pointer text-center mt-2.5">+ Add Article</button>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {tab === "faqs" && (
        <div>
          <div className="flex justify-between mb-3">
            <FilterSelect>
              <option>All Categories</option><option>KYC</option><option>Trading</option><option>Billing</option><option>Technical</option>
            </FilterSelect>
            <button onClick={() => toast.success("New FAQ created")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ Add FAQ</button>
          </div>
          <Panel title="Frequently Asked Questions" subtitle="12 published FAQs" pip="b">
            {faqData.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-am-border-faint">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-am-text">{f.q}</div>
                  <div className="text-xs text-am-text-3 mt-0.5">{f.cat} · {f.views} views</div>
                </div>
                <StatusBadge variant={f.status === "published" ? "ok" : "warn"}>{f.status}</StatusBadge>
                <button onClick={() => toast.info("Editing FAQ")} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Edit</button>
              </div>
            ))}
          </Panel>
        </div>
      )}

      {/* Tickets Overview Tab */}
      {tab === "tickets-overview" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
            <KpiCard value="8" label="Open Tickets" color="var(--am-gold)" sub="3 high priority" />
            <KpiCard value="3" label="In Progress" color="var(--am-primary)" sub="Avg 4h response" />
            <KpiCard value="145" label="Resolved (MTD)" color="var(--am-success)" sub="96% resolution rate" />
            <KpiCard value="2.1h" label="Avg Response Time" sub="Target: < 4h" />
          </div>
          <Panel title="Recent Tickets" pip="b" right={<button onClick={() => toast.info("Full ticket view")} className="text-am-primary text-sm font-semibold cursor-pointer">View All →</button>}>
            <DataTable headers={["Ticket ID", "Client", "Subject", "Priority", "Status", "Created", "Action"]}>
              {[
                { id: "TKT-089", cl: "Rajesh Kumar", s: "Copy trade not activating", pr: "bad", st: "warn", dt: "2h ago" },
                { id: "TKT-088", cl: "TechCorp Pvt", s: "Corporate KYC -- MOA rejected", pr: "warn", st: "blue", dt: "5h ago" },
                { id: "TKT-087", cl: "Priya Menon", s: "Invoice download not working", pr: "ok", st: "ok", dt: "1d ago" },
              ].map(tk => (
                <tr key={tk.id}>
                  <Td bold>{tk.id}</Td>
                  <Td>{tk.cl}</Td>
                  <Td>{tk.s}</Td>
                  <Td><StatusBadge variant={tk.pr}>{tk.pr === "bad" ? "High" : tk.pr === "warn" ? "Medium" : "Low"}</StatusBadge></Td>
                  <Td><StatusBadge variant={tk.st}>{tk.st === "warn" ? "Open" : tk.st === "blue" ? "In Progress" : "Resolved"}</StatusBadge></Td>
                  <Td className="text-[13px]">{tk.dt}</Td>
                  <Td><button onClick={() => toast.info("Ticket opened")} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">View</button></Td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      )}

      {/* Contact Config Tab */}
      {tab === "contact-cfg" && (
        <Panel title="Support Channel Configuration" pip="b" right={<button onClick={() => toast.success("Config saved")} className="bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">Save Changes</button>}>
          {[
            { ico: "\u{1F4AC}", l: "Live Chat", s: "Supabase Realtime", en: true, hours: "Mon-Fri, 9AM-6PM IST" },
            { ico: "\u{1F4E7}", l: "Email Support", s: "support@antmeta.in", en: true, hours: "24/7 auto-acknowledgement" },
            { ico: "\u{1F4F1}", l: "WhatsApp", s: "+91 98765 00000", en: true, hours: "Mon-Sat, 9AM-8PM IST" },
            { ico: "\u{1F4E2}", l: "Telegram Channel", s: "@AntMetaTraders", en: true, hours: "Always available" },
            { ico: "\u{1F4DE}", l: "Phone Support", s: "+91 44-XXXX-XXXX", en: false, hours: "Not configured" },
          ].map(ch => (
            <div key={ch.l} className="flex items-center gap-3 py-3 border-b border-am-border-faint">
              <div className="text-[22px] w-10 text-center">{ch.ico}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{ch.l}</div>
                <div className="text-[13px] text-am-text-3">{ch.s} · {ch.hours}</div>
              </div>
              <StatusBadge variant={ch.en ? "ok" : "bad"}>{ch.en ? "Active" : "Disabled"}</StatusBadge>
              <button onClick={() => toast.info(`Editing ${ch.l}`)} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Configure</button>
            </div>
          ))}
        </Panel>
      )}

      {/* Document Upload Tab */}
      {tab === "doc-upload" && (
        <div>
          <AlertBox variant="i">Upload user guideline documents (PDF, DOC, Video links). Files are version-controlled and categorized. Max file size: 25 MB. Admin-only edit/delete access. All actions are audit-logged.</AlertBox>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <Panel title="Upload New Document" pip="b">
              <div className="mb-3">
                <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Document Title *</label>
                <input placeholder="e.g., PAN Card Upload Guide" className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 text-sm text-am-text outline-none" />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Category *</label>
                <FilterSelect>
                  <option>Individual KYC</option><option>Corporate KYC</option><option>Algorithm Guides</option><option>Platform Usage</option><option>Billing & Payments</option>
                </FilterSelect>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Version</label>
                <input defaultValue="v1.0" className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 text-sm text-am-text outline-none" />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Upload Type</label>
                <div className="flex gap-2">
                  {["PDF / DOC File", "Video Link"].map(tp => (
                    <div key={tp} className="flex-1 text-center py-2 rounded-lg border border-am-border bg-black/15 cursor-pointer text-sm text-am-text-2">{tp}</div>
                  ))}
                </div>
              </div>
              <div
                className="border-2 border-dashed border-am-border rounded-[10px] px-4 py-6 text-center mb-3 cursor-pointer bg-[rgba(0,147,182,.03)]"
                onClick={() => toast.info("File picker opened")}
              >
                <div className="text-[28px] mb-1.5">&#128196;</div>
                <div className="text-sm font-semibold text-am-text-2">Click to upload or drag & drop</div>
                <div className="text-xs text-am-text-3 mt-1">PDF, DOC, DOCX up to 25 MB</div>
              </div>
              <button onClick={() => toast.success("Document uploaded successfully (audit logged)")} className="w-full bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer text-center">Upload Document</button>
            </Panel>

            <Panel title="Recent Uploads" subtitle="Version-controlled documents" pip="g">
              {recentUploads.map(d => (
                <div key={d.t} className="flex items-center gap-2.5 py-2.5 border-b border-am-border-faint">
                  <div className={`w-[34px] h-[34px] rounded-[7px] flex items-center justify-center text-base shrink-0 ${d.tp === "PDF" ? "bg-[rgba(0,147,182,.12)]" : "bg-[rgba(0,150,136,.12)]"}`}>
                    {d.tp === "PDF" ? "&#128196;" : "&#127916;"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-am-text truncate">{d.t}</div>
                    <div className="text-xs text-am-text-3">by {d.by} · {d.dt} · {d.sz}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toast.info("Viewing document")} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">View</button>
                    <button onClick={() => toast.success("Deleted (audit logged)")} className="text-am-danger text-xs font-semibold cursor-pointer">Delete</button>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
