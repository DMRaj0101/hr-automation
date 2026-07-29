import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="card-sm">
      <div className="mb-3 text-sm font-medium text-vantara-text-muted">{label}</div>
      <div className={cn("text-[40px] font-bold leading-none text-vantara-navy", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
