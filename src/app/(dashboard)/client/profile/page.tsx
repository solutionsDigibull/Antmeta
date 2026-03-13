"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { InfoGrid } from "@/components/shared/info-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { TabSwitcher } from "@/components/shared/tab-switcher";
import { ProgressBar } from "@/components/shared/progress-bar";
import { AlertBox } from "@/components/shared/alert-box";
import { UserAvatar } from "@/components/shared/user-avatar";

// Individual KYC documents
const indDocs = [
  {
    id: "pan",
    name: "PAN Card",
    status: "verified" as const,
    detail: "ABCDE1234F",
    method: "Auto-verified via NSDL API",
    fetchedName: "Rajesh Kumar",
    date: "15 Jan 2026",
  },
  {
    id: "aadhaar",
    name: "Aadhaar Card",
    status: "verified" as const,
    detail: "XXXX XXXX 4567",
    method: "DigiLocker verified",
    fetchedName: "Rajesh Kumar",
    date: "15 Jan 2026",
  },
];

// Corporate KYC 6-document categories
const corpDocs = [
  { id: "incorp", num: "1", name: "Company Incorporation Certificate", desc: "LLC / OPC / Pvt Ltd / Ltd / Partnership / Proprietorship", status: "uploaded" as const, method: "Admin review required" },
  { id: "cpan", num: "2", name: "Company PAN Card", desc: "Auto-verified via NSDL, cross-checked with incorporation", status: "verified" as const, method: "NSDL auto-verified" },
  { id: "ppan", num: "3", name: "Partnership/Proprietor PAN", desc: "Required only for Partnership & Proprietorship firms", status: "not-required" as const, method: "N/A — Pvt Ltd entity" },
  { id: "dpan", num: "4", name: "Director PAN + Aadhaar", desc: "Per director, DigiLocker supported, cross-verified", status: "pending" as const, method: "2 of 3 directors submitted" },
  { id: "gst", num: "5", name: "GST / UDYAM Certificate", desc: "At least one mandatory, GSTIN cross-checked", status: "verified" as const, method: "GST Portal verified" },
  { id: "aoa", num: "6", name: "AOA & MOA / Partnership Deed", desc: "Manual admin review required", status: "pending" as const, method: "Uploaded, awaiting review" },
];

const statusColors: Record<string, { bg: string; bc: string; color: string; label: string }> = {
  verified: { bg: "bg-am-success-light", bc: "border-[rgba(34,197,94,.3)]", color: "text-am-success", label: "\u2713 Verified" },
  pending: { bg: "bg-am-gold-light", bc: "border-[rgba(244,160,32,.3)]", color: "text-am-gold", label: "\u23F3 Pending" },
  uploaded: { bg: "bg-am-primary-light", bc: "border-[rgba(0,147,182,.3)]", color: "text-am-primary", label: "\u{1F4E4} Uploaded" },
  rejected: { bg: "bg-am-danger-light", bc: "border-[rgba(239,68,68,.3)]", color: "text-am-danger", label: "\u2717 Rejected" },
  "not-required": { bg: "bg-[rgba(100,100,100,.08)]", bc: "border-am-border", color: "text-am-text-3", label: "— Not Required" },
};

const verificationHistory = [
  { dt: "15 Jan 2026", doc: "PAN Card", act: "Auto-Verification", m: "NSDL API", st: "ok", d: "ABCDE1234F \u2192 Name: Rajesh Kumar" },
  { dt: "15 Jan 2026", doc: "Aadhaar", act: "DigiLocker Verify", m: "DigiLocker", st: "ok", d: "XXXX4567 \u2192 Name match confirmed" },
  { dt: "15 Jan 2026", doc: "Cross-Check", act: "Name Matching", m: "System", st: "ok", d: "PAN & Aadhaar names match \u2713" },
  { dt: "14 Jan 2026", doc: "PAN Card", act: "Upload", m: "Manual", st: "blue", d: "File: pan_card.jpg (240 KB)" },
];

