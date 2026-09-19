import { expect, test } from "@playwright/test";
import { captureScreen } from "./screenshots";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("E2E-06: administrator creates a temporary-password user", async ({ page }) => {
  await signIn(page, "elrond@rivendell.example.com");

  // Preserve the Administrator's initial authenticated view, including the
  // role-aware top navigation, before opening a management panel.
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await captureScreen(page, "user-management", "admin-main-menu");
  await captureScreen(page, "user-management", "users-list");
  await page.getByRole("button", { name: "Create User" }).click();
  await captureScreen(page, "user-management", "create-user-panel");
  await page.getByLabel("Full Name").fill("E2E User");
  await page.getByLabel("Email Address").fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel("Initial Password").fill("Password123!");
  await page.getByRole("button", { name: "Save User" }).click();
  await expect(page.getByRole("status")).toContainText("User created.");
});

test("E2E-07: the self-deactivation control is disabled", async ({ page }) => {
  await signIn(page, "elrond@rivendell.example.com");
  const ownRow = page.locator("tr", { hasText: "Elrond Half-elven" });
  await expect(ownRow).toBeVisible();
  await ownRow.getByRole("button", { name: "Edit" }).click();
  await captureScreen(page, "user-management", "edit-user-panel");
  await expect(page.getByLabel("Active")).toBeDisabled();
  await expect(page.getByText("You can't deactivate your own account")).toBeVisible();
});

test("E2E-08: staff direct navigation to admin is forbidden", async ({ page }) => {
  await signIn(page, "arwen@rivendell.example.com");
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Access forbidden" })).toBeVisible();
});
