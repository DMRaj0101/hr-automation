"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Ticket,
  Activity,
  MessageSquare,
  PanelLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "directory", label: "Employee Directory", href: "/employee-directory", icon: Users },
  { key: "tracker", label: "Onboarding Tracker", href: "/onboarding", icon: ListChecks },
  { key: "tickets", label: "Ticket Queue", href: "/tickets", icon: Ticket },
  { key: "monitoring", label: "Monitoring Agent", href: "/monitoring-agent", icon: Activity },
  { key: "chat", label: "Knowledge Agent Chat", href: "/knowledge-agent", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/employee-directory") {
      return pathname.startsWith("/employee-directory") || pathname.startsWith("/employee/");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col bg-vantara-navy py-6 transition-all duration-300 ease-in-out",
        collapsed ? "w-20 px-3" : "w-64 px-4"
      )}
    >
      {/* Top row: logo + collapse toggle button */}
      <div
        className={cn(
          "mb-8 flex items-center px-2",
          collapsed ? "flex-col gap-4 justify-center" : "justify-between"
        )}
      >
        {!collapsed && <Logo light />}

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={cn(
            "flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-white/10",
            collapsed
              ? "text-vantara-gold"
              : "text-white/60 hover:text-white"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={collapsed ? 22 : 18} />
        </button>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col",
          collapsed ? "items-center gap-3" : "gap-1"
        )}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                collapsed
                  ? "h-11 w-11 justify-center rounded-xl"
                  : "rounded-lg px-3 py-2.5",
                active && "bg-white/10 text-vantara-gold"
              )}
            >
              <Icon size={collapsed ? 22 : 18} className="shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-vantara-navy px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}