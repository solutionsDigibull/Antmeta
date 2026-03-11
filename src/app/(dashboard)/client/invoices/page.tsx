"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";

const defaultInvoices = [
  {
    id: "INV-2602-023",
    amt: "₹4,425",
    plan: "Standard Q1",
    due: "10 Feb 2026",
    status: "overdue" as const,
  },
  {
    id: "INV-2601-018",
    amt: "₹4,425",
    plan: "Standard Q4",
    due: "10 Nov 2025",
    status: "paid" as const,
  },
];

export default function InvoicesClientPage() {
  const [invoices, setInvoices] = useState(defaultInvoices);

  useEffect(() => {
    fetch("/api/invoices")
      .then(r => r.json())
      .then(d => {
        if (d.data) setInvoices(d.data.map((inv: Record<string, string>) => ({
          id: inv.id, amt: inv.amt, plan: inv.type, due: inv.due, status: inv.status,
        })));
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-3.5">
        <KpiCard value="1" label="Overdue Invoice" color="var(--am-danger)" />
        <KpiCard value="5" label="Paid Invoices" color="var(--am-success)" />
        <KpiCard value="₹4,425" label="Outstanding" />
        <KpiCard value="₹22,125" label="Total Paid" />
      </div>

      {/* Invoice List */}
      <Panel
        title="My Invoices"
        pip="b"
        right={
          <button
            onClick={() => toast.success("All invoices downloaded")}
            className="text-xs font-semibold text-am-text-3 hover:text-am-text px-2 py-1 rounded cursor-pointer transition-colors"
          >
            Download All
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Invoice ID", "Amount", "Plan", "Due Date", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="text-xs font-semibold tracking-wider uppercase text-am-text-3 text-left px-3 pb-2.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="text-sm font-bold text-am-text px-3 py-2.5 border-t border-am-border-faint">
                    {inv.id}
                  </td>
                  <td className="text-sm font-bold text-am-text px-3 py-2.5 border-t border-am-border-faint">
                    {inv.amt}
                  </td>
                  <td className="px-3 py-2.5 border-t border-am-border-faint">
                    <StatusBadge variant="blue">{inv.plan}</StatusBadge>
                  </td>
                  <td className="text-sm text-am-text-2 px-3 py-2.5 border-t border-am-border-faint">
                    {inv.due}
                  </td>
                  <td className="px-3 py-2.5 border-t border-am-border-faint">
                    <StatusBadge variant={inv.status === "overdue" ? "bad" : "ok"}>
                      {inv.status === "overdue" ? "OVERDUE" : "PAID"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5 border-t border-am-border-faint">
                    {inv.status === "overdue" ? (
                      <button
                        onClick={() => toast("Cashfree checkout opening\u2026")}
                        className="bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-xs rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <button
                        onClick={() => toast.success("Invoice downloaded")}
                        className="text-xs font-semibold text-am-text-3 hover:text-am-text px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Download PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