export default function MyProfilePage() {
  const [kycTab, setKycTab] = useState("status");
  const [accountType] = useState<"individual" | "corporate">("individual");
  const [panFile, setPanFile] = useState<string | null>(null);
  const [aadhaarMode, setAadhaarMode] = useState("digilocker");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Profile Details + Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        {/* Profile Details */}
        <Panel
          title="Profile Details"
          pip="b"
          right={
            <button
              onClick={() => toast.success("Profile saved")}
              className="text-xs font-semibold bg-am-secondary/20 text-am-secondary border border-am-secondary/30 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-am-secondary/30 transition-colors"
            >
              Save Changes
            </button>
          }
        >
          <div className="flex items-center gap-3 mb-4 pb-3.5 border-b border-am-border-faint">
            <UserAvatar name="Rajesh Kumar" size={44} />
            <div>
              <div className="text-sm font-bold text-am-text">Rajesh Kumar</div>
              <div className="text-[13px] text-am-text-3">ID: 260116100001</div>
              <div className="flex gap-1.5 mt-1">
                <StatusBadge>Individual</StatusBadge>
                <StatusBadge variant="ok">Active</StatusBadge>
              </div>
            </div>
            <button
              onClick={() => toast("Upload photo")}
              className="ml-auto text-xs font-semibold text-am-text-3 hover:text-am-text px-2 py-1 cursor-pointer transition-colors"
            >
              Upload Photo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {([["Full Name", "Rajesh Kumar"], ["Mobile", "+91 9876543210"], ["Email", "rajesh@email.com"], ["DOB", "1985-06-15"]] as const).map(
              ([l, v]) => (
                <div key={l}>
                  <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">{l}</label>
                  <input
                    defaultValue={v}
                    className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none"
                  />
                </div>
              )
            )}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Address</label>
              <textarea
                defaultValue="14B, Marine Lines, Mumbai 400001"
                rows={2}
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none resize-y"
              />
            </div>
          </div>
        </Panel>

        {/* Change Password */}
        <Panel title="Change Password" pip="g">
          {["Current Password", "New Password", "Confirm Password"].map((l) => (
            <div key={l} className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">{l}</label>
              <input
                type="password"
                placeholder={l}
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => toast.success("Password changed")}
            className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center"
          >
            Change Password
          </button>
        </Panel>
      </div>

      {/* KYC Section Tabs */}
      <TabSwitcher
        tabs={[
          ["status", "\u{1F4CB} KYC Status"],
          ["upload", "\u{1F4E4} Upload Documents"],
          ["history", "\u{1F4DC} Verification History"],
        ]}
        active={kycTab}
        onChange={setKycTab}
      />

      {/* KYC Status Tab */}
      {kycTab === "status" && (
        <div>
          {/* Overall status banner */}
          <div className="flex items-center gap-2.5 mb-3.5 p-3.5 bg-[rgba(34,197,94,.06)] border border-[rgba(34,197,94,.2)] rounded-[10px]">
            <div className="w-10 h-10 rounded-[10px] bg-am-success-light flex items-center justify-center text-xl">
              {"\u2713"}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-am-success">KYC Fully Verified</div>
              <div className="text-[13px] text-am-text-3">
                All documents verified {"·"} Verified 15 Jan 2026
              </div>
            </div>
            <ProgressBar width="100%" color="ok" />
          </div>

          {accountType === "individual" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {indDocs.map((d) => (
                <Panel
                  key={d.id}
                  title={d.name}
                  pip={d.status === "verified" ? "b" : "g"}
                  right={
                    <StatusBadge variant={d.status === "verified" ? "ok" : "warn"}>
                      {statusColors[d.status]?.label}
                    </StatusBadge>
                  }
                >
                  <InfoGrid
                    items={[
                      ["Document No.", d.detail],
                      ["Name Fetched", d.fetchedName, "var(--am-success)"],
                      ["Method", d.method],
                      ["Verified On", d.date],
                    ]}
                  />
                  {d.status === "verified" && (
                    <div className="mt-2 text-[13px] text-am-success flex items-center gap-1.5">
                      {"\u2713"} Name cross-check: PAN & Aadhaar names match
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          ) : (
            <Panel
              title="Corporate KYC — 6 Document Checklist"
              pip="b"
              right={<span className="text-sm text-am-text-3">4/6 verified</span>}
            >
              {corpDocs.map((d) => {
                const sc = statusColors[d.status] || statusColors.pending;
                return (
                  <div key={d.id} className="flex items-center gap-3 py-3 border-b border-am-border-faint">
                    <div
                      className={`w-7 h-7 rounded-[7px] ${sc.bg} border ${sc.bc} flex items-center justify-center text-sm font-bold ${sc.color} shrink-0`}
                    >
                      {d.num}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-am-text">{d.name}</div>
                      <div className="text-xs text-am-text-3 mt-0.5">{d.desc}</div>
                      <div className={`text-xs ${sc.color} mt-0.5`}>{d.method}</div>
                    </div>
                    <div
                      className={`${sc.bg} border ${sc.bc} rounded-md py-0.5 px-2 text-xs font-semibold ${sc.color}`}
                    >
                      {sc.label}
                    </div>
                  </div>
                );
              })}
            </Panel>
          )}
        </div>
      )}

      {/* Upload Documents Tab */}
      {kycTab === "upload" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* PAN Card Upload */}
          <Panel title="\u{1F4C7} PAN Card Upload" subtitle="Auto-verified via NSDL API" pip="b">
            <div className="mb-2.5">
              <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">PAN Number</label>
              <input
                defaultValue="ABCDE1234F"
                placeholder="Enter 10-char PAN"
                maxLength={10}
                className="w-full bg-am-input-bg border border-am-border rounded-lg py-2 px-2.5 font-sans text-sm text-am-text outline-none tracking-widest uppercase"
              />
            </div>
            <div
              className="border-2 border-dashed border-am-border rounded-[10px] py-5 px-4 text-center cursor-pointer bg-[rgba(0,147,182,.03)] mb-2.5"
              onClick={() => {
                setPanFile("pan_card.jpg");
                toast("PAN image selected");
              }}
            >
              {panFile ? (
                <div className="text-sm text-am-success">{"\u{1F4C4}"} {panFile} selected</div>
              ) : (
                <>
                  <div className="text-2xl mb-1">{"\u{1F4C7}"}</div>
                  <div className="text-sm text-am-text-2">Upload PAN Card image</div>
                  <div className="text-xs text-am-text-3 mt-0.5">JPG, PNG up to 5 MB</div>
                </>
              )}
            </div>
            <button
              onClick={() => toast.success("PAN verified via NSDL: Name = Rajesh Kumar \u2713")}
              className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center"
            >
              Verify PAN via NSDL
            </button>
            <div className="text-xs text-am-text-3 text-center mt-1.5">
              Status: <span className="text-am-success font-semibold">Auto-Verified</span> {"·"} Name fetched: Rajesh Kumar
            </div>
          </Panel>

          {/* Aadhaar Verification */}
          <Panel title="\u{1F194} Aadhaar Verification" subtitle="DigiLocker preferred" pip="b">
            <div className="flex gap-1.5 mb-3">
              {([["digilocker", "\u{1F517} DigiLocker (Recommended)"], ["manual", "\u{1F4E4} Manual Upload"]] as const).map(
                ([v, l]) => (
                  <div
                    key={v}
                    onClick={() => setAadhaarMode(v)}
                    className={`flex-1 text-center py-2 px-1.5 rounded-[7px] border cursor-pointer text-[13px] font-semibold transition-all ${
                      aadhaarMode === v
                        ? "border-am-primary bg-am-primary-light text-am-primary"
                        : "border-am-border bg-black/15 text-am-text-2"
                    }`}
                  >
                    {l}
                  </div>
                )
              )}
            </div>
            {aadhaarMode === "digilocker" ? (
              <>
                <AlertBox variant="i">
                  DigiLocker connects directly to UIDAI for instant Aadhaar verification. No manual upload needed.
                </AlertBox>
                <button
                  onClick={() => toast.success("DigiLocker: Aadhaar verified \u2713 Name = Rajesh Kumar")}
                  className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center mt-2.5"
                >
                  Connect DigiLocker {"\u2192"}
                </button>
              </>
            ) : (
              <>
                <div
                  className="border-2 border-dashed border-am-border rounded-[10px] py-5 px-4 text-center cursor-pointer bg-[rgba(0,147,182,.03)] mb-2.5"
                  onClick={() => toast("Aadhaar image selected")}
                >
                  <div className="text-2xl mb-1">{"\u{1F194}"}</div>
                  <div className="text-sm text-am-text-2">Upload Aadhaar (front + back)</div>
                  <div className="text-xs text-am-text-3 mt-0.5">JPG, PNG up to 5 MB each</div>
                </div>
                <button
                  onClick={() => toast("Aadhaar uploaded — pending admin verification")}
                  className="w-full bg-am-primary hover:bg-am-primary-hover text-white font-semibold text-sm rounded-lg py-2.5 cursor-pointer transition-colors text-center"
                >
                  Submit for Verification
                </button>
              </>
            )}
            <div className="mt-2.5 py-2 px-2.5 bg-[rgba(34,197,94,.06)] border border-[rgba(34,197,94,.2)] rounded-[7px] text-[13px]">
              <div className="font-semibold text-am-success mb-0.5">{"\u2713"} Cross Verification Passed</div>
              <div className="text-am-text-3">PAN Name: Rajesh Kumar = Aadhaar Name: Rajesh Kumar</div>
            </div>
          </Panel>

          {/* Corporate KYC Documents (if corporate) */}
          {accountType === "corporate" &&
            corpDocs.map((d) => (
              <Panel key={d.id} title={`${d.num}. ${d.name}`} subtitle={d.desc} pip="b">
                <div
                  className="border-2 border-dashed border-am-border rounded-[10px] py-4 text-center cursor-pointer bg-[rgba(0,147,182,.03)] mb-2"
                  onClick={() => toast(`${d.name} selected`)}
                >
                  <div className="text-sm text-am-text-2">Click to upload</div>
                  <div className="text-xs text-am-text-3 mt-0.5">PDF, JPG, PNG up to 10 MB</div>
                </div>
                <button
                  onClick={() => toast.success(`${d.name} uploaded`)}
                  className="w-full bg-am-secondary/20 text-am-secondary border border-am-secondary/30 rounded-lg py-1.5 text-xs font-semibold cursor-pointer hover:bg-am-secondary/30 transition-colors text-center"
                >
                  Upload
                </button>
              </Panel>
            ))}
        </div>
      )}

      {/* Verification History Tab */}
      {kycTab === "history" && (
        <Panel title="Verification History" pip="b">
          <DataTable headers={["Date", "Document", "Action", "Method", "Status", "Details"]}>
            {verificationHistory.map((r, i) => (
              <tr key={i}>
                <Td className="text-[13px]">{r.dt}</Td>
                <Td bold>{r.doc}</Td>
                <Td>{r.act}</Td>
                <Td>{r.m}</Td>
                <Td>
                  <StatusBadge variant={r.st}>{r.st === "ok" ? "Success" : "Uploaded"}</StatusBadge>
                </Td>
                <Td className="text-[13px]">{r.d}</Td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
