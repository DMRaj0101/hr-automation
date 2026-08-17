"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { StatRow } from "@/components/dashboard/StatRow";
import { LifecycleToggle, LifecycleKey } from "@/components/dashboard/Lifecycletoggle";
import { SlaWarningCard } from "@/components/dashboard/SlaWarningCard";
import { OrchestrationOverviewCard } from "@/components/dashboard/Orchestrationoverviewcard";
import { SystemStatusCards } from "@/components/dashboard/Systemstatuscards";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleKey>("all");

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

  // Offboarding isn't tracked yet — "All" and "Onboarding" both read the same
  // stats for now. Once an offboarding dataset exists, branch here, e.g.:
  //   const statsToShow =
  //     lifecycleFilter === "offboarding" ? data.offboardingStats : data.stats;
  const statsToShow = data.stats;

  return (
    <div className="page-content dashboard-page">
      <div className="dashboard-container">

        <div className="dashboard-top-bar dashboard-top-bar-toggle-only">
          <LifecycleToggle value={lifecycleFilter} onChange={setLifecycleFilter} />
        </div>

        {/* Top statistics */}
        <StatRow
          stats={statsToShow}
          mode={lifecycleFilter === "onboarding" ? "onboarding" : "all"}
        />

        {/* Orchestration Overview + SLA Warning (with error log inside) */}
        <div className="dashboard-grid dashboard-grid-coverage">
          <OrchestrationOverviewCard totalActions={data.totalActions} totalRequests={data.stats.total} />
          <SlaWarningCard data={data.slaWarning} errors={data.errorReport} />
        </div>

        {/* Downstream system status */}
        <SystemStatusCards actionCounts={data.actionCounts} />

      </div>
    </div>
  );
}