"use client";

interface TabSwitcherProps {
  tabs: [string, string][];
  active: string;
  onChange: (val: string) => void;
}

export function TabSwitcher({ tabs, active, onChange }: TabSwitcherProps) {
  return (
    <div className="flex gap-1 bg-black/20 border border-am-border rounded-[10px] p-1 mb-3.5">
      {tabs.map(([value, label]) => (
        <div
          key={value}
          onClick={() => onChange(value)}
          className={`flex-1 text-center py-2 px-1.5 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all ${
            active === value ? "bg-am-primary text-white" : "text-am-text-3 hover:text-am-text-2"
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
