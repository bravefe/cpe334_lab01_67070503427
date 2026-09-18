# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\responsive.spec.ts >> RESP-01: queue switches to its mobile card layout
- Location: e2e\lab-03\responsive.spec.ts:10:5

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator: locator('.queue-table-wrap tr').first()
Expected: "grid"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveCSS" locator('.queue-table-wrap tr').first() with timeout 5000ms
  - waiting for locator('.queue-table-wrap tr').first()

```

```yaml
- navigation:
  - strong:
    - img "TokTockIT logo"
    - text: TokTockIT
  - text: Arwen IT STAFF
- main:
  - heading "My Queue" [level=1]
  - paragraph: Triage and resolve support tickets.
  - button "↻ Clear Filters"
  - text: Search
  - textbox "Search":
    - /placeholder: Search by ticket number or summary...
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
  2  | 
  3  | async function signIn(page: import("@playwright/test").Page, email: string) {
  4  |   await page.goto("/");
  5  |   await page.getByLabel("Email").fill(email);
  6  |   await page.getByLabel("Password").fill("Password123!");
  7  |   await page.getByRole("button", { name: "Sign in" }).click();
  8  | }
  9  | 
  10 | test("RESP-01: queue switches to its mobile card layout", async ({ page }) => {
  11 |   await signIn(page, "arwen@rivendell.example.com");
  12 |   await page.setViewportSize({ width: 767, height: 900 });
  13 |   await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
> 14 |   await expect(page.locator(".queue-table-wrap tr").first()).toHaveCSS("display", "grid");
     |                                                              ^ Error: expect(locator).toHaveCSS(expected) failed
  15 |   await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.locator("body").evaluate(el => el.clientWidth));
  16 | });
  17 | 
  18 | test("RESP-02: user panel fills a phone viewport", async ({ page }) => {
  19 |   await signIn(page, "elrond@rivendell.example.com");
  20 |   await page.setViewportSize({ width: 375, height: 844 });
  21 |   await page.getByRole("button", { name: "Create User" }).click();
  22 |   await expect(page.locator(".user-panel")).toHaveCSS("width", "375px");
  23 | });
  24 | 
  25 | test("RESP-03: login has no horizontal overflow at 375px", async ({ page }) => {
  26 |   await page.setViewportSize({ width: 375, height: 844 });
  27 |   await page.goto("/");
  28 |   expect(await page.locator("body").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  29 | });
  30 | 
```