import { SlaWarning, ErrorLogEntry } from "@/types/onboarding";

export function SlaWarningCard({
  data,
  errors,
}: {
  data: SlaWarning;
  errors: ErrorLogEntry[];
}) {
  const hasSla = Boolean(data.ticketId);
  const hasErrors = errors.length > 0;

  return (
    <div className="dashboard-card dashboard-sla-card">
      {/* SLA section */}
      <div className="dashboard-sla-header">
        <span
          className={
            hasSla
              ? "dashboard-sla-badge"
              : "dashboard-sla-badge dashboard-sla-badge-success"
          }
        >
          {hasSla ? "SLA Warning" : "No SLA Breaches"}
        </span>
        <span className="dashboard-sla-bell">🔔</span>
      </div>

      {hasSla ? (
        <p className="dashboard-sla-message">
          Ticket <strong>{data.ticketId}</strong> for{" "}
          <strong>{data.employee}</strong> ({data.department}) —{" "}
          <strong>{data.item}</strong> has been pending for{" "}
          <span className="dashboard-sla-duration">{data.duration}</span>.
        </p>
      ) : (
        <p className="dashboard-sla-message">
          No ticket is currently breaching its SLA.
        </p>
      )}

      {/* Error log section */}
      <div className="dashboard-sla-header dashboard-error-subheader">
        <span
          className={
            hasErrors
              ? "dashboard-sla-badge"
              : "dashboard-sla-badge dashboard-sla-badge-success"
          }
        >
          {hasErrors ? "Error Log" : "No Provisioning Errors"}
        </span>
        <span className="dashboard-sla-bell">⚠️</span>
      </div>

      {hasErrors ? (
        <ul className="dashboard-error-list">
          {errors.map((entry, index) => (
            <li
              key={`${entry.employeeId}-${entry.agentname}-${index}`}
              className="dashboard-error-item"
            >
              <p className="dashboard-sla-message">
                <strong>{entry.employee}</strong> —{" "}
                <strong>{entry.agentname}</strong> failed{" "}
                <span className="dashboard-sla-duration">
                  {entry.duration}
                </span>{" "}
                ago.
              </p>
              <p className="dashboard-error-detail">{entry.errorDetail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-sla-message">
          No provisioning errors reported.
        </p>
      )}
    </div>
  );
}