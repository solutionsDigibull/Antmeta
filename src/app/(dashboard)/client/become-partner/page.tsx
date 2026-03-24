"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { AlertBox } from "@/components/shared/alert-box";

const benefits = [
  { ico: "\u{1F4B0}", t: "25% TraaS Revenue", s: "Earn 25% of referred clients profits every 90-day cycle" },
  { ico: "\u{1F465}", t: "No Client Cap", s: "Refer unlimited clients \u2014 no cap on earnings" },
  { ico: "\u{1F4CA}", t: "Live Dashboard", s: "Track all your clients P&L in real-time from partner panel" },
  { ico: "\u{1F3C6}", t: "Monthly Leaderboard", s: "Top partners featured with bonus rewards each month" },
];

export default function BecomePartnerPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [entityName, setEntityName] = useState("");
  const [experience, setExperience] = useState("Less than 1 year");
  const [referrals, setReferrals] = useState("1–5 clients");
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/clients/me")
      .then(r => r.json())
      .then(d => { if (d.data?.id) setClientId(d.data.id); })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!entityName.trim()) { toast.error("Please enter your business or entity name"); return; }
    if (!clientId) { toast.error("Could not identify your account. Please refresh."); return; }

    setSubmitting(true);
    const description = [
      `Business / Entity Name: ${entityName.trim()}`,
      `Experience in Crypto / Finance: ${experience}`,
      `Estimated Monthly Referrals: ${referrals}`,
      `How did you hear about AntMeta: ${source.trim() || "Not specified"}`,
      `Additional Message: ${message.trim() || "None"}`,
    ].join("\n");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          subject: `Partner Application — ${entityName.trim()}`,
          description,
          priority: "medium",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
      toast.success("Partner application submitted! Our team will review within 48 hours.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
        {submitted ? (
          <div className="py-8 text-center">
            <div className="text-3xl mb-3">✅</div>
            <div className="text-sm font-bold text-am-text mb-1">Application Submitted!</div>
            <div className="text-[13px] text-am-text-3">Our team will review your application within 48 hours and contact you via email.</div>
          </div>
        ) : (
          <>
            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
                Business / Entity Name *
              </label>
              <input
                value={entityName}
                onChange={e => setEntityName(e.target.value)}
                placeholder="Your firm or trading business name"
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none"
              />
            </div>

            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
                Experience in Crypto / Finance
              </label>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none"
              >
                {["Less than 1 year", "1\u20133 years", "3\u20135 years", "5+ years"].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
                Estimated Monthly Referrals
              </label>
              <select
                value={referrals}
                onChange={e => setReferrals(e.target.value)}
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none"
              >
                {["1\u20135 clients", "5\u201320 clients", "20\u201350 clients", "50+ clients"].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
                How did you hear about AntMeta?
              </label>
              <input
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Referral, social media, event…"
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none"
              />
            </div>

            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-4 mb-1 tracking-wider uppercase">
                Additional Message
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us about your network…"
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none resize-y"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting\u2026" : "Submit Application \u2192"}
            </button>
          </>
        )}
      </Panel>
    </div>
  );
}
