"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { AlertBox } from "@/components/shared/alert-box";
import { InfoGrid } from "@/components/shared/info-grid";

interface ConnectionRow {
  id: string;
  client_name: string;
  client_display_id: string;
  status: "connected" | "api-added" | "disconnected";
  last_checked: string;
}

export default function ExchangeSetup() {
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exchange/connections")
      .then(r => r.json())
      .then(d => { if (d.data) setConnections(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyIP = () => {
    navigator.clipboard
      .writeText("13.235.112.48")
      .then(() => toast.success("IP copied to clipboard!"))
      .catch(() => toast("13.235.112.48"));
  };

  const connected = connections.filter(c => c.status === "connected").length;
  const disconnected = connections.filter(c => c.status === "disconnected").length;
  const expiring = connections.filter(c => c.status === "api-added").length;

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
              onClick={copyIP}
              className="mt-2.5 bg-transparent border border-am-border rounded-md px-3.5 py-1 text-am-text-2 text-[13px] cursor-pointer hover:bg-am-bg-surface"
            >
              Copy IP
            </button>
          </div>
          <div className="p-2.5 bg-[rgba(0,147,182,.04)] rounded-[7px] border border-am-border-faint text-[13px] text-am-text-3 leading-relaxed mb-2.5">
            This IP must be added to your Delta Exchange API whitelist. Without it, trades cannot be replicated to client accounts.
          </div>
          <InfoGrid items={[["Region", "Mumbai, India"], ["Uptime", "99.98%", "var(--am-success)"], ["Connected Clients", String(connected), "var(--am-success)"], ["Disconnected", String(disconnected), disconnected > 0 ? "var(--am-danger)" : undefined]]} />
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
        subtitle={loading ? "Loading…" : `${connections.length} connections · ${expiring} not verified`}
        pip="g"
        right={
          <button
            onClick={() => toast.info("Individual clients must re-test their connections from their Exchange Setup page.")}
            className="bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
          >
            Test All Connections
          </button>
        }
      >
        <DataTable headers={["Client", "ID", "Status", "Last Verified", "Action"]}>
          {connections.map(c => (
            <tr key={c.id}>
              <Td bold>{c.client_name}</Td>
              <Td>{c.client_display_id}</Td>
              <Td>
                <span className="text-[13px] mr-1">
                  {c.status === "connected" ? "\u{1F7E2}" : c.status === "api-added" ? "\u{1F7E1}" : "\u{1F534}"}
                </span>
                <StatusBadge variant={c.status === "connected" ? "ok" : c.status === "api-added" ? "warn" : "bad"}>
                  {c.status === "connected" ? "Connected & Live" : c.status === "api-added" ? "Not Verified" : "Disconnected"}
                </StatusBadge>
              </Td>
              <Td>{c.last_checked}</Td>
              <Td>
                <button
                  onClick={() => toast.info(`${c.client_name} must re-test their connection from their Exchange Setup page.`)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer ${
                    c.status === "disconnected"
                      ? "bg-am-primary text-white"
                      : "text-am-text-2 hover:text-am-text border border-am-border"
                  }`}
                >
                  {c.status === "disconnected" ? "Notify Client" : "Check"}
                </button>
              </Td>
            </tr>
          ))}
        </DataTable>
        {!loading && connections.length === 0 && (
          <div className="text-sm text-am-text-3 text-center py-6">No exchange connections found. Clients need to set up their API keys.</div>
        )}
      </Panel>
    </div>
  );
}
