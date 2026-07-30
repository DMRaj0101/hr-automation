import { statusStyle } from "@/lib/utils";
import { SystemHealthDetail } from "@/types/monitoring";

export function SystemHealthGrid({ items }: { items: SystemHealthDetail[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => {
        const { text } = statusStyle(item.status);
        return (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-xl"
            style={{ border: "1px solid #E5E7EB", padding: "12px 14px" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: text }}
              />
              <div>
                <div className="text-sm font-medium text-vantara-navy">{item.name}</div>
                {item.latency && (
                  <div className="text-xs text-vantara-text-muted">{item.latency}</div>
                )}
              </div>
            </div>
            <span className="text-xs font-medium" style={{ color: text }}>
              {item.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
