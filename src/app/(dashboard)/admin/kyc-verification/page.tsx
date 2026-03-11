"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { TabSwitcher } from "@/components/shared/tab-switcher";
import { ProgressBar } from "@/components/shared/progress-bar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { KYCQ } from "@/lib/data/kyc-queue";
import type { KYCItem } from "@/lib/types";

const detailClient = {
  name: "TechCorp Pvt Ltd",
  id: "260116100012",
  type: "corporate",
  progress: 67,
  docs: [
    { id: 1, name: "Company Incorporation Certificate", status: "approved", date: "12 Feb 2026", note: "Pvt Ltd registration verified" },
    { id: 2, name: "Company PAN Card", status: "approved", date: "12 Feb 2026", note: "NSDL auto-verified, name matches" },
    { id: 3, name: "Partnership/Proprietor PAN", status: "not-required", date: "-", note: "Pvt Ltd -- not applicable" },
    { id: 4, name: "Director PAN + Aadhaar", status: "pending", date: "14 Feb 2026", note: "2 of 3 directors submitted -- Director C pending" },
    { id: 5, name: "GST Registration Certificate", status: "approved", date: "12 Feb 2026", note: "GSTIN cross-checked with Company PAN" },
    { id: 6, name: "AOA & MOA", status: "uploaded", date: "14 Feb 2026", note: "Uploaded -- manual review required" },
  ],
};

const statusConfig: Record<string, { c: string; bg: string; l: string }> = {
  approved: { c: "var(--am-success)", bg: "bg-am-success-light", l: "Approved" },
  pending: { c: "var(--am-gold)", bg: "bg-am-gold-light", l: "Pending" },
  uploaded: { c: "var(--am-primary)", bg: "bg-am-primary-light", l: "Review" },
  rejected: { c: "var(--am-danger)", bg: "bg-am-danger-light", l: "Rejected" },
  "not-required": { c: "var(--am-text-3)", bg: "bg-black/5", l: "N/A" },
};

