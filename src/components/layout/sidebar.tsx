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
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-am-primary to-transparent opacity-70 z-10" />

        {/* Logo + close */}
        <div className="flex items-center justify-between px-[18px] pt-[14px] pb-3 border-b border-am-border-faint relative">
          <Image src="/am_logo.png" alt="AntMeta" width={160} height={44} className="h-[38px] w-auto object-contain" />
          <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-am-primary-light border border-am-border text-am-text-2 cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* User chip */}
        {user && (
          <div className="mx-3 my-2.5 px-2.5 py-2 rounded-[10px] bg-[rgba(0,147,182,.07)] border border-am-border flex items-center gap-2.5">
            <UserAvatar name={user.name} size={28} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-am-text truncate">{user.name}</div>
              <div className="text-[13px] text-am-primary mt-px">{user.role}</div>
            </div>
            <div className="w-[7px] h-[7px] rounded-full bg-am-success shrink-0" />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-1.5 pb-4">
          {navConfig.map((item) => (
            <div key={item.id}>
              {item.sec && (
                <div className="font-poppins text-[12px] font-bold tracking-[2.5px] uppercase text-am-text-3 px-4 pt-3 pb-1.5 select-none">{item.sec}</div>
              )}

              {item.sub ? (
                <>
                  <div className="mx-1.5 my-px relative">
                    {isActive(item) && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[56%] bg-am-primary rounded-r-[3px]" />
                    )}
                    <button
                      onClick={() => toggleNavItem(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-[9px] text-sm transition-all cursor-pointer border ${
                        isActive(item)
                          ? "text-am-text font-semibold border-[rgba(0,147,182,.22)]"
                          : "text-am-text-2 font-medium hover:bg-am-bg-card hover:text-am-text border-transparent"
                      }`}
                      style={isActive(item) ? { background: "linear-gradient(135deg,rgba(0,147,182,.18),rgba(0,150,136,.08))" } : undefined}
                    >
                      <Icon name={item.ico} size={16} className={isActive(item) ? "text-am-primary" : "text-am-text-3"} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[13px] font-bold px-[7px] py-0.5 rounded-lg ${item.bt === "bad" ? "bg-am-danger-light text-am-danger" : "bg-am-gold-light text-am-gold"}`}>
                          {item.badge}
                        </span>
                      )}
                      <Icon name="chevron" size={12} className={`text-am-text-3 transition-transform ${openNavItems[item.id] ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                  {openNavItems[item.id] && (
                    <div className="pl-[30px] py-0.5 space-y-px">
                      {item.sub.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleNav(sub.id)}
                          className={`w-full flex items-center gap-1.5 px-2.5 py-2 mr-1.5 rounded-[7px] text-[14px] transition-all cursor-pointer ${
                            pathname === getHref(sub.id) ? "text-am-primary font-semibold bg-[rgba(0,147,182,.07)]" : "text-am-text-2 hover:text-am-text"
                          }`}
                        >
                          <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${pathname === getHref(sub.id) ? "bg-am-primary" : "bg-am-text-3 opacity-40"}`} />
                          <span className="flex-1 text-left">{sub.label}</span>
                          {sub.badge && (
                            <span className={`text-[13px] font-bold px-[7px] py-0.5 rounded-lg ${sub.bt === "warn" ? "bg-am-gold-light text-am-gold" : "bg-am-primary-light text-am-primary"}`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="mx-1.5 my-px relative">
                  {isActive(item) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[56%] bg-am-primary rounded-r-[3px]" />
                  )}
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-[9px] text-sm transition-all cursor-pointer border ${
                      isActive(item)
                        ? "text-am-text font-semibold border-[rgba(0,147,182,.22)]"
                        : "text-am-text-2 font-medium hover:bg-am-bg-card hover:text-am-text border-transparent"
                    }`}
                    style={isActive(item) ? { background: "linear-gradient(135deg,rgba(0,147,182,.18),rgba(0,150,136,.08))" } : undefined}
                  >
                    <Icon name={item.ico} size={16} className={isActive(item) ? "text-am-primary" : "text-am-text-3"} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[13px] font-bold px-[7px] py-0.5 rounded-lg ${item.bt === "bad" ? "bg-am-danger-light text-am-danger" : "bg-am-gold-light text-am-gold"}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3.5 py-2.5 border-t border-am-border-faint flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-am-text">
            <div className="w-[7px] h-[7px] rounded-full bg-am-success shrink-0" />
            <span>Online</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-am-text cursor-pointer px-2.5 py-1.5 rounded-md hover:bg-am-bg-card border-none bg-transparent"
          >
            <Icon name="logout" size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
