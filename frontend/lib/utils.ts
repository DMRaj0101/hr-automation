import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

export const statusColorMap: Record<string, { bg: string; text: string }> = {
  Onboarding: { bg: "#FEF3C7", text: "#92400E" },
  "In Progress": { bg: "#FEF3C7", text: "#92400E" },
  Pending: { bg: "#FEF3C7", text: "#92400E" },
  Degraded: { bg: "#FEF3C7", text: "#92400E" },
  "Documents Pending": { bg: "#FEE2E2", text: "#991B1B" },
  Failed: { bg: "#FEE2E2", text: "#991B1B" },
  Down: { bg: "#FEE2E2", text: "#991B1B" },
  Completed: { bg: "#DCFCE7", text: "#166534" },
  Closed: { bg: "#DCFCE7", text: "#166534" },
  Operational: { bg: "#DCFCE7", text: "#166534" },
  Open: { bg: "#DBEAFE", text: "#1D4ED8" },
};

export function statusStyle(status: string) {
  return statusColorMap[status] ?? { bg: "#F3F4F6", text: "#6B7280" };
}

export const priorityColorMap: Record<string, { bg: string; text: string }> = {
  Critical: { bg: "#FEE2E2", text: "#991B1B" },
  High: { bg: "#FEF3C7", text: "#92400E" },
  Medium: { bg: "#DBEAFE", text: "#1D4ED8" },
};

export function priorityStyle(priority: string) {
  return priorityColorMap[priority] ?? { bg: "#F3F4F6", text: "#6B7280" };
}

export const employeeTypeColorMap: Record<string, { bg: string; text: string }> = {
  experienced: { bg: "#EDE9FE", text: "#6D28D9" },
  fresher: { bg: "#F3F4F6", text: "#6B7280" },
};

export function employeeTypeStyle(type: string) {
  return employeeTypeColorMap[type] ?? { bg: "#F3F4F6", text: "#6B7280" };
}
