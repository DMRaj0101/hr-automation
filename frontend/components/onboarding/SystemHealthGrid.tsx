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
            className="rounded-xl"
            style={{ border: "1px solid #E5E7EB", padding: "12px 14px" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: text }}
              />
              <span className="text-sm font-medium text-vantara-navy">{item.name}</span>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-vantara-text-muted">{item.latency ?? "—"}</span>
              <span className="font-semibold" style={{ color: text }}>
                {item.status}
              </span>
            </div>

            <svg width="100%" height="22" viewBox="0 0 100 22" className="mt-2">
              <polyline
                points="0,16 15,10 30,14 45,6 60,12 75,4 90,10 100,8"
                fill="none"
                stroke={text}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}