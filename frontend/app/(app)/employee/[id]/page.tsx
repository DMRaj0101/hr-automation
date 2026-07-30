"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEmployee, useChecklist } from "@/hooks/useEmployee";
import { ProfileHeader } from "@/components/employee/ProfileHeader";
import { InfoCard } from "@/components/employee/InfoCard";
import { ProvisioningChecklist } from "@/components/employee/ProvisioningChecklist";
import { ProgressBar } from "@/components/common/ProgressBar";
import { formatDate } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: employee, isLoading } = useEmployee(id);
  const { data: checklist } = useChecklist(id);

  if (isLoading || !employee) {
    return <div className="page-content text-vantara-text-muted">Loading employee...</div>;
  }

  const doneCount = checklist?.filter((c) => c.status === "done").length ?? 0;
  const totalCount = checklist?.length ?? 0;

  return (
    <div className="page-content mx-auto max-w-[900px] space-y-5">
      <Link
        href="/employee-directory"
        className="inline-block text-[13px] font-semibold"
        style={{ color: "#D9A653", marginBottom: 20 }}
      >
        ← Employee Directory
      </Link>

      <ProfileHeader employee={employee} />

      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-vantara-navy">Onboarding Progress</span>
          <span className="font-semibold text-vantara-navy">{employee.progress}%</span>
        </div>
        <ProgressBar value={employee.progress} className="mt-3" />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <InfoCard
          title="Personal Information"
          fields={[
            { label: "Email", value: employee.email },
            { label: "Phone", value: employee.phone },
            { label: "Office", value: employee.office },
          ]}
        />
        <InfoCard
          title="Employment Details"
          fields={[
            { label: "Manager", value: employee.empManager },
            { label: "Hire Date", value: formatDate(employee.hireDate) },
            { label: "Years of Service", value: employee.yearsOfService },
            { label: "Job Level", value: employee.jobLevel },
          ]}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-vantara-navy">Provisioning Checklist</h3>
          <span className="text-sm text-vantara-text-muted">
            {doneCount} / {totalCount} complete
          </span>
        </div>
        <div className="mt-4">
          <ProvisioningChecklist items={checklist ?? []} />
        </div>
      </div>
    </div>
  );
}
