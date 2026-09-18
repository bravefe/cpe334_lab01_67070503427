# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\staff-ticket-flow.spec.ts >> E2E-05: queue search and status filter narrow visible tickets
- Location: e2e\lab-03\staff-ticket-flow.spec.ts:22:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('TKT-2026-000001')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('TKT-2026-000001') with timeout 5000ms
  - waiting for getByText('TKT-2026-000001')

```

```yaml
- navigation:
  - strong:
    - img "TokTockIT logo"
    - text: TokTockIT
  - text: My Queue Arwen Undómiel IT STAFF
- main:
  - heading "My Queue" [level=1]
  - paragraph: Triage and resolve support tickets.
  - button "↻ Clear Filters"
  - text: Search
  - textbox "Search":
    - /placeholder: Search by ticket number or summary...
    - text: TKT-2026-000001
  - text: Status
  - combobox "Status":
    - option "All" [selected]
  - text: Category
  - combobox "Category":
    - option "All" [selected]
  - text: Requested Priority
  - combobox "Requested Priority":
    - option "All" [selected]
  - text: IT Priority
  - combobox "IT Priority":
    - option "All" [selected]
  - text: Owner
  - combobox "Owner":
    - option "All owners" [selected]
    - option "My tickets"
    - option "Unassigned"
  - heading "Unable to load the queue." [level=2]
  - paragraph: Authentication is required.
  - button "Retry"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { captureScreen } from "./screenshots";
  3  | 
  4  | async function signIn(page: import("@playwright/test").Page) {
  5  |   await page.goto("/");
  6  |   await page.getByLabel("Email").fill("arwen@rivendell.example.com");
  7  |   await page.getByLabel("Password").fill("Password123!");
  8  |   await page.getByRole("button", { name: "Sign in" }).click();
  9  | }
  10 | 
  11 | test("E2E-04: staff can open a queue ticket and claim an unassigned ticket", async ({ page }) => {
  12 |   await signIn(page);
  13 |   await captureScreen(page, "staff-queue", "queue-default");
  14 |   await page.getByText("TKT-2026-000001").click();
  15 |   await expect(page.getByText("Ticket No.")).toBeVisible();
  16 |   await captureScreen(page, "staff-ticket-detail", "ticket-detail");
  17 |   const owner = page.getByLabel("Ticket Owner");
  18 |   await owner.selectOption({ label: "Claim for me" });
  19 |   await expect(page.getByText("Owner updated.")).toBeVisible();
  20 | });
  21 | 
  22 | test("E2E-05: queue search and status filter narrow visible tickets", async ({ page }) => {
  23 |   await signIn(page);
  24 |   await page.getByLabel("Search").fill("TKT-2026-000001");
  25 |   await page.getByLabel("Search").press("Enter");
> 26 |   await expect(page.getByText("TKT-2026-000001")).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  27 |   await captureScreen(page, "staff-queue", "queue-search-filter");
  28 |   await page.getByLabel("Status").selectOption("Open");
  29 |   await expect(page.getByText("TKT-2026-000001")).toBeVisible();
  30 | });
  31 | 
```