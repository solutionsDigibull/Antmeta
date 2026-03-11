"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { BackgroundEffects } from "@/components/layout/background-effects";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <BackgroundEffects />
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-lg border border-am-border flex items-center justify-center bg-am-bg-card backdrop-blur-md text-lg cursor-pointer hover:border-am-primary transition-colors"
      >
        {mounted ? (theme === "dark" ? "☀️" : "🌙") : null}
      </button>
      <div className="relative z-10 w-full max-w-[440px]">
        {children}
      </div>
    </div>
  );
}
