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

// Fixed, visually-distinct palette for icon tiles (onboarding checklist
// cards, dashboard system cards) that are keyed by an open-ended set of
// names -- provisioning items vary per department
// (config_data/provisioning_matrix.json's "item" text differs by dept
// even for the same conceptual step) and dashboard mock agents vary with
// whatever's actually in the DB, so a plain lookup-table-with-one-shared-
// fallback would collapse most of them onto the same gray icon. A simple
// string hash instead spreads any name across this palette -- same name
// always lands on the same color (stable across renders/reloads), and
// different names are very likely to land on different colors.
const iconPalette: { bg: string; color: string }[] = [
  { bg: "#DBEAFE", color: "#2563EB" }, // blue
  { bg: "#EDE9FE", color: "#7C3AED" }, // purple
  { bg: "#DCFCE7", color: "#16A34A" }, // green
  { bg: "#FEF3C7", color: "#B45309" }, // amber
  { bg: "#FFEDD5", color: "#C2410C" }, // orange
  { bg: "#E0E7FF", color: "#4338CA" }, // indigo
  { bg: "#CCFBF1", color: "#0F766E" }, // teal
  { bg: "#FFE4E6", color: "#BE123C" }, // rose
  { bg: "#FCE7F3", color: "#BE185D" }, // pink
  { bg: "#CFFAFE", color: "#0E7490" }, // cyan
  { bg: "#F3E8FF", color: "#7E22CE" }, // violet
  { bg: "#ECFCCB", color: "#4D7C0F" }, // lime
];

export function iconColorFor(key: string): { bg: string; color: string } {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return iconPalette[Math.abs(hash) % iconPalette.length];
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