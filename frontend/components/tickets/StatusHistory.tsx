import { StatusHistoryEntry } from "@/types/ticket";

export function StatusHistory({ history }: { history: StatusHistoryEntry[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-vantara-navy">Status History</h3>
      <div className="mt-4 space-y-4">
        {history.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span
              className="shrink-0 rounded-full"
              style={{ width: 10, height: 10, backgroundColor: entry.color }}
            />
            <span className="font-medium text-vantara-navy" style={{ width: 110 }}>
              {entry.status}
            </span>
            <span className="text-sm text-vantara-text-muted">{entry.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
