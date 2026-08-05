"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/store/authStore";
import { NAV_ITEMS, NAV_GROUP_ORDER, isNavItemActive, type NavItem } from "@/lib/nav-items";
import {
  PanelLeft,
  LayoutDashboard,
  Users,
  UserPlus,
  Ticket,
  Activity,
  MessageSquareText,
  Circle,
} from "lucide-react";
import { useNavProgressStore } from "@/store/navProgressStore";

// Icon mapping — keyed by nav item label. Add new items here as they're added to NAV_ITEMS.
const NAV_ICON_MAP: Record<string, React.ElementType> = {
  "Dashboard": LayoutDashboard,
  "Employee Directory": Users,
  "Onboarding Tracker": UserPlus,
  "Ticket Queue": Ticket,
  "Monitoring Agent": Activity,
  "Knowledge Agent Chat": MessageSquareText,
};

function getNavIcon(label: string): React.ElementType {
  return NAV_ICON_MAP[label] ?? Circle;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const start = useNavProgressStore((s) => s.start);

  const groupedItems = useMemo(() => {
    return NAV_GROUP_ORDER.map((group) => ({
      group,
      items: NAV_ITEMS.filter((item) => item.group === group),
    })).filter((section) => section.items.length > 0);
  }, []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 252 }}
      transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
      className={cn("flex h-screen shrink-0 flex-col bg-vantara-navy py-6", collapsed ? "px-3" : "px-4")}
    >
      {/* Top row: logo + collapse toggle */}
      <div
        className={cn(
          "mb-5 flex items-center",
          collapsed ? "flex-col gap-4 justify-center px-2" : "justify-between gap-2 pl-0 pr-1"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!collapsed && (
            <motion.div
  key="logo"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.12 }}
  className="-ml-1.5 min-w-0 flex-1 overflow-hidden"
>
  <Logo light />
</motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md p-1.5",
            collapsed ? "text-vantara-gold" : "text-white/60"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={collapsed ? 20 : 16} />
        </motion.button>
      </div>

      {/* Divider between logo header and nav */}
      <div className="mb-5 h-px w-full shrink-0 bg-gradient-to-r from-transparent via-vantara-gold/60 to-transparent" />

      {/* Nav sections — scrollbar hidden across browsers */}
      <nav
        className={cn(
          "flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {groupedItems.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-2">
            {/* Section label */}
            <AnimatePresence mode="wait" initial={false}>
              {!collapsed ? (
                <motion.div
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-2 px-2"
                >
                  <span className="h-3 w-[3px] shrink-0 rounded-full bg-vantara-gold" />
                  <span className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.15em] text-vantara-gold/90">
                    {group}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-vantara-gold/50 to-transparent" />
                </motion.div>
              ) : (
                <div className="mx-auto h-px w-6 bg-vantara-gold/40" />
              )}
            </AnimatePresence>

            {/* Items — no group card background, each row styled on its own */}
            <div className={cn("relative flex flex-col", collapsed ? "items-center gap-3" : "gap-0.5")}>
              {items.map((item: NavItem) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = getNavIcon(item.label);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      if (!active) start();
                    }}
                    className={cn(
                      "group relative flex items-center gap-2.5 text-xs font-medium transition-colors",
                      collapsed ? "h-9 w-9 justify-center rounded-xl" : "rounded-xl px-2 py-2",
                      active ? "text-white" : "text-white/70 hover:text-white"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-xl bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        transition={{ type: "spring", stiffness: 180, damping: 26 }}
                      >
                        {!collapsed && (
                          <span className="absolute -left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-vantara-gold" />
                        )}
                      </motion.span>
                    )}
                    {!active && (
                      <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/5" />
                    )}

                    {/* Icon badge — active badge gets a gold glow */}
                    <span
                      className={cn(
                        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all",
                        active
                          ? "bg-gradient-to-br from-[#F1C878] via-vantara-gold to-[#B8823A] text-vantara-navy shadow-[0_0_0_1px_rgba(217,166,83,0.4),0_4px_14px_rgba(217,166,83,0.55)]"
                          : "bg-white/10 text-white/60 group-hover:bg-white/15"
                      )}
                    >
                      <Icon size={15} strokeWidth={2.25} />
                    </span>

                    {!collapsed && (
                      <span className={cn("relative whitespace-nowrap", active && "font-semibold")}>
                        {item.label}
                      </span>
                    )}

                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-vantara-navy px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section at bottom — plain, no hover animation, reduced height */}
      <div
        className={cn(
          "mt-1 flex items-center gap-3 rounded-lg border-t border-white/10 pt-2.5",
          collapsed ? "justify-center px-0" : "px-2"
        )}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vantara-gold text-[10px] font-medium text-vantara-navy">
          {(user?.name ?? "HR").slice(0, 2).toUpperCase()}
        </div>
        {!collapsed && (
          <span className="whitespace-nowrap text-xs font-medium text-white">{user?.name ?? "HR Admin"}</span>
        )}
      </div>
    </motion.aside>
  );
}