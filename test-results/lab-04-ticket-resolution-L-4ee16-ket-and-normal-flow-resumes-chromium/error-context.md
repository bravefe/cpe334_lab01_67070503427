# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-04\ticket-resolution.spec.ts >> Lab 4 Ticket Resolution Workflow >> WF-04: Administrator reopens a Closed Ticket and normal flow resumes
- Location: e2e\lab-04\ticket-resolution.spec.ts:107:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('TKT-2026-000001', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('TKT-2026-000001', { exact: true }) with timeout 5000ms
  - waiting for getByText('TKT-2026-000001', { exact: true })

```

```yaml
- navigation:
  - strong:
    - img "TokTockIT logo"
    - text: TokTockIT
  - text: Admin
  - button "Profile menu for Elrond Half-elven": Elrond Half-elven ADMINISTRATOR
- main:
  - heading "Users" [level=1]
  - paragraph: Create and manage user accounts.
  - button "Create User"
  - text: Search users
  - searchbox "Search users"
  - text: Role
  - combobox "Role filter":
    - option "All roles" [selected]
    - option "Requester"
    - option "IT Staff"
    - option "Administrator"
  - table:
    - rowgroup:
      - row "Name Role Status Actions":
        - columnheader "Name"
        - columnheader "Role"
        - columnheader "Status"
        - columnheader "Actions"
    - rowgroup:
      - row "Aragorn, Son of Arathorn a.elessar@gondor.example.com Requester Active Edit":
        - cell "Aragorn, Son of Arathorn a.elessar@gondor.example.com":
          - strong: Aragorn, Son of Arathorn
          - text: a.elessar@gondor.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Arwen Undómiel arwen@rivendell.example.com It Staff Active Edit":
        - cell "Arwen Undómiel arwen@rivendell.example.com":
          - strong: Arwen Undómiel
          - text: arwen@rivendell.example.com
        - cell "It Staff"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Boromir, Son of Denethor boromir@gondor.example.com Requester Active Edit":
        - cell "Boromir, Son of Denethor boromir@gondor.example.com":
          - strong: Boromir, Son of Denethor
          - text: boromir@gondor.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Denethor II, Steward of Gondor denethor@gondor.example.com It Staff Inactive Edit":
        - cell "Denethor II, Steward of Gondor denethor@gondor.example.com":
          - strong: Denethor II, Steward of Gondor
          - text: denethor@gondor.example.com
        - cell "It Staff"
        - cell "Inactive"
        - cell "Edit":
          - button "Edit"
      - row "Elrond Half-elven elrond@rivendell.example.com Administrator Active Edit":
        - cell "Elrond Half-elven elrond@rivendell.example.com":
          - strong: Elrond Half-elven
          - text: elrond@rivendell.example.com
        - cell "Administrator"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Faramir, Captain of Gondor faramir@gondor.example.com It Staff Active Edit":
        - cell "Faramir, Captain of Gondor faramir@gondor.example.com":
          - strong: Faramir, Captain of Gondor
          - text: faramir@gondor.example.com
        - cell "It Staff"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Frodo Baggins frodo.b@shiremail.example.com Requester Active Edit":
        - cell "Frodo Baggins frodo.b@shiremail.example.com":
          - strong: Frodo Baggins
          - text: frodo.b@shiremail.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Galadriel galadriel@lothlorien.example.com Requester Active Edit":
        - cell "Galadriel galadriel@lothlorien.example.com":
          - strong: Galadriel
          - text: galadriel@lothlorien.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Gandalf the Grey gandalf@istari.example.com Requester Inactive Edit":
        - cell "Gandalf the Grey gandalf@istari.example.com":
          - strong: Gandalf the Grey
          - text: gandalf@istari.example.com
        - cell "Requester"
        - cell "Inactive"
        - cell "Edit":
          - button "Edit"
      - row "Gimli, Son of Glóin gimli.o@erebor.example.com Requester Active Edit":
        - cell "Gimli, Son of Glóin gimli.o@erebor.example.com":
          - strong: Gimli, Son of Glóin
          - text: gimli.o@erebor.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Gollum smeagol@goblinmail.example.com Requester Inactive Edit":
        - cell "Gollum smeagol@goblinmail.example.com":
          - strong: Gollum
          - text: smeagol@goblinmail.example.com
        - cell "Requester"
        - cell "Inactive"
        - cell "Edit":
          - button "Edit"
      - row "Haldir of Lórien haldir@lothlorien.example.com It Staff Active Edit":
        - cell "Haldir of Lórien haldir@lothlorien.example.com":
          - strong: Haldir of Lórien
          - text: haldir@lothlorien.example.com
        - cell "It Staff"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Legolas Greenleaf legolasg@woodland.example.com Requester Active Edit":
        - cell "Legolas Greenleaf legolasg@woodland.example.com":
          - strong: Legolas Greenleaf
          - text: legolasg@woodland.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Meriadoc Brandybuck merry.b@shiremail.example.com Requester Active Edit":
        - cell "Meriadoc Brandybuck merry.b@shiremail.example.com":
          - strong: Meriadoc Brandybuck
          - text: merry.b@shiremail.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Peregrin Took pippin.t@shiremail.example.com Requester Active Edit":
        - cell "Peregrin Took pippin.t@shiremail.example.com":
          - strong: Peregrin Took
          - text: pippin.t@shiremail.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Samwise Gamgee sam.gamgee@shiremail.example.com Requester Active Edit":
        - cell "Samwise Gamgee sam.gamgee@shiremail.example.com":
          - strong: Samwise Gamgee
          - text: sam.gamgee@shiremail.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
      - row "Saruman the White saruman@isengard.example.com It Staff Inactive Edit":
        - cell "Saruman the White saruman@isengard.example.com":
          - strong: Saruman the White
          - text: saruman@isengard.example.com
        - cell "It Staff"
        - cell "Inactive"
        - cell "Edit":
          - button "Edit"
      - row "Éowyn eowyn.r@rohan.example.com Requester Active Edit":
        - cell "Éowyn eowyn.r@rohan.example.com":
          - strong: Éowyn
          - text: eowyn.r@rohan.example.com
        - cell "Requester"
        - cell "Active"
        - cell "Edit":
          - button "Edit"
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | const password = "Password123!";
  4   | const TICKET_NO = "TKT-2026-000001";
  5   | 
  6   | async function signIn(page: Page, email: string) {
  7   |   await page.goto("/");
  8   |   await page.getByLabel("Email").fill(email);
  9   |   await page.getByLabel("Password").fill(password);
  10  |   await page.getByRole("button", { name: "Sign in" }).click();
  11  | }
  12  | 
  13  | // Pages through the queue until the ticket is visible, then opens it.
  14  | async function openTicketFromQueue(page: Page, ticketNo: string) {
  15  |   const ticket = page.getByText(ticketNo, { exact: true });
  16  |   const pageButtons = page.getByRole("button", { name: /^\d+$/ });
  17  | 
  18  |   await page.waitForLoadState("networkidle");
  19  |   const pageCount = await pageButtons.count();
  20  | 
  21  |   for (let i = 0; i < Math.max(pageCount, 1); i++) {
  22  |     const found = await ticket
  23  |       .waitFor({ state: "visible", timeout: 1500 })
  24  |       .then(() => true)
  25  |       .catch(() => false);
  26  |     if (found) break;
  27  |     if (i < pageCount) await pageButtons.nth(i).click();
  28  |   }
  29  | 
> 30  |   await expect(ticket).toBeVisible();
      |                        ^ Error: expect(locator).toBeVisible() failed
  31  |   await ticket.click();
  32  | }
  33  | 
  34  | async function addAction(
  35  |   page: Page,
  36  |   description: string,
  37  |   result: "In Progress" | "Resolved",
  38  | ) {
  39  |   const dialog = page.getByRole("dialog");
  40  | 
  41  |   await page.getByRole("button", { name: "Add Action" }).click();
  42  |   await expect(dialog).toBeVisible();
  43  | 
  44  |   await dialog.getByLabel("Description", { exact: true }).fill(description);
  45  |   await dialog.getByLabel("Result").selectOption({ label: result });
  46  |   await dialog.getByRole("button", { name: "Save" }).click();
  47  | 
  48  |   await expect(dialog).toBeHidden();
  49  | }
  50  | 
  51  | test.describe("Lab 4 Ticket Resolution Workflow", () => {
  52  |   test("WF-03: completes New → Open → In Progress → Resolved → Closed lifecycle", async ({
  53  |     page,
  54  |   }) => {
  55  |     // IT Staff login
  56  |     await signIn(page, "arwen@rivendell.example.com");
  57  |     await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  58  | 
  59  |     // Open the target ticket from the queue (any page).
  60  |     await openTicketFromQueue(page, TICKET_NO);
  61  | 
  62  |     await expect(
  63  |       page.getByRole("heading", { name: "Ticket Detail" }),
  64  |     ).toBeVisible();
  65  | 
  66  |     const status = page.getByLabel("Current Status");
  67  | 
  68  |     // New → Open
  69  |     await status.selectOption("Open");
  70  |     await expect(status).toHaveValue("Open");
  71  | 
  72  |     // Open → In Progress
  73  |     await status.selectOption("In Progress");
  74  |     await expect(status).toHaveValue("In Progress");
  75  | 
  76  |     // A Resolved transition requires a Resolved Action Taken.
  77  |     await page.getByRole("tab", { name: "Service Actions" }).click();
  78  |     await expect(
  79  |       page.getByRole("heading", { name: "Actions Taken" }),
  80  |     ).toBeVisible();
  81  | 
  82  |     await addAction(
  83  |       page,
  84  |       "Completed the requested account access repair.",
  85  |       "Resolved",
  86  |     );
  87  | 
  88  |     // Resolved option unlocks once the Resolved action is recorded.
  89  |     // (Requires the onActionsChange fix in ActionsTakenPanel/StaffTicketDetail.)
  90  |     await expect(status.locator('option[value="Resolved"]')).toBeEnabled();
  91  | 
  92  |     // Resolution Summary is required to resolve.
  93  |     await page
  94  |       .getByLabel("Resolution Summary")
  95  |       .fill("Access repaired and confirmed with the requester.");
  96  | 
  97  |     // In Progress → Resolved (the app shows a window.confirm)
  98  |     page.once("dialog", (d) => void d.accept());
  99  |     await status.selectOption("Resolved");
  100 |     await expect(status).toHaveValue("Resolved");
  101 | 
  102 |     // Resolved → Closed
  103 |     await status.selectOption("Closed");
  104 |     await expect(status).toHaveValue("Closed");
  105 |   });
  106 | 
  107 |   test("WF-04: Administrator reopens a Closed Ticket and normal flow resumes", async ({
  108 |     page,
  109 |   }) => {
  110 |     // Administrator login.
  111 |     // NOTE: no "My Queue" assertion here, since the admin may land on a
  112 |     // different page. openTicketFromQueue waits for the ticket itself.
  113 |     await signIn(page, "elrond@rivendell.example.com");
  114 | 
  115 |     await openTicketFromQueue(page, TICKET_NO);
  116 | 
  117 |     await expect(
  118 |       page.getByRole("heading", { name: "Ticket Detail" }),
  119 |     ).toBeVisible();
  120 | 
  121 |     const status = page.getByLabel("Current Status");
  122 |     await expect(status).toHaveValue("Closed");
  123 | 
  124 |     // Administrator reopens the ticket (Closed only allows Reopened).
  125 |     await status.selectOption("Reopened");
  126 |     await expect(status).toHaveValue("Reopened");
  127 | 
  128 |     // Normal workflow resumes.
  129 |     await status.selectOption("In Progress");
  130 |     await expect(status).toHaveValue("In Progress");
```