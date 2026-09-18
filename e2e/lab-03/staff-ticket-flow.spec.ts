import { expect, test } from "@playwright/test";
import { captureScreen } from "./screenshots";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill("arwen@rivendell.example.com");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("E2E-04: staff can open a queue ticket and claim an unassigned ticket", async ({ page }) => {
  await signIn(page);
  await captureScreen(page, "staff-queue", "queue-default");
  await page.getByText("TKT-2026-000001").click();
  await expect(page.getByText("Ticket No.")).toBeVisible();
  await captureScreen(page, "staff-ticket-detail", "ticket-detail");
  const owner = page.getByLabel("Ticket Owner");
  await owner.selectOption({ label: "Claim for me" });
  await expect(page.getByText("Owner updated.")).toBeVisible();
});

test("E2E-05: queue search and status filter narrow visible tickets", async ({ page }) => {
  await signIn(page);
  await page.getByLabel("Search").fill("TKT-2026-000001");
  await page.getByLabel("Search").press("Enter");
  await expect(page.getByText("TKT-2026-000001")).toBeVisible();
  await captureScreen(page, "staff-queue", "queue-search-filter");
  await page.getByLabel("Status").selectOption("Open");
  await expect(page.getByText("TKT-2026-000001")).toBeVisible();
});
