import { apiClient } from "./api-client";
import { DashboardData } from "@/types/onboarding";

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>("/dashboard");
  return data;
}
