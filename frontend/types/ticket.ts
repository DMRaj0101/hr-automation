export interface Ticket {
  id: string;
  employee: string;
  dept: string;
  issue: string;
  system: string;
  team: string;
  priority: "Critical" | "High" | "Medium";
  status: "Open" | "In Progress" | "Pending" | "Closed" | "Failed";
  time: string;
}

export interface StatusHistoryEntry {
  status: string;
  time: string;
  color: string;
}

export interface TicketNote {
  author: string;
  time: string;
  text: string;
}

export interface TicketDetail {
  slaTotalHours: number;
  slaRemainingHours: number;
  slaPercentElapsed: number;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  retryCount: number;
  nextRetry: string;
  statusHistory: StatusHistoryEntry[];
  notes: TicketNote[];
}
