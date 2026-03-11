"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, Td } from "@/components/shared/data-table";
import { FilterSelect } from "@/components/shared/filter-bar";

const monthly = [
  { m: "Sep", rev: 42, exp: 18, net: 24 },
  { m: "Oct", rev: 56, exp: 22, net: 34 },
  { m: "Nov", rev: 48, exp: 20, net: 28 },
  { m: "Dec", rev: 62, exp: 24, net: 38 },
  { m: "Jan", rev: 58, exp: 21, net: 37 },
  { m: "Feb", rev: 72, exp: 26, net: 46 },
];

const trades = [
  { d: "22 Feb", sym: "BTC-PERP", side: "LONG", qty: "0.025", entry: "$42,800", exit: "$43,600", pnl: "+₹4,200", pos: true },
  { d: "21 Feb", sym: "ETH-PERP", side: "LONG", qty: "0.40", entry: "$2,340", exit: "$2,410", pnl: "+₹7,360", pos: true },
  { d: "20 Feb", sym: "BTC-PERP", side: "SHORT", qty: "0.01", entry: "$43,200", exit: "$43,100", pnl: "+₹1,050", pos: true },
  { d: "19 Feb", sym: "ETH-PERP", side: "LONG", qty: "0.30", entry: "$2,200", exit: "$2,180", pnl: "−₹1,680", pos: false },
];

const maxRevExp = Math.max(...monthly.map((m) => m.rev));
const barW = 80;

