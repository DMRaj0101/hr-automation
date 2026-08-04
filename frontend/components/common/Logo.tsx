import { cn } from "@/lib/utils";

interface LogoProps {
  light?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export function Logo({ light = false, iconOnly = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Gold ring wrapping the V mark */}
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] p-[2px]"
        style={{
          background: "linear-gradient(180deg, #F3D590 0%, #D9A653 50%, #8A6423 100%)",
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-vantara-navy">
          <span
            className="font-serif text-base font-bold text-vantara-gold"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            V
          </span>
        </div>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-serif text-xl font-semibold tracking-wide",
              light ? "text-white" : "text-vantara-navy"
            )}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            VANTARA
          </span>
         
         
        </div>
      )}
    </div>
  );
}