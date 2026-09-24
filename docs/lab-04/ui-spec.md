# TokTickIT — Lab 3 UI Specification

All screens extend the Zen Green design language and component set established in Lab 2 (primary
green action buttons, card surfaces, pill-shaped status/priority/role badges, consistent field
and validation-message placement, focus rings, and spacing scale). No new visual system is
introduced in Lab 3 — new screens reuse existing tokens and components wherever the design
matches, and only add new components where Lab 2 has no equivalent (e.g. tabbed Comments/Notes
panel, role-aware nav).

## 1. Application Shell

**Applies to:** all authenticated screens.

- Top bar: product mark ("TikTockIT"), primary nav, and a right-aligned **Profile** menu.
- Primary nav is role-conditional and rendered from the authenticated user's role, never from a
  client-side guess:
  - Requester: **My Tickets**, **Create Ticket**.
  - IT Staff: **My Queue** (default view = full queue, "My Queue" label kept for continuity with
    the reference mockup), no Create Ticket entry.
  - Administrator: **Admin** (User Management). No ticket-facing nav item (Assumption A-1).
- Profile menu: current user's name and role badge,  **Logout**.
- Logout immediately clears local UI state and redirects to Login; any in-flight request that
  returns `401` also forces this redirect (session-expiry handling), showing a one-line "Your
  session has ended. Please sign in again." banner on the Login screen.