export default function PnLClientPage() {
  const [period, setPeriod] = useState("mtd");
  const [chartView, setChartView] = useState("equity");

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-3.5">
        <KpiCard value="+₹38,400" label="MTD P&L" sub="Net after fees" color="var(--am-success)" />
        <KpiCard value="+₹2.84L" label="Total Revenue" sub="Gross trading gains" color="var(--am-primary)" />
        <KpiCard value="₹96,400" label="Total Expenses" sub="Fees + losses" color="var(--am-danger)" />
        <KpiCard value="+8.4%" label="Return MTD" />
        <KpiCard value="3.2%" label="Max Drawdown" color="var(--am-danger)" />
      </div>

      {/* Chart Controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex gap-0.5 bg-am-input-bg rounded-md p-0.5">
          {(
            [
              ["equity", "Equity Curve"],
              ["revexp", "Revenue vs Expenses"],
              ["monthly", "Monthly Comparison"],
            ] as const
          ).map(([v, l]) => (
            <div
              key={v}
              onClick={() => setChartView(v)}
              className={`py-[5px] px-3 rounded-[5px] text-xs font-semibold cursor-pointer transition-all ${
                chartView === v ? "bg-am-primary text-white" : "text-am-text-3"
              }`}
            >
              {l}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 bg-am-input-bg rounded-md p-0.5 ml-auto">
          {(
            [
              ["mtd", "MTD"],
              ["3m", "3M"],
              ["6m", "6M"],
              ["1y", "1Y"],
            ] as const
          ).map(([v, l]) => (
            <div
              key={v}
              onClick={() => setPeriod(v)}
              className={`py-[5px] px-2.5 rounded-[5px] text-xs font-semibold cursor-pointer transition-all ${
                period === v ? "bg-am-secondary text-white" : "text-am-text-3"
              }`}
            >
              {l}
            </div>
          ))}
        </div>
        <button
          onClick={() => toast.success("P&L exported as PDF")}
          className="text-xs font-semibold text-am-text-3 hover:text-am-text px-2 py-1 rounded cursor-pointer transition-colors"
        >
          PDF {"\u2193"}
        </button>
        <button
          onClick={() => toast.success("P&L exported as Excel")}
          className="text-xs font-semibold text-am-text-3 hover:text-am-text px-2 py-1 rounded cursor-pointer transition-colors"
        >
          Excel {"\u2193"}
        </button>
      </div>

      {/* Equity Curve */}
      {chartView === "equity" && (
        <Panel
          title="Equity Curve"
          subtitle="Portfolio growth over time"
          pip="b"
          right={
            <div className="font-poppins text-lg font-bold text-am-success">+₹38,400</div>
          }
        >
          <svg width="100%" height="110" viewBox="0 0 700 110" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--am-success)" stopOpacity=".3" />
                <stop offset="100%" stopColor="var(--am-success)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(0,147,182,.06)" strokeWidth="1" />
            ))}
            <path
              d="M0 95 L78 88 L156 78 L234 65 L312 52 L390 42 L468 35 L546 22 L624 15 L700 10 L700 110 L0 110Z"
              fill="url(#eqGrad)"
            />
            <path
              d="M0 95 L78 88 L156 78 L234 65 L312 52 L390 42 L468 35 L546 22 L624 15 L700 10"
              fill="none"
              stroke="var(--am-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {([
              ["0", 95, "₹3.82L"],
              ["390", 42, "₹4.05L"],
              ["700", 10, "₹4.20L"],
            ] as [string, number, string][]).map(([x, y, v]) => (
              <g key={x}>
                <circle cx={x} cy={y} r="4" fill="var(--am-success)" stroke="var(--am-bg)" strokeWidth="2" />
                <text x={x} y={y - 8} textAnchor="middle" fill="var(--am-success)" fontSize="8" fontWeight="700">
                  {v}
                </text>
              </g>
            ))}
          </svg>
        </Panel>
      )}

      {/* Revenue vs Expenses */}
      {chartView === "revexp" && (
        <Panel
          title="Revenue vs Expenses"
          subtitle="Trading gains vs fees & losses"
          pip="b"
          right={
            <div className="flex gap-3 text-[13px]">
              <span className="text-am-success">{"\u25CF"} Revenue</span>
              <span className="text-am-danger">{"\u25CF"} Expenses</span>
              <span className="text-am-primary font-bold">{"\u25CF"} Net Profit</span>
            </div>
          }
        >
          <svg width="100%" height="140" viewBox="0 0 560 140" preserveAspectRatio="xMidYMid meet">
            {monthly.map((m, i) => {
              const x = i * (barW + 12) + 10;
              const rh = (m.rev / maxRevExp) * 95;
              const eh = (m.exp / maxRevExp) * 95;
              return (
                <g key={m.m}>
                  <rect x={x} y={120 - rh} width={30} height={rh} rx="3" fill="var(--am-success)" opacity=".7" />
                  <rect x={x + 34} y={120 - eh} width={30} height={eh} rx="3" fill="var(--am-danger)" opacity=".7" />
                  <text x={x + 32} y="135" textAnchor="middle" fill="var(--am-text-3)" fontSize="9" fontFamily="Inter">
                    {m.m}
                  </text>
                  <text x={x + 15} y={118 - rh} textAnchor="middle" fill="var(--am-success)" fontSize="7" fontWeight="700">
                    ₹{m.rev}K
                  </text>
                  <text x={x + 49} y={118 - eh} textAnchor="middle" fill="var(--am-danger)" fontSize="7" fontWeight="700">
                    ₹{m.exp}K
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex justify-center gap-5 pt-2 border-t border-am-border-faint mt-1 text-sm">
            <span className="text-am-success font-bold">Total Revenue: ₹3.38L</span>
            <span className="text-am-danger font-bold">Total Expenses: ₹1.31L</span>
            <span className="text-am-primary font-bold">Net Profit: ₹2.07L</span>
          </div>
        </Panel>
      )}

      {/* Monthly Comparison */}
      {chartView === "monthly" && (
        <Panel title="Monthly P&L Comparison" subtitle="Net profit by month" pip="b">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
            {monthly.map((m) => (
              <div
                key={m.m}
                className="text-center p-3 bg-black/20 rounded-lg border border-am-border-faint"
              >
                <div className="text-[13px] font-semibold text-am-text-3 mb-1.5">{m.m}</div>
                <div className="font-poppins text-lg font-bold text-am-success">+₹{m.net}K</div>
                <div className="h-1 rounded-sm bg-am-border-faint mt-2 mb-1">
                  <div
                    className="h-full rounded-sm bg-am-success"
                    style={{ width: `${(m.net / 50) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-am-success">↑₹{m.rev}K</span>
                  <span className="text-am-danger">↓₹{m.exp}K</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Trade History */}
      <Panel
        title="Trade History"
        pip="t"
        right={
          <div className="flex gap-1.5">
            <FilterSelect>
              <option>All Symbols</option>
              <option>BTC-PERP</option>
              <option>ETH-PERP</option>
              <option>SOL-PERP</option>
            </FilterSelect>
            <FilterSelect>
              <option>All Sides</option>
              <option>LONG</option>
              <option>SHORT</option>
            </FilterSelect>
          </div>
        }
      >
        <DataTable headers={["Date", "Symbol", "Side", "Qty", "Entry", "Exit", "P&L"]}>
          {trades.map((tr, i) => (
            <tr key={i}>
              <Td className="text-[13px]">{tr.d}</Td>
              <Td bold>{tr.sym}</Td>
              <Td>
                <StatusBadge variant={tr.side === "LONG" ? "ok" : "bad"}>{tr.side}</StatusBadge>
              </Td>
              <Td>{tr.qty}</Td>
              <Td>{tr.entry}</Td>
              <Td>{tr.exit}</Td>
              <Td bold color={tr.pos ? "var(--am-success)" : "var(--am-danger)"}>{tr.pnl}</Td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
