"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { InfoGrid } from "@/components/shared/info-grid";
import { StatusBadge } from "@/components/shared/status-badge";

interface PlanItem { n: string; p: string; a: string; curr: boolean }

const defaultPlans: PlanItem[] = [
  { n: "Standard", p: "₹4,500/Q", a: "M1 ALPHA only", curr: true },
  { n: "Premium", p: "₹9,000/Q", a: "All 3 Algorithms", curr: false },
  { n: "Exclusive/TraaS", p: "25% of profits", a: "Admin configured", curr: false },
];

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<PlanItem[]>(defaultPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then(r => r.json())
      .then(d => {
        if (d.data && d.data.length > 0) {
          setPlans(d.data.map((p: Record<string, unknown>) => ({
            n: String(p.name),
            p: p.price ? `₹${Number(p.price).toLocaleString("en-IN")}/Q` : `${p.profit_share_pct}% of profits`,
            a: (p.algorithms as string[])?.length === 1 ? `${(p.algorithms as string[])[0]} only` : `All ${(p.algorithms as string[])?.length} Algorithms`,
            curr: false,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Current Plan */}
      <Panel
        title="Current Plan: Standard"
        subtitle="Renews 15 Apr 2026"
        pip="b"
        topBar={<div className="h-[3px] bg-am-primary" />}
        right={<StatusBadge variant="ok">Active</StatusBadge>}
      >
        <div className="font-poppins text-xl font-bold text-am-primary mb-1">₹4,500 / Quarter</div>
        <div className="text-[13px] text-am-text-3 mb-3.5">M1 ALPHA Strategy</div>
        <InfoGrid
          items={[
            ["Algorithm", "M1 ALPHA"],
            ["Renewal Date", "15 Apr 2026", "var(--am-gold)"],
            ["Days Remaining", "51 days", "var(--am-success)"],
            ["Auto-Renew", "Enabled"],
          ]}
        />
        <button
          onClick={() => toast("Upgrading to Premium \— Cashfree checkout")}
          className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center mt-3.5"
        >
          Upgrade to Premium {"\u2192"}
        </button>
      </Panel>

      {/* Available Plans */}
      <Panel title="Available Plans" pip="p">
        {plans.map((pl) => (
          <div
            key={pl.n}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg border mb-[7px] ${
              pl.curr
                ? "border-am-primary bg-am-primary-light"
                : "border-am-border bg-black/10"
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-bold text-am-text">
                {pl.n}{" "}
                {pl.curr && (
                  <span className="text-xs bg-am-success-light text-am-success py-px px-1.5 rounded ml-1">
                    Current
                  </span>
                )}
              </div>
              <div className="text-[13px] text-am-text-3">{pl.a}</div>
            </div>
            <div className="text-sm font-bold text-am-primary">{pl.p}</div>
            {!pl.curr && (
              <button
                onClick={() => toast(`Switching to ${pl.n}`)}
                className="text-xs font-semibold bg-am-secondary/20 text-am-secondary border border-am-secondary/30 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-am-secondary/30 transition-colors"
              >
                Select
              </button>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
