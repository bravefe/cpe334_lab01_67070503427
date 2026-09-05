# Lab 2 — Peer Review Record 

**Author:** Patcharak Plipat — 67070503427 — bravefe
**Peer reviewer:** Punnapob Wirojwongchai — 67070503425 — SaintCrois
## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|  #23  | feature/5-specification | Aprove |
|  #25  | feature/6-database| Aprove |
|  #30, #31, #32  | feature/7-ticket-2 | Aprove |
|  #33  | feature/8-create-ticket | Aprove |
|  #34  | feature/9-attachment | Aprove |

### #23 feature/5-specification
```
## Issue 5 — Specification
## Acceptance Criteria
- [x] Include specification.md file with topic as folow: 
   - [x] Sprint Goal  
   - [x] Stakeholder Request 
   - [x] Scope
   - [x] Function Requirements
   - [x] Business Rule
   - [x] UI Specification Summary
   - [x] Data Changes
   - [x] API Contract
   - [x] Aceptance Criteria
   - [x] Definition of Done
   - [x] Assumptions and Decisions
 - [x] Add reviewer.md
 - [x] Add ai-use.md
 - [x] Add api-spec.md
 - [x] Add test.md
 - [x] Add ui-spec.md
```
> **SaintCrois** requested changes

**SaintCrois:**
```
Hey! I see you have done a nice work there. I saw some inconsistency, but it is no major issue. Here are the details.

- docs/lab-02/ui-spec.md — §5 My Tickets: includes IT Priority and Ticket Owner even though they're excluded from Lab 2.
- docs/lab-02/ui-spec.md — §6 Ticket Detail: includes Public Comments, Service Actions, Event Log, and Resolution Summary even though they're out of scope.
- docs/lab-02/test.md — §1 Test Strategy: says E2E is out of scope, but specification.md §10.1 requires E2E tests.
- docs/lab-02/specification.md — §7.1 Status: status values differ from the earlier required status definition; confirm which set is correct.
```
**Me:** Nice catch. Thank you for your thorough and in-depth review. I will proceed to edit my specification.md file.

**Me:**
```
I have made further changes to `test.md`, including additional test cases as well as coverage for E2E and unit testing.

Additionally:

* `itPriority` has been removed from both the API and UI but will still remain in database for future implementation.
* Public comments, service actions, and event logs have been removed from the API for the current implementation, but their UI components will remain in place for future implementation.
Thankyou for your understanding.

For `docs/lab-02/specification.md`, I have also rechecked the current database tables and confirmed that the structure is correct.

Please review these changes as well and let me know if everything is clear and ready to merge.
```
> **SaintCrois** approved these changes

**SaintCrois:** Very good! Everything is cleared. I'll proceed to merge now.

**Me:** Please use squash merge for this issue due to confusing commit timeline.

**SaintCrois:** Sure!

> **SaintCrois** merged commit 7311dce into lab2-staging

### #25 feature/6-database
```
## Database

Updates the Prisma schema and seed data to support the ticketing system.

### Files Changed

* `server/prisma/schema.prisma`

  * Added `Priority`, `Status`, `DevRequester`, `RelatedSystem`, `Ticket`, `Attachment`, `PublicComment`, `ServiceAction`, and `EventLog` models.
  * Added relationships, indexes, and `AttachmentStatus`.
  * Changed `Category.createdAt` to `Category.isActive`.

* `server/prisma/seed.ts`

  * Added seed data for categories, systems, priorities, statuses, and requesters.
  * Added 10 sample tickets.
  * Uses `upsert` to keep seeding idempotent.

### Please check

* Prisma relationships and foreign keys are correct.
* Required/optional fields and defaults match the requirements.
* `Category.createdAt` → `isActive` migration is intentional.
* Seed data matches the expected categories, priorities, statuses, and systems.
* Running the seed multiple times does not create duplicates.
* Sample tickets are created with valid foreign-key references.
```
> **SaintCrois** requested changes

**SaintCrois:**
```
Hey, Great job! I spot some of the explicitly excluded functions included here.

- server/prisma/schema.prisma remove PublicComment, ServiceAction, and EventLog models because collaboration features are explicitly excluded from Lab 2 scope.
- server/prisma/schema.prisma rename ticketCode to ticketNumber and fileSizeBytes to fileSize because the code must exactly match the approved Phase 1 specification fields.
- server/prisma/seed.ts change the generated ticket prefix from TK-2026- to TKT-2026- because FR-02 strictly mandates the TKT-YYYY-###### format.

Please check. I may be wrong.
```
**Me:**
```
After reconsidering the changes, I’ve made the following updates:

* Removed the `PublicComment`, `ServiceAction`, and `EventLog` models/databases entirely.
* Renamed `ticketCode` to `ticketNumber` and `fileSizeBytes` to `fileSize` in `schema.prisma`.
* Updated `server/prisma/seed.ts` to change the generated ticket prefix from `TK-2026-` to `TKT-2026-` (`TKT-YYYY-######`).

