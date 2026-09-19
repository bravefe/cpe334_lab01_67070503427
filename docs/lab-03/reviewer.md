# Lab 3 — Peer Review Record 

**Author:** Patcharak Plipat — 67070503427 — bravefe
**Peer reviewer:** Punnapob Wirojwongchai — 67070503425 — SaintCrois

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| [#44](https://github.com/bravefe/cpe334_lab01_67070503427/pull/44) | document/lab3 | Approve |
| [#46](https://github.com/bravefe/cpe334_lab01_67070503427/pull/46) | feature/lab3-data-model | Approve |
| [#48](https://github.com/bravefe/cpe334_lab01_67070503427/pull/48) | feature/12-lab3-auth | Approve |
| [#49](https://github.com/bravefe/cpe334_lab01_67070503427/pull/49) | feature/14-lab3-staff-ticket-management | Approve |
| [#50](https://github.com/bravefe/cpe334_lab01_67070503427/pull/50) | feature/lab3-admin-users | Approve |
| [#51](https://github.com/bravefe/cpe334_lab01_67070503427/pull/51) | feature/16-lab3-integration-qa | Pending |

#44 https://github.com/bravefe/cpe334_lab01_67070503427/pull/44
#46 https://github.com/bravefe/cpe334_lab01_67070503427/pull/46
#48 https://github.com/bravefe/cpe334_lab01_67070503427/pull/48
#49 https://github.com/bravefe/cpe334_lab01_67070503427/pull/49
#50 https://github.com/bravefe/cpe334_lab01_67070503427/pull/50
#51 https://github.com/bravefe/cpe334_lab01_67070503427/pull/51

### #44 document/lab3
```
## Issue 10
**Branch:** document/lab3

## Scope

* Author and approve:
  * docs/lab-03/specification.md
  * docs/lab-03/ui-spec.md
  * docs/lab-03/api-spec.md
  * docs/lab-03/tests.md
* Create Issues #36 - #42 on the board.
* Confirm the engineering contract is completed before implementation PRs are opened.

## Definition of Done

* All four Lab 3 documents are merged into lab3-staging.
* Issues #36 - #42 exist on the GitHub Project board.
```
> **SaintCrois** approved these changes

**Me:** Please merge, thank you.

> **SaintCrois** merged commit 42f8406 into lab3-staging

### #46 feature/lab3-data-model
```
## Issue 11
**Branch:** feature/lab3-data-model

## Scope

### Database

* Add the User model:
  * id
  * name
  * email
  * passwordHash
  * role
  * isActive
  * mustChangePassword
  * timestamps
* Make email unique and case-insensitive.
* Extend Ticket with:
  * ticketOwnerId
  * itPriority
  * problemAppearsResolved
  * resolutionSummary
* Change Ticket.requesterId to reference User.
* Add:
  * PublicComment
  * InternalNote

### Migration

Implement the Lab 2 → Lab 3 migration described in specification.md §7.1:

* Create User records for existing Development Requesters.
* Backfill Ticket.requesterId.
* Copy requestedPriority to itPriority.
* Set problemAppearsResolved = false.
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

* server/tests/lab-03/unit/email.unit.test.ts
  * UNIT-07
  * UNIT-08
* server/tests/lab-03/migration.api.test.ts
  * MIG-02
  * MIG-03
  * MIG-04
  * MIG-05

## Covers

* specification.md §7
* specification.md §7.1

## Definition of Done

* Migration succeeds on the Lab 2 database.
* Seed is idempotent.
* All Issue #37 tests pass.
* Existing Lab 2 data is preserved.
```
> **SaintCrois** requested changes

**SaintCrois:**
```
Looking great! I am not quite sure about uploading the uploads into GitHub. If you would like to fix that, you may do it now. If not, then please get to me when you are ready to merge!
```
**Me:**
```
I have removed the uploaded files and updated .gitignore to exclude the uploads folder.
If there is nothing else left, please proceed to merge.
```
> **SaintCrois** approved these changes

> **SaintCrois** merged commit 169a961 into lab3-staging

### #48 feature/12-lab3-auth
```
## Issue 12
**Branch:** feature/12-lab3-auth

## Scope

Implement the complete authentication, authorization, application shell, and authenticated requester workflow.

### Authentication

* bcrypt password hashing with cost 12.
* Password-policy validator.
* POST /api/auth/login
* POST /api/auth/logout
* GET /api/auth/me
* POST /api/auth/change-password
* Signed JWT authentication.
* Store JWT in an httpOnly, Secure, SameSite=Strict cookie.
* Implement logout/session invalidation.
* Session middleware populating req.user.
* Return 401 for unauthenticated requests.
* Implement X-Requested-With validation for state-changing requests.
* Remove X-Dev-Requester-Id handling from the server.

### Authorization

* Implement reusable requireRole(...).
* Implement ticket and attachment ownership checks.
* Apply authorization rules to existing API routes.
* Implement the authorization matrix from api-spec.md §6.
* Ensure correct 401 vs 403 responses.
* Apply the safe-error response format from api-spec.md §7.

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
* Redirect to Login after 401.
* Shared Forbidden screen.

### Requester UI

Remove the Development Requester selector and all related state.

Re-point requester functionality to the authenticated session:

* My Tickets.
* Create Ticket.
* Ticket Detail.
* Attachments.
* Public requester actions.

The server must derive the requester identity from req.user.

Confirm that existing Lab 2 requester functionality continues to work for authenticated Requesters.

## Tests to Add

### Unit

server/tests/lab-03/unit/password.unit.test.ts

* UNIT-01
* UNIT-02

server/tests/lab-03/unit/session.unit.test.ts

* UNIT-03
* UNIT-04

### API

server/tests/lab-03/auth.api.test.ts

* API-01–API-07

server/tests/lab-03/authorization.api.test.ts

* SEC-01–SEC-09

server/tests/lab-03/migration.api.test.ts

* MIG-01 — full Lab 2 regression under authentication

### Authentication UI

client/tests/lab-03/Login.test.tsx

* UI-01–UI-04
* UI-26

client/tests/lab-03/ChangePassword.test.tsx

* UI-05–UI-08

client/tests/lab-03/AppShell.test.tsx

* UI-24
* UI-25

### Requester UI

client/tests/lab-03/RequesterTicketDetail.test.tsx

* UI-21–UI-23
* UI-30

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

* Users can log in and log out through the session cookie.
* Mandatory and voluntary password changes work.
* Password policies are enforced.
* Role-based navigation and authorization work correctly.
* Ticket and attachment ownership is enforced server-side.
* Correct 401 and 403 responses are returned.
* Safe-error responses are used for applicable failures.
* Session expiry redirects users to Login.
* The shared Forbidden screen is displayed for unauthorized access.
* Requester screens work using the authenticated session.
* The Development Requester selector and related state are completely removed.
* X-Dev-Requester-Id is no longer used anywhere in authentication or requester functionality.
* Authenticated requester functionality passes the full Lab 2 regression.
* All Issue #38 tests pass.
```
> **SaintCrois** approved these changes

**Me:** Great, thanks. Please merge.

> **SaintCrois** merged commit 7c7c1b4 into lab3-staging

### #49 feature/14-lab3-staff-ticket-management
```
## Issue 14
**Branch:** feature/14-lab3-staff-ticket-management

## Scope

Implement the complete IT Staff ticket workflow.

### Comments & Internal Notes API

Implement:

* Public Comment create/list.
* Internal Note create/list.
* Content validation.
* Append-only behavior.
* Server-controlled author and timestamp.
* No edit functionality.

Implement:

* PATCH /api/tickets/:id/resolution

with the required status-gate rule.

### Requester Ticket Detail

Add:

* Public Comments tab.
* Functional public comment creation/list.
* Problem Appears Resolved action.
* Visibility rules.
* Confirmation step.

### IT Staff Ticket Queue

Implement:

* GET /api/staff/tickets
* Search.
* Filters.
* Sorting.
* Pagination.
* Query validation.
* Empty state.
* No-results state.
* Forbidden state.
* Failure/loading states.
* Responsive desktop/tablet/mobile layouts.

### IT Staff Ticket Detail

Implement:

* Owner assignment.
* Priority update.
* Status update.
* Eligibility rules.
* Reassignment rules.
* Status transition matrix.
* Resolution Summary.
* Public Comments.
* Internal Notes.
* Attachments.
* Service Actions placeholder.
* Confirmation dialog for Resolved/Cancelled.

## Tests to Add

### Unit

server/tests/lab-03/unit/content.unit.test.ts

* UNIT-09
* UNIT-10

server/tests/lab-03/unit/status-transitions.unit.test.ts

* UNIT-05
* UNIT-06

server/tests/lab-03/unit/user-ownership.unit.test.ts

* UNIT-11

### API

server/tests/lab-03/comments-notes.api.test.ts

* API-08
* API-27–API-34

server/tests/lab-03/staff-queue.api.test.ts

* API-13–API-17

server/tests/lab-03/staff-ticket-detail.api.test.ts

* API-18–API-26

### UI

client/tests/lab-03/RequesterTicketDetail.test.tsx

* UI-21–UI-23
* UI-30

client/tests/lab-03/StaffTicketQueue.test.tsx

* UI-09–UI-12
* UI-27

client/tests/lab-03/StaffTicketDetail.test.tsx

* UI-13–UI-16
* UI-28

client/tests/lab-03/ZenGreenStyle.test.tsx

* STYLE-01
* STYLE-02

## Covers

* FR-09–17
* BR-04, 05
* BR-14–25
* AC-04
* AC-12–23
* AC-32

## Definition of Done

* IT Staff can find and manage tickets.
* Requesters can use public comments.
* Staff can use internal notes.
* Ticket ownership, priority, status, and resolution rules are enforced.
* All Issue #40 tests pass.
```
> **SaintCrois** approved these changes

**Me:** Nice, please merge.

**Me:** Wait, I noticed a UI bug and am fixing it.

**Me:**
```
I have fixed the UI issues, including consistency updates and the resolution summary behavior.
Please let me know when you are ready for the final review.
```
> **SaintCrois** approved these changes

> **SaintCrois** merged commit b9f99cf into lab3-staging

### #50 feature/lab3-admin-users
```
## Issue 15
**Branch:** feature/lab3-admin-users

## Scope

### API

Implement:

* GET /api/admin/users
* POST /api/admin/users
* PATCH /api/admin/users
* PATCH /api/admin/users/:id/password

Support:

* Search.
* Role filtering.
* User creation.
* User editing.
* Duplicate-email detection.
* Case-insensitive email handling.
* Self-deactivation protection.
* Last-Administrator protection.
* Password reset as initial password.
* Role and active/inactive state management.

### UI

Implement Administrator User Management:

* User list.
* Search/filter.
* Create User slide-over.
* Edit User slide-over.
* Field validation.
* Duplicate-email error.
* Disabled self-deactivation control.
* Success notifications.
* Appropriate loading/error/forbidden states.

## Tests to Add

### Unit

server/tests/lab-03/unit/user-ownership.unit.test.ts

* UNIT-12

### API

server/tests/lab-03/users-admin.api.test.ts

* API-35–API-43

### UI

client/tests/lab-03/UserManagement.test.tsx

* UI-17–UI-20
* UI-29

## Covers

* FR-18–24
* BR-08
* BR-11
* BR-26–29
* AC-24–30

## Definition of Done

* Administrators can create and manage users.
* Security restrictions are enforced server-side.
* User management UI follows the Lab 3 design.
* All Issue #41 tests pass.
```
> **SaintCrois** approved these changes

**Me:** Thank you, please merge.

> **SaintCrois** merged commit 23f00c6 into lab3-staging

### #51 feature/16-lab3-integration-qa
```
## Issue 16
**Branch:** feature/16-lab3-integration-qa

## Scope

This issue is the final integration and release milestone.

### Migration & Regression

Run the complete migration/regression suite:

* MIG-01
* MIG-02
* MIG-03
* MIG-04
* MIG-05

Confirm:

* Lab 2 data migrated correctly.
* Seed remains idempotent.
* No Development Requester selector remains.
* No X-Dev-Requester-Id references remain.
* Existing Lab 2 functionality still works under authentication.

### E2E Testing

Implement and pass:

* e2e/lab-03/authentication.spec.ts — E2E-01–E2E-03
* e2e/lab-03/staff-ticket-flow.spec.ts — E2E-04, E2E-05
* e2e/lab-03/user-administration.spec.ts — E2E-06–E2E-08
* e2e/lab-03/responsive.spec.ts — RESP-01–RESP-03

### Responsive & Visual QA

Capture screenshots for:

* Authentication.
* Staff Ticket Queue.
* Staff Ticket Detail.
* User Management.

Store them under:

artifacts/lab-03/screenshots/
├── authentication/
├── staff-queue/
├── staff-ticket-detail/
└── user-management/

Run the Zen Green visual checklist:

* Design consistency.
* Role-based navigation.
* Status/role badges.
* Editable vs read-only styling.
* Validation placement.
* Focus states.
* Responsive layout.
* Clipping.
* Overlap.
* Overflow.

Complete:

* STYLE-03

### Documentation

Create:

* docs/lab-03/reviewer.md
* docs/lab-03/ai-use.md

Include:

* Reviewer identity.
* PR links.
* Review comments.
* Responses.
* Approvals.
* LLM/tools used.
* 6–10 key prompts.
* My Reflection.

### Release

* Confirm all Definition of Done items in specification.md §10.
* Ensure all tests in tests.md are Pass.
* Merge lab3-staging into main.
* Move Issues #36 – #41 to Done.
* Verify the final submission evidence directly from main.

## Tests to Add / Final Verification

* All UNIT-* tests.
* All API-* tests.
* All UI-* tests.
* All SEC-* tests.
* All MIG-* tests.
* All E2E-* tests.
* All RESP-* tests.
* All STYLE-* tests.

## Definition of Done

* main contains the complete Lab 3 implementation.
* All tests in tests.md show Pass.
* E2E tests pass against the integrated application.
* Responsive screenshots are captured.
* Zen Green visual QA is complete.
* reviewer.md is complete.
* ai-use.md is complete.
* All required submission evidence can be assembled from main.
* Issue #42 is closed after the final release merge.
```
> **SaintCrois** review is pending

---

## Pull Requests I reviewed
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| [#16](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/16) | docs/lab2-spec-plan | Approve |
| [#17](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/17) | feat/lab2-db-context | Approve |
| [#18](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/18) | feature/6-create-ticket | Approve |
| [#19](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/19) | feature/7-my-tickets | Approve |
| [#20](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/20) | feature/8-ticket-detail-attachments | Approve |
| [#21](https://github.com/SaintCrois/Mein-Uni-Kampf/pull/21) | feature/9-e2e-release | Approve |
