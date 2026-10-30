import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const password = "Password123!";
const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 991, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(
    /\/(requester\/dashboard|staff\/dashboard|admin\/dashboard|my-tickets|queue|admin\/users)$/,
  );
}

async function signOut(page: Page) {
  await page.locator(".profile").click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
}

async function dashboardMetric(page: Page, label: string) {
  const card = page.getByRole("button", {
    name: new RegExp(`^${label}: \\d+\\. View tickets$`),
  });
  await expect(card).toBeVisible();
  const accessibleName = await card.getAttribute("aria-label");
  const count = accessibleName?.match(/: (\d+)\. View tickets$/)?.[1];
  expect(count).toBeDefined();
  return Number(count);
}

async function captureEvidence(page: Page, area: string, state: string) {
  const directory = join(
    process.cwd(),
    "artifacts",
    "lab-04",
    "screenshots",
    area,
  );
  mkdirSync(directory, { recursive: true });

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    const hasHorizontalOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return Math.max(root.scrollWidth, document.body.scrollWidth) >
        root.clientWidth;
    });
    expect(
      hasHorizontalOverflow,
      `${state} has horizontal overflow at ${viewport.name}`,
    ).toBe(false);

    await page.screenshot({
      path: join(directory, `${state}-${viewport.name}.png`),
      fullPage: true,
      animations: "disabled",
    });
  }

  await page.setViewportSize({
    width: viewports[0].width,
    height: viewports[0].height,
  });
}

