import { SlaWarning } from "@/types/onboarding";

export function SlaWarningCard({ data }: { data: SlaWarning }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: "#FEF3C7", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <span
        className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: "#92400E", color: "#FEF3C7" }}
      >
        SLA WARNING
      </span>
      <p className="mt-3 text-sm text-amber-900">
        Ticket <strong>{data.ticketId}</strong> for <strong>{data.employee}</strong> (
        {data.department}) — <strong>{data.item}</strong> has been pending for{" "}
        <strong>{data.duration}</strong>.
      </p>
    </div>
  );
}
