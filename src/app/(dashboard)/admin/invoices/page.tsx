"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";
import type { Invoice } from "@/lib/types";

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInvoices = (status?: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (status) params.set("status", status);
    fetch(`/api/invoices?${params}`)
      .then(r => r.json())
      .then(d => { if (d.data) setInvoices(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    fetchInvoices(val || undefined);
  };

  const overdue = invoices.filter(i => i.status === "overdue").length;
  const pending = invoices.filter(i => i.status === "pending").length;
  const paid = invoices.filter(i => i.status === "paid").length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value={String(invoices.length)} label="Total Invoices" />
        <KpiCard value={String(overdue)} label="Overdue" color="var(--am-danger)" />
        <KpiCard value={String(pending)} label="Pending" color="var(--am-gold)" />
        <KpiCard value={String(paid)} label="Paid" color="var(--am-success)" />
      </div>

      <FilterBar>
        <FilterSelect
          value={statusFilter}
          onChange={e => handleStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </FilterSelect>
        <FilterRight>
          <button
            onClick={() => toast.success("Invoice list exported as CSV")}
            className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer"
          >
            Export CSV
          </button>
        </FilterRight>
      </FilterBar>

      <Panel title="Invoices" subtitle={`${invoices.length} total`} pip="b">
        <DataTable headers={["Invoice #", "Client", "Amount", "Type", "Status", "Due Date", "Actions"]}>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <Td bold>{inv.id}</Td>
              <Td>{inv.client}</Td>
              <Td bold>{inv.amt}</Td>
              <Td>{inv.type}</Td>
              <Td>
                <StatusBadge variant={inv.status === "paid" ? "ok" : inv.status === "overdue" ? "bad" : "warn"}>
                  {inv.status}
                </StatusBadge>
              </Td>
              <Td color={inv.status === "overdue" ? "var(--am-danger)" : undefined}>{inv.due}</Td>
              <Td>
                <div className="flex gap-1">
                  <button
                    onClick={() => toast.info(`Viewing invoice ${inv.id}`)}
                    className="text-am-text-2 hover:text-am-text text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer border border-am-border"
                  >
                    View
                  </button>
                  <button
                    onClick={() => toast.success(`PDF downloaded for ${inv.id}`)}
                    className="text-am-primary hover:text-am-primary-hover text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    PDF
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
        {!loading && invoices.length === 0 && (
          <div className="text-sm text-am-text-3 text-center py-6">No invoices found.</div>
        )}
      </Panel>
    </div>
  );
}
