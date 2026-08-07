import { backendApiClient } from "./backend-api-client";
import { Employee } from "@/types/employee";
import {
  OnboardingDetail,
  ProvisionalStatusItem,
  ProvisionalStatusResponse,
} from "@/types/onboarding";

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

/**
 * Functional-item provisioning status for a single employee (Provisional
 * Status screen). Backend route is GET /onboarding-details/{employee_id}/provisional-status
 * and returns { ProvisionalStatus: { [employee_id]: ProvisionalStatusItem[] } }
 * -- unwrap to a flat array here since callers only ever care about the one
 * employee_id they asked for.
 *
 * Note: per the backend implementation, `ticketID`, `ticketStatus`,
 * `credentials.password`, and `note` are mocked (no ticket/credential/note
 * concept exists for Functional items in the current schema) -- treat them
 * as placeholder data on the frontend, not as live values.
 */
export async function getProvisionalStatus(
  employeeId: string
): Promise<ProvisionalStatusItem[]> {
  try {
    const { data } = await backendApiClient.get<ProvisionalStatusResponse>(
      `/onboarding-details/${employeeId}/provisional-status`
    );
    return data.ProvisionalStatus[employeeId] ?? [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}