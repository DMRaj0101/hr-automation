"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { StatRow } from "@/components/dashboard/StatRow";
import { IntegrationCoverageCard } from "@/components/dashboard/IntegrationCoverageCard";
import { SlaWarningCard } from "@/components/dashboard/SlaWarningCard";
import { DepartmentCard } from "@/components/dashboard/DepartmentCard";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { TicketStatusCard } from "@/components/dashboard/TicketStatusCard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <div className="page-content text-vantara-text-muted">Loading dashboard...</div>;
  }

  return (
    <div className="page-content">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Welcome back — here&apos;s what&apos;s happening across onboarding today.
      </p>

      <div className="space-y-5">
        <StatRow stats={data.stats} />

        <div className="grid gap-5" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
          <IntegrationCoverageCard data={data.integrationCoverage} />
          <SlaWarningCard data={data.slaWarning} />
        </div>

        <div className="grid grid-cols-3 gap-5">
          {data.departments.map((dept) => (
            <DepartmentCard key={dept.name} dept={dept} />
          ))}
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <SystemHealthCard items={data.systemHealth} />
          <TicketStatusCard data={data.ticketStatus} />
        </div>
      </div>
    </div>
  );
}
