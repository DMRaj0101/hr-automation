import { SlaWarning } from "@/types/onboarding";

export function SlaWarningCard({ data }: { data: SlaWarning }) {
  if (!data.ticketId) {
    return (
      <div className="dashboard-card dashboard-sla-card dashboard-sla-success">
        <div className="dashboard-sla-header">
          <span className="dashboard-sla-badge dashboard-sla-badge-success">
            No SLA Breaches
          </span>
          <span className="dashboard-sla-bell">🔔</span>
        </div>

        <p className="dashboard-sla-message">
          No ticket is currently breaching its SLA.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-card dashboard-sla-card">
      <div className="dashboard-sla-header">
        <span className="dashboard-sla-badge">SLA Warning</span>
        <span className="dashboard-sla-bell">🔔</span>
      </div>

      <p className="dashboard-sla-message">
        Ticket <strong>{data.ticketId}</strong> for{" "}
        <strong>{data.employee}</strong> ({data.department}) —{" "}
        <strong>{data.item}</strong> has been pending for{" "}
        <span className="dashboard-sla-duration">{data.duration}</span>.
      </p>
    </div>
  );
}