import { apiClient } from "./api-client";
import { DashboardData } from "@/types/onboarding";
 
interface BackendDashboardSummary {
  total_employees: number;
  active_onboarding: number;
  completed_onboarding: number;
  tickets_by_status: Record<string, number>;
  tickets_by_team: Record<string, number>;
  provisioning_by_status: Record<string, number>;
  role_distribution: { name: string; count: number }[];
  tickets_over_sla: number;
  recent_activity: {
    timestamp: string;
    agent: string;
    action: string;
    detail: string;
    employee_id: string;
  }[];
}
 
// Adapter: the backend's /dashboard/summary shape (employee/ticket/
// provisioning counts + recent activity) doesn't match DashboardData
// (stats/integrationCoverage/slaWarning/departments/systemHealth/
// ticketStatus) field-for-field -- these were built independently.
// Fields with a real backend source are mapped below. Fields with no
// backend source (integrationCoverage, per-department breakdown,
// slaWarning detail, systemHealth) are stubbed to empty/zero rather than
// invented -- flag these to your backend teammate if the Dashboard UI
// needs them rendered for real. The page itself (dashboard/page.tsx)
// tolerates the empty arrays fine -- it just renders those cards blank.
function toDashboardData(s: BackendDashboardSummary): DashboardData {
  const failed = s.provisioning_by_status["failed"] ?? 0;
 
  return {
    stats: {
      total: s.total_employees,
      closed: s.completed_onboarding,
      inProgress: s.active_onboarding,
      failed,
    },
    // TODO: no backend concept of "real vs mock system coverage %" yet.
    integrationCoverage: {
      realCount: 0,
      mockCount: 0,
      realPct: 0,
      mockPct: 0,
      realSystems: [],
      mockSystems: [],
    },
    // TODO: backend only gives an aggregate `tickets_over_sla` count, not
    // a single representative ticket's detail. Left as a placeholder --
    // ask whether the UI can show a count instead, or needs a real
    // "which ticket" endpoint.
    slaWarning: {
      ticketId: "",
      employee: "",
      department: "",
      item: "",
      duration: s.tickets_over_sla > 0 ? `${s.tickets_over_sla} over SLA` : "",
    },
    // TODO: no per-department breakdown on the backend -- role_distribution
    // is by role, not department, and has no employees/openTickets/
    // avgCompletion per entry.
    departments: [],
    // TODO: no live system-health endpoint wired into /dashboard/summary
    // (health_check_orchestrator exists but isn't surfaced here).
    systemHealth: [],
    ticketStatus: {
      open: s.tickets_by_status["Open"] ?? 0,
      inProgress: s.tickets_by_status["In Progress"] ?? 0,
      failed: s.tickets_by_status["Pending"] ?? 0,
      closed: s.tickets_by_status["Closed"] ?? 0,
    },
  };
}
 
export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<BackendDashboardSummary>(
    "/dashboard/summary"
  );
  return toDashboardData(data);
}