Please have another look when you have a chance. If you have any further concerns or suggestions, please let me know. Otherwise, if everything looks good, tell me when it is ready to merge. Thank you!
```
**SaintCrois:** 
```
Great! I see you had fixed most of the issues. Unfortunately, there a just a little bit more than we can make this perfect.

1. Attachment Status Type Mismatch: It looks like Attachment.status was changed from an Enum (ACTIVE, REMOVED) to a boolean (isActive). The Phase 1 spec strictly requires an Enum so we can add future states (like QUARANTINED or ARCHIVED) without breaking the database.
2. ​Doc Contradiction: The update to specification.md created a self-contradiction where section 6 now literally states "attachment.isActive is an enum... rather than a boolean".
I may be wrong! If you feels like these are incorrect or unnecessary you can always inform me.
```
**Me:**
```
Thank you for the detailed review. I’ve made the requested changes by restoring `Attachment.status` as an Enum with `ACTIVE` and `REMOVED`, and I’ve also corrected the contradiction in `specification.md` regarding `attachment.isActive`.

I also made some further improvements to the seed data to make it more realistic.

Plese recheck and tell me when it's ready to merge.
```
> **SaintCrois** approved these changes 

**SaintCrois:** Hey! I see you've done a Grape job! Please tell me when you are ready to merge this PR.

> **SaintCrois** merged commit 3b9ce05 into lab2-staging

### #30, #31, #32 feature/7-ticket
#### #30
```
## Overview

This PR implements the **My Tickets** menu and the **Requester** menu for the ticket system.

## My Tickets Menu

The **My Tickets** menu allows a requester to view and manage only the tickets that belong to them.

### API Tests

The following tests were added and passed:

* **API-16:** Returns only tickets owned by the requester.
* **API-17:** Returns only tickets matching the search text.
* **API-18:** Returns only tickets matching all selected filters.
* **API-19:** Reverses ticket order when `sortDir` is toggled.
* **API-20:** Returns the next set of tickets when moving to the next page.
* **API-21:** Falls back to default pagination for invalid values.

## Requester Menu

The **Requester** menu allows users to select a requester when working with requester-related ticket information.

### Tests

* My Tickets API: **7/7 passed**
```
> **SaintCrois** approved these changes 

**SaintCrois:**
```
Good work! It is amazing to see a lot of commits before you finally settle with this version. Shows how much effort you've put into this work. 

After reviewing, I see no wrong with your code. It seems to align with what you've written in description and issue.

**Approved**`
```

**Me:** Thankyou for the review, plese merge my pull request and I will then continue on the next issue.

> **SaintCrois** merged commit 7422434 into main

#### #31 Revert Change of #30

**Me:** Plese Aprove and Revert my change to main

**SaintCrois:**Alright!

> **SaintCrois** approved these changes 

> **SaintCrois** merged commit 7422434 into main (revert-30-feature/7-ticket-2)

#### #32
> **SaintCrois** approved these changes 

**SaintCrois:**
```
Good work! It is amazing to see a lot of commits before you finally settle with this version. Shows how much effort you've put into this work.

After reviewing, I see no wrong with your code. It seems to align with what you've written in description and issue.

**Approved**
```
> **SaintCrois** merged commit 10d06ec into lab2-staging

### #33 feature/8-create-ticket
```
## Issue 8 — Create Ticket & Ticket Detail

Implemented the API and pages for:

* `/create-ticket`
* `/ticket/:ticketNumber`

Added API tests for ticket creation, validation, ticket detail, and cross-requester access protection.

### Tests

* Create Ticket API: **6/6 passed**
* Ticket Detail API: **2/2 passed**
```
> **SaintCrois** approved these changes 

**SaintCrois:** After reviewing I see you have done a great job. Please tell me when you are ready to merge.

**Me:** Thank you very much plese proceed to merge.

> **SaintCrois** merged commit 8f70fc8 into lab2-staging

### #34 feature/9-attachment
```
## Issue 9 — Attachments

Implemented the attachment lifecycle:

* Upload validation
* File size/type restrictions
* Active attachment limit
* Attachment listing
* Download
* Soft removal with removal reason
* Ownership protection

### Tests

* Attachment API: **11/11 passed**
* Attachment UI: **3/3 passed**
* Ticket Detail Attachment UI: **2/2 passed**
* Create Ticket UI: **9/9 passed**
* My Tickets UI: **3/3 passed**
* E2E Attachment lifecycle: **passed**
```
> **SaintCrois** approved these changes 
```
I checked the PR. The attachment functionality and related tests appear to be implemented, including the client attachment test and ticket/requester detail tests.

Make sure that your tests pass. That's all. Great job.
Notify me when you want to merge.
```