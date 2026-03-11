"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const pipColors: Record<string, string> = {
  b: "bg-am-primary shadow-[0_0_6px_var(--am-primary)]",
  t: "bg-am-accent shadow-[0_0_6px_var(--am-accent)]",
  g: "bg-am-gold shadow-[0_0_6px_var(--am-gold)]",
  p: "bg-am-purple shadow-[0_0_6px_var(--am-purple)]",
  r: "bg-am-danger shadow-[0_0_6px_var(--am-danger)]",
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
  return (
    <div className={cn("bg-am-bg-card border border-am-border rounded-xl backdrop-blur-[10px] overflow-hidden mb-4", className)}>
      {topBar}
      <div className="flex items-center justify-between p-3.5 px-5 border-b border-am-border-faint flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-2 h-2 rounded-full", pipColors[pip])} />
          <div>
            <div className="font-poppins text-lg font-semibold text-am-text">{title}</div>
            {subtitle && <div className="text-sm text-am-text-3 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        {right}
      </div>
      <div className="p-4 px-5">{children}</div>
    </div>
  );
}
