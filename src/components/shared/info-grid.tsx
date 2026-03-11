"use client";

interface InfoGridProps {
  items: [string, string, string?][];
}

export function InfoGrid({ items }: InfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {items.map(([label, value, valueColor]) => (
        <div key={label} className="py-2.5 border-b border-am-border-faint">
          <div className="text-sm text-am-text-3 uppercase tracking-wide mb-0.5">{label}</div>
          <div className="text-sm font-medium" style={{ color: valueColor || undefined }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
