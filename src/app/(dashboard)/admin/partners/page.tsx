"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { Modal } from "@/components/shared/modal";
import type { Partner } from "@/lib/types";

export default function PartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerUserId, setNewPartnerUserId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/partners")
      .then(r => r.json())
      .then(d => { if (d.data) setPartners(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => { setNewPartnerName(""); setNewPartnerUserId(""); };

  const handleAddPartner = async () => {
    if (!newPartnerName.trim()) { toast.error("Partner name is required"); return; }
    setAdding(true);
    try {
      const body: Record<string, string> = { name: newPartnerName.trim() };
      if (newPartnerUserId.trim()) body.user_id = newPartnerUserId.trim();

      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add partner");
        return;
      }
      setPartners(prev => [data.data, ...prev]);
      toast.success("Partner created successfully");
      setShowAdd(false);
      resetForm();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const totalAum = partners.reduce((sum, p) => {
    const n = parseFloat(p.aum.replace(/[^\d.]/g, "")) || 0;
    return sum + n;
  }, 0);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value={String(partners.length)} label="Total Partners" sub={`${partners.filter(p => p.status === "active").length} Active · ${partners.filter(p => p.status === "review").length} Under Review`} />
        <KpiCard value={String(partners.reduce((s, p) => s + p.clients, 0))} label="Referred Clients" />
        <KpiCard value="₹4.74L" label="Total TraaS Revenue" sub="This 90-day cycle" />
        <KpiCard value="₹33.8K" label="Avg Revenue/Partner" sub="Per 90-day cycle" />
      </div>

      <Panel
        title="Partner Directory"
        pip="p"
        right={
          <button
            onClick={() => setShowAdd(true)}
            className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
          >
            + Add Partner
          </button>
        }
      >
        <DataTable headers={["Partner ID", "Name", "Clients", "AUM", "MTD P&L", "TraaS Revenue", "Status", "Actions"]}>
          {partners.map((p) => (
            <tr key={p.id}>
              <Td bold>{p.id}</Td>
              <Td bold>{p.name}</Td>
              <Td>{p.clients}</Td>
              <Td>{p.aum}</Td>
              <Td bold color={p.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"}>{p.pnl}</Td>
              <Td bold color="var(--am-success)">{p.rev}</Td>
              <Td><StatusBadge variant={p.status === "active" ? "ok" : "warn"}>{p.status}</StatusBadge></Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => toast.info(`Viewing ${p.name}`)} className="text-am-text-2 hover:text-am-text text-sm font-semibold cursor-pointer">View</button>
                  <button onClick={() => toast.success("Report sent")} className="text-am-primary hover:text-am-primary-hover text-sm font-semibold cursor-pointer ml-2">Report</button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {/* Add Partner Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Add New Partner" width={420}>
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Partner Name *</label>
            <input
              value={newPartnerName}
              onChange={(e) => setNewPartnerName(e.target.value)}
              placeholder="e.g. Sharma Associates"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 text-sm text-am-text outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Link to User ID (Optional)</label>
            <input
              value={newPartnerUserId}
              onChange={(e) => setNewPartnerUserId(e.target.value)}
              placeholder="Existing user UUID"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 text-sm text-am-text outline-none font-mono"
            />
            <p className="text-[12px] text-am-text-3 mt-1">Leave blank to create without linking a user account.</p>
          </div>
        </div>
        <div className="flex gap-2.5 justify-end pt-3 border-t border-am-border-faint">
          <button
            onClick={() => { setShowAdd(false); resetForm(); }}
            className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAddPartner}
            disabled={adding}
            className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {adding ? "Creating…" : "Add Partner"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
