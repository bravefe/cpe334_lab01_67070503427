# Lab 2 Sprint Engineering Specification
**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation

**Course:** CPE 334, Semester 1/2026

## 1. Sprint Goal

Deliver a working Requester-facing ticketing experience: a Requester can select a temporary
Development identity, create an IT support ticket with supporting attachments, receive a
system-generated Ticket Number, and locate, inspect, and manage that ticket afterward, all
while one Requester is fully prevented from seeing another Requester's data. The sprint also
establishes the reusable Zen Green visual and component language that later sprints build on.

---

## 2. Stakeholder Request Interpretation

IT wants to start accepting real support tickets from end users before full login exists. Since
authentication is a Lab 3 concern, Lab 2 needs a stand-in: a simple screen where a tester picks
which seeded Requester they're acting as. Once picked, that identity should behave like a "real"
logged-in user for every screen that follows: creating tickets, browsing "My Tickets," opening a
ticket's detail, and adding or removing attachments, and no other seeded Requester's tickets
should ever be visible in that session. The three screens (Create Ticket, My Tickets, Ticket
Detail) should share one consistent visual system (Zen Green) so later labs don't have to
reinvent forms, lists, badges, and empty/error states from scratch.

---

## 3. Scope

### Included
- Development Requester Selection screen (testing-only identity switcher) and requester context.
- Create Ticket screen: form, validation, attachment selection, submission, success/failure states.
- My Tickets screen: paginated, searchable, filterable, sortable list of the current Requester's
  own tickets, with empty and no-results states.
- Requester Ticket Detail screen: read-only ticket information plus attachment management
  (add, download, soft-remove).
- Attachment lifecycle: upload validation, storage, metadata, download, and soft removal.
- Ownership enforcement across all Requester-scoped endpoints.
- Zen Green reusable UI components: fields, buttons, badges, loading/empty/error states,
  responsive layout rules.
- Supporting database schema, seed data, and REST API described in this document.

### Explicitly Excluded
- Authentication and security: real login, passwords, sessions, tokens, authenticated identity,
  or real role-based authorization. The Development Requester selector is a **testing mechanism
  only**.
- IT Staff workflow: IT Staff dashboard/queue, claiming/reassigning tickets, setting IT Priority,
  ticket ownership by staff.
- Ticket collaboration: Public Comments, Internal Notes, Actions Taken.
- Ticket lifecycle beyond initial creation: no status transitions after `New` (no resolving,
  closing, reopening, cancelling).
- Administration functions: managing users, Requesters, roles, or reference data through the UI.

---

## 4. Functional Requirements

| FR | Description |
|----|-------------|
| FR-01 | The system shall present a Development Requester Selection screen listing only active Requesters, and shall require a selection before any ticket screen is used. |
| FR-02 | The system shall allow the tester to change the selected Requester at any time via a "Change Requester" action, reloading all Requester-scoped data. |
| FR-03 | The system shall load active Categories and active Related Systems for use in Create Ticket. |
| FR-04 | The system shall allow the current Requester to create a Ticket with Summary, Description, Category, Related System, and Requested Priority, and shall generate a unique, backend-assigned Ticket Number on success. |
| FR-05 | The system shall allow the Requester to attach supporting files to a Ticket, subject to the Attachment Rules (§5, Attachment group), either during creation or immediately afterward. |
| FR-06 | The system shall list, in "My Tickets," only Tickets owned by the currently selected Requester. |
| FR-07 | The system shall allow searching the Requester's own Tickets by Ticket Number and Summary. |
| FR-08 | The system shall allow filtering the Requester's own Tickets by Category, Requested Priority, and Current Status, with filters combinable. |
| FR-09 | The system shall allow sorting the Requester's own Tickets by Created Date, Ticket Number, Summary, Requested Priority, Current Status, and Last Updated. |
| FR-10 | The system shall paginate the Requester's own Tickets, returning page metadata (current page, page size, total items, total pages). |
| FR-11 | The system shall allow the Requester to retrieve full, read-only detail for one Ticket they own, identified by Ticket Number. |
| FR-12 | The system shall allow the Requester to add a permitted Attachment to an existing Ticket they own, subject to the active-Attachment limit. |
| FR-13 | The system shall allow the Requester to download an active Attachment belonging to a Ticket they own. |
| FR-14 | The system shall allow the Requester to soft-remove an active Attachment they own, with a required removal reason. |
| FR-15 | The system shall reject, as not found, any attempt to read or modify a Ticket or Attachment not owned by the currently selected Requester. |

