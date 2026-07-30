import { useQuery } from "@tanstack/react-query";
import { getTicket, getTicketDetail } from "@/services/ticket.service";

export function useTicketDetail(id: string) {
  const ticket = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(id),
    enabled: !!id,
  });
  const detail = useQuery({
    queryKey: ["ticketDetail", id],
    queryFn: () => getTicketDetail(id),
    enabled: !!id,
  });
  return { ticket, detail };
}
