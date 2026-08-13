"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { StatRow } from "@/components/dashboard/StatRow";
import { IntegrationCoverageCard } from "@/components/dashboard/IntegrationCoverageCard";
import { SlaWarningCard } from "@/components/dashboard/SlaWarningCard";
import { DepartmentCard } from "@/components/dashboard/DepartmentCard";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { TicketStatusCard } from "@/components/dashboard/TicketStatusCard";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  if (isError) {
    return (
      <div className="page-content text-red-600">
        Failed to load dashboard:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="page-content text-vantara-text-muted">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="page-content dashboard-page">
      <div className="dashboard-container">

        {/* Top statistics */}
        <StatRow stats={data.stats} />

        {/* Integration Coverage + SLA Warning */}
        <div className="dashboard-grid dashboard-grid-coverage">
          <IntegrationCoverageCard
            data={data.integrationCoverage}
          />

          <SlaWarningCard
            data={data.slaWarning}
          />
        </div>

        {/* Departments */}
        <div className="dashboard-departments">
          {data.departments.map((dept) => (
            <DepartmentCard
              key={dept.name}
              dept={dept}
            />
          ))}
        </div>

        {/* System Health + Ticket Status */}
        <div className="dashboard-grid dashboard-grid-bottom">
          <SystemHealthCard
            items={data.systemHealth}
          />

          <TicketStatusCard
            data={data.ticketStatus}
          />
        </div>

      </div>
    </div>
  );
}