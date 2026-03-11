"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar, FilterRight } from "@/components/shared/filter-bar";

const templates = [
  { n: "KYC Approved", tr: "On KYC approval", ch: "SMS + Email" },
  { n: "KYC Rejected", tr: "On KYC rejection", ch: "SMS + Email" },
  { n: "Invoice Generated", tr: "On invoice creation", ch: "Email + WhatsApp" },
  { n: "Renewal Reminder (7d)", tr: "7 days before expiry", ch: "SMS + Email" },
  { n: "Payment Received", tr: "On payment success", ch: "Email" },
  { n: "API Key Expiry Alert", tr: "7 days before expiry", ch: "SMS + Email" },
];

export default function NotifTemplates() {
  return (
    <div>
      <FilterBar>
        <FilterRight>
          <button onClick={() => toast.success("New template created")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ New Template</button>
        </FilterRight>
      </FilterBar>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {templates.map(tmpl => (
          <Panel key={tmpl.n} title={tmpl.n} subtitle={tmpl.tr} pip="b" right={<StatusBadge variant="ok">active</StatusBadge>}>
            <div className="text-[13px] text-am-text-3 mb-2.5">
              Channels: <strong className="text-am-text-2">{tmpl.ch}</strong>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 text-[13px] text-am-text-3 font-mono mb-2.5">
              {`Dear {client_name}, your {action} has been {status}. Login at traders.antmeta.ai -- AntMeta`}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toast.info(`Editing ${tmpl.n}`)} className="bg-am-secondary hover:bg-am-secondary/80 text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer">Edit</button>
              <button onClick={() => toast.success("Test message sent")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer">Test Send</button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
