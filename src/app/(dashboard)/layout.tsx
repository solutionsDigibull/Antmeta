"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BackgroundEffects } from "@/components/layout/background-effects";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <div className="relative z-10 flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-5 md:p-6 xl:max-w-[1200px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
