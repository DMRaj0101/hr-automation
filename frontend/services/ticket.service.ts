import { apiClient } from "./api-client";
import { Ticket, TicketDetail } from "@/types/ticket";

export async function getTickets(): Promise<Ticket[]> {
  const { data } = await apiClient.get<Ticket[]>("/tickets");
  return data;
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  const { data } = await apiClient.get<Ticket[]>("/tickets");
  return data.find((t) => t.id === id);
}

export async function getTicketDetail(
  id: string
): Promise<TicketDetail | null> {
  const { data } = await apiClient.get<Record<string, TicketDetail>>(
    "/ticketDetails"
  );
  return data[id] ?? null;
}
