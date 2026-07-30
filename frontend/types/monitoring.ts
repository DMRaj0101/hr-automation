export interface SystemHealthDetail {
  name: string;
  status: string;
  latency: string;
}

export interface ActiveRequest {
  name: string;
  dept: string;
  status: string;
  retries: string;
  tickets: number;
}

export interface MonitoringSlaWarning {
  ticketId: string;
  employee: string;
  item: string;
  team: string;
  since: string;
  duration: string;
}

export interface MonitoringData {
  lastEvent: string;
  activeRequests: ActiveRequest[];
  slaWarning: MonitoringSlaWarning;
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
  source?: string;
}