export default function KYCVerification() {
  const [tab, setTab] = useState("all");
  const [selectedClient, setSelectedClient] = useState<KYCItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [kycQueue, setKycQueue] = useState<KYCItem[]>(KYCQ);

  useEffect(() => {
    fetch("/api/kyc/queue").then(r => r.json()).then(d => { if (d.data) setKycQueue(d.data); }).catch(() => {});
  }, []);

  const filtered = tab === "all" ? kycQueue : kycQueue.filter((k) => k.type === tab);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="12" label="Pending Review" color="var(--am-gold)" sub="Individual: 5 · Corporate: 7" />
        <KpiCard value="34" label="Fully Approved" color="var(--am-success)" sub="this month" />
        <KpiCard value="8" label="Partially Approved" color="var(--am-primary)" sub="awaiting docs" />
        <KpiCard value="3" label="Rejected" color="var(--am-danger)" sub="this month" />
      </div>

      {/* Tab Switcher */}
      <TabSwitcher
        tabs={[["all", `All Pending (${kycQueue.length})`], ["individual", "Individual"], ["corporate", "Corporate"]]}
        active={tab}
        onChange={setTab}
      />

      <div className={`grid gap-3.5 ${selectedClient ? "grid-cols-1 lg:grid-cols-[1fr_1.3fr]" : "grid-cols-1"}`}>
        {/* Queue List */}
        <Panel title="KYC Review Queue" pip="g">
          {filtered.map((k) => (
            <div
              key={k.id}
              onClick={() => setSelectedClient(k)}
              className={`flex items-center gap-2.5 py-2.5 border-b border-am-border-faint cursor-pointer transition-colors ${
                selectedClient?.id === k.id ? "bg-[rgba(0,147,182,.06)] -mx-3 px-3 rounded-[7px]" : ""
              }`}
            >
              <UserAvatar name={k.name} size={34} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{k.name}</div>
                <div className="text-[13px] text-am-text-3">{k.id} · {k.type} · {k.time}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {k.docs.map((d, i) => (
                    <StatusBadge key={i} variant={d.includes("\✓") ? "ok" : "warn"}>{d}</StatusBadge>
                  ))}
                </div>
              </div>
              {!selectedClient && (
                <div className="flex gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); toast.success(`${k.name} approved`); }} className="bg-am-primary hover:bg-am-primary-hover text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer">Approve</button>
                  <button onClick={(e) => { e.stopPropagation(); toast.error(`${k.name} rejected`); }} className="bg-am-danger hover:bg-am-danger/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer">Reject</button>
                </div>
              )}
            </div>
          ))}
        </Panel>

        {/* Detail Review Panel */}
        {selectedClient && (
          <Panel
            title={`KYC Review: ${detailClient.name}`}
            subtitle={`${detailClient.id} · ${detailClient.type}`}
            pip="b"
            right={
              <button onClick={() => setSelectedClient(null)} className="text-am-text-3 hover:text-am-text text-sm font-semibold cursor-pointer">
                &#10005; Close
              </button>
            }
          >
            {/* Progress */}
            <div className="mb-3.5">
              <div className="flex justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-am-text-2">KYC Progress</span>
                <span className="text-sm font-bold text-am-gold">{detailClient.progress}%</span>
              </div>
              <div className="h-1.5 bg-am-border-faint rounded-sm">
                <div className="h-full rounded-sm bg-am-gold transition-all duration-400" style={{ width: `${detailClient.progress}%` }} />
              </div>
              <div className="text-xs text-am-text-3 mt-1">
                Status: <span className="text-am-gold font-semibold">Partially Approved</span> -- {detailClient.docs.filter(d => d.status === "approved").length}/{detailClient.docs.filter(d => d.status !== "not-required").length} documents approved
              </div>
            </div>

            {/* Per-document review */}
            {detailClient.docs.map(d => {
              const s = statusConfig[d.status] || statusConfig.pending;
              return (
                <div key={d.id} className="p-3 bg-black/15 border border-am-border-faint rounded-lg mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-[22px] h-[22px] rounded-[5px] ${s.bg} flex items-center justify-center text-xs font-bold`} style={{ color: s.c }}>{d.id}</div>
                      <div className="text-sm font-semibold text-am-text">{d.name}</div>
                    </div>
                    <div className={`text-xs font-semibold ${s.bg} py-0.5 px-2 rounded-[5px]`} style={{ color: s.c }}>{s.l}</div>
                  </div>
                  <div className="text-[13px] text-am-text-3 mb-1.5">{d.note} · {d.date}</div>
                  {(d.status === "uploaded" || d.status === "pending") && (
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <button onClick={() => toast.info(`Viewing ${d.name}`)} className="text-am-text-2 hover:text-am-text border border-am-border rounded-md px-2 py-1 text-xs font-semibold cursor-pointer">View</button>
                      <button onClick={() => toast.success(`${d.name} approved`)} className="bg-am-primary hover:bg-am-primary-hover text-white text-xs font-semibold px-2 py-1 rounded-md cursor-pointer">Approve</button>
                      <button
                        onClick={() => { if (!rejectReason) { toast.error("Enter rejection reason first"); return; } toast.error(`${d.name} rejected: ${rejectReason}`); setRejectReason(""); }}
                        className="bg-am-danger hover:bg-am-danger/80 text-white text-xs font-semibold px-2 py-1 rounded-md cursor-pointer"
                      >
                        Reject
                      </button>
                      <input
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="flex-1 bg-am-input-bg border border-am-border rounded-md px-2 py-1 text-[13px] text-am-text outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-am-border-faint">
              <button onClick={() => toast.success("KYC Fully Approved")} className="flex-1 bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer text-center">Fully Approve KYC</button>
              <button onClick={() => toast.error("KYC Rejected -- client notified")} className="flex-1 bg-am-danger hover:bg-am-danger/80 text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer text-center">Reject KYC</button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
