"use client";

import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  ok: "bg-am-success-light text-am-success",
  warn: "bg-am-gold-light text-am-gold",
  bad: "bg-am-danger-light text-am-danger",
  blue: "bg-am-primary-light text-am-primary",
  purple: "bg-am-purple-light text-am-purple",
  teal: "bg-am-accent-light text-am-accent",
};

interface StatusBadgeProps {
  variant?: string;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant = "blue", children, className }: StatusBadgeProps) {
  return (
    <span className={cn("text-sm font-semibold py-0.5 px-2.5 rounded-md inline-block tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
}
