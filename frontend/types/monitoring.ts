export interface SystemHealthDetail {
  name: string;
  status: string;
  latency: string;
  // Last-24h latency readings (ms) and uptime %, from GET /system-health's
  // latencyHistory24h / uptimePercentage maps -- merged in per-agent by
  // getSystemHealthDetail() (services/monitoring.service.ts).
  latencyHistory24h: number[];
  uptimePercentage: number | null;
}

// Placeholder shape -- the backend team hasn't shipped the agent activity
// endpoint yet (see monitoring-agent page.tsx). Update once it exists.
export interface AgentActivity {
  name: string;
  dept: string;
  status: string;
  retries: string;
  tickets: number;
}

// Mirrors GET /system-health/sla-warnings's per-row shape
// (routers/healthcheck.py's _get_sla_warnings()).
export interface SlaWarning {
  ticket_id: string;
  employee_name: string;
  system: string;
  breach_cause: string;
  breach_since: string | null;
  sla_hours: number;
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
  source?: string;
}
