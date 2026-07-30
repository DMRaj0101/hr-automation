"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOnboardingDetail } from "@/hooks/useOnboardingDetail";
import { useChecklist } from "@/hooks/useEmployee";
import { useMonitoring } from "@/hooks/useMonitoring";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ProvisioningChecklist } from "@/components/employee/ProvisioningChecklist";
import { OnboardingSummaryCards } from "@/components/onboarding/OnboardingSummaryCards";
import { AlertCard } from "@/components/onboarding/AlertCard";
import { SystemHealthGrid } from "@/components/onboarding/SystemHealthGrid";
import { Button } from "@/components/ui/button";
import { OnboardingAlert } from "@/types/onboarding";

export default function OnboardingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { employee, detail } = useOnboardingDetail(id);
  const { data: checklist } = useChecklist(id);
  const { systemHealth } = useMonitoring();

  const [alerts, setAlerts] = useState<OnboardingAlert[]>([]);

  useEffect(() => {
    if (detail.data) setAlerts(detail.data.alerts);
  }, [detail.data]);

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  if (employee.isLoading || !employee.data) {
    return <div className="page-content text-vantara-text-muted">Loading...</div>;
  }

  const emp = employee.data;
  const od = detail.data;

  return (
    <div className="page-content space-y-5">
      <Link
        href="/onboarding"
        className="inline-block text-[13px] font-semibold"
        style={{ color: "#D9A653", marginBottom: 20 }}
      >
        ← Onboarding Tracker
      </Link>

      <div className="flex items-center gap-4">
        <Avatar name={emp.name} size={56} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-vantara-navy">{emp.name}</h1>
            <StatusBadge status={od?.status ?? emp.status} />
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
            >
              {od?.type ?? "Onboarding"}
            </span>
          </div>
          <p className="mt-1 text-sm text-vantara-text-muted">
            {emp.id} · {emp.title}
          </p>
        </div>
      </div>

      <OnboardingSummaryCards
        fields={[
          { label: "Manager", value: emp.manager },
          { label: "Start Date", value: od?.startDate ?? emp.start ?? "—" },
          { label: "Planned Completion", value: od?.plannedCompletion ?? emp.est ?? "—" },
          { label: "Days Remaining", value: `${od?.daysRemaining ?? emp.remaining ?? "—"}` },
        ]}
      />

      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-vantara-navy">Overall Progress</span>
          <span className="font-semibold text-vantara-navy">{emp.progress}%</span>
        </div>
        <ProgressBar value={emp.progress} className="mt-3" />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card">
          <h3 className="font-semibold text-vantara-navy">Provisioning Checklist</h3>
          <div className="mt-4">
            <ProvisioningChecklist items={checklist ?? []} />
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-vantara-navy">Active Alerts</h3>
          <div className="mt-4 flex flex-col gap-3.5">
            {alerts.length === 0 && (
              <p className="text-sm text-vantara-text-muted">No active alerts.</p>
            )}
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} />
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-vantara-navy">System Health Status</h3>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
          >
            Attention Needed
          </span>
        </div>
        <div className="mt-4">
          <SystemHealthGrid items={systemHealth.data ?? []} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => router.push("/tickets")}>
          View Tickets
        </Button>
        <Button variant="secondary">View Timeline</Button>
        <Button variant="secondary">View System Details</Button>
        <Button>Export</Button>
      </div>
    </div>
  );
}
