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
  const STATUS_DOT_COLOR: Record<string, string> = {
    Closed: "#22C55E",
    Failed: "#EF4444",
    Processing: "#F59E0B",
    New: "#F59E0B",
  };
  const dotColor = isError
    ? "#EF4444"
    : latest
      ? (latest.status ? STATUS_DOT_COLOR[latest.status] : undefined) ?? "#22C55E"
      : "#9CA3AF";

  const isLive = !isLoading && !isError && !!latest;

  const fallbackMessage = isLoading
    ? "Loading..."
    : isError
      ? "Failed to load live events."
      : "Data isn't available yet";

  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className={isLive ? "pulse-dot rounded-full" : "rounded-full"}
          style={{ width: 10, height: 10, backgroundColor: dotColor }}
        />
        <span className="font-semibold text-vantara-navy">Live events</span>
      </div>
      {latest ? (
        <span
          key={`${latest.timestamp}-${latest.agent}-${latest.action}`}
          className="animate-fade-in text-sm text-vantara-navy"
        >
          <span className="font-semibold">{latest.agent}</span>
          <span className="text-vantara-text-muted"> — </span>
          {latest.action}
          {latest.employee_name && (
            <span className="text-vantara-text-muted"> ({latest.employee_name})</span>
          )}
        </span>
      ) : (
        <span key={fallbackMessage} className="animate-fade-in text-sm text-vantara-text-muted">
          {fallbackMessage}
        </span>
      )}
    </div>
  );
}
