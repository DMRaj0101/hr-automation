export function InfoCard({
  title,
  fields,
}: {
  title: string;
  fields: { label: string; value: string }[];
}) {
  return (
    <div className="card">
      <h3 className="font-semibold text-vantara-navy">{title}</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="mb-1 text-xs" style={{ color: "#9CA3AF" }}>{f.label}</div>
            <div className="text-sm font-medium text-vantara-navy">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
