"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { InfoGrid } from "@/components/shared/info-grid";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";
import type { Master } from "@/lib/types";

export default function PnlAnalytics() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/masters").then(r => r.json()).then(d => { if (d.data) setMasters(d.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <FilterBar>
        <FilterSelect>
          <option>All Algorithms</option>
          <option>M1 ALPHA</option>
          <option>M2 DELTA</option>
          <option>M3 SIGMA</option>
        </FilterSelect>
        <FilterSelect>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>This Year</option>
        </FilterSelect>
        <FilterRight>
          <button onClick={() => toast.success("P&L exported")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">Export PDF</button>
        </FilterRight>
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="+₹19.0L" label="Total MTD P&L" color="var(--am-success)" sub="Across all algorithms" />
        <KpiCard value="189" label="Profitable Clients" sub="76% of subscribers" />
        <KpiCard value="38" label="Loss-making" color="var(--am-danger)" sub="Primarily M2 clients" />
        <KpiCard value="+8.4%" label="Avg Return MTD" color="var(--am-success)" sub="Across portfolio" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {masters.map(m => (
          <Panel
            key={m.id}
            title={`${m.id} -- ${m.name}`}
            subtitle={`${m.clients} clients`}
            pip={m.id === "M1" ? "b" : m.id === "M2" ? "r" : "t"}
            right={
              <span className={`text-lg font-bold font-poppins ${m.pnl.startsWith("+") ? "text-am-success" : "text-am-danger"}`}>
                {m.pnl} MTD
              </span>
            }
          >
            <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" className="mb-2.5">
              <defs>
                <linearGradient id={`g${m.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"} stopOpacity=".3" />
                  <stop offset="100%" stopColor={m.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={m.id !== "M2" ? "M0 55 L80 42 L160 30 L240 20 L320 12 L400 7 L400 60 L0 60Z" : "M0 30 L80 38 L160 32 L240 42 L320 28 L400 45 L400 60 L0 60Z"}
                fill={`url(#g${m.id})`}
              />
              <path
                d={m.id !== "M2" ? "M0 55 L80 42 L160 30 L240 20 L320 12 L400 7" : "M0 30 L80 38 L160 32 L240 42 L320 28 L400 45"}
                fill="none"
                stroke={m.pnl.startsWith("+") ? "var(--am-success)" : "var(--am-danger)"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <InfoGrid items={[["Max Drawdown", m.id === "M2" ? "12.4%" : "4.8%"], ["Win Rate", m.rate, parseFloat(m.rate) >= 95 ? "var(--am-success)" : "var(--am-gold)"]]} />
          </Panel>
        ))}
      </div>
    </div>
  );
}
