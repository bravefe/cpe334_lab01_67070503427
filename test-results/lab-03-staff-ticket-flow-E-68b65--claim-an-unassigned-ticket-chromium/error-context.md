# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\staff-ticket-flow.spec.ts >> E2E-04: staff can open a queue ticket and claim an unassigned ticket
- Location: e2e\lab-03\staff-ticket-flow.spec.ts:11:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('TKT-2026-000001')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - strong [ref=e4]:
      - img "TokTockIT logo" [ref=e5]
      - text: TokTockIT
    - generic "My Queue" [ref=e6]:
      - generic [aria-hidden] [ref=e7]: ▣
    - generic [ref=e8] [cursor=pointer]:
      - generic [ref=e9]: Arwen
      - generic [ref=e11]: IT STAFF
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "My Queue" [level=1] [ref=e15]
        - paragraph [ref=e16]: Triage and resolve support tickets.
      - button "↻ Clear Filters" [ref=e18] [cursor=pointer]
    - generic [ref=e19]:
      - generic [ref=e20]:
        - text: Search
        - textbox "Search" [ref=e21]:
          - /placeholder: Search by ticket number or summary...
      - generic [ref=e22]:
        - generic [ref=e23]:
          - text: Status
          - combobox "Status" [ref=e24]:
            - option "All" [selected]
        - generic [ref=e25]:
          - text: Category
          - combobox "Category" [ref=e26]:
            - option "All" [selected]
        - generic [ref=e27]:
          - text: Requested Priority
          - combobox "Requested Priority" [ref=e28]:
            - option "All" [selected]
        - generic [ref=e29]:
          - text: IT Priority
          - combobox "IT Priority" [ref=e30]:
            - option "All" [selected]
        - generic [ref=e31]:
          - text: Owner
          - combobox "Owner" [ref=e32]:
            - option "All owners" [selected]
            - option "My tickets"
            - option "Unassigned"
    - generic [ref=e33]:
      - heading "Unable to load the queue." [level=2] [ref=e34]
      - paragraph [ref=e35]: Authentication is required.
      - button "Retry" [ref=e36] [cursor=pointer]
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
> 14 |   await page.getByText("TKT-2026-000001").click();
     |                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  26 |   await expect(page.getByText("TKT-2026-000001")).toBeVisible();
  27 |   await captureScreen(page, "staff-queue", "queue-search-filter");
  28 |   await page.getByLabel("Status").selectOption("Open");
  29 |   await expect(page.getByText("TKT-2026-000001")).toBeVisible();
  30 | });
  31 | 
```