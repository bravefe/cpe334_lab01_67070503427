# TokTickIT - Sprint 4 Test Plan and Traceability

Written alongside the Sprint 4 contract, before the implementation PRs (Test DD/TDD). Every
Acceptance Criterion in `specification.md` maps to at least one row below. The **Final** column is
`Planned` until the corresponding test is implemented and run against `main`, at which point it is
updated to `Pass`/`Fail` for submission (Part 3 requires the actual passing output from `main`).

## 0. Coverage Summary

| Category | Count | Primary file(s) |
|---|---:|---|
| Unit | 18 | `server/tests/lab-04/transition-matrix.api.test.ts` |
| API / Integration | 20 | `server/tests/lab-04/*.api.test.ts` |
| UI Component | 9 | `client/tests/lab-04/*.test.tsx` |
| UI Style | 2 | `client/tests/lab-04/ActionsTaken.test.tsx` |
| Responsive | 2 | `client/tests/lab-04/ActionsTaken.test.tsx`, `client/tests/lab-04/StaffDashboard.test.tsx` |
| Security / Authorization | 4 | `server/tests/lab-04/actions-taken.api.test.ts`, `server/tests/lab-04/ticket-workflow.api.test.ts`, `server/tests/lab-04/admin-dashboard.api.test.ts` |
| Migration / Regression | 1 | `server/tests/lab-04/actions-taken.api.test.ts` |
| End-to-End | 5 | `e2e/lab-04/*.spec.ts` |

Authorization and migration counts overlap the API / Integration count. The UI component count
excludes the two style and two responsive tests, which are listed separately. Action field
validation is covered through API integration tests; the repository does not currently have a
separate Action Taken validator unit-test file.

## 1. Unit

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-04 | Unit | BR-09 | Status-transition matrix lookup, role-specific next statuses, self-transitions, and unknown status inputs | Every documented edge is allowed; undocumented/invalid edges are rejected; only permitted roles receive the corresponding next status | `server/tests/lab-04/transition-matrix.api.test.ts` | Pass |
| UNIT-05 | Unit | BR-07 | Resolved-gate check with no actions, non-Resolved results, staff/admin results, requester results, and case variants | The gate opens only for an exact `Resolved` result recorded by IT Staff or Administrator | `server/tests/lab-04/transition-matrix.api.test.ts` | Pass |

## 2. API / Integration

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | FR-05, BR-03 | `performedById` sent by client on create | Ignored; server sets it from session regardless of body content | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-02 | API | BR-16 | Create Action Taken on a `Closed` Ticket | `409 Conflict` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-03 | API | AC-01 | Create a valid Action Taken | Created under the correct Ticket and actor | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-04 | API | AC-03, BR-04 | Create with `followUpRequired=true` and empty note | Validation error identifies `followUpNote`; no record is created | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-05 | API | AC-07, BR-11 | Edit Action Taken with stale `updatedAt` | `409 Conflict`, current record returned, no data overwritten | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-06 | API | AC-05, AC-06, BR-07 | Transition to `Resolved` with/without a staff-recorded `Resolved` Action Taken | Rejected without one; succeeds with one | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-07 | API | BR-09, BR-11 | Invalid transition, unknown status, and stale Ticket `updatedAt` | Invalid requests are rejected; stale update returns a conflict without overwriting | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| API-08 | API | AC-02, BR-14 | `GET /api/requester/dashboard` with a spoofed/foreign requester id in the query | Own session's data only; foreign id ignored; recent Tickets belong to the session user | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |
| API-09 | API | AC-08, BR-12, BR-13 | `GET /api/staff/dashboard` counts against a known seeded dataset | Unassigned/My Assigned/status/priority counts match an independently computed expectation | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| API-10 | API | API spec §1 | Omit `actionAt` when creating an Action Taken | Database current-time default is used | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-11 | API | FR-02 | Requester lists Actions Taken for their own Ticket | `200`; own Ticket's actions are available read-only | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| API-12 | API | FR-11, API spec §5 | IT Staff requests the Administrator Dashboard | `403`; no staff dashboard or user-count data is returned | `server/tests/lab-04/admin-dashboard.api.test.ts` | Pass |

