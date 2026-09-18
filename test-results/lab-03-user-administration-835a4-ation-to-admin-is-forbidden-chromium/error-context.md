# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\user-administration.spec.ts >> E2E-08: staff direct navigation to admin is forbidden
- Location: e2e\lab-03\user-administration.spec.ts:31:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Access forbidden' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Access forbidden' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Access forbidden' })

```

```yaml
- main:
  - paragraph: TOKTockIT
  - heading "Sign in" [level=1]
  - text: Email
  - textbox "Email"
  - text: Password
  - textbox "Password"
  - button "Sign in"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { captureScreen } from "./screenshots";
  3  | 
  4  | async function signIn(page: import("@playwright/test").Page, email: string) {
  5  |   await page.goto("/");
  6  |   await page.getByLabel("Email").fill(email);
  7  |   await page.getByLabel("Password").fill("Password123!");
  8  |   await page.getByRole("button", { name: "Sign in" }).click();
  9  | }
  10 | 
  11 | test("E2E-06: administrator creates a temporary-password user", async ({ page }) => {
  12 |   await signIn(page, "elrond@rivendell.example.com");
  13 |   await captureScreen(page, "user-management", "users-list");
  14 |   await page.getByRole("button", { name: "Create User" }).click();
  15 |   await captureScreen(page, "user-management", "create-user-panel");
  16 |   await page.getByLabel("Full Name").fill("E2E User");
  17 |   await page.getByLabel("Email Address").fill(`e2e-${Date.now()}@example.com`);
  18 |   await page.getByLabel("Initial Password").fill("Password123!");
  19 |   await page.getByRole("button", { name: "Save User" }).click();
  20 |   await expect(page.getByRole("status")).toContainText("User created.");
  21 | });
  22 | 
  23 | test("E2E-07: the self-deactivation control is disabled", async ({ page }) => {
  24 |   await signIn(page, "elrond@rivendell.example.com");
  25 |   await page.getByRole("button", { name: "Edit" }).first().click();
  26 |   await captureScreen(page, "user-management", "edit-user-panel");
  27 |   await expect(page.getByLabel("Active")).toBeDisabled();
  28 |   await expect(page.getByText("You can't deactivate your own account")).toBeVisible();
  29 | });
  30 | 
  31 | test("E2E-08: staff direct navigation to admin is forbidden", async ({ page }) => {
  32 |   await signIn(page, "arwen@rivendell.example.com");
  33 |   await page.goto("/admin/users");
> 34 |   await expect(page.getByRole("heading", { name: "Access forbidden" })).toBeVisible();
     |                                                                         ^ Error: expect(locator).toBeVisible() failed
  35 | });
  36 | 
```