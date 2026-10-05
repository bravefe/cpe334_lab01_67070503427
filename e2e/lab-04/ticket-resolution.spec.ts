import { expect, test, type Page } from "@playwright/test";

const password = "Password123!";
const TICKET_NO = "TKT-2026-000001";

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

// Pages through the queue until the ticket is visible, then opens it.
async function openTicketFromQueue(page: Page, ticketNo: string) {
  const ticket = page.getByText(ticketNo, { exact: true });
  const pageButtons = page.getByRole("button", { name: /^\d+$/ });

  await page.waitForLoadState("networkidle");
  const pageCount = await pageButtons.count();

  for (let i = 0; i < Math.max(pageCount, 1); i++) {
    const found = await ticket
      .waitFor({ state: "visible", timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (found) break;
    if (i < pageCount) await pageButtons.nth(i).click();
  }

  await expect(ticket).toBeVisible();
  await ticket.click();
}

async function addAction(
  page: Page,
  description: string,
  result: "In Progress" | "Resolved",
) {
  const dialog = page.getByRole("dialog");

  await page.getByRole("button", { name: "Add Action" }).click();
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Description", { exact: true }).fill(description);
  await dialog.getByLabel("Result").selectOption({ label: result });
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(dialog).toBeHidden();
}

test.describe("Lab 4 Ticket Resolution Workflow", () => {
  test("WF-03: completes New → Open → In Progress → Resolved → Closed lifecycle", async ({
    page,
  }) => {
    // IT Staff login
    await signIn(page, "arwen@rivendell.example.com");
    await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();

    // Open the target ticket from the queue (any page).
    await openTicketFromQueue(page, TICKET_NO);

    await expect(
      page.getByRole("heading", { name: "Ticket Detail" }),
    ).toBeVisible();

    const status = page.getByLabel("Current Status");

    // New → Open
    await status.selectOption("Open");
    await expect(status).toHaveValue("Open");

    // Open → In Progress
    await status.selectOption("In Progress");
    await expect(status).toHaveValue("In Progress");

    // A Resolved transition requires a Resolved Action Taken.
    await page.getByRole("tab", { name: "Service Actions" }).click();
    await expect(
      page.getByRole("heading", { name: "Actions Taken" }),
    ).toBeVisible();

    await addAction(
      page,
      "Completed the requested account access repair.",
      "Resolved",
    );

    // Resolved option unlocks once the Resolved action is recorded.
    // (Requires the onActionsChange fix in ActionsTakenPanel/StaffTicketDetail.)
    await expect(status.locator('option[value="Resolved"]')).toBeEnabled();

    // Resolution Summary is required to resolve.
    await page
      .getByLabel("Resolution Summary")
      .fill("Access repaired and confirmed with the requester.");

    // In Progress → Resolved (the app shows a window.confirm)
    page.once("dialog", (d) => void d.accept());
    await status.selectOption("Resolved");
    await expect(status).toHaveValue("Resolved");

    // Resolved → Closed
    await status.selectOption("Closed");
    await expect(status).toHaveValue("Closed");
  });

  test("WF-04: Administrator reopens a Closed Ticket and normal flow resumes", async ({
    page,
  }) => {
    // Administrator login.
    // NOTE: no "My Queue" assertion here, since the admin may land on a
    // different page. openTicketFromQueue waits for the ticket itself.
    await signIn(page, "elrond@rivendell.example.com");

    // await expect(page).toHaveURL(/\/my-tickets/);

    await page.getByLabel("My Queue").click();
    await expect(page).toHaveURL(/\/queue/);

    // await page.goto("/queue");
    // await page.goto("http://localhost:5173/queue");

    await openTicketFromQueue(page, TICKET_NO);

    await expect(
      page.getByRole("heading", { name: "Ticket Detail" }),
    ).toBeVisible();

    const status = page.getByLabel("Current Status");
    await expect(status).toHaveValue("Closed");

    // Administrator reopens the ticket (Closed only allows Reopened).
    await status.selectOption("Reopened");
    await expect(status).toHaveValue("Reopened");

    // Normal workflow resumes.
    await status.selectOption("In Progress");
    await expect(status).toHaveValue("In Progress");

    // BR-16: staff/admin can add a new Action Taken after reopening.
    await page.getByRole("tab", { name: "Service Actions" }).click();

    const description = "Follow-up investigation after ticket was reopened.";
    await addAction(page, description, "In Progress");

    await expect(
      page.getByRole("row").filter({ hasText: description }),
    ).toBeVisible();
  });
});