## 3. UI Component

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UI-01 | UI | FR-04 | `ActionsTaken` renders for a Requester session | List is read-only; no Add/Edit controls present in the DOM | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-02 | UI | AC-11 | `ActionsTaken` with zero records | Renders the defined empty state, no error | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-03 | UI | AC-13 | Rapid double-click on Save in the create form | Submit button disables after first click; only one request fires | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| UI-04 | UI | FR-06, AC-05 | Ticket without a Resolved-gate action | `Resolved` option is disabled and the reason is explained; no transition request is sent | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| UI-05 | UI | AC-09 | Requester Dashboard with zero Tickets | All four cards show `0`, no error state | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pass |
| UI-06 | UI | FR-12, AC-10 | Clicking the Unassigned staff metric | Navigates to Ticket Queue with the matching owner filter applied | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| UI-07 | UI | FR-02, FR-04 | Actions Taken endpoint selected for IT Staff, Administrator, and Requester | Each role loads the Ticket's actions from its role-appropriate API endpoint | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |

## 4. UI Style / Visual Consistency

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| STYLE-01 | UI style | ui-spec.md §7 | Actions Taken styles and class conventions | Existing Zen Green tokens and established style conventions are used | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| STYLE-02 | UI style | ui-spec.md §4, §7 | Result badges and follow-up tags | Color is paired with visible text/non-color cues | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |

## 5. Responsive

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| RESP-01 | Responsive | ui-spec.md §2, §3, §6 | Dashboard card grids at desktop/tablet/mobile breakpoints | Six- and four-card grids reflow to the documented tablet and mobile layouts | `client/tests/lab-04/StaffDashboard.test.tsx` | Pass |
| RESP-02 | Responsive | ui-spec.md §4, §6 | Actions Taken table at mobile width | Table collapses to stacked cards with per-field labels | `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |

## 6. Authorization

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| AUTH-01 | Auth | AC-04 | Requester calls `POST /api/tickets/:id/actions` directly | `403 Forbidden` | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| AUTH-02 | Auth | BR-10, AC-12 | IT Staff attempts to exit a `Cancelled`/`Closed` Ticket | `403 Forbidden`; Administrator may reopen | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| AUTH-03 | Auth | §5 api-spec.md | Authorization sweep for status update, resolution, and Action Taken creation across anonymous, Requester, IT Staff, and Administrator callers | Each tested request matches its documented role/access rule | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| AUTH-04 | Auth | FR-11, API spec §5 | IT Staff attempts to access the Administrator Dashboard | `403 Forbidden` and no dashboard payload is leaked | `server/tests/lab-04/admin-dashboard.api.test.ts` | Pass |
| AUTH-05 | Auth | FR-02, API spec §1 | Requester requests Actions Taken for another Requester's Ticket | `403 Forbidden`; no foreign Ticket action data is returned | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |

## 7. Workflow

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| WF-01 | Workflow | BR-09 | Every edge in the transition matrix | Documented edges succeed for allowed roles and are rejected for others | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| WF-02 | Workflow | BR-08 | Requester "appears resolved" flag alone | Flag is advisory; Ticket status does not change | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| WF-03 | Workflow | FR-06, AC-05, AC-06 | Full lifecycle New → Open → In Progress → Resolved → Closed, adding a Resolved action before the gate | Valid transitions succeed in order; resolving is unavailable until the action is recorded | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| WF-04 | Workflow | BR-10, BR-16, AC-12 | Administrator reopens a `Closed` Ticket and resumes normal work | Reopen succeeds for Admin; after returning to an active status, a new Action Taken can be added | `e2e/lab-04/ticket-resolution.spec.ts` | Pass |

## 8. Migration

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| MIG-01 | Migration | — | Additive migration run against an existing database | Existing records are unchanged; existing Tickets have zero Action Taken rows at migration time | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |

## 9. Performance smoke

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| PERF-01 | Perf smoke | BR-12 | `GET /api/staff/dashboard` against ~500 seeded Tickets | Responds in under 500 ms locally with correct counts | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pass |
| PERF-02 | Perf smoke | BR-12 | `GET /api/requester/dashboard` against a Requester with ~50 Tickets | Responds in under 500 ms locally; `recentTickets` remains capped at 5 | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pass |

## 10. End-to-End

| Test ID | Type | Req/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01 | Full Actions Taken flow: IT Staff opens a Ticket, adds an action, sees it in the list, and edits it | Action appears immediately and the edit persists | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| E2E-02 | E2E | AC-03 | Create an Action Taken with Follow-Up Required checked and Follow-up Note left blank | Inline validation error shown; record is not created until the note is filled in | `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| E2E-03 | E2E | AC-05, AC-06, AC-10 | Resolution gate end to end, then dashboard drill-down from both roles | Resolve is rejected until a Resolved action exists; requester/staff metrics and drill-downs reflect the status change | `e2e/lab-04/dashboards.spec.ts` | Pass |

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
| AC-11 | UI-02 |
| AC-12 | AUTH-02, WF-04 |
| AC-13 | UI-03, E2E-01 |