---

## 5. Business Rules

### Ticket Defaults and System-Generated Values

| BR | Description |
|---|---|
| BR-01 | The official Ticket Number is generated by the backend in the format `TKT-<YYYY>-<6-digit sequence>` (e.g. `TKT-2026-000042`) and must be globally unique. It is never editable. |
| BR-02 | A new Ticket begins with Current Status `NEW`. No other status is reachable in Lab 2. |
| BR-03 | Ticket Date (`createdAt`) is system-generated at the moment of creation and is read-only. |
| BR-04 | `itPriority`, `publicChat`, `serviceAction` and `eventLog` will exist in the data model or ui for forward-compatibility with later labs but are never set, editable, or displayed to the Requester in Lab 2. |

### Requester Selection and Switching

| BR | Description |
|---|---|
| BR-05 | The Development Requester selector is a Lab 2 testing mechanism only. It must not be presented, described, or relied upon as authentication or security. |
| BR-06 | Only Requesters with `isActive = true` appear in the selector. |
| BR-07 | Changing the selected Requester immediately replaces the requester context used by every subsequent API call and reloads any currently displayed Requester-scoped screen. |
| BR-08 | Create Ticket, My Tickets, and Ticket Detail are inaccessible (redirect to the Selection screen) until a Development Requester has been selected. |

### Ticket Ownership

| BR | Description |
|---|---|
| BR-09 | A Ticket belongs to exactly one Requester — its creator — and is never reassigned to another Requester in Lab 2. |
| BR-10 | A Requester may list, view, or manage Attachments only for Tickets they own. |
| BR-11 | A request for a Ticket or Attachment not owned by the current Requester returns a not-found response rather than a response that reveals the resource exists under a different owner. |

### Search, Filtering, Sorting, and Pagination

| BR | Description |
|---|---|
| BR-12 | Search matches a case-insensitive partial string against Ticket Number and Summary only. |
| BR-13 | Category, Requested Priority, and Current Status filters combine with AND logic and with any active search term. |
| BR-14 | Default sort is Created Date descending; Ticket Number descending is the tiebreaker for equal Created Date values. |
| BR-15 | Page size defaults to 10 and is capped at 50. An invalid `page` or `pageSize` value falls back to its default rather than producing an error. |

### Validation and Duplicate-Submission Prevention

| BR | Description |
|---|---|
| BR-16 | Ticket Summary is required, trimmed of leading/trailing whitespace, and must be 5–150 characters after trimming. |
| BR-17 | Ticket Description is required, trimmed, and must be 20–2000 characters after trimming. |
| BR-18 | Category, Related System, and Requested Priority are required and must reference currently active reference data; inactive or unknown IDs are rejected. |
| BR-19 | The Submit control is disabled and shows a busy state for the duration of an in-flight creation request, preventing duplicate submissions from repeated clicks. |

### Failure Behavior and Data Retained After Errors

| BR | Description |
|---|---|
| BR-20 | If Ticket creation fails after client-side validation passes (e.g. a server or network error), no Ticket is persisted, and all entered field values remain in the form for correction and resubmission. |
| BR-21 | Ticket creation and Attachment upload are independent operations. A failed Attachment upload never rolls back an already-created Ticket; the Requester is shown which attachment(s) failed and may retry from Ticket Detail. |

### Attachment Upload, Download, and Soft Removal

| BR | Description |
|---|---|
| BR-22 | Allowed Attachment types are JPG, JPEG, PNG, WEBP, and PDF, checked by both file extension and MIME type; any other type is rejected before upload begins. |
| BR-23 | Maximum Attachment size is 5 MB per file; oversized files are rejected client-side when detectable, and server-side in all cases, with a clear message. |
| BR-24 | A Ticket may have at most five active Attachments at any time; soft-removed Attachments do not count toward this limit. |
| BR-25 | Attachment removal is a soft removal: the Attachment row and its metadata are retained permanently; only its status changes from `ACTIVE` to `REMOVED`. |
| BR-26 | A non-empty removal reason is required to soft-remove an Attachment and is stored with the removal. |
| BR-27 | A `REMOVED` Attachment can never be downloaded or previewed. Its metadata (original file name, uploaded date, removed date, removal reason) remains visible in Ticket Detail with a visible "Removed" indicator. |

### Inactive Requesters

| BR | Description |
|---|---|
| BR-28 | An inactive Development Requester cannot be selected in the selector. Tickets they previously created are not deleted and remain fully queryable if the Requester is later reactivated. |

