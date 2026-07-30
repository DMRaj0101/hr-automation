import { ProgressBar } from "@/components/common/ProgressBar";
import { DepartmentSummary } from "@/types/onboarding";

export function DepartmentCard({ dept }: { dept: DepartmentSummary }) {
  return (
    <div className="card-sm">
      <h4 className="font-semibold text-vantara-navy">{dept.name}</h4>
      <p className="mt-1 text-sm text-vantara-text-muted">
        {dept.employees} employees · {dept.openTickets} open tickets
      </p>
      <ProgressBar value={dept.avgCompletion} className="mt-3" height={8} fillColor="#D9A653" />
      <p className="mt-1.5 text-xs text-vantara-text-muted">
        {dept.avgCompletion}% avg completion
      </p>
    </div>
  );
}
