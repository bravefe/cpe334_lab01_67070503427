# TokTickIT — API Specification (Lab2)

## 1. Conventions

- **Base URL:** `/api`
- **Content-Type:** `application/json` for all requests/responses except file upload
  (`multipart/form-data`) and file download (binary passthrough with original `Content-Type`).
- **Requester context:** every Requester-scoped endpoint requires header
  `X-Dev-Requester-Id: <requesterId>`. This is a Lab 2 testing stand-in (BR-05) — never a
  client-supplied `requesterId` in the URL/query is trusted for ownership.
- **Errors:** a consistent envelope on all 4xx/5xx responses:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Description is below the minimum length of 20 characters.",
      "fieldErrors": [
        { "field": "description", "message": "Must be at least 20 characters." }
      ]
    }
  }
  ```
  `fieldErrors` is present only for 400 validation failures; other error types omit it.

---

## 2. Reference Data Endpoints

### `GET /api/categories`
Lists active Categories.
- **Auth:** none
- **Response 200:**
  ```json
  { "data": [ { "id": 2, "name": "Hardware" }, { "id": 5, "name": "Software" } ] }
  ```

### `GET /api/related-systems`
Lists active Related Systems.
- **Auth:** none
- **Response 200:**
  ```json
  { "data": [ { "id": 7, "name": "Email" }, { "id": 3, "name": "VPN" } ] }
  ```

### `GET /api/priorities`
Lists Priorities, ordered by `sortOrder` ascending.
- **Auth:** none
- **Response 200:**
  ```json
  { "data": [
    { "id": 1, "name": "Low", "sortOrder": 1 },
    { "id": 2, "name": "Medium", "sortOrder": 2 },
    { "id": 3, "name": "High", "sortOrder": 3 }
  ] }
  ```

### `GET /api/statuses`
Lists Statuses.
- **Auth:** none
- **Response 200:**
  ```json
  { "data": [
    { "id": 1, "name": "New", "isDefault": true },
    { "id": 2, "name": "Open", "isDefault": false },
    { "id": 3, "name": "In Progress", "isDefault": false },
    { "id": 4, "name": "Pending", "isDefault": false }
  ] }
  ```
  Only the `isDefault` row is reachable as a Ticket's `currentStatusId` in Lab 2, since no
  status-transition endpoint exists yet — the same posture as `itPriorityId`.

### `GET /api/dev-requesters`
Lists active Development Requesters for the Selection screen (FR-01, BR-06).
- **Auth:** none
- **Response 200:**
  ```json
  { "data": [ { "id": 12, "name": "Alex Rivera", "code": "REQ-012" } ] }
  ```
- **Response 200 (empty):** `{ "data": [] }` — UI shows the empty-selector state.
- **Response 500:** generic safe error envelope.

---

## 3. Ticket Endpoints

### `POST /api/tickets`
Creates a Ticket owned by the current Requester (FR-04).
- **Auth:** `X-Dev-Requester-Id` required.
- **Request body:**
  ```json
  {
    "categoryId": 2,
    "relatedSystemId": 7,
    "summary": "Laptop battery drains quickly",
    "description": "Battery drains fast even when idle, started after last update.",
    "requestedPriorityId": 2
  }
  ```
- **Validation (BR-16–BR-18):**
  | Field | Rule |
  |---|---|
  | `summary` | required, trimmed, 5–150 chars |
  | `description` | required, trimmed, 20–2000 chars |
  | `categoryId` | required, must reference an active Category |
  | `relatedSystemId` | required, must reference an active Related System |
  | `requestedPriorityId` | required, must reference an existing Priority |
- **Response 201:**
  ```json
  {
    "data": {
      "ticketCode": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "description": "Battery drains fast even when idle, started after last update.",
      "categoryId": 2,
      "relatedSystemId": 7,
      "requestedPriorityId": 2,
      "itPriorityId": null,
      "currentStatusId": 1,
      "createdAt": "2026-08-22T09:14:00Z",
      "updatedAt": "2026-08-22T09:14:00Z"
    }
  }
  ```
- **Response 400:** field-level validation errors (BR-16–BR-18), e.g. inactive/unknown
  `categoryId`, unknown `requestedPriorityId`.
- **Response 500:** no Ticket persisted (BR-20).

### `GET /api/tickets`
Paginated, searchable, filterable, sortable list of the current Requester's own Tickets
(FR-06–FR-10).
- **Auth:** scoped to `X-Dev-Requester-Id`.
- **Query parameters:**
  | Param | Type | Notes |
  |---|---|---|
  | `search` | string | matches Ticket Number / Summary, case-insensitive partial (BR-12) |
  | `category` | int | Category id filter |
  | `requestedPriorityId` | int | Priority id filter |
  | `currentStatusId` | int | Status id filter (only the default `New` id is reachable in Lab 2) |
  | `sortBy` | string | `createdAt` \| `ticketCode` \| `summary` \| `requestedPriorityId` \| `currentStatusId` \| `updatedAt` |
  | `sortDir` | string | `asc` \| `desc`, default per BR-14 |
  | `page` | int | default 1; invalid falls back to default (BR-15) |
  | `pageSize` | int | default 10, capped 50; invalid falls back to default (BR-15) |

  Filters combine with AND logic and with any active search term (BR-13). Default sort:
  Created Date descending, Ticket Number descending as tiebreaker (BR-14).
- **Response 200:**
  ```json
  {
    "data": [
      {
        "ticketCode": "TKT-2026-000042",
        "summary": "Laptop battery drains quickly",
        "categoryId": 2,
        "requestedPriorityId": 2,
        "currentStatusId": 1,
        "createdAt": "2026-08-22T09:14:00Z",
        "updatedAt": "2026-08-22T09:14:00Z"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
  ```

### `GET /api/tickets/:ticketCode`
Full read-only detail for one owned Ticket (FR-11).
- **Auth:** rejects if not owner — returns 404, never 403 (BR-11).
- **Response 200:**
  ```json
  {
    "data": {
      "ticketCode": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "description": "Battery drains fast even when idle, started after last update.",
      "categoryId": 2,
      "relatedSystemId": 7,
      "requestedPriorityId": 2,
      "itPriorityId": null,
      "currentStatusId": 1,
      "createdAt": "2026-08-22T09:14:00Z",
      "updatedAt": "2026-08-22T09:14:00Z",
      "attachments": [
        {
          "attachmentId": 101,
          "originalFileName": "screenshot.png",
          "status": "ACTIVE",
          "uploadedAt": "2026-08-22T09:15:00Z"
        }
      ],
      "publicComments": [
        {
          "id": 1,
          "authorId": 12,
          "message": "Any update on this?",
          "createdAt": "2026-08-22T10:00:00Z"
        }
      ],
      "serviceActions": [
        {
          "id": 1,
          "message": "Escalated to hardware team.",
          "createdAt": "2026-08-22T11:00:00Z"
        }
      ],
      "eventLog": [
        {
          "id": 1,
          "message": "Ticket created.",
          "createdAt": "2026-08-22T09:14:00Z"
        }
      ]
    }
  }
  ```
- **Response 404:** Ticket not found, or exists but not owned by current Requester.

---

## 4. Attachment Endpoints

### `POST /api/tickets/:ticketCode/attachments`
Uploads an Attachment to an owned Ticket (FR-05, FR-12).
- **Auth:** rejects if not owner (404).
- **Request:** `multipart/form-data`, field `file`.
- **Validation:**
  | Rule | Source |
  |---|---|
  | Type in `.jpg`/`.jpeg`/`.png`/`.webp`/`.pdf`, checked by extension and MIME | BR-22 |
  | Max size 5 MB | BR-23 |
  | Ticket must have fewer than 5 active Attachments | BR-24 |
- **Response 201:**
  ```json
  {
    "data": {
      "attachmentId": 102,
      "originalFileName": "invoice.pdf",
      "status": "ACTIVE",
      "uploadedAt": "2026-08-22T09:20:00Z"
    }
  }
  ```
- **Response 404:** Ticket not found / not owned.
- **Response 413:** exceeds 5 MB.
- **Response 415:** type not in the allowed list.
- **Response 422:** would exceed the 5 active-Attachment limit.

### `GET /api/tickets/:ticketCode/attachments`
Lists Attachment metadata (active + removed) for an owned Ticket.
- **Auth:** rejects if not owner (404).
- **Response 200:**
  ```json
  {
    "data": [
      {
        "attachmentId": 101,
        "originalFileName": "screenshot.png",
        "status": "ACTIVE",
        "uploadedAt": "2026-08-22T09:15:00Z"
      },
      {
        "attachmentId": 99,
        "originalFileName": "old-log.pdf",
        "status": "REMOVED",
        "uploadedAt": "2026-08-20T10:00:00Z",
        "removedAt": "2026-08-21T08:00:00Z",
        "removalReason": "Duplicate of screenshot.png"
      }
    ]
  }
  ```

### `GET /api/attachments/:attachmentId/download`
Downloads an active Attachment (FR-13).
- **Auth:** rejects if not owner or not active (404 — BR-27 forbids downloading `REMOVED`
  Attachments).
- **Response 200:** binary file stream, `Content-Disposition: attachment; filename="<originalFileName>"`.
- **Response 404:** not owned, not found, or status is `REMOVED`.

### `PATCH /api/attachments/:attachmentId/remove`
Soft-removes an active Attachment (FR-14).
- **Auth:** rejects if not owner (404).
- **Request body:**
  ```json
  { "reason": "Wrong file, replaced by newer screenshot." }
  ```
- **Validation:** `reason` required, non-empty (BR-26).
- **Response 200:**
  ```json
  {
    "data": {
      "attachmentId": 101,
      "status": "REMOVED",
      "removedAt": "2026-08-22T10:00:00Z",
      "removalReason": "Wrong file, replaced by newer screenshot."
    }
  }
  ```
- **Response 400:** missing/empty `reason`.
- **Response 404:** not owned / not found.
- **Response 409:** already `REMOVED`.

---

## 5. Public Comment Endpoints

### `POST /api/tickets/:ticketCode/comments`
Adds a Public Comment to an owned Ticket, authored by the current Requester.
- **Auth:** `X-Dev-Requester-Id` required; rejects if not owner (404).
- **Request body:**
  ```json
  { "message": "Any update on this?" }
  ```
- **Validation:** `message` required, non-empty, trimmed.
- **Response 201:**
  ```json
  {
    "data": {
      "id": 1,
      "ticketId": 42,
      "authorId": 12,
      "message": "Any update on this?",
      "createdAt": "2026-08-22T10:00:00Z"
    }
  }
  ```
- **Response 400:** missing/empty `message`.
- **Response 404:** Ticket not found / not owned.

### `GET /api/tickets/:ticketCode/comments`
Lists Public Comments (active + removed) for an owned Ticket.
- **Auth:** rejects if not owner (404).
- **Response 200:**
  ```json
  {
    "data": [
      { "id": 1, "authorId": 12, "message": "Any update on this?", "createdAt": "2026-08-22T10:00:00Z" },
      { "id": 2, "authorId": 12, "message": "Never mind, resolved.", "createdAt": "2026-08-22T12:00:00Z", "removedAt": "2026-08-22T12:05:00Z" }
    ]
  }
  ```

### `PATCH /api/comments/:commentId/remove`
Soft-removes a Public Comment.
- **Auth:** rejects if not owner (404).
- **Response 200:**
  ```json
  { "data": { "id": 1, "removedAt": "2026-08-22T12:05:00Z" } }
  ```
- **Response 404:** not owned / not found.
- **Response 409:** already removed.

---

## 6. Service Action Endpoints

### `GET /api/tickets/:ticketCode/service-actions`
Lists Service Actions (active + removed) for an owned Ticket.
- **Auth:** rejects if not owner (404).
- **Response 200:**
  ```json
  {
    "data": [
      { "id": 1, "message": "Escalated to hardware team.", "createdAt": "2026-08-22T11:00:00Z" }
    ]
  }
  ```

Creation is reserved for the IT Staff workflow introduced in Lab 3; this read endpoint lets
the ticket-detail screen render the section now.

---

## 7. Event Log Endpoints

### `GET /api/tickets/:ticketCode/event-log`
Lists Event Log entries (active + removed) for an owned Ticket.
- **Auth:** rejects if not owner (404).
- **Response 200:**
  ```json
  {
    "data": [
      { "id": 1, "message": "Ticket created.", "createdAt": "2026-08-22T09:14:00Z" }
    ]
  }
  ```

Entries are system-generated (e.g. "Ticket created", future "Status changed to Open"); there
is no Requester-facing write endpoint.

---

## 8. Status Code Reference

| Status | Used For |
|---|---|
| 200 | Successful retrieval (list, detail, attachment/comment/action/log metadata, download, remove) |
| 201 | Ticket created; Attachment uploaded; Public Comment created |
| 400 | Validation failure (missing/invalid field, bad query parameter after fallback rules, unknown `requestedPriorityId`) |
| 404 | Ticket/Attachment/Comment/Action/Log not found, or not owned by the current Requester (BR-11) |
| 409 | Soft-remove attempted on an already-removed Attachment or Public Comment |
| 413 | Attachment exceeds 5 MB |
| 415 | Attachment type not in the allowed list |
| 422 | Upload would exceed the 5 active-Attachment limit |
| 500 | Unexpected server error (generic, safe message only — no stack traces to client) |