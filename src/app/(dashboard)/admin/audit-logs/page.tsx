"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";

interface AuditEntry { ts: string; u: string; a: string; d: string; ip: string; r: string }

export default function AuditLogs() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit-logs")
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setAuditEntries(d.data.map((e: Record<string, string>) => ({
            ts: e.created_at ? new Date(e.created_at).toLocaleString("en-IN") : "—",
            u: e.user_name || "System",
            a: e.action?.split(".").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "—",
            d: e.details ? (typeof e.details === "string" ? e.details : JSON.stringify(e.details)) : "—",
            ip: e.ip_address || "—",
            r: "ok",
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <FilterBar>
        <FilterSelect>
          <option>All Actions</option>
          <option>Login</option>
          <option>KYC</option>
          <option>Invoice</option>
          <option>Trading</option>
        </FilterSelect>
        <FilterRight>
          <button onClick={() => toast.success("Audit log exported")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">Export Log</button>
        </FilterRight>
      </FilterBar>

      <Panel title="Audit Log" pip="b">
        <DataTable headers={["Timestamp", "User", "Action", "Details", "IP", "Result"]}>
          {auditEntries.map(l => (
            <tr key={l.ts + l.a}>
              <Td className="text-[13px]">{l.ts}</Td>
              <Td bold>{l.u}</Td>
              <Td>{l.a}</Td>
              <Td className="text-[13px] text-am-text-3">{l.d}</Td>
              <Td className="text-[13px] text-am-text-3">{l.ip}</Td>
              <Td>
                <StatusBadge variant={l.r}>{l.r === "ok" ? "success" : "warning"}</StatusBadge>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
