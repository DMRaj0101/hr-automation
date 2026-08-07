import { apiClient } from "./api-client";
import { Employee } from "@/types/employee";
import { OnboardingDetail } from "@/types/onboarding";

export async function getOnboardingList(): Promise<Employee[]> {
  // Mock server: only employees with an in-progress onboarding
  // (i.e. `remaining` set) show up on the list.
  const { data } = await apiClient.get<Employee[]>("/employees");
  return data.filter((e) => e.remaining !== null && e.remaining !== undefined);
}

export async function getOnboardingDetail(
  id: string
): Promise<OnboardingDetail | null> {
  // `onboardingDetails` in db.json is an object keyed by employee id
  // (currently only seeded for EMP-2001) -- fetch the whole object and
  // index client-side, same pattern as getTicketDetail/getProvisionalStatus.
  const { data } = await apiClient.get<Record<string, OnboardingDetail>>(
    "/onboardingDetails"
  );
  return data[id] ?? null;
}