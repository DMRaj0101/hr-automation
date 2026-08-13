import { useQuery, useQueryClient } from "@tanstack/react-query";
import { syncNewHires } from "@/services/employee.service";

const HRMS_SYNC_INTERVAL_MS = 15000;

export function useHrmsSyncPolling() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["hrmsSync"],
    queryFn: async () => {
      const result = await syncNewHires();
      if (result.synced_count > 0) {
        queryClient.invalidateQueries({ queryKey: ["employees"] });
      }
      return result;
    },
    refetchInterval: HRMS_SYNC_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
}
