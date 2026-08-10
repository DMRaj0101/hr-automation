export interface Ticket {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  request: string;
  system: string;
  priority: "Critical" | "High" | "Medium";
  status: "Open" | "In Progress" | "Pending" | "Closed" | "Failed";
  created: string;
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
