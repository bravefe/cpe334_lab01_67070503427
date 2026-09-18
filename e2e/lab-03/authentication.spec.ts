import { expect, test } from "@playwright/test";
import { captureScreen } from "./screenshots";

const password = "Password123!";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("E2E-01: active users can log in and logged-out sessions are blocked", async ({ page }) => {
  await signIn(page, "frodo.b@shiremail.example.com");
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  await captureScreen(page, "authentication", "requester-home");
  await page.locator(".profile").click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.goto("/my-tickets");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("E2E-02: a temporary password requires a change before app access", async ({ page }) => {
  await signIn(page, "merry.b@shiremail.example.com");
  await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
  await captureScreen(page, "authentication", "mandatory-change-password");
  await page.getByLabel("Current password").fill(password);
  await page.getByLabel("New password").fill("ChangedPassword123!");
  await page.getByLabel("Confirm password").fill("ChangedPassword123!");
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
});

test("E2E-03: inactive accounts show the safe inactive message", async ({ page }) => {
  await signIn(page, "gandalf@istari.example.com");
  await expect(page.getByRole("alert")).toContainText(/inactive/i);
  await captureScreen(page, "authentication", "inactive-account");
});
