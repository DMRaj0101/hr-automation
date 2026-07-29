export function OnboardingSummaryCards({
  fields,
}: {
  fields: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {fields.map((f) => (
        <div
          key={f.label}
          className="rounded-2xl bg-white"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "18px 20px",
          }}
        >
          <div className="text-xs text-vantara-text-muted">{f.label}</div>
          <div className="mt-1 font-semibold text-vantara-navy">{f.value}</div>
        </div>
      ))}
    </div>
  );
}
