// Mock data — replace with real integration/system telemetry when available.
const MOCK_SYSTEMS = [
  {
    name: "Keycloak",
    subtitle: "Identity Account Creation",
    status: "Operational" as const,
    actions: 120,
    successPct: 99,
  },
  {
    name: "MailU",
    subtitle: "Email Account Creation",
    status: "Operational" as const,
    actions: 118,
    successPct: 97,
  },
  {
    name: "OpenKM",
    subtitle: "Document Management",
    status: "Degraded" as const,
    actions: 96,
    successPct: 82,
  },
];

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

export function SystemStatusCards() {
  return (
    <div className="dashboard-departments">
      {MOCK_SYSTEMS.map((sys) => {
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