### Empty and No-Results States

| BR | Description |
|---|---|
| BR-29 | An Empty state (the Requester has never created a Ticket) is presented differently from a No-Results state (the Requester has Tickets, but the current search/filter combination matches none). |

### Ticket Detail Access

| BR | Description |
|---|---|
| BR-30 | Ticket Detail is fully read-only in Lab 2. No Current Status change, comment, internal note, or Actions Taken entry is available from this screen. |

### Transition to Real Authentication in Lab 3

| BR | Description |
|---|---|
| BR-31 | Lab 2 identifies the current Requester via a client-held requester context rather than a session. Lab 3 is expected to replace only the source of that identity (an authenticated session/token) — the ownership-comparison logic in every endpoint (`ticket.requesterId === currentRequesterId`) is designed to remain unchanged. |

---

## 6. UI Specification Summary

Full detail lives in `docs/lab-02/ui-spec.md`; this section summarizes what it must cover.

- **Application shell:** TokTickIT identity/logo, `My Tickets` and `Create Ticket` navigation,
  current Requester name with a `Change Requester` action, active-page indication, responsive
  (collapsing) mobile navigation.
- **Development Requester Selection:** dropdown of active Requesters only, loading state, empty
  state (no active Requesters), API-failure state, explanatory "testing only, not login" copy,
  keyboard-accessible controls.
- **Create Ticket:** system-generated fields (Ticket Number, Ticket Date, Requester) shown
  read-only and visually distinct from editable fields; Category/Related System/Requested
  Priority grouped together; Summary and Description given generous width; Attachments below the
  main fields; primary (Submit) and secondary (Cancel) actions at the bottom; busy/disabled Submit
  state; inline field-level validation messages; success state displaying the returned Ticket
  Number.
- **My Tickets:** search box, Category/Requested Priority/Current Status filters, `Clear Filters`
  and `Create Ticket` actions, sortable columns (Ticket Number, Created Date, Summary, Category,
  Requested Priority, Current Status, Last Updated), pagination controls, loading/empty/no-results/
  failure states, responsive table→card collapse on mobile.
- **Ticket Detail:** read-only header fields grouped separately from the Attachments panel;
  Attachments list shows active items with download/remove actions and removed items shown
  greyed-out with metadata only; add-attachment control reuses Create Ticket's upload rules.
- **Shared components:** badges for Requested Priority / Current Status (color + text, never color
  alone); one consistent field height; multiline Description resizes without breaking layout;
  every icon-only control has an accessible label; visible focus indicators for keyboard users.
- **Responsive breakpoints:** Desktop ≥ 992px (multi-column, centered, max-width content), Tablet
  768–991px (two columns where practical), Mobile < 768px (fields stack, touch-friendly buttons,
  no horizontal scroll). No clipped labels, overlapping messages, or hidden buttons at any size.
- **Color tokens:** Primary green `#006B3C`, Secondary green `#0B7A46`, Pale green `#EAF6EF`, Page
  background `#F5F7F6`, white surfaces with restrained shadow/border, dark charcoal-green text,
  distinct editable vs. read-only field shading, dark red error styling, amber warning (non-
  decorative use only), green success confirmation with text, not color alone.

---

## 7. Data Changes

### 7.1 Concepts and Fields

**Priority** 
| Field | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | unique; seeded: High, Medium, Low |
| sortOrder | Int | unique; 1=Low, 2=Medium, 3=High — drives correct low→high ordering in UI |

**Status** 
| Field | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | unique; seeded: New, Open, In Progress, Pending |
| isDefault | Boolean | default `false`; exactly one row (`New`) has `true` — used as `Ticket.currentStatusId` on create |

**DevRequester**
| Field | Type | Notes |
|---|---|---|
| id | Int/UUID PK | |
| fullName | String | required |
| email | String | unique |
| isActive | Boolean | default `true`; inactive Requesters excluded from selector (BR-06, BR-28) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Category**
| Field | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | unique; seeded: Account and Access, Hardware, Software, Network |
| isActive | Boolean | default `true` |

**RelatedSystem**
| Field | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | unique; seeded with ≥ 6 systems (Email, Campus Wi-Fi, VPN, LEB2 App, Grade Submission App, Printer, Corporate Laptop) |
| isActive | Boolean | default `true` |

