import { apiClient } from "./api-client";
import { Employee } from "@/types/employee";
import { OnboardingDetail } from "@/types/onboarding";

export async function getOnboardingList(): Promise<Employee[]> {
  const { data } = await apiClient.get<Employee[]>("/employees");
  return data.filter((e) => e.remaining !== null && e.remaining !== undefined);
}

export async function getOnboardingDetail(
  id: string
): Promise<OnboardingDetail | null> {
  const { data } = await apiClient.get<Record<string, OnboardingDetail>>(
    "/onboardingDetails"
  );
  return data[id] ?? null;
}
