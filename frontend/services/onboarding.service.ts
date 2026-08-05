import { backendApiClient } from "./backend-api-client";
import { Employee } from "@/types/employee";
import { OnboardingDetail } from "@/types/onboarding";

export async function getOnboardingList(): Promise<Employee[]> {
  // No dedicated "onboarding list" route on the backend -- reuses the
  // same employee-directory data the Directory screen already migrated to,
  // filtered the same way the mock version was (only employees with an
  // in-progress onboarding, i.e. `remaining` set).
  // NOTE: employee-directory's `remaining` field is currently always null
  // (backend has no estimated-completion-date column yet -- see
  // employeeDirectory.py's _employee_out TODO), so this filter will return
  // an empty list until that field is populated. Ask your backend teammate
  // whether onboarding-in-progress should instead be derived from
  // `employee.status === "provisioning"` as a stand-in.
  const { data } = await backendApiClient.get<Employee[]>("/employee-directory");
  return data.filter((e) => e.remaining !== null && e.remaining !== undefined);
}

export async function getOnboardingDetail(
  id: string
): Promise<OnboardingDetail | null> {
  try {
    const { data } = await backendApiClient.get<OnboardingDetail>(
      `/onboarding-details/${id}`
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}