**Ticket** 
| Field | Type | Notes |
|---|---|---|
| id | Int/UUID PK | internal key |
| ticketNumber | String | unique, indexed; format per TKT-YYY-XXXXXX |
| requesterId | FK → DevRequester | required; indexed for My Tickets queries |
| categoryId | FK → Category | required; indexed for filtering |
| relatedSystemId | FK → RelatedSystem | required |
| summary | String(150) | required, trimmed (BR-16) |
| description | Text(2000) | required, trimmed (BR-17) |
| requestedPriorityId | FK → Priority | required |
| itPriorityId | FK → Priority — nullable | reserved, unused in Lab 2 (BR-04) |
| currentStatusId | FK → Status | required; defaults to the `New` row; indexed for filtering |
| ownerId | FK — nullable | reserved for IT Staff assignment, unused in Lab 2 |
| createdAt | DateTime | indexed; drives default sort |
| updatedAt | DateTime | drives "Last Updated" |

**Attachment**
| Field | Type | Notes |
|---|---|---|
| id | Int/UUID PK | |
| ticketId | FK → Ticket | required; indexed |
| originalFileName | String | as uploaded, display-only |
| storedFileName | String | sanitized/randomized on-disk name, never derived from user input directly |
| mimeType | String | validated against allow-list (BR-22) |
| fileSize | Int | validated ≤ 5 MB (BR-23) |
| status | AttachmentStatus enum | default `ACTIVE`; values: `ACTIVE`, `REMOVED` |
| removalReason | String — nullable | required when status = REMOVED (BR-26) |
| removedAt | DateTime — nullable | |
| uploadedAt | DateTime | |

### 7.2 Relationships
- One `DevRequester` → many `Ticket` (one `Ticket` → one `DevRequester`).
- One `Priority` → many `Ticket.requestedPriorityId`; one `Priority` → many `Ticket.itPriorityId`.
- One `Status` → many `Ticket`.
- One `Ticket` → many `Attachment`.
- One `Category` → many `Ticket`.
- One `RelatedSystem` → many `Ticket`.

### 7.3 Indexes and Constraints
- Unique: `Ticket.ticketNumber`, `DevRequester.email`, `Category.name`, `RelatedSystem.name`,
  `Priority.name`, `Priority.sortOrder`, `Status.name`.
- Foreign keys: `Ticket.requesterId`, `Ticket.categoryId`, `Ticket.relatedSystemId`,
  `Ticket.requestedPriorityId`, `Ticket.itPriorityId`, `Ticket.currentStatusId`,
  `Attachment.ticketId`.
- Indexes: `Ticket.requesterId` (My Tickets scoping), `Ticket.createdAt` (default sort),
  `Ticket.categoryId` / `Ticket.requestedPriorityId` / `Ticket.currentStatusId` (filters),
  `Attachment.ticketId`, `Attachment.status`.
- Nullability: `itPriorityId`, `ownerId`, `removalReason`, `removedAt` (Attachment),
  `removedAt`;
  all Requester-facing required fields are `NOT NULL`.

### 7.4 Seed Data 
Seed script remains idempotent (upsert by unique key) and now additionally creates:
- **Priority**: `High` (sortOrder 3), `Medium` (sortOrder 2), `Low` (sortOrder 1).
- **Status**: `New` (isDefault=true), `Open`, `In Progress`, `Pending`.

Existing seed obligations (4 Categories, ≥6 Related Systems, ≥4 active + 1 inactive
DevRequester) are unchanged.

---

## 8. API Contract

Full request/response bodies live in `docs/lab-02/api-spec.md`; this is the contract summary.

### 8.1 Requester Context

### 8.2 Endpoints

| Method & Path | Purpose | Auth/Ownership |
|---|---|---|
| `GET /api/categories` | List active Categories | none |
| `GET /api/related-systems` | List active Related Systems | none |
| `GET /api/dev-requesters` | List active Development Requesters | none |
| `POST /api/tickets` | Create a Ticket for the current Requester | requester context required |
| `GET /api/tickets` | Paginated, searchable, filterable, sortable list of the current Requester's own Tickets | scoped to `X-Dev-Requester-Id` |
| `GET /api/tickets/:ticketNumber` | Retrieve one owned Ticket's detail | rejects if not owner (BR-11) |
| `POST /api/tickets/:ticketNumber/attachments` | Upload an Attachment to an owned Ticket | rejects if not owner |
| `GET /api/tickets/:ticketNumber/attachments` | List Attachment metadata (active + removed) for an owned Ticket | rejects if not owner |
| `GET /api/attachments/:attachmentId/download` | Download an active Attachment | rejects if not owner or not active |
| `PATCH /api/attachments/:attachmentId/remove` | Soft-remove an active Attachment (body: `{ reason }`) | rejects if not owner |

