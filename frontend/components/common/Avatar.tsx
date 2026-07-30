import { initials, cn } from "@/lib/utils";

const FONT_SIZE_MAP: Record<number, number> = {
  36: 12,
  56: 17,
  64: 20,
};

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const fontSize = FONT_SIZE_MAP[size] ?? Math.round(size * 0.34);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-vantara-navy font-bold text-white",
        className
      )}
      style={{ width: size, height: size, fontSize }}
    >
      {initials(name)}
    </div>
  );
}
