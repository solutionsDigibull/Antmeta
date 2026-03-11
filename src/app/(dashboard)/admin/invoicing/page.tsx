"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";
import { INVOICES } from "@/lib/data/invoices";
import type { Invoice } from "@/lib/types";

export default function Invoicing() {
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(INVOICES);

  useEffect(() => {
    fetch("/api/invoices").then(r => r.json()).then(d => { if (d.data) setInvoiceList(d.data); }).catch(() => {});
  }, []);

  return (
    <div>
      <FilterBar>
        <FilterSelect>
          <option>All Status</option>
          <option>Overdue</option>
          <option>Pending</option>
          <option>Paid</option>
        </FilterSelect>
        <FilterSelect>
          <option>All Types</option>
          <option>Standard</option>
          <option>Premium</option>
          <option>TraaS</option>
        </FilterSelect>
        <FilterRight>
          <button onClick={() => toast.success("Report exported")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">Export PDF</button>
          <button onClick={() => toast.success("New invoice created")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ New Invoice</button>
        </FilterRight>
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="7" label="Overdue" color="var(--am-danger)" sub="₹1.42L outstanding" />
        <KpiCard value="14" label="Pending" color="var(--am-gold)" sub="₹1.42L due" />
        <KpiCard value="156" label="Paid" color="var(--am-success)" sub="This cycle" />
        <KpiCard value="₹2.84L" label="Total Outstanding" />
      </div>

      <Panel title="Invoice List" pip="g">
        <DataTable headers={["Invoice ID", "Client", "Amount", "Type", "Due Date", "Status", "Actions"]}>
          {invoiceList.map(i => (
            <tr key={i.id}>
              <Td bold>{i.id}</Td>
              <Td>{i.client}</Td>
              <Td bold>{i.amt}</Td>
              <Td><StatusBadge>{i.type}</StatusBadge></Td>
              <Td>{i.due}</Td>
              <Td>
                <StatusBadge variant={i.status === "paid" ? "ok" : i.status === "overdue" ? "bad" : "warn"}>
                  {i.status.toUpperCase()}
                </StatusBadge>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => toast.success("Downloaded")} className="text-am-text-2 hover:text-am-text text-sm font-semibold cursor-pointer">Download</button>
                  {i.status !== "paid" && (
                    <button onClick={() => toast.success("Link sent")} className="bg-am-primary hover:bg-am-primary-hover text-white text-xs font-semibold px-2 py-1 rounded-md cursor-pointer ml-1">Send Link</button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
