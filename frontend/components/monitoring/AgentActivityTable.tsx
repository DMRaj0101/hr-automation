import { useMemo, useState } from "react";
import { AgentTicketStatus, RecentLog } from "@/types/monitoring";
import { StatusBadge } from "@/components/common/StatusBadge";
import { statusStyle } from "@/lib/utils";

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
// server-side), not a per-employee rollup. `status` comes from an outer
// join to AgentTicket -- real values are New/Processing/Failed/Closed (see
// AgentTicketStatus), null for log rows whose agent never opened a ticket
// (rendered as a neutral dot, no pill). `retry_count` comes from a similar
// outer join to ProvisioningRecord and is shown next to the status pill
// only when it's a real number > 0 -- null (agent has no provisioning
// record at all) renders no retry pill, same as null status.
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
              const dotColor = row.status ? statusStyle(row.status).text : "#9CA3AF";
              return (
                <div
                  key={`${idx}-${row.timestamp}-${row.agent}-${row.action}`}
                  className="group flex w-full min-w-0 items-start gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-[#FAFAFA]"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full transition-transform duration-150 group-hover:scale-125"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-vantara-navy">
                        <span className="font-semibold">{row.agent}</span> — {row.action}
                      </span>
                      {row.status && <StatusBadge status={row.status} />}
                      {!!row.retry_count && row.retry_count > 0 && (
                        <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]">
                          Retried {row.retry_count}×
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-vantara-text-muted">
                      {row.employee_id ?? "—"} · {row.employee_name ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-vantara-text-muted">
                    {row.timestamp ?? "—"}
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
