"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import type { Ticket } from "@/lib/types";

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets").then(r => r.json()).then(d => { if (d.data) setTickets(d.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value="3" label="Open High Priority" color="var(--am-danger)" />
        <KpiCard value="5" label="Total Open" color="var(--am-gold)" />
        <KpiCard value="12" label="Resolved This Week" color="var(--am-success)" />
        <KpiCard value="4.2h" label="Avg Resolution" />
      </div>

      <Panel title="Support Tickets" pip="r">
        <DataTable headers={["ID", "Client", "Subject", "Priority", "Status", "Opened", "Actions"]}>
          {tickets.map((tk) => (
            <tr key={tk.id}>
              <Td bold>{tk.id}</Td>
              <Td>{tk.client}</Td>
              <Td className="max-w-[180px] truncate">{tk.subj}</Td>
              <Td>
                <StatusBadge variant={tk.pri === "high" ? "bad" : tk.pri === "medium" ? "warn" : "blue"}>
                  {tk.pri}
                </StatusBadge>
              </Td>
              <Td>
                <StatusBadge variant={tk.status === "open" ? "warn" : "ok"}>
                  {tk.status}
                </StatusBadge>
              </Td>
              <Td>{tk.time}</Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => toast.info(`Replying to ${tk.id}`)} className="bg-am-secondary hover:bg-am-secondary/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer">Reply</button>
                  <button onClick={() => toast.success(`${tk.id} resolved`)} className="text-am-text-2 hover:text-am-text text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer border border-am-border">Resolve</button>
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
