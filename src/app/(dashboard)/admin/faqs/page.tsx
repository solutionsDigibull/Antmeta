"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { FilterSelect } from "@/components/shared/filter-bar";

const faqs = [
  { q: "How do I upload my PAN card?", a: "Navigate to Profile → KYC Documents → Upload PAN. The system auto-verifies via NSDL API. Ensure the image is clear and matches your registered name.", cat: "KYC", views: 412 },
  { q: "What is copy trading?", a: "Copy trading automatically replicates trades from ANT's master accounts to your exchange account. Trades are proportionally sized based on your equity.", cat: "Trading", views: 389 },
  { q: "How is P&L calculated?", a: "P&L is synced from Delta Exchange API every 4 hours. For Premium clients, it shows per-algorithm breakdown. All calculations are based on realized + unrealized P&L.", cat: "Trading", views: 267 },
  { q: "What subscription plans are available?", a: "Standard (₹4,500/Q, 1 algorithm), Premium (₹9,000/Q, all 3 algorithms), Exclusive/TraaS (25% of profits, billed every 90 days).", cat: "Billing", views: 234 },
  { q: "How do I connect my Delta Exchange account?", a: "Go to Exchange Setup → Follow the 5-step guide → Whitelist IP 13.235.112.48 → Create API key with Read+Trade permissions → Paste key in AntMeta.", cat: "Technical", views: 198 },
];

export default function FAQsAdmin() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div>
      <div className="flex justify-between mb-3">
        <FilterSelect>
          <option>All Categories</option><option>KYC</option><option>Trading</option><option>Billing</option><option>Technical</option>
        </FilterSelect>
        <button onClick={() => toast.success("New FAQ created")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ Add FAQ</button>
      </div>

      <Panel title="Manage FAQs" subtitle={`${faqs.length} published FAQs`} pip="b">
        {faqs.map((f, i) => (
          <div key={i} className="border-b border-am-border-faint">
            <div
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              className="flex items-center gap-2.5 py-3 cursor-pointer"
            >
              <div className={`text-sm text-am-primary transition-transform duration-200 ${expandedFaq === i ? "rotate-90" : ""}`}>&#9654;</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{f.q}</div>
                <div className="text-xs text-am-text-3 mt-0.5">{f.cat} · {f.views} views</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toast.info("Editing FAQ"); }}
                className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer"
              >
                Edit
              </button>
            </div>
            {expandedFaq === i && (
              <div className="pl-6 pb-3 text-sm text-am-text-2 leading-relaxed">{f.a}</div>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
