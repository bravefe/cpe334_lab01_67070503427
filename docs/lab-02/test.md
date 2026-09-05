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
| API-01 | API | AC-01 | `POST /create-ticket` with valid data | 201; one Ticket saved; backend-generated Ticket Number returned | Pass |
| API-02 | API | AC-05 | `POST /create-ticket` with empty `summary` | 400 with `fieldErrors` for `summary`; no Ticket persisted | Pass |
| API-03 | API | AC-06 | `POST /create-ticket` with `description` < 20 chars | 400 naming the 20-char minimum | Pass |
| API-04 | API | AC-07 | `POST /create-ticket` with `summary` = exactly 150 chars | 201; Ticket created (upper boundary passes) | Pass |
| API-05 | API | AC-08 | `POST /create-ticket` with `summary` = 151 chars | 400; Ticket not created (upper boundary fails) | Pass |
| API-06 | API | AC-14 | Ticket create succeeds, Attachment upload then fails | Ticket persists with its number; failed Attachment reported separately (BR-21) | Pass |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-02/create-ticket.api.test.ts (7) 485ms
   ✓ POST /api/create-ticket (7) 485ms
     ✓ UNIT-01: should generate a unique ticket number in the correct format 441ms
     ✓ API-01: should create a ticket with valid data
     ✓ API-02: should reject a ticket with an empty summary
     ✓ API-03: should reject a description shorter than 20 characters
     ✓ API-04: should accept a summary with exactly 150 characters
     ✓ API-05: should reject a summary with 151 characters
     ✓ API-06: should keep the ticket when attachment upload fails

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  14:34:58
   Duration  7.70s (transform 88ms, setup 0ms, collect 5.89s, tests 485ms, environment 0ms, prepare 878ms)
```

### `server/tests/lab-02/attachments.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| Test ID | Requirement | What It Tests | Expected Result |
| ------- | ------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| API-07 | AC-09 / BR-22 | Upload `.gif` attachment | 415; attachment not created |
| API-08 | AC-10 / BR-23 | Upload valid PDF > 5 MB | 413; attachment not created |
| API-09 | AC-11 / BR-24 | Upload 6th active attachment | 422; attachment not created |
| API-10 | AC-21 / FR-12 | Upload valid attachment to owned ticket | 201; Attachment created as `ACTIVE` |
| API-11 | FR-05 / FR-12 | List ticket attachments | 200; active + removed metadata returned |
| API-12 | AC-22 / FR-13 | Download active attachment | 200; original file content returned |
| API-13 | AC-23 / FR-14 | Remove attachment with valid reason | 200; status becomes `REMOVED` |
| API-14 | BR-26 | Remove attachment with empty reason | 400; attachment remains `ACTIVE` |
| API-15 | BR-27 | Download removed attachment | 404; file content not returned |
| API-16 | BR-11 / FR-15 | Requester's attachment belongs to another Requester | 404; no attachment data revealed |
| API-16 | BR-24 | Add attachment after one is removed | 201; removed attachment does not count toward 5-active limit |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-02/attachments.api.test.ts (11) 591ms
   ✓ Attachment API (11) 590ms
     ✓ API-07: rejects GIF attachments without creating one
     ✓ API-08: rejects a valid PDF larger than 5 MB
     ✓ API-09: rejects a sixth active attachment
     ✓ API-10: uploads a valid attachment to an owned ticket
     ✓ API-11: lists active and removed attachment metadata
     ✓ API-12: downloads an active attachment with its original content
     ✓ API-13: removes an attachment with a valid reason
     ✓ API-14: rejects an empty removal reason and keeps the attachment active
     ✓ API-15: does not download a removed attachment
     ✓ API-16: hides another requester's attachment
     ✓ API-24: allows an upload after an attachment is removed

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  22:56:49
   Duration  2.72s (transform 93ms, setup 0ms, collect 1.25s, tests 591ms, environment 0ms, prepare 449ms)
