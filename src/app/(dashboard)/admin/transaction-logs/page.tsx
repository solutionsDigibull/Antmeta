"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";

interface TxnRow { id: string; cl: string; a: string; gw: string; gwv: string; inv: string; dt: string; st: string }

export default function TxnLogs() {
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setTransactions(d.data.map((t: Record<string, string>) => ({
            id: t.id || t.gateway_ref || "—",
            cl: t.client_name || "—",
            a: t.amount || "—",
            gw: t.gateway || "razorpay",
            gwv: t.gateway === "razorpay" ? "blue" : "purple",
            inv: t.invoice_number || "—",
            dt: t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "—",
            st: t.status === "success" ? "ok" : t.status === "pending" ? "warn" : "bad",
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
