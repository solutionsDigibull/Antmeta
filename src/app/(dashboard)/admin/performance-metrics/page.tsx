"use client";

import { useState, useEffect } from "react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { ProgressBar } from "@/components/shared/progress-bar";
import type { Master } from "@/lib/types";

const monthlyReturns = [
  { m: "Jan", v: 4.2 }, { m: "Feb", v: 3.8 }, { m: "Mar", v: 5.1 }, { m: "Apr", v: 2.9 },
  { m: "May", v: -1.2 }, { m: "Jun", v: 6.4 }, { m: "Jul", v: 7.1 }, { m: "Aug", v: 4.8 },
  { m: "Sep", v: 3.2 }, { m: "Oct", v: -0.8 }, { m: "Nov", v: 5.5 }, { m: "Dec", v: 8.4 },
];

export default function PerfMetrics() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/masters").then(r => r.json()).then(d => { if (d.data) setMasters(d.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="+8.4%" label="Avg Monthly Return" color="var(--am-success)" />
        <KpiCard value="1.82" label="Sharpe Ratio" sub="Risk-adjusted perf." />
        <KpiCard value="2.14" label="Sortino Ratio" sub="Downside adj." />
        <KpiCard value="8.6%" label="Max Drawdown" sub="M2 DELTA highest" color="var(--am-gold)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Monthly Return Heatmap */}
        <Panel title="Monthly Return Heatmap" pip="b">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {monthlyReturns.map(({ m, v }) => {
              const bg = v > 0
                ? `rgba(34,197,94,${Math.min(v / 10 + 0.1, 0.85)})`
                : v < 0
                ? `rgba(239,68,68,${Math.min(Math.abs(v) / 10 + 0.1, 0.85)})`
                : "rgba(255,255,255,.05)";
              return (
                <div key={m} className="rounded-[5px] p-2 text-center" style={{ background: bg }}>
                  <div className="text-xs text-am-text-3 mb-1">{m}</div>
                  <div className={`text-sm font-bold ${v > 0 ? "text-am-success" : v < 0 ? "text-am-danger" : "text-am-text-3"}`}>
                    {v > 0 ? "+" : ""}{v}%
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Algorithm Comparison */}
        <Panel title="Algorithm Comparison" pip="t">
          {masters.map((m) => (
            <div key={m.id} className="mb-3.5">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold text-am-text">{m.id} -- {m.name}</span>
                <span className={`text-sm font-bold ${m.pnl.startsWith("+") ? "text-am-success" : "text-am-danger"}`}>{m.pnl}</span>
              </div>
              <div className="flex justify-between text-xs text-am-text-3 mb-1">
                <span>Success: {m.rate}</span>
                <span>Clients: {m.clients}</span>
                <span>Trades: {m.trades}</span>
              </div>
              <ProgressBar width={m.rate} color={m.id === "M1" ? "b" : m.id === "M2" ? "r" : "t"} />
            </div>
          ))}
          <div className="p-2.5 bg-am-primary-light border border-am-border rounded-lg mt-2">
            <div className="text-[13px] text-am-text-3">BTC Benchmark (30d)</div>
            <div className="text-lg font-bold text-am-primary">+5.2%</div>
            <div className="text-[13px] text-am-text-3 mt-0.5">M1 and M3 outperforming benchmark</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
