import { SystemHealthBrief } from "@/types/onboarding";

export function SystemHealthCard({
  items,
}: {
  items: SystemHealthBrief[];
}) {
  return (
    <div className="dashboard-card dashboard-system-card">
      <div className="dashboard-section-header">
        <div className="dashboard-section-icon">
          ▣
        </div>

        <h3 className="dashboard-card-title">
          System Health
        </h3>
      </div>

      <div className="dashboard-system-grid">
        {items.map((item) => {
          const isDown =
            item.status.toLowerCase() === "down";

          return (
            <div
              key={item.name}
              className="dashboard-system-item"
            >
              <div className="dashboard-system-name">
                <span
                  className={`dashboard-health-dot ${
                    isDown
                      ? "dashboard-health-dot-down"
                      : "dashboard-health-dot-up"
                  }`}
                />

                <span>
                  {item.name}
                </span>
              </div>

              <div
                className={`dashboard-system-status ${
                  isDown
                    ? "dashboard-status-down"
                    : "dashboard-status-up"
                }`}
              >
                {item.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}