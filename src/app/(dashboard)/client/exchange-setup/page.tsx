"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertBox } from "@/components/shared/alert-box";
import { formatRelativeTime } from "@/lib/supabase/converters";

const setupSteps = [
  "Login to delta.exchange with your account",
  "Go to API \u2192 API Management \u2192 Create Key",
  "Set: Read + Trade permissions (no Withdrawal)",
  "Under IP Restrictions \u2192 add 13.235.112.48",
  "Save and copy your API Key + Secret Key",
];

const commonErrors = [
  { err: "IP not whitelisted", fix: "Add 13.235.112.48 in Delta \u2192 API \u2192 IP Restrictions" },
  { err: "Invalid API key", fix: "Regenerate key on Delta Exchange and re-enter" },
  { err: "Permissions incorrect", fix: "Enable Read + Trade; disable Withdrawal permission" },
];

export default function ExchangeSetupClientPage() {
  const [connStatus, setConnStatus] = useState("not-connected");
  const [lastVerified, setLastVerified] = useState<string | null>(null);
  const [testError, setTestError] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Controlled form state
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    fetch("/api/exchange")
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setConnStatus(d.data.status);
          setLastVerified(d.data.last_verified);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusMap: Record<string, { emoji: string; label: string; colorClass: string; bgClass: string; borderClass: string; desc: string }> = {
    "not-connected": {
      emoji: "\u{1F534}",
      label: "Not Connected",
      colorClass: "text-am-danger",
      bgClass: "bg-am-danger-light",
      borderClass: "border-[rgba(239,68,68,.2)]",
      desc: "API keys not yet added. Follow the setup guide below.",
    },
    "api-added": {
      emoji: "\u{1F7E1}",
      label: "API Added \u2013 Not Verified",
      colorClass: "text-am-gold",
      bgClass: "bg-am-gold-light",
      borderClass: "border-[rgba(244,160,32,.2)]",
      desc: "Keys saved but connection not tested. Click \u2018Test API Connection\u2019 to verify.",
    },
    connected: {
      emoji: "\u{1F7E2}",
      label: "Connected & Live",
      colorClass: "text-am-success",
      bgClass: "bg-am-success-light",
      borderClass: "border-[rgba(34,197,94,.2)]",
      desc: lastVerified
        ? `API connection active. Last verified ${formatRelativeTime(lastVerified)}.`
        : "API connection active and verified.",
    },
  };

  const st = statusMap[connStatus] || statusMap["not-connected"];

  const doTest = async () => {
    if (!apiKey || !secretKey) {
      toast.error("Enter your API Key and Secret Key first");
      return;
    }
    setTesting(true);
    setTestError("");
    try {
      const res = await fetch("/api/exchange/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, secret_key: secretKey }),
      });
      const data = await res.json();
      if (data.success) {
        const now = new Date().toISOString();
        setConnStatus("connected");
        setLastVerified(now);
        toast.success("\u2713 Connection successful! API is live and verified.");
      } else {
        setTestError(data.error || "Connection test failed");
        toast.error("Connection test failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey || !secretKey) {
      toast.error("Enter your API Key and Secret Key first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, secret_key: secretKey, label: label || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setConnStatus("api-added");
        setLastVerified(null);
        setApiKey("");
        setSecretKey("");
        setLabel("");
        toast.success("\u{1F512} API keys saved securely (SHA-256 hashed)");
      } else {
        toast.error(data.error || "Failed to save keys");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyIP = () => {
    navigator.clipboard
      .writeText("13.235.112.48")
      .then(() => toast.success("IP copied to clipboard!"))
      .catch(() => toast("13.235.112.48"));
  };

  if (loading) {
    return <div className="text-sm text-am-text-3 py-8 text-center">Loading connection status…</div>;
  }

  return (
    <div>
      {/* Connection Status Banner */}
      <div className={`${st.bgClass} border ${st.borderClass} rounded-[10px] py-3 px-4 mb-3.5 flex items-center gap-3`}>
        <div className="text-2xl">{st.emoji}</div>
        <div className="flex-1">
          <div className={`text-sm font-bold ${st.colorClass}`}>{st.label}</div>
          <div className="text-[13px] text-am-text-3 mt-0.5">{st.desc}</div>
        </div>
        {connStatus === "connected" && <StatusBadge variant="ok">Live</StatusBadge>}
      </div>

      <AlertBox variant="i">
        You must whitelist the AntMeta server IP on Delta Exchange before entering your API key.
      </AlertBox>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* IP Whitelist Guide */}
        <Panel
          title={
            <span>
              Whitelist This IP First{" "}
              <span className="cursor-help" title="This IP must be added to your Delta Exchange API whitelist for trades to replicate to your account.">
                {"\u24D8"}
              </span>
            </span>
          }
          pip="b"
        >
          <div className="bg-am-primary-light border border-am-primary rounded-lg p-4 text-center mb-2.5">
            <div className="text-xs text-am-text-3 mb-1.5 tracking-wider uppercase">
              Add this IP to Delta Exchange Whitelist
            </div>
            <div className="font-poppins text-2xl font-extrabold text-am-primary tracking-[3px]">13.235.112.48</div>
            <button
              onClick={copyIP}
              className="mt-2 bg-transparent border border-am-border rounded-md py-1 px-3.5 text-am-text-2 text-[13px] cursor-pointer hover:bg-white/5 transition-colors"
            >
              {"\u{1F4CB}"} Copy IP
            </button>
          </div>
          <div className="py-2 px-2.5 bg-[rgba(0,147,182,.04)] rounded-[7px] border border-am-border-faint text-[13px] text-am-text-3 leading-relaxed mb-2.5">
            {"\u26A0\uFE0F"} This IP must be added to your Delta Exchange API whitelist. Without it, the &quot;IP not whitelisted&quot; error will occur during connection test.
          </div>
          {setupSteps.map((s, i) => (
            <div key={i} className="flex gap-2 py-[7px] border-b border-am-border-faint">
              <div className="w-[19px] h-[19px] rounded-full bg-am-primary-light flex items-center justify-center text-[11px] font-bold text-am-primary shrink-0">
                {i + 1}
              </div>
              <div className="text-sm text-am-text-2">{s}</div>
            </div>
          ))}
          <button
            onClick={() => toast("Opening detailed setup guide in Help Center")}
            className="w-full mt-2.5 bg-am-secondary/20 text-am-secondary border border-am-secondary/30 rounded-lg py-2 text-xs font-semibold cursor-pointer hover:bg-am-secondary/30 transition-colors text-center"
          >
            {"\u{1F4D8}"} View Detailed Guide
          </button>
        </Panel>

        {/* Enter API Keys */}
        <Panel title="Enter API Keys" pip="t">
          {/* Error display */}
          {testError && (
            <div className="bg-am-danger-light border border-[rgba(239,68,68,.3)] rounded-lg py-2.5 px-3 mb-3">
              <div className="text-sm font-bold text-am-danger mb-1">{"\u274C"} Connection Failed</div>
              <div className="text-[13px] text-am-danger leading-relaxed">{testError}</div>
            </div>
          )}

          <div className="mb-2.5">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (connStatus === "not-connected" && e.target.value) setConnStatus("api-added");
                setTestError("");
              }}
              placeholder="Paste your Delta Exchange API key"
              className={`w-full bg-am-input-bg border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none ${
                testError ? "border-[rgba(239,68,68,.4)]" : "border-am-border"
              }`}
            />
          </div>

          <div className="mb-2.5">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Secret Key</label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => {
                setSecretKey(e.target.value);
                if (connStatus === "not-connected" && e.target.value) setConnStatus("api-added");
                setTestError("");
              }}
              placeholder="Paste your Secret key"
              className={`w-full bg-am-input-bg border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none ${
                testError ? "border-[rgba(239,68,68,.4)]" : "border-am-border"
              }`}
            />
          </div>

          <div className="mb-2.5">
            <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., AntMeta Trading Key"
              className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none"
            />
          </div>

          {/* Test API Connection */}
          <button
            onClick={doTest}
            disabled={testing}
            className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center mb-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {testing ? "\u23F3 Testing Connection\u2026" : "\u{1F50D} Test API Connection"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-am-secondary/20 text-am-secondary border border-am-secondary/30 rounded-lg py-2.5 text-sm font-semibold cursor-pointer hover:bg-am-secondary/30 transition-colors text-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving\u2026" : "\u{1F4BE} Save Keys"}
          </button>

          <div className="text-xs text-am-text-3 text-center mt-2.5">
            {"\u{1F512}"} Keys hashed with SHA-256 {"·"} Never stored in plain text
          </div>

          {/* Common errors reference */}
          <div className="mt-3 p-2.5 px-3 bg-black/15 rounded-lg border border-am-border-faint">
            <div className="text-xs font-semibold text-am-text-3 mb-1.5 uppercase">Common Connection Errors</div>
            {commonErrors.map((e) => (
              <div key={e.err} className="flex gap-2 py-1 text-[13px]">
                <span className="text-am-danger font-semibold whitespace-nowrap">{"\u2022"} {e.err}</span>
                <span className="text-am-text-3">{"\u2192"} {e.fix}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
