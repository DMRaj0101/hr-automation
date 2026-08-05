"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ServerCog,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  BarChart2,
} from "lucide-react";
import { useEmployee, useChecklist } from "@/hooks/useEmployee";
import { useHeaderStore } from "@/store/headerStore";
import { ProfileHeader } from "@/components/employee/ProfileHeader";
import { InfoCard } from "@/components/employee/InfoCard";
import { ProvisioningChecklist } from "@/components/employee/ProvisioningChecklist";
import { formatDate } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: employee, isLoading } = useEmployee(id);
  const { data: checklist } = useChecklist(id);
  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader({
      title: "Employee profile",
      subtitle: "View employee details and onboarding progress",
      icon: <User size={22} strokeWidth={2} />,
    });
  }, [setHeader]);

  // drives the 0 -> value progress bar grow animation on mount
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (!employee) return;
    const t = setTimeout(() => setBarWidth(employee.progress ?? 0), 120);
    return () => clearTimeout(t);
  }, [employee]);

  if (isLoading || !employee) {
    return (
      <div className="ep-page">
        <div className="ep-wrap">
          <div className="ep-glass ep-profile-card flex h-40 items-center justify-center">
            <span className="text-sm text-vantara-text-muted">
              Loading employee...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const doneCount = checklist?.filter((c) => c.status === "done").length ?? 0;
  const totalCount = checklist?.length ?? 0;

  return (
    <div className="ep-page">
      <div className="ep-wrap">
        {/* ProfileHeader now sits inside the same white card box style
            used by the Onboarding Progress card below it. */}
        <div className="ep-glass ep-profile-card">
          <ProfileHeader employee={employee} />
        </div>

        <div className="ep-glass ep-progress-card">
          <div className="ep-progress-top">
            <span>Onboarding Progress</span>
            <span>{employee.progress}%</span>
          </div>
          <div className="ep-bar">
            <div className="ep-fill" style={{ width: `${barWidth}%` }} />
          </div>
        </div>

        <div className="ep-grid2">
          <InfoCard
            title="Personal Information"
            icon={User}
            headerIconBg="#EDE9FE"
            headerIconColor="#7C5CFC"
            accentColor="#7C5CFC"
            layout="list"
            fields={[
              {
                label: "Email",
                value: employee.email,
                icon: Mail,
                iconBg: "#EDE9FE",
                iconColor: "#7C5CFC",
              },
              {
                label: "Phone",
                value: employee.phone,
                icon: Phone,
                iconBg: "#E0EEFE",
                iconColor: "#2563EB",
              },
              {
                label: "Office",
                value: employee.office,
                icon: MapPin,
                iconBg: "#FDEDDD",
                iconColor: "#E8A33D",
              },
            ]}
          />
          <InfoCard
            title="Employment Details"
            icon={Briefcase}
            headerIconBg="#FDEDDD"
            headerIconColor="#E8A33D"
            accentColor="#E8A33D"
            layout="list"
            fields={[
              {
                label: "Manager",
                value: employee.empManager,
                icon: User,
                iconBg: "#FDEDDD",
                iconColor: "#E8A33D",
              },
              {
                label: "Hire Date",
                value: formatDate(employee.hireDate),
                icon: Calendar,
                iconBg: "#EDE9FE",
                iconColor: "#7C5CFC",
              },
              {
                label: "Years of Service",
                value: String(employee.yearsOfService),
                icon: Clock,
                iconBg: "#E4F9EE",
                iconColor: "#16A34A",
              },
              {
                label: "Job Level",
                value: employee.jobLevel,
                icon: BarChart2,
                iconBg: "#E0EEFE",
                iconColor: "#2563EB",
              },
            ]}
          />
        </div>

        <div className="ep-glass ep-checklist-card">
          <div className="ep-section-title">
            <h2>
              <span className="ep-title-icon">
                <ServerCog size={16} strokeWidth={2.4} />
              </span>
              Provisioning Checklist
            </h2>
            <span className="ep-counter">
              {doneCount} / {totalCount} complete
            </span>
          </div>

          <ProvisioningChecklist items={checklist ?? []} />
        </div>
      </div>
    </div>
  );
}