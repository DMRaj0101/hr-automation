import type { ElementType } from "react";
import {
  KeyRound,
  Mail,
  Clock,
  FileText,
  Monitor,
  LayoutGrid,
  Network,
  BookOpen,
  ShieldCheck,
  Receipt,
  Ticket,
  ClipboardList,
  Boxes,
} from "lucide-react";
import { SystemActionCount } from "@/types/onboarding";
import { iconColorFor } from "@/lib/utils";

// The 4 real connector agents (routers/dashboard.py's _SYSTEM_AGENT_KEYS) --
// actionCounts keys these by system key, everything else is keyed by its
// literal ProvisioningRecord.software_name string (get_action_count()'s
// mock branch), so real display metadata only needs to cover these 4.
const REAL_SYSTEM_META: Record<
  string,
  { name: string; subtitle: string; icon: ElementType }
> = {
  keycloak: { name: "Keycloak", subtitle: "Identity Account Creation", icon: KeyRound },
  mailu: { name: "MailU", subtitle: "Email Account Creation", icon: Mail },
  kimai: { name: "Kimai", subtitle: "Time & Billing", icon: Clock },
  openkm: { name: "OpenKM", subtitle: "Document Management", icon: FileText },
};

// Best-effort icon rules for the mock software names -- purely cosmetic,
// tested in order against the actionCounts key (config_data/
// provisioning_matrix.json's "software" fields, e.g. the per-department
// "Microsoft 365, <software>, NetDocuments" Access Recommendation combos),
// falling back to a generic icon for anything unmatched.
const MOCK_ICON_RULES: { test: RegExp; icon: ElementType }[] = [
  { test: /netdocuments|access recommendation/i, icon: ClipboardList },
  { test: /snipe-?it|asset/i, icon: Monitor },
  { test: /cisco|vpn|network/i, icon: Network },
  { test: /westlaw|legal research/i, icon: BookOpen },
  { test: /caseware|audit software/i, icon: ShieldCheck },
  { test: /axcess tax|tax preparation/i, icon: Receipt },
  { test: /servicenow|glpi|ticketing/i, icon: Ticket },
  { test: /microsoft 365|productivity suite/i, icon: LayoutGrid },
];
const DEFAULT_MOCK_ICON = Boxes;

function mockIconFor(key: string): ElementType {
  return MOCK_ICON_RULES.find((rule) => rule.test.test(key))?.icon ?? DEFAULT_MOCK_ICON;
}

// Success-rate color coding:
// 100%      -> green
// >50, <100 -> orange
// <=50%     -> red
function successColorFor(pct: number): { color: string; bg: string } {
  if (pct >= 100) return { color: "#15803d", bg: "#dcfce7" }; // green
  if (pct > 50) return { color: "#c2680d", bg: "#fef3c7" }; // orange
  return { color: "#b91c1c", bg: "#fee2e2" }; // red
}

export function SystemStatusCards({
  actionCounts,
}: {
  actionCounts: Record<string, SystemActionCount>;
}) {
  // One card per actionCounts entry -- whatever real + mock agents/systems
  // the backend actually has action data for right now, not a fixed list
  // that silently drops entries as the DB's mock software names vary.
  const systems = Object.entries(actionCounts).map(([key, counts]) => {
    const realMeta = REAL_SYSTEM_META[key];
    const isReal = Boolean(realMeta);
    const name = realMeta?.name ?? key;
    const subtitle = realMeta?.subtitle ?? null;
    const Icon = realMeta?.icon ?? mockIconFor(key);
    // Every card gets its own color -- keyed off `key` (system key for
    // real, literal software_name for mock) so it's stable across
    // reloads, and spreads the open-ended/varying set of mock agents
    // across the palette instead of every card sharing one flat color.
    const { bg, color } = iconColorFor(key);
    const successColor = successColorFor(counts.successRate);

    return {
      key,
      name,
      subtitle,
      Icon,
      isReal,
      bg,
      color,
      actions: counts.totalActions,
      successPct: counts.successRate,
      successColor,
    };
  });

  return (
    <div className="dashboard-departments">
      {systems.map((sys) => {
        return (
          <div key={sys.key} className="dashboard-card dashboard-department-card">
            <div className="dashboard-department-top-row">
              <div className="dashboard-department-identity">
                <div
                  className="dashboard-department-icon"
                  style={{ background: sys.bg, color: sys.color }}
                >
                  <sys.Icon size={18} strokeWidth={2} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="dashboard-department-title">{sys.name}</h4>
                  {sys.subtitle && (
                    <p className="dashboard-department-meta">{sys.subtitle}</p>
                  )}
                </div>
              </div>

              {!sys.isReal && (
                <span className="dashboard-badge dashboard-badge-mock">Mock</span>
              )}
            </div>

            <div className="dashboard-department-stats-row">
              <div className="dashboard-department-stat dashboard-department-stat-actions">
                <div className="dashboard-department-stat-num">{sys.actions}</div>
                <div className="dashboard-department-stat-label">Actions</div>
              </div>

              <div
                className="dashboard-department-stat dashboard-department-stat-success"
                style={{ background: sys.successColor.bg, borderRadius: 8 }}
              >
                <div
                  className="dashboard-department-stat-num"
                  style={{ color: sys.successColor.color }}
                >
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