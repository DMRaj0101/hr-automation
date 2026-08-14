export interface SystemHealthDetail {
  name: string;
  status: string;
  latency: string;
  // Business-friendly explanation of the current status (always present --
  // "The system is healthy and operating normally." when there's no error --
  // see health_check_orchestrator.get_cached_health()).
  error: string;
  // Last-24h latency readings (ms) and uptime %, from GET /system-health's
  // latencyHistory24h / uptimePercentage maps -- merged in per-agent by
  // getSystemHealthDetail() (services/monitoring.service.ts).
  latencyHistory24h: number[];
  uptimePercentage: number | null;
}

// AgentTicket.status values (agent_monitor_model.py) -- "New" and
// "Processing" both mean the ticket is still open/in flight.
export type AgentTicketStatus = "New" | "Processing" | "Failed" | "Closed";

// Mirrors GET /system-health/recent-logs's per-row shape
// (routers/healthcheck.py's _recent_logs()). System-wide audit log feed,
// not scoped to one employee -- employee_name/employee_id are null for
// log rows not tied to a specific employee. status/agent_ticket_id come
// from an outer join to AgentTicket on (employee_id, agent name) -- null
// when this log row's agent has no matching AgentTicket row (e.g. a
// one-off action that never opened a ticket). retry_count comes from a
// similar outer join to ProvisioningRecord (via employee_id + a
// display-name -> agent_key mapping) -- null for agents with no
// provisioning record (e.g. Ticket Generation Agent), a real number
// (0+) otherwise.
export interface RecentLog {
  timestamp: string | null;
  agent: string;
  action: string;
  detail: string | null;
  agent_ticket_id: string | null;
  status: AgentTicketStatus | null;
  retry_count: number | null;
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
