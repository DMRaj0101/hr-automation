export interface Employee {
  id: string;
  name: string;
  dept: string;
  type: "experienced" | "fresher";
  manager: string;
  status: string;
  progress: number;
  blockers: number;
  start: string | null;
  est: string | null;
  remaining: number | null;
  email: string;
  phone: string;
  office: string;
  empManager: string;
  hireDate: string;
  yearsOfService: string;
  jobLevel: string;
  title: string;
}

export type ChecklistStatus =
  | "done"
  | "inProgress"
  | "failed"
  | "blocked"
  | "pending";

export interface ChecklistItem {
  system: string;
  platform: string;
  status: ChecklistStatus;
  kind: "Functional" | "Mock";
  detail: string;
  outcome: string;
}
