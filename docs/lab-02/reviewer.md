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
**Me:** Thank you very much all the document are now complete. You can now merge it.

## Pull Requests I reviewed 
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|  #16  | docs/lab2-spec-plan | Aprove |
|  #17  | feat/lab2-db-context| Aprove |
|  #18  | feature/6-create-ticket | Aprove |
|  #19  | feature/7-my-tickets | Aprove |
|  #20  | feature/8-ticket-detail-attachments | Aprove |
|  #21  | feature/9-e2e-release | Aprove |

### #16 docs/lab2-spec-plan
```
## Description
This PR introduces the Spec-Driven Development (Spec DD) and Test-Driven Development (Test DD) documentation required for Lab 2, Phase 1. It establishes the foundational engineering contract prior to any codebase implementation.

## Deliverables Completed
* **Specification:** Added `docs/lab-02/specification.md` containing the Sprint Goal, Scope, Functional Requirements (FR-01 to FR-07), Business Rules (BR-01 to BR-05), Acceptance Criteria, and the Definition of Done.
* **UI Rules:** Added `docs/lab-02/ui-spec.md` detailing the Zen Green theme color palette (`#006B3C`), responsive breakpoints (Desktop, Tablet, Mobile), and component states.
* **API Contract:** Added `docs/lab-02/api-spec.md` outlining the required REST endpoints, HTTP status codes, and error response handling.
* **Test Plan:** Added `docs/lab-02/tests.md` featuring the Planned-Test Table, acceptance-criterion traceability, and test strategy.

## Related Issue 
Related to #10

## Notes for Reviewer
Please ensure all 4 markdown files meet the Phase 1 documentation requirements. *(Note: I will capture the required timestamp screenshot of this PR before merging!)*
```
> **bravefe** requested changes

**bravefe:**
```
Thank you for the detailed PR description. Before I approve the work, could you please recheck `docs/lab-02/tests.md` in detail?

In particular, please verify that:

* The test cases and expected results are sufficiently detailed and accurately reflect the requirements and acceptance criteria.

Additionally, adding more detail to the specification file, where appropriate, would be welcome.

Once you have rechecked and confirmed these points, please let me know so I can proceed with the review and approval.
```

**SaintCrois:** Of course! Will look into that. Thank you.

**SaintCrois:** Hey! I have fixed the problem you've outlined. Please take a look!

> **bravefe** approved these changes

**bravefe** I’ve reviewed your changes, and they include the additional information discussed. If there are no further changes needed, I’ll proceed with merging the PR.

**SaintCrois:** Wait. I found a bit of flaw in test.md. Please wait until further notice.

**SaintCrois:** The problem had been solved. Please proceed with final review. Sorry for inconvenience.

> **bravefe** merged commit d440f25 into lab2-staging

### #17 feat/lab2-db-context
```
# What is it
- Aligns the database schema and seed data with the approved Phase 1 specification for Lab 2 (Issue 6).
- Corrects previous schema deviations before starting backend API development.
- Keeps the implementation within the defined Lab 2 scope.

# What changed
- Updated `server/prisma/schema.prisma` to match `specification.md`.
- Removed out-of-scope models:
  - `PublicComment`
  - `ServiceAction`
  - `EventLog`
- Renamed `ticketCode` → `ticketNumber`.
- Renamed `fileSizeBytes` → `fileSize`.
- Updated `server/prisma/seed.ts` to generate tickets using the required `TKT-2026-` prefix.
- Seeded the database with:
  - Active Requesters
  - Categories
  - Related Systems
  - 10 dummy tickets

# Testing
- [x] Ran `npx prisma migrate dev`
- [x] Ran `npx prisma db seed`
- [x] Ran `npx prisma generate`
- [x] Verified the generated TypeScript types.

# Related Issue
- Related to #11

# Notes for Reviewer
- Please verify that the Prisma schema matches the Phase 1 specification.
- Please verify that no out-of-scope models or fields were added.
- The database is now ready for the backend API implementation.
```
> **bravefe** approved these changes

**bravefe:**
```
Flawless work! All the data has been implemented correctly with the appropriate names and attributes. The only thing I noticed is that some of the dummy data looks oddly familiar. 😄

Other than that, there is nothing else that needs to be changed. Please let me know when you’re ready to merge the PR.
```

**SaintCrois:** Thank you! Hehe. Please proceed to merge this PR.

> **bravefe** merged commit 28e97a6 into lab2-staging 

### #18 feature/6-create-ticket
```
## Summary

Implemented Issue 7: Ticket creation API, UI, validation, and tests.

## Changes

