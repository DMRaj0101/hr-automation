import { backendApiClient } from "./backend-api-client";
import { ChecklistItem, Employee } from "@/types/employee";

export async function getEmployees(): Promise<Employee[]> {
  const { data } = await backendApiClient.get<Employee[]>("/employee-directory");
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await backendApiClient.get<Employee>(`/employee-directory/${id}`);
  return data;
}

export async function getChecklist(id: string): Promise<ChecklistItem[]> {
  const { data } = await backendApiClient.get<ChecklistItem[]>(
    `/employee-directory/${id}/checklist`
  );
  return data;
}


