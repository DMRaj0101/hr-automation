"use client";

import { useMemo } from "react";
import { useTickets } from "@/hooks/useTickets";
import { useDashboard } from "@/hooks/useDashboard";
import { useTicketStore } from "@/store/ticketStore";
import { TicketTable } from "@/components/tickets/TicketTable";
import { TicketStatRow } from "@/components/tickets/TicketStatRow";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";

const TEAMS = ["All", "IT", "Admin", "Security"];
const ROLES = ["All", "Tax", "Audit", "Law"];

export default function TicketQueuePage() {
  const { data: tickets, isLoading } = useTickets();
  const { data: dashboard } = useDashboard();
  const { search, team, role, setSearch, setTeam, setRole } = useTicketStore();

  const filtered = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const matchesSearch =
        !search ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.employee.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = team === "All" || t.team === team;
      const matchesRole = role === "All" || t.dept === role;
      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [tickets, search, team, role]);

  return (
    <div className="page-content">
      <h1 className="page-title">Ticket Queue</h1>
      <p className="page-subtitle">
        Monitor and triage tickets raised during onboarding.
      </p>

      <div className="mb-5">
        {dashboard && <TicketStatRow data={dashboard.ticketStatus} />}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by ticket ID or employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <SimpleSelect options={TEAMS} value={team} onChange={(e) => setTeam(e.target.value)} />
        <SimpleSelect options={ROLES} value={role} onChange={(e) => setRole(e.target.value)} />
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
          {filtered.length} Tickets
        </span>
      </div>

      <div className="card !p-0">
        {isLoading ? (
          <div className="p-6 text-vantara-text-muted">Loading tickets...</div>
        ) : (
          <TicketTable tickets={filtered} />
        )}
      </div>
    </div>
  );
}