```bash
Running 5 tests using 1 worker

  ✓  1 …ions Taken › E2E-01: IT Staff can add, view, and edit an Action Taken (10.8s)
  ✓  2 …4 Actions Taken › E2E-02: Follow-Up Required requires a follow-up note (8.3s)
  ✓  3 …olution gate unlocks and requester/staff dashboard drill-downs update (15.1s)
  ✓  4 …F-03: completes New → Open → In Progress → Resolved → Closed lifecycle (9.5s)
  ✓  5 …› WF-04: Administrator reopens a Closed Ticket and normal flow resumes (4.7s)
  5 passed (1.1m)
```

```bash
npm notice run toktickit-server@1.0.0 test
npm notice run vitest run tests/lab-04

 RUN  v5.0.1 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-04/ticket-workflow.api.test.ts (6 tests) 1643ms
   ✓ Lab 4 Ticket Workflow API (6)
     ✓ WF-01: every matrix edge succeeds for allowed roles and is rejected for others 524ms
 ✓ tests/lab-04/actions-taken.api.test.ts (10 tests) 748ms
 ✓ tests/lab-04/requester-dashboard.api.test.ts (2 tests) 616ms
 ✓ tests/lab-04/staff-dashboard.api.test.ts (2 tests) 499ms
 ✓ tests/lab-04/transition-matrix.api.test.ts (18 tests) 8ms
 ✓ tests/lab-04/admin-dashboard.api.test.ts (1 test) 292ms

 Test Files  6 passed (6)
      Tests  39 passed (39)
   Start at  09:17:37
   Duration  5.54s (tests 77%, import 18%, transform 4%)

    Isolate  6 workers spawned · ~95ms startup each (spawn + environment, per file)
             at least ~473ms faster with isolate: false — reuses workers across files instead of one per file

```

```bash
npm notice run vitest run tests/lab-04

 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-04/ActionsTaken.test.tsx (9) 869ms
 ✓ tests/lab-04/RequesterDashboard.test.tsx (1)
 ✓ tests/lab-04/StaffDashboard.test.tsx (2) 370ms
 ✓ tests/lab-04/TicketWorkflow.test.tsx (1)

 Test Files  4 passed (4)
      Tests  13 passed (13)
   Start at  09:06:15
   Duration  2.50s (transform 625ms, setup 384ms, collect 2.10s, tests 1.70s, environment 2.24s, prepare 907ms)

```