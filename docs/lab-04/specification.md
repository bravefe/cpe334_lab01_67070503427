# TokTickIT — Sprint 4 Engineering Specification

**Course:** CPE 334, Sections 1, 2, HS, 31, 32 — Semester 1/2026
**Sprint:** Lab 4 — Actions Taken, Dashboards, and Final Regression
**Status:** Draft for review under Issue #53 (branch `document/lab4`)
**Depends on:** Lab 3 `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md` (all merged to `lab3-staging`)

---

## 1. Sprint Goal

Sprint 4 completes the TokTickIT service-desk workflow. IT Staff and Administrators can now
record **Actions Taken** against a Ticket, the Ticket status lifecycle is fully enforced end to end
(including a backend-enforced resolution gate), and Requesters, IT Staff, and Administrators each
get a concise, role-appropriate **Dashboard** that links back to the existing detailed screens. The
sprint closes with a full regression and accessibility/visual hardening pass so the application from
Labs 1–3 (auth, My Tickets, Ticket Queue, Public Comments, Internal Notes, Attachments, User
Management) keeps working exactly as before.

## 2. Stakeholder Request (interpreted)

The stakeholder wants a durable, auditable record of the actual work IT Staff perform on a Ticket —
not just comments and notes, but discrete actions with a date/time, description, outcome, and an
explicit follow-up flag. A Requester's own claim that "this looks fixed" should never be enough to
close a Ticket by itself; an IT Staff member must review the work and formally move the Ticket
through its status lifecycle. Both Requesters and IT Staff should be able to see, at a glance, what
needs their attention next, without replacing the detailed Ticket screens they already use.

## 3. Scope

### 3.1 Included
- Actions Taken: create, list, and edit, scoped to a Ticket.
- The complete Ticket status-transition matrix, including a backend-enforced Resolved gate.
- Requester Dashboard and IT Staff Dashboard (Administrator reuses the IT Staff Dashboard).
- Database/Prisma increments, migration, and idempotent seed data for the above.
- REST API increments for Actions Taken, status transitions, and dashboards.
- Zen Green UI extensions for all new screens, responsive and accessible.
- Full regression of Labs 1–3 behavior and final hardening (safe failure, duplicate-submit
  prevention, console/UI cleanup).

### 3.2 Explicitly excluded (per handout §4.2)
- Automatic SLA clocks, escalation engines, on-call scheduling, breach notifications.
- Email, SMS, LINE, push, or other external notifications.
- Inventory/spare-parts management, purchasing, or cost accounting.
- Time-sheet billing, payroll, or labor-cost calculation.
- Multi-level approval workflows or electronic signatures.
- Advanced BI tools, custom report builders, export warehouses.
- Multi-tenant organizations or production-scale cloud operations.
- Any feature not covered by this contract.

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | IT Staff and Administrator can create an Action Taken on any Ticket they are authorized to access. |
| FR-02 | IT Staff, Administrator, and the owning Requester can view the full list of Action Taken records for a Ticket, ordered by Action Date/Time (most recent first). |
| FR-03 | IT Staff and Administrator can edit an existing Action Taken's Description, Result, Follow-Up Required, Follow-up Note, and Attachment Notes. |
| FR-04 | Requesters see Actions Taken read-only; no create/edit controls are shown or accepted from a Requester session. |
| FR-05 | Performed By is set automatically from the authenticated session on create and is never accepted from client input. |
| FR-06 | IT Staff/Administrator can transition a Ticket's status from Ticket Detail, restricted to the matrix in §5.2. |
| FR-07 | The backend enforces the Resolved-transition gate (BR-07) independent of what the UI shows. |
| FR-08 | Requesters can continue to flag a Ticket as "appears resolved" (carried from Lab 3); this remains advisory only. |
| FR-09 | The system provides a Requester Dashboard summarizing only the authenticated Requester's own Tickets. |
| FR-10 | The system provides an IT Staff Dashboard summarizing operational data across the Tickets that user is authorized to see. |
| FR-11 | The system provides an Administrator Dashboard that reuses the IT Staff Dashboard and adds concise user-account counts. |
| FR-12 | Every dashboard card/list item supports drill-down navigation to the corresponding filtered Ticket Queue, My Tickets, or Ticket Detail view. |
| FR-13 | All Lab 1–3 features continue to function without regression: authentication, My Tickets, Create Ticket, Ticket Queue, ownership, IT Priority, Public Comments, Internal Notes, Attachments, and User Management. |
| FR-14 | Loading, empty, forbidden, conflict, not-found, and safe-failure states are consistent across all new and existing screens. |
| FR-15 | Duplicate submissions (double-click, network retry) on Action Taken creation and status transitions are prevented or safely deduplicated. |