- A user who manually navigates (URL bar) to a route their role doesn't permit sees the same
  **Forbidden** empty state described in §7.4, not a silent redirect that hides the fact they were
  blocked — the UI does not pretend the destination doesn't exist, it says access is not
  permitted, consistent with server behavior (401 vs 403 are visually distinct: 401 → back to
  Login; 403 → Forbidden state with a link back to the user's own home screen).

## 2. Login

**Route:** `/login` · **Mode:** single form, no create/edit distinction.

Controls:
- Email field (text input, required, inline validation on blur for format).
- Password field (masked, with a show/hide toggle icon).
- **Sign In** primary button — full width, disabled while a request is in flight and shows a
  busy state on the button label ("Signing In…") rather than a separate spinner overlay.
- "Forgot your password?" link — **rendered but disabled/inert with a tooltip** ("Contact an
  administrator") in Lab 3, since password-reset email is explicitly out of scope; the control
  exists in the Zen Green shell so the layout matches the approved mockup without implying a
  feature that doesn't exist.

Feedback states:
- **Validation:** empty email/password blocks submission with inline field messages; no request
  is sent.
- **Invalid credentials:** red inline banner above the form — "Invalid email or password. Please
  try again." Fields are not cleared; password field is re-masked.
- **Inactive account:** same banner position, distinct copy — "This account is inactive. Contact
  an administrator." (AC-06).
- **Success:** on `200`, redirect immediately — to `/change-password` if `mustChangePassword` is
  true, otherwise to the role's home screen (My Tickets / My Queue / Admin).
- **Unexpected failure:** generic banner — "Something went wrong. Please try again." — no error
  code or stack detail shown.

## 3. Change Password (Mandatory)

**Route:** `/change-password` · Reachable only when `mustChangePassword` is true; a direct visit
by a user who does *not* need it redirects to their home screen.

Controls:
- Current (temporary) password (masked, show/hide).
- New password (masked, show/hide).
- Confirm new password (masked, show/hide).
- Live password-rules checklist below the fields (≥8 characters, upper + lower case, a number, a
  special character) — each rule shows a check/cross as the user types, matching the reference
  mockup.
- **Continue** primary button, disabled until all rules pass and confirm matches new password.

Feedback states:
- **Validation:** confirm-mismatch and unmet rules block submission inline; no request sent for a
  client-detectable failure.
- **Current password incorrect:** inline banner — "Current password is incorrect."
- **Success:** on `200`, proceed straight into the application shell at the role's home screen; no
  extra confirmation modal (matches "successful continuation into the application" requirement).
- **Unexpected failure:** generic safe-failure banner, form remains editable, values are not lost
  from the New/Confirm fields (avoid making the user retype the parts they already validated).

This same field set (minus the checklist framing) is reused as a smaller **Change Password**
panel from the Profile menu for voluntary changes; it calls the same endpoint and behaves the
same on error, but on success shows an inline toast ("Password updated.") and stays on the
current screen rather than redirecting.

## 4. Requester — My Tickets / Create Ticket

Carried over from Lab 2 with two changes only:

1. The Development Requester selector and "Change Requester" action are removed entirely — the
   header now shows the authenticated user's name and role badge instead.
2. All list/detail data is implicitly scoped to the authenticated Requester; there is no
   requester-picker anywhere in this flow.

No other layout, control, or feedback-state changes from Lab 2 are introduced here; see Lab 2
`ui-spec.md` for the full My Tickets list and Create Ticket form definitions.

## 5. Requester Ticket Detail

**Route:** `/tickets/:id` (Requester) · **Mode:** view, with two additive interactive regions.

Layout (top to bottom): the existing Lab 2 read-only ticket header/detail fields (Ticket No.,
Category, Related System, Requested Priority, Current Status, Summary, Description), unchanged;
then a tab bar: **Public Comments / Attachments / Service Actions / Event Log** (Service Actions
and Event Log remain placeholder tabs, unchanged from Lab 2).

New in Lab 3:
- **Public Comments tab** (now functional, was a placeholder in Lab 2):
  - Chronological list, oldest first, each entry showing author name, a role badge ("Requester" /
    "IT Support"), timestamp, and content.
  - "Add Public Comment" text area + **Post Comment** button at the top of the tab (matches the
    reference layout), disabled while empty or while submitting.
  - Empty state: "No comments yet." when the list is empty.
- **"Problem Appears Resolved" action:** a secondary button near the status/priority summary,
  visible only while status is Open, In Progress, or Waiting for Requester (BR-22), and only to
  the ticket's own Requester. Clicking opens a small confirmation ("Let IT Support know this looks
  fixed? They'll still need to formally close the ticket.") before submitting, since it's a
  one-way flag per ticket state (can't be un-set by the Requester). Once set, the button is
  replaced by a small "You marked this as appearing resolved" inline note with a checkmark icon.

Feedback states: loading skeleton on first load; forbidden state (see §7.4) if the ticket is not
the user's own and somehow reached directly; safe-failure banner on comment-post or
resolution-flag failure, with the entered comment text preserved so nothing is lost.

## 6. IT Staff Ticket Queue

**Route:** `/queue` · **Mode:** list only (no create/edit here).

Desktop layout (≥1024px): a data table matching the reference mockup —

| Column | Notes |
|---|---|
| Ticket No. | Sortable; links to Ticket Detail. |
| Created Date | Sortable. |
| Summary | Truncates with ellipsis at one line; full text on hover/focus title. |
| Category | Badge/plain text, not sortable. |
| Req. Priority | Colored priority badge (Low/Medium/High). |
| IT Priority | Colored priority badge, editable inline is **not** offered in the queue — priority
  editing happens in Ticket Detail only, to keep the queue read-focused. |
| Status | Colored status badge; sortable. |
| Owner | Avatar-style initials + name, or "Unassigned" in muted text; sortable. |

Above the table: search input ("Search by ticket number or summary…") and a **Filters** control
that opens status / category / priority / owner filter fields (dropdowns/checkboxes) — collapsed
by default to avoid the "unreadable mega-grid" the handout warns against. A result-count line
("Showing 1 to 10 of 87 tickets") sits between search and table. Pagination controls at the
bottom (Previous / page numbers / Next), matching the mockup.

Smaller-screen representation (<1024px): the table collapses into a stacked card list, one card
per ticket — Ticket No. + Status badge on the first line, Summary as the card title, then a
compact row of Category / Req. Priority / IT Priority / Owner as small labeled chips, tapping the
card opens Ticket Detail. Search, Filters, and pagination remain visible above/below the card
list in the same order as desktop.

Feedback states:
- **Loading:** skeleton rows/cards on first load and on filter/sort/page change.
- **Empty (zero tickets exist at all):** centered illustration-free message — "No tickets in the
  queue yet."
- **No results (filters/search matched nothing):** distinct copy — "No tickets match your search
  or filters." with a **Clear filters** action.
- **Forbidden:** a Requester reaching this route directly sees the shell's Forbidden state
  (§7.4), not a queue with no data.
- **Failure:** safe-failure banner with a **Retry** button; current filter/search/page state is
  preserved so retry doesn't reset the user's work.

## 7. IT Staff Ticket Detail

**Route:** `/queue/:id` · **Mode:** view, with permitted fields editable inline.

Layout (matches reference mockup): a "My Queue > Ticket Detail" breadcrumb with a **Back to
Queue** link; then a field grid —

- Read-only: Ticket No., Category, Related System, Requester, Requested Priority, Summary,
  Description.
- Editable: **Ticket Owner** (dropdown of active IT Staff/Administrator users, plus
  "Unassigned"/"Claim for me" shortcut when unassigned), **IT Priority** (dropdown), **Current
  Status** (dropdown constrained to the transitions legal from the current status per
  `specification.md` §6.1 — illegal targets are not shown as options rather than shown-then-
  rejected, though the server remains the authority per BR-19).
- **Resolution Summary** field: editable text area, visible/required contextually when moving
  status to Resolved; shown read-only ("visible to requester") once set.

Below the fields, a tab bar: **Public Comments / Internal Notes / Attachments / Service Actions**
(Service Actions remains a placeholder in Lab 3, per exclusion list) with counts in each tab
label, matching the mockup (e.g. "Public Comments (3)").

- **Public Comments tab:** same list/compose UI as §5, available to IT Staff/Administrator, posts
  attributed to the staff member with an "IT Support" role badge.
- **Internal Notes tab:** visually distinct from Public Comments — a different background tint
  and a small "Internal — not visible to Requester" label pinned above the compose box, so staff
  cannot mistake which box they're typing into (handout requirement: notes and comments must be
  visually distinct so private information isn't accidentally posted publicly). Same list/compose
  interaction pattern otherwise (chronological, author, timestamp, empty state, append-only).
- **Attachments tab:** unchanged from Lab 2/Requester view, read access for staff (upload
  permissions for staff are out of scope beyond what Lab 2 already allows for the ticket).

Status-change confirmation: selecting **Resolved** or **Cancelled** opens a confirmation dialog
before submitting (destructive/finalizing actions, per `specification.md` §6.1); other transitions
apply immediately with an inline success toast ("Status updated to In Progress.").

Feedback states: loading skeleton on first load; inline validation for Resolution Summary when
required; safe-failure banner per field group (owner/priority/status changes fail independently —
a failed status change does not roll back an already-saved owner change); `409` transition
conflicts show the specific message returned by the API (e.g. "That status change isn't allowed
from In Progress.") rather than a generic error, since the message itself is safe to display.

## 8. Administrator — User Management

**Route:** `/admin/users` · **Modes:** list (default), create (side panel), edit (side panel).

Layout (matches reference mockup): left region is the **Users** list —

- Header row: "Users" title + **Create User** primary button (top right).
- Search input ("Search users…") + **Filters** control (role filter only, per exclusion of
  multiple simultaneous filters and multi-column sort).
- Table: Name, Role (badge), Status (Active/Inactive badge), Edit action (icon/button per row).
  No pagination is required (handout exclusion), but if the list grows long in seeded data the
  table simply scrolls within the panel rather than paginating.

Right region (opens as a slide-over panel, matching the mockup) — **Create New User** / **Edit
User**, same form shape for both modes:

- Full Name (required text).
- Email Address (required, validated format; server is authoritative for uniqueness — see
  Feedback below).
- Role (required select: Requester / IT Staff / Administrator).
- Active (toggle, default **on** for new users).
- **Initial Password** (create mode only): a password field with the same live rules checklist
  as §3; the mockup's "Send password reset email" checkbox is **not implemented** in Lab 3 (email
  delivery is explicitly excluded) — the panel instead always displays a static note, "The user
  will sign in with this password and must change it immediately," replacing that checkbox.
- **Save User** primary button.
- In edit mode only, below Save: a **Reset Password** secondary action (opens a small inline
  field to set a new initial password without leaving the panel) and a **Deactivate
  User**/**Activate User** toggle-style secondary button reflecting the account's current state,
  styled as destructive (red outline) only when it would deactivate the account.
- **Cancel** closes the panel without saving; unsaved edits are discarded without a confirmation
  prompt in Lab 3 (kept minimalist per the handout's "intentionally simple" instruction).

Feedback states:
- **Validation:** required-field and format errors inline, matching Lab 2 field-error styling.
- **Duplicate email:** inline error directly under the Email field — "A user with this email
  already exists." (surfaced from the `409 DUPLICATE_EMAIL` response, not a generic banner, since
  it's actionable at the field level).
- **Self-deactivation blocked:** the Active toggle for the currently-logged-in Administrator's own
  row is disabled with a tooltip ("You can't deactivate your own account") as a UI convenience;
  the server rejection (`409 SELF_DEACTIVATION`) is still the enforced control if bypassed.
- **Last-Administrator rule:** if a save would remove the last active Administrator, the panel
  shows the server's `409 LAST_ADMIN` message inline above the Save button rather than closing the
  panel, so the Administrator can adjust and retry.
- **Success:** panel closes, list refreshes, and a toast confirms ("User created." / "User
  updated." / "Password reset — user must change it at next login.").
- **Forbidden:** a non-Administrator reaching `/admin/users` directly sees the shell's Forbidden
  state (§7.4).
- **Empty/no-results:** "No users match your search." with a **Clear search** action when a
  search/filter yields nothing; the unfiltered list is never empty because seed data guarantees at
  least one Administrator.

## 9. Shared Component Notes

- **Badges:** role, status, and priority each use a fixed color mapping consistent with Lab 2's
  badge component — Requester/IT Staff/Administrator role badges are visually distinct from
  status and priority badges (different shape/weight) so the three badge families are never
  confused at a glance, per the reference screenshots.
- **Editable vs. read-only styling:** unchanged from Lab 2 — read-only fields keep the muted
  background/border treatment; editable controls keep the standard input/select styling. Lab 3
  introduces no new visual state for this, only new fields that must be correctly categorized
  (see §7).
- **Buttons:** primary (solid green) for the single main action per screen/panel; secondary
  (outline) for supporting actions; destructive styling (red outline/text) reserved for
  deactivation and cancel/void-style actions, matching Lab 2 convention.

## 10. Responsive & Accessibility Requirements

Same baseline as Lab 2:

- Breakpoints: mobile (<768px), tablet (768–1023px), desktop (≥1024px).
- All interactive controls reachable by keyboard in a logical tab order; visible focus rings on
  every control (buttons, links, form fields, table row actions).
- Sufficient color contrast on all badges and status colors at both light backgrounds used in
  this theme.
- No horizontal scrolling introduced by any new screen at any breakpoint; the Queue table's
  collapse to cards (§6) and the Admin panel's slide-over becoming a full-screen sheet on mobile
  are the two required adaptations beyond Lab 2's existing patterns.
- Form errors are associated with their field (not only color) so they're announced by assistive
  technology, consistent with Lab 2's validation pattern.

## 11. Cross-Screen Feedback Vocabulary

To keep behavior predictable, every screen in this document reuses this fixed vocabulary rather
than inventing per-screen wording styles:

| State | Presentation |
|---|---|
| Loading | Skeleton placeholders in the shape of the content being loaded (never a blank screen). |
| Validation | Inline, field-adjacent message; blocks submission client-side when detectable before a request. |
| Success | Inline toast or in-place state change; no full-page reload. |
| Empty | Centered short message, no icon required, matching Lab 2's empty-state copy tone. |
| No results | Distinct from Empty; always paired with a way to clear the search/filter that caused it. |
| Forbidden (§7.4) | Full-panel message: "You don't have access to this page." + link back to the user's home screen. Used only for role-based access denial, never for ownership-based denial (which instead reads "not found" per §7.3 of `api-spec.md` to avoid confirming existence). |
| Not found | "This ticket/user could not be found." |
| Conflict | The server's specific, safe message (e.g. duplicate email, illegal transition) shown inline near the relevant control. |
| Unexpected failure | Generic "Something went wrong. Please try again." + Retry where applicable; never exposes error codes/stack traces. |