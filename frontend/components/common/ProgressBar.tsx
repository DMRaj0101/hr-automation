export function ProgressBar({
  value,
  label,
  className,
  height = 9,
  trackColor = "rgba(255,255,255,0.08)",
  fillBackground = "linear-gradient(90deg, #e8916b, #e86ba0)",
  shimmer = true,
}: {
  value: number;
  label?: string;
  className?: string;
  height?: number;
  trackColor?: string;
  /** CSS `background` value for the fill — accepts a solid color or a gradient */
  fillBackground?: string;
  shimmer?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-vantara-text-muted">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className="w-full overflow-hidden"
        style={{ height, backgroundColor: trackColor, borderRadius: height / 2 }}
      >
        <div
          className={shimmer ? "pill-shimmer relative h-full transition-all" : "h-full transition-all"}
          style={{ width: `${clamped}%`, background: fillBackground, borderRadius: height / 2 }}
        />
      </div>
    </div>
  );
}