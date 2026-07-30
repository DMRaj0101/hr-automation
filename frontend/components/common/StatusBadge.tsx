import { statusStyle } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const { bg, text } = statusStyle(status);
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {status}
    </span>
  );
}
