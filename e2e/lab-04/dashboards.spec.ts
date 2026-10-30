import { expect, test, type Page } from "@playwright/test";

const password = "Password123!";

async function signIn(page: Page, email: string) {
  await page.goto("/");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(
    /\/(requester\/dashboard|staff\/dashboard|my-tickets|queue|admin\/users)$/,
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

test("E2E-03: resolution gate unlocks and requester/staff dashboard drill-downs update", async ({
  page,
}) => {
  await signIn(page, "frodo.b@shiremail.example.com");
  await page.goto("/create-ticket");
  await page
    .getByLabel("Category")
    .selectOption({ label: "Account and Access" });
  await page.getByLabel("Related System").selectOption({ label: "Email" });
  await page.getByLabel("Requested Priority").selectOption({ label: "Medium" });

  const summary = `E2E-03 dashboard resolution ${Date.now()}`;
  await page.getByLabel("Summary").fill(summary);
  await page
    .getByLabel("Description")
    .fill(
      "Verify resolution gate and dashboard drill-down behavior end to end.",
    );
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/\/ticket\/TKT-\d{4}-\d{6}/);
  const ticketNumber = new URL(page.url()).pathname.split("/").pop();
  expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

  await page.goto("/requester/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome, Frodo!" }),
  ).toBeVisible();
  const requesterOpenBefore = await dashboardMetric(page, "Total Open");
  const requesterResolvedBefore = await dashboardMetric(
    page,
    "Recently Resolved",
  );

  await signOut(page);
  await signIn(page, "arwen@rivendell.example.com");
  await page.goto("/staff/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Arwen!" }),
  ).toBeVisible();
  const staffNewBefore = await dashboardMetric(page, "New");
  const staffInProgressBefore = await dashboardMetric(page, "In Progress");

  await page.getByRole("button", { name: /^New: \d+\. View tickets$/ }).click();
  await expect(page).toHaveURL(/\/queue\?status=New$/);
  await page.getByLabel("Search").fill(ticketNumber!);
  await page.getByLabel("Search").press("Enter");
  await page.getByText(ticketNumber!, { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ticket Detail" }),
  ).toBeVisible();

  await page.getByLabel("Ticket Owner").selectOption({ label: "Claim for me" });
  await expect(page.getByText("Owner updated.")).toBeVisible();

  const status = page.getByLabel("Current Status");
  await status.selectOption("Open");
  await expect(status).toHaveValue("Open");
  await status.selectOption("In Progress");
  await expect(status).toHaveValue("In Progress");

  const resolvedOption = status.locator('option[value="Resolved"]');
  await expect(page.getByText(/Resolved is unavailable until/i)).toBeVisible();

  const staffTicketUrl = `http://localhost:3000/api/staff/tickets/${ticketNumber}`;
  const staffTicketResponse = await page.context().request.get(staffTicketUrl);
  expect(staffTicketResponse.ok()).toBe(true);
  const staffTicket = await staffTicketResponse.json();
  const blockedResolution = await page
    .context()
    .request.patch(`${staffTicketUrl}/status`, {
      data: {
        toStatus: "Resolved",
        updatedAt: staffTicket.updatedAt,
        resolutionSummary: "Gate check before recording a resolved action.",
      },
      headers: { "X-Requested-With": "TokTickIT" },
    });
  expect(blockedResolution.status()).toBe(409);
  expect(await blockedResolution.json()).toMatchObject({
    error: { code: "RESOLVED_GATE" },
  });
  await expect(status).toHaveValue("In Progress");

  await page.getByRole("tab", { name: "Service Actions" }).click();
  await expect(
    page.getByRole("heading", { name: "Actions Taken" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add Action" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(`E2E-03 Resolved action for ${ticketNumber}`);
  await dialog.getByLabel("Result").selectOption({ label: "Resolved" });
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(resolvedOption).toBeEnabled();

  await page
    .getByLabel("Resolution Summary")
    .fill("Issue resolved after recording the required service action.");
  page.once("dialog", (dialogEvent) => void dialogEvent.accept());
  await status.selectOption("Resolved");
  await expect(status).toHaveValue("Resolved");

  await page.goto("/staff/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Arwen!" }),
  ).toBeVisible();
  expect(await dashboardMetric(page, "New")).toBe(staffNewBefore - 1);
  expect(await dashboardMetric(page, "In Progress")).toBe(
    staffInProgressBefore,
  );
  await page
    .getByRole("button", { name: /^In Progress: \d+\. View tickets$/ })
    .click();
  await expect(page).toHaveURL(/\/queue\?status=In%20Progress$/);
  await expect(page.getByLabel("Status")).toHaveValue("In Progress");
  await expect(page.getByText(ticketNumber!, { exact: true })).toHaveCount(0);

  await signOut(page);
  await signIn(page, "frodo.b@shiremail.example.com");
  await page.goto("/requester/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome, Frodo!" }),
  ).toBeVisible();
  expect(await dashboardMetric(page, "Total Open")).toBe(
    requesterOpenBefore - 1,
  );
  expect(await dashboardMetric(page, "Recently Resolved")).toBe(
    requesterResolvedBefore + 1,
  );

  await page
    .getByRole("button", {
      name: /^Recently Resolved: \d+\. View tickets$/,
    })
    .click();

  await expect(page).toHaveURL(/\/my-tickets/);

  // Manually apply the status filter
  const currentStatus = page.getByLabel("Current Status");
  await currentStatus.selectOption({ label: "Resolved" });
  await currentStatus.selectOption({ label: "Resolved" });

  await expect(currentStatus.locator("option:checked")).toHaveText("Resolved");
});
