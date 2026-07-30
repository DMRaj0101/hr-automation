"use client";

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

  const isActive = (href: string) => {
    if (href === "/employee-directory") {
      return pathname.startsWith("/employee-directory") || pathname.startsWith("/employee/");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-vantara-navy px-4 py-6">
      <div className="mb-8 px-2">
        <Logo light />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                active && "bg-white/10 text-vantara-gold"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
