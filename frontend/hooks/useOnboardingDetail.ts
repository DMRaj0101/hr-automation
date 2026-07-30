import { useQuery } from "@tanstack/react-query";
import { getEmployee } from "@/services/employee.service";
import { getOnboardingDetail } from "@/services/onboarding.service";

export function useOnboardingDetail(id: string) {
  const employee = useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
  const detail = useQuery({
    queryKey: ["onboardingDetail", id],
    queryFn: () => getOnboardingDetail(id),
    enabled: !!id,
  });
  return { employee, detail };
}
