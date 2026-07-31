import { statusStyle, cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { bg, text } = statusStyle(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold",
        className
      )}
      style={{
        backgroundColor: bg,
        color: text,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}