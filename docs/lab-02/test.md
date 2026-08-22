# Lab 2 Test Plan and Results

## 1. Test Strategy

Lab 2 testing uses two automated layers for the Requester-facing surface only:

* **Server (API) tests** — `server/tests/lab-02/*.api.test.ts`. Test the Express/API layer directly using a seeded test database. Each file covers a resource and verifies status codes, response formats, validation rules (BR-xx), and ownership scoping (BR-11) from `api-spec.md`.

* **Client (component) tests** — `client/.../lab-02 tests/*.test.tsx`. Test screens in isolation with React Testing Library and a mocked API client, covering rendered states, form validation, and empty/error states.

Out of scope: E2E/browser tests, IT Staff screens, and fields/endpoints marked "reserved, unused in Lab 2" (`itPriorityId`, `ownerId`, non-default `Status` rows, Service Action/Event Log writes).

**Ownership violations must always return 404, never 403 (BR-11),** because Lab 2 does not reveal a ticket's existence to non-owners.

---

## 2. Planned Tests

| Test file | Layer | Target | Key scenarios |
|---|---|---|---|
| `create-ticket.api.test.ts` | Server | `POST /api/tickets` | 201 on valid body with `requestedPriorityId`; 400 for each of `summary`/`description`/`categoryId`/`relatedSystemId`/`requestedPriorityId` missing or out of range (BR-16–BR-18); 400 for inactive/unknown `categoryId` or `relatedSystemId`; 400 for unknown `requestedPriorityId`; response has `currentStatusId` set to the default (`New`) Status and `itPriorityId: null`; `ticketNumber` format matches BR-01; missing `X-Dev-Requester-Id` header rejected |
| `my-tickets.api.test.ts` | Server | `GET /api/tickets` | Returns only the requesting Requester's own Tickets; `search` matches ticket number and summary, case-insensitive partial (BR-12); `category`, `requestedPriorityId`, `currentStatusId` filters, individually and combined with AND logic (BR-13); default sort is `createdAt` desc with `ticketNumber` desc tiebreaker (BR-14); each `sortBy`/`sortDir` combination; invalid `page`/`pageSize` fall back to defaults rather than erroring (BR-15); pagination metadata (`page`, `pageSize`, `totalItems`, `totalPages`) is correct at page boundaries |
| `ticket-detail.api.test.ts` | Server | `GET /api/tickets/:ticketNumber` | 200 with full detail (including nested `attachments`) for an owned Ticket; 404 for a Ticket that doesn't exist; 404 (not 403) for a Ticket owned by a different Requester (BR-11) |
| `attachments.api.test.ts` | Server | `/api/tickets/:ticketNumber/attachments`, `/api/attachments/:id/download`, `/api/attachments/:id/remove` | 201 upload within limits; 415 for a disallowed file type by extension and by MIME (BR-22); 413 over 5 MB (BR-23); 422 on a 6th active attachment (BR-24); list returns both `ACTIVE` and `REMOVED` rows with `removalReason`/`removedAt` only on removed ones; download streams the file with correct `Content-Disposition` for an active attachment; download returns 404 for a `REMOVED` attachment (BR-27) and for a non-owned one; remove requires non-empty `reason` (400 otherwise, BR-26); remove on an already-removed attachment returns 409; all attachment endpoints return 404 (not 403) when the Ticket isn't owned by the caller |
| `CreateTicket.test.tsx` | Client | Create Ticket screen | Category/Related System/Priority selects populate from the reference endpoints; submit disabled until required fields are valid; inline field errors render for each BR-16–BR-18 violation returned by the API; successful submit navigates to/shows the new ticket; server-side 400 (e.g. unknown priority) surfaces as a form error rather than a crash |
| `MyTickets.test.tsx` | Client | My Tickets screen | Table/list renders returned tickets; search input debounces and triggers a re-fetch with the `search` param; category/priority/status filter controls each trigger a re-fetch with the matching param; column sort click toggles `sortBy`/`sortDir`; pagination controls trigger correct `page`/`pageSize`; empty-result state renders when `data` is `[]` |
| `RequesterTicketDetail.test.tsx` | Client | Ticket Detail screen | Renders all read-only ticket fields (summary, description, category, related system, requested priority, status); renders the attachment list with active vs. removed styling; attempting to open/download a removed attachment is disabled or hidden in the UI; not-found/not-owned (404) response renders a not-found state rather than an error boundary |

---

## 3. Test Commands

```bash
cd server
npm run test
```
```bash
cd client
npm run test
```