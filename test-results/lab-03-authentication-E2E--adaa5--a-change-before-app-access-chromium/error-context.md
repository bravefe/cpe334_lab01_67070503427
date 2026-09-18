# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03\authentication.spec.ts >> E2E-02: a temporary password requires a change before app access
- Location: e2e\lab-03\authentication.spec.ts:23:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Change password' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Change password' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Change password' })

```

```yaml
- main:
  - paragraph: TOKTockIT
  - heading "Sign in" [level=1]
  - alert: Invalid email or password.
  - text: Email
  - textbox "Email": merry.b@shiremail.example.com
  - text: Password
  - textbox "Password": Password123!
  - button "Sign in"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { captureScreen } from "./screenshots";
  3  | 
  4  | const password = "Password123!";
  5  | 
  6  | async function signIn(page: import("@playwright/test").Page, email: string) {
  7  |   await page.goto("/");
  8  |   await page.getByLabel("Email").fill(email);
  9  |   await page.getByLabel("Password").fill(password);
  10 |   await page.getByRole("button", { name: "Sign in" }).click();
  11 | }
  12 | 
  13 | test("E2E-01: active users can log in and logged-out sessions are blocked", async ({ page }) => {
  14 |   await signIn(page, "frodo.b@shiremail.example.com");
  15 |   await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  16 |   await captureScreen(page, "authentication", "requester-home");
  17 |   await page.locator(".profile").click();
  18 |   await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  19 |   await page.goto("/my-tickets");
  20 |   await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  21 | });
  22 | 
  23 | test("E2E-02: a temporary password requires a change before app access", async ({ page }) => {
  24 |   await signIn(page, "merry.b@shiremail.example.com");
> 25 |   await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  26 |   await captureScreen(page, "authentication", "mandatory-change-password");
  27 |   await page.getByLabel("Current password").fill(password);
  28 |   await page.getByLabel("New password").fill("ChangedPassword123!");
  29 |   await page.getByLabel("Confirm password").fill("ChangedPassword123!");
  30 |   await page.getByRole("button", { name: "Save password" }).click();
  31 |   await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  32 | });
  33 | 
  34 | test("E2E-03: inactive accounts show the safe inactive message", async ({ page }) => {
  35 |   await signIn(page, "gandalf@istari.example.com");
  36 |   await expect(page.getByRole("alert")).toContainText(/inactive/i);
  37 |   await captureScreen(page, "authentication", "inactive-account");
  38 | });
  39 | 
```