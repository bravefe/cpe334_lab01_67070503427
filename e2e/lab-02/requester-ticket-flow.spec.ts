import { expect, test, type Page } from "@playwright/test";

const frodo = "Frodo Baggins";
const samwise = "Samwise Gamgee";

async function chooseRequester(page: Page, name: string) {
	await page.goto("/choose-requester");
	await page.getByLabel("Requester").selectOption({ label: name });
	await page.getByRole("button", { name: "Continue to My Tickets" }).click();
	await expect(page).toHaveURL(/\/my-tickets$/);
}

async function createTicket(page: Page, summary: string) {
	await page.getByRole("button", { name: /Create Ticket/ }).first().click();
	await page.getByLabel("Category").selectOption({ label: "Account and Access" });
	await page.getByLabel("Related System").selectOption({ label: "Email" });
	await page.getByLabel("Requested Priority").selectOption({ label: "Low" });
	await page.getByPlaceholder("Enter a short summary of your issue...").fill(summary);
	await page.getByPlaceholder("Describe your issue in detail...").fill("This is a complete end-to-end ticket description.");
	await page.getByRole("button", { name: "Submit", exact: true }).click();
	 await expect(page).toHaveURL(/\/ticket\/TKT-\d{4}-\d{6}\?created=1$/);
	const confirmation = page.locator(".success-banner");
	await expect(confirmation).toContainText("Ticket created: TKT-");
	return (await confirmation.textContent())!.replace("Ticket created: ", "").trim();
}

test.describe("Requester ticket flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/choose-requester");
		await page.evaluate(() => localStorage.clear());
	});

	test("E2E-01: creates a ticket and shows the backend-generated number", async ({ page }) => {
		await chooseRequester(page, frodo);
		const ticketNumber = await createTicket(page, `E2E-01 ${Date.now()}`);
		expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
	});

	test("E2E-02: prevents another requester from seeing the ticket", async ({ page }) => {
		await chooseRequester(page, frodo);
		const ticketNumber = await createTicket(page, `E2E-02 ${Date.now()}`);
		await page.locator(".profile").click();
		await page.getByLabel("Requester").selectOption({ label: samwise });
		await page.getByRole("button", { name: "Continue to My Tickets" }).click();
		await page.getByLabel("Search").fill(ticketNumber);
		await page.getByLabel("Search").press("Enter");
		await expect(page.getByText("No tickets match these filters")).toBeVisible();
		await page.goto(`/ticket/${ticketNumber}`);
		await expect(page.locator(".error-message")).toContainText(/not found|not authorized|owned/i);
	});

	test("E2E-03: completes the attachment lifecycle", async ({ page }) => {
		await chooseRequester(page, frodo);
		const ticketNumber = await createTicket(page, `E2E-03 ${Date.now()}`);
		await page.goto(`/ticket/${ticketNumber}`);
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles("e2e/fixtures/e2e-attachment.pdf");
		await expect(page.getByText("e2e-attachment.pdf")).toBeVisible();
		const downloadPromise = page.waitForEvent("download");
		await page.getByRole("button", { name: /Download e2e-attachment\.pdf/ }).click();
		expect((await downloadPromise).suggestedFilename()).toBe("e2e-attachment.pdf");
		page.once("dialog", (dialog) => dialog.accept("No longer needed"));
		await page.getByRole("button", { name: "Remove e2e-attachment.pdf" }).click();
		await expect(page.getByText("No longer needed")).toBeVisible();
		await expect(page.getByRole("button", { name: /Download e2e-attachment\.pdf/ })).toBeDisabled();
	});

	test("E2E-04: switches requester data and excludes inactive requesters", async ({ page }) => {
		await page.goto("/choose-requester");
		await expect(page.getByLabel("Requester").locator("option", { hasText: "Gandalf the Grey" })).toHaveCount(0);
		await chooseRequester(page, frodo);
		await page.locator(".profile").click();
		await page.getByLabel("Requester").selectOption({ label: samwise });
		await page.getByRole("button", { name: "Continue to My Tickets" }).click();
		await expect(page.locator(".profile-name span")).toHaveText(["Samwise", "Gamgee"]);
		await expect(page.getByText("Campus Wi-Fi not working")).toBeVisible();
	});
});
