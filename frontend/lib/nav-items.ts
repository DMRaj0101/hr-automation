import {
  LayoutDashboard,
  Users,
  ListChecks,
  Ticket,
  Activity,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

// Single source of truth for sidebar order AND page-transition direction.
// Add/remove/reorder pages here only — Sidebar.tsx and AppShell.tsx both read this.
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "directory", label: "Employee Directory", href: "/employee-directory", icon: Users },
  { key: "tracker", label: "Onboarding Tracker", href: "/onboarding", icon: ListChecks },
  { key: "tickets", label: "Ticket Queue", href: "/tickets", icon: Ticket },
  { key: "monitoring", label: "Monitoring Agent", href: "/monitoring-agent", icon: Activity },
  { key: "chat", label: "Knowledge Agent Chat", href: "/knowledge-agent", icon: MessageSquare },
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/employee-directory") {
    return pathname.startsWith("/employee-directory") || pathname.startsWith("/employee/");
  }
  return pathname.startsWith(href);
}