"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { AlertBox } from "@/components/shared/alert-box";

interface BillingRow { n: string; pnl: string; inv: string; m: string; st: string; a: string }

export default function BillingCycles() {
  const [billingClients, setBillingClients] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing-cycles")
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setBillingClients(d.data.map((c: Record<string, unknown>) => ({
            n: (c as Record<string, string>).client_name || "—",
            pnl: String(c.gross_pnl || "₹0"),
            inv: String(c.platform_share || "₹0"),
            m: "Razorpay",
            st: c.status === "invoiced" ? "ok" : c.status === "closed" ? "warn" : "blue",
            a: c.status === "invoiced" ? "Download" : c.status === "closed" ? "Send Link" : "--",
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <AlertBox variant="i">TraaS billing: 25% of trading profits captured every 90 days. Payment links sent via Cashfree (India) or Stripe (International).</AlertBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="₹5.1L" label="Cycle Revenue Est." sub="Current 90-day cycle" />
        <KpiCard value="23" label="TraaS Clients" sub="Exclusive plan" />
        <KpiCard value="14" label="Days Remaining" sub="In current cycle" />
        <KpiCard value="₹21.2L" label="Total Profits (Cycle)" sub="All TraaS clients" />
      </div>

      <Panel
        title="TraaS Client Billing"
        subtitle="Cycle: 02 Jan -- 02 Apr 2026"
        pip="g"
        right={
          <button onClick={() => toast.success("Billing cycle processed -- 23 payment links generated")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
            Run Billing Cycle
          </button>
        }
      >
        <DataTable headers={["Client", "Plan", "90d P&L", "Invoice (25%)", "Method", "Status", "Action"]}>
          {billingClients.map(c => (
            <tr key={c.n}>
              <Td bold>{c.n}</Td>
              <Td><StatusBadge variant="teal">Exclusive</StatusBadge></Td>
              <Td bold color={c.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"}>{c.pnl}</Td>
              <Td bold>{c.inv}</Td>
              <Td>{c.m}</Td>
              <Td>
                <StatusBadge variant={c.st}>
                  {c.st === "ok" ? "Paid" : c.st === "warn" ? "Pending" : c.st === "bad" ? "Overdue" : "No Charge"}
                </StatusBadge>
              </Td>
              <Td>
                {c.a !== "--" ? (
                  <button
                    onClick={() => toast.success("Action done")}
                    className={`text-sm font-semibold px-2.5 py-1 rounded-md cursor-pointer ${c.st === "bad" ? "bg-am-danger text-white" : "text-am-text-2 hover:text-am-text"}`}
                  >
                    {c.a}
                  </button>
                ) : "--"}
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
