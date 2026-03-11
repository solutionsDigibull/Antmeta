"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { Panel } from "@/components/shared/panel";
import { InfoGrid } from "@/components/shared/info-grid";
import { Icon } from "@/components/icons";

const monthlyData = {
  revenue: [28, 34, 41, 38, 45, 52, 48, 56, 62, 58, 68, 72],
  txn: [12, 18, 24, 22, 28, 34, 31, 38, 42, 39, 45, 48],
};
const weeklyData = {
  revenue: [52, 48, 56, 62, 58, 68, 72, 65],
  txn: [34, 31, 38, 42, 39, 45, 48, 44],
};
const dailyData = {
  revenue: [68, 65, 72, 70, 71, 74, 78],
  txn: [42, 40, 45, 44, 43, 47, 50],
};

const datasets: Record<string, Record<string, number[]>> = {
  monthly: monthlyData,
  weekly: weeklyData,
  daily: dailyData,
};

const labels: Record<string, string[]> = {
  monthly: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
  weekly: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  daily: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const quickActions = [
  { ico: "\u{1F4CA}", l: "View P&L Analytics", s: "Equity curve & trade history" },
  { ico: "\u{1F517}", l: "Exchange Status", s: "Connected · Last verified 6h ago" },
  { ico: "\u{1F4C4}", l: "View Invoices", s: "1 overdue · 5 paid" },
  { ico: "\u{1F4AC}", l: "Support Center", s: "Mon–Fri, 9AM–6PM IST" },
];

export default function ClientDashboardPage() {
  const [chartPeriod, setChartPeriod] = useState("monthly");
  const [chartType, setChartType] = useState("revenue");
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);

  const data = datasets[chartPeriod][chartType];
  const maxVal = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: i * (680 / (data.length - 1)) + 10,
    y: 110 - (v / maxVal) * 90,
    val: v,
    label: labels[chartPeriod][i],
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x} 115 L${pts[0].x} 115Z`;

  const successColor = "var(--am-success)";
  const primaryColor = "var(--am-primary)";
  const strokeColor = chartType === "revenue" ? successColor : primaryColor;

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-3.5">
        <KpiCard value="+₹38,400" label="MTD P&L" sub="M1 ALPHA Strategy" color="var(--am-success)" />
        <KpiCard value="+8.4%" label="Return MTD" />
        <KpiCard value="3.2%" label="Max Drawdown" color="var(--am-danger)" />
        <KpiCard value="₹4.2L" label="Portfolio Value" />
      </div>

      {/* Current Plan + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        <Panel title="Current Plan" subtitle="Standard · Renews 15 Apr 2026" pip="b">
          <div className="font-poppins text-xl font-bold text-am-primary mb-1">₹4,500 / Quarter</div>
          <div className="text-[13px] text-am-text-3 mb-3.5">M1 ALPHA Strategy</div>
          <InfoGrid
            items={[
              ["Algorithm", "M1 ALPHA"],
              ["Renewal", "15 Apr 2026"],
              ["Days Left", "51 days"],
              ["Auto-Renew", "Enabled"],
            ]}
          />
        </Panel>
        <Panel title="Quick Actions" pip="t">
          {quickActions.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 py-2.5 border-b border-am-border-faint cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-am-primary-light flex items-center justify-center text-base shrink-0">
                {a.ico}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-am-text">{a.l}</div>
                <div className="text-[13px] text-am-text-3">{a.s}</div>
              </div>
              <Icon name="chevron" size={12} className="opacity-30" />
            </div>
          ))}
        </Panel>
      </div>

      {/* Performance Trend Chart */}
      <Panel
        title="Performance Trend"
        pip="b"
        right={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart type toggle */}
            <div className="flex gap-0.5 bg-am-input-bg rounded-md p-0.5">
              {(
                [
                  ["revenue", "Revenue"],
                  ["txn", "Transactions"],
                ] as const
              ).map(([v, l]) => (
                <div
                  key={v}
                  onClick={() => setChartType(v)}
                  className={`py-1 px-2.5 rounded-[5px] text-xs font-semibold cursor-pointer transition-all ${
                    chartType === v
                      ? v === "revenue"
                        ? "bg-am-success text-white"
                        : "bg-am-primary text-white"
                      : "text-am-text-3"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
            {/* Period toggle */}
            <div className="flex gap-0.5 bg-am-input-bg rounded-md p-0.5">
              {(
                [
                  ["daily", "Daily"],
                  ["weekly", "Weekly"],
                  ["monthly", "Monthly"],
                ] as const
              ).map(([v, l]) => (
                <div
                  key={v}
                  onClick={() => setChartPeriod(v)}
                  className={`py-1 px-2.5 rounded-[5px] text-xs font-semibold cursor-pointer transition-all ${
                    chartPeriod === v ? "bg-am-secondary text-white" : "text-am-text-3"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
            <button
              onClick={() => toast.success("Chart exported as CSV")}
              className="text-xs font-semibold text-am-text-3 hover:text-am-text px-2 py-1 rounded cursor-pointer transition-colors"
            >
              Export
            </button>
          </div>
        }
      >
        <div className="relative" onMouseLeave={() => setHoverPoint(null)}>
          <svg
            width="100%"
            height="130"
            viewBox="0 0 700 130"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity=".25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[25, 50, 75, 100].map((y) => (
              <line key={y} x1="10" y1={y} x2="690" y2={y} stroke="rgba(0,147,182,.06)" strokeWidth="1" />
            ))}
            {/* Area fill */}
            <path d={areaPath} fill="url(#trendGrad)" style={{ transition: "d .4s ease" }} />
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: "d .4s ease" }}
            />
            {/* Data points + labels */}
            {pts.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverPoint === i ? 6 : 3.5}
                  fill={strokeColor}
                  stroke="var(--am-bg)"
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "r .15s" }}
                  onMouseEnter={() => setHoverPoint(i)}
                />
                <text x={p.x} y="125" textAnchor="middle" fill="var(--am-text-3)" fontSize="8" fontFamily="Inter">
                  {p.label}
                </text>
              </g>
            ))}
            {/* Tooltip on hover */}
            {hoverPoint !== null && pts[hoverPoint] && (
              <g>
                <line
                  x1={pts[hoverPoint].x}
                  y1={pts[hoverPoint].y + 6}
                  x2={pts[hoverPoint].x}
                  y2="115"
                  stroke="rgba(255,255,255,.1)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <rect
                  x={pts[hoverPoint].x - 42}
                  y={pts[hoverPoint].y - 32}
                  width="84"
                  height="24"
                  rx="6"
                  fill="var(--am-bg-surface)"
                  stroke="var(--am-border)"
                />
                <text
                  x={pts[hoverPoint].x}
                  y={pts[hoverPoint].y - 16}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="Poppins"
                >
                  {chartType === "revenue"
                    ? `₹${pts[hoverPoint].val}K`
                    : `${pts[hoverPoint].val} trades`}
                </text>
              </g>
            )}
          </svg>
        </div>
        {/* Legend */}
        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-am-border-faint">
          <div className="flex gap-3.5 text-[13px]">
            <span className="text-am-success">{"\u25CF"} Revenue</span>
            <span className="text-am-primary">{"\u25CF"} Transactions</span>
          </div>
          <div className="text-[13px] text-am-text-3">
            Hover over points for details {"·"}{" "}
            {chartPeriod === "monthly" ? "Last 12 months" : chartPeriod === "weekly" ? "Last 8 weeks" : "Last 7 days"}
          </div>
        </div>
      </Panel>
    </div>
  );
}
