import { ErrorLogEntry } from "@/types/onboarding";

export function ErrorLogCard({ data }: { data: ErrorLogEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="dashboard-card dashboard-error-card dashboard-sla-success">
        <div className="dashboard-sla-header">
          <span className="dashboard-sla-badge dashboard-sla-badge-success">
            No Provisioning Errors
          </span>
          <span className="dashboard-sla-bell">⚠️</span>
        </div>

        <p className="dashboard-sla-message">
          No provisioning errors reported.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-card dashboard-error-card">
      <div className="dashboard-sla-header">
        <span className="dashboard-sla-badge">Error Log</span>
        <span className="dashboard-sla-bell">⚠️</span>
      </div>

      <ul className="dashboard-error-list">
        {data.map((entry, index) => (
          <li key={`${entry.employeeId}-${entry.agentname}-${index}`} className="dashboard-error-item">
            <p className="dashboard-sla-message">
              <strong>{entry.employee}</strong> — <strong>{entry.agentname}</strong>{" "}
              failed{" "}
              <span className="dashboard-sla-duration">{entry.duration}</span> ago.
            </p>
            <p className="dashboard-error-detail">{entry.errorDetail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
