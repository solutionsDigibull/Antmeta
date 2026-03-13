"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { Icon } from "@/components/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Master, KYCItem, Invoice } from "@/lib/types";

export default function AdminDashboard() {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [masters, setMasters] = useState<Master[]>([]);
  const [kycQueue, setKycQueue] = useState<KYCItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/masters").then(r => r.json()).then(d => { if (d.data) setMasters(d.data); }),
      fetch("/api/kyc/queue").then(r => r.json()).then(d => { if (d.data) setKycQueue(d.data); }),
      fetch("/api/invoices?limit=4").then(r => r.json()).then(d => { if (d.data) setInvoices(d.data); }),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* AUM 10% Drop Alert */}
      {!alertDismissed && (
        <div className="bg-[rgba(239,68,68,.08)] border border-[rgba(239,68,68,.25)] rounded-[10px] px-4 py-2.5 mb-3.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-am-danger-light flex items-center justify-center shrink-0">
            <Icon name="warn" size={14} className="text-am-danger" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-am-danger">AUM Alert -- 11.2% Drop Detected</div>
            <div className="text-[13px] text-am-text-3">
              Total AUM fell from ₹5.43Cr → ₹4.82Cr in last 30 days. M2 DELTA contributed −₹0.38Cr. Threshold: 10%.
            </div>
          </div>
          <button
            onClick={() => { toast.info("AUM alert acknowledged"); setAlertDismissed(true); }}
            className="bg-am-danger hover:bg-am-danger/80 text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="248" label="Total Clients" sub="112 Individual · 136 Corporate" />
        <KpiCard value="184" label="Subscribed Clients" sub="96 Standard · 54 Premium · 34 Exclusive" />
        <KpiCard value="₹4.82Cr" label="Total AUM" sub="▼ 11.2% · Alert Active" color="var(--am-danger)" />
        <KpiCard value="14" label="Active Partners" sub="102 referred clients · ₹4.74L TraaS" />
      </div>

      {/* AUM Trend Chart */}
      <Panel
        title="AUM Trend -- 30 Days"
        subtitle="Total assets under management"
        pip="b"
        right={
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold font-poppins text-am-danger">₹4.82Cr</span>
            <StatusBadge variant="bad">▼ 11.2%</StatusBadge>
          </div>
        }
      >
        <svg width="100%" height="100" viewBox="0 0 700 100" preserveAspectRatio="none" className="mb-2">
          <defs>
            <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--am-primary)" stopOpacity=".25" />
              <stop offset="100%" stopColor="var(--am-primary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="alertLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--am-primary)" />
              <stop offset="60%" stopColor="var(--am-gold)" />
              <stop offset="100%" stopColor="var(--am-danger)" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map(y => (
            <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(0,147,182,.06)" strokeWidth="1" />
          ))}
          <line x1="0" y1="78" x2="700" y2="78" stroke="rgba(239,68,68,.3)" strokeWidth="1" strokeDasharray="6,4" />
          <text x="705" y="82" fill="var(--am-danger)" fontSize="8" fontFamily="Inter">-10%</text>
          <path d="M0 75 L70 68 L140 55 L210 42 L280 28 L350 22 L420 25 L490 32 L560 48 L630 62 L700 78 L700 100 L0 100Z" fill="url(#aumGrad)" />
          <path d="M0 75 L70 68 L140 55 L210 42 L280 28 L350 22 L420 25 L490 32 L560 48 L630 62 L700 78" fill="none" stroke="url(#alertLine)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="350" cy="22" r="4" fill="var(--am-success)" stroke="var(--am-bg)" strokeWidth="2" />
          <text x="350" y="16" fill="var(--am-success)" fontSize="8" textAnchor="middle" fontWeight="700">₹5.43Cr</text>
          <circle cx="700" cy="78" r="4" fill="var(--am-danger)" stroke="var(--am-bg)" strokeWidth="2" />
          <text x="680" y="93" fill="var(--am-danger)" fontSize="8" textAnchor="end" fontWeight="700">₹4.82Cr</text>
        </svg>
        <div className="flex gap-5 text-[13px] text-am-text-3 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-[3px] bg-am-primary rounded-sm" /> M1 ALPHA ₹2.1Cr</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-[3px] bg-am-danger rounded-sm" /> M2 DELTA ₹1.4Cr <span className="text-am-danger">▼ ALERT</span></span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-[3px] bg-am-accent rounded-sm" /> M3 SIGMA ₹1.32Cr</span>
          <span className="ml-auto text-am-danger">--- 10% alert threshold</span>
        </div>
      </Panel>

      {/* 3-column: Master Accounts / KYC Queue / Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-3.5 mb-3.5">
        {/* Master Accounts */}
        <Panel
          title="Master Accounts"
          subtitle="Live performance"
          pip="b"
          right={<span className="text-sm text-am-primary cursor-pointer font-semibold">View All →</span>}
        >
          {masters.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 py-2.5 border-b border-am-border-faint">
              <div
                className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[13px] font-bold ${
                  m.id === "M1" ? "bg-am-primary-light text-am-primary" :
                  m.id === "M2" ? "bg-am-danger-light text-am-danger" :
                  "bg-am-accent-light text-am-accent"
                }`}
              >
                {m.id}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{m.name}</div>
                <div className="text-xs text-am-text-3">{m.clients} clients · {m.rate} success</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${m.pnl.startsWith("+") ? "text-am-success" : "text-am-danger"}`}>{m.pnl}</div>
                <StatusBadge variant={m.status === "active" ? "ok" : "warn"}>{m.status}</StatusBadge>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <div className="text-center p-2.5 bg-black/20 rounded-[7px] border border-am-border-faint">
              <div className="text-lg font-bold text-am-success">1,847</div>
              <div className="text-[13px] text-am-text-3">Trades Today</div>
            </div>
            <div className="text-center p-2.5 bg-black/20 rounded-[7px] border border-am-border-faint">
              <div className="text-lg font-bold text-am-primary">178</div>
              <div className="text-[13px] text-am-text-3">Active Copies</div>
            </div>
          </div>
        </Panel>

        {/* KYC Queue */}
        <Panel title="KYC Queue" subtitle={`${kycQueue.length} pending`} pip="g">
          {kycQueue.slice(0, 3).map((k) => (
            <div key={k.id} className="flex items-center gap-2.5 py-2 border-b border-am-border-faint">
              <UserAvatar name={k.name} size={30} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{k.name}</div>
                <div className="text-xs text-am-text-3">{k.type} · {k.time}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toast.success(`${k.name} KYC approved`)} className="bg-am-primary hover:bg-am-primary-hover text-white text-xs font-semibold px-2 py-1 rounded-md cursor-pointer">&#10003;</button>
                <button onClick={() => toast.error(`${k.name} KYC rejected`)} className="bg-am-danger hover:bg-am-danger/80 text-white text-xs font-semibold px-2 py-1 rounded-md cursor-pointer">&#10007;</button>
              </div>
            </div>
          ))}
        </Panel>

        {/* Activity Feed */}
        <Panel title="Activity Feed" pip="p">
          {[
            { t: "AUM Drop Alert -- ₹4.82Cr (−11.2%)", c: "text-am-danger", bg: "bg-am-danger", tm: "2 min ago" },
            { t: "Priya Menon KYC approved", c: "text-am-success", bg: "bg-am-success", tm: "18 min ago" },
            { t: "M2 DELTA success rate → 87%", c: "text-am-gold", bg: "bg-am-gold", tm: "45 min ago" },
            { t: "INV-2602-025 paid -- ₹8,850", c: "text-am-primary", bg: "bg-am-primary", tm: "1h ago" },
            { t: "Arun Ventures LLP registered", c: "text-am-success", bg: "bg-am-success", tm: "2h ago" },
          ].map((a, i) => (
            <div key={i} className="flex gap-2.5 py-2 border-b border-am-border-faint">
              <div className={`w-[7px] h-[7px] rounded-full shrink-0 mt-1.5 ${a.bg}`} />
              <div>
                <div className="text-sm text-am-text-2 leading-relaxed">{a.t}</div>
                <div className="text-xs text-am-text-3 mt-0.5">{a.tm}</div>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* Recent Invoices */}
      <Panel title="Recent Invoices" pip="b">
        <DataTable headers={["Invoice", "Client", "Amount", "Type", "Due", "Status", "Action"]}>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <Td bold>{inv.id}</Td>
              <Td>{inv.client}</Td>
              <Td bold>{inv.amt}</Td>
              <Td><StatusBadge variant="blue">{inv.type}</StatusBadge></Td>
              <Td>{inv.due}</Td>
              <Td>
                <StatusBadge variant={inv.status === "paid" ? "ok" : inv.status === "overdue" ? "bad" : "warn"}>
                  {inv.status.toUpperCase()}
                </StatusBadge>
              </Td>
              <Td>
                <button onClick={() => toast.info(`Link sent for ${inv.id}`)} className="text-am-text-2 hover:text-am-text text-sm font-semibold cursor-pointer">
                  Send
                </button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
