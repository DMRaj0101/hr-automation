"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { useAuthStore } from "@/store/authStore";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav-items";
import { PanelLeft } from "lucide-react";
import { useNavProgressStore } from "@/store/navProgressStore";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const start = useNavProgressStore((s) => s.start);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
      className={cn("flex h-screen shrink-0 flex-col bg-vantara-navy py-6", collapsed ? "px-3" : "px-4")}
    >
      {/* Top row: logo + collapse toggle */}
      <div className={cn("mb-8 flex items-center px-2", collapsed ? "flex-col gap-4 justify-center" : "justify-between")}>
        <AnimatePresence mode="wait" initial={false}>
          {!collapsed && (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
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
            "flex items-center justify-center rounded-md p-1.5",
            collapsed ? "text-vantara-gold" : "text-white/60"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={collapsed ? 22 : 18} />
        </motion.button>
      </div>

      {/* Nav items with shared spring-glide active pill */}
      <nav className={cn("relative flex flex-1 flex-col", collapsed ? "items-center gap-3" : "gap-1")}>
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => {
                if (!active) start();
              }}
              className={cn(
                "group relative flex items-center gap-3 text-sm font-medium transition-colors",
                collapsed ? "h-11 w-11 justify-center rounded-xl" : "rounded-lg px-3 py-2.5",
                active ? "text-vantara-gold" : "text-white/70 hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className={cn("absolute inset-0 bg-white/10", collapsed ? "rounded-xl" : "rounded-lg")}
                  transition={{ type: "spring", stiffness: 180, damping: 26 }}
                />
              )}
              {!active && (
                <span className="absolute inset-0 rounded-lg bg-white/0 transition-colors group-hover:bg-white/10" />
              )}

              <Icon size={collapsed ? 22 : 18} className="relative shrink-0" />
              {!collapsed && <span className="relative whitespace-nowrap">{item.label}</span>}

              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-vantara-navy px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <motion.div
        whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        className={cn(
          "mt-2 flex cursor-pointer items-center gap-3 rounded-lg border-t border-white/10 pt-4",
          collapsed ? "justify-center px-0" : "px-2"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vantara-gold text-xs font-medium text-vantara-navy">
          {(user?.name ?? "HR").slice(0, 2).toUpperCase()}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="whitespace-nowrap text-xs text-white"
            >
              {user?.name ?? "HR Admin"}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.aside>
  );
}