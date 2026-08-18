"use client";

import { useMonitoring } from "@/hooks/useMonitoring";
import { LiveBanner } from "@/components/monitoring/LiveBanner";
import { SystemHealthGrid } from "@/components/onboarding/SystemHealthGrid";
import { AgentActivityTable } from "@/components/monitoring/AgentActivityTable";
import { SlaWarningsTable } from "@/components/monitoring/SlaWarningsTable";

export default function MonitoringAgentPage() {
  const { systemHealth, slaWarnings, recentLogs } = useMonitoring();

  return (
    <div className="page-content">
      <div className="space-y-5">
        {/* --------------------------------------------------------------- */}
        {/* Live Status                                                      */}
        {/* --------------------------------------------------------------- */}

        <LiveBanner
          latest={recentLogs.data?.[0] ?? null}
          isLoading={recentLogs.isLoading}
          isError={recentLogs.isError}
        />

        {/* --------------------------------------------------------------- */}
        {/* System Health                                                    */}
        {/* --------------------------------------------------------------- */}

        <div className="card">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-vantara-navy">
              System Health
            </h3>

            <span className="rounded-full bg-[#EEF2F6] px-2.5 py-0.5 text-xs font-semibold text-vantara-navy">
              {(systemHealth.data?.items ?? []).length} integrations
            </span>
          </div>

          <div className="mt-4">
            <SystemHealthGrid
              items={systemHealth.data?.items ?? []}
              degradedThresholdMs={systemHealth.data?.degradedThresholdMs ?? null}
            />
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Agent Activity                                                   */}
        {/* --------------------------------------------------------------- */}

        <div className="card">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-vantara-navy">
              Agent Activity
            </h3>

            <span className="rounded-full bg-[#EEF2F6] px-2.5 py-0.5 text-xs font-semibold text-vantara-navy">
              {recentLogs.data?.length ?? 0} recent
            </span>
          </div>

          <div className="mt-4">
            {recentLogs.isLoading ? (
              <div className="flex h-32 items-center justify-center text-sm text-vantara-text-muted">
                Loading agent activity...
              </div>
            ) : recentLogs.isError ? (
              <div className="flex h-32 items-center justify-center text-sm text-red-600">
                Failed to load agent activity.
              </div>
            ) : (
              <AgentActivityTable activity={recentLogs.data ?? []} />
            )}
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* SLA Warnings                                                     */}
        {/* --------------------------------------------------------------- */}

        <div className="card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-vantara-navy">
                SLA Warning
              </h3>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  (slaWarnings.data?.length ?? 0) > 0
                    ? "bg-[#FEE2E2] text-[#DC2626]"
                    : "bg-[#EEF2F6] text-vantara-navy"
                }`}
              >
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