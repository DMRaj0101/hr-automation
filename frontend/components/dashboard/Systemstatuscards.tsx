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
  kimai: { name: "Kimai", subtitle: "Time & Billing Agent", icon: Clock },
  openkm: { name: "OpenKM", subtitle: "Document Management Agent", icon: FileText },
};

// Best-effort icon + subtitle rules for the mock software names -- purely
// cosmetic, tested in order against the actionCounts key (config_data/
// provisioning_matrix.json's "software" fields, e.g. the per-department
// "Microsoft 365, <software>, NetDocuments" Access Recommendation combos).
// More specific patterns (department-flavored combos) are listed BEFORE
// their generic fallback so they match first -- order matters here.
const MOCK_ICON_RULES: { test: RegExp; icon: ElementType; subtitle: string }[] = [
  // Access Recommendation combos -- department-specific, checked before
  // the generic netdocuments/access-recommendation fallback below.
  { test: /caseware/i, icon: ClipboardList, subtitle: "Access Recommendation Agent (Audit)" },
  { test: /cch axcess tax.*netdocuments|netdocuments.*cch axcess tax/i, icon: ClipboardList, subtitle: "Access Recommendation Agent (Tax)" },
  { test: /imanage/i, icon: ClipboardList, subtitle: "Access Recommendation Agent (Law)" },
  { test: /netdocuments|access recommendation/i, icon: ClipboardList, subtitle: "Access Recommendation Agent" },

  { test: /snipe-?it|asset/i, icon: Monitor, subtitle: "Asset Allocation Agent" },
  { test: /cisco|vpn|network/i, icon: Network, subtitle: "Network Access Agent" },
  { test: /westlaw|legal research/i, icon: BookOpen, subtitle: "Legal Research Agent" },
  { test: /caseware.*audit|audit software/i, icon: ShieldCheck, subtitle: "Audit Software Agent" },
  { test: /axcess tax|tax preparation/i, icon: Receipt, subtitle: "Tax Preparation Agent" },
  { test: /servicenow|glpi|ticketing/i, icon: Ticket, subtitle: "Ticketing/ITSM Agent" },

  // Productivity Suite -- "+ Teams" combo is Law-specific, checked before
  // the plain "Microsoft 365" fallback shared by Tax/Audit/IT Support.
  { test: /microsoft 365\s*\+\s*teams/i, icon: LayoutGrid, subtitle: "Productivity Suite Agent (Law)" },
  { test: /microsoft 365|productivity suite/i, icon: LayoutGrid, subtitle: "Productivity Suite Agent (Tax / Audit / IT Support)" },
];
const DEFAULT_MOCK_ICON = Boxes;

function mockIconFor(key: string): ElementType {
  return MOCK_ICON_RULES.find((rule) => rule.test.test(key))?.icon ?? DEFAULT_MOCK_ICON;
}

function mockSubtitleFor(key: string): string | null {
  return MOCK_ICON_RULES.find((rule) => rule.test.test(key))?.subtitle ?? null;
}

// Success-rate color coding:
// 100%     -> green
// 50-99%   -> orange
// below 50%-> red
function successColorFor(pct: number): { color: string; bg: string } {
  if (pct >= 100) return { color: "#15803d", bg: "#dcfce7" }; // green
  if (pct >= 50) return { color: "#c2680d", bg: "#fef3c7" }; // orange (includes 50%)
  return { color: "#b91c1c", bg: "#fee2e2" }; // red (below 50%)
}

export function SystemStatusCards({
  actionCounts,
}: {
  actionCounts: Record<string, SystemActionCount>;
}) {
  const systems = Object.entries(actionCounts).map(([key, counts]) => {
    const realMeta = REAL_SYSTEM_META[key];
    const isReal = Boolean(realMeta);
    const name = realMeta?.name ?? key;
    const subtitle = realMeta?.subtitle ?? mockSubtitleFor(key);
    const Icon = realMeta?.icon ?? mockIconFor(key);
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