### 8.3 `GET /api/tickets` Query Parameters
`search`, `category`, `requestedPriority`, `currentStatus`, `sortBy`
(`createdAt` \| `ticketNumber` \| `summary` \| `requestedPriority` \| `currentStatus` \|
`updatedAt`), `sortDir` (`asc` \| `desc`), `page`, `pageSize`. Response includes
`{ data: Ticket[], page, pageSize, totalItems, totalPages }`.


### 8.4 Expected HTTP Statuses

| Status | Used For |
|---|---|
| 200 | Successful retrieval (list, detail, attachment metadata, download) |
| 201 | Ticket created; Attachment uploaded |
| 400 | Validation failure (missing/invalid field, bad query parameter after fallback rules) |
| 404 | Ticket/Attachment not found, or not owned by the current Requester (BR-11) |
| 409 | Soft-remove attempted on an already-removed Attachment |
| 413 | Attachment exceeds 5 MB |
| 415 | Attachment type not in the allowed list |
| 422 | Upload would exceed the 5 active-Attachment limit |
| 500 | Unexpected server error (generic, safe message only — no stack traces to client) |

---

## 9. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | Given valid Ticket data, when the Requester submits Create Ticket, then one Ticket is saved and the backend-generated Ticket Number is displayed. |
| AC-02 | Given no Development Requester is selected, when the user attempts to open My Tickets or Create Ticket, then the Requester Selection screen is shown instead. |
| AC-03 | Given Requester B is selected, when a Ticket belonging to Requester A is requested by number, then a not-found response is returned and no Ticket data is shown. |
| AC-04 | Given Requester B is selected, when My Tickets is viewed, then none of Requester A's Tickets appear in the list. |
| AC-05 | Given the Summary field is empty, when the Requester submits the form, then a field-level validation message appears and no API call is made. |
| AC-06 | Given a Description shorter than 20 characters, when the Requester submits the form, then a boundary validation message appears identifying the minimum length. |
| AC-07 | Given a Summary of exactly 150 characters, when the Requester submits the form, then the Ticket is accepted (upper boundary passes). |
| AC-08 | Given a Summary of 151 characters, when the Requester submits the form, then a validation message appears and the Ticket is not created (upper boundary fails). |
| AC-09 | Given the Requester selects a `.gif` file, when adding it as an Attachment, then it is rejected before upload with an unsupported-type message. |
| AC-10 | Given the Requester selects a valid PDF over 5 MB, when adding it as an Attachment, then it is rejected with a file-size message. |
| AC-11 | Given a Ticket already has five active Attachments, when the Requester attempts to add a sixth, then the upload is rejected with a limit-reached message. |
| AC-12 | Given the Requester clicks Submit, when the creation request is in flight, then the Submit control is disabled and shows a busy state until the request resolves. |
| AC-13 | Given the backend is unreachable, when the Requester submits a valid form, then a safe error state is shown and all entered field values remain in the form. |
| AC-14 | Given a Ticket is created but its Attachment upload fails, when the Requester views the result, then the Ticket still exists with its Ticket Number, and the failed Attachment(s) are reported separately. |
| AC-15 | Given the Requester searches My Tickets by a partial Ticket Number, when results return, then only Tickets whose number contains that text (case-insensitive) are shown. |
| AC-16 | Given the Requester applies a Category filter and a Requested Priority filter together, when results return, then only Tickets matching both are shown. |
| AC-17 | Given the Requester sorts by Created Date, when the sort direction is toggled, then the list order reverses accordingly. |
| AC-18 | Given more Tickets exist than one page size, when the Requester pages forward, then the next set of Tickets loads and page metadata updates correctly. |
| AC-19 | Given the current Requester has never created a Ticket, when My Tickets is opened, then the Empty state (not the No-Results state) is shown. |
| AC-20 | Given the current Requester has Tickets but the applied filters match none, when My Tickets is viewed, then the No-Results state is shown with a Clear Filters action. |
| AC-21 | Given an owned Ticket's Detail screen is open, when the Requester adds a valid Attachment, then it appears in the Attachments list as Active without a page reload. |
| AC-22 | Given an owned, active Attachment, when the Requester downloads it, then the original file content is returned. |
| AC-23 | Given an owned, active Attachment, when the Requester soft-removes it without entering a reason, then the removal is blocked until a reason is provided. |
| AC-24 | Given an owned Attachment was soft-removed with a reason, when Ticket Detail is viewed, then the Attachment shows as Removed with its metadata and reason visible, and its download control is disabled. |
| AC-25 | Given the Development Requester list is requested, when an inactive Requester exists, then that Requester does not appear in the selector dropdown. |
| AC-26 | Given a Requester is selected, when the tester chooses Change Requester and picks a different active Requester, then My Tickets reloads to show only the newly selected Requester's Tickets. |
| AC-27 | Given the Create Ticket screen is viewed at a mobile viewport (< 768px), when the form renders, then all fields stack vertically with no horizontal page scrolling. |
| AC-28 | Given a user is navigating by keyboard only, when moving through the Requester Selection form, then every control is reachable in a logical order with a visible focus indicator. |

