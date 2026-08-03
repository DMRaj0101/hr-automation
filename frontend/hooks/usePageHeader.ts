// hooks/usePageHeader.ts
"use client";

import { usePathname } from "next/navigation";
import { createElement } from "react";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Ticket,
  Activity,
  MessageSquare,
} from "lucide-react";

const PAGE_HEADERS = [
  {
    href: "/dashboard",
    title: "Dashboard",
    subtitle: "Overview of your workspace",
    icon: LayoutDashboard,
  },
  {
    href: "/employee-directory",
    title: "Employee directory",
    subtitle: "Browse every employee in the onboarding pipeline",
    icon: Users,
  },
  {
    href: "/employee/",
    title: "Employee profile",
    subtitle: "View employee details and onboarding progress",
    icon: Users,
  },
  {
    href: "/onboarding",
    title: "Onboarding tracker",
    subtitle: "Track onboarding progress across the team",
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

export function usePageHeader() {
  const pathname = usePathname();

  const match =
    PAGE_HEADERS.find((item) => pathname.startsWith(item.href)) ??
    PAGE_HEADERS[0];

  return {
    title: match.title,
    subtitle: match.subtitle,
    icon: createElement(match.icon, { size: 22 }),
  };
}