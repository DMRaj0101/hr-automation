import { useQuery } from "@tanstack/react-query";
import { getChecklist, getEmployee } from "@/services/employee.service";

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
