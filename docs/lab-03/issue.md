# TokTickIT — Lab 3 GitHub Issues & Branch Plan

7 issues, sequenced so each one represents a major development milestone. Each feature branch is created from `lab3-staging` and merged back through a PR + review. `lab3-staging` is merged into `main` only at Issue #7.

Every issue includes the tests that must be implemented and pass before the issue is considered **Done**, following the TDD requirement in `tests.md`.

**Branch naming:** `feature/lab3-<slug>`
Example: `feature/lab3-auth-authorization`

**Labels used:** `docs`, `backend`, `frontend`, `db`, `auth`, `security`, `testing`, `e2e`, `release`

---

## Dependency Order

```text
#1 Engineering Contract
  │
  └─ #2 Data Model, Migration & Seed
       │
       └─ #3 Authentication & Authorization
            │
            └─ #4 Application Shell & Requester Regression
                 │
                 ├─ #5 IT Staff Ticket Management
                 │
                 └─ #6 Administrator User Management
                       │
                       └─ #7 Integration, E2E, QA & Release
```

---

# Issue #1 — Sprint 3 Engineering Contract

**Branch:** `feature/lab3-engineering-contract`
**Depends on:** None
**Labels:** `docs`

## Scope

* Author and approve:

  * `docs/lab-03/specification.md`
  * `docs/lab-03/ui-spec.md`
  * `docs/lab-03/api-spec.md`
  * `docs/lab-03/tests.md`
* Create the GitHub Project board using the same Kanban structure as Lab 2.
* Create Issues #2–#7 on the board.
* Confirm the engineering contract is completed before implementation PRs are opened.

## Definition of Done

* All four Lab 3 documents are merged into `lab3-staging`.
* Issues #2–#7 exist on the GitHub Project board.
* No implementation PR is opened before the contract is approved.

---

# Issue #2 — Data Model, Migration & Seed

**Branch:** `feature/lab3-data-model`
**Depends on:** #1
**Labels:** `db`, `backend`, `testing`

## Scope

### Database

* Add the `User` model:

  * `id`
  * `name`
  * `email`
  * `passwordHash`
  * `role`
  * `isActive`
  * `mustChangePassword`
  * timestamps
* Make email unique and case-insensitive.
* Extend `Ticket` with:

  * `ticketOwnerId`
  * `itPriority`
  * `problemAppearsResolved`
  * `resolutionSummary`
* Change `Ticket.requesterId` to reference `User`.
* Add:

  * `PublicComment`
  * `InternalNote`

### Migration

Implement the Lab 2 → Lab 3 migration described in `specification.md` §7.1:

* Create `User` records for existing Development Requesters.
* Backfill `Ticket.requesterId`.
* Copy `requestedPriority` to `itPriority`.
* Set `problemAppearsResolved = false`.
* Preserve existing Lab 2 ticket data.

### Seed

Create idempotent seed data according to the handout:

* At least 4 active Requesters.
* At least 1 inactive Requester.
* At least 3 active IT Staff.
* At least 1 inactive IT Staff.
* At least 1 active Administrator.
* Realistic ticket distribution.
* Example public comments and internal notes.
* No sensitive information.
* Document local-development credentials.

Do not remove client functionality yet.

## Tests to Add

* `server/tests/lab-03/unit/email.unit.test.ts`

  * `UNIT-07`
  * `UNIT-08`
* `server/tests/lab-03/migration.api.test.ts`

  * `MIG-02`
  * `MIG-03`
  * `MIG-04`
  * `MIG-05`

## Covers

* `specification.md` §7
* `specification.md` §7.1

## Definition of Done

* Migration succeeds on the Lab 2 database.
* Seed is idempotent.
* All Issue #2 tests pass.
* Existing Lab 2 data is preserved.

---

# Issue #3 — Authentication & Authorization

**Branch:** `feature/lab3-auth-authorization`
**Depends on:** #2
**Labels:** `backend`, `auth`, `security`, `testing`

## Scope

Implement the complete authentication and authorization foundation.

### Authentication

* bcrypt password hashing with cost 12.
* Password-policy validator.
* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`
* `POST /api/auth/change-password`
* Signed JWT authentication.
* Store JWT in an `httpOnly`, `Secure`, `SameSite=Strict` cookie.
* Implement logout/session invalidation.
* Session middleware populating `req.user`.
* Return `401` for unauthenticated requests.
* Implement `X-Requested-With` validation for state-changing requests.
* Remove `X-Dev-Requester-Id` handling from the server.

### Authorization

* Implement reusable `requireRole(...)`.
* Implement ticket/attachment ownership checks.
* Apply authorization rules to existing API routes.
* Implement the authorization matrix from `api-spec.md` §6.
* Ensure correct `401` vs `403` responses.
* Apply the safe-error response format from `api-spec.md` §7.

## Tests to Add

### Unit

`server/tests/lab-03/unit/password.unit.test.ts`

* `UNIT-01`
* `UNIT-02`

`server/tests/lab-03/unit/session.unit.test.ts`

* `UNIT-03`
* `UNIT-04`

### API

`server/tests/lab-03/auth.api.test.ts`

* `API-01`–`API-07`

`server/tests/lab-03/authorization.api.test.ts`

* `SEC-01`–`SEC-09`

## Covers

* FR-01–04
* FR-06
* BR-01–03
* BR-06–10
* BR-12
* BR-13
* BR-31
* AC-01–08
* AC-09–11
* AC-22
* AC-23
* AC-30

## Definition of Done

* Authentication works through the session cookie.
* Role and ownership authorization is enforced server-side.
* `X-Dev-Requester-Id` is no longer used.
* All Issue #3 tests pass.

---

# Issue #4 — Application Shell & Requester Regression

**Branch:** `feature/lab3-app-shell-requester`
**Depends on:** #3
**Labels:** `frontend`, `backend`, `auth`, `testing`

## Scope

### Application Shell

Implement:

* Login screen.
* Login validation.
* Invalid-credential banner.
* Inactive-account banner.
* Loading/busy states.
* Mandatory Change Password screen.
* Live password-rule checklist.
* Confirm-password validation.
* Voluntary Change Password from Profile.
* Role-based navigation.
* Profile menu.
* Logout.
* Session-expiry handling.
* Redirect to Login after `401`.
* Shared Forbidden screen.

### Requester UI

Remove the Development Requester selector and all related state.

Re-point requester functionality to the authenticated session:

* My Tickets.
* Create Ticket.
* Ticket Detail.
* Attachments.
* Public requester actions.

The server must derive the requester identity from `req.user`.

Confirm Lab 2 requester functionality still works for authenticated Requesters.

## Tests to Add

### Authentication UI

`client/.../lab-03 tests/Login.test.tsx`

* `UI-01`–`UI-04`
* `UI-26`

`client/.../lab-03 tests/ChangePassword.test.tsx`

* `UI-05`–`UI-08`

`client/.../lab-03 tests/AppShell.test.tsx`

* `UI-24`
* `UI-25`

### Requester

`client/.../lab-03 tests/RequesterTicketDetail.test.tsx`

* `UI-21`–`UI-23`
* `UI-30`

### API / Regression

`server/tests/lab-03/authorization.api.test.ts`

* `SEC-09` — create-time requester spoofing

`server/tests/lab-03/migration.api.test.ts`

* `MIG-01` — full Lab 2 regression under authentication

## Definition of Done
