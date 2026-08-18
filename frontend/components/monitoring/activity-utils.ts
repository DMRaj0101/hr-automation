import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { RecentLog } from "@/types/monitoring";

export interface ActivityMeta {
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  sentence: string;
  statusPhrase: string;
}

// Turns "Provisioned Kimai access" / "Failed Kimai access" / "Skipped Kimai
// access -- connector not implemented" into "Kimai access" for reuse in a
// plain-English sentence.
function stripActionVerb(action: string): string {
  return action
    .replace(/^(Provisioned|Failed|Skipped|Poll failed for)\s+/i, "")
    .replace(/\s*--\s*connector not implemented$/i, "")
    .trim();
}

// Backend timestamps are formatted server-side as "%d-%m-%Y %H:%M:%S"
// (healthcheck.py's _format_dt) from a datetime.utcnow() column, with no
// timezone marker -- i.e. this string is UTC wall-clock time, not local.
// Must parse via Date.UTC(...), not the local-time Date constructor, or
// every relative "X ago" label drifts by the browser's UTC offset (e.g.
// reads "6 hr ago" for something that happened under an hour ago in a
// UTC+5:30 browser).
function parseLogTimestamp(value: string): Date | null {
  const match = value.match(
    /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) return null;
  const [, day, month, year, hour, minute, second] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );
}

export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "—";
  const date = parseLogTimestamp(timestamp);
  if (!date) return timestamp;

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

// Derives an icon + short bold headline + status phrase from a recent-logs
// row, in the spirit of the "Recent Agent Activity" list -- grounded only
// in states the backend actually produces (see AgentTicketStatus /
// ProvisioningRecord.status / monitoring_agent.py's retry-poll audit logs).
// No human-approval state exists in the data model yet, so it isn't one of
// these cases.
export function getActivityMeta(row: RecentLog): ActivityMeta {
  const action = row.action ?? "";
  const item = stripActionVerb(action);
  const who = row.employee_name ? ` for ${row.employee_name}` : "";

  // "Created TKT-1053" (ticket_agent.py's create_ticket) -- detail is
  // "<item> -> <team> team", safe/clean to surface directly.
  const ticketCreated = action.match(/^Created (TKT-\S+)/i);
  // "TKT-1053 -> Processing" (ticket_agent.py's update_status) -- agent is
  // literally "<item> Agent" here, so lead with the item, not "Agent for X".
  const ticketTransition = action.match(/^(TKT-\S+) -> (.+)$/i);

  const isRetry = /^Poll failed/i.test(action);
  const isFailure =
    row.status === "Failed" || /^Failed /i.test(action) || /^Skipped /i.test(action);
  const isSlaBreach = /SLA breach flagged/i.test(action);
  const isCompleted = row.status === "Closed" || /^Provisioned /i.test(action);

  if (ticketCreated) {
    const [, ticketId] = ticketCreated;
    const forTeam = row.detail ? ` (${row.detail.replace(" -> ", " assigned to ")})` : "";
    return {
      Icon: CheckCircle2,
      iconColor: "#16A34A",
      iconBg: "#DCFCE7",
      title: `Ticket ${ticketId} created`,
      sentence: `${row.agent} opened a ticket${who}${forTeam}`,
      statusPhrase: row.status ?? "Open",
    };
  }

  if (ticketTransition) {
    const [, ticketId, newStatus] = ticketTransition;
    // row.agent here is "<item> Agent" (ticket_agent.py's update_status),
    // strip the trailing " Agent" to get just the item name.
    const provisioningItem = row.agent.replace(/\s*Agent$/i, "");
    return {
      Icon: Activity,
      iconColor: "#2563EB",
      iconBg: "#DBEAFE",
      title: `Ticket ${ticketId} updated`,
      sentence: `${provisioningItem} status changed to ${newStatus}${who}`,
      statusPhrase: newStatus,
    };
  }

  if (isSlaBreach || isFailure) {
    return {
      Icon: AlertTriangle,
      iconColor: "#DC2626",
      iconBg: "#FEE2E2",
      title: "Exception detected",
      sentence: `${row.agent} failed to provision ${item}${who}`,
      statusPhrase: "escalated for human action",
    };
  }

  if (isRetry) {
    return {
      Icon: RotateCw,
      iconColor: "#D97706",
      iconBg: "#FEF3C7",
      title: "Retry initiated",
      sentence: `${row.agent} is retrying ${item}${who}`,
      statusPhrase: row.agent,
    };
  }

  if (isCompleted) {
    return {
      Icon: CheckCircle2,
      iconColor: "#16A34A",
      iconBg: "#DCFCE7",
      title: "Downstream system updated",
      sentence: `${row.agent} provisioned ${item}${who}`,
      statusPhrase: "downstream action completed",
    };
  }

  return {
    Icon: Activity,
    iconColor: "#6B7280",
    iconBg: "#F3F4F6",
    title: row.action,
    sentence: `${row.agent}${who}`,
    statusPhrase: row.status ? row.status : row.agent,
  };
}