## 5. Business Rules

### 5.1 Actions Taken

| ID | Rule |
|---|---|
| BR-01 | An Action Taken belongs to exactly one Ticket. |
| BR-02 | The Ticket Owner coordinates the Ticket as a whole, but an Action Taken may be recorded by a different IT Staff member. |
| BR-03 | Performed By is always the authenticated actor from the session; the client cannot set or override it. |
| BR-04 | Follow-up Note is required (non-empty, trimmed) when Follow-Up Required is `true`; it is cleared/ignored when `false`. |
| BR-05 | Action Description is required, trimmed, and at least 3 characters. |
| BR-06 | Action Date/Time must be on or after the Ticket's creation date/time and not later than the current server time. |
| BR-15 | Any IT Staff/Administrator with access to the Ticket may edit any Action Taken on it, not only the one who originally recorded it (consistent with BR-02). |
| BR-16 | Action Taken records can only be created while the Ticket's status is not `Closed` or `Cancelled`; the Ticket must first be Reopened (BR-10). |

### 5.2 Ticket Status and Resolution

Statuses (unchanged from the handout): `New`, `Open`, `In Progress`, `Waiting for Requester`,
`Resolved`, `Closed`, `Reopened`, `Cancelled`.

| ID | Rule |
|---|---|
| BR-07 | A Ticket transitions to `Resolved` only when the request comes from IT Staff/Administrator **and** the Ticket already has at least one Action Taken record with Result = `Resolved`, recorded by IT Staff/Administrator. |
| BR-08 | A Requester's "appears resolved" flag (Lab 3) is stored as advisory only; it never triggers the `Resolved` transition itself — BR-07 always governs. |
| BR-09 | The backend rejects any status transition not present in the matrix below with `409 Conflict`, regardless of what the client UI currently shows. |
| BR-10 | Only Administrators may move a Ticket out of `Cancelled` or `Closed` (override reopen); IT Staff cannot. |
| BR-11 | Updates to a Ticket or an Action Taken use optimistic concurrency: the client must send the record's last-seen `updatedAt`; a mismatch is rejected with `409 Conflict` and the current record is returned so the client can refetch. |

**Ticket status-transition matrix**

| From | To | Allowed roles | Precondition |
|---|---|---|---|
| New | Open | IT Staff, Administrator | — |
| New | Cancelled | Requester, IT Staff, Administrator | — |
| Open | In Progress | IT Staff, Administrator | Ticket must have an Owner (auto-assigned to the acting user if unset) |
| Open | Waiting for Requester | IT Staff, Administrator | — |
| Open | Cancelled | IT Staff, Administrator | — |
| In Progress | Waiting for Requester | IT Staff, Administrator | — |
| In Progress | Resolved | IT Staff, Administrator | BR-07 gate |
| In Progress | Cancelled | IT Staff, Administrator | — |
| Waiting for Requester | In Progress | IT Staff, Administrator | — |
| Waiting for Requester | Cancelled | IT Staff, Administrator | — |
| Resolved | Closed | IT Staff, Administrator | — |
| Resolved | Reopened | Requester, IT Staff, Administrator | — |
| Closed | Reopened | Administrator only | BR-10 |
| Reopened | In Progress | IT Staff, Administrator | — |
| Reopened | Cancelled | IT Staff, Administrator | — |
| Cancelled | Reopened | Administrator only | BR-10 |

### 5.3 Dashboards

| ID | Rule |
|---|---|
| BR-12 | Every dashboard metric is computed by the backend from live Ticket/Action Taken data at request time; the client never derives a count locally. |
| BR-13 | IT Staff dashboard: `Unassigned` = Tickets with no Owner and status not in `{Closed, Cancelled}`. `My Assigned` = Tickets where Owner = current user and status not in `{Closed, Cancelled}`. |
| BR-14 | The Requester Dashboard is always scoped server-side to Tickets where Requester = current session user, regardless of any client-supplied filter or id. |

## 6. UI Specification Summary

Full detail lives in [`ui-spec.md`](./ui-spec.md). Summary:

- **IT Staff Dashboard** (`/dashboard`, staff/admin view) — six metric cards (Unassigned, My
  Assigned, New, Open, In Progress, Waiting for Requester), a by-IT-Priority breakdown, a Recent
  Tickets list, and Quick Actions. Every card and row is a drill-down link.
