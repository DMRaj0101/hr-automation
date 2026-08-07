import { cn } from "@/lib/utils";

interface LogoProps {
  /** Use on dark backgrounds (e.g. the navy sidebar) */
  light?: boolean;
  className?: string;
}

export function Logo({ light = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-4 min-w-0", className)}>
      {/* Gold gradient mark */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-md"
        style={{
          background: "linear-gradient(135deg, #F1C878 0%, #D9A653 55%, #B8823A 100%)",
        }}
      >
        <span className="font-serif text-lg font-bold leading-none text-vantara-navy">V</span>
      </div>

      <div className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-serif text-base font-bold tracking-[0.06em]",
            light ? "text-white" : "text-vantara-navy"
          )}
        >
          VANTARA
        </span>
        <span className="mt-1 block truncate text-[8px] font-semibold tracking-[0.05em] text-vantara-gold">
          PEOPLE OPERATIONS PLATFORM
        </span>
      </div>
    </div>
  );
}