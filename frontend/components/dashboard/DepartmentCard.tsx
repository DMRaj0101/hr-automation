import { ProgressBar } from "@/components/common/ProgressBar";
import { DepartmentSummary } from "@/types/onboarding";

const DEPT_ICON: Record<string, string> = {
  Law: "⚖",
  Audit: "▣",
  Tax: "▤",
};

export function DepartmentCard({ dept }: { dept: DepartmentSummary }) {
  const isOnTrack = dept.avgCompletion >= 85;

  return (
    <div className="dashboard-card dashboard-department-card">
      <div className="dashboard-department-top-row">
        <div className="dashboard-department-identity">
          <div className="dashboard-department-icon">
            {DEPT_ICON[dept.name] ?? "◆"}
          </div>

          <div>
            <h4 className="dashboard-department-title">{dept.name}</h4>
            <p className="dashboard-department-meta">
              {dept.employees} employees <span> · </span>
              {dept.openTickets} open tickets
            </p>
          </div>
        </div>

        <span className="dashboard-department-arrow">›</span>
      </div>

      <div className="dashboard-department-stats-row">
        <span
          className={`dashboard-status-pill ${
            isOnTrack ? "dashboard-status-pill-good" : "dashboard-status-pill-warn"
          }`}
        >
          <span
            className={`dashboard-health-dot ${
              isOnTrack ? "dashboard-health-dot-up" : "dashboard-health-dot-down"
            }`}
          />
          {isOnTrack ? "On Track" : "Needs Attention"}
        </span>

        <div className="dashboard-department-stat">
          <div className="dashboard-department-stat-num">{dept.openTickets}</div>
          <div className="dashboard-department-stat-label">Open Tickets</div>
        </div>

        <div className="dashboard-department-stat">
          <div className="dashboard-department-stat-num">{dept.avgCompletion}%</div>
          <div className="dashboard-department-stat-label">Completion</div>
        </div>
      </div>

      <ProgressBar
        value={dept.avgCompletion}
        height={6}
        className="dashboard-department-progress-track"
        fillBackground={isOnTrack ? "#1fa971" : "#d99818"}
      />
    </div>
  );
}