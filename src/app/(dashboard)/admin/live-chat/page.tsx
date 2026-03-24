"use client";

import { useState, useEffect, useRef } from "react";
import { Panel } from "@/components/shared/panel";
import { UserAvatar } from "@/components/shared/user-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import type { Ticket } from "@/lib/types";

interface ChatMessage {
  id: string;
  from: "client" | "admin";
  text: string;
  time: string;
  senderName: string;
}

export default function LiveChat() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load open tickets for sidebar
  useEffect(() => {
    fetch("/api/tickets?status=open&limit=20")
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setTickets(d.data);
          if (d.data.length > 0 && !selected) {
            selectTicket(d.data[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const selectTicket = (ticket: Ticket) => {
    setSelected(ticket);
    setMessages([]);
    setLoadingMsgs(true);
    fetch(`/api/tickets/${ticket.uuid}/messages`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setMessages(d.data.map((m: Record<string, unknown>) => {
            const sender = m.sender as Record<string, unknown> | null;
            const senderRole = sender?.role as string || "client";
            return {
              id: m.id as string,
              from: ["super_admin", "admin", "support"].includes(senderRole) ? "admin" : "client",
              text: m.message as string,
              time: new Date(m.created_at as string).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              senderName: (sender?.name as string) || "Unknown",
            };
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!msg.trim() || !selected) return;
    setSending(true);
    const text = msg.trim();
    setMsg("");
    try {
      const res = await fetch(`/api/tickets/${selected.uuid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, is_internal: false }),
      });
      const data = await res.json();
      if (res.ok) {
        const m = data.data;
        const sender = m.sender as Record<string, unknown> | null;
        setMessages(prev => [...prev, {
          id: m.id,
          from: "admin",
          text: m.message,
          time: new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          senderName: (sender?.name as string) || "Admin",
        }]);
      } else {
        toast.error(data.error || "Failed to send message");
        setMsg(text); // restore
      }
    } catch {
      toast.error("Network error");
      setMsg(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3.5">
      {/* Ticket Sidebar */}
      <Panel title="Open Tickets" pip="b">
        {tickets.length === 0 && (
          <div className="text-sm text-am-text-3 py-4 text-center">No open tickets.</div>
        )}
        {tickets.map(tk => (
          <div
            key={tk.uuid}
            onClick={() => selectTicket(tk)}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer mb-1 transition-colors ${
              selected?.uuid === tk.uuid ? "bg-am-primary-light" : "bg-black/10 hover:bg-black/20"
            }`}
          >
            <UserAvatar name={tk.client} size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-am-text truncate">{tk.client}</div>
              <div className="text-[13px] text-am-text-3 truncate">{tk.subj}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-am-text-3">{tk.time}</div>
              <StatusBadge variant={tk.pri === "high" ? "bad" : tk.pri === "medium" ? "warn" : "blue"}>
                {tk.pri}
              </StatusBadge>
            </div>
          </div>
        ))}
      </Panel>

      {/* Chat Window */}
      <div className="bg-am-bg-card border border-am-border rounded-xl overflow-hidden flex flex-col min-h-[400px]">
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-am-border-faint">
              <div className="flex items-center gap-2">
                <div className="w-[7px] h-[7px] rounded-full bg-am-primary" />
                <div>
                  <div className="font-poppins text-base font-semibold text-am-text">{selected.client}</div>
                  <div className="text-[13px] text-am-text-3">{selected.subj} · {selected.id}</div>
                </div>
              </div>
              <StatusBadge variant={selected.status === "open" ? "warn" : "ok"}>{selected.status}</StatusBadge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
              {loadingMsgs && (
                <div className="text-sm text-am-text-3 text-center py-4">Loading messages…</div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="text-sm text-am-text-3 text-center py-4">No messages yet. Start the conversation.</div>
              )}
              {messages.map((m) =>
                m.from === "client" ? (
                  <div key={m.id} className="flex gap-2">
                    <UserAvatar name={m.senderName} size={24} />
                    <div className="bg-am-input-bg rounded-[0_8px_8px_8px] px-3 py-2 max-w-[75%]">
                      <div className="text-[11px] text-am-text-3 mb-0.5">{m.senderName}</div>
                      <div className="text-sm text-am-text-2">{m.text}</div>
                      <div className="text-xs text-am-text-3 mt-1">{m.time}</div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2 justify-end">
                    <div className="bg-[rgba(0,147,182,.18)] border border-[rgba(0,147,182,.2)] rounded-[8px_0_8px_8px] px-3 py-2 max-w-[75%]">
                      <div className="text-sm text-am-text">{m.text}</div>
                      <div className="text-xs text-am-text-3 mt-1">{m.time} · You</div>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-am-border-faint flex gap-2">
              <input
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !sending && send()}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 px-3 py-2 bg-am-input-bg border border-am-border rounded-lg text-sm text-am-text outline-none disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={sending || !msg.trim()}
                className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-am-text-3">
            Select a ticket from the left to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