```

### `server/tests/lab-02/my-tickets.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| API-16 | API | AC-04 | `GET /api/tickets` as Requester B | List contains none of Requester A's Tickets | Pass |
| API-17 | API | AC-15 | `GET /api/tickets?search=<partial ticket #>` | Only Tickets whose number contains the text returned | Pass |
| API-18 | API | AC-16 | `GET /api/tickets?category=&requestedPriorityId=` combined | Only Tickets matching both filters returned (BR-13) | Pass |
| API-19 | API | AC-17 | Toggle `sortDir` on `sortBy=createdAt` | List order reverses accordingly | Pass |
| API-20 | API | AC-18 | Page forward beyond page size | Next set of Tickets loads; `page`/`totalPages` metadata correct | Pass |
| API-21 | API | BR-15 | `page`/`pageSize` with invalid values (e.g. negative, non-numeric) | Falls back to defaults (page 1, size 10) instead of erroring | Pass |
| API-22 | API | AC-25 | `GET /api/dev-requesters` with one inactive Requester seeded | Inactive Requester absent from response (BR-06) | Pass |

```bash
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


### `server/tests/lab-02/ticket-detail.api.test.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| API-23 | API | AC-03 | `GET /api/tickets/:ticketCode` for Requester A's Ticket while B is current | 404; no Ticket data returned (BR-11) | Pass |

```bash
 RUN  v2.1.9 C:/KMUTT/3.1/Software/Pai/server

 ✓ tests/lab-02/ticket-detail.api.test.ts (2) 312ms
   ✓ GET /api/tickets/:ticketNumber (2) 310ms
     ✓ returns the current requester's owned ticket detail
     ✓ API-23: should return 404 when requester B tries to access requester A's ticket

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  10:27:30
   Duration  3.47s (transform 340ms, setup 0ms, collect 1.11s, tests 312ms, environment 1ms, prepare 818ms)
```

