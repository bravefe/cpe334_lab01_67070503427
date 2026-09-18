# TokTickIT — Lab 3 Test Plan (Test DD / TDD)

This plan is written before implementation, per the course requirement, and drives the tests written alongside each feature branch. The **Final** column is `Planned` for every row in this document; it is updated to `Pass`/`Fail` as each test is written and run, and the fully updated table (all `Pass` on `main`) is what gets pasted into the Part 3 submission evidence. This file is not to be reconstructed after the fact from whatever the coding agent produced.

Two rows below are carried over verbatim from the handout's own worked example (`API-01`, `API-08`, `E2E-02`) and kept at those IDs for continuity; all other IDs are assigned sequentially per category. File paths follow the **required minimum structure** in the handout §12; a small number of rows live in files marked *(addition)* — these are beyond the required minimum but needed for honest coverage of Lab 3 requirements (e.g. a dedicated Requester Ticket Detail component test, since the Requester's new Public Comments/"Problem Appears Resolved" behavior has no home in the five required client test files).

## 0. Coverage Summary

| Category | Count | Primary file(s) |
| - | -: | - |
| Unit | 12 | `server/tests/lab-03/unit/*.unit.test.ts` *(addition)* |
| API / Integration | 44 | `server/tests/lab-03/*.api.test.ts` |
| UI Component | 30 | `client/tests/lab-03/*.test.tsx` |
| UI Style | 3 | `client/tests/lab-03/ZenGreenStyle.test.tsx` *(addition)* + manual checklist |
| Responsive | 3 | `e2e/lab-03/responsive.spec.ts` *(addition)* + manual checklist |
| Security / Authorization | 9 | `server/tests/lab-03/authorization.api.test.ts` |
| Migration / Regression | 5 | `server/tests/lab-03/migration.api.test.ts` *(addition)* |
| End-to-End | 8 | `e2e/lab-03/*.spec.ts` |

## 1. Unit Tests

File: `server/tests/lab-03/unit/password.unit.test.ts`

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UNIT-01 | BR-07 | bcrypt hash/verify round-trip; hash never equals plaintext | Correct password verifies true; hash string differs from input | Pass |
| UNIT-02 | FR-02 (password policy) | Password-rule validator against a table of valid/invalid strings (length, upper/lower, number, special char) | Each case matches its expected pass/fail | Pass |

```bash
 RUN v5.0.1 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/unit/password.unit.test.ts > password helpers > UNIT-01: hashes and verifies passwords with bcrypt cost 12
 ✓ tests/lab-03/unit/password.unit.test.ts > password helpers > UNIT-02: validates password policy for all cases

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  20:46:55
   Duration  883ms (tests 94%, transform 3%, import 2%)
 ✓ tests/lab-03/unit/session.unit.test.ts > session helpers > UNIT-03: accepts valid JWTs and rejects tampered or expired tokens
 ✓ tests/lab-03/unit/session.unit.test.ts > session helpers > UNIT-04: rejects a revoked session before its natural expiry

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  20:46:59
   Duration  183ms (import 52%, transform 35%, tests 9%, worker 4%)
```

File: `server/tests/lab-03/unit/status-transitions.unit.test.ts`

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UNIT-05 | BR-19 | Transition-matrix pure function against every `(from, to)` pair in `specification.md` §6.1 | Listed pairs return `true`; all others return `false` (exhaustive, table-driven) | Planned |
| UNIT-06 | BR-19 | Terminal status (`CANCELLED`) has zero legal outbound transitions | Function returns `false` for every target from `CANCELLED` | Planned |

File: `server/tests/lab-03/unit/email.unit.test.ts`

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UNIT-07 | BR-11 | Email equality comparator is case-insensitive (`A@x.com` == `a@x.com`) | Comparator returns equal | Pass |
| UNIT-08 | BR-11 | Email format validator rejects malformed addresses | Invalid formats rejected, valid formats accepted | Pass |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/unit/email.unit.test.ts (6 tests) 3ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  13:47:51
   Duration  225ms (transform 29ms, setup 0ms, collect 28ms, tests 3ms, environment 0ms, prepare 55ms)
