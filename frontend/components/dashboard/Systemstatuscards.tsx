import { SystemActionCount, SystemHealthBrief } from "@/types/onboarding";

// Backend system key (actionCounts' keys) -> display name (systemHealth's
// agenthealth[].name) + subtitle + icon, since the two live endpoints key
// their data differently for the same 4 real connector agents.
const SYSTEM_META: Record<
  string,
  { name: string; subtitle: string; icon: string }
> = {
  keycloak: { name: "Keycloak", subtitle: "Identity Account Creation", icon: "ti-key" },
  mailu: { name: "MailU", subtitle: "Email Account Creation", icon: "ti-mail" },
  kimai: { name: "Kimai", subtitle: "Time & Billing", icon: "ti-clock" },
  openkm: { name: "OpenKM", subtitle: "Document Management", icon: "ti-file-text" },
};

// Mock systems — no live data source yet, static for UI design purposes.
// Same shape as the live systems below so they render identically.
const MOCK_SYSTEMS = [
  {
    name: "Westlaw",
    subtitle: "Legal Research",
    icon: "ti-book-2",
    status: "Operational",
    actions: 15,
    successPct: 98,
  },
  {
    name: "Microsoft 365",
    subtitle: "Productivity Suite",
    icon: "ti-apps",
    status: "Operational",
    actions: 25,
    successPct: 100,
  },
  {
    name: "Cisco AnyConnect",
    subtitle: "Network Access",
    icon: "ti-affiliate",
    status: "Operational",
    actions: 18,
    successPct: 100,
  },
  {
    name: "ServiceNow",
    subtitle: "Ticketing / ITSM",
    icon: "ti-ticket",
    status: "Operational",
    actions: 12,
    successPct: 95,
  },
  {
    name: "Snipe-IT",
    subtitle: "Asset Allocation",
    icon: "ti-device-laptop",
    status: "Down",
    actions: 0,
    successPct: 0,
  },
  {
    name: "iManage Work",
    subtitle: "Access Recommendation",
    icon: "ti-clipboard-list",
    status: "Operational",
    actions: 20,
    successPct: 100,
  },
];

export function SystemStatusCards({
  actionCounts,
  systemHealth,
}: {
  actionCounts: Record<string, SystemActionCount>;
  systemHealth: SystemHealthBrief[];
}) {
  const healthByName = new Map(systemHealth.map((h) => [h.name, h.status]));

  const liveSystems = Object.entries(SYSTEM_META).map(([key, meta]) => {
    const counts = actionCounts[key];
    const status = healthByName.get(meta.name) ?? "Down";
    return {
      name: meta.name,
      subtitle: meta.subtitle,
      icon: meta.icon,
      status,
      actions: counts?.totalActions ?? 0,
      successPct: counts?.successRate ?? 0,
    };
  });

  const systems = [...liveSystems, ...MOCK_SYSTEMS];

  return (
    <div className="dashboard-departments">
      {systems.map((sys) => {
        const isOperational = sys.status === "Operational";

        return (
          <div key={sys.name} className="dashboard-card dashboard-department-card">
            <div className="dashboard-department-top-row">
              <div className="dashboard-department-identity">
                <div className="dashboard-department-icon">
                  <i className={`ti ${sys.icon}`} aria-hidden="true" />
                </div>

                <span
                  className={`dashboard-health-dot ${
                    isOperational
                      ? "dashboard-health-dot-up"
                      : "dashboard-health-dot-down"
                  }`}
                />

                <div>
                  <h4 className="dashboard-department-title">{sys.name}</h4>
                  <p className="dashboard-department-meta">{sys.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="dashboard-department-stats-row">
              <div className="dashboard-department-stat dashboard-department-stat-actions">
                <div className="dashboard-department-stat-num">{sys.actions}</div>
                <div className="dashboard-department-stat-label">Actions</div>
              </div>

              <div className="dashboard-department-stat dashboard-department-stat-success">
                <div className="dashboard-department-stat-num">
                  {sys.successPct}%
                </div>
                <div className="dashboard-department-stat-label">Success</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}