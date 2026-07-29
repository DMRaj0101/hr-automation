# MIGRATION_NOTES.md — PDD v3 Skeleton (Backend + Mock HRMS)

This is the previous codebase, pruned down to what the PDD v3 (AI
Orchestration POC — With Suggestions) architecture actually needs, with
clear `TODO` stubs for the pieces that still need to be built. Scope of
this pass: **backend + mock_hrms only**, per request — the frontend
still has some pages rewritten against the new API shape (dashboard,
onboarding-tracker, profile, approvals-stub) from an earlier pass, but
it wasn't the focus and shouldn't be assumed finished or reviewed to
the same standard as the backend below.

Read this alongside `Gap_Analysis_Reuse_Migration_Plan.md` (the earlier
deliverable) — that document explains *why* each decision below was
made; this one is the practical "what's here now and who does what next."

---

## 1. What was removed, and why

| Removed | Reason |
|---|---|
| Offboarding (models, orchestrator, router, mock HRMS `/exits` feed) | Out of scope — the PDD v3 POC covers onboarding only (Section 1's 6 steps are all onboarding). |
| Per-task human-approval models/agents (`OnboardingTask`, `Approval`, `access_recommender.py`, `hardware_recommender.py`, `compliance_recommender.py`, etc.) | Replaced by the Decision Agent + real provisioning calls + native Ticket model. The "AI suggests, human approves every item" loop doesn't match the new "AI provisions for real, tickets only for Mock items" loop. |
| Document validation (`document_extraction.py`, `document_name_matching.py`, `hrms_document_sync.py`, OCR deps, `mock_employee_docs/`) | Not part of the PDD v3 process at all. |
| License/seat tracking (`license_manager.py`) | Not modeled in the PDD; the *pattern* (seat counts, threshold alerts) is still a good template if Kimai/M365 seat tracking comes up later — see the Gap Analysis doc, Section 2.2. |
| Risk assessment, compliance tasks, reports, insights, decisions routers | No equivalent in the new 6-step flow / Section 9 screen list. |
| `services/reminders.py`, `services/track_status.py` | The *shape* of these (background sweep loop; live, never-cached rollup) is reused directly in `agents/monitoring_agent.py` and the new status endpoints — but the old code read from removed models, so it couldn't be kept as-is. |

## 2. What was kept, unchanged or nearly so

- `app/email_client.py` — real SMTP/IMAP, unchanged. Still the right tool for PDD Section 6's Alerts/Intimations, once someone wires specific triggers to it.
- `app/ai_client.py` — Ollama client, unchanged.
- `app/integrations/hrms_connector.py` — trimmed of offboarding/document fields, same shape.
- `app/agents/role_classifier.py` — unchanged logic, just points at the new `roles.json` (Tax/Audit/Law/IT Support instead of the old law-firm role list).
- `app/services/chatbot/*` — entirely unchanged. This is the Knowledge Agent's document-grounded half (Company Policy & FAQ, Platform Help).
- `app/routers/hr_assistant.py`, `app/routers/auth.py` — unchanged, self-contained.
- Frontend reused screens per PDD Section 9 (Directory, Login) — unchanged, still call compatible endpoints.

## 3. What's new (real code, not a stub)

- `app/models/employee.py`: `Ticket` (PDD Section 4.1's exact schema), `ProvisioningRecord`.
- `app/config_data/provisioning_matrix.json` — transcribed directly from PDD Section 3's four role tables (Tax/Audit/Law/IT Support), including which items are Functional vs Mock.
- `app/config_data/team_routing.json` — PDD Section 4.4.
- `app/agents/decision_agent.py` — fully implemented rule-based lookup (role → provisioning plan). No ambiguity here, so it's not a stub.
- `app/agents/ticket_agent.py` — fully implemented ticket create/status-update logic (our own system, no external integration decision needed).
- `app/routers/tickets.py`, `app/routers/dashboard.py`, `app/routers/profile.py`, `app/routers/monitoring.py`, `app/routers/onboarding.py` (rewritten), `app/routers/employees.py` / `app/routers/hrms_sync.py` (fixed to drop dead imports) — all wired against the new models, functional today.
- `mock_hrms/app.py` — trimmed to just the new-hire feed; `fixtures/new_hires.json` role values remapped to Tax/Audit/Law/IT Support (two fixture rows — `EMP-1004`, `EMP-1005` — deliberately keep a missing/invalid role, to exercise the role-classifier fallback and the Decision Agent's "no matrix entry" error path; don't "fix" these).

## 4. What's a stub — this is the work to assign out

Each file below raises `NotImplementedError` (or, for the Monitoring
Agent, silently skips) at the specific point real work is needed, with
a docstring explaining exactly what to build, what to return, and
what's ambiguous vs. mechanical. Nothing else in the codebase needs to
change to wire a finished connector in — each one has exactly one
integration point (a lambda in `onboarding_orchestrator.py`'s
`_PROVISIONING_CALLS` dict, and an entry in `monitoring_agent.py`'s
`STATUS_CHECKERS` dict).

| # | File | Owns (PDD item) | Notes |
|---|---|---|---|
| 1 | `app/integrations/keycloak_connector.py` | Identity Account Creation (all roles) + Helpdesk Admin Role scoped (IT Support) | Straightforward Admin REST API, no open integration-approach question. |
| 2 | `app/integrations/mailu_connector.py` | Email Account Creation (all roles) | **Integration approach itself is still open** — confirm admin API vs CLI before writing code. Do this first if picking up this piece. |
| 3 | `app/integrations/kimai_connector.py` | Time & Billing (Tax/Audit/Law only) | Mechanical — documented REST API + token. |
| 4 | `app/integrations/snipeit_connector.py` | Asset Allocation (all roles) + Asset Management console access (IT Support only) | Mechanical — documented REST API + token. Two distinct functions, don't merge them. |
| 5 | `app/integrations/openkm_connector.py` | Client Document Repository (Tax), Client Engagement Repository (Audit), Document Management (Law) | **Upgraded from Mock to Functional** beyond the original PDD Section 3 tables — these were originally spec'd against commercial platforms (NetDocuments/iManage) and would have stayed Mock; OpenKM is open-source so this became feasible. IT Support has no document-management item. Confirm OpenKM's folder-structure convention before hardcoding one — see the file's own docstring. |
| 6 | `app/agents/monitoring_agent.py` | Monitoring Agent polling/retry/SLA (PDD Section 5) | Depends on #1–5 existing first (its `STATUS_CHECKERS` dict wires to each connector's `get_*_status`). Natural last pickup. |
| 7 | `app/routers/approvals.py` | PDD Suggestion #1 (approval workflow) | **Not a connector — a product decision.** Needs to be resolved before anyone builds against it. See the file's own docstring for the three options on the table. Recommend resolving this one first, in a conversation, not in code. |

## 5. Suggested assignment split

If splitting this across people, the natural cut lines (each is
independent of the others once `decision_agent.py`/`ticket_agent.py`
exist, which they already do):

- **Person A — Identity + Asset**: `keycloak_connector.py` + `snipeit_connector.py`. Both mechanical REST+token APIs, similar shape, good pairing for one person.
- **Person B — Email + Time&Billing**: `mailu_connector.py` + `kimai_connector.py`. Note Person B should resolve MailU's integration approach *first* since it blocks their own second half less than it blocks everyone downstream.
- **Person C — Document Management**: `openkm_connector.py`. Independent of A/B, but should confirm the folder-structure convention with whoever owns the OpenKM instance before writing code.
- **Person D — Monitoring Agent**: `monitoring_agent.py`, once A/B/C have at least one `get_*_status` function each to wire up. Can start on the SLA-breach half (`_check_sla_breaches`, doesn't depend on any connector) immediately, in parallel.
- **Whoever owns product/architecture decisions**: PDD Suggestion #1 (`approvals.py`) — resolve this early since `onboarding_orchestrator.py` has a marked pause-point that depends on the answer.

## 6. How to verify your piece in isolation

Each connector function is called from exactly one place
(`onboarding_orchestrator.py`'s `_PROVISIONING_CALLS`), so:

1. Implement your connector's `create_*`/`allocate_*` function.
2. Run `POST /hrms/sync/new-hires` (or `POST /onboarding/{employee_id}/start` directly against an existing employee) — the orchestrator will call your function for real and log the result to `AuditLog` / `ProvisioningRecord`, whether it succeeds or throws.
3. Check `GET /onboarding/{employee_id}/provisioning` to see your item's `status` flip from `not_started`/`failed` to `completed`, and `external_ref` populated.

No other file needs touching to test your piece end-to-end.
