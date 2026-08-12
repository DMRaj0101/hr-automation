import { backendApiClient } from "./backend-api-client";
import { DashboardData } from "@/types/onboarding";

// GET /dashboard/summary (routers/dashboard.py) already returns the exact
// DashboardData shape (stats/integrationCoverage/slaWarning/departments/
// systemHealth/ticketStatus) -- no adapter needed, unlike the old
// mock-json-server-backed version this replaced.
export async function getDashboard(): Promise<DashboardData> {
  const { data } = await backendApiClient.get<DashboardData>("/dashboard/summary");
  return data;
}
