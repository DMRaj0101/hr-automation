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
  /** Sidebar section heading this item is grouped under */
  group: "Overview" | "People" | "Operations";
}

// Single source of truth for sidebar order AND page-transition direction.
// Add/remove/reorder pages here only — Sidebar.tsx and AppShell.tsx both read this.
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { key: "directory", label: "Employee Directory", href: "/employee-directory", icon: Users, group: "People" },
  { key: "tracker", label: "Onboarding Tracker", href: "/onboarding", icon: ListChecks, group: "People" },
  { key: "tickets", label: "Ticket Queue", href: "/tickets", icon: Ticket, group: "Operations" },
  { key: "monitoring", label: "Monitoring Agent", href: "/monitoring-agent", icon: Activity, group: "Operations" },
  { key: "chat", label: "Knowledge Agent Chat", href: "/knowledge-agent", icon: MessageSquare, group: "Operations" },
];

// Sidebar renders groups in this order.
export const NAV_GROUP_ORDER: NavItem["group"][] = ["Overview", "People", "Operations"];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/employee-directory") {
    return pathname.startsWith("/employee-directory") || pathname.startsWith("/employee/");
  }
  return pathname.startsWith(href);
}

// "Employee Directory" -> "ED", "Dashboard" -> "D", "Knowledge Agent Chat" -> "KA"
export function getNavBadge(label: string): string {
  return label
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}