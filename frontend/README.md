# Vantara AI Orchestration Platform — Frontend

Enterprise HR onboarding dashboard. Next.js 15 (App Router) + TypeScript,
backed by a mock JSON Server for now — swap to FastAPI later by changing
only `NEXT_PUBLIC_API_URL`.

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling, design tokens defined in `app/globals.css`
- **Zustand** for client state (filters, auth, chat)
- **TanStack Query** for server-state fetching/caching
- **TanStack Table** for the data-grid screens (Directory, Tracker, Tickets)
- **React Hook Form + Zod** for the login form
- **Axios** for HTTP, isolated behind a service layer
- **JSON Server** as the mock backend

## Getting started

Two processes run side by side — the mock API and the Next.js app.

```bash
# Terminal 1 — mock backend (http://localhost:4000)
npm run mock-server

# Terminal 2 — frontend dev server (http://localhost:3000)
npm run dev
```

Login with the seeded demo user: `hr@example.com` / `VantaraHR#2026`

## Folder structure

```
frontend/
├── app/                          Routes (Next.js App Router)
│   ├── layout.tsx                 Root layout — wraps app in QueryProvider
│   ├── page.tsx                   "/" — no-op, middleware redirects to /login or /dashboard
│   ├── globals.css                Design tokens (CSS vars), base styles, keyframes
│   ├── login/page.tsx              Screen 1 — Login
│   └── (app)/                     Route group — everything behind auth + AppShell
│       ├── layout.tsx              Wraps children in <AppShell> (Sidebar + Header)
│       ├── dashboard/page.tsx              Screen 2 — Orchestration Dashboard
│       ├── employee-directory/page.tsx     Screen 3 — Employee Directory
│       ├── employee/[id]/page.tsx          Screen 4 — Employee Profile
│       ├── onboarding/page.tsx             Screen 5 — Onboarding Tracker (list)
│       ├── onboarding/[id]/page.tsx        Screen 6 — Onboarding Detail / Provisioning
│       ├── tickets/page.tsx                Screen 7 — Ticket Queue
│       ├── tickets/[id]/page.tsx           Screen 8 — Ticket Detail
│       ├── monitoring-agent/page.tsx       Screen 9 — Monitoring Agent Console
│       └── knowledge-agent/page.tsx        Screen 10 — Knowledge Agent Chat
│
├── components/
│   ├── layout/          Header, Sidebar (nav), AppShell (combines both + auth gate visuals)
│   ├── common/           Shared across every screen: StatusBadge, PriorityBadge,
│   │                      ProgressBar, Avatar, StatCard, DataTable (grid-based table wrapper)
│   ├── ui/                Minimal hand-rolled primitives (Button, Input, SimpleSelect) —
│   │                      styled to the design tokens, not a shadcn CLI install
│   ├── dashboard/         Dashboard-only cards (stat row, integration coverage, SLA, etc.)
│   ├── employee-directory/  EmployeeTable (TanStack Table)
│   ├── employee/           ProfileHeader, InfoCard, ProvisioningChecklist
│   │                        (ProvisioningChecklist is reused by Onboarding Detail)
│   ├── onboarding/         TrackerTable, OnboardingSummaryCards, AlertCard, SystemHealthGrid
│   │                        (SystemHealthGrid is reused by Monitoring)
│   ├── tickets/            TicketTable, TicketStatRow, ErrorDetailsCard, StatusHistory
│   ├── monitoring/         LiveBanner, ActiveRequestsTable
│   ├── knowledge-agent/    ChatMessage, SuggestionChips, ChatInput
│   └── providers/          QueryProvider (TanStack Query client)
│
├── store/                 Zustand stores — one per screen's client-only state
│   ├── authStore.ts         user, isAuthenticated, login()/logout() — persisted to
│   │                        localStorage AND a cookie (middleware reads the cookie,
│   │                        since edge middleware can't read localStorage)
│   ├── sidebarStore.ts      collapse state (not currently wired to a toggle button)
│   ├── directoryStore.ts    Employee Directory search/department filters
│   ├── trackerStore.ts      Onboarding Tracker search/department filters
│   ├── ticketStore.ts       Ticket Queue search/team/role filters
│   └── chatStore.ts         chat messages, input, send/reply logic (swap-ready for a
│                            real backend — just replace resolveReply's lookup)
│
├── services/               One file per API resource. ALL network calls go through
│   │                       here — nothing outside this folder imports axios directly.
│   ├── api-client.ts         axios instance, baseURL from NEXT_PUBLIC_API_URL
│   ├── auth.service.ts       login() — validates against seeded /users
│   ├── dashboard.service.ts
│   ├── employee.service.ts   employees + checklists
│   ├── onboarding.service.ts employees filtered to "in flight" + onboarding detail
│   ├── ticket.service.ts     tickets + ticket detail
│   ├── monitoring.service.ts monitoring + system health
│   └── knowledge.service.ts  chat messages, suggestion chips, chip replies
│
├── hooks/                  TanStack Query hooks, one per screen — thin wrappers
│   │                       around the matching service function + a query key
│   ├── useDashboard.ts
│   ├── useEmployees.ts / useEmployee.ts
│   ├── useOnboarding.ts / useOnboardingDetail.ts
│   ├── useTickets.ts / useTicketDetail.ts
│   └── useMonitoring.ts     polls every 5s (refetchInterval)
│
├── lib/
│   └── utils.ts             cn(), formatDate(), initials(), statusStyle(),
│                             priorityStyle(), employeeTypeStyle() — the color-map
│                             lookups every badge component uses
│
├── types/                  Shared TypeScript interfaces, mirrors the shape of
│   │                       mock-server/db.json
│   ├── auth.ts / employee.ts / ticket.ts / onboarding.ts / monitoring.ts
│
├── mock-server/
│   ├── db.json              Seed data — employees, tickets, checklists, dashboard
│   │                        stats, monitoring data, chat messages, etc.
│   └── routes.json          Optional /api/* aliases (unused by services today —
│                            services hit JSON Server's native root paths directly)
│
├── middleware.ts            Auth gate for the (app) route group. Reads the
│                            `vantara-auth-token` cookie; redirects to /login if
│                            absent, redirects /login → /dashboard if present.
├── tailwind.config.ts       Vantara color tokens (navy/gold/etc.) as Tailwind theme
├── components.json          shadcn/ui config (primitives are hand-written, see components/ui)
└── .env.local                NEXT_PUBLIC_API_URL — the only thing that changes
                              when swapping the mock backend for real FastAPI
```

