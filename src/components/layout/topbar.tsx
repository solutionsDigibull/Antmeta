"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useClock } from "@/hooks/use-clock";
import { useNotifications } from "@/hooks/use-notifications";
import { Icon } from "@/components/icons";
import { TITLES } from "@/lib/constants/screen-titles";

export function Topbar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const pathname = usePathname();
  useAuth();
  const { setMobileMenuOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const clock = useClock();
  const { unreadCount } = useNotifications();

  const title = TITLES[pathname] || "Dashboard";
  const portal = pathname.startsWith("/admin") ? "Admin Panel" : "Client Portal";

  return (
    <header className="h-16 bg-am-topbar-bg backdrop-blur-md border-b border-am-border-faint flex items-center px-5 gap-4 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button className="md:hidden text-am-text-2 cursor-pointer" onClick={() => setMobileMenuOpen(true)}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title + breadcrumb */}
      <div className="flex-1 min-w-0">
        <div className="font-poppins text-base font-semibold text-am-text truncate">{title}</div>
        <div className="hidden sm:block text-xs text-am-text-3 truncate">traders.antmeta.ai / {portal} / {title}</div>
      </div>

      {/* Search */}
      <div className="hidden lg:flex items-center relative">
        <div className="absolute left-3 text-am-text-3">
          <Icon name="search" size={13} />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-[220px] bg-am-input-bg border border-am-border rounded-lg pl-9 pr-3 py-2 text-sm text-am-text placeholder:text-am-text-3 outline-none"
        />
      </div>

      {/* Bell */}
      <button className="relative text-am-text-2 hover:text-am-text cursor-pointer">
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-am-danger border-2 border-am-bg-surface" />
        )}
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="text-am-text-2 hover:text-am-text cursor-pointer text-lg"
      >
        {mounted ? (theme === "dark" ? "☀️" : "🌙") : null}
      </button>

      {/* Clock */}
      <div className="hidden sm:block font-mono text-sm text-am-text-3 whitespace-nowrap">{clock}</div>
    </header>
  );
}
