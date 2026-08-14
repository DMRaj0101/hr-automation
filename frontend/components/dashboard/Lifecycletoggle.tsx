type LifecycleKey = "all" | "onboarding" | "offboarding";

type LifecycleToggleProps = {
  value: LifecycleKey;
  onChange: (key: LifecycleKey) => void;
};

const OPTIONS: { key: LifecycleKey; label: string; disabled?: boolean }[] = [
  { key: "all", label: "All" },
  { key: "onboarding", label: "Onboarding" },
  { key: "offboarding", label: "Offboarding", disabled: true },
];

export function LifecycleToggle({ value, onChange }: LifecycleToggleProps) {
  return (
    <div className="dashboard-toggle" role="tablist" aria-label="Lifecycle filter">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={value === opt.key}
          disabled={opt.disabled}
          title={opt.disabled ? "Offboarding data isn't available yet" : undefined}
          className={`dashboard-toggle-btn ${
            value === opt.key ? "dashboard-toggle-btn-active" : ""
          } ${opt.disabled ? "dashboard-toggle-btn-disabled" : ""}`}
          onClick={() => {
            if (!opt.disabled) onChange(opt.key);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export type { LifecycleKey };