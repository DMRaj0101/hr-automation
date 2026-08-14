import { backendApiClient } from "./backend-api-client";
import {
  DashboardData,
  DashboardStats,
  DepartmentSummary,
  SlaWarning,
  SystemActionCount,
  SystemHealthBrief,
  TicketStatusSummary,
  TotalActionsSummary,
} from "@/types/onboarding";

interface SlaWarningResponse {
  errorReport: unknown[];
  slaWarning: {
    ticketId: string;
    employee: string | null;
    department: string | null;
    item: string;
    duration: string;
  }[];
}

interface SystemHealthResponse {
  agenthealth: SystemHealthBrief[];
  actioncount: Record<string, SystemActionCount>;
}

const EMPTY_SLA_WARNING: SlaWarning = {
  ticketId: null,
  employee: null,
  department: null,
  item: null,
  duration: null,
};

// /dashboard/summary is commented out in routers/dashboard.py -- every
// field below is fetched from its own live split-out endpoint instead
// (each one reuses the exact same builder function /summary used to, per
// that router's comment, so they can't drift out of sync with it).
export async function getDashboard(): Promise<DashboardData> {
  const [stats, slaWarningRes, departments, systemHealthRes, totalActions, ticketStatus] =
    await Promise.all([
      backendApiClient.get<DashboardStats>("/dashboard/stats"),
      backendApiClient.get<SlaWarningResponse>("/dashboard/sla-warning"),
      backendApiClient.get<DepartmentSummary[]>("/dashboard/departments"),
      backendApiClient.get<SystemHealthResponse>("/dashboard/system-health"),
      backendApiClient.get<TotalActionsSummary>("/dashboard/total-actions"),
      backendApiClient.get<TicketStatusSummary>("/dashboard/ticket-status"),
    ]);

  return {
    stats: stats.data,
    // SlaWarningCard shows one ticket -- the most recent breach, if any.
    slaWarning: slaWarningRes.data.slaWarning[0] ?? EMPTY_SLA_WARNING,
    departments: departments.data,
    systemHealth: systemHealthRes.data.agenthealth,
    actionCounts: systemHealthRes.data.actioncount,
    totalActions: totalActions.data,
    ticketStatus: ticketStatus.data,
  };
}
