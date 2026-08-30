# TokTickIT — UI Specification (Lab 2)

## 1. Design Tokens

### 1.1 Color
| Token | Hex | Usage |
|---|---|---|
| Primary green | #006B3C | Primary buttons, links, active nav, focus ring |
| Secondary green | #0B7A46 | Hover states, secondary accents |
| Pale green | #EAF6EF | Selected rows, info banners, badge backgrounds |
| Page background | #F5F7F6 | App shell background |
| Surface | #FFFFFF | Cards, panels, form containers, restrained shadow/border |
| Text (primary) | #173B2D | Body copy, headings |
| Error | #B42318 | Validation messages, failure states |
| Warning (amber) | #B54708 | Non-decorative use only (e.g. "5 MB limit" hint), never alone to convey status |
| Success | #16803C | Confirmation banners — always paired with a text label, never color alone |

Read-only fields get a visually distinct shading from editable fields (pale grey/green fill,
no focus ring, not tab-stoppable as an input).

### 1.2 Layout / Breakpoints
| Breakpoint | Range | Behavior |
|---|---|---|
| Desktop | ≥ 992px | Multi-column, centered content, max-width container |
| Tablet | 768–991px | Two columns where practical |
| Mobile | < 768px | All fields stack vertically, touch-friendly (≥44px) targets, no horizontal scroll |

No clipped labels, overlapping messages, or hidden buttons at any breakpoint (AC-27).

### 1.3 Shared Component Rules
- One consistent field height across all inputs/selects.
- Multiline Description textarea resizes vertically without breaking layout.
- Every icon-only control has an accessible label (`aria-label`).
- Visible focus indicator (outline in Primary green) on every interactive control for keyboard
  navigation (AC-28).
- Status/Priority badges: color + text together, never color alone.

---

## 2. Application Shell

- TokTickIT logo/identity, top-level nav: **My Tickets**, **Create Ticket**.
- Current Requester's name displayed with a **Change Requester** action (routes back to
  Selection, per BR-07).
- Active nav item visually indicated (underline or filled background in Primary green).
- Mobile: nav collapses into a menu; touch targets remain ≥44px.

---

## 3. Screen: Development Requester Selection `/choose-requester`
![My Tickets](photo/ui/example/profile.png)
**Purpose:** testing-only identity switcher (BR-05) — must never be presented as login.

| State | Behavior |
|---|---|
| Default | Dropdown of active Requesters only (BR-06); explanatory copy: "Development testing tool — not a login." |
| Loading | Skeleton/spinner while `GET /api/dev-requesters` resolves |
| Empty | No active Requesters — message + guidance, no dropdown interaction possible (AC-25) |
| API failure | Safe error state with retry action |

- Selecting a Requester and confirming routes to My Tickets, replacing the requester context
  for every subsequent call (BR-07).
- All controls keyboard-reachable in logical order with visible focus (AC-28).
- Create Ticket / My Tickets / Ticket Detail redirect here until a Requester is selected
  (BR-08, AC-02).

---

## 4. Screen: Create Ticket /create-ticket

**Layout**
- **System-generated fields** (Ticket Number, Ticket Date, Requester) shown read-only, visually
  distinct field styling — never editable, never sent by the client.
- **Category / Related System / Requested Priority** grouped together as a related field set.
- **Summary** and **Description** given generous width (full-width on all breakpoints).
- **Attachments** section below the main fields, reusing the shared upload control.
- **Actions:** Submit (primary) and Cancel (secondary) at the bottom of the form.

**States**
| State | Behavior |
|---|---|
| Inline validation | Field-level messages on blur/submit (empty Summary, short Description, etc. — AC-05, AC-06) |
| Boundary validation | 150-char Summary passes, 151 fails, with the limit named in the message (AC-07, AC-08) |
| Busy/submitting | Submit disabled + busy indicator for the duration of the in-flight request (BR-19, AC-12) |
| Success | Displays the backend-generated Ticket Number (AC-01) |
| Server/network failure | Safe error banner; all entered field values remain in the form (BR-20, AC-13) |
| Partial failure | Ticket exists and its number is shown; failed Attachment(s) reported separately with a retry path (BR-21, AC-14) |