- Added active Development Requester loading and selection/context handling.
- Added Create Ticket screen with:
  - Summary
  - Category
  - Related System
  - Requested Priority
  - Description
  - Attachments
- Implemented ticket creation through `POST /api/tickets`.
- Added backend ticket validation and requester ownership.
- Added backend-generated unique Ticket Numbers.
- Set newly created tickets to `New`.
- Added attachment validation for:
  - JPG
  - PNG
  - WEBP
  - PDF
  - Maximum 5 files
  - Maximum 5MB per file
- Added loading and duplicate-submission protection.
- Added success confirmation with generated Ticket Number.
- Added safe API/network error handling while preserving form values.
- Added/updated automated API and UI tests.

##Related Issue
Related to #12 

## Testing

### Client
- 9/9 tests passing

### Server
- 23/23 tests passing

### Total
- 32/32 tests passing
```
**bravefe:**
```
I’ve tested the ticket creation functionality, and it works as intended. The related `.test` files are also included, and all the tests are passing.
<img width="1366" height="741" alt="image" src="https://github.com/user-attachments/assets/437a8e07-f056-43a8-a1ab-e1d8e35b4389" />

Please let me know when you’re ready for me to merge it.
```
> **bravefe** approved these changes

**SaintCrois:** Thank you! Please proceed to merge this PR.

> **bravefe** merged commit d08016e into lab2-staging

### #19 feature/7-my-tickets
```
## Summary

Implemented Issue 8: My Tickets paginated list, search, filtering, sorting, and tests.

## Changes

### My Tickets API

Added My Tickets functionality for the currently selected Development Requester.

Added `GET /api/tickets` with:

- Pagination
- Search
- Status filtering
- Priority filtering
- Category filtering
- Related System filtering
- Sorting
- Pagination metadata

Enforced server-side requester ownership so Requesters only see their own tickets.

Added requester-context handling through `X-Requester-Id`.

### My Tickets React Screen

Added the My Tickets React screen with:

- Ticket list
- Search
- Filters
- Sorting
- Clear Filters
- Pagination controls
- Loading state
- Empty state
- No-results state

Added ticket selection/navigation from the My Tickets list.

Added a responsive ticket-list layout for desktop and mobile views.

### Automated API Tests

Added automated API tests covering:

- Requester ownership
- Search
- Filtering
- Sorting
- Pagination
- Multiple Requester data isolation

### Automated UI Tests

Added/updated automated UI tests covering:

- Ticket list rendering
- Search/filter behavior
- Clear Filters
- Pagination
- Loading state
- Empty/no-results states
- Requester-specific ticket visibility

### Regression Verification

Verified existing Create Ticket and Requester Selection functionality remains passing.

## Related Issue

Related to #13
```

> **bravefe** approved these changes

**bravefe:** I've seen that the my-ticket page have been add. There is nothing to be change.

**SaintCrois:** I'll assume you said there is no problem. If there is please comment. Else, please proceed to merge.

> **bravefe** bravefe merged commit 2a1edb6 into lab2-staging


### #20 feature/8-ticket-detail-attachments
```
## Summary

Implemented Issue 8: Ticket Detail read-only view and attachment lifecycle.

## Changes

### Ticket Detail API

Added ticket detail functionality for the currently selected Development Requester.

Added `GET /api/tickets/:id` with:

- Ticket number
- Summary
- Description
- Category
- Related System
- Requested Priority
- Current Status
- Created/updated timestamps
- Attachment metadata

Enforced server-side requester ownership so Requesters can only view tickets they own.

### Ticket Detail React Screen

Added the Ticket Detail navigation flow from My Tickets.

Added support for opening a selected ticket from the My Tickets list.

Kept the Ticket Detail view Requester-facing and read-only.

No IT Staff controls, comments, internal notes, or status-change controls were added.

### Attachment Lifecycle

Implemented attachment storage and lifecycle handling for existing tickets.

Added:

- Supporting attachment upload
- JPG/PNG/WEBP/PDF validation
- 5 MiB per-file limit
- Maximum 5 attachments per ticket
- Unique stored filenames
- Attachment download for active attachments
- Requester ownership enforcement
- Soft removal of attachments
- Required removal reason
- Removal metadata retention
- Download blocking after removal

Uploaded files are stored using generated filenames rather than the original filename.

### Automated API Tests

Added automated API tests covering:

- Ticket detail retrieval
- Requester ownership enforcement
- Attachment download
- Attachment ownership enforcement
- Required removal reason
- Soft removal
- Removal metadata
- Blocked downloads after removal

## Regression Verification

Verified the complete server test suite:

- 9 test files passed
- 31 tests passed

Verified the client production build successfully completes with TypeScript and Vite.

