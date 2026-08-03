"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ServerCog } from "lucide-react";
import { useEmployee, useChecklist } from "@/hooks/useEmployee";
import { ProfileHeader } from "@/components/employee/ProfileHeader";
import { InfoCard } from "@/components/employee/InfoCard";
import { ProvisioningChecklist } from "@/components/employee/ProvisioningChecklist";
import { formatDate } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: employee, isLoading } = useEmployee(id);
  const { data: checklist } = useChecklist(id);

  // drives the 0 -> value progress bar grow animation on mount
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (!employee) return;
    const t = setTimeout(() => setBarWidth(employee.progress ?? 0), 120);
    return () => clearTimeout(t);
  }, [employee]);

  if (isLoading || !employee) {
    return (
      <div className="ep-loading">
        <style>{epStyles}</style>
        <div className="ep-orb ep-orb1" />
        <div className="ep-orb ep-orb2" />
        <div className="ep-orb ep-orb3" />
        <span>Loading employee...</span>
      </div>
    );
  }

  const doneCount = checklist?.filter((c) => c.status === "done").length ?? 0;
  const totalCount = checklist?.length ?? 0;

  return (
    <div className="ep-page">
      <style>{epStyles}</style>

      <div className="ep-orb ep-orb1" />
      <div className="ep-orb ep-orb2" />
      <div className="ep-orb ep-orb3" />

      <div className="ep-wrap">
        <Link href="/employee-directory" className="ep-back">
          <span className="ep-back-arrow">←</span> Employee Directory
        </Link>

        <ProfileHeader employee={employee} />

        <div className="ep-glass ep-progress-card">
          <div className="ep-progress-top">
            <span>Onboarding Progress</span>
            <span>{employee.progress}%</span>
          </div>
          <div className="ep-bar">
            <div className="ep-fill" style={{ width: `${barWidth}%` }} />
          </div>
        </div>

        <div className="ep-grid2">
          <InfoCard
            title="Personal Information"
            fields={[
              { label: "Email", value: employee.email },
              { label: "Phone", value: employee.phone },
              { label: "Office", value: employee.office },
            ]}
          />
          <InfoCard
            title="Employment Details"
            fields={[
              { label: "Manager", value: employee.empManager },
              { label: "Hire Date", value: formatDate(employee.hireDate) },
              { label: "Years of Service", value: employee.yearsOfService },
              { label: "Job Level", value: employee.jobLevel },
            ]}
          />
        </div>

        <div className="ep-glass ep-checklist-card">
          <div className="ep-section-title">
            <h2>
              <span className="ep-title-icon">
                <ServerCog size={16} strokeWidth={2.4} />
              </span>
              Provisioning Checklist
            </h2>
            <span className="ep-counter">
              {doneCount} / {totalCount} complete
            </span>
          </div>

          <ProvisioningChecklist items={checklist ?? []} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shared CSS for the whole profile page (light glass theme).
// Injected once here; ProfileHeader / InfoCard / ProvisioningChecklist
// just reference these "ep-*" classes since they always render inside
// this page.
// ============================================================
const epStyles = `
:root{
  --ep-bg1:#ffffff; --ep-bg2:#f4efe1; --ep-bg3:#faf7f0;
  --ep-copper:#e8a33d; --ep-copper-soft:#e8a33d;
  --ep-rose:#e8697a;
  --ep-mint:#4fe3a4;
  --ep-coral:#f2778a;
  --ep-purple:#6e56cf;
  --ep-txt:#16213e; --ep-txt-dim:#6b6558;

  /* card tokens: shared by progress card, info cards, checklist cards, modal */
  --ep-card-bg:rgba(255,255,255,.92);
  --ep-card-brd:rgba(22,33,62,.08);
  --ep-card-txt:#16213e;
  --ep-card-txt-dim:#6b6558;
}

.ep-page, .ep-loading{
  position:relative;
  font-family:'Segoe UI',system-ui,sans-serif;
  color:var(--ep-txt);
  background:
    radial-gradient(900px 600px at 85% -10%, rgba(217,166,83,.16), transparent 60%),
    radial-gradient(1000px 700px at -10% 20%, rgba(110,86,207,.10), transparent 60%),
    linear-gradient(160deg,var(--ep-bg3),var(--ep-bg2) 60%,var(--ep-bg1));
  min-height:100vh;
  overflow-x:hidden;
  margin:-1px;
}
.ep-loading{display:flex;align-items:center;justify-content:center;color:var(--ep-txt-dim)}

.ep-orb{position:fixed;border-radius:50%;filter:blur(80px);opacity:.16;z-index:0;animation:ep-float 16s ease-in-out infinite}
.ep-orb1{width:360px;height:360px;background:var(--ep-copper);top:-100px;right:-60px}
.ep-orb2{width:300px;height:300px;background:var(--ep-purple);bottom:-80px;left:5%;animation-delay:-5s;opacity:.12}
.ep-orb3{width:220px;height:220px;background:var(--ep-mint);top:45%;left:40%;animation-delay:-9s;opacity:.10}
@keyframes ep-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,25px) scale(1.1)}}

.ep-wrap{position:relative;z-index:1;max-width:1240px;margin:0 auto;padding:14px 24px 60px;
  animation:ep-rise .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes ep-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

.ep-back{
  position:relative;display:inline-flex;align-items:center;gap:6px;
  color:var(--ep-copper-soft);text-decoration:none;font-weight:600;font-size:13px;
  padding:7px 14px;border-radius:8px;
  background:rgba(255,255,255,.7);
  border:1px solid var(--ep-card-brd);
  margin-bottom:14px;
}
.ep-back:hover{color:var(--ep-txt);background:rgba(255,255,255,.95)}
.ep-back-arrow{display:inline-block}

/* .ep-glass = the card surface used by progress card, info cards, checklist cards */
.ep-glass{background:var(--ep-card-bg);backdrop-filter:blur(4px) saturate(110%);-webkit-backdrop-filter:blur(4px) saturate(110%);
  border:1px solid var(--ep-card-brd);border-radius:18px;box-shadow:0 4px 14px rgba(22,33,62,.06);color:var(--ep-card-txt)}

.ep-progress-card{padding:22px 24px;margin:16px 0;transition:transform .3s ease,box-shadow .3s ease}
.ep-progress-card:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(22,33,62,.08)}
.ep-progress-top{display:flex;justify-content:space-between;font-weight:700;margin-bottom:12px;font-size:14px;color:var(--ep-card-txt)}
.ep-progress-top span:last-child{color:var(--ep-copper-soft)}
.ep-bar{height:9px;border-radius:999px;background:rgba(22,33,62,.08);overflow:hidden}
.ep-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--ep-copper),var(--ep-rose));
  width:0;transition:width 1.1s cubic-bezier(.2,.8,.2,1);position:relative}
.ep-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);
  animation:ep-sheen 2.2s infinite}
@keyframes ep-sheen{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

.ep-grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px}

.ep-info-card{padding:22px 24px;transition:transform .3s ease}
.ep-info-card:hover{transform:translateY(-3px)}

.ep-info-title{
  position:relative;margin:0 0 20px;padding-left:14px;
  font-size:15.5px;font-weight:800;letter-spacing:.01em;color:var(--ep-card-txt)
}
.ep-info-title::before{
  content:'';position:absolute;left:0;top:2px;bottom:2px;width:4px;
  border-radius:999px;background:linear-gradient(180deg,var(--ep-copper),var(--ep-rose));
}

.ep-info-grid{display:flex;flex-direction:column}
.ep-info-item{
  display:flex;flex-direction:column;gap:4px;
  padding:12px 0;border-bottom:1px solid var(--ep-card-brd);
}
.ep-info-item:first-child{padding-top:0}
.ep-info-item:last-child{border-bottom:none;padding-bottom:0}
.ep-info-label{color:var(--ep-card-txt-dim);font-size:12px}
.ep-info-value{font-weight:700;font-size:14.5px;color:var(--ep-card-txt)}

.ep-section-title{display:flex;justify-content:space-between;align-items:center;margin:8px 4px 14px}
.ep-section-title h2{
  display:flex;align-items:center;gap:9px;
  font-size:19px;margin:0;font-weight:800;letter-spacing:-.01em;
  background:linear-gradient(90deg,var(--ep-txt) 40%,var(--ep-copper) 90%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.ep-title-icon{
  display:inline-flex;align-items:center;justify-content:center;
  width:26px;height:26px;border-radius:8px;
  background:linear-gradient(135deg,var(--ep-copper),var(--ep-rose));
  font-size:13px;-webkit-text-fill-color:initial;
}
.ep-counter{color:var(--ep-txt-dim);font-size:13px}

/* ================= Provisioning Checklist wrapper card ================= */
.ep-checklist-card{
  padding:24px 26px 26px;
  margin-bottom:24px;
  transition:transform .3s ease;
}

.ep-checklist-card .ep-section-title{
  margin:0 0 18px;
  padding-bottom:16px;
  border-bottom:1px solid var(--ep-card-brd);
}

.ep-checklist-card .ep-section-title h2{
  background:none;
  -webkit-background-clip:unset;
  background-clip:unset;
  color:var(--ep-card-txt);
  font-size:18px;
  font-weight:800;
  letter-spacing:-0.01em;
}

.ep-checklist-card .ep-title-icon{
  width:30px;height:30px;border-radius:9px;
  background:linear-gradient(135deg,var(--ep-copper),var(--ep-coral));
  color:#fff;
  box-shadow:0 3px 10px rgba(232,163,61,.35);
}

.ep-checklist-card .ep-counter{
  font-weight:700;
  font-size:12.5px;
  color:var(--ep-copper-soft);
  background:rgba(232,163,61,.1);
  padding:4px 10px;
  border-radius:999px;
}

@media(max-width:640px){.ep-grid2{grid-template-columns:1fr}}
`;