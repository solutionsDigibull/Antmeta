"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertBox } from "@/components/shared/alert-box";
import { InfoGrid } from "@/components/shared/info-grid";
import { Icon } from "@/components/icons";

const sessions = [
  { d: "Chrome on Mac", ip: "122.164.xx.xx", l: "Mumbai, IN", tm: "Now (current)", curr: true },
  { d: "Safari on iPhone", ip: "49.204.xx.xx", l: "Chennai, IN", tm: "2h ago", curr: false },
  { d: "Chrome on Windows", ip: "49.36.xx.xx", l: "Bangalore, IN", tm: "5h ago", curr: false },
];

export default function AdminSecurity() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
      {/* 2FA Settings */}
      <Panel title="Two-Factor Authentication" pip="b">
        <AlertBox variant="s">2FA is enabled for your account</AlertBox>
        <InfoGrid items={[["2FA Method", "Google Authenticator"], ["Backup Codes", "8 remaining"], ["Session Timeout", "24 hours (JWT)"], ["Max Devices", "3 concurrent"]]} />
        <div className="flex gap-2 mt-3.5">
          <button onClick={() => toast.success("Backup codes regenerated")} className="bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">Regenerate Codes</button>
          <button onClick={() => toast.info("QR code shown")} className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">Setup New Device</button>
        </div>
      </Panel>

      {/* Active Sessions */}
      <Panel
        title="Active Sessions"
        pip="g"
        right={
          <button onClick={() => toast.success("All other sessions terminated")} className="bg-am-danger hover:bg-am-danger/80 text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
            Force Logout All
          </button>
        }
      >
        {sessions.map(s => (
          <div key={s.d} className="flex items-center gap-2.5 py-2.5 border-b border-am-border-faint">
            <div className="w-8 h-8 rounded-lg bg-am-primary-light flex items-center justify-center shrink-0">
              <Icon name="settings" size={15} className="text-am-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-am-text">
                {s.d}
                {s.curr && <span className="text-xs bg-am-success-light text-am-success py-0.5 px-1.5 rounded ml-1">Current</span>}
              </div>
              <div className="text-xs text-am-text-3">{s.ip} · {s.l} · {s.tm}</div>
            </div>
            {!s.curr && (
              <button onClick={() => toast.success("Session revoked")} className="bg-am-danger hover:bg-am-danger/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer">Revoke</button>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
