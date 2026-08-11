import { useQuery } from "@tanstack/react-query";
import { getSlaWarnings, getSystemHealthDetail } from "@/services/monitoring.service";

export function useMonitoring() {
  const systemHealth = useQuery({
    queryKey: ["systemHealthDetail"],
    queryFn: getSystemHealthDetail,
    refetchInterval: 5000,
  });
  const slaWarnings = useQuery({
    queryKey: ["slaWarnings"],
    queryFn: getSlaWarnings,
    refetchInterval: 5000,
  });
  return { systemHealth, slaWarnings };
}
