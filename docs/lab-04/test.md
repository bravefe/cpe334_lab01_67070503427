# TokTickIT — Sprint 4 Test Plan and Traceability

Written alongside the Sprint 4 contract, before the implementation PRs (Test DD/TDD). Every
Acceptance Criterion in `specification.md` maps to at least one row below. The **Final** column is
`Planned` until the corresponding test is implemented and run against `main`, at which point it is
updated to `Pass`/`Fail` for submission (Part 3 requires the actual passing output from `main`).

## 1. Unit

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-06 | Action Date/Time bounds check | Rejects a date before Ticket creation or after "now"; accepts anything in range | `server/tests/lab-04/action-taken.validators.unit.test.ts` | Planned |
| UNIT-02 | Unit | BR-04 | Follow-up Note conditional-required rule | Rejects empty note when `followUpRequired=true`; allows empty/null when `false` | `server/tests/lab-04/action-taken.validators.unit.test.ts` | Planned |
| UNIT-03 | Unit | BR-05 | Description min-length/trim rule | Rejects blank/whitespace-only or <3-char description | `server/tests/lab-04/action-taken.validators.unit.test.ts` | Planned |
| UNIT-04 | Unit | BR-09 | Status-transition matrix lookup function | Returns allowed=true only for pairs in the matrix; false for everything else | `server/tests/lab-04/status-transition-matrix.unit.test.ts` | Planned |
| UNIT-05 | Unit | BR-07 | Resolved-gate check function | Returns false with no `Resolved`-result Action Taken; true once one exists | `server/tests/lab-04/status-transition-matrix.unit.test.ts` | Planned |

## 2. API / Integration

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | FR-05, BR-03 | `performedById` sent by client on create | Ignored; server sets it from session regardless of body content | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-02 | API | BR-16 | Create Action Taken on a `Closed` Ticket | `409 Conflict` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-03 | API | AC-01 | Create a valid Actions Taken | Created under the correct Ticket and actor | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-04 | API | AC-03 | Create with `followUpRequired=true` and empty note | `422` with `field: "followUpNote"` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-05 | API | AC-07, BR-11 | Edit Action Taken with stale `updatedAt` | `409 Conflict`, current record returned, no data overwritten | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| API-06 | API | AC-05, AC-06 | Transition to `Resolved` with/without a `Resolved`-result Action Taken | Rejected without one; succeeds with one | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-07 | API | BR-09 | Transition not in the matrix (e.g. `New` → `Resolved`) | `409 Conflict` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| API-08 | API | AC-02, BR-14 | `GET /api/dashboard/requester` with a spoofed/foreign requester id in the query | Own session's data only; foreign id ignored | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| API-09 | API | AC-08, BR-13 | `GET /api/dashboard/staff` counts against a known seeded dataset | Unassigned/My Assigned/status counts match a hand-computed expectation | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |

## 3. UI Component

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UI-01 | UI | FR-04 | `ActionsTaken` renders for a Requester session | List is read-only; no Add/Edit controls present in the DOM | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-02 | UI | AC-11 | `ActionsTaken` with zero records | Renders the defined empty state, no error | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-03 | UI | AC-13 | Rapid double-click on Save in the create form | Submit button disables after first click; only one request fires | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| UI-04 | UI | FR-06 | `TicketWorkflow` control on a Ticket without a Resolved-gate action | `Resolved` option shown disabled with the explanatory reason | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| UI-05 | UI | AC-09 | `RequesterDashboard` with zero Tickets | All four cards show `0`, no error state | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| UI-06 | UI | FR-12, AC-10 | Clicking a `StaffDashboard` metric card | Navigates to Ticket Queue pre-filtered to match that metric | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |

## 4. UI Style / Visual Consistency

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| STYLE-01 | UI style | §7 (handout) | New screens against the Zen Green token set (color, spacing, type scale) | No ad-hoc colors/spacing outside the existing tokens | `client/tests/lab-04/ActionsTaken.test.tsx` (snapshot) | Planned |
| STYLE-02 | UI style | Accessibility checklist | Result/status badges | Every badge pairs color with a text label or icon (non-color cue) | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |

