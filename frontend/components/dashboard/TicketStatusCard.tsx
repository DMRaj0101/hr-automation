import { TicketStatusSummary } from "@/types/onboarding";

export function TicketStatusCard({ data }: { data: TicketStatusSummary }) {
  const rows = [
    { label: "Open", count: data.open, color: "#1D4ED8" },
    { label: "In Progress", count: data.inProgress, color: "#D9A653" },
    { label: "Pending", count: data.pending, color: "#92400E" },
    { label: "Closed", count: data.closed, color: "#166534" },
  ];
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="card">
      <h3 className="font-semibold text-vantara-navy">Ticket Status</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-vantara-navy">{row.label}</span>
              <span className="font-medium text-vantara-navy">{row.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.count / max) * 100}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
