import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("RESP-01: queue switches to its mobile card layout", async ({ page }) => {
  await signIn(page, "arwen@rivendell.example.com");
  await page.setViewportSize({ width: 767, height: 900 });
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  await expect(page.locator(".queue-table-wrap tr").first()).toHaveCSS("display", "grid");
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", await page.locator("body").evaluate(el => el.clientWidth));
});

test("RESP-02: user panel fills a phone viewport", async ({ page }) => {
  await signIn(page, "elrond@rivendell.example.com");
  await page.setViewportSize({ width: 375, height: 844 });
  await page.getByRole("button", { name: "Create User" }).click();
  await expect(page.locator(".user-panel")).toHaveCSS("width", "375px");
});

test("RESP-03: login has no horizontal overflow at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");
  expect(await page.locator("body").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
