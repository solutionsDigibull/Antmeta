"use client";

import { Icon } from "@/components/icons";
import { ReactNode } from "react";

const variantStyles: Record<string, string> = {
  w: "bg-[rgba(244,160,32,.08)] border-[rgba(244,160,32,.25)]",
  d: "bg-[rgba(239,68,68,.08)] border-[rgba(239,68,68,.25)]",
  s: "bg-[rgba(34,197,94,.08)] border-[rgba(34,197,94,.25)]",
  i: "bg-[rgba(0,147,182,.08)] border-[rgba(0,147,182,.25)]",
};

const iconMap: Record<string, string> = { w: "warn", d: "close", s: "check", i: "info" };

interface AlertBoxProps {
  variant?: string;
  children: ReactNode;
}

export function AlertBox({ variant = "i", children }: AlertBoxProps) {
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm leading-relaxed text-am-text-2 mb-3.5 ${variantStyles[variant]}`}>
      <Icon name={iconMap[variant]} size={15} />
      <div>{children}</div>
    </div>
  );
}
