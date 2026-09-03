# TokTickIT — Lab 2 Test Plan

## 1. Test Strategy

This test plan is based on the Sprint Engineering Specification, API Spec, and UI Spec before implementation is complete (Test-DD). Testing follows a TDD approach: write the test, implement the required behavior, and keep the test passing.

Testing covers four levels: **Unit, API, UI, and E2E**. Tests are grouped by screen or endpoint and consolidated into the defined test files rather than creating a separate file for each scenario.

Coverage includes:
- Happy paths and successful operations
- Validation and boundary conditions
- Ownership and cross-Requester isolation
- Server and network failure handling
- Loading, empty, and no-results states
- Accessibility and visual requirements
- Attachment upload, download, and soft-removal lifecycle

The **API tests** verify backend behavior, validation, persistence, ownership enforcement, and error responses. **UI tests** verify client-side validation, interaction, loading states, and screen behavior. **Style tests** verify required visual states such as badges and read-only fields. **Responsive tests** verify layouts at mobile viewport sizes. **E2E tests** verify complete Requester workflows across the frontend and backend.

No planned test is skipped, disabled, commented out, or intentionally left flaky. Every test starts as `Pending` and is updated to `Pass` or `Fail` after implementation and execution.

| Status | Used For |
|---|---|
| 200 | Successful retrieval (list, detail, attachment/comment/action/log metadata, download, remove) |
| 201 | Ticket created; Attachment uploaded |
| 400 | Validation failure |
| 404 | Ticket/Attachment/Comment/Action/Log not found, or not owned by the current Requester (BR-11) |
| 409 | Soft-remove attempted on an already-removed Attachment |
| 413 | Attachment exceeds 5 MB |
| 415 | Attachment type not in the allowed list |
| 422 | Upload would exceed the 5 active-Attachment limit |
| 500 | Unexpected server error (generic, safe message only — no stack traces to client) |

## 2. Planned Tests

### `server/tests/lab-02/create-ticket.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-01 | Ticket Number generator format `TKT-<YYYY>-<6-digit seq>` | Generated code matches format and is unique per call | Pending |
| API-01 | API | AC-01 | `POST /api/tickets` with valid data | 201; one Ticket saved; backend-generated Ticket Number returned | Pending |
| API-02 | API | AC-05 | `POST /api/tickets` with empty `summary` | 400 with `fieldErrors` for `summary`; no Ticket persisted | Pending |
| API-03 | API | AC-06 | `POST /api/tickets` with `description` < 20 chars | 400 naming the 20-char minimum | Pending |
| API-04 | API | AC-07 | `POST /api/tickets` with `summary` = exactly 150 chars | 201; Ticket created (upper boundary passes) | Pending |
| API-05 | API | AC-08 | `POST /api/tickets` with `summary` = 151 chars | 400; Ticket not created (upper boundary fails) | Pending |
| API-06 | API | AC-14 | Ticket create succeeds, Attachment upload then fails | Ticket persists with its number; failed Attachment reported separately (BR-21) | Pending |
| API-07 | API | AC-13 | `POST /api/tickets` when server errors after validation passes | 500 safe envelope; no Ticket row persisted (BR-20) | Pending |

### `server/tests/lab-02/attachments.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| API-01 | API | AC-01 | `POST /api/tickets` with valid data | 201; one Ticket saved; backend-generated Ticket Number returned | Pending |
| API-02 | API | AC-05 | `POST /api/tickets` with empty `summary` | 400 with `fieldErrors` for `summary`; no Ticket persisted | Pending |
| API-03 | API | AC-06 | `POST /api/tickets` with `description` < 20 chars | 400 naming the 20-char minimum | Pending |
| API-04 | API | AC-07 | `POST /api/tickets` with `summary` = exactly 150 chars | 201; Ticket created (upper boundary passes) | Pending |
| API-05 | API | AC-08 | `POST /api/tickets` with `summary` = 151 chars | 400; Ticket not created (upper boundary fails) | Pending |
| API-06 | API | AC-14 | Ticket create succeeds, Attachment upload then fails | Ticket persists with its number; failed Attachment reported separately (BR-21) | Pending |
| API-07 | API | AC-13 | `POST /api/tickets` when server errors after validation passes | 500 safe envelope; no Ticket row persisted (BR-20) | Pending |

### `server/tests/lab-02/my-tickets.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| API-16 | API | AC-04 | `GET /api/tickets` as Requester B | List contains none of Requester A's Tickets | Pending |
| API-17 | API | AC-15 | `GET /api/tickets?search=<partial ticket #>` | Only Tickets whose number contains the text returned | Pending |
| API-18 | API | AC-16 | `GET /api/tickets?category=&requestedPriorityId=` combined | Only Tickets matching both filters returned (BR-13) | Pending |
| API-19 | API | AC-17 | Toggle `sortDir` on `sortBy=createdAt` | List order reverses accordingly | Pending |
| API-20 | API | AC-18 | Page forward beyond page size | Next set of Tickets loads; `page`/`totalPages` metadata correct | Pending |
| API-21 | API | BR-15 | `page`/`pageSize` with invalid values (e.g. negative, non-numeric) | Falls back to defaults (page 1, size 10) instead of erroring | Pending |
| API-22 | API | AC-25 | `GET /api/dev-requesters` with one inactive Requester seeded | Inactive Requester absent from response (BR-06) | Pending |



