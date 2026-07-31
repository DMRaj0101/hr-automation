export function InfoCard({
  title,
  fields,
}: {
  title: string;
  fields: { label: string; value: string }[];
}) {
  return (
    <div className="ep-glass ep-info-card">
      <h3 className="ep-info-title">{title}</h3>

      <div className="ep-info-grid">
        {fields.map((field) => (
          <div key={field.label} className="ep-info-item">
            <div className="ep-info-label">
              {field.label}
            </div>

            <div className="ep-info-value">
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}