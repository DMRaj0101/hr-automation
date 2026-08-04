import { Star, Users, UserCheck, Clock3, XCircle, User, FileText, Tag } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { employeeTypeStyle } from "@/lib/utils";
import { Employee } from "@/types/employee";

// Icon + color per status. Extend this if you add more status values.
const statusStyle: Record<
  string,
  { icon: React.ElementType; bg: string; color: string }
> = {
  onboarding: { icon: Users, bg: "#FDF1E3", color: "#D97706" },
  active: { icon: UserCheck, bg: "#E7F9EE", color: "#16A34A" },
  pending: { icon: Clock3, bg: "#F1F5F9", color: "#64748B" },
  offboarding: { icon: XCircle, bg: "#FEE2E2", color: "#DC2626" },
};

function getStatusStyle(status: string) {
  return statusStyle[status.toLowerCase()] ?? statusStyle.onboarding;
}

export function ProfileHeader({ employee }: { employee: Employee }) {
  const { bg: typeBg, text: typeColor } = employeeTypeStyle(employee.type);
  const { icon: StatusIcon, bg: statusBg, color: statusColor } = getStatusStyle(
    employee.status
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ================= Avatar + name + pills ================= */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar name={employee.name} size={64} />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-vantara-navy">
              {employee.name}
            </h1>

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
              style={{ backgroundColor: typeBg, color: typeColor }}
            >
              <Star size={13} fill="currentColor" />
              {employee.type}
            </span>

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize"
              style={{ backgroundColor: statusBg, color: statusColor }}
            >
              <StatusIcon size={13} />
              {employee.status}
            </span>
          </div>
        </div>
      </div>

      {/* ================= Info cards row ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoPill
          icon={<User size={17} />}
          cardBg="#F6F2FE"
          iconBg="#7C5CFC"
          iconColor="#ffffff"
          label="EMP ID"
          value={employee.id}
        />
        <InfoPill
          icon={<FileText size={17} />}
          cardBg="#EEF4FE"
          iconBg="#2563EB"
          iconColor="#ffffff"
          label="DEPARTMENT"
          value={employee.dept}
        />
        <InfoPill
          icon={<Tag size={17} />}
          cardBg="#EBFAF1"
          iconBg="#16A34A"
          iconColor="#ffffff"
          label="ROLE"
          value={employee.title}
        />
      </div>
    </div>
  );
}

function InfoPill({
  icon,
  cardBg,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ backgroundColor: cardBg }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-vantara-text-faint">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-vantara-navy">{value}</p>
      </div>
    </div>
  );
}