### `client/tests/lab-02/CreateTicket.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-01 | UI | AC-02 | Navigate to Create Ticket with no Requester selected | Redirected to Requester Selection screen (BR-08) | Pass |
| UI-02 | UI | AC-05 | Click Submit with Summary empty | Inline field message shown; no API call made | Pass |
| UI-03 | UI | AC-06 | Type a 19-character Description and submit | Boundary message names the 20-char minimum | Pass |
| UI-04 | UI | AC-12 | Click Submit on a valid form | Submit disabled + busy indicator until request resolves (BR-19) | Pass |
| UI-05 | UI | AC-13 | Submit valid form while backend is unreachable | Safe error banner shown; all field values remain in the form | Pass |
| UI-06 | UI | AC-28 | Tab through the Create Ticket form using keyboard only | Every control reachable in logical order with visible focus indicator | Pass |
| UI-07 | UI | BR-01, BR-03 | Render Create Ticket system-generated fields (Ticket #, Date, Requester) | Read-only fields use distinct shading, no focus ring, not tab-stoppable | Pass |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-02/CreateTicket.test.tsx (9) 3908ms
   ✓ Create Ticket screen (9) 3907ms
     ✓ UI-01: redirects to requester selection without a selected requester
     ✓ shows the create ticket form when a requester is selected
     ✓ navigates to create ticket from the top bar
     ✓ UI-02: shows an inline summary error without calling the create API
     ✓ UI-03: reports the 20-character description minimum 984ms
     ✓ UI-04: disables submit while a valid request is pending 1153ms
     ✓ UI-05: shows a safe error and preserves values when the backend is unreachable 1175ms
     ✓ UI-06: reaches every create-ticket form control with the keyboard 343ms
     ✓ UI-07: renders generated fields as shaded, non-focusable read-only fields

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  21:21:14
   Duration  5.21s (transform 129ms, setup 69ms, collect 265ms, tests 3.91s, environment 425ms, prepare 123ms)
```

### `client/tests/lab-02/MyTickets.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-11 | UI | AC-19 | Open My Tickets for a Requester with zero Tickets | Empty state (not No-Results) shown with Create Ticket CTA | Pass |
| UI-12 | UI | AC-20 | Apply filters that match no owned Tickets | No-Results state shown with a Clear Filters action | Pass |
| UI-13 | UI | AC-26 | Use Change Requester to pick a different active Requester | My Tickets reloads showing only the new Requester's Tickets (BR-07) | Pass |

```bash 
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-02/MyTickets.test.tsx (3) 683ms
   ✓ My Tickets screen (3) 682ms
     ✓ UI-11: shows the empty state and Create Ticket CTA for a requester with no tickets
     ✓ UI-12: shows no-results state and clears active filters
     ✓ UI-13: changes requester and reloads My Tickets with the new requester

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  21:31:44
   Duration  3.54s (transform 260ms, setup 115ms, collect 556ms, tests 683ms, environment 839ms, prepare 431ms)
```


### `client/tests/lab-02/AttachmentSection.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-08 | UI | AC-09, AC-10 | Select a `.gif` or an oversized PDF in the Attachment control | Rejected client-side before any upload call, with a clear message | Pass |
| UI-09 | UI | AC-11 | Attachment control on a Ticket with 5 active Attachments | Remaining-slots indicator shows 0; a 6th file is blocked with a limit message | Pass |
| UI-10 | UI | AC-23 | Click Remove on an Attachment without entering a reason | Removal blocked until a non-empty reason is entered | Pass |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-02/AttachmentSection.test.tsx (3)
   ✓ Attachment controls (3)
     ✓ UI-08: rejects gif or oversized PDF files before upload
     ✓ UI-09: shows remaining slots and blocks the 6th file
     ✓ UI-10: blocks removal without a non-empty reason

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  22:55:28
   Duration  1.45s (transform 80ms, setup 92ms, collect 188ms, tests 277ms, environment 418ms, prepare 132ms)
```

### `client/tests/lab-02/RequesterTicketDetail.test.tsx`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| UI-15 | UI | AC-21 | Add a valid Attachment from Ticket Detail | New Attachment appears in list as Active without a page reload | Pass |
| UI-16 | UI | AC-24 | View Ticket Detail after an Attachment was soft-removed | Attachment shown greyed-out with metadata/reason; download control disabled | Pass |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-02/RequesterTicketDetail.test.tsx (2)
   ✓ Requester ticket detail attachments (2)
     ✓ UI-15: adds a valid attachment from ticket detail without reload
     ✓ UI-16: renders a removed attachment as greyed-out with reason and disabled download

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  22:45:53
   Duration  1.30s (transform 136ms, setup 60ms, collect 273ms, tests 203ms, environment 365ms, prepare 146ms)
```


### `e2e/lab-02/requester-ticket-flow.spec.ts`

| Test ID | Type | Requirement | What It Tests | Expected Result | Final |
|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01, AC-05 | Complete Requester selection → Create Ticket submission flow | Confirmation displays the backend-generated Ticket Number | Pass |
| E2E-02 | E2E | AC-03, AC-04 | Requester A creates a Ticket; switch to Requester B and search My Tickets / open by number | Requester B never sees A's Ticket in list or detail | Pass |
| E2E-03 | E2E | AC-21, AC-22, AC-23, AC-24 | Full Attachment lifecycle: add, download, soft-remove with reason | Attachment shows Active then Removed with metadata; download disabled after removal | Pass |
| E2E-04 | E2E | AC-25, AC-26 | Open selector (inactive Requester seeded), select one, then Change Requester | Inactive Requester absent; switching reloads My Tickets to the new Requester's data only | Pass |


```bash 
npm notice run software-engineer@1.0.0 test:e2e
npm notice run playwright test e2e/lab-02/requester-ticket-flow.spec.ts
[WebServer] npm notice run toktickit-client@1.0.0 dev
[WebServer] npm notice run vite --host 127.0.0.1

Running 4 tests using 1 worker

  ✓  1 …cket-flow.spec.ts:33:6 › Requester ticket flow › E2E-01: creates a ticket and shows the backend-generated number (1.1s)
  ✓  2 …ter-ticket-flow.spec.ts:39:6 › Requester ticket flow › E2E-02: prevents another requester from seeing the ticket (1.2s)
  ✓  3 …e\lab-02\requester-ticket-flow.spec.ts:52:6 › Requester ticket flow › E2E-03: completes the attachment lifecycle (1.3s)
  ✓  4 …et-flow.spec.ts:68:6 › Requester ticket flow › E2E-04: switches requester data and excludes inactive requesters (756ms)

  4 passed (6.4s)
  ```

## 3. Traceability Summary

- Ownership enforcement (BR-09–BR-11) is verified through API and E2E tests.
- The full Attachment lifecycle is tested at API, UI, and E2E levels.
- Responsive behavior is tested for both Create Ticket and My Tickets.
- Server tests use 4 files; client tests use 4 files; all E2E and responsive tests use `requester-ticket-flow.spec.ts`.
- All tests start as `Pending` and are updated to `Pass` or `Fail` after implementation and execution.