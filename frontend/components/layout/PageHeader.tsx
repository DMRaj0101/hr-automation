// lib/pageHeaders.ts
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Ticket,
  Activity,
  MessageSquare,
} from "lucide-react";
import { createElement } from "react";

export const PAGE_HEADERS = [
  {
    href: "/dashboard",
    title: "Dashboard",
    subtitle: "Overview of your workspace",
    icon: LayoutDashboard,
  },
  {
    href: "/employee-directory",
    title: "Employee directory",
    subtitle: "Manage employee information throughout the employee lifecycle.",
    icon: Users,
  },
  {
    href: "/onboarding/",
    title: "Employee Onboarding Details",
    subtitle: "View individual onboarding progress, tasks, dependencies, and active blockers.",
    icon: ListChecks,
  },
  {
    href: "/onboarding",
    title: "Onboarding tracker",
    subtitle: "Track onboarding progress, status, and blockers across all new hires",
    icon: ListChecks,
  },
  {
    href: "/tickets",
    title: "Ticket queue",
    subtitle: "Manage and resolve open tickets",
    icon: Ticket,
  },
  {
    href: "/monitoring-agent",
    title: "Monitoring agent",
    subtitle: "Live system and agent activity",
    icon: Activity,
  },
  {
    href: "/knowledge-agent",
    title: "Knowledge agent chat",
    subtitle: "Ask questions and get instant answers",
    icon: MessageSquare,
  },
];

export function getDefaultHeader(pathname: string) {
  const match =
    PAGE_HEADERS.find((item) => {
      if (item.href === "/employee-directory") {
        return pathname.startsWith("/employee-directory") || pathname.startsWith("/employee/");
      }
      if (item.href === "/onboarding/") {
        // Detail page: /onboarding/<id> — must be checked before the
        // plain "/onboarding" tracker entry below, since that one's
        // startsWith("/onboarding") would otherwise match this route too.
        return pathname.startsWith("/onboarding/");
      }
      if (item.href === "/onboarding") {
        // Tracker list page only — exclude detail routes so this entry
        // doesn't win first just because both share the same prefix.
        return pathname === "/onboarding" || (pathname.startsWith("/onboarding") && !pathname.startsWith("/onboarding/"));
      }
      return pathname.startsWith(item.href);
    }) ?? PAGE_HEADERS[0];

  return {
    title: match.title,
    subtitle: match.subtitle,
    icon: createElement(match.icon, { size: 22 }),
  };
}