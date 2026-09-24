# TokTickIT — Sprint 4 UI Specification

Extends the Lab 2/3 Zen Green system. Reuses existing card, table, badge, button, form, tab,
loading, empty, error, and modal conventions — no new visual language is introduced.

## 1. Navigation

| Role | Nav items |
|---|---|
| Requester | Dashboard · My Tickets · Create Ticket · Profile |
| IT Staff | Dashboard · Ticket Queue · Create Ticket · Profile |
| Administrator | Dashboard · Ticket Queue · Create Ticket · Users · Profile |

`Dashboard` is added as a new route (`/dashboard`) for every role, with clear active-page styling
matching the existing nav convention. It becomes the default post-login landing page.

## 2. IT Staff Dashboard (`/dashboard`, staff/admin)

**Header:** "Welcome back, {firstName}!" + a manual Refresh action.

**Metric cards** (responsive grid: 6 cols desktop → 3×2 tablet → 1 col mobile), each with a label,
a value, and a click target that drills into the Ticket Queue pre-filtered accordingly:

| Card | Drill-down filter |
|---|---|
| Unassigned | status not in {Closed, Cancelled}, no Owner |
| My Assigned | Owner = current user, status not in {Closed, Cancelled} |
| New | status = New |
| Open | status = Open |
| In Progress | status = In Progress |
| Waiting for Requester | status = Waiting for Requester |

**By IT Priority** — a compact 4-row list (Low/Medium/High/Urgent) with count + drill-down,
placed below the metric cards, satisfying the "Tickets by status or IT Priority" requirement
without duplicating the six cards above.

**My Recent Tickets** — up to 5 rows (id, short title, status badge, last-updated time), "View all"
link to Ticket Queue. Each row opens Ticket Detail.

**Quick Actions** panel — Create Ticket, Search Tickets, My Queue (same as the reference mockup).

**States:**
- *Loading:* skeleton cards + skeleton list rows (existing loading convention).
- *Empty:* a card showing `0` is a valid, expected state — never hidden or replaced with an error.
- *Forbidden:* not applicable at the page level (route requires IT Staff/Administrator); a card
  never renders data the user isn't authorized to see.
- *Safe failure:* if the dashboard endpoint errors, show the existing inline error banner with a
  Retry action; do not blank the whole page.

## 3. Requester Dashboard (`/dashboard`, requester)

**Header:** "Welcome, {firstName}!"

**Metric cards** (4, responsive grid: 4 cols desktop → 2×2 tablet → 1 col mobile):

| Card | Meaning | Drill-down filter |
|---|---|---|
| Total Open | status in {New, Open, In Progress, Waiting for Requester, Reopened} | those statuses, Requester = me |
| Waiting for You | status = Waiting for Requester | that status, Requester = me |
| Recently Resolved | status = Resolved | that status, Requester = me |
| Closed | status = Closed | that status, Requester = me |

**My Recent Tickets** — up to 5 rows, "View all" → My Tickets. **Quick Actions** — Create Ticket,
View My Tickets.

**States:** same conventions as §2. Ownership is enforced server-side (BR-14); the UI never
supplies or trusts a client-side requester filter.

## 4. Actions Taken (Ticket Detail → "Service Actions" tab)

This fills in the tab that Lab 3 left as a placeholder on the existing tab bar (Public Comments /
Attachments / Service Actions / Event Log).

### 4.1 List view
Table (stacks to cards on mobile, matching the existing Ticket-list responsive pattern), newest
first:

| Column | Notes |
|---|---|
| Action Date/Time | localized display |
| Description | truncated with "show more" |
| Result | badge, color **and** text label (non-color cue) |
| Follow-up | icon + "Required"/"—" |
| Performed By | display name |
| Edit | IT Staff/Administrator only; hidden entirely for Requesters (backend also blocks) |

**Empty state:** "No actions recorded yet for this ticket." Plus, for IT Staff/Administrator only,
an "Add Action" button. Requesters never see the Add Action control.

### 4.2 Create / edit form
An accessible modal dialog (`role="dialog"`, `aria-modal="true"`, labelled by its heading, focus
trapped inside while open, `Esc` closes it, focus returns to the triggering control on close,
background does not scroll).

| Field | Control | Rule |
|---|---|---|
| Action Date/Time | `datetime-local`, defaults to now | BR-06 bounds enforced client + server |
| Description | textarea, required | BR-05 |
| Result | select, required, populated from `GET /api/reference/action-results` | — |
| Follow-Up Required | toggle/checkbox | — |
| Follow-up Note | textarea, shown + required only when Follow-Up Required is on | BR-04, inline error if missing |
| Attachment Notes | text input, optional | placeholder: "e.g., see screenshot_2026.png" |

Submit button disables immediately on click and stays disabled until the request resolves
(prevents double-submit, AC-13). Validation errors render inline, next to the field, not only in a
banner. On `409 Conflict` (stale edit), show the existing conflict banner and offer to reload the
current values.

## 5. Ticket Workflow controls (Ticket Detail)

A status control shows only the transitions permitted for the current status **and** the current
user's role (per the matrix in `specification.md` §5.2). If `Resolved` isn't yet reachable because
the BR-07 gate isn't met, the option is visible-but-disabled with a one-line reason: "Add an Action
Taken with Result = Resolved before resolving this ticket." The backend is still the final
authority — every transition request is re-validated server-side regardless of what the UI offered.
A successful transition refreshes the Ticket summary status without a full page reload.

Reopen controls on a `Cancelled`/`Closed` Ticket are visible only to Administrators (AC-12); IT
Staff see the Ticket as read-only-for-status in that state.

## 6. Responsive rules

- Dashboards: card grids collapse per the breakpoints in §2/§3; no card is ever clipped or
  overlapped.
- Actions Taken table → stacked cards on mobile, same pattern as the existing Ticket list.
- No screen introduces horizontal page scrolling at any breakpoint; wide content (e.g. long
  descriptions) wraps or truncates with expand, never forces overflow.

## 7. Accessibility checklist (applies to every new screen)

- [ ] Visible focus indicator on every interactive element.
- [ ] Full keyboard operability: Tab order follows visual order; Enter/Space activate buttons and
      cards; Escape closes the Action Taken modal.
- [ ] Semantic labels: icon-only buttons (Refresh, Edit) have `aria-label`; form fields have
      associated `<label>`s; the conditional Follow-up Note field is announced via
      `aria-describedby` when required.
- [ ] Non-color status cues: every status/result badge pairs color with a text label or icon.
- [ ] Modal dialog: `role="dialog"`, `aria-modal`, labelled, focus-trapped, Esc-to-close,
      focus-restore on close.
- [ ] No clipped content, no overlapping controls, no horizontal page scroll at desktop/tablet/
      mobile widths.
- [ ] Loading, empty, forbidden, and safe-failure states are present and visually distinct on
      every new screen, reusing the existing components from Labs 2–3.  