```


Latest individual run for `server/tests/lab-03/unit/email.unit.test.ts`:

```bash
 RUN v5.0.1 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/unit/email.unit.test.ts > Email Unit Tests > UNIT-07: Email equality comparator cases
 ✓ tests/lab-03/unit/email.unit.test.ts > Email Unit Tests > UNIT-08: Email format validator cases

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  20:47:00
   Duration  145ms (transform 57%, import 26%, tests 9%, worker 7%)
```

File: `server/tests/lab-03/unit/content.unit.test.ts`

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UNIT-09 | BR-23 | Comment/Note content validator: trims whitespace, rejects empty-after-trim, enforces 2000-char cap | Boundary cases (0, 1, 2000, 2001 chars) behave correctly | Planned |
| UNIT-10 | BR-25 | Comment/Note factory ignores any client-supplied `authorId`/`createdAt` and uses server context | Output always uses session author and `Date.now()`-derived timestamp | Planned |

File: `server/tests/lab-03/unit/user-ownership.unit.test.ts`

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UNIT-11 | BR-14 | Ticket-owner eligibility check: active `IT_STAFF`/`ADMINISTRATOR` eligible; inactive or `REQUESTER` not eligible | Boolean result matches each role/active combination | Planned |
| UNIT-12 | BR-28 | Last-active-Administrator check against a mocked user list | Returns `true` (blocks) only when exactly one active Administrator would remain zero after the change | Pass |

## 2. API / Integration Tests

File: `server/tests/lab-03/auth.api.test.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| API-01 | AC-01 | Valid login | Authenticated response; safe user data | Pass |
| API-02 | AC-02 | `POST /api/auth/change-password` with correct temp password + valid new password | `200`, `mustChangePassword:false`; subsequent request no longer redirected to change-password | Pass |
| API-03 | AC-05 | Invalid credentials | `401 INVALID_CREDENTIALS`, generic message, no hint whether email exists | Pass |
| API-04 | AC-06 | Correct password, inactive account | `403 ACCOUNT_INACTIVE`, no session cookie set | Pass |
| API-05 | AC-07 | `GET /api/auth/me` with no cookie | `401`, no identity data in body | Pass |
| API-06 | AC-08 | Logout, then reuse the old cookie value on a protected call | `401` on the reused cookie | Pass |
| API-07 | AC-02 | `change-password` with a new password failing policy, or equal to current | `400`, no state change, `mustChangePassword` still `true` | Pass |

```bash
 RUN v5.0.1 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-01: logs in with valid credentials and returns safe user data
 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-02: changes a temporary password and refreshes the session
 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-03: rejects invalid credentials generically
 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-04: rejects inactive accounts without a session
 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-05: rejects /me without a session
 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-06: invalidates a logged-out session
 ✓ tests/lab-03/auth.api.test.ts > Lab 3 authentication API > API-07: rejects weak or unchanged passwords without changing state

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  20:47:02
   Duration  4.39s (tests 92%, import 5%, transform 3%)
```

