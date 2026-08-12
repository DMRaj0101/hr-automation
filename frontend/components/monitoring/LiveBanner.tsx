import { RecentLog } from "@/types/monitoring";

// Backed by GET /system-health/recent-logs (routers/healthcheck.py) via
// useMonitoring()'s recentLogs query -- shows the single most recent
// system-wide log row as a "live" event line. Not a push/streaming feed,
// just the newest row of a 5s-polled, 10-row-capped audit log.
export function LiveBanner({
  latest,
  isLoading,
  isError,
}: {
  latest: RecentLog | null;
  isLoading: boolean;
  isError: boolean;
}) {
  const dotColor = isError ? "#EF4444" : latest ? "#22C55E" : "#9CA3AF";

  const message = isLoading
    ? "Loading..."
    : isError
      ? "Failed to load live events."
      : latest
        ? `${latest.agent} — ${latest.action}${
            latest.employee_name ? ` (${latest.employee_name})` : ""
          }`
        : "Data isn't available yet";

  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="rounded-full"
          style={{ width: 10, height: 10, backgroundColor: dotColor }}
        />
        <span className="font-semibold text-vantara-navy">Live events</span>
      </div>
      <span className="text-sm text-vantara-text-muted">{message}</span>
    </div>
  );
}
