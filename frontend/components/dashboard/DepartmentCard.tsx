import { ProgressBar } from "@/components/common/ProgressBar";
import { DepartmentSummary } from "@/types/onboarding";

export function DepartmentCard({
  dept,
}: {
  dept: DepartmentSummary;
}) {
  return (
    <div className="dashboard-card dashboard-department-card">

      <div className="dashboard-department-icon">
        {dept.name === "Law" && "⚖"}
        {dept.name === "Audit" && "▣"}
        {dept.name === "Tax" && "▤"}
      </div>

      <div className="dashboard-department-content">
        <div className="dashboard-department-header">
          <h4 className="dashboard-department-title">
            {dept.name}
          </h4>

          <span className="dashboard-department-arrow">
            ›
          </span>
        </div>

        <p className="dashboard-department-meta">
          {dept.employees} employees
          <span> · </span>
          {dept.openTickets} open tickets
        </p>

        <ProgressBar
          value={dept.avgCompletion}
          className="dashboard-department-progress"
          height={5}
          fillBackground="#D9A653"
        />

        <p className="dashboard-department-completion">
          {dept.avgCompletion}% avg completion
        </p>
      </div>
    </div>
  );
}