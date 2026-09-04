import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const fetchMock = vi.fn();
const requesters = [{ id: 1, name: "Frodo Baggins", email: "frodo@example.com" }];
const categories = [{ id: 1, name: "Account and Access" }];
const relatedSystems = [{ id: 1, name: "Email" }];
const priorities = [{ id: 1, name: "High", sortOrder: 1 }];

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function defaultFetch(input: RequestInfo | URL) {
  const url = String(input);
  if (url.includes("/api/dev-requesters")) return Promise.resolve(response(requesters));
  if (url.includes("/api/categories")) return Promise.resolve(response(categories));
  if (url.includes("/api/related-systems")) return Promise.resolve(response(relatedSystems));
  if (url.includes("/api/priorities")) return Promise.resolve(response(priorities));
  if (url.includes("/api/create-ticket")) return Promise.resolve(response({ data: { ticketNumber: "TKT-2026-000001" } }, 201));
  if (url.includes("/attachments")) return Promise.resolve(response({ data: [] }));
  if (url.includes("/api/tickets")) return Promise.resolve(response({ data: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }));
  return Promise.resolve(response({ data: [] }));
}

function renderCreateTicket() {
  localStorage.setItem("requesterId", "1");
  window.history.pushState({}, "", "/create-ticket");
  render(<App />);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Category"), "1");
  await user.selectOptions(screen.getByLabelText("Related System"), "1");
  await user.selectOptions(screen.getByLabelText("Requested Priority"), "1");
  await user.type(screen.getByPlaceholderText("Enter a short summary of your issue..."), "Email access issue");
}

describe("Create Ticket screen", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(defaultFetch);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("UI-01: redirects to requester selection without a selected requester", async () => {
    window.history.pushState({}, "", "/create-ticket");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Choose a requester" })).toBeInTheDocument();
  });

  it("shows the create ticket form when a requester is selected", async () => {
    renderCreateTicket();
    expect(await screen.findByRole("heading", { name: "Create Ticket" })).toBeInTheDocument();
    expect(screen.getByText("Submit a new support request.")).toBeInTheDocument();
  });

  it("navigates to create ticket from the top bar", async () => {
    localStorage.setItem("requesterId", "1");
    window.history.pushState({}, "", "/my-tickets");
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByLabelText("Create Ticket"));
    expect(await screen.findByRole("heading", { name: "Create Ticket" })).toBeInTheDocument();
  });

  it("UI-02: shows an inline summary error without calling the create API", async () => {
    const user = userEvent.setup();
    renderCreateTicket();
    await screen.findByRole("heading", { name: "Create Ticket" });
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByText("Summary is required.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/create-ticket"))).toBe(false);
  });

  it("UI-03: reports the 20-character description minimum", async () => {
    const user = userEvent.setup();
    renderCreateTicket();
    await screen.findByRole("heading", { name: "Create Ticket" });
    await fillRequiredFields(user);
    await user.type(screen.getByPlaceholderText("Describe your issue in detail..."), "1234567890123456789");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByText("Description must be 20-2000 characters.")).toBeInTheDocument();
  });

  it("UI-04: disables submit while a valid request is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: unknown) => void = () => undefined;
    const pendingCreate = new Promise((resolve) => { resolveCreate = resolve; });
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/create-ticket")) return pendingCreate;
      if (url.includes("/api/tickets/TKT-2026-000002")) {
        return Promise.resolve(response({ data: {
          ticketNumber: "TKT-2026-000002",
          createdAt: "2026-09-04T00:00:00.000Z",
          updatedAt: "2026-09-04T00:00:00.000Z",
          requester: requesters[0],
          category: categories[0],
          relatedSystem: relatedSystems[0],
          requestedPriority: priorities[0],
          currentStatus: { id: 1, name: "New", isDefault: true },
          attachments: [],
        }}));
      }
      return defaultFetch(input);
    });
    renderCreateTicket();
    await screen.findByRole("heading", { name: "Create Ticket" });
    await fillRequiredFields(user);
    await user.type(screen.getByPlaceholderText("Describe your issue in detail..."), "This description is long enough.");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled();
    resolveCreate(response({ data: { ticketNumber: "TKT-2026-000002" } }, 201));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Submitting..." })).not.toBeInTheDocument());
  });

  it("UI-05: shows a safe error and preserves values when the backend is unreachable", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((input: RequestInfo | URL) => String(input).includes("/api/create-ticket") ? Promise.reject(new Error("Network unavailable")) : defaultFetch(input));
    renderCreateTicket();
    await screen.findByRole("heading", { name: "Create Ticket" });
    await fillRequiredFields(user);
    const description = "This description is long enough.";
    await user.type(screen.getByPlaceholderText("Describe your issue in detail..."), description);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("Network unavailable")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Email access issue")).toBeInTheDocument();
    expect(screen.getByDisplayValue(description)).toBeInTheDocument();
  });

  it("UI-06: reaches every create-ticket form control with the keyboard", async () => {
    const user = userEvent.setup();
    renderCreateTicket();
    await screen.findByRole("heading", { name: "Create Ticket" });
    const controls = [
      screen.getByRole("button", { name: /Back to My Tickets/ }),
      screen.getByLabelText("Category"),
      screen.getByLabelText("Related System"),
      screen.getByLabelText("Requested Priority"),
      screen.getByPlaceholderText("Enter a short summary of your issue..."),
      screen.getByPlaceholderText("Describe your issue in detail..."),
      screen.getByRole("button", { name: "+ Add File" }),
      document.querySelector('input[type="file"]') as HTMLInputElement,
      screen.getByRole("button", { name: "Cancel" }),
      screen.getByRole("button", { name: "Submit" }),
    ];
    for (const control of controls) {
      await user.tab();
      expect(control).toHaveFocus();
    }
  });

  it("UI-07: renders generated fields as shaded, non-focusable read-only fields", async () => {
    renderCreateTicket();
    await screen.findByRole("heading", { name: "Create Ticket" });
    for (const label of ["Ticket No.", "Ticket Date", "Requester", "Current Status"]) {
      const field = screen.getByText(label).closest(".read-only");
      expect(field).toHaveClass("read-only");
      expect(field).not.toHaveAttribute("tabindex");
      expect(field?.querySelector("input, select, textarea")).toBeNull();
    }
  });
});
