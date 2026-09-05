import { expect, test, type Page } from "@playwright/test";

declare const Buffer: { from(input: string): any };

const frodo = "Frodo Baggins";
const samwise = "Samwise Gamgee";
const screenshotViewports = [
	{ name: "normal", width: 1280, height: 900 },
	{ name: "991", width: 991, height: 900 },
	{ name: "767", width: 767, height: 900 },
] as const;

function uploadFiles(prefix: string, count: number, start = 1) {
	return Array.from({ length: count }, (_, index) => ({
		name: `${prefix}-${start + index}.pdf`,
		mimeType: "application/pdf",
		buffer: Buffer.from(`file-${prefix}-${start + index}`),
	}));
}

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
		await expect(page).toHaveURL(new RegExp(`/ticket/${ticketNumber}\\?created=1$`));
		await expect(page.getByRole("heading", { name: "Ticket Details" })).toBeVisible();
		await expect(page.getByText(`Ticket created: ${ticketNumber}`)).toBeVisible();
	});

	test("E2E-02: prevents another requester from seeing the ticket", async ({ page }, testInfo) => {
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
		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.screenshot({ path: testInfo.outputPath(`unauthorized-ticket-${viewport.name}.png`), fullPage: true });
		}
	});

	test("E2E-03: completes the attachment lifecycle", async ({ page }, testInfo) => {
		await chooseRequester(page, frodo);
		const ticketNumber = await createTicket(page, `E2E-03 ${Date.now()}`);
		await page.goto(`/ticket/${ticketNumber}`);
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles("e2e/fixtures/e2e-attachment.pdf");
		await expect(page.getByText("e2e-attachment.pdf")).toBeVisible();
		const downloadPromise = page.waitForEvent("download");
		await page.getByRole("button", { name: /Download e2e-attachment\.pdf/ }).click();
		expect((await downloadPromise).suggestedFilename()).toBe("e2e-attachment.pdf");
		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.screenshot({ path: testInfo.outputPath(`attachment-active-${viewport.name}.png`), fullPage: true });
		}
		page.once("dialog", (dialog) => dialog.accept("No longer needed"));
		await page.getByRole("button", { name: "Remove e2e-attachment.pdf" }).click();
		await expect(page.getByText("No longer needed")).toBeVisible();
		await expect(page.getByRole("button", { name: /Download e2e-attachment\.pdf/ })).toBeDisabled();
		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.screenshot({ path: testInfo.outputPath(`attachment-removed-${viewport.name}.png`), fullPage: true });
		}
	});

	test("E2E-05: shows validation errors for an invalid ticket", async ({ page }, testInfo) => {
		await chooseRequester(page, frodo);
		await page.getByRole("button", { name: /Create Ticket/ }).first().click();

		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.getByRole("button", { name: "Submit", exact: true }).click();
			await expect(page.getByText("Summary is required.")).toBeVisible();
			await expect(page.getByText("Description is required.")).toBeVisible();
			await expect(page.getByText("Please select a category.")).toBeVisible();
			await expect(page.getByText("Please select a related system.")).toBeVisible();
			await expect(page.getByText("Please select a priority.")).toBeVisible();
			await page.screenshot({ path: testInfo.outputPath(`invalid-ticket-${viewport.name}.png`), fullPage: true });
		}
	});

	test("E2E-06: searches and filters My Tickets", async ({ page }, testInfo) => {
		await chooseRequester(page, frodo);
		const summary = `E2E-06 searchable ${Date.now()}`;
		await createTicket(page, summary);
		await page.getByRole("button", { name: "My Tickets" }).click();
		await expect(page).toHaveURL(/\/my-tickets$/);

		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.getByLabel("Search").fill("E2E-06 searchable");
			await page.getByLabel("Search").press("Enter");
			await expect(page.getByText(summary)).toBeVisible();
			await page.getByLabel("Current Status").selectOption({ label: "New" });
			await expect(page.getByText(summary)).toBeVisible();
			await page.screenshot({ path: testInfo.outputPath(`my-tickets-filter-${viewport.name}.png`), fullPage: true });
			await page.getByRole("button", { name: /Clear Filters/ }).click();
		}
	});

	test("E2E-07: refills the sixth attachment slot after deleting one", async ({ page }, testInfo) => {
		await chooseRequester(page, frodo);
		const ticketNumber = await createTicket(page, `E2E-07 ${Date.now()}`);
		await page.goto(`/ticket/${ticketNumber}`);
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(uploadFiles("ticket-file", 5));
		await expect(page.getByText("ticket-file-5.pdf")).toBeVisible();

		page.once("dialog", (dialog) => dialog.accept("Replace deleted attachment"));
		await page.getByRole("button", { name: "Remove ticket-file-1.pdf" }).click();
		await expect(page.getByText("Replace deleted attachment")).toBeVisible();
		await fileInput.setInputFiles(uploadFiles("ticket-file", 1, 6));
		await expect(page.getByText("ticket-file-6.pdf")).toBeVisible();
		await expect(page.getByText("ticket-file-2.pdf")).toBeVisible();

		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.screenshot({ path: testInfo.outputPath(`ticket-sixth-after-delete-${viewport.name}.png`), fullPage: true });
		}

		await fileInput.setInputFiles(uploadFiles("ticket-file", 1, 7));
		await expect(page.getByText("Attachment limit reached. You can upload up to 5 active attachments.")).toBeVisible();
		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.screenshot({ path: testInfo.outputPath(`ticket-seventh-limit-${viewport.name}.png`), fullPage: true });
		}
	});

	test("E2E-08: captures My Tickets with a filter and no search", async ({ page }, testInfo) => {
		await chooseRequester(page, frodo);
		const summary = `E2E-08 filter only ${Date.now()}`;
		await createTicket(page, summary);
		await page.getByRole("button", { name: "My Tickets" }).click();
		await expect(page).toHaveURL(/\/my-tickets$/);

		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.getByLabel("Current Status").selectOption({ label: "New" });
			await expect(page.getByText(summary)).toBeVisible();
			await expect(page.getByLabel("Search")).toHaveValue("");
			await page.screenshot({ path: testInfo.outputPath(`my-tickets-filter-only-${viewport.name}.png`), fullPage: true });
			await page.getByRole("button", { name: /Clear Filters/ }).click();
		}
	});

	test("E2E-09: captures the seventh file limit on Create Ticket", async ({ page }, testInfo) => {
		await chooseRequester(page, frodo);
		await page.getByRole("button", { name: /Create Ticket/ }).first().click();
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(uploadFiles("create-file", 7));
		await expect(page.getByText("create-file-5.pdf")).toBeVisible();
		await expect(page.getByText("Attachment limit reached. You can upload up to 5 active attachments.")).toBeVisible();
		await expect(page.getByText("0 remaining")).toBeVisible();

		for (const viewport of screenshotViewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.screenshot({ path: testInfo.outputPath(`create-ticket-sixth-file-${viewport.name}.png`), fullPage: true });
		}
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
