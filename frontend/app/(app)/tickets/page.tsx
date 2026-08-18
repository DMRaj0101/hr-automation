"use client";

import { useMemo } from "react";
import { useTickets } from "@/hooks/useTickets";
import { useTicketStore } from "@/store/ticketStore";
import { TicketTable } from "@/components/tickets/TicketTable";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";

export default function TicketQueuePage() {
  const { data: tickets, isLoading } = useTickets();
  const { search, role, status, setSearch, setRole, setStatus } = useTicketStore();

  const roles = useMemo(() => {
    if (!tickets) return ["All"];
    const unique = Array.from(new Set(tickets.map((t) => t.dept))).sort();
    return ["All", ...unique];
  }, [tickets]);

  const statuses = useMemo(() => {
    if (!tickets) return ["All"];
    const unique = Array.from(new Set(tickets.map((t) => t.status))).sort();
    return ["All", ...unique];
  }, [tickets]);

  const filtered = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const matchesSearch =
        !search ||
        String(t.id).toLowerCase().includes(search.toLowerCase()) ||
        t.employee_id?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === "All" || t.dept === role;
      const matchesStatus = status === "All" || t.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [tickets, search, role, status]);

  return (
    <div className="directory-bg">
      <div className="directory-panel">
        <div className="page-content flex h-full flex-col">
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
              options={roles}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <SimpleSelect
              className="directory-select"
              style={{ height: 38 }}
              options={statuses}
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