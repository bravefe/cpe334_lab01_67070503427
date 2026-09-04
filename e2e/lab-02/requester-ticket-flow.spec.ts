import { expect, test } from "@playwright/test";

const appUrl = "http://localhost:5173";

function pdfBuffer() {
  return Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 18 Tf 50 50 Td (Playwright) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");
}

async function selectRequester(page: any, requesterName: string) {
  await page.goto(appUrl);
  await page.getByLabel("Requester").selectOption({ label: requesterName });
  await page.getByRole("button", { name: "Continue to My Tickets" }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
}

async function createTicket(page: any, summary = "Email access issue", description = "This description is long enough to be valid for E2E testing.") {
  await page.getByRole("button", { name: /Create Ticket/i }).click();
  await expect(page.getByRole("heading", { name: "Create Ticket" })).toBeVisible();

  await page.getByLabel("Category").selectOption({ label: "Account and Access" });
  await page.getByLabel("Related System").selectOption({ label: "Email" });
  await page.getByLabel("Requested Priority").selectOption({ label: "High" });
  await page.getByPlaceholder("Enter a short summary of your issue...").fill(summary);
  await page.getByPlaceholder("Describe your issue in detail...").fill(description);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Ticket Details" })).toBeVisible();

  const ticketNumber = await page.locator(".field-value").first().textContent();
  return (ticketNumber ?? "").trim();
}

test.describe("Requester ticket flow", () => {
  test("E2E-01: requester chooses a requester and creates a ticket", async ({ page }) => {
    await selectRequester(page, "Frodo Baggins");
    const ticketNumber = await createTicket(page);

    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    await expect(page.getByRole("button", { name: /Back to My Tickets/i })).toBeVisible();
  });

  test("E2E-02: requester A's ticket is hidden from requester B", async ({ browser }) => {
    const requesterA = await browser.newPage();
    const requesterB = await browser.newPage();

    await selectRequester(requesterA, "Frodo Baggins");
    const ticketNumber = await createTicket(requesterA, "Requester A ticket isolation check", "This is a ticket created by Frodo to verify requester isolation during the end-to-end flow.");

    await selectRequester(requesterB, "Samwise Gamgee");
    await requesterB.getByPlaceholder("Search by ticket number or summary...").fill(ticketNumber);
    await requesterB.getByRole("button", { name: /Create Ticket/i }).click();

    await expect(requesterB.getByText(ticketNumber)).not.toBeVisible();

    await requesterB.goto(`${appUrl}/ticket/${ticketNumber}`);
    await expect(requesterB.getByRole("heading", { name: "Ticket Details" })).not.toBeVisible();
  });

  test("E2E-03: full attachment lifecycle works end-to-end", async ({ page }) => {
    await selectRequester(page, "Frodo Baggins");
    await page.goto(`${appUrl}/ticket/TKT-2026-000001`);

    const file = {
      name: "sample-attachment.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuffer(),
    };

    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByRole("button", { name: /Download sample-attachment.pdf/i })).toBeVisible();

    await page.getByRole("button", { name: /Remove sample-attachment.pdf/i }).click();
    await page.once("dialog", async (dialog) => {
      await dialog.accept("No longer needed");
    });

    await expect(page.getByText("No longer needed")).toBeVisible();
    await expect(page.getByText("Removed")).toBeVisible();
    await expect(page.getByRole("button", { name: /Download sample-attachment.pdf/i })).toBeDisabled();
  });

  test("E2E-04: inactive requester is hidden and requester switching reloads the correct data", async ({ page }) => {
    await selectRequester(page, "Frodo Baggins");
    await page.getByRole("button", { name: /Create Ticket/i }).click();
    await page.getByRole("button", { name: /Back to My Tickets/i }).click();

    await page.locator("a.profile").click();
    await page.getByLabel("Requester").selectOption({ label: "Samwise Gamgee" });
    await page.getByRole("button", { name: "Continue to My Tickets" }).click();

    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
    await expect(page.getByText("Samwise Gamgee")).toBeVisible();
    await expect(page.getByText("Gandalf the Grey")).not.toBeVisible();
  });
});
