import { SystemHealthBrief } from "@/types/onboarding";

export function SystemHealthCard({ items }: { items: SystemHealthBrief[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-vantara-navy">System Health</h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-xl"
            style={{ border: "1px solid #E5E7EB", padding: "12px 14px" }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#166534" }} />
            <span className="flex-1 text-sm text-vantara-navy">{item.name}</span>
            <span className="text-xs font-medium" style={{ color: "#166534" }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