## 5. Responsive

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| RESP-01 | Responsive | ui-spec.md §6 | Dashboard card grids at desktop/tablet/mobile widths | Cards reflow per breakpoint; no clipping or overlap | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| RESP-02 | Responsive | ui-spec.md §6 | Actions Taken table at mobile width | Table collapses to stacked cards; no horizontal page scroll | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |

## 6. Authorization

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| AUTH-01 | Auth | AC-04 | Requester calls `POST /api/tickets/:id/actions` directly | `403 Forbidden` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| AUTH-02 | Auth | BR-10, AC-12 | IT Staff attempts to exit a `Cancelled`/`Closed` Ticket | `403 Forbidden`; only Administrator succeeds | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| AUTH-03 | Auth | §5 api-spec.md | Full authorization-matrix sweep across all Lab 4 endpoints × 3 roles | Every cell matches the documented matrix | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |

## 7. Workflow

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| WF-01 | Workflow | BR-09 | Every edge in the transition matrix | Each documented `from→to` succeeds for its allowed roles | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-02 | Workflow | BR-08 | Requester "appears resolved" flag alone | Ticket status unchanged; flag stored/displayed as advisory only | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| WF-03 | Workflow | FR-06 | Full lifecycle New → Open → In Progress → Resolved → Closed with an Action Taken added at the right point | Each transition succeeds in order; fails if attempted out of order | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| WF-04 | Workflow | BR-10 | Administrator reopens a `Closed` Ticket, then normal flow resumes | Reopen succeeds for Admin; new Action Taken can then be added (BR-16) | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |

## 8. Migration / Regression

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| REG-01 | Regression | AC-11 | Migration run against a Lab 3 database snapshot | All existing Tickets/Attachments/Comments/Notes intact; zero Action Taken rows on legacy Tickets | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| REG-02 | Regression | AC-14 | Full Lab 1–3 automated suite | Runs unmodified against the Lab 4 build; all previously passing tests still pass | (existing Lab 1–3 test files, re-run) | Planned |
| REG-03 | Regression | FR-13 | Manual smoke pass: auth, My Tickets, Ticket Queue, Public Comments, Internal Notes, Attachments, User Management | Each still behaves exactly as in Lab 3 | `artifacts/lab-04/screenshots/` (evidence) | Planned |

## 9. Performance smoke

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| PERF-01 | Perf smoke | BR-12 | `GET /api/dashboard/staff` against ~500 seeded Tickets | Responds within an agreed threshold (e.g. < 500 ms locally) with correct counts | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| PERF-02 | Perf smoke | BR-12 | `GET /api/dashboard/requester` against a Requester with ~50 Tickets | Responds within threshold; `recentTickets` still capped at 5 | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |

## 10. End-to-End

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01, AC-13 | Full Actions Taken flow: IT Staff opens a Ticket, adds an action, sees it in the list, edits it | Action appears immediately, edit persists, no duplicate on double-click | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-02 | E2E | AC-03 | Create an Action Taken with Follow-Up Required checked and Follow-up Note left blank | Inline validation error shown; record is not created until the note is filled in | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| E2E-03 | E2E | AC-05, AC-06, AC-10 | Resolution gate end to end, then dashboard drill-down from both roles | Resolve blocked until a Resolved action exists; both dashboards' cards and drill-downs reflect the change | `e2e/lab-04/dashboards.spec.ts` | Planned |

## Acceptance Criteria → Test Traceability

| AC | Covered by |
|---|---|
| AC-01 | API-03, E2E-01 |
| AC-02 | API-08 |
| AC-03 | API-04, E2E-02 |
| AC-04 | AUTH-01 |
| AC-05 | API-06, E2E-03 |
| AC-06 | API-06, E2E-03 |
| AC-07 | API-05 |
| AC-08 | API-09 |
| AC-09 | UI-05 |
| AC-10 | UI-06, E2E-03 |
| AC-11 | UI-02, REG-01 |
| AC-12 | AUTH-02 |
| AC-13 | UI-03, E2E-01 |
| AC-14 | REG-02 |
