import { useQuery } from "@tanstack/react-query";
import {
  getChecklist,
  getEmployee,
  getEmployeeAlerts,
} from "@/services/employee.service";

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
}

export function useChecklist(id: string) {
  return useQuery({
    queryKey: ["checklist", id],
    queryFn: () => getChecklist(id),
    enabled: !!id,
  });
}

export function useEmployeeAlerts(id: string) {
  return useQuery({
    queryKey: ["employee-alerts", id],
    queryFn: () => getEmployeeAlerts(id),
    enabled: !!id,
  });
}