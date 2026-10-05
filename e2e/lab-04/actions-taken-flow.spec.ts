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

async function openTicket(page: Page) {
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();

  await openTicketFromQueue(page, TICKET_NO);

  await expect(
    page.getByRole("heading", { name: "Ticket Detail" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Service Actions" }).click();

  await expect(
    page.getByRole("tab", { name: "Service Actions" }),
  ).toHaveAttribute("aria-selected", "true");

  await expect(
    page.getByRole("heading", { name: "Actions Taken" }),
  ).toBeVisible();
}

test.describe("Lab 4 Actions Taken", () => {
  test("E2E-01: IT Staff can add, view, and edit an Action Taken", async ({
    page,
  }) => {
    await signIn(page, "arwen@rivendell.example.com");
    await openTicket(page);

    const dialog = page.getByRole("dialog");

    // Open Add Action form.
    await page.getByRole("button", { name: "Add Action" }).click();
    await expect(dialog).toBeVisible();

    const description =
      "Checked the user's account configuration and corrected the access issue.";

    await dialog.getByLabel("Description", { exact: true }).fill(description);
    const ACTION_DATE_TIME = "2026-10-01T09:00"; // datetime-local format
    await dialog.getByLabel(/action date/i).fill(ACTION_DATE_TIME);
    await dialog.getByLabel("Result").selectOption({ label: "In Progress" });
    await dialog.getByRole("button", { name: "Save" }).click();

    // Dialog closes and the action appears immediately.
    await expect(dialog).toBeHidden();

    const row = page.getByRole("row").filter({ hasText: description });
    await expect(row).toBeVisible();

    // Edit the action.
    await row.getByRole("button", { name: "Edit" }).click();
    await expect(dialog).toBeVisible();

    const editedDescription =
      "Checked the user's account configuration and corrected the access issue successfully.";

    await dialog.locator("textarea").fill(editedDescription);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();

    // Edit persists.
    await expect(page.getByText(editedDescription)).toBeVisible();

    // Original description should no longer be displayed.
    await expect(page.getByText(description, { exact: true })).toHaveCount(0);
  });

  test("E2E-02: Follow-Up Required requires a follow-up note", async ({
    page,
  }) => {
    await signIn(page, "arwen@rivendell.example.com");
    await openTicket(page);

    const dialog = page.getByRole("dialog");
    const description =
      "Contacted the requester and confirmed the account issue.";
    const followUpNote = "Requester will confirm the result tomorrow.";

    await page.getByRole("button", { name: "Add Action" }).click();
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Description", { exact: true }).fill(description);
    await dialog.getByLabel("Result").selectOption({ label: "In Progress" });

    // Enable Follow-up Required, leave the note blank.
    await dialog.getByLabel("Follow-up Required").check();
    await dialog.getByRole("button", { name: "Save" }).click();

    // Inline validation must appear and the dialog must stay open.
    await expect(
      dialog.getByText(/follow-up note.*required|required.*follow-up note/i),
    ).toBeVisible();
    await expect(dialog).toBeVisible();

    // The Action Taken must NOT have been created.
    await expect(
      page.getByRole("row").filter({ hasText: description }),
    ).toHaveCount(0);

    // Fill the required note and save again.
    await dialog.getByLabel("Follow-up Note").fill(followUpNote);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();

    // Now the record should be created.
    const row = page.getByRole("row").filter({ hasText: description });
    await expect(row).toBeVisible();
    await expect(row.getByText(followUpNote, { exact: true })).toBeVisible();
  });
});
