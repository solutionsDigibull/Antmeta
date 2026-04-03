"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const pipColorValues: Record<string, string> = {
  b: "var(--am-primary)",
  t: "var(--am-accent)",
  g: "var(--am-gold)",
  p: "var(--am-purple)",
  r: "var(--am-danger)",
};

interface PanelProps {
  title: ReactNode;
  subtitle?: string;
  pip?: string;
  right?: ReactNode;
  children: ReactNode;
  topBar?: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, pip = "b", right, children, topBar, className }: PanelProps) {
  const accentColor = pipColorValues[pip] || pipColorValues.b;
  return (
    <div
      className={cn("bg-am-bg-card border border-am-border rounded-xl backdrop-blur-[10px] overflow-hidden mb-4 shadow-[0_2px_8px_rgba(0,0,0,.12)]", className)}
      style={!topBar ? { borderTop: `3px solid ${accentColor}` } : undefined}
    >
      {topBar}
      <div className="flex items-center justify-between py-4 px-5 border-b border-am-border-faint flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
          />
          <div>
            <div className="font-poppins text-xl font-bold text-am-text tracking-[-0.3px]">{title}</div>
            {subtitle && <div className="text-sm text-am-text-2 mt-0.5 font-medium">{subtitle}</div>}
          </div>
        </div>
        {right}
      </div>
      <div className="py-4 px-5">{children}</div>
    </div>
  );
}
