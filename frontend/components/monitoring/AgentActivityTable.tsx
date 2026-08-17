import { useMemo, useState } from "react";
import { AgentTicketStatus, RecentLog } from "@/types/monitoring";
import { statusStyle } from "@/lib/utils";
import { formatRelativeTime, getActivityMeta } from "./activity-utils";

type Filter = "All" | AgentTicketStatus;

const FILTERS: Filter[] = ["All", "Closed", "Processing", "New", "Failed"];

// Selected-tab colors, keyed the same as statusStyle()'s bg/text so a
// filter tab visually matches the status pills it's filtering by.
const FILTER_SELECTED_STYLE: Record<Filter, { bg: string; text: string }> = {
  All: { bg: "#14213D", text: "#FFFFFF" },
  Closed: statusStyle("Closed"),
  Processing: statusStyle("Processing"),
  New: statusStyle("New"),
  Failed: statusStyle("Failed"),
};

// Overall recent agent activity across all employees, most-recent-first --
// backed directly by GET /system-health/recent-logs (routers/healthcheck.py)
// via useMonitoring()'s recentLogs query. Same feed the Live Banner shows
// the newest row of; this list shows all of it (currently capped at 10 rows
// server-side), not a per-employee rollup. Each row's icon/headline/status
// phrase is derived from agent/action/status via getActivityMeta()
// (activity-utils.ts) -- real `status` values are New/Processing/Failed/
// Closed (see AgentTicketStatus), null for log rows whose agent never
// opened a ticket. `retry_count` comes from an outer join to
// ProvisioningRecord and is shown only when it's a real number > 0.
export function AgentActivityTable({ activity }: { activity: RecentLog[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(
    () => (filter === "All" ? activity : activity.filter((row) => row.status === filter)),
    [activity, filter]
  );

  if (activity.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-vantara-text-muted">
        No recent agent activity.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
        {FILTERS.map((f) => {
          const isSelected = filter === f;
          const selectedStyle = FILTER_SELECTED_STYLE[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={isSelected}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-vantara-navy/40 active:scale-95 ${
                isSelected
                  ? "shadow-sm"
                  : "bg-[#F3F4F6] text-vantara-text-muted hover:bg-[#E5E7EB] hover:text-vantara-navy"
              }`}
              style={isSelected ? { backgroundColor: selectedStyle.bg, color: selectedStyle.text } : undefined}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-[8rem]">
        {filtered.length === 0 ? (
          <div className="flex h-32 animate-fade-in items-center justify-center text-sm text-vantara-text-muted">
            No activity with status &quot;{filter}&quot;.
          </div>
        ) : (
          <div key={filter} className="flex w-full min-w-0 animate-fade-in flex-col divide-y divide-[#F3F4F6]">
            {filtered.map((row, idx) => {
              const meta = getActivityMeta(row);
              return (
                <div
                  key={`${idx}-${row.timestamp}-${row.agent}-${row.action}`}
                  className="group flex w-full min-w-0 items-start gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-[#FAFAFA]"
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-110"
                    style={{ backgroundColor: meta.iconBg }}
                  >
                    <meta.Icon size={15} strokeWidth={2.25} color={meta.iconColor} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-vantara-navy">
                      {row.agent_ticket_id && (
                        <span className="font-semibold">{row.agent_ticket_id} - </span>
                      )}
                      <span className="font-semibold">{meta.title}</span>
                      <span className="text-vantara-text-muted"> — {meta.sentence}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-vantara-text-muted">
                      {meta.statusPhrase}
                      {!!row.retry_count && row.retry_count > 0 && (
                        <span className="ml-1 font-medium text-[#B45309]">
                          · Retried {row.retry_count}×
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-vantara-text-muted">
                    {formatRelativeTime(row.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
