"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { AlertBox } from "@/components/shared/alert-box";
import { InfoGrid } from "@/components/shared/info-grid";

export default function ExchangeSetup() {
  return (
    <div>
      <AlertBox variant="i">Master server IP must be whitelisted by clients on Delta Exchange before entering API keys.</AlertBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        {/* Master Server IP */}
        <Panel title="Master Server IP" pip="b">
          <div className="bg-am-primary-light border border-am-primary rounded-lg p-4 text-center mb-2.5">
            <div className="text-xs text-am-text-3 mb-1.5 tracking-wide uppercase">Whitelist this IP on Delta Exchange</div>
            <div className="font-poppins text-[22px] font-bold text-am-primary tracking-widest">13.235.112.48</div>
            <button
              onClick={() => toast.success("IP copied to clipboard!")}
              className="mt-2.5 bg-transparent border border-am-border rounded-md px-3.5 py-1 text-am-text-2 text-[13px] cursor-pointer hover:bg-am-bg-surface"
            >
              Copy IP
            </button>
          </div>
          <div className="p-2.5 bg-[rgba(0,147,182,.04)] rounded-[7px] border border-am-border-faint text-[13px] text-am-text-3 leading-relaxed mb-2.5">
            This IP must be added to your Delta Exchange API whitelist. Without it, trades cannot be replicated to client accounts.
          </div>
          <InfoGrid items={[["Region", "Mumbai, India"], ["Uptime", "99.98%", "var(--am-success)"], ["Last Health Check", "6h ago"], ["Last Restart", "7 Feb 2026"]]} />
        </Panel>

        {/* Setup Guide */}
        <Panel title="Setup Guide for Clients" pip="t">
          {[
            "Sign up at delta.exchange using ANT referral link",
            "Go to API Management → Create New API Key",
            "Set permissions: Read + Trade (no Withdrawal)",
            "Add IP 13.235.112.48 to Whitelist field",
            "Copy your API Key and Secret Key",
            "Paste into AntMeta Exchange Setup page",
          ].map((s, i) => (
            <div key={i} className="flex gap-2.5 py-2 border-b border-am-border-faint">
              <div className="w-5 h-5 rounded-full bg-am-primary-light border border-am-border flex items-center justify-center text-xs font-bold text-am-primary shrink-0">{i + 1}</div>
              <div className="text-sm text-am-text-2">{s}</div>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button onClick={() => toast.info("Redirecting to Delta Exchange signup...")} className="flex-1 bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold py-2 rounded-lg cursor-pointer text-center">
              Create Delta Exchange Account →
            </button>
            <button onClick={() => toast.info("Opening detailed guide in Help Center")} className="flex-1 bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold py-2 rounded-lg cursor-pointer text-center">
              View Detailed Guide
            </button>
          </div>
        </Panel>
      </div>

      {/* Client API Health */}
      <Panel
        title="Client API Health"
        subtitle="4 keys expiring within 7 days"
        pip="g"
        right={
          <button onClick={() => toast.info("Health check running...")} className="bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
            Test All Connections
          </button>
        }
      >
        <DataTable headers={["Client", "ID", "Status", "Last Checked", "Expiry", "Action"]}>
          {[
            { n: "Rajesh Kumar", id: "260116100001", st: "ok", lc: "6h ago", ex: "15 Mar 2026" },
            { n: "TechCorp Pvt", id: "260116100002", st: "ok", lc: "6h ago", ex: "⚠ 2 Mar 2026" },
            { n: "Priya Menon", id: "260116100003", st: "warn", lc: "12h ago", ex: "⚠ 1 Mar 2026" },
            { n: "Kiran Sharma", id: "260116100005", st: "bad", lc: "2d ago", ex: "--" },
          ].map(c => (
            <tr key={c.id}>
              <Td bold>{c.n}</Td>
              <Td>{c.id}</Td>
              <Td>
                <span className="text-[13px] mr-1">{c.st === "ok" ? "\u{1F7E2}" : c.st === "warn" ? "\u{1F7E1}" : "\u{1F534}"}</span>
                <StatusBadge variant={c.st}>{c.st === "ok" ? "Connected & Live" : c.st === "warn" ? "Expiring Soon" : "Disconnected"}</StatusBadge>
              </Td>
              <Td>{c.lc}</Td>
              <Td>{c.ex}</Td>
              <Td>
                <button
                  onClick={() => toast.info("Action triggered")}
                  className={`text-sm font-semibold px-2.5 py-1 rounded-md cursor-pointer ${c.st === "bad" ? "bg-am-primary text-white" : "text-am-text-2 hover:text-am-text"}`}
                >
                  {c.st === "bad" ? "Reconnect" : "Test"}
                </button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
