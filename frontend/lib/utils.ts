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

// solid light badge colors matching the employee directory design
export const statusColorMap: Record<string, { bg: string; text: string }> = {
  Onboarding: { bg: "#FEF3C7", text: "#B45309" },
  "In Progress": { bg: "#FEF3C7", text: "#B45309" },
  Processing: { bg: "#FEF3C7", text: "#B45309" },
  New: { bg: "#FEF3C7", text: "#B45309" },
  Degraded: { bg: "#FEF3C7", text: "#B45309" },
  Pending: { bg: "#F3F4F6", text: "#6B7280" },
  "Documents Pending": { bg: "#FEE2E2", text: "#DC2626" },
  "IT Pending": { bg: "#DBEAFE", text: "#2563EB" },
  Failed: { bg: "#FEE2E2", text: "#DC2626" },
  Down: { bg: "#FEE2E2", text: "#DC2626" },
  Active: { bg: "#DCFCE7", text: "#22C55E" },
  Completed: { bg: "#D1FAE5", text: "#059669" },
  Closed: { bg: "#D1FAE5", text: "#059669" },
  Operational: { bg: "#D1FAE5", text: "#059669" },
  Open: { bg: "#FCE7F3", text: "#DB2777" },
};

export function statusStyle(status: string) {
  return statusColorMap[status] ?? { bg: "#F3F4F6", text: "#6B7280" };
}

export const priorityColorMap: Record<string, { bg: string; text: string }> = {
  Critical: { bg: "#FEE2E2", text: "#DC2626" },
  High: { bg: "#FEF3C7", text: "#B45309" },
  Medium: { bg: "#F3F4F6", text: "#6B7280" },
};

export function priorityStyle(priority: string) {
  return priorityColorMap[priority] ?? { bg: "#F3F4F6", text: "#6B7280" };
}

// solid light badge colors for the employee directory table (matches white card design)
export const employeeTypeColorMap: Record<string, { bg: string; text: string }> = {
  experienced: { bg: "#EDE9FE", text: "#7C3AED" },
  fresher: { bg: "#F3F4F6", text: "#6B7280" },
};

export function employeeTypeStyle(type: string) {
  const styles: Record<string, { bg: string; text: string }> = {
    senior: { bg: "#EDE9FE", text: "#6D28D9" },  // light purple
    mid:    { bg: "#DBEAFE", text: "#1D4ED8" },  // light blue
    lead:   { bg: "#FCE7F3", text: "#BE185D" },  // light pink
    junior: { bg: "#D1FAE5", text: "#047857" },  // light green
  };
   const key = type?.toLowerCase();
  return styles[key] ?? { bg: "#F1F5F9", text: "#475569" }; // fallback gray
}

export function employeeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    senior: "Senior",
    mid: "Mid",
    lead: "Lead",
    junior: "Junior",
  };
  return labels[type?.toLowerCase()] ?? type;
}