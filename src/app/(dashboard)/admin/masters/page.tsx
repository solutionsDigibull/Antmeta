"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";
import type { Master } from "@/lib/types";

export default function MastersScreen() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/masters")
      .then(r => r.json())
      .then(d => { if (d.data) setMasters(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = masters.filter(m => m.status === "active").length;
  const totalClients = masters.reduce((s, m) => s + m.clients, 0);
  const totalTrades = masters.reduce((s, m) => s + m.trades, 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value={String(masters.length)} label="Total Master Accounts" sub={`${active} Active`} />
        <KpiCard value={String(totalClients)} label="Total Clients Subscribed" />
        <KpiCard value={String(totalTrades)} label="Total Trades Executed" />
        <KpiCard value={`${masters.length > 0 ? Math.round(masters.reduce((s, m) => s + parseFloat(m.rate), 0) / masters.length) : 0}%`} label="Avg Success Rate" color="var(--am-success)" />
      </div>

      <FilterBar>
        <FilterSelect>
          <option>All Algorithms</option>
          <option>M1 ALPHA</option>
          <option>M2 DELTA</option>
          <option>M3 SIGMA</option>
        </FilterSelect>
        <FilterSelect>
          <option>All Statuses</option>
          <option>Active</option>
          <option>Under Review</option>
        </FilterSelect>
        <FilterRight>
          <button
            onClick={() => toast.success("Master accounts exported as CSV")}
            className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer"
          >
            Export CSV
          </button>
        </FilterRight>
      </FilterBar>

      <Panel title="Master Accounts" subtitle={`${masters.length} accounts`} pip="b">
        <DataTable headers={["ID", "Name", "Asset Class", "Clients", "Total P&L", "Success Rate", "Trades", "Status", "Actions"]}>
          {masters.map((m) => (
            <tr key={m.id}>
              <Td bold>{m.id}</Td>
              <Td bold>{m.name}</Td>
              <Td>{m.assets}</Td>
              <Td>{m.clients}</Td>
              <Td bold color={m.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"}>{m.pnl}</Td>
              <Td bold color="var(--am-success)">{m.rate}</Td>
              <Td>{m.trades}</Td>
              <Td>
                <StatusBadge variant={m.status === "active" ? "ok" : "warn"}>
                  {m.status}
                </StatusBadge>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <button
                    onClick={() => toast.info(`Viewing ${m.name}`)}
                    className="text-am-text-2 hover:text-am-text text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer border border-am-border"
                  >
                    View
                  </button>
                  <button
                    onClick={() => toast.info(`Editing ${m.name}`)}
                    className="text-am-primary hover:text-am-primary-hover text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {!loading && masters.length === 0 && (
          <div className="text-sm text-am-text-3 text-center py-6">No master accounts found.</div>
        )}
      </Panel>
    </div>
  );
}
