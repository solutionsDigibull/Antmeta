"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";

const transactions = [
  { id: "CF_TXN_8821", cl: "Priya Menon", a: "₹8,850", gw: "Cashfree", gwv: "blue", inv: "INV-2602-025", dt: "15 Feb 2026, 14:32", st: "ok" },
  { id: "STR_TXN_4412", cl: "TechCorp Pvt", a: "₹32,250", gw: "Stripe", gwv: "purple", inv: "INV-2602-024", dt: "12 Feb 2026, 10:15", st: "warn" },
  { id: "CF_TXN_7730", cl: "Rajesh Kumar", a: "₹4,425", gw: "Cashfree", gwv: "blue", inv: "INV-2602-023", dt: "5 Feb 2026, 09:00", st: "bad" },
];

export default function TxnLogs() {
  return (
    <div>
      <FilterBar>
        <FilterSelect>
          <option>All Gateways</option>
          <option>Cashfree</option>
          <option>Stripe</option>
          <option>Payment Link</option>
        </FilterSelect>
        <FilterSelect>
          <option>All Status</option>
          <option>Success</option>
          <option>Failed</option>
          <option>Refunded</option>
        </FilterSelect>
        <FilterRight>
          <button onClick={() => toast.success("CSV exported")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">Export CSV</button>
        </FilterRight>
      </FilterBar>

      <Panel title="Transaction Logs" subtitle="Cashfree + Stripe gateway records" pip="b">
        <DataTable headers={["Txn ID", "Client", "Amount", "Gateway", "Invoice", "Date & Time", "Status"]}>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <Td bold>{tx.id}</Td>
              <Td>{tx.cl}</Td>
              <Td bold>{tx.a}</Td>
              <Td><StatusBadge variant={tx.gwv}>{tx.gw}</StatusBadge></Td>
              <Td>{tx.inv}</Td>
              <Td className="text-[13px]">{tx.dt}</Td>
              <Td>
                <StatusBadge variant={tx.st}>
                  {tx.st === "ok" ? "SUCCESS" : tx.st === "warn" ? "PENDING" : "FAILED"}
                </StatusBadge>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
