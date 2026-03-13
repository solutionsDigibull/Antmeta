"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { InfoGrid } from "@/components/shared/info-grid";

interface PlanRow { n: string; c: string; cl: number; price: string; algo: string; features: string[] }

const defaultPlans: PlanRow[] = [
  {
    n: "Standard Plan", c: "var(--am-primary)", cl: 112, price: "₹4,500 / Quarter", algo: "1 Master Account",
    features: ["Access to 1 algorithm", "Daily P&L sync", "Email support", "GST invoice", "Razorpay payment"],
  },
  {
    n: "Premium Plan", c: "var(--am-accent)", cl: 54, price: "₹9,000 / Quarter", algo: "All 3 Master Accounts",
    features: ["All 3 algorithms", "Per-algo P&L breakdown", "Priority support", "Advanced analytics", "Custom reports"],
  },
  {
    n: "Exclusive / TraaS", c: "var(--am-gold)", cl: 23, price: "25% of profits", algo: "Admin configured",
    features: ["Profit-sharing only", "90-day billing cycles", "No upfront fee", "Performance-based", "Payment links"],
  },
];

const planColors: Record<string, string> = { standard: "var(--am-primary)", premium: "var(--am-accent)", exclusive: "var(--am-gold)" };

export default function PlanManagement() {
  const [plans, setPlans] = useState<PlanRow[]>(defaultPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then(r => r.json())
      .then(d => {
        if (d.data && d.data.length > 0) {
          setPlans(d.data.map((p: Record<string, unknown>) => ({
            n: String(p.name),
            c: planColors[String(p.slug)] || "var(--am-primary)",
            cl: 0,
            price: p.price ? `₹${Number(p.price).toLocaleString("en-IN")} / Quarter` : `${p.profit_share_pct}% of profits`,
            algo: (p.algorithms as string[])?.length === 1 ? "1 Master Account" : `All ${(p.algorithms as string[])?.length} Master Accounts`,
            features: Array.isArray(p.features) ? (p.features as string[]) : [],
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">
        {plans.map(p => (
          <Panel
            key={p.n}
            title={p.n}
            pip="b"
            topBar={<div className="h-[3px]" style={{ background: p.c }} />}
            right={<StatusBadge>{p.cl} clients</StatusBadge>}
          >
            <div className="text-xl font-bold font-poppins mb-1" style={{ color: p.c }}>{p.price}</div>
            <div className="text-[13px] text-am-text-3 mb-3">{p.algo}</div>
            <div className="h-px bg-am-border-faint my-2.5" />
            {p.features.map(f => (
              <div key={f} className="flex items-center gap-2 py-1 text-sm text-am-text-2">
                <span style={{ color: p.c }}>&#10003;</span>{f}
              </div>
            ))}
            <div className="h-px bg-am-border-faint my-2.5" />
            <div className="flex gap-2">
              <button onClick={() => toast.info(`Editing ${p.n}`)} className="flex-1 bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold py-2 rounded-lg cursor-pointer text-center">Edit Plan</button>
              <button onClick={() => toast.info(`Viewing ${p.n} subscribers`)} className="flex-1 text-am-text-2 hover:text-am-text border border-am-border text-sm font-semibold py-2 rounded-lg cursor-pointer text-center">Subscribers</button>
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Revenue Summary" pip="b">
        <InfoGrid items={[["MRR (Fixed)", "₹8.4L", "var(--am-primary)"], ["TraaS Estimated", "₹5.1L", "var(--am-accent)"], ["Renewals Due (7d)", "18 clients", "var(--am-gold)"], ["In Grace Period", "3 clients", "var(--am-danger)"]]} />
      </Panel>
    </div>
  );
}
