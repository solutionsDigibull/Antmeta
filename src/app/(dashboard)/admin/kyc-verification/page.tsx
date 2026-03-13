"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { TabSwitcher } from "@/components/shared/tab-switcher";

import { UserAvatar } from "@/components/shared/user-avatar";
import type { KYCItem } from "@/lib/types";

interface KycDoc {
  id: string;
  document_type: string;
  status: string;
  file_name: string | null;
  uploaded_at: string;
  reviewer_note: string | null;
}

const statusConfig: Record<string, { c: string; bg: string; l: string }> = {
  approved: { c: "var(--am-success)", bg: "bg-am-success-light", l: "Approved" },
  pending: { c: "var(--am-gold)", bg: "bg-am-gold-light", l: "Pending" },
  uploaded: { c: "var(--am-primary)", bg: "bg-am-primary-light", l: "Review" },
  rejected: { c: "var(--am-danger)", bg: "bg-am-danger-light", l: "Rejected" },
  "not-required": { c: "var(--am-text-3)", bg: "bg-black/5", l: "N/A" },
};

function formatDocName(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatDocDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function KYCVerification() {
  const [tab, setTab] = useState("all");
  const [selectedClient, setSelectedClient] = useState<KYCItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [kycQueue, setKycQueue] = useState<KYCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDocs, setClientDocs] = useState<KycDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/kyc/queue").then(r => r.json()).then(d => { if (d.data) setKycQueue(d.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectClient = useCallback((client: KYCItem) => {
    setSelectedClient(client);
    setDocsLoading(true);
    fetch(`/api/kyc/${client.id}`)
      .then(r => r.json())
      .then(d => { if (d.data) setClientDocs(d.data); })
      .catch(() => setClientDocs([]))
      .finally(() => setDocsLoading(false));
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
              onClick={() => selectClient(k)}
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
        {selectedClient && (() => {
          const verifiedCount = clientDocs.filter(d => d.status === "verified").length;
          const totalDocs = clientDocs.length;
          const progress = totalDocs > 0 ? Math.round((verifiedCount / totalDocs) * 100) : 0;
          return (
          <Panel
            title={`KYC Review: ${selectedClient.name}`}
            subtitle={`${selectedClient.id} · ${selectedClient.type}`}
            pip="b"
            right={
              <button onClick={() => { setSelectedClient(null); setClientDocs([]); }} className="text-am-text-3 hover:text-am-text text-sm font-semibold cursor-pointer">
                &#10005; Close
              </button>
            }
          >
            {docsLoading ? (
              <div className="text-sm text-am-text-3 py-4 text-center">Loading documents...</div>
            ) : (
            <>
            {/* Progress */}
            <div className="mb-3.5">
              <div className="flex justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-am-text-2">KYC Progress</span>
                <span className="text-sm font-bold text-am-gold">{progress}%</span>
              </div>
              <div className="h-1.5 bg-am-border-faint rounded-sm">
                <div className="h-full rounded-sm bg-am-gold transition-all duration-400" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-xs text-am-text-3 mt-1">
                Status: <span className="text-am-gold font-semibold">{verifiedCount === totalDocs && totalDocs > 0 ? 'Fully Approved' : 'Partially Approved'}</span> -- {verifiedCount}/{totalDocs} documents approved
              </div>
            </div>

            {/* Per-document review */}
            {clientDocs.map((d, idx) => {
              const docStatus = d.status === 'verified' ? 'approved' : d.status;
              const s = statusConfig[docStatus] || statusConfig.pending;
              return (
                <div key={d.id} className="p-3 bg-black/15 border border-am-border-faint rounded-lg mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-[22px] h-[22px] rounded-[5px] ${s.bg} flex items-center justify-center text-xs font-bold`} style={{ color: s.c }}>{idx + 1}</div>
                      <div className="text-sm font-semibold text-am-text">{formatDocName(d.document_type)}</div>
                    </div>
                    <div className={`text-xs font-semibold ${s.bg} py-0.5 px-2 rounded-[5px]`} style={{ color: s.c }}>{s.l}</div>
                  </div>
                  <div className="text-[13px] text-am-text-3 mb-1.5">{d.reviewer_note || d.file_name || 'No notes'} · {formatDocDate(d.uploaded_at)}</div>
                  {(docStatus === "uploaded" || docStatus === "pending") && (
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <button onClick={() => toast.info(`Viewing ${formatDocName(d.document_type)}`)} className="text-am-text-2 hover:text-am-text border border-am-border rounded-md px-2 py-1 text-xs font-semibold cursor-pointer">View</button>
                      <button onClick={() => toast.success(`${formatDocName(d.document_type)} approved`)} className="bg-am-primary hover:bg-am-primary-hover text-white text-xs font-semibold px-2 py-1 rounded-md cursor-pointer">Approve</button>
                      <button
                        onClick={() => { if (!rejectReason) { toast.error("Enter rejection reason first"); return; } toast.error(`${formatDocName(d.document_type)} rejected: ${rejectReason}`); setRejectReason(""); }}
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

            {clientDocs.length === 0 && (
              <div className="text-sm text-am-text-3 py-4 text-center">No documents uploaded yet.</div>
            )}

            {/* Final Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-am-border-faint">
              <button onClick={() => toast.success("KYC Fully Approved")} className="flex-1 bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer text-center">Fully Approve KYC</button>
              <button onClick={() => toast.error("KYC Rejected -- client notified")} className="flex-1 bg-am-danger hover:bg-am-danger/80 text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer text-center">Reject KYC</button>
            </div>
            </>
            )}
          </Panel>
          );
        })()}
      </div>
    </div>
  );
}
