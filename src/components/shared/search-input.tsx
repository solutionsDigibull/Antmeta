"use client";

import { Icon } from "@/components/icons";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = "Search...", value, onChange, className }: SearchInputProps) {
  return (
    <div className={`relative ${className || ""}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-am-text-3">
        <Icon name="search" size={14} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-am-input-bg border border-am-border rounded-lg pl-9 pr-3 py-2 text-sm text-am-text placeholder:text-am-text-3 outline-none"
      />
    </div>
  );
}
