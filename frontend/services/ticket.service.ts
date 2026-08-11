import { backendApiClient } from "./backend-api-client";
import { Ticket, TicketDetail } from "@/types/ticket";

// Backend row shape from GET /tickets-page (routers/ticketspage.py) --
// already reshaped server-side to match this screen, but field names
// differ from the frontend's Ticket type.
interface TicketPageRow {
  ticketID: string;
  employee_id: string | null;
  employeeName: string | null;
  department: string | null;
  request: string;
  system: string | null;
  priority: string;
  status: string;
  created: string | null;
}

function toTicket(row: TicketPageRow): Ticket {
  return {
    id: row.ticketID,
    employee: row.employeeID ?? "—",
    employee: row.employeeName ?? "—",
    department: row.department ?? "—",
    request: row.request,
    system: row.system ?? "—",
    priority: (row.priority as Ticket["priority"]) ?? "Medium",
    status: row.status as Ticket["status"],
    created: row.created ?? "—",
  };
}

export async function getTickets(): Promise<Ticket[]> {
  const { data } = await backendApiClient.get<{ tickets: TicketPageRow[] }>(
    "/tickets-page"
  );
  return data.tickets.map(toTicket);
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  const tickets = await getTickets();
  return tickets.find((t) => t.id === id);
}

export async function getTicketDetail(
  id: string
): Promise<TicketDetail | null> {
  // No per-ticket detail route exists yet on the backend (/tickets-page only
  // returns the flat list) -- callers fall back to TicketDetailPage's
  // buildFallbackDetail() when this resolves to null.
  return null;
}