---

## 10. Definition of Done

### 10.1 Product Completion (must be true before the coding agent may report "done")
-  All FR-01–FR-15 are implemented.
-  All AC-01–AC-26 have passing, traceable automated test evidence.
-  No required test is skipped, disabled, commented out, or flaky.
-  Data model, API, and UI conform to §§6–8 of this document; any deviation is logged and
      re-approved here first.
-  Success, validation-failure, API-failure, and boundary cases are all handled per §5's
      Business Rules — not just the happy path.
-  Ownership enforcement (BR-09–BR-11) is verified with an explicit cross-Requester test, not
      just visual inspection.
-  Responsive layout is verified at desktop, tablet, and mobile per §6 and §8.7 of the lab
      handout, with no clipping, overlap, or unintended horizontal scroll.
-  README setup and test-run instructions are current and match the final main branch.

### 10.2 Course Delivery Requirements (checked separately, per §13.2 of the handout)
-  GitHub Issues created and moved through Backlog → Specified → Started → PR Review →
      Fixing → Done for every feature branch.
-  Each feature branch merged into `lab2-staging` via a peer-reviewed Pull Request; one release
      PR opened from `lab2-staging` to `main`.
-  `reviewer.md` and `ai-use.md` completed and rendered.
-  Required screenshots and PDF submission assembled per the handout's Part 1–9 structure.

---

## 11. Assumptions and Decisions

1. **Requester context transport.** Since Lab 2 has no auth layer, the selected Requester's id is
   sent as an `X-Dev-Requester-Id` request header (persisted client-side only, e.g. in memory or
   `sessionStorage`-equivalent) rather than as a client-controlled query parameter. This keeps the
   ownership check on the same code path that Lab 3's real session/token will feed.
2. **Ownership-failure status code.** A Ticket or Attachment that exists but isn't owned by the
   current Requester returns **404**, not 403, so the response never confirms the resource exists
   under a different owner (BR-11).
3. **`itPriority` columns exist but are unused.** They're included in the Lab 2
   schema for forward compatibility so Lab 3+ doesn't require a breaking migration, but are never
   set, validated, or shown to the Requester — those illustrative columns in the sample My Tickets
   screenshot belong to the IT Staff view, which is out of scope here.
4. **Attachment creation flow.** Ticket creation and Attachment upload are treated as two separate
   API calls rather than one multipart transaction (BR-21), so a failed upload never invalidates
   an otherwise-successful Ticket. The Create Ticket screen performs both calls in sequence and
   reports partial success clearly.
5. **Attachment storage.** Files are stored under a server-side path keyed by Ticket id, using a
   randomized `storedFileName`; the user-facing `originalFileName` is metadata only and is never
   used to construct a filesystem path (prevents path traversal / unsafe filenames).
6. **Soft-delete representation.** `Attachment.status` is an enum (`ACTIVE`/`REMOVED`) rather than
   a boolean, to allow future intermediate states without a column-type migration.
7. **Duplicate-submission prevention scope.** Limited to a client-side Submit lock (BR-19); no
   server-side idempotency key is implemented in Lab 2, since true duplicate-request protection
   depends on the authenticated-session model arriving in Lab 3.
8. **Search scope.** Search matches Ticket Number and Summary only, not Description, to keep query
   behavior predictable and fast without full-text indexing infrastructure that's out of scope for
   an MVP sprint.
9. **Pagination limits.** Page size defaults to 10 and is capped at 50; invalid values silently
   fall back to defaults (BR-15) rather than returning 400, since these are UI-driven parameters,
   not user-entered form data.
