import { priorityStyle } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: string }) {
  const { bg, text } = priorityStyle(priority);
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {priority}
    </span>
  );
}
