"use client";

const colors: Record<string, string> = {
  b: "bg-am-primary",
  t: "bg-am-accent",
  ok: "bg-am-success",
  wa: "bg-am-gold",
  r: "bg-am-danger",
};

interface ProgressBarProps {
  width: string;
  color?: string;
}

export function ProgressBar({ width, color = "b" }: ProgressBarProps) {
  return (
    <div className="bg-white/5 rounded-sm h-1.5 overflow-hidden my-1">
      <div className={`h-full rounded-sm transition-all duration-1000 ${colors[color]}`} style={{ width }} />
    </div>
  );
}
