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

// Mirrors GET /system-health/recent-logs's per-row shape
// (routers/healthcheck.py's _recent_logs()). System-wide audit log feed,
// not scoped to one employee -- employee_name/employee_id are null for
// log rows not tied to a specific employee.
export interface RecentLog {
  timestamp: string | null;
  agent: string;
  action: string;
  detail: string | null;
  employee_name: string | null;
  employee_id: string | null;
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
