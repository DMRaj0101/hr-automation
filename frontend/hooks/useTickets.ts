import { useQuery } from "@tanstack/react-query";
import { getTickets } from "@/services/ticket.service";

export function useTickets() {
  return useQuery({ queryKey: ["tickets"], queryFn: getTickets });
}
