"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";

const adminUsers = [
  { n: "Raghav S.", e: "raghav@antmeta.in", r: "Super Admin", rv: "blue", fa: "ok", l: "Now" },
  { n: "Sathish K.", e: "sathish@antmeta.in", r: "Operations", rv: "teal", fa: "ok", l: "1h ago" },
  { n: "Meera R.", e: "meera@antmeta.in", r: "Finance", rv: "purple", fa: "warn", l: "2d ago" },
];

const permissionRows = [
  ["Dashboard", "Full", "Full", "View", "Own clients"],
  ["KYC Verification", "Full", "Full", "None", "None"],
  ["Copy Trading", "Full", "Full", "None", "None"],
  ["Invoicing", "Full", "View", "Full", "None"],
  ["Master Accounts", "Full", "Full", "None", "None"],
  ["Partners", "Full", "View", "None", "None"],
  ["System Settings", "Full", "None", "None", "None"],
];

export default function UserRoles() {
  return (
    <div>
      <Panel
        title="Admin Users"
        pip="b"
        right={
          <button onClick={() => toast.success("Invite sent")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
            + Invite Admin
          </button>
        }
      >
        <DataTable headers={["Name", "Email", "Role", "2FA", "Last Login", "Status", "Actions"]}>
          {adminUsers.map(u => (
            <tr key={u.n}>
              <Td bold>{u.n}</Td>
              <Td>{u.e}</Td>
              <Td><StatusBadge variant={u.rv}>{u.r}</StatusBadge></Td>
              <Td><StatusBadge variant={u.fa}>{u.fa === "ok" ? "Enabled" : "Pending"}</StatusBadge></Td>
              <Td>{u.l}</Td>
              <Td><StatusBadge variant="ok">Active</StatusBadge></Td>
              <Td>
                <button onClick={() => toast.info(`Editing ${u.n}`)} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Edit</button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Role Permissions" pip="p">
        <DataTable headers={["Module", "Super Admin", "Operations", "Finance", "Partner"]}>
          {permissionRows.map(r => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <Td key={i} bold={i === 0}>{c}</Td>
              ))}
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
