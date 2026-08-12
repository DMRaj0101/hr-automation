import { DashboardStats } from "@/types/onboarding";

type StatRowProps = {
  stats: DashboardStats;
};

function StatIcon({
  type,
}: {
  type: "total" | "completed" | "progress" | "failed" | "not-started";
}) {
  if (type === "total") {
    return (
      <div className="dashboard-stat-icon dashboard-stat-icon-blue">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    );
  }

  if (type === "completed") {
    return (
      <div className="dashboard-stat-icon dashboard-stat-icon-green">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      </div>
    );
  }

  if (type === "progress") {
    return (
      <div className="dashboard-stat-icon dashboard-stat-icon-gold">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 2h12" />
          <path d="M6 22h12" />
          <path d="M8 2c0 5 4 5 4 10s-4 5-4 10" />
          <path d="M16 2c0 5-4 5-4 10s4 5 4 10" />
        </svg>
      </div>
    );
  }

  if (type === "failed") {
    return (
      <div className="dashboard-stat-icon dashboard-stat-icon-red">
        <svg
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M10.3 3.5 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>
    );
  }

  return (
    <div className="dashboard-stat-icon dashboard-stat-icon-gray">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    </div>
  );
}

function StatItem({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "total" | "completed" | "progress" | "failed" | "not-started";
}) {
  return (
    <div className="dashboard-stat-card">
      <StatIcon type={type} />

      <div className="dashboard-stat-content">
        <div className="dashboard-stat-top">
          <span className="dashboard-stat-label">
            {label}
          </span>

          <button
            type="button"
            className="dashboard-stat-menu"
            aria-label={`${label} options`}
          >
            ⋮
          </button>
        </div>

        <div
          className={`dashboard-stat-value dashboard-stat-value-${type}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <div className="dashboard-stat-row">
      <StatItem
        label="Total Onboarding Requests"
        value={stats.total}
        type="total"
      />

      <StatItem
        label="Completed"
        value={stats.completed}
        type="completed"
      />

      <StatItem
        label="In Progress"
        value={stats.inProgress}
        type="progress"
      />

      <StatItem
        label="Failed / Needs Attention"
        value={stats.failed}
        type="failed"
      />

      <StatItem
        label="Not Started"
        value={(stats as any).notStarted}
        type="not-started"
      />
    </div>
  );
}