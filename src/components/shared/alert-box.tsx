"use client";

import { Icon } from "@/components/icons";
import { ReactNode } from "react";

const variantStyles: Record<string, { cls: string; accent: string }> = {
  w: { cls: "bg-[rgba(244,160,32,.08)] border-[rgba(244,160,32,.25)]", accent: "var(--am-gold)" },
  d: { cls: "bg-[rgba(239,68,68,.08)] border-[rgba(239,68,68,.25)]", accent: "var(--am-danger)" },
  s: { cls: "bg-[rgba(34,197,94,.08)] border-[rgba(34,197,94,.25)]", accent: "var(--am-success)" },
  i: { cls: "bg-[rgba(0,147,182,.08)] border-[rgba(0,147,182,.25)]", accent: "var(--am-primary)" },
};

const iconMap: Record<string, string> = { w: "warn", d: "close", s: "check", i: "info" };

interface AlertBoxProps {
  variant?: string;
  children: ReactNode;
}

export function AlertBox({ variant = "i", children }: AlertBoxProps) {
  const s = variantStyles[variant] || variantStyles.i;
  return (
    <div
      className={`flex items-start gap-2.5 px-[18px] py-3.5 rounded-[10px] border text-sm leading-relaxed text-am-text-2 mb-4 ${s.cls}`}
      style={{ borderTop: `3px solid ${s.accent}` }}
    >
      <Icon name={iconMap[variant]} size={15} />
      <div>{children}</div>
    </div>
  );
}
