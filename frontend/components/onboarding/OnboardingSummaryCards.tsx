import type { ReactNode } from "react";

interface Field {
  label: string;
  value: string;
  pill?: { text: string; bg: string; color: string };
}

const ICONS: Record<string, ReactNode> = {
  Manager: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2">
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      <path d="M17 8a4 4 0 010 6" />
    </svg>
  ),
  "Start Date": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  "Planned Completion": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  "Days Remaining": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2">
      <path d="M6 2h12M6 22h12M6 2c0 6 12 6 12 12s-12 6-12 12M18 2c0 6-12 6-12 12s12 6 12 12" />
    </svg>
  ),
};

export function OnboardingSummaryCards({ fields }: { fields: Field[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {fields.map((f) => (
        <div
          key={f.label}
          className="flex items-start gap-3 rounded-2xl bg-white"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "18px 20px",
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "#EEF2FF" }}
          >
            {ICONS[f.label]}
          </div>
          <div>
            <div className="text-xs text-vantara-text-muted">{f.label}</div>
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
      ))}
    </div>
  );
}