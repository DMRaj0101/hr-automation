import { apiClient } from "./api-client";
import { MonitoringData, SystemHealthDetail } from "@/types/monitoring";

export async function getMonitoring(): Promise<MonitoringData> {
  const { data } = await apiClient.get<MonitoringData>("/monitoring");
  return data;
}

export async function getSystemHealthDetail(): Promise<SystemHealthDetail[]> {
  const { data } = await apiClient.get<SystemHealthDetail[]>(
    "/systemHealthDetail"
  );
  return data;
}
