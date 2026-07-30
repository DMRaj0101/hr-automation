export function ProgressBar({
  value,
  label,
  className,
  height = 6,
  trackColor = "#F3F4F6",
  fillColor = "#D9A653",
}: {
  value: number;
  label?: string;
  className?: string;
  height?: number;
  trackColor?: string;
  fillColor?: string;
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
          className="h-full transition-all"
          style={{ width: `${clamped}%`, backgroundColor: fillColor, borderRadius: height / 2 }}
        />
      </div>
    </div>
  );
}
