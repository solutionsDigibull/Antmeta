"use client";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  value: string;
  label: string;
  sub?: string;
  color?: string;
  className?: string;
}

export function KpiCard({ value, label, sub, color, className }: KpiCardProps) {
  return (
    <div className={cn("bg-am-bg-card border border-am-border rounded-xl p-4 backdrop-blur-[10px]", className)}>
      <div className="font-poppins text-[32px] font-bold leading-tight mb-1" style={{ color: color || undefined }}>
        {value}
      </div>
      <div className="text-sm text-am-text-2 font-medium">{label}</div>
      {sub && (
        <div className="text-sm text-am-text-3 mt-2 pt-2 border-t border-am-border-faint">
          {sub}
        </div>
      )}
    </div>
  );
}
