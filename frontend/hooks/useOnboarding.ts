import { useQuery } from "@tanstack/react-query";
import { getOnboardingList } from "@/services/onboarding.service";

export function useOnboarding() {
  return useQuery({ queryKey: ["onboarding"], queryFn: getOnboardingList });
}
