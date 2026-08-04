export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
}

export interface IntegrationCoverage {
  realCount: number;
  mockCount: number;
  realPct: number;
  mockPct: number;
  realSystems: string[];
  mockSystems: string[];
}

export interface SlaWarning {
  ticketId: string;
  employee: string;
  department: string;
  item: string;
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

export interface DashboardData {
  stats: DashboardStats;
  integrationCoverage: IntegrationCoverage;
  slaWarning: SlaWarning;
  departments: DepartmentSummary[];
  systemHealth: SystemHealthBrief[];
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