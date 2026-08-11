// Live event feed endpoint doesn't exist yet -- shows a not-available
// placeholder instead of a mock event until the backend ships it.
export function LiveBanner() {
  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="rounded-full"
          style={{ width: 10, height: 10, backgroundColor: "#9CA3AF" }}
        />
        <span className="font-semibold text-vantara-navy">Live events</span>
      </div>
      <span className="text-sm text-vantara-text-muted">Data isn&apos;t available yet</span>
    </div>
  );
}
