# Lab 4 (Sprint 4) — GitHub Issue Breakdown

Kept to the same six-issue shape the handout's own example uses (§11), continuing the numbering
from Issue 17. Ready to paste into GitHub Issues — each becomes issue **#54–#58** once created.
Note: the Issue 17 template's Definition of Done referenced "Lab 3 documents" / `lab3-staging`;
given everything else on that issue is scoped to Lab 4, that's treated below as a typo for "Lab 4
documents" / `lab4-staging`.

**Blocking rule:** Issues #54–#58 do not open implementation PRs until Issue #53 (this
engineering contract) is reviewed, approved, and merged to `lab4-staging`.

---

## Issue 17 — Sprint 4 Engineering Contract *(already tracked as #53, for reference)*

- **Branch:** `document/lab4`
- **Scope:** Author and get approval on `specification.md`, `ui-spec.md`, `api-spec.md`,
  `tests.md`; create Issues #54–#58 on the board; confirm the contract is complete before any
  implementation PR opens.
- **Definition of Done:** all four documents merged to `lab4-staging`; Issues #54–#58 exist on the
  GitHub Project board.

---

## Issue 18 — Actions Taken Foundation *(#54)*

- **Branch:** `feature/54-lab4-actions-taken-foundation`
- **Depends on:** #53 merged.
- **Scope:**
  - Prisma migration: `action_taken` and `action_result` tables (§7, `specification.md`).
  - Idempotent seed: `action_result` reference values; representative Tickets with zero/one/many
    actions across statuses and ownership.
  - Backend route → controller → service for `POST`/`GET /api/tickets/:ticketId/actions`,
    `PATCH /api/tickets/:ticketId/actions/:actionId`, `GET /api/reference/action-results`.
  - Authorization (Requester read-only, IT Staff/Admin read-write) and optimistic-concurrency
    (`updatedAt`) handling.
  - Tests: `server/tests/lab-04/actions-taken.api.test.ts`,
    `server/tests/lab-04/action-taken.validators.unit.test.ts`.
- **Definition of Done:** all Actions Taken endpoints pass their tests; migration/seed run clean
  against a Lab 3 database snapshot; PR reviewed and merged to `lab4-staging`.

## Issue 19 — Actions Taken UI *(#55)*

- **Branch:** `feature/55-lab4-actions-taken-ui`
- **Depends on:** #54 merged (needs the API).
- **Scope:**
  - Fill in the existing "Service Actions" tab on Ticket Detail: list/table view, accessible
    create/edit modal, conditional Follow-up Note field, empty state.
  - Role-based rendering: read-only for Requesters, full controls for IT Staff/Admin.
  - Responsive layout (table → stacked cards on mobile) and double-submit prevention.
  - Tests: `client/.../lab-04 tests/ActionsTaken.test.tsx`, `e2e/lab-04/actions-taken-flow.spec.ts`.
- **Definition of Done:** demonstrable create/list/edit flow for all three roles; component and
  E2E tests pass; PR reviewed and merged to `lab4-staging`.

## Issue 20 — Ticket Workflow & Resolution Gate *(#56)*

- **Branch:** `feature/56-lab4-ticket-workflow`
- **Depends on:** #54 merged (Resolved gate reads Action Taken data).
- **Scope:**
  - `PATCH /api/tickets/:ticketId/status` (general transitions) and extend the existing
    `PATCH /api/tickets/:id/resolution` with the BR-07 gate.
  - Enforce the full transition matrix and role restrictions (incl. Admin-only reopen from
    `Cancelled`/`Closed`) server-side.
  - Ticket Detail status control: only permitted transitions shown, disabled+reasoned state for a
    not-yet-resolvable Ticket.
  - Tests: `server/tests/lab-04/ticket-workflow.api.test.ts`,
    `client/.../lab-04 tests/TicketWorkflow.test.tsx`, `e2e/lab-04/ticket-resolution.spec.ts`.
- **Definition of Done:** every matrix edge and role restriction covered by a passing test; PR
  reviewed and merged to `lab4-staging`.

## Issue 21 — Role Dashboards *(#57)*

- **Branch:** `feature/57-lab4-role-dashboards`
- **Depends on:** #54 and #56 merged (dashboards read Ticket/Action data and status).
- **Scope:**
  - `GET /api/dashboard/requester`, `GET /api/dashboard/staff`, `GET /api/dashboard/admin`.
  - `RequesterDashboard` and `StaffDashboard` screens: metric cards, recent-tickets list, quick
    actions, drill-down navigation, new `/dashboard` route on the manual pathname router.
  - Loading/empty/safe-failure states for both dashboards.
  - Tests: `server/tests/lab-04/requester-dashboard.api.test.ts`,
    `server/tests/lab-04/staff-dashboard.api.test.ts`,
    `client/.../lab-04 tests/RequesterDashboard.test.tsx`,
    `client/.../lab-04 tests/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts`.
- **Definition of Done:** both dashboards demonstrable with non-zero and zero-metric examples;
  drill-down verified for every card; tests pass; PR reviewed and merged to `lab4-staging`.

## Issue 22 — Final Hardening & Regression *(#58)*

- **Branch:** `feature/58-lab4-final-hardening`
- **Depends on:** #55, #56, #57 merged.
- **Scope:**
  - Full Lab 1–3 regression pass (auth, My Tickets, Ticket Queue, Public Comments, Internal
    Notes, Attachments, User Management).
  - Accessibility and Zen Green visual-consistency sweep across every new and existing screen
    (`ui-spec.md` §7 checklist).
  - Remove leftover placeholder/duplicate/obsolete UI; verify no console errors or broken links.
  - Update README (setup/seed/migration/test/demo instructions); finalize
    `docs/lab-04/reviewer.md` and `docs/lab-04/ai-use.md`; capture
    `artifacts/lab-04/screenshots/` for staff-dashboard, requester-dashboard, and actions-taken.
- **Definition of Done:** full regression suite green on `main`; accessibility/visual checklist
  complete; README and submission docs current; PR reviewed and merged to `lab4-staging`, then
  `lab4-staging` merged to `main`.