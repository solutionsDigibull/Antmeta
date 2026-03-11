"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="text-sm font-semibold tracking-wider uppercase text-am-text-3 text-left px-3.5 pb-2.5 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface TdProps {
  children: ReactNode;
  bold?: boolean;
  color?: string;
  className?: string;
}

export function Td({ children, bold, color, className }: TdProps) {
  return (
    <td
      className={cn(
        "text-sm px-3.5 py-2.5 border-t border-am-border-faint",
        bold ? "font-bold text-am-text" : "text-am-text-2",
        className
      )}
      style={color ? { color } : undefined}
    >
      {children}
    </td>
  );
}
