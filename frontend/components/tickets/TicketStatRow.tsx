import { StatCard } from "@/components/common/StatCard";
import { TicketStatusSummary } from "@/types/onboarding";

export function TicketStatRow({ data }: { data: TicketStatusSummary }) {
  return (
    <div className="grid grid-cols-4 gap-5">
      <StatCard label="Open" value={data.open} valueClassName="text-[#1D4ED8]" />
      <StatCard label="In Progress" value={data.inProgress} valueClassName="text-[#92400E]" />
      <StatCard label="Pending" value={data.pending} valueClassName="text-[#DC2626]" />
      <StatCard label="Closed" value={data.closed} valueClassName="text-[#166534]" />
    </div>
  );
}