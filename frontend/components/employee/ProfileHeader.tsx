import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { employeeTypeStyle } from "@/lib/utils";
import { Employee } from "@/types/employee";

export function ProfileHeader({ employee }: { employee: Employee }) {
  const { bg, text } = employeeTypeStyle(employee.type);
  return (
    <div className="flex items-center gap-4">
      <Avatar name={employee.name} size={64} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-vantara-navy">{employee.name}</h1>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ backgroundColor: bg, color: text }}
          >
            {employee.type}
          </span>
          <StatusBadge status={employee.status} />
        </div>
        <p className="mt-1 text-sm text-vantara-text-muted">
          {employee.id} · {employee.dept} · {employee.title}
        </p>
      </div>
    </div>
  );
}