**Attachment control (shared with Ticket Detail)**
- Client-side pre-check: rejects disallowed types (`.jpg/.jpeg/.png/.webp/.pdf` only) and files
  over 5 MB before any upload call (AC-09, AC-10).
- Shows remaining slots toward the 5 active-Attachment limit; blocks a 6th with a limit-reached
  message (AC-11).

---

## 5. Screen: My Tickets `/my-tickets`
![My Tickets](photo/ui/example/Mytickets.png)

The **My Tickets** screen allows the requester to view, search, filter, sort, and navigate through their submitted support tickets.

The layout should closely follow the provided My Tickets reference image, using a full-width green navigation bar at the top, followed by the page heading, action buttons, filter/search area, ticket table, and pagination.

### 5.1 Overall Page Layout 

The page is arranged vertically in the following order:

1. Top navigation bar
2. Page title and description
3. Top-right page actions
4. Search and filter panel
5. Ticket table
6. Pagination and ticket count

The main page content is centered horizontally with consistent left and right margins. The background is a very light gray/white, while the individual search/filter panel and ticket table use white backgrounds with subtle borders and shadows.

---

### 5.2 Page Header

Directly below the navigation bar is the main page content.

The page header is positioned toward the upper-left of the content area.

#### Page title

Large bold text:

**My Tickets**

This is the main heading of the page.

It should be positioned near the left margin, with a small amount of spacing below the navigation bar.

#### Description

Immediately below the title is the description:

**View and track all of your support requests.**

The description uses a smaller, lighter gray font than the page title.

The title and description should be vertically aligned with the content below.

---

### 5.3 Page Actions

Two action buttons are positioned on the same horizontal level as the page header, aligned to the upper-right of the content area.

#### Clear Filters button

Text:

**Clear Filters**

The button is positioned first, on the left.

It contains:

* A small reset/refresh-style icon
* Text: **Clear Filters**

The button uses a light/white background with a subtle border.

Clicking this button resets:

* Search text
* Category filter
* Requested Priority filter
* Current Status filter

#### Create Ticket button

Text:

**Create Ticket**

The button is positioned immediately to the right of the Clear Filters button.

It contains:

* A plus icon
* Text: **Create Ticket**

The button uses the application's green primary color.

Clicking this button opens the Create Ticket screen.

---

### 5.4 Search and Filter Panel

Below the page header/actions is a large rectangular filter panel.

The panel spans almost the full width of the main content area.

It has:

* White background
* Light gray border
* Slight rounded corners
* Subtle shadow
* Internal padding

All search and filter controls are arranged in a single horizontal row on the desktop layout.

---

#### 5.4.1 Search Box

The search box is positioned on the far left of the filter panel.

It is wider than each individual dropdown filter.

##### Search icon

A small magnifying-glass icon is positioned inside the left side of the search field.

##### Placeholder text

The search field displays:

**Search by ticket number or summary...**

The placeholder text is gray and appears inside the input field.

##### Search behavior

The search supports:

* Ticket Number
* Summary

Matching is:

* Case-insensitive
* Partial matching

For example, searching for `vpn` should find a ticket whose summary contains `VPN`.

---

### 5.4.2 Category Filter

The Category filter is positioned immediately to the right of the search box.

A small label appears above the dropdown:

**Category**

The dropdown initially displays:

**All Categories**

The dropdown includes an arrow indicating that it can be opened.

The filter should allow the user to select a specific ticket category or all categories.

---

#### 5.4.3 Requested Priority Filter

The Requested Priority filter is positioned immediately to the right of the Category filter.

Label:

**Requested Priority**

The dropdown initially displays:

**All Priorities**