test("E2E-09: captures Lab 4 rubric evidence at desktop, tablet, and mobile sizes", async ({
  page,
}) => {
  test.setTimeout(180_000);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await captureEvidence(page, "authentication", "sign-in");

  await signIn(page, "frodo.b@shiremail.example.com");
  await expect(
    page.getByRole("heading", { name: "Welcome, Frodo!" }),
  ).toBeVisible();

  await page.goto("/create-ticket");
  await page
    .getByLabel("Category")
    .selectOption({ label: "Account and Access" });
  await page.getByLabel("Related System").selectOption({ label: "Email" });
  await page.getByLabel("Requested Priority").selectOption({ label: "Medium" });
  await page.getByLabel("Summary").fill(`Lab 4 visual evidence ${Date.now()}`);
  await page
    .getByLabel("Description")
    .fill(
      "Ticket created by the Lab 4 responsive evidence flow for UI review.",
    );
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/\/ticket\/TKT-\d{4}-\d{6}/);
  const ticketNumber = new URL(page.url()).pathname.split("/").pop();
  expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

  await page.goto("/requester/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome, Frodo!" }),
  ).toBeVisible();
  const requesterDashboardResponse = await page.context().request.get(
    "http://localhost:3000/api/requester/dashboard",
  );
  expect(requesterDashboardResponse.status()).toBe(200);
  const requesterMetrics = await requesterDashboardResponse.json();
  expect(await dashboardMetric(page, "Total Open")).toBe(
    requesterMetrics.totalOpen,
  );
  expect(await dashboardMetric(page, "Waiting for You")).toBe(
    requesterMetrics.waitingForYou,
  );
  expect(await dashboardMetric(page, "Recently Resolved")).toBe(
    requesterMetrics.recentlyResolved,
  );
  expect(await dashboardMetric(page, "Closed")).toBe(requesterMetrics.closed);
  await captureEvidence(page, "requester", "dashboard");

  await page.goto("/my-tickets");
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  await expect(page.getByText(ticketNumber!, { exact: true })).toBeVisible();
  await captureEvidence(page, "requester", "my-tickets");

  await page.goto(`/queue`);
  await expect(
    page.getByRole("heading", { name: "Access forbidden" }),
  ).toBeVisible();
  await captureEvidence(page, "requester", "forbidden-staff-queue");
  await page.goto("/requester/dashboard");
  await signOut(page);

  await signIn(page, "arwen@rivendell.example.com");
  await page.goto("/staff/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Arwen!" }),
  ).toBeVisible();
  const staffDashboardResponse = await page.context().request.get(
    "http://localhost:3000/api/staff/dashboard",
  );
  expect(staffDashboardResponse.status()).toBe(200);
  const staffMetrics = await staffDashboardResponse.json();
  expect(await dashboardMetric(page, "New")).toBe(staffMetrics.new);
  expect(await dashboardMetric(page, "Unassigned")).toBe(
    staffMetrics.unassigned,
  );
  expect(await dashboardMetric(page, "My Assigned")).toBe(
    staffMetrics.myAssigned,
  );
  await captureEvidence(page, "staff", "dashboard");

  await page.getByRole("button", { name: /^New: \d+\. View tickets$/ }).click();
  await expect(page).toHaveURL(/\/queue\?status=New$/);
  await page.getByLabel("Search").fill(ticketNumber!);
  await page.getByLabel("Search").press("Enter");
  await expect(page.getByText(ticketNumber!, { exact: true })).toBeVisible();
  await captureEvidence(page, "staff", "queue-new-ticket");
  await page.getByText(ticketNumber!, { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ticket Detail" }),
  ).toBeVisible();

  const owner = page.getByLabel("Ticket Owner");
  await owner.selectOption({ label: "Claim for me" });
  await expect(page.getByText("Owner updated.")).toBeVisible();
  const status = page.getByLabel("Current Status");
  await expect(status).toHaveValue("New");
  await captureEvidence(page, "staff", "ticket-workflow-new");

  await status.selectOption("Open");
  await expect(status).toHaveValue("Open");
  await status.selectOption("In Progress");
  await expect(status).toHaveValue("In Progress");
  await expect(page.getByText(/Resolved is unavailable until/i)).toBeVisible();
  await expect(status.locator('option[value="Resolved"]')).toHaveAttribute(
    "disabled",
    "",
  );
  await captureEvidence(page, "staff", "ticket-workflow-resolved-gate");

  await page.getByRole("tab", { name: "Service Actions" }).click();
  await expect(
    page.getByRole("heading", { name: "Actions Taken" }),
  ).toBeVisible();
  await expect(
    page.getByText("No actions recorded yet for this ticket."),
  ).toBeVisible();
  await captureEvidence(page, "staff", "actions-taken-empty");

  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Add Action" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await captureEvidence(page, "staff", "action-validation");

  const firstDescription = "Verified the account configuration and access.";
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(firstDescription);
  await dialog.getByLabel("Result").selectOption({ label: "In Progress" });
  await dialog.getByLabel("Follow-up Required").check();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByRole("alert")).toContainText(/follow-up note/i);
  await dialog
    .getByLabel("Follow-up Note")
    .fill("Requester will confirm access after signing in.");
  await dialog.getByLabel("Attachment Notes").fill("See account audit notes.");
  await captureEvidence(page, "staff", "action-create-dialog");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();

  const firstRow = page.getByRole("row").filter({ hasText: firstDescription });
  await expect(firstRow).toBeVisible();
  await firstRow.getByRole("button", { name: "Edit" }).click();
  await expect(dialog).toBeVisible();
  const editedDescription =
    "Verified and corrected the account configuration and access.";
  await dialog.locator("textarea").first().fill(editedDescription);
  await captureEvidence(page, "staff", "action-edit-dialog");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(editedDescription)).toBeVisible();

  const secondDescription = "Confirmed access from the requester workstation.";
  await page.getByRole("button", { name: "Add Action" }).click();
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(secondDescription);
  await dialog.getByLabel("Result").selectOption({ label: "Resolved" });
  await dialog
    .getByLabel("Attachment Notes")
    .fill("Requester confirmation recorded.");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  const actionRows = page.getByRole("row");
  await expect(actionRows).toHaveCount(3);
  await expect(actionRows.nth(1)).toContainText(secondDescription);
  await expect(actionRows.nth(2)).toContainText(editedDescription);
  await expect(status.locator('option[value="Resolved"]')).toBeEnabled();
  await captureEvidence(page, "staff", "actions-taken-two-actions");

  await page.getByRole("tab", { name: "Public Comments" }).click();
  const publicComment =
    "The account access issue is resolved and ready for requester confirmation.";
  await page.getByLabel("Add Public Comment").fill(publicComment);
  await page.getByRole("button", { name: "Post Comment" }).click();
  await expect(page.getByText(publicComment, { exact: true })).toBeVisible();
  await captureEvidence(page, "staff", "public-comments");

  await page.getByRole("tab", { name: "Internal Notes" }).click();
  const internalNote = "Verified the access repair in the staff audit.";
  await page.getByLabel("Add Internal Note").fill(internalNote);
  await page.getByRole("button", { name: "Add Note" }).click();
  await expect(page.getByText(internalNote, { exact: true })).toBeVisible();
  await captureEvidence(page, "staff", "internal-notes");

  await page.getByRole("tab", { name: "Attachments" }).click();
  await expect(page.getByRole("tab", { name: "Attachments" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await captureEvidence(page, "staff", "attachments");

  await page.getByRole("tab", { name: "Service Actions" }).click();
  await expect(actionRows).toHaveCount(3);
  await expect(page.getByText(editedDescription)).toBeVisible();
  await expect(page.getByText(secondDescription)).toBeVisible();
  await page.getByLabel("Resolution Summary").fill(
    "Account access restored and verified with the requester.",
  );
  page.once("dialog", (dialogEvent) => void dialogEvent.accept());
  await status.selectOption("Resolved");
  await expect(status).toHaveValue("Resolved");
  await status.selectOption("Closed");
  await expect(status).toHaveValue("Closed");
  await expect(actionRows).toHaveCount(3);
  await captureEvidence(page, "staff", "ticket-workflow-closed");

  await signOut(page);
  await signIn(page, "frodo.b@shiremail.example.com");

  await page.goto("/requester/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome, Frodo!" }),
  ).toBeVisible();
  const updatedRequesterDashboardResponse = await page.context().request.get(
    "http://localhost:3000/api/requester/dashboard",
  );
  expect(updatedRequesterDashboardResponse.status()).toBe(200);
  const updatedRequesterMetrics = await updatedRequesterDashboardResponse.json();
  expect(await dashboardMetric(page, "Closed")).toBe(
    updatedRequesterMetrics.closed,
  );
  await captureEvidence(page, "requester", "dashboard-final-regression");

  await page.goto(`/ticket/${ticketNumber}`);
  await expect(
    page.getByRole("heading", { name: "Ticket Details" }),
  ).toBeVisible();
  await expect(page.getByText(ticketNumber!, { exact: true })).toBeVisible();
  await expect(page.getByText(internalNote, { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "Internal Notes" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "Public Comments" }),
  ).toBeVisible();
  await expect(page.getByText(publicComment, { exact: true })).toBeVisible();
  await captureEvidence(page, "requester", "ticket-detail-public-comments");

  await page.getByRole("tab", { name: "Attachments" }).click();
  await captureEvidence(page, "requester", "ticket-detail-attachments");

  await page.getByRole("tab", { name: "Service Actions" }).click();
  await expect(page.getByText(editedDescription)).toBeVisible();
  await expect(page.getByText(secondDescription)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Action" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await captureEvidence(page, "requester", "ticket-detail-actions-read-only");

  await page.goto("/my-tickets");
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  await expect(page.getByText(ticketNumber!, { exact: true })).toBeVisible();
  await captureEvidence(page, "requester", "my-tickets-final-regression");

  await signOut(page);
  await signIn(page, "elrond@rivendell.example.com");
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await captureEvidence(page, "administrator", "users-list");
  await page.getByRole("button", { name: "Create User" }).click();
  await expect(page.getByRole("heading", { name: "Create New User" })).toBeVisible();
  await captureEvidence(page, "administrator", "create-user-panel");
});
