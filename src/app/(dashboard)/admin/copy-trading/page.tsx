"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { AlertBox } from "@/components/shared/alert-box";
import { MASTERS } from "@/lib/data/masters";
import type { Master } from "@/lib/types";

export default function CopyTrading() {
  const [masters, setMasters] = useState<Master[]>(MASTERS);

  useEffect(() => {
    fetch("/api/masters").then(r => r.json()).then(d => { if (d.data) setMasters(d.data); }).catch(() => {});
  }, []);

  return (
    <div>
      <AlertBox variant="w">M2 DELTA success rate at 87% -- below 95% threshold. Review positions before accepting new copies.</AlertBox>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="178" label="Active Copies" color="var(--am-success)" />
        <KpiCard value="6" label="Paused" color="var(--am-gold)" />
        <KpiCard value="1,847" label="Trades Today" color="var(--am-primary)" />
        <KpiCard value="4" label="API Errors" color="var(--am-danger)" />
      </div>

      {/* Master Account Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        {masters.map((m) => (
          <Panel
            key={m.id}
            title={`${m.id} -- ${m.name}`}
            subtitle={`${m.assets} · ${m.clients} clients`}
            pip={m.status === "active" ? "b" : "r"}
            right={
              <div className="flex gap-1.5">
                <button onClick={() => toast.info(`${m.name} paused`)} className="bg-am-secondary hover:bg-am-secondary/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer">Pause</button>
                <button onClick={() => toast.info(`${m.name} settings opened`)} className="text-am-text-2 hover:text-am-text text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer border border-am-border">Settings</button>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div className="p-2.5 bg-black/20 rounded-[7px] border border-am-border-faint">
                <div className="text-xs text-am-text-3">MTD P&L</div>
                <div className={`text-lg font-bold ${m.pnl.startsWith("+") ? "text-am-success" : "text-am-danger"}`}>{m.pnl}</div>
              </div>
              <div className="p-2.5 bg-black/20 rounded-[7px] border border-am-border-faint">
                <div className="text-xs text-am-text-3">Success Rate</div>
                <div className={`text-lg font-bold ${parseFloat(m.rate) >= 95 ? "text-am-success" : "text-am-gold"}`}>{m.rate}</div>
              </div>
            </div>
            <div className="mb-2.5">
              <div className="flex justify-between text-[13px] text-am-text-3 mb-1"><span>Copy Success</span><span>{m.rate}</span></div>
              <ProgressBar width={m.rate} color={parseFloat(m.rate) >= 95 ? "ok" : "wa"} />
            </div>
            <div className="text-sm text-am-text-2 mb-2">
              Trades today: <strong className="text-am-text">{m.trades}</strong> · Formula: client_qty = (client_equity / master_equity) x master_qty
            </div>
            <button
              onClick={() => toast.info(`Manual trade entry for ${m.name}`)}
              className="w-full bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold py-2 rounded-lg cursor-pointer text-center"
            >
              + Manual Trade Entry
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