The dropdown includes a downward arrow.

The available priority values are:

* All Priorities
* Low
* Medium
* High

---

#### 5.4.4 Current Status Filter

The Current Status filter is positioned to the right of the Requested Priority filter.

Label:

**Current Status**

The dropdown initially displays:

**All Statuses**

The dropdown includes a downward arrow.

The available status values should correspond to the supported ticket statuses.

Multiple filters can be used at the same time.

For example:

* Category = Hardware
* Requested Priority = High
* Current Status = Open

The table should then display only tickets matching all selected filters.

---

### 5.5 Ticket Table

The ticket table is positioned directly below the search/filter panel.

There should be a small vertical gap between the filter panel and the table.

The table occupies almost the entire width of the content area.

The table has:

* White background
* Thin light-gray border
* Slight rounded corners
* Subtle shadow
* A light green-tinted header row

---

#### 5.6.1 Table Columns

The table contains the following columns from left to right:

1. **Ticket No.**
2. **Created Date**
3. **Summary**
4. **Category**
5. **Requested Priority**
6. **Current Status**
7. **Ticket Owner(requesterId)**
8. **Last Updated**

There is **no IT Priority column** in this screen.

---

#### 5.5.2 Ticket No. Column

Header:

**Ticket No.**

The Ticket Number is displayed in green text.

Example:

**TKT-2025-001234**

The Ticket Number column is sortable.

A small sort indicator appears beside the column heading.

Clicking the column header toggles the sorting direction.

---

#### 5.5.3 Created Date Column

Header:

**Created Date**

The date and time that the ticket was created are displayed.

Example:

**May 12, 2025 09:14 AM**

The Created Date column is sortable.

Clicking the column header toggles between ascending and descending order.

---

#### 5.5.4 Summary Column

Header:

**Summary**

The ticket summary is displayed as plain text.

Example:

**Laptop battery drains quickly**

The Summary column is **not sortable**.

There should be no sorting behavior associated with this column.

If the summary is too long for the available column width, it should be visually constrained rather than causing the entire table to become excessively wide.

---

#### 5.5.5 Category Column

Header:

**Category**

The ticket category is displayed as text.

Example values include:

* Hardware
* Network
* Software
* Access

---

#### 5.5.6 Requested Priority Column

Header:

**Requested Priority**

The requested priority is displayed as a small rounded badge.

Example:

**Low**

**Medium**

**High**

The badge appearance should visually distinguish the priority levels.

The Requested Priority column is sortable if sorting is supported for this field.

---

#### 5.5.7 Current Status Column

Header:

**Current Status**

The current ticket status is displayed as a small rounded status badge.

Example values shown in the reference include:

* Open
* In Progress
* Pending
* Resolved

The badge should use the application's status styling to make different statuses easy to recognize.

---

#### 5.5.8 Ticket Owner(requesterId) Column

Header:

**Ticket Owner(requesterId)**

The name of the person currently assigned as the Ticket Owner(requesterId) is displayed.

Example:

**Michael Brown**

The name is displayed as normal text.

---

#### 5.5.9 Last Updated Column

Header:

**Last Updated**

The date and time when the ticket was most recently updated are displayed.

Example:

**May 13, 2025 10:30 AM**

The Last Updated column is sortable.

Clicking the column header toggles between ascending and descending order.

---

### 5.6 Sorting

Sortable columns should provide a visual sorting indicator beside the column name.

Clicking a sortable column header changes the sorting direction.

For example:

**Created Date ↑**

means ascending order.

Clicking it again changes it to:

**Created Date ↓**

means descending order.

The sort order should be reversed each time the same sortable column is clicked.

The **Summary** column must not be sortable.

Sorting should not remove or reset the user's currently selected search or filters.

---

### 5.7 Ticket Rows

Each ticket is displayed as one row underneath the table header.

Rows should have consistent height and spacing.

The following information should appear in each row:

**Ticket Number → Created Date → Summary → Category → Requested Priority → Current Status → Ticket Owner(requesterId) → Last Updated**

The reference image shows eight ticket rows on the first page.

Example ticket:

* Ticket No.: **TKT-2025-001234**
* Created Date: **May 12, 2025 09:14 AM**
* Summary: **Laptop battery drains quickly**
* Category: **Hardware**
* Requested Priority: **Medium**
* Current Status: **In Progress**
* Ticket Owner(requesterId): **Michael Brown**
* Last Updated: **May 13, 2025 10:30 AM**

The actual rows should be populated dynamically from the user's tickets rather than hard-coded.

---

### 5.8 Pagination Area

The pagination area is positioned at the bottom of the table.

It contains two separate pieces of information:

1. Ticket count information on the left
2. Pagination controls on the right

---

#### 5.8.1 Ticket Count

At the bottom-left of the table is text showing the number of displayed tickets and total tickets.

Example:

**Showing 1 to 8 of 42 tickets**

This should update dynamically based on:

* Current page
* Page size
* Total number of tickets

For example, if the user is on page 2 with 8 tickets per page:

**Showing 9 to 16 of 42 tickets**

---

#### 5.8.2 Pagination Controls

Pagination controls are positioned at the bottom-right.

The controls contain:

**Previous**

followed by page numbers:

**1  2  3  4  5  ...  6**

followed by:

**Next**

The current page is visually highlighted.

In the reference image, page **1** is selected.

The Previous button should be disabled when the user is already on the first page.

The Next button should be disabled when the user is already on the final page.

---

### 5.9 Pagination Information

The pagination system should support:

* Current page
* Page size
* Total items
* Total pages
* Previous page
* Next page

The page should recalculate the displayed ticket range whenever search or filters change.

For example:

If there are 42 total tickets and the page size is 8:

* Page 1 → Showing 1 to 8 of 42 tickets
* Page 2 → Showing 9 to 16 of 42 tickets
* Page 3 → Showing 17 to 24 of 42 tickets
* Page 6 → Showing 41 to 42 of 42 tickets

When a search or filter produces fewer results, pagination should update accordingly.

---

### 5.10 Complete Screen Text

The visible interface text should contain the following labels and actions:

#### Navigation

* **TikTockIT**
* **My Tickets**
* **Create Ticket**
* **Profile**

#### Page Header

* **My Tickets**
* **View and track all of your support requests.**

#### Actions

* **Clear Filters**
* **Create Ticket**

#### Search

* **Search by ticket number or summary...**

#### Filters

* **Category**
* **All Categories**
* **Requested Priority**
* **All Priorities**
* **Current Status**
* **All Statuses**

#### Table Headers

* **Ticket No.**
* **Created Date**
* **Summary**
* **Category**
* **Requested Priority**
* **Current Status**
* **Ticket Owner(requesterId)**
* **Last Updated**

#### Pagination

* **Showing X to Y of Z tickets**
* **Previous**
* Page numbers
* **Next**

---

### 5.11 Visual Position Summary

From top to bottom, the screen should appear in this order:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ◷ TikTockIT    ▣ My Tickets    ⊕ Create Ticket        ◉ Profile ˅ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  My Tickets                                      Clear Filters      │
│  View and track all of your support requests.     + Create Ticket  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search...  │ Category │ Priority │ Status                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Ticket No. │ Created │ Summary │ Category │ Priority │ ...   │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ TKT-...    │ May ... │ Laptop...│ Hardware│ Medium   │ ...   │  │
│  │ TKT-...    │ May ... │ Cannot...│ Network │ High     │ ...   │  │
│  │ TKT-...    │ May ... │ Email... │ Software│ Medium   │ ...   │  │
│  │ ...                                                           │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ Showing 1 to 8 of 42 tickets          ‹ Previous 1 2 3 ... Next ›│ │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

