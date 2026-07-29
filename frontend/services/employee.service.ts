import { apiClient } from "./api-client";
import { ChecklistItem, Employee } from "@/types/employee";

export async function getEmployees(): Promise<Employee[]> {
  const { data } = await apiClient.get<Employee[]>("/employees");
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.get<Employee>(`/employees/${id}`);
  return data;
}

export async function getChecklist(id: string): Promise<ChecklistItem[]> {
  const { data } = await apiClient.get<Record<string, ChecklistItem[]>>(
    "/checklists"
  );
  return data[id] ?? [];
}
