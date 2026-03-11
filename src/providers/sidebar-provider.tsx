"use client";

import { createContext, useState, useCallback, ReactNode } from "react";

interface SidebarContextValue {
  openNavItems: Record<string, boolean>;
  toggleNavItem: (id: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [openNavItems, setOpenNavItems] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleNavItem = useCallback((id: string) => {
    setOpenNavItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <SidebarContext.Provider value={{ openNavItems, toggleNavItem, mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}
