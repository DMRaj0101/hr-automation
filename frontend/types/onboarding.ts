export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  notStarted: number;
}

export interface IntegrationCoverage {
  realCount: number;
  mockCount: number;
  realPct: number;
  mockPct: number;
  realSystems: string[];
  mockSystems: string[];
}

// All fields null when no ticket currently breaches SLA -- see
// dashboard.py's _build_sla_warning() docstring.
export interface SlaWarning {
  ticketId: string | null;
  employee: string | null;
  department: string | null;
  item: string | null;
  duration: string | null;
}

// One provisioning failure row from GET /dashboard/sla-warning's
// "errorReport" list (dashboard.py's _build_sla_warning()).
export interface ErrorLogEntry {
  employeeId: string;
  employee: string;
  agentname: string;
  errorDetail: string;
  duration: string;
}

export interface DepartmentSummary {
  name: string;
  employees: number;
  openTickets: number;
  avgCompletion: number;
}

export interface SystemHealthBrief {
  name: string;
  status: string;
}

export interface TicketStatusSummary {
  open: number;
  inProgress: number;
  pending: number;
  closed: number;
}

// Per-system action tally, from GET /dashboard/system-health's
// "actioncount" map (routers/dashboard.py's get_action_count()) -- keyed
// by system key (keycloak/mailu/kimai/openkm), only populated for the 4
// real connector agents.
export interface SystemActionCount {
  totalActions: number;
  successRate: number;
}

// GET /dashboard/total-actions (routers/dashboard.py's get_total_action())
// -- downstream actions represented by every AgentTicket row, broken down
// by the ticket's status.
export interface TotalActionsSummary {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  failed: number;
}

export interface DashboardData {
  stats: DashboardStats;
  // No backend source yet (no GET /dashboard/integration-coverage) --
  // omitted from getDashboard()'s live fetch; kept optional here so a
  // future endpoint can populate it without another type change.
  integrationCoverage?: IntegrationCoverage;
  slaWarning: SlaWarning;
  errorReport: ErrorLogEntry[];
  departments: DepartmentSummary[];
  systemHealth: SystemHealthBrief[];
  actionCounts: Record<string, SystemActionCount>;
  totalActions: TotalActionsSummary;
  ticketStatus: TicketStatusSummary;
}

export interface OnboardingAlert {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  body: string;
  kind: "dismiss" | "view" | "ack";
  time?: string;
  date?: string;
}

export interface OnboardingDetail {
  status: string;
  type: string;
  startDate: string;
  plannedCompletion: string;
  daysRemaining: number;
  alerts: OnboardingAlert[];
}

/**
 * Single functional-item provisioning result for one employee, returned by
 * GET /onboarding-details/{employee_id}/provisional-status.
 *
 * Note: per the backend implementation, `ticketID`, `ticketStatus`,
 * `credentials.password`, and `note` are mocked (no ticket/credential/note
 * concept exists for Functional items in the current schema) -- treat them
 * as placeholder data on the frontend, not as live values.
 */
export interface ProvisionalStatusItem {
  platform: string;
  ticketID: string;
  ticketStatus: string;
  startTime: string;
  endtime: string;
  credentials?: {
    username?: string;
    password?: string;
  };
  note?: string;
}

/**
 * Raw shape returned by the provisional-status endpoint, keyed by
 * employee id. Unwrap to ProvisionalStatusItem[] via
 * getProvisionalStatus() -- callers shouldn't need this type directly.
 */
export interface ProvisionalStatusResponse {
  ProvisionalStatus: {
    [employeeId: string]: ProvisionalStatusItem[];
  };
}