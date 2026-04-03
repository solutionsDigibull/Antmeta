"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  value: string;
  label: string;
  sub?: ReactNode;
  color?: string;
  accent?: string;
  className?: string;
}

export function KpiCard({ value, label, sub, color, accent, className }: KpiCardProps) {
  const accentColor = accent || color || "var(--am-primary)";
  return (
    <div
      className={cn("bg-am-bg-card border border-am-border rounded-xl py-[18px] px-5 backdrop-blur-[10px] shadow-[0_2px_8px_rgba(0,0,0,.12)]", className)}
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      <div
        className="font-poppins text-[34px] font-extrabold leading-tight mb-1.5 tracking-[-0.5px]"
        style={{ color: color || undefined }}
      >
        {value}
      </div>
      <div className="text-[15px] text-am-text-2 font-semibold">{label}</div>
      {sub && (
        <div className="text-sm text-am-text-3 mt-2.5 pt-2.5 border-t border-am-border-faint">
          {sub}
        </div>
      )}
    </div>
  );
}
