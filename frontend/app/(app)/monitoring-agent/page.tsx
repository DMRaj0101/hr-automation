"use client";

import { useMonitoring } from "@/hooks/useMonitoring";
import { LiveBanner } from "@/components/monitoring/LiveBanner";
import { SystemHealthGrid } from "@/components/onboarding/SystemHealthGrid";
import { AgentActivityTable } from "@/components/monitoring/AgentActivityTable";
import { SlaWarningsTable } from "@/components/monitoring/SlaWarningsTable";

export default function MonitoringAgentPage() {
  const { systemHealth, slaWarnings } = useMonitoring();

  return (
    <div className="page-content">
      <h1 className="page-title">Monitoring Agent Console</h1>

      <p className="page-subtitle">
        Real-time visibility into system health and active provisioning requests.
      </p>

      <div className="space-y-5">
        {/* --------------------------------------------------------------- */}
        {/* Live Status                                                      */}
        {/* --------------------------------------------------------------- */}

        <LiveBanner />

        {/* --------------------------------------------------------------- */}
        {/* System Health                                                    */}
        {/* --------------------------------------------------------------- */}

        <div className="card">
          <div className="flex items-baseline gap-2">
            <h3 className="font-semibold text-vantara-navy">
              System Health
            </h3>

            <span className="text-sm text-vantara-text-muted">
              {(systemHealth.data ?? []).length} integrations
            </span>
          </div>

          <div className="mt-4">
            <SystemHealthGrid items={systemHealth.data ?? []} />
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Agent Activity                                                   */}
        {/* --------------------------------------------------------------- */}

        <div className="card">
          <h3 className="font-semibold text-vantara-navy">
            Agent Activity
          </h3>

          <div className="mt-4">
            <AgentActivityTable activity={[]} />
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* SLA Warnings                                                     */}
        {/* --------------------------------------------------------------- */}

        <div className="card">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-vantara-navy">
                SLA Warning
              </h3>

              <span className="text-sm text-vantara-text-muted">
                {slaWarnings.data?.length ?? 0} active
              </span>
            </div>
          </div>

          <div className="mt-4">
            {slaWarnings.isLoading ? (
              <div className="flex h-16 items-center justify-center text-sm text-vantara-text-muted">
                Loading SLA warnings...
              </div>
            ) : slaWarnings.isError ? (
              <div className="flex h-16 items-center justify-center text-sm text-red-600">
                Failed to load SLA warnings.
              </div>
            ) : (
              <SlaWarningsTable warnings={slaWarnings.data ?? []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}