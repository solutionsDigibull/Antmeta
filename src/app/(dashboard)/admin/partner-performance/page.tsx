"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import type { Partner } from "@/lib/types";

const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}", "4"];

export default function PartnerPerf() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/partners").then(r => r.json()).then(d => { if (d.data) setPartners(d.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="14" label="Active Partners" />
        <KpiCard value="102" label="Partner Clients" />
        <KpiCard value="₹4.74L" label="Total Revenue" />
        <KpiCard value="+18.2%" label="Partner Growth" color="var(--am-success)" />
      </div>

      <Panel title="Partner Leaderboard" pip="p">
        <DataTable headers={["#", "Partner", "Clients", "AUM", "MTD P&L", "TraaS Revenue", "Status", "Action"]}>
          {partners.map((p, i) => (
            <tr key={p.id}>
              <Td bold>{medals[i]}</Td>
              <Td bold>{p.name}</Td>
              <Td>{p.clients}</Td>
              <Td>{p.aum}</Td>
              <Td bold color={p.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"}>{p.pnl}</Td>
              <Td bold color="var(--am-success)">{p.rev}</Td>
              <Td><StatusBadge variant={p.status === "active" ? "ok" : "warn"}>{p.status}</StatusBadge></Td>
              <Td>
                <button onClick={() => toast.info("Report viewed")} className="text-am-text-2 hover:text-am-text text-sm font-semibold cursor-pointer">Report</button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
