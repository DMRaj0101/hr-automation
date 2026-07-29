import { useQuery } from "@tanstack/react-query";
import {
  getMonitoring,
  getSystemHealthDetail,
} from "@/services/monitoring.service";

export function useMonitoring() {
  const monitoring = useQuery({
    queryKey: ["monitoring"],
    queryFn: getMonitoring,
    refetchInterval: 5000,
  });
  const systemHealth = useQuery({
    queryKey: ["systemHealthDetail"],
    queryFn: getSystemHealthDetail,
    refetchInterval: 5000,
  });
  return { monitoring, systemHealth };
}
