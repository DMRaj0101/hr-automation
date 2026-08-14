import { SystemActionCount, SystemHealthBrief } from "@/types/onboarding";

// Backend system key (actionCounts' keys) -> display name (systemHealth's
// agenthealth[].name) + subtitle, since the two live endpoints key their
// data differently for the same 4 real connector agents.
const SYSTEM_META: Record<string, { name: string; subtitle: string }> = {
  keycloak: { name: "Keycloak", subtitle: "Identity Account Creation" },
  mailu: { name: "MailU", subtitle: "Email Account Creation" },
  kimai: { name: "Kimai", subtitle: "Time & Billing" },
  openkm: { name: "OpenKM", subtitle: "Document Management" },
};

function SystemIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01" />
      <path d="M7 17h.01" />
    </svg>
  );
}

export function SystemStatusCards({
  actionCounts,
  systemHealth,
}: {
  actionCounts: Record<string, SystemActionCount>;
  systemHealth: SystemHealthBrief[];
}) {
  const healthByName = new Map(systemHealth.map((h) => [h.name, h.status]));

  const systems = Object.entries(SYSTEM_META).map(([key, meta]) => {
    const counts = actionCounts[key];
    const status = healthByName.get(meta.name) ?? "Down";
    return {
      name: meta.name,
      subtitle: meta.subtitle,
      status,
      actions: counts?.totalActions ?? 0,
      successPct: counts?.successRate ?? 0,
    };
  });

  return (
    <div className="dashboard-departments">
      {systems.map((sys) => {
        const isOperational = sys.status === "Operational";

        return (
          <div key={sys.name} className="dashboard-card dashboard-department-card">
            <div className="dashboard-department-top-row">
              <div className="dashboard-department-identity">
                <div className="dashboard-department-icon">
                  <SystemIcon />
                </div>

                <div>
                  <h4 className="dashboard-department-title">{sys.name}</h4>
                  <p className="dashboard-department-meta">{sys.subtitle}</p>
                </div>
              </div>

              <span className="dashboard-department-arrow">›</span>
            </div>

            <div className="dashboard-department-stats-row">
              <span
                className={`dashboard-status-pill ${
                  isOperational
                    ? "dashboard-status-pill-good"
                    : "dashboard-status-pill-warn"
                }`}
              >
                <span
                  className={`dashboard-health-dot ${
                    isOperational
                      ? "dashboard-health-dot-up"
                      : "dashboard-health-dot-down"
                  }`}
                />
                {sys.status}
              </span>

              <div className="dashboard-department-stat">
                <div className="dashboard-department-stat-num">{sys.actions}</div>
                <div className="dashboard-department-stat-label">Actions</div>
              </div>

              <div className="dashboard-department-stat">
                <div className="dashboard-department-stat-num">
                  {sys.successPct}%
                </div>
                <div className="dashboard-department-stat-label">Success</div>
              </div>
            </div>

            <div className="dashboard-department-progress-track">
              <div
                className="dashboard-department-progress-fill"
                style={{
                  width: `${sys.successPct}%`,
                  background: isOperational ? "#1fa971" : "#d99818",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}