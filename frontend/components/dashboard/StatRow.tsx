import { StatCard } from "@/components/common/StatCard";
import { DashboardStats } from "@/types/onboarding";

export function StatRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-4 gap-5">
      <StatCard label="Total Onboarding Requests" value={stats.total} valueClassName="text-vantara-navy" />
      <StatCard label="Completed" value={stats.completed} valueClassName="text-[#166534]" />
      <StatCard label="In Progress" value={stats.inProgress} valueClassName="text-[#92400E]" />
      <StatCard label="Failed / Needs Attention" value={stats.failed} valueClassName="text-[#991B1B]" />
    </div>
  );
}
