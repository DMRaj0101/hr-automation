"use client";

import { useMemo } from "react";
import { useTickets } from "@/hooks/useTickets";
import { useDashboard } from "@/hooks/useDashboard";
import { useTicketStore } from "@/store/ticketStore";
import { TicketTable } from "@/components/tickets/TicketTable";
import { TicketStatRow } from "@/components/tickets/TicketStatRow";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";

const ROLES = ["All", "Tax", "Audit", "Law"];
const STATUSES = ["All", "Open", "In Progress", "Failed", "Closed"];

export default function TicketQueuePage() {
  const { data: tickets, isLoading } = useTickets();
  const { data: dashboard } = useDashboard();
  const { search, role, status, setSearch, setRole, setStatus } = useTicketStore();

  const filtered = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const matchesSearch =
        !search ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.employee.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === "All" || t.dept === role;
      const matchesStatus = status === "All" || t.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [tickets, search, role, status]);

  return (
    <div className="directory-bg">
      <div className="directory-panel">
        <div className="page-content flex h-full flex-col">
          <div className="mb-1 shrink-0">
            {dashboard && <TicketStatRow data={dashboard.ticketStatus} />}
          </div>

          <div className="directory-toolbar shrink-0" style={{ padding: "8px 14px" }}>
            <Input
              className="directory-search"
              style={{ height: 38 }}
              placeholder="Search by ticket ID or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SimpleSelect
              className="directory-select"
              style={{ height: 38 }}
              options={ROLES}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <SimpleSelect
              className="directory-select"
              style={{ height: 38 }}
              options={STATUSES}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <span className="directory-count-pill" style={{ padding: "6px 16px" }}>
              {filtered.length} Tickets
            </span>
          </div>

          <div className="directory-card min-h-0 flex-1">
            {isLoading ? (
              <div className="p-6 text-vantara-text-muted">Loading tickets...</div>
            ) : (
              <TicketTable tickets={filtered} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}