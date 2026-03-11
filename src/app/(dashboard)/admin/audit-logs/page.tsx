"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";

const auditEntries = [
  { ts: "24 Feb 2026, 14:32", u: "Raghav S.", a: "KYC Approved", d: "Client: Priya Menon", ip: "122.164.xx.xx", r: "ok" },
  { ts: "24 Feb 2026, 14:18", u: "System", a: "AUM Alert", d: "Drop 11.2% -- threshold exceeded", ip: "13.235.x.x", r: "warn" },
  { ts: "24 Feb 2026, 13:45", u: "Sathish K.", a: "Invoice Sent", d: "INV-2602-025 to Priya Menon", ip: "49.204.xx.xx", r: "ok" },
  { ts: "24 Feb 2026, 12:30", u: "Raghav S.", a: "Admin Login", d: "Chrome on Mac · Mumbai", ip: "122.164.xx.xx", r: "ok" },
  { ts: "24 Feb 2026, 10:15", u: "System", a: "Copy Trading", d: "M2 DELTA rate dropped to 87%", ip: "13.235.x.x", r: "warn" },
  { ts: "24 Feb 2026, 09:00", u: "System", a: "P&L Sync", d: "Daily sync complete -- all masters", ip: "13.235.x.x", r: "ok" },
];

export default function AuditLogs() {
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