The exact implementation should preserve the **relative positioning shown in the reference image**: navigation at the top, page title/actions beneath it, filters below the heading, the full-width ticket table underneath the filters, and pagination at the bottom of the table.


**States**
| State | Trigger | Behavior |
|---|---|---|
| Loading | list request in flight | Skeleton/spinner rows |
| Empty | Requester has never created a Ticket | Distinct Empty state (not No-Results) with a Create Ticket call-to-action (AC-19) |
| No-Results | Requester has Tickets but filters match none | No-Results state with a **Clear Filters** action (AC-20) |
| Failure | list request fails | Safe error state with retry |
| Populated | normal | Table (desktop/tablet) → card list (mobile) |

- Responsive: table collapses to stacked cards under 768px; no horizontal scroll.
- Paging forward loads the next set and updates page metadata correctly (AC-18).
- Combined Category + Requested Priority filters return only matching Tickets (AC-16).
- Changing Requester via the shell action reloads this screen to the new Requester's Tickets
  only (AC-26); no other Requester's Tickets are ever visible (AC-03, AC-04).

---

## 6. Screen: Requester Ticket Detail `/ticket/:id`
![My Tickets](photo/ui/example/Ticket.png)
**Layout**
- Top Area (Ticket Details): Displays core information fields. All top fields are Read-Only (Ticket No., Ticket Date, Category, Related System, Requester, Priorities, Current Status, Ticket Owner(requesterId)(), Summary, Description, Resolution Summary).
- Bottom Area (Tabbed Content): Features dynamic tabs: Public Comments, Attachments, Service Actions, and Event Log.
- Fully read-only in Lab 2 — no status change, comment, internal note, or Actions Taken entry
  (BR-30).

**Attachments panel**
| Item state | Presentation |
|---|---|
| Active | Shown normally with **Download** and **Remove** actions |
| Removed | Greyed out, metadata-only (original file name, uploaded date, removed date, removal reason), visible "Removed" indicator, download control disabled (BR-27, AC-24) |

- **Add Attachment** reuses Create Ticket's upload control and validation rules; a newly added
  Attachment appears in the list as Active without a page reload (AC-21).
- **Download** returns the original file content for an active Attachment (AC-22).
- **Remove** requires a non-empty reason; the action is blocked until one is entered (BR-26,
  AC-23).

---
## 7. Top Navigation Bar

A full-width navigation bar is positioned at the very top of the screen.

The navigation bar has a dark green background and spans from the left edge to the right edge of the browser window.

### Left side

The application logo/name is positioned at the top-left.

It contains:

* A circular clock-style icon
* Application name: **TikTockIT**

The logo and application name are displayed horizontally and vertically centered inside the navigation bar.

The logo area should have some padding from the left edge.

### Navigation links

Immediately to the right of the application name are the main navigation links.

The links are arranged horizontally:

**My Tickets**

**Create Ticket**

Each navigation item contains a small icon followed by its text.

#### My Tickets

Text:

**My Tickets**

Icon:

A document/list-style icon.

This is the currently selected page, so the **My Tickets** navigation item has a lighter/white active area underneath it.

The active area visually connects to the page below and makes it clear that the user is currently viewing My Tickets.

#### Create Ticket

Text:

**Create Ticket**

Icon:

A plus/add icon.

This item is not selected.

Clicking it should navigate to the Create Ticket screen.

### Right side

The user profile control is positioned at the far right of the navigation bar.

It contains:

* Circular user/profile icon
* Text: **Profile**
* Downward chevron/dropdown icon

The elements are arranged horizontally and vertically centered.

The profile control should have right-side padding from the edge of the browser.

---

## 8. Accessibility Checklist (applies to all screens)

- Logical, keyboard-only tab order through every interactive control.
- Visible focus indicator at every point in that order (AC-28).
- Every icon-only button has an `aria-label`.
- Status/Priority conveyed with text + color together, never color alone.
- Error and success messages announced in a way assistive tech can pick up (e.g. `aria-live`
  region for the submit result banner).