- **Requester Dashboard** (`/dashboard`, requester view) — four metric cards (Total Open, Waiting
  for You, Recently Resolved, Closed), a Recent Tickets list, and Quick Actions.
- **Actions Taken** — a new, filled-in "Service Actions" tab on the existing Ticket Detail tab bar
  (previously a Lab 3 placeholder), with a list/table view and an accessible create/edit form.
- **Ticket Workflow controls** — a status control on Ticket Detail that only offers permitted next
  statuses, with the backend as final authority and a plain-language reason shown when the
  Resolved gate isn't met yet.
- All new screens reuse the existing Zen Green tokens, card/table/badge/button/form components,
  and loading/empty/forbidden/error conventions from Labs 2–3.

## 7. Data Changes

### 7.1 New tables

**`action_taken`**

| Field | Type | Notes |
|---|---|---|
| `id` | integer, PK | Matches existing integer-ID convention (not UUID). |
| `ticket_id` | integer, FK → `ticket.id` | BR-01. Indexed. |
| `action_at` | timestamp | Client-supplied, bounded by BR-06. |
| `description` | text | BR-05. |
| `result_id` | integer, FK → `action_result.id` | See §7.2. |
| `performed_by_user_id` | integer, FK → `user.id` | Server-set only (BR-03). Indexed. |
| `follow_up_required` | boolean | Default `false`. |
| `follow_up_note` | text, nullable | Required when `follow_up_required = true` (BR-04). |
| `attachment_notes` | text, nullable | Free text, e.g. "see screenshot_2026.png". |
| `created_at` | timestamp | Audit; server-set. |
| `updated_at` | timestamp | Audit + optimistic-concurrency token (BR-11). |

**`action_result`** (reference table, same pattern as existing `status`/`priority`/`category`)

Seed values: `In Progress`, `Resolved`, `Escalated`, `No Fault Found`, `Awaiting Parts / Access`,
`Duplicate / No Action Needed`. The literal value `Resolved` is what BR-07's gate checks against.

### 7.2 Indexes

- `action_taken(ticket_id)`, `action_taken(performed_by_user_id)`
- `ticket(status_id)`, `ticket(owner_user_id)` (support dashboard aggregate queries)

### 7.3 Migration and backfill

The migration is additive only — no existing `ticket`, `attachment`, `public_comment`, or
`internal_note` data is touched. Legacy Tickets get zero `action_taken` rows; the Actions Taken UI
and all dashboard counts must treat "zero rows" as a normal, defined empty state rather than an
error (AC-11). Rollback drops the two new tables and their FKs; no data from Labs 1–3 is at risk
because nothing existing is altered.

### 7.4 Seed data

Idempotent (safe to re-run): upserts `action_result` reference rows by name, and seeds a
representative spread of Tickets — some with zero, one, and multiple Action Taken rows, across
every status, with both assigned and unassigned ownership — so every dashboard metric has at
least one non-zero example and at least one zero/empty example to demonstrate.

### 7.5 Design decisions (justification)

1. **`action_result` as a reference table, not free text or a Prisma enum** — consistent with how
   `status`/`priority`/`category` are already modeled in this codebase, and it lets BR-07's gate do
   an exact, typo-proof match on `Resolved` instead of fuzzy string comparison.
2. **Optimistic concurrency via `updated_at` rather than a new integer `version` column** — reuses
   a field every record already has, keeps the same conflict-detection approach on both `ticket`
   and `action_taken`, and needs no extra schema surface.

## 8. API Contract

Full detail lives in [`api-spec.md`](./api-spec.md). New endpoints:

- `POST /api/tickets/:ticketId/actions` — create an Action Taken.
- `GET /api/tickets/:ticketId/actions` — list Action Taken for a Ticket.
- `PATCH /api/tickets/:ticketId/actions/:actionId` — edit an Action Taken.
- `GET /api/reference/action-results` — list Result reference values.
- `PATCH /api/tickets/:ticketId/status` — general status transition (matrix-enforced); the Lab 3
  `PATCH /api/tickets/:id/resolution` endpoint is kept and now also enforces BR-07.
- `GET /api/dashboard/requester`, `GET /api/dashboard/staff` (Administrator reuses the staff
  payload plus a user-count summary).

All Labs 2–3 endpoints (auth, tickets, comments, notes, attachments, categories, users) are
unchanged.

## 9. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | Given a permitted IT Staff user and valid data, when an Actions Taken is created, then it is saved under the correct Ticket with the authenticated creator and approved assignee. |
| AC-02 | Given an authenticated Requester, when dashboard data is retrieved, then only metrics and recent Tickets owned by that Requester are returned. |
| AC-03 | Given Follow-Up Required is set to `true` with an empty Follow-up Note, when the record is submitted, then the request is rejected with a field-level `422` validation error. |
| AC-04 | Given a Requester, when they call the create-Action-Taken API directly, then the request is rejected with `403 Forbidden` regardless of UI state. |
| AC-05 | Given a Ticket with no `Resolved`-result Action Taken, when IT Staff attempts to transition it to `Resolved`, then the transition is rejected and the reason is shown. |
| AC-06 | Given a Ticket with a `Resolved`-result Action Taken recorded by IT Staff, when IT Staff transitions it to `Resolved`, then the transition succeeds and the Ticket summary refreshes. |
| AC-07 | Given two IT Staff editing the same Action Taken concurrently, when the second save uses a stale `updatedAt`, then the server returns `409 Conflict` and no data is silently overwritten. |
| AC-08 | Given an authenticated IT Staff user, when the IT Staff Dashboard is requested, then Unassigned/My Assigned/status counts and recent Tickets reflect only Tickets that user may see, computed server-side. |
| AC-09 | Given a Requester with zero Tickets, when the Requester Dashboard is requested, then every metric card renders its defined empty state without error. |
| AC-10 | Given any dashboard metric card, when clicked, then the corresponding filtered Ticket list/queue opens showing the same record set implied by that metric. |
| AC-11 | Given a legacy Ticket with zero Action Taken records, when its Ticket Detail is viewed, then the Actions Taken area renders the defined empty state, not an error. |
| AC-12 | Given a Cancelled or Closed Ticket, when viewed by IT Staff vs. Administrator, then only the Administrator sees a reopen control. |
| AC-13 | Given a rapid double-click on "Save Action Taken," when two submissions race, then only one Action Taken record is created. |
| AC-14 | Given the Lab 1–3 regression suite, when run against the Lab 4 build, then all previously passing behavior still passes. |

## 10. Definition of Done

- [ ] `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md` reviewed and merged to `lab4-staging` **before** any implementation PR is opened (tracked by Issue #53).
- [ ] All FR-01–FR-15 implemented and demonstrable.
- [ ] All BR-01–BR-16 enforced server-side (verified by tests, not just hidden UI controls).
- [ ] All AC-01–AC-14 covered by at least one automated test, traced in `tests.md`.
- [ ] Migration applied cleanly to a database seeded with Lab 1–3 data; rollback documented and tested.
- [ ] Idempotent seed script runs twice with no duplicate/erroring data.
- [ ] Full Lab 1–3 regression suite passes on the Lab 4 build.
- [ ] Zen Green visual/accessibility checklist completed for every new screen (see `ui-spec.md`).
- [ ] No console errors, dead links, placeholder text, or unfinished controls remain.
- [ ] README setup/seed/migration/test/demo instructions are current.
- [ ] `docs/lab-04/reviewer.md` and `docs/lab-04/ai-use.md` completed.

## 11. Assumptions and Decisions

- The Result of an Action Taken is a controlled reference value (§7.2), not free text, so the
  Resolved gate (BR-07) can match on it exactly.
- The Resolved gate ties directly to Actions Taken content — this is the specific "business rule
  spanning related records and state transitions" the handout's learning outcomes call for.
- Only Administrators can reopen a `Cancelled`/`Closed` Ticket; this is a deliberate exception to
  otherwise-symmetric IT Staff/Administrator permissions, matching the handout's note that
  Administrators "retain administrative access needed for support and testing."
- Both roles get an explicit "Dashboard" nav entry (the Lab 4 handout's Requester mockup shows
  "My Tickets" in the nav instead; treated as a simplification in the mockup image).
- Dashboards are new, standalone routes (`/dashboard`) added to the existing manual
  pathname-router (`window.history.pushState`/`popstate`), consistent with how Login,
  MyTickets, CreateTicket, and TicketDetail are already routed — no router library is introduced.
- The Actions Taken UI fills in the "Service Actions" tab on Ticket Detail that Lab 3 already
  added as a placeholder, rather than introducing a new tab.
- `recentTickets` on both dashboards is capped at 5 records per the handout's "concise, not entire
  collections" rule; "View all" drills into the existing Ticket Queue/My Tickets screen with the
  matching filter applied.