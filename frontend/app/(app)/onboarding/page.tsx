"use client";

import { useMemo } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTrackerStore } from "@/store/trackerStore";
import { TrackerTable } from "@/components/onboarding/TrackerTable";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";

const DEPTS = ["All", "Tax", "Audit", "Law"];

export default function OnboardingTrackerPage() {
  const { data: employees, isLoading } = useOnboarding();
  const { search, dept, setSearch, setDept } = useTrackerStore();

  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());
      const matchesDept = dept === "All" || e.dept === dept;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, dept]);

  return (
    <div className="page-content">
      <h1 className="page-title">Onboarding Tracker</h1>
      <p className="page-subtitle">
        Track provisioning progress for every employee in flight.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <SimpleSelect
          options={DEPTS}
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        />
        <span
          className="text-[13px] font-semibold text-vantara-navy"
          style={{
            marginLeft: "auto",
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 9999,
            padding: "8px 18px",
          }}
        >
          {filtered.length} Employees
        </span>
      </div>

      <div className="card !p-0">
        {isLoading ? (
          <div className="p-6 text-vantara-text-muted">Loading tracker...</div>
        ) : (
          <TrackerTable employees={filtered} />
        )}
      </div>
    </div>
  );
}
