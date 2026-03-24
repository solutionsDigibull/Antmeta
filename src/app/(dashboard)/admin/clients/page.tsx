"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { FilterBar, FilterSelect, FilterRight } from "@/components/shared/filter-bar";
import { Modal } from "@/components/shared/modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Client } from "@/lib/types";

interface PlanOption {
  id: string;
  name: string;
  price: string;
  color: string;
  algo: string;
  features: string[];
}

const PLAN_DISPLAY: Record<string, { color: string; algo: string; features: string[] }> = {
  standard: { color: "var(--am-primary)", algo: "1 Algorithm -- M1 ALPHA", features: ["Daily P&L sync from Delta", "Email support", "GST-compliant invoicing", "Cashfree / Stripe payment"] },
  premium: { color: "var(--am-accent)", algo: "All 3 Algorithms", features: ["Per-algorithm P&L breakdown", "Priority support", "Advanced analytics", "All master account access"] },
  exclusive: { color: "var(--am-gold)", algo: "Admin Configured", features: ["Profit-sharing model", "90-day billing cycles", "Payment links (no gateway)", "Performance-based pricing"] },
};

export default function ClientDirectory() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [clientType, setClientType] = useState<"individual" | "corporate">("individual");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [adding, setAdding] = useState(false);

  // Form fields
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPan, setNewPan] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(d => { if (d.data) setClients(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/plans")
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setPlans(d.data.map((p: Record<string, unknown>) => {
            const key = (p.name as string).toLowerCase().replace(/[^a-z]/g, "");
            const display = PLAN_DISPLAY[key] || { color: "var(--am-primary)", algo: "—", features: [] };
            return {
              id: p.id as string,
              name: p.name as string,
              price: p.billing_type === "profit_share" ? `${p.profit_share_pct}% of Profits` : `₹${((p.price_inr as number) || 0).toLocaleString("en-IN")} / Quarter`,
              color: display.color,
              algo: display.algo,
              features: display.features,
            };
          }));
        }
      })
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewPan("");
    setSelectedPlan(""); setClientType("individual");
  };

  const handleAddClient = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    if (!newEmail.trim()) { toast.error("Email is required"); return; }
    if (!selectedPlan) { toast.error("Please select a subscription plan"); return; }
    if (newPhone && !/^\d{10}$/.test(newPhone.trim())) { toast.error("Phone must be 10 digits"); return; }

    setAdding(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone ? `+91${newPhone.trim()}` : undefined,
          account_type: clientType,
          pan: newPan.trim() || undefined,
          plan_id: selectedPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add client");
        return;
      }
      setClients(prev => [data.data, ...prev]);
      toast.success("Client added successfully — KYC pending");
      setShowAdd(false);
      resetForm();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <FilterBar>
        <SearchInput placeholder="Search name, ID, PAN..." className="w-[220px]" />
        <FilterSelect>
          <option>All Types</option>
          <option>Individual</option>
          <option>Corporate</option>
        </FilterSelect>
        <FilterSelect>
          <option>All Plans</option>
          <option>Standard</option>
          <option>Premium</option>
          <option>Exclusive</option>
        </FilterSelect>
        <FilterRight>
          <button onClick={() => toast.success("Client list exported as CSV")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">Export CSV</button>
          <button onClick={() => setShowAdd(true)} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ Add Client</button>
        </FilterRight>
      </FilterBar>

      <Panel title="Client Directory" subtitle={`${clients.length} clients total`} pip="b">
        <DataTable headers={["Client ID", "Name", "Type", "Plan", "KYC", "MTD P&L", "Status", "Actions"]}>
          {clients.map((c) => (
            <tr key={c.id}>
              <Td bold>{c.id}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <UserAvatar name={c.name} size={24} />
                  {c.name}
                </div>
              </Td>
              <Td><StatusBadge variant={c.type === "individual" ? "blue" : "warn"}>{c.type}</StatusBadge></Td>
              <Td><StatusBadge variant="teal">{c.plan}</StatusBadge></Td>
              <Td><StatusBadge variant={c.kyc === "verified" ? "ok" : c.kyc === "rejected" ? "bad" : "warn"}>{c.kyc}</StatusBadge></Td>
              <Td bold color={c.pnl.startsWith("+") ? "var(--am-success)" : undefined}>{c.pnl}</Td>
              <Td><StatusBadge variant={c.status === "active" ? "ok" : "bad"}>{c.status}</StatusBadge></Td>
              <Td>
                <button onClick={() => toast.info(`Viewing ${c.name}`)} className="text-am-text-2 hover:text-am-text text-sm font-semibold cursor-pointer">View</button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {/* Add Client Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Add New Client" width={640}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Full Name *</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Client's full name"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 text-sm text-am-text outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Mobile Number</label>
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 text-sm text-am-text outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Email *</label>
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 text-sm text-am-text outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">PAN</label>
            <input
              value={newPan}
              onChange={(e) => setNewPan(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 text-sm text-am-text outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Account Type *</label>
            <div className="flex gap-2">
              {([["individual", "Individual"], ["corporate", "Corporate"]] as const).map(([v, l]) => (
                <div
                  key={v}
                  onClick={() => setClientType(v)}
                  className={`flex-1 text-center py-2 px-1.5 rounded-lg border cursor-pointer transition-all text-sm font-semibold ${
                    clientType === v ? "border-am-primary bg-am-primary-light text-am-primary" : "border-am-border bg-black/15 text-am-text-2"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-am-text-3 mb-2 uppercase tracking-wide">Select Subscription Plan *</label>
          <div className="grid grid-cols-3 gap-2.5">
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-3.5 rounded-[10px] cursor-pointer transition-all border-2 ${
                  selectedPlan === plan.id ? "border-current -translate-y-0.5" : "border-am-border bg-black/15"
                }`}
                style={{
                  borderColor: selectedPlan === plan.id ? plan.color : undefined,
                  background: selectedPlan === plan.id ? `color-mix(in srgb, ${plan.color} 7%, transparent)` : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-am-text">{plan.name}</div>
                  <div className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedPlan === plan.id ? plan.color : "var(--am-border)" }}>
                    {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: plan.color }} />}
                  </div>
                </div>
                <div className="text-base font-bold font-poppins mb-1" style={{ color: plan.color }}>{plan.price}</div>
                <div className="text-[13px] text-am-text-2 mb-2.5 pb-1 border-b border-am-border-faint">{plan.algo}</div>
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-1.5 py-0.5 text-[13px] text-am-text-2">
                    <span style={{ color: plan.color }} className="shrink-0">&#10003;</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 justify-end pt-3 border-t border-am-border-faint">
          <button onClick={() => { setShowAdd(false); resetForm(); }} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer">Cancel</button>
          <button
            onClick={handleAddClient}
            disabled={adding}
            className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {adding ? "Adding…" : "Add Client"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
