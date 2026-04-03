"use client";

import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterSelect } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";

const documents = [
  { t: "PAN Card Upload Guide", cat: "Individual KYC", tp: "PDF", ver: "v2.1", sz: "1.2 MB", v: 234, dt: "15 Feb 2026" },
  { t: "Aadhaar DigiLocker Guide", cat: "Individual KYC", tp: "PDF", ver: "v1.4", sz: "890 KB", v: 189, dt: "10 Feb 2026" },
  { t: "6-Document Corp Checklist", cat: "Corporate KYC", tp: "PDF", ver: "v3.0", sz: "2.1 MB", v: 98, dt: "12 Feb 2026" },
  { t: "Copy Trading Introduction", cat: "Algorithm Guides", tp: "PDF", ver: "v2.0", sz: "3.4 MB", v: 312, dt: "18 Feb 2026" },
  { t: "P&L Calculation Video", cat: "Algorithm Guides", tp: "Video", ver: "v1.0", sz: "Link", v: 187, dt: "10 Feb 2026" },
];

export default function UserGuidelines() {
  return (
    <div>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <SearchInput placeholder="Search documents..." className="w-full sm:w-[250px]" />
          <FilterSelect>
            <option>All Categories</option><option>Individual KYC</option><option>Corporate KYC</option><option>Algorithms</option><option>Platform</option>
          </FilterSelect>
          <FilterSelect>
            <option>All Types</option><option>PDF</option><option>DOC</option><option>Video</option>
          </FilterSelect>
        </div>
        <button onClick={() => toast.info("Upload dialog opened")} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer">+ Upload Document</button>
      </div>

      <Panel title="User Guideline Documents" subtitle="Version-controlled documentation for clients" pip="b">
        <DataTable headers={["Document", "Category", "Type", "Version", "Size", "Views", "Updated", "Actions"]}>
          {documents.map(d => (
            <tr key={d.t}>
              <Td bold>{d.t}</Td>
              <Td>{d.cat}</Td>
              <Td><StatusBadge variant={d.tp === "PDF" ? "blue" : d.tp === "Video" ? "teal" : "warn"}>{d.tp}</StatusBadge></Td>
              <Td>{d.ver}</Td>
              <Td>{d.sz}</Td>
              <Td>{d.v}</Td>
              <Td className="text-[13px]">{d.dt}</Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => toast.info("Viewing")} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">View</button>
                  <button onClick={() => toast.success("Downloading")} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Download</button>
                  <button onClick={() => toast.info("Editing")} className="text-am-text-2 hover:text-am-text text-xs font-semibold cursor-pointer">Edit</button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
