"use client";

import { useMonitoring } from "@/hooks/useMonitoring";
import { LiveBanner } from "@/components/monitoring/LiveBanner";
import { SystemHealthGrid } from "@/components/onboarding/SystemHealthGrid";
import { ActiveRequestsTable } from "@/components/monitoring/ActiveRequestsTable";

export default function MonitoringAgentPage() {
  const { monitoring, systemHealth } = useMonitoring();

  if (monitoring.isLoading || !monitoring.data) {
    return <div className="page-content text-vantara-text-muted">Loading monitoring console...</div>;
  }

  const data = monitoring.data;

  return (
    <div className="page-content">
      <h1 className="page-title">Monitoring Agent Console</h1>
      <p className="page-subtitle">
        Real-time visibility into system health and active provisioning requests.
      </p>

      <div className="space-y-5">
        <LiveBanner lastEvent={data.lastEvent} />

        <div className="card">
          <h3 className="font-semibold text-vantara-navy">System Health</h3>
          <div className="mt-4">
            <SystemHealthGrid items={systemHealth.data ?? []} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-vantara-navy">Active Requests</h3>
          <div className="mt-4">
            <ActiveRequestsTable requests={data.activeRequests} />
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: "#FEE2E2", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 className="mb-3 font-semibold" style={{ color: "#991B1B" }}>SLA Warning</h3>
          <div
            className="grid items-center text-sm"
            style={{
              gridTemplateColumns: "1fr 1.2fr 1.4fr 0.8fr 1fr 1fr",
              color: "#991B1B",
            }}
          >
            <span className="font-semibold">{data.slaWarning.ticketId}</span>
            <span>{data.slaWarning.employee}</span>
            <span>{data.slaWarning.item}</span>
            <span>{data.slaWarning.team}</span>
            <span>Since {data.slaWarning.since}</span>
            <span className="font-semibold">{data.slaWarning.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
