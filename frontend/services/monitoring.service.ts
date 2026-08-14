import { backendApiClient } from "./backend-api-client";
import { RecentLog, SlaWarning, SystemHealthDetail } from "@/types/monitoring";

interface SystemHealthResponse {
  systemHealthDetail: { name: string; status: string; latency: string; error: string }[];
  latencyHistory24h: Record<string, number[]>;
  uptimePercentage: Record<string, number>;
}

// Real backend data -- GET /system-health (routers/healthcheck.py) returns
// the last cached health sweep plus each agent's last-24h latency history
// and uptime %, keyed by agent name. Merge them onto each detail row here
// so components only deal with one flat SystemHealthDetail shape.
export async function getSystemHealthDetail(): Promise<SystemHealthDetail[]> {
  const { data } = await backendApiClient.get<SystemHealthResponse>("/system-health");
  return data.systemHealthDetail.map((item) => ({
    ...item,
    latencyHistory24h: data.latencyHistory24h[item.name] ?? [],
    uptimePercentage: data.uptimePercentage[item.name] ?? null,
  }));
}

// GET /system-health/sla-warnings (routers/healthcheck.py) -- currently
// breaching SLA tickets, read straight from persisted Ticket rows.
export async function getSlaWarnings(): Promise<SlaWarning[]> {
  const { data } = await backendApiClient.get<{ slaWarnings: SlaWarning[] }>(
    "/system-health/sla-warnings"
  );
  return data.slaWarnings;
}

// GET /system-health/recent-logs (routers/healthcheck.py) -- system-wide
// audit log feed, most recent 10 rows. Backs both the Live Banner (latest
// row) and the Agent Activity panel (all rows, as a raw recent-activity
// feed -- not a per-employee rollup).
export async function getRecentLogs(): Promise<RecentLog[]> {
  const { data } = await backendApiClient.get<{ recent_activity: RecentLog[] }>(
    "/system-health/recent-logs"
  );
  return data.recent_activity;
}
