"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { Modal } from "@/components/shared/modal";
import type { Ticket } from "@/lib/types";

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTicket, setReplyTicket] = useState<Ticket | null>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetch("/api/tickets")
      .then(r => r.json())
      .then(d => { if (d.data) setTickets(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (tk: Ticket) => {
    const res = await fetch(`/api/tickets/${tk.uuid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    if (res.ok) {
      setTickets(prev => prev.map(t => t.uuid === tk.uuid ? { ...t, status: "resolved" } : t));
      toast.success(`${tk.id} resolved`);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to resolve ticket");
    }
  };

  const handleReply = async () => {
    if (!replyTicket || !replyMsg.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/tickets/${replyTicket.uuid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMsg.trim(), is_internal: false }),
      });
      if (res.ok) {
        toast.success(`Reply sent for ${replyTicket.id}`);
        setReplyMsg("");
        setReplyTicket(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send reply");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const highPriorityOpen = tickets.filter(t => t.status === "open" && t.pri === "high").length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3.5">
        <KpiCard value={String(highPriorityOpen)} label="Open High Priority" color="var(--am-danger)" />
        <KpiCard value={String(openCount)} label="Total Open" color="var(--am-gold)" />
        <KpiCard value={String(tickets.filter(t => t.status === "resolved").length)} label="Resolved" color="var(--am-success)" />
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
                  <button
                    onClick={() => { setReplyTicket(tk); setReplyMsg(""); }}
                    className="bg-am-secondary hover:bg-am-secondary/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    Reply
                  </button>
                  {tk.status !== "resolved" && (
                    <button
                      onClick={() => handleResolve(tk)}
                      className="text-am-text-2 hover:text-am-text text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer border border-am-border"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {/* Reply Modal */}
      <Modal open={!!replyTicket} onClose={() => setReplyTicket(null)} title={`Reply to ${replyTicket?.id || ""}`} width={480}>
        <div className="mb-3">
          <div className="text-sm text-am-text-2 mb-3 bg-am-input-bg rounded-lg p-2.5 border border-am-border-faint">
            {replyTicket?.subj}
          </div>
          <label className="block text-xs font-semibold text-am-text-3 mb-1 uppercase">Message *</label>
          <textarea
            rows={5}
            value={replyMsg}
            onChange={(e) => setReplyMsg(e.target.value)}
            placeholder="Type your reply…"
            className="w-full bg-am-input-bg border border-am-border rounded-lg py-2.5 px-3 font-sans text-sm text-am-text outline-none resize-y"
          />
        </div>
        <div className="flex gap-2.5 justify-end pt-3 border-t border-am-border-faint">
          <button
            onClick={() => setReplyTicket(null)}
            className="text-am-text-2 hover:text-am-text border border-am-border rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleReply}
            disabled={replying || !replyMsg.trim()}
            className="bg-am-secondary hover:bg-am-secondary/80 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {replying ? "Sending…" : "Send Reply"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