## How a screen is wired (example: Ticket Queue)

1. `app/(app)/tickets/page.tsx` calls `useTickets()` (from `hooks/useTickets.ts`)
2. The hook calls `getTickets()` (from `services/ticket.service.ts`)
3. The service hits `GET /tickets` via the shared `apiClient` (axios instance
   pointed at `NEXT_PUBLIC_API_URL`)
4. Client-side filters (search/team/role) live in `store/ticketStore.ts` and
   are applied to the fetched list with `useMemo` in the page component
5. Rows render through `components/tickets/TicketTable.tsx`, which uses the
   shared `DataTable` wrapper (TanStack Table + fixed `gridTemplateColumns`
   per screen, to match the mock's column proportions)

Every other data screen (Dashboard, Directory, Tracker, Employee Profile,
Onboarding Detail, Ticket Detail, Monitoring) follows the same
page → hook → service → API pattern.

## Swapping the mock backend for FastAPI

Only `.env.local`'s `NEXT_PUBLIC_API_URL` needs to change, **provided** the
new backend exposes equivalent routes/shapes to `mock-server/db.json`
(see `services/*.service.ts` for the exact paths each screen expects —
e.g. `/employees`, `/tickets`, `/checklists`, `/onboardingDetails`,
`/ticketDetails`, `/monitoring`, `/dashboard`).

## Known simplifications (see prior build notes)

- `components/ui/` primitives are hand-written to the design tokens, not
  generated via the shadcn CLI.
- Nested mock lookups (`checklists`, `ticketDetails`, `onboardingDetails`)
  are served as flat keyed objects and indexed client-side in the service
  layer, since JSON Server can't do per-ID dynamic REST routes out of the box.
- Only `TKT-2004` has full seeded ticket detail; other tickets fall back to
  synthesized SLA/status data derived from their own status + priority
  (see `buildFallbackDetail` in `app/(app)/tickets/[id]/page.tsx`).
