"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Icon } from "@/components/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ADMIN_NAV, CLIENT_NAV } from "@/lib/data/navigation";
import { NavItem } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openNavItems, toggleNavItem, mobileMenuOpen, setMobileMenuOpen } = useSidebar();

  const isAdmin = pathname.startsWith("/admin");
  const navConfig = isAdmin ? ADMIN_NAV : CLIENT_NAV;

  const getHref = (id: string) => {
    if (isAdmin) {
      const map: Record<string, string> = {
        dashboard: "/admin/dashboard",
        "client-directory": "/admin/clients",
        "kyc-verification": "/admin/kyc-verification",
        partners: "/admin/partners",
        "exchange-setup": "/admin/exchange-setup",
        "copy-trading": "/admin/copy-trading",
        "plan-management": "/admin/plan-management",
        "billing-cycles": "/admin/billing-cycles",
        invoicing: "/admin/invoicing",
        "txn-logs": "/admin/transaction-logs",
        "pnl-analytics": "/admin/pnl-analytics",
        "perf-metrics": "/admin/performance-metrics",
        "partner-perf": "/admin/partner-performance",
        tickets: "/admin/tickets",
        "live-chat": "/admin/live-chat",
        "help-center": "/admin/help-center",
        "user-guidelines": "/admin/user-guidelines",
        faqs: "/admin/faqs",
        "user-roles": "/admin/user-roles",
        "admin-security": "/admin/admin-security",
        "audit-logs": "/admin/audit-logs",
        "notif-templates": "/admin/notification-templates",
      };
      return map[id] || "/admin/dashboard";
    } else {
      const map: Record<string, string> = {
        dashboard: "/client/dashboard",
        "my-profile": "/client/profile",
        "exchange-setup-c": "/client/exchange-setup",
        subscription: "/client/subscription",
        "pnl-client": "/client/pnl-analytics",
        "invoices-client": "/client/invoices",
        "support-client": "/client/support",
        "become-partner": "/client/become-partner",
      };
      return map[id] || "/client/dashboard";
    }
  };

  const isActive = (item: NavItem): boolean => {
    const href = getHref(item.id);
    if (pathname === href) return true;
    if (item.sub) return item.sub.some(s => pathname === getHref(s.id));
    return false;
  };

  const handleNav = (id: string) => {
    router.push(getHref(id));
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`fixed md:static z-50 h-screen w-[280px] lg:w-[280px] md:w-[240px] flex flex-col bg-am-bg-surface border-r border-am-border transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Top accent line */}
        <div className="h-[1px] bg-gradient-to-r from-am-primary via-am-accent to-am-primary" />

        {/* Logo + close */}
        <div className="flex items-center justify-center px-5 py-4 relative">
          <Image src="/am_logo.png" alt="AntMeta" width={220} height={60} className="h-16 w-auto" />
          <button className="md:hidden text-am-text-3 cursor-pointer absolute right-5" onClick={() => setMobileMenuOpen(false)}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* User chip */}
        {user && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-am-bg-card border border-am-border-faint flex items-center gap-3">
            <UserAvatar name={user.name} size={34} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-am-text truncate">{user.name}</div>
              <div className="text-xs text-am-text-3">{user.role}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-am-success shrink-0" />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navConfig.map((item, i) => (
            <div key={item.id}>
              {item.sec && (
                <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-am-text-3 px-3 pt-5 pb-2">{item.sec}</div>
              )}

              {item.sub ? (
                <>
                  <button
                    onClick={() => toggleNavItem(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      isActive(item) ? "bg-am-primary-light text-am-primary border border-am-primary/20" : "text-am-text-2 hover:bg-am-bg-card hover:text-am-text border border-transparent"
                    }`}
                  >
                    <Icon name={item.ico} size={16} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.bt === "bad" ? "bg-am-danger-light text-am-danger" : "bg-am-gold-light text-am-gold"}`}>
                        {item.badge}
                      </span>
                    )}
                    <Icon name="chevron" size={12} className={`transition-transform ${openNavItems[item.id] ? "rotate-90" : ""}`} />
                  </button>
                  {openNavItems[item.id] && (
                    <div className="ml-7 mt-1 space-y-0.5">
                      {item.sub.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleNav(sub.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all cursor-pointer ${
                            pathname === getHref(sub.id) ? "text-am-primary font-semibold bg-am-primary-light" : "text-am-text-3 hover:text-am-text-2"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${pathname === getHref(sub.id) ? "bg-am-primary" : "bg-am-text-3"}`} />
                          <span className="flex-1 text-left">{sub.label}</span>
                          {sub.badge && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${sub.bt === "bad" ? "bg-am-danger-light text-am-danger" : sub.bt === "warn" ? "bg-am-gold-light text-am-gold" : "bg-am-primary-light text-am-primary"}`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive(item) ? "bg-am-primary-light text-am-primary border border-am-primary/20" : "text-am-text-2 hover:bg-am-bg-card hover:text-am-text border border-transparent"
                  }`}
                >
                  <Icon name={item.ico} size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.bt === "bad" ? "bg-am-danger-light text-am-danger" : "bg-am-gold-light text-am-gold"}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-am-border-faint space-y-2">
          <div className="flex items-center gap-2 text-xs text-am-text-3">
            <div className="w-2 h-2 rounded-full bg-am-success" />
            <span>Online</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-am-danger/30 text-sm text-am-danger hover:bg-am-danger-light cursor-pointer"
          >
            <Icon name="logout" size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