### `server/tests/lab-02/ticket-detail.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| API-23 | API | AC-03 | `GET /api/tickets/:ticketCode` for Requester A's Ticket while B is current | 404; no Ticket data returned (BR-11) | Pending |

### `client/tests/lab-02/CreateTicket.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-01 | UI | AC-02 | Navigate to Create Ticket with no Requester selected | Redirected to Requester Selection screen (BR-08) | Pending |
| UI-02 | UI | AC-05 | Click Submit with Summary empty | Inline field message shown; no API call made | Pending |
| UI-03 | UI | AC-06 | Type a 19-character Description and submit | Boundary message names the 20-char minimum | Pending |
| UI-04 | UI | AC-12 | Click Submit on a valid form | Submit disabled + busy indicator until request resolves (BR-19) | Pending |
| UI-05 | UI | AC-13 | Submit valid form while backend is unreachable | Safe error banner shown; all field values remain in the form | Pending |
| UI-06 | UI | AC-28 | Tab through the Create Ticket form using keyboard only | Every control reachable in logical order with visible focus indicator | Pending |
| UI-07 | UI | BR-01, BR-03 | Render Create Ticket system-generated fields (Ticket #, Date, Requester) | Read-only fields use distinct shading, no focus ring, not tab-stoppable | Pending |

### `client/tests/lab-02/MyTickets.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-11 | UI | AC-19 | Open My Tickets for a Requester with zero Tickets | Empty state (not No-Results) shown with Create Ticket CTA | Pending |
| UI-12 | UI | AC-20 | Apply filters that match no owned Tickets | No-Results state shown with a Clear Filters action | Pending |
| UI-13 | UI | AC-26 | Use Change Requester to pick a different active Requester | My Tickets reloads showing only the new Requester's Tickets (BR-07) | Pending |


### `client/tests/lab-02/AttachmentSection.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-08 | UI | AC-09, AC-10 | Select a `.gif` or an oversized PDF in the Attachment control | Rejected client-side before any upload call, with a clear message | Pending |
| UI-09 | UI | AC-11 | Attachment control on a Ticket with 5 active Attachments | Remaining-slots indicator shows 0; a 6th file is blocked with a limit message | Pending |
| UI-10 | UI | AC-23 | Click Remove on an Attachment without entering a reason | Removal blocked until a non-empty reason is entered | Pending |

### `client/tests/lab-02/RequesterTicketDetail.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-15 | UI | AC-21 | Add a valid Attachment from Ticket Detail | New Attachment appears in list as Active without a page reload | Pending |
| UI-16 | UI | AC-24 | View Ticket Detail after an Attachment was soft-removed | Attachment shown greyed-out with metadata/reason; download control disabled | Pending |

### `e2e/lab-02/requester-ticket-flow.spec.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01, AC-05 | Complete Requester selection → Create Ticket submission flow | Confirmation displays the backend-generated Ticket Number | Pending |
| E2E-02 | E2E | AC-03, AC-04 | Requester A creates a Ticket; switch to Requester B and search My Tickets / open by number | Requester B never sees A's Ticket in list or detail | Pending |
| E2E-03 | E2E | AC-21, AC-22, AC-23, AC-24 | Full Attachment lifecycle: add, download, soft-remove with reason | Attachment shows Active then Removed with metadata; download disabled after removal | Pending |
| E2E-04 | E2E | AC-25, AC-26 | Open selector (inactive Requester seeded), select one, then Change Requester | Inactive Requester absent; switching reloads My Tickets to the new Requester's data only | Pending |

## 3. Traceability Summary

- 28 Acceptance Criteria are covered.
- Ownership enforcement (BR-09–BR-11) is verified through API and E2E tests.
- The full Attachment lifecycle is tested at API, UI, and E2E levels.
- Responsive behavior is tested for both Create Ticket and My Tickets.
- Server tests use 4 files; client tests use 4 files; all E2E and responsive tests use `requester-ticket-flow.spec.ts`.
- All tests start as `Pending` and are updated to `Pass` or `Fail` after implementation and execution.

```bash
npm notice run toktickit-server@1.0.0 test
npm notice run vitest run tests/lab-02/my-tickets.api.test.ts

 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-02/my-tickets.api.test.ts (7)
   ✓ GET /api/tickets (6)
     ✓ API-16: should return only tickets owned by requester
     ✓ API-17: should return only tickets matching the search text
     ✓ API-18: should return only tickets matching all filters
     ✓ API-19: should reverse ticket order when sortDir is toggled
     ✓ API-20: should return the next set of tickets on the next page
     ✓ API-21: should fall back to default pagination for invalid values
   ✓ GET /api/dev-requesters (1)
     ✓ API-22: should exclude inactive requester from the response

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  23:14:16
   Duration  766ms (transform 84ms, setup 0ms, collect 242ms, tests 151ms, environment 0ms, prepare 103ms)
```