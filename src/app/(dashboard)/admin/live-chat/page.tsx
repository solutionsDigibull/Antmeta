"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/shared/panel";
import { UserAvatar } from "@/components/shared/user-avatar";

const chatContacts = [
  { n: "Rajesh Kumar", m: "API key not connecting...", tm: "2m", u: 3 },
  { n: "Priya Menon", m: "Invoice download issue", tm: "15m", u: 1 },
  { n: "TechCorp Pvt", m: "GST format query", tm: "1h", u: 0 },
];

export default function LiveChat() {
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([
    { from: "client", text: "My API key is not connecting to Delta. Getting error 401.", time: "2:30 PM" },
    { from: "admin", text: "Please whitelist our server IP 13.235.112.48 on Delta Exchange under API Settings → IP Whitelist.", time: "2:32 PM" },
  ]);

  const send = () => {
    if (!msg.trim()) return;
    setMsgs(p => [...p, { from: "admin", text: msg, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
    setMsg("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3.5">
      {/* Active Chats Sidebar */}
      <Panel title="Active Chats" pip="b">
        {chatContacts.map(c => (
          <div
            key={c.n}
            onClick={() => toast.info(`Chat: ${c.n}`)}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer mb-1 ${c.u ? "bg-am-primary-light" : "bg-black/10"}`}
          >
            <UserAvatar name={c.n} size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-am-text">{c.n}</div>
              <div className="text-[13px] text-am-text-3 truncate">{c.m}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-am-text-3">{c.tm}</div>
              {c.u > 0 && (
                <div className="w-4 h-4 rounded-full bg-am-primary text-white text-xs font-bold flex items-center justify-center mt-0.5 ml-auto">{c.u}</div>
              )}
            </div>
          </div>
        ))}
      </Panel>

      {/* Chat Window */}
      <div className="bg-am-bg-card border border-am-border rounded-xl overflow-hidden flex flex-col min-h-[400px]">
        {/* Chat Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-am-border-faint">
          <div className="w-[7px] h-[7px] rounded-full bg-am-primary" />
          <div>
            <div className="font-poppins text-base font-semibold text-am-text">Rajesh Kumar</div>
            <div className="text-[13px] text-am-text-3">Copy trading issue · TKT-001</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
          {msgs.map((m, i) =>
            m.from === "client" ? (
              <div key={i} className="flex gap-2">
                <UserAvatar name="RK" size={24} />
                <div className="bg-am-input-bg rounded-[0_8px_8px_8px] px-3 py-2 max-w-[75%]">
                  <div className="text-sm text-am-text-2">{m.text}</div>
                  <div className="text-xs text-am-text-3 mt-1">{m.time}</div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-2 justify-end">
                <div className="bg-[rgba(0,147,182,.18)] border border-[rgba(0,147,182,.2)] rounded-[8px_0_8px_8px] px-3 py-2 max-w-[75%]">
                  <div className="text-sm text-am-text">{m.text}</div>
                  <div className="text-xs text-am-text-3 mt-1">{m.time} · You</div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Input */}
        <div className="p-2.5 border-t border-am-border-faint flex gap-2">
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-am-input-bg border border-am-border rounded-lg text-sm text-am-text outline-none"
          />
          <button onClick={send} className="bg-am-primary hover:bg-am-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">Send</button>
        </div>
      </div>
    </div>
  );
}