Existing Create Ticket, My Tickets, and Requester Selection functionality remains passing.

## Related Issue

Related to #14 
```
> **bravefe** requested changes

**bravefe:**
```
I’ve seen that the attachments have been implemented and that the API for reviewing tickets has also been added.

Before I merge the PR, I have a few confirmation questions. Some of these are also related to issues from the past that I noticed while testing this branch myself.

For the **My Tickets** page, should each ticket display additional information, considering that the API already provides fields such as **status** and **createdAt**? For example, should the ticket card/list item also show the current status and creation date?

**Recommendation / Thought:**
Would it be better for each major page to have its own dedicated route/address? For example:

* `/create` — Create Ticket
* `/tickets` — My Tickets
* `/ticket/:id` — Ticket Details

I think having separate routes would make the pages easier to navigate, bookmark, and maintain as the application grows.
```
**SaintCrois:** Thank you for your comments. The three suggestions will be implement in next issue as planned. If there are more suggestions you would like to make, please do so. If not, then please proceed to merge this request.

**bravefe:** Ok, very nice. I shall now merge this PR.

> **bravefe** merged commit a91306c into lab2-staging

### #21 feature/9-e2e-release
```
## Summary of Changes

This Pull Request completes **Issue 10: E2E tests, visual inspection, and release integration** for Lab 2 (TokTickIT Requester Ticketing MVP).

Key highlights:
1. **Full Playwright E2E Coverage**: Implemented end-to-end test suites in `e2e/lab-02/requester-ticket-flow.spec.ts` covering:
   - Development Requester selection and context switching.
   - Ticket creation, category/system/priority dropdown loading, and field-level validation errors.
   - Attachment lifecycle: file format/size checks, uploading on creation and in detail view, active attachment downloading, and soft removal with reason.
   - My Tickets search by ticket number, filtering (category, priority, status), sorting, and empty/no-results  @states.
   - Requester data isolation and cross-requester unauthorized access rejection (403).
   - API failure simulation with entered form data preserved.
2. **Multi-Viewport & Responsive Testing**:
   - Configured and verified tests across **Desktop (1280x720)**, **Tablet (800x1000)**, and **Mobile (390x844)** viewports.
3. **Automated Screenshot Artifacts**:
   - Automated generation of all 23 required PNG screenshots under `artifacts/lab-02/screenshots/` across `create-ticket/`, `my-tickets/`, and `ticket-detail/`.
4. **Accessible Form Controls**:
   - Added accessible `id` and `htmlFor` attributes to read-only fields on `TicketDetail.tsx` conforming to the UI specification.
5. **Lab 2 Documentation Deliverables**:
   - `docs/lab-02/ui-spec.md`: Completed Zen Green design tokens and full visual inspection checklist.
   - `docs/lab-02/tests.md`: Updated test plan, commands, and passing traceability matrix.
   - `docs/lab-02/reviewer.md`: Documented peer review records for PRs #10 through #15.
   - `docs/lab-02/ai-use.md`: Recorded selected AI prompt logs (1–9) and reflection.

---

## Acceptance Criteria Checklist

- [x] **Playwright E2E Multi-Viewport**: Tests execute complete lifecycle across desktop, tablet, and mobile projects.
- [x] **Screenshots Captured**: All required screenshots generated and saved in `artifacts/lab-02/screenshots/`.
- [x] **Visual Inspection Checklist**: Completed checklist in `ui-spec.md` confirming Zen Green theme alignment, no clipping, and responsive behavior.
- [x] **Reviewer Record**: Complete review logs, PR links, comments, and approvals in `docs/lab-02/reviewer.md`.
- [x] **AI Use & Reflection**: 6–10 selected prompts and reflection in `docs/lab-02/ai-use.md`.
- [x] **All Automated Tests Pass**: All unit, API, UI, and E2E tests pass from documented commands.

## Related Issue
Related to #15 

---

## Verification & Test Results

### 1. Playwright E2E Suite (9/9 passed)
```bash
npx playwright test e2e/lab-02/requester-ticket-flow.spec.ts --config=client/playwright.config.ts --workers=1
```
> **bravefe** approved these changes

**bravefe:** 
```
Everything is included according to the lab sheet. The website artifact and the E2E testing are also included. It seems you decided to include the page route/address as well, which is fine since it isn’t required for the lab.

The document is complete. In my opinion, I would have included a bit more back-and-forth communication regarding some of the issues in reviewer.md, but apart from that, your project is ready to be submitted.

Please let me know when you’re ready to merge.
```

**SaintCrois:** Thank you! Please proceed to merge.

> **bravefe** merged commit 6c6e69f into lab2-staging