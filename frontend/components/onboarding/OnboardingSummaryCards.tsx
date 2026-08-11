import type { ReactNode } from "react";

interface Field {
  label: string;
  value: string;
  pill?: { text: string; bg: string; color: string };
}

/* =========================================================
   COLOR THEME PER FIELD
   cardBg   -> light tinted card background
   iconBg   -> solid icon box background
   iconColor-> icon stroke/fill (white on solid box)
   labelColor -> small uppercase label text
   ========================================================= */

const THEMES: Record<
  string,
  { cardBg: string; iconBg: string; iconColor: string; labelColor: string }
> = {
  Manager: {
    cardBg: "#F5F3FF",
    iconBg: "#7C3AED",
    iconColor: "#FFFFFF",
    labelColor: "#8B5CF6",
  },
  "Start Date": {
    cardBg: "#EFF6FF",
    iconBg: "#2563EB",
    iconColor: "#FFFFFF",
    labelColor: "#60A5FA",
  },
  "Planned Completion": {
    cardBg: "#ECFDF5",
    iconBg: "#16A34A",
    iconColor: "#FFFFFF",
    labelColor: "#34D399",
  },
  "Days Remaining": {
    cardBg: "#FEF2F2",
    iconBg: "#DC2626",
    iconColor: "#FFFFFF",
    labelColor: "#F87171",
  },
};

const fallbackTheme = {
  cardBg: "#F9FAFB",
  iconBg: "#6B7280",
  iconColor: "#FFFFFF",
  labelColor: "#9CA3AF",
};

const ICONS: Record<string, ReactNode> = {
  Manager: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      <path d="M17 8a4 4 0 010 6" />
    </svg>
  ),
  "Start Date": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  "Planned Completion": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  "Days Remaining": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h12M6 22h12M6 2c0 6 12 6 12 12s-12 6-12 12M18 2c0 6-12 6-12 12s12 6 12 12" />
    </svg>
  ),
};

export function OnboardingSummaryCards({ fields }: { fields: Field[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {fields.map((f) => {
        const theme = THEMES[f.label] ?? fallbackTheme;

        return (
          <div
            key={f.label}
            className="flex items-start gap-3 rounded-2xl"
            style={{
              background: theme.cardBg,
              padding: "18px 20px",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: theme.iconBg, color: theme.iconColor }}
            >
              {ICONS[f.label]}
            </div>
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.labelColor }}
              >
                {f.label}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold text-vantara-navy">{f.value}</span>
                {f.pill && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: f.pill.bg, color: f.pill.color }}
                  >
                    {f.pill.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}