export function LiveBanner({ lastEvent }: { lastEvent: string }) {
  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="pulse-dot rounded-full"
          style={{ width: 10, height: 10, backgroundColor: "#166534" }}
        />
        <span className="font-semibold text-vantara-navy">Listening for events — live</span>
      </div>
      <span className="text-sm text-vantara-text-muted">{lastEvent}</span>
    </div>
  );
}
