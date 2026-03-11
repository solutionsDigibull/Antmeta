"use client";

import { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
      {children}
    </div>
  );
}

export function FilterSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="bg-am-input-bg border border-am-border rounded-lg px-3.5 py-2 font-sans text-sm text-am-text-2 outline-none" {...props}>
      {children}
    </select>
  );
}

export function FilterRight({ children }: { children: ReactNode }) {
  return (
    <div className="ml-auto flex gap-2 flex-wrap">
      {children}
    </div>
  );
}
