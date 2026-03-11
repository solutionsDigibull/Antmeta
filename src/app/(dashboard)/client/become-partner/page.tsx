"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { AlertBox } from "@/components/shared/alert-box";

const benefits = [
  { ico: "\u{1F4B0}", t: "25% TraaS Revenue", s: "Earn 25% of referred clients profits every 90-day cycle" },
  { ico: "\u{1F465}", t: "No Client Cap", s: "Refer unlimited clients \u2014 no cap on earnings" },
  { ico: "\u{1F4CA}", t: "Live Dashboard", s: "Track all your clients P&L in real-time from partner panel" },
  { ico: "\u{1F3C6}", t: "Monthly Leaderboard", s: "Top partners featured with bonus rewards each month" },
];

const formFields = [
  { l: "Business / Entity Name", ph: "Your firm or trading business name", type: "text" as const },
  { l: "Experience in Crypto / Finance", type: "select" as const, opts: ["Less than 1 year", "1\u20133 years", "3\u20135 years", "5+ years"] },
  { l: "Estimated Monthly Referrals", type: "select" as const, opts: ["1\u20135 clients", "5\u201320 clients", "20\u201350 clients", "50+ clients"] },
  { l: "How did you hear about AntMeta?", ph: "Referral, social media, event\u2026", type: "text" as const },
];

export default function BecomePartnerPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Benefits Panel */}
      <Panel title="Partner Program" pip="g">
        <AlertBox variant="s">
          Earn 25% of trading profits from clients you refer — paid every 90 days.
        </AlertBox>
        {benefits.map((b, i) => (
          <div key={i} className="flex gap-3 py-2.5 border-b border-am-border-faint">
            <div className="text-xl">{b.ico}</div>
            <div>
              <div className="text-sm font-bold text-am-text">{b.t}</div>
              <div className="text-[13px] text-am-text-3 mt-0.5">{b.s}</div>
            </div>
          </div>
        ))}
      </Panel>

      {/* Application Form */}
      <Panel title="Apply to Become a Partner" pip="p">
        {formFields.map((f, i) => (
          <div key={i} className="mb-2.5">
            <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
              {f.l}
            </label>
            {f.type === "select" ? (
              <select className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none">
                {f.opts!.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder={f.ph}
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none"
              />
            )}
          </div>
        ))}
        <div className="mb-2.5">
          <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
            Additional Message
          </label>
          <textarea
            rows={3}
            placeholder="Tell us about your network…"
            className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none resize-y"
          />
        </div>
        <button
          onClick={() => toast.success("Partner application submitted! Review within 48 hours.")}
          className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center"
        >
          Submit Application {"\u2192"}
        </button>
      </Panel>
    </div>
  );
}
