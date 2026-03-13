"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import type { Partner } from "@/lib/types";

export default function PartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partners").then(r => r.json()).then(d => { if (d.data) setPartners(d.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="14" label="Total Partners" sub="11 Active · 3 Under Review" />
        <KpiCard value="102" label="Referred Clients" sub="41% of total client base" />
        <KpiCard value="₹4.74L" label="Total TraaS Revenue" sub="This 90-day cycle" />
        <KpiCard value="₹33.8K" label="Avg Revenue/Partner" sub="Per 90-day cycle" />
      </div>

      <Panel
        title="Partner Directory"
        pip="p"
        right={
          <button onClick={() => toast.success("Partner created")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
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
    </div>
  );
}
