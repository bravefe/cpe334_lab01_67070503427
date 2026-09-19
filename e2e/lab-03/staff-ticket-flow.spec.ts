import { expect, test } from "@playwright/test";
import { captureScreen } from "./screenshots";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill("arwen@rivendell.example.com");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("E2E-04: staff can open a queue ticket and claim an unassigned ticket", async ({ page, request }) => {
  // E2E-04 deliberately changes ownership; put its fixture back before every
  // run so reruns remain independent of the previous successful execution.
  const setupLogin = await request.post("http://localhost:3000/api/auth/login", {
    data: { email: "arwen@rivendell.example.com", password: "Password123!" },
  });
  expect(setupLogin.ok()).toBe(true);
  const unassign = await request.patch(
    "http://localhost:3000/api/staff/tickets/TKT-2026-000007/owner",
    { data: { ownerId: null }, headers: { "X-Requested-With": "TokTickIT" } },
  );
  expect(unassign.ok()).toBe(true);

  await signIn(page);
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  await captureScreen(page, "staff-queue", "queue-default");
  await page.getByLabel("Search").fill("TKT-2026-000007");
  await page.getByLabel("Search").press("Enter");
  await expect(page.getByText("TKT-2026-000007")).toBeVisible();
  await page.getByText("TKT-2026-000007").click();
  await expect(page.getByText("Ticket No.")).toBeVisible();
  await captureScreen(page, "staff-ticket-detail", "ticket-detail");
  const owner = page.getByLabel("Ticket Owner");
  await owner.selectOption({ label: "Claim for me" });
  await expect(page.getByText("Owner updated.")).toBeVisible();
});

test("E2E-05: queue search and status filter narrow visible tickets", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  await page.getByLabel("Search").fill("TKT-2026-000002");
  await page.getByLabel("Search").press("Enter");
  await expect(page.getByText("TKT-2026-000002")).toBeVisible();
  await captureScreen(page, "staff-queue", "queue-search-filter");
  await page.getByLabel("Status").selectOption("Open");
  await expect(page.getByText("TKT-2026-000002")).toBeVisible();
});