File: `server/tests/lab-03/authorization.api.test.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| SEC-01 | AC-03 | Requester calls `GET /api/tickets?requesterId=<other>` | Only the caller's own tickets are returned; the query param is ignored | Pass |
| SEC-02 | AC-04 | Requester calls `POST /api/staff/tickets/:id/notes` | `403`, response contains no note content | Pass |
| SEC-03 | AC-07 | Every protected route group (`/api/tickets`, `/api/staff/*`, `/api/admin/*`) called with no session, parameterized | Each returns `401`, never a default identity | Pass |
| SEC-04 | AC-09 | Requester calls `/api/staff/tickets`; IT Staff calls `/api/admin/users` | Both return `403` | Pass |
| SEC-05 | AC-11 | Requester A requests Requester B's ticket by ID | `403`, no ticket data in body | Pass |
| SEC-06 | AC-22 | Requester's `GET /api/tickets/:id` response shape | Contains no `internalNotes`/note fields, even if notes exist server-side | Pass |
| SEC-07 | AC-30 | Requester and IT Staff each call every `/api/admin/*` endpoint | All return `403` | Pass |
| SEC-08 | BR-31 | Request carries a legacy `X-Dev-Requester-Id` header but no session cookie | Still `401` — header has no authorization effect | Pass |
| SEC-09 | AC-10 | Requester calls `POST /api/tickets` with a spoofed `requesterId` in the body | Created ticket's `requesterId` equals the session user, not the spoofed value | Pass |

```bash
 RUN v5.0.1 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-01: ignores a spoofed requesterId query parameter
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-02: forbids requester access to staff notes
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-03: protects protected routes without a session
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-04: enforces staff and administrator role boundaries
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-05: does not expose another requester's ticket
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-06: omits internal notes from requester ticket detail
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-07: denies requester and staff access to admin endpoints
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-08: ignores the legacy requester header without a session
 ✓ tests/lab-03/authorization.api.test.ts > Lab 3 authorization API > SEC-09: derives ticket ownership from the authenticated session

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  20:47:08
   Duration  1.60s (tests 78%, import 13%, transform 9%)
```

File: `server/tests/lab-03/staff-queue.api.test.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| API-13 | AC-15 | `q`, `status`, `category`, `requestedPriority`, `itPriority`, `owner` filters, individually and combined | Result set matches expected fixture subset for each combination | Planned |
| API-14 | AC-15 | `sort`/`sortDir` on each sortable field | Result order matches expected ascending/descending order | Planned |
| API-15 | AC-15 | Pagination: `page`/`pageSize` boundaries, including a page past the last page | Correct `items`, `totalItems`, `totalPages`; past-last-page returns empty `items` with `200`, not an error | Planned |
| API-16 | — (§api-spec 4) | Invalid query parameter value (bad enum, `page=0`, `pageSize=51`) | `400`, message names the offending parameter | Planned |
| API-17 | FR-11 | Empty queue (no tickets) vs. no-results (filters match nothing) | Both return `200` with `items: []`; distinguished at the UI layer, not by status code | Planned |

File: `server/tests/lab-03/staff-ticket-detail.api.test.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| API-18 | AC-16 | Claim an unassigned ticket | `ticketOwnerId` becomes the caller | Planned |
| API-19 | AC-17 | Reassign a ticket already owned by IT Staff member X to IT Staff member Y | `ticketOwnerId` updates to Y | Planned |
| API-20 | AC-18 | Assign an inactive IT Staff user as owner | `409`, ownership unchanged | Planned |
| API-21 | BR-14 | Assign a `REQUESTER`-role user as owner | `409`, ownership unchanged | Planned |
| API-22 | AC-19 | `PATCH .../priority` | `itPriority` updates; `requestedPriority` unchanged | Planned |
| API-23 | AC-20 | Status `NEW` → `RESOLVED` directly | `409`, response lists legal next statuses from `NEW` | Planned |
| API-24 | AC-21 | Status `IN_PROGRESS` → `RESOLVED` | `200`, status updated and persisted | Planned |
| API-25 | BR-19 | Any transition attempted from `CANCELLED` | `409` for every target status | Planned |
| API-26 | FR-12 | `GET /api/staff/tickets/:id` for a ticket owned by a different staff member; and for a nonexistent ID | `200` with full detail (staff can view any ticket); `404` for nonexistent | Planned |

File: `server/tests/lab-03/comments-notes.api.test.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| API-08 | AC-04 | Requester requests Internal Notes creation | Forbidden; no note data returned | Planned |
| API-27 | AC-12 | Requester posts a Public Comment on their own ticket | `201`, comment stored with author/timestamp, visible on subsequent GET | Planned |
| API-28 | BR-23 | Post empty/whitespace-only comment or note | `400`, nothing stored | Planned |
| API-29 | BR-23 | Post content over 2000 characters | `400`, nothing stored | Planned |
| API-30 | AC-13 | Mark appears-resolved while status is `OPEN`/`IN_PROGRESS`/`WAITING_FOR_REQUESTER` | `200`, flag set, status unchanged | Planned |
| API-31 | AC-14 | Mark appears-resolved while status is `RESOLVED`/`CLOSED` | `409`, flag unchanged | Planned |
| API-32 | AC-22 | IT Staff posts an Internal Note; Requester and IT Staff each `GET` the same ticket | Staff view includes the note; Requester's ticket response contains no note content | Planned |
| API-33 | AC-23 | Requester calls `GET /api/staff/tickets/:id/notes` directly | `403` | Planned |
| API-34 | BR-25 | Comment/Note create request body includes a spoofed `authorId`/`createdAt` | Stored record uses the session author and server timestamp instead | Planned |

File: `server/tests/lab-03/users-admin.api.test.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| API-35 | AC-24 | `GET /api/admin/users?q=&role=` combinations | Result set matches expected fixture subset | Pass |
| API-36 | AC-25 | Create a user with an initial password | `201`, `mustChangePassword:true`; a subsequent login with that password succeeds and redirects to change-password | Pass |
| API-37 | AC-26 | Create a user with an email already in use | `409 DUPLICATE_EMAIL`, no user created | Pass |
| API-38 | BR-11 | Edit a user's email to one already used by another user | `409 DUPLICATE_EMAIL`, no change persisted | Pass |
| API-39 | AC-27 | Administrator edits their own account with `isActive:false` | `409 SELF_DEACTIVATION`, account remains active | Pass |
| API-40 | AC-28 | With exactly one active Administrator, deactivate them or change their role away from Administrator | `409 LAST_ADMIN` in both cases, no change persisted | Pass |
| API-41 | AC-29 | `PATCH .../password` sets a new initial password | `200`, `mustChangePassword:true`; old password no longer authenticates, new one does (until changed) | Pass |
| API-42 | BR-26 | Edit a user's role from `IT_STAFF` to `REQUESTER` | Stored role is exactly `REQUESTER`; no residual multi-role state | Pass |
| API-43 | BR-11 | Create/edit with an invalid role enum value or malformed email | `400`, no change persisted | Pass |

## 3. UI Component Tests

File: `client/tests/lab-03/Login.test.tsx`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-01 | AC-05 | Renders invalid-credentials banner on `401 INVALID_CREDENTIALS` | Banner text matches the generic copy; password field re-masked | Planned |
| UI-02 | — | Submit button shows busy state and is disabled while the request is in flight | Button label changes to "Signing In…"; disabled attribute set | Planned |
| UI-03 | AC-06 | Renders inactive-account banner on `403 ACCOUNT_INACTIVE` | Banner shows the distinct inactive-account copy | Planned |
| UI-04 | — | Empty email/password on submit | No network call made; inline field errors shown | Planned |
| UI-26 | AC-32 | Unexpected (`500`) failure on submit | Generic safe-failure banner shown, no error code/stack rendered | Planned |

```bash
 RUN v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-03/Login.test.tsx (5)
    ✓ UI-01: shows generic invalid-credential feedback and re-masks the password
    ✓ UI-02: shows the busy state while login is pending
    ✓ UI-03: shows the inactive-account banner
    ✓ UI-04: validates empty fields without a network call
    ✓ UI-26: maps unexpected failures to safe copy

 Test Files  1 passed (1)
         Tests  5 passed (5)
    Start at  20:49:34
    Duration  2.77s (tests 1.82s, environment 376ms)
```

Note: this file reports one non-failing React `act(...)` warning in UI-02.

File: `client/tests/lab-03/ChangePassword.test.tsx`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-05 | AC-02 | Password-rules checklist updates live as the user types | Each rule's check/cross state matches input in real time | Planned |
| UI-06 | AC-02 | Confirm field does not match New Password | Continue button disabled; inline mismatch message shown | Planned |
| UI-07 | AC-02 | Successful submit | Redirects straight into the role's home screen, no extra modal | Planned |
| UI-08 | — | Voluntary change from Profile menu (not mandatory) succeeds | Inline success toast shown; screen does not redirect | Planned |

File: `client/tests/lab-03/StaffTicketQueue.test.tsx`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-09 | AC-15 | Renders the table from a mock queue response | Rows/columns match fixture data | Planned |
| UI-10 | FR-11 | Renders with zero total tickets | "No tickets in the queue yet." empty state shown | Planned |
| UI-11 | FR-11 | Renders with filters applied and zero matches | "No tickets match your search or filters." + Clear filters action shown | Planned |
| UI-12 | AC-15 | Typing in search / changing a filter | Triggers the queue API call with the correct query parameters (mocked network layer) | Planned |
| UI-27 | AC-32 | Queue fetch fails | Safe-failure banner + Retry shown; current filter/search/page state preserved | Planned |

File: `client/tests/lab-03/StaffTicketDetail.test.tsx`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-13 | AC-20/AC-21 | Status dropdown given a mocked current status | Only the legal next statuses (per §6.1 matrix) appear as options | Planned |
| UI-14 | BR-04 | Internal Notes tab rendering | Visually distinct container/label from Public Comments tab (asserts a distinct style token/class, not just text) | Planned |
| UI-15 | — | Selecting `RESOLVED` without a Resolution Summary | Inline validation blocks submit until Resolution Summary is provided | Planned |
| UI-16 | — | Selecting `RESOLVED` or `CANCELLED` | Confirmation dialog appears before the request is sent | Planned |
| UI-28 | AC-32 | Owner update succeeds but the subsequent status update fails | Owner change remains reflected in the UI; only the status field shows a failure state (no full-page rollback) | Planned |

File: `client/tests/lab-03/UserManagement.test.tsx`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-17 | — | Create form with missing/invalid required fields | Inline field errors; Save disabled or request blocked client-side | Pass |
| UI-18 | AC-26 | Submit with a `409 DUPLICATE_EMAIL` response | Inline error appears under the Email field specifically | Pass |
| UI-19 | AC-27 | Row for the currently-logged-in Administrator | Active toggle rendered disabled with an explanatory tooltip | Pass |
| UI-20 | — | Open Edit on an existing user | Panel fields prefill with that user's current name/email/role/active state | Pass |
| UI-29 | AC-32/AC-28 | Submit triggers a `409 LAST_ADMIN` response | Message shown inline above Save; panel stays open with entered values intact | Pass |

Latest targeted run (2026-09-18):

```bash
server: npm test -- tests/lab-03/unit/user-ownership.unit.test.ts tests/lab-03/users-admin.api.test.ts
Test Files  2 passed (2)
     Tests  11 passed (11)

client: npm test -- tests/lab-03/UserManagement.test.tsx
Test Files  1 passed (1)
     Tests  5 passed (5)
```

```bash
 RUN v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-03/ChangePassword.test.tsx (4)
    ✓ UI-05: updates the password-rule checklist live
    ✓ UI-06: disables continuation for mismatched confirmation
    ✓ UI-07: submits a valid password change and completes
    ✓ UI-08: keeps the form usable after a failed voluntary change

 Test Files  1 passed (1)
         Tests  4 passed (4)
    Start at  20:49:38
    Duration  3.10s (tests 2.09s, environment 379ms)
```

File: `client/tests/lab-03/RequesterTicketDetail.test.tsx` 
| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-21 | AC-12 | Public Comments tab renders and posts a new comment | New comment appears in the list, compose box clears | Planned |
| UI-22 | AC-13 | "Problem Appears Resolved" button visibility by status | Visible for Open/In Progress/Waiting for Requester; absent otherwise | Planned |
| UI-23 | AC-13 | Clicking the button and confirming | Button is replaced by the "You marked this as appearing resolved" note | Planned |
| UI-30 | AC-32 | Comment post fails | Safe-failure banner shown; typed comment text is preserved in the box | Planned |

```bash
 RUN v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-03/RequesterTicketDetail.test.tsx (2)
    ✓ UI-21/UI-22: renders the public-comments tab and ticket detail
    ✓ UI-23/UI-30: preserves the detail surface when an attachment request fails

 Test Files  1 passed (1)
         Tests  2 passed (2)
    Start at  20:49:46
    Duration  1.19s (tests 133ms, environment 349ms)
```

File: `client/tests/lab-03/AppShell.test.tsx` *(addition — role-conditional nav has no home in the required minimum list)*

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| UI-24 | AC-09 | Shell rendered with a Requester / IT Staff / Administrator session, respectively | Only that role's nav destinations render; the other roles' destinations are absent from the DOM (not just visually hidden) | Planned |
| UI-25 | — | Direct navigation to a route the current role can't reach | Forbidden state rendered, with a link back to the role's home screen | Planned |

```bash
 RUN v2.1.9 D:/KMUTT/Year 3/Software Engineer/client

 ✓ tests/lab-03/AppShell.test.tsx (2)
    ✓ UI-24: loads an authenticated requester into the requester shell
    ✓ UI-25: shows the login shell when the session expires

 Test Files  1 passed (1)
         Tests  2 passed (2)
    Start at  20:49:43
    Duration  1.19s (tests 85ms, environment 369ms)
```

## 4. UI Style Tests

File: `client/tests/lab-03/ZenGreenStyle.test.tsx`

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| STYLE-01 | §9 ui-spec | Role, status, and priority badges use visually distinct component variants | Each badge family renders with a different variant/class, never the same styling | Planned |
| STYLE-02 | §7 ui-spec | Internal Notes panel vs. Public Comments panel | Different background tint and a pinned "Internal — not visible to Requester" label on the Notes panel only | Planned |

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| STYLE-03 | §9 handout / Part 9 | Manual visual checklist (design consistency, role nav, badges, editable/read-only field styling, validation placement, focus rings, no clipping/overlap/overflow) against `artifacts/lab-03/screenshots/**` for every required screen | Checklist fully checked off before submission; deviations fixed, not waived | Planned |

## 5. Responsive Tests

File: `e2e/lab-03/responsive.spec.ts` *(addition — Playwright viewport control gives the most reliable coverage of layout collapse behavior)*

| ID | Requirement | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| RESP-01 | §6 ui-spec | Ticket Queue rendered at a <1024px viewport | Table collapses to the stacked card layout; search/filters/pagination remain visible in order | Planned |
| RESP-02 | §8 ui-spec | Admin Create/Edit panel rendered at a mobile viewport | Panel becomes a full-screen sheet rather than a side-over | Planned |
| RESP-03 | §10 ui-spec | Login, Change Password, and Staff Ticket Detail at 375px width | No horizontal scrollbar/overflow on any of the three screens | Planned |

## 6. Security / Authorization Tests

Covered in full in `server/tests/lab-03/authorization.api.test.ts` (§2 above, `SEC-01`–`SEC-09`).

This category is listed separately here per the course requirement, but the rows are not duplicated — see §2 for the table.

## 7. Migration / Regression Tests

File: `server/tests/lab-03/migration.api.test.ts` 

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| MIG-01 | AC-31 | Full Lab 2 regression suite (ticket creation, categories, related systems, attachments) re-run using an authenticated Requester session instead of `X-Dev-Requester-Id` | Every previously-passing Lab 2 case still passes unmodified in behavior | Planned |
| MIG-02 | §7.1 spec | Ticket row count before and after the `User` migration | Counts match exactly; no ticket is dropped or duplicated | Pass |
| MIG-03 | §7.1 spec | Every migrated `Ticket.requesterId` resolves to an active `User` with role `REQUESTER` corresponding to the original Development Requester identity | 100% of migrated tickets resolve correctly | Pass |
| MIG-04 | §7.1 spec | `itPriority` on every pre-existing ticket after migration | Equals that ticket's `requestedPriority` (initial backfill rule) | Pass |
| MIG-05 | §5.3 handout | Seed script run twice in sequence against a fresh database | Second run produces identical row counts to the first (idempotent) | Pass |

```bash
 RUN  v2.1.9 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/migration.api.test.ts (5 tests) 288ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  13:48:50
   Duration  554ms (transform 46ms, setup 0ms, collect 71ms, tests 288ms, environment 0ms, prepare 54ms)
```

Latest individual run:

```bash
 RUN v5.0.1 D:/KMUTT/Year 3/Software Engineer/server

 ✓ tests/lab-03/migration.api.test.ts > MIG-02: Ticket row count before and after the User migration
 ✓ tests/lab-03/migration.api.test.ts > MIG-03: Every migrated Ticket.requesterId resolves to an active User
 ✓ tests/lab-03/migration.api.test.ts > MIG-04: itPriority matches requestedPriority
 ✓ tests/lab-03/migration.api.test.ts > MIG-05: seed is idempotent
 ✓ tests/lab-03/migration.api.test.ts > enforces unique and case-insensitive email
 ✓ tests/lab-03/migration.api.test.ts > MIG-01: preserves authenticated Lab 2 requester workflows
 Test Files  1 passed (1)
    Tests  6 passed (6)
   Start at  20:49:31
   Duration  1.11s (tests 64%, import 21%, transform 15%)
```

## 8. End-to-End Tests

File: `e2e/lab-03/authentication.spec.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| E2E-01 | AC-01, AC-08 | Full flow: log in as an active user with no pending password change → land on role home → log out → attempt to revisit a protected page | Home screen loads after login; protected page redirects to Login after logout | Planned |
| E2E-02 | AC-02 | Initial password login and change | Normal app opens only after a valid change | Planned |
| E2E-03 | AC-06 | Attempt login on an inactive account with the correct password | Inactive-account message shown; no access granted | Planned |

File: `e2e/lab-03/staff-ticket-flow.spec.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| E2E-04 | AC-16, AC-19, AC-21, AC-22 | Log in as IT Staff → open Queue → claim an unassigned ticket → set IT Priority → post an Internal Note → transition status to Resolved → log in as the ticket's Requester and confirm the note is not visible | Each step's UI state matches the API result; Requester never sees the Internal Note | Planned |
| E2E-05 | AC-15 | Search and filter the Queue end-to-end | Visible rows narrow to match the search/filter combination | Planned |

File: `e2e/lab-03/user-administration.spec.ts`

| ID | AC | What It Tests | Expected Result | Final |
| - | - | - | - | - |
| E2E-06 | AC-25, AC-29 | Administrator creates a user with an initial password; that user logs in and is forced through Change Password | New user reaches their role home screen only after changing the password | Planned |
| E2E-07 | AC-27, AC-28 | Administrator attempts to deactivate their own account, then (as the sole Administrator) attempts to deactivate/role-change themselves via a second seeded admin-adjacent scenario | Both attempts are blocked with the specific inline messages from `api-spec.md` §5 | Planned |
| E2E-08 | AC-09, AC-30 | Log in as IT Staff, attempt to visit `/admin/users` directly by URL | Forbidden state shown; no user data loads | Planned |

