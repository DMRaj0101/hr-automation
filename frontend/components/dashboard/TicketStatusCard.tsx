import { TicketStatusSummary } from "@/types/onboarding";

export function TicketStatusCard({
  data,
}: {
  data: TicketStatusSummary;
}) {
  const rows = [
    {
      label: "Open",
      count: data.open,
    },
    {
      label: "In Progress",
      count: data.inProgress,
    },
    {
      label: "Pending",
      count: data.pending,
    },
    {
      label: "Closed",
      count: data.closed,
    },
  ];

  const max = Math.max(
    ...rows.map((row) => row.count),
    1
  );

  return (
    <div className="dashboard-card dashboard-ticket-card">

      <div className="dashboard-section-header">
        <div className="dashboard-section-icon">
          ▣
        </div>

        <h3 className="dashboard-card-title">
          Ticket Status
        </h3>
      </div>

      <div className="dashboard-ticket-body">
        {rows.map((row) => (
          <div
            key={row.label}
            className="dashboard-ticket-row"
          >
            <div className="dashboard-ticket-row-header">
              <span>
                {row.label}
              </span>

              <strong>
                {row.count}
              </strong>
            </div>

            <div className="dashboard-ticket-track">
              <div
                className="dashboard-ticket-progress"
                style={{
                  width: `${(row.count / max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}