import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const fetchMock = vi.fn();
const requesters = [
  { id: 1, name: "Frodo Baggins", email: "frodo@example.com" },
  { id: 2, name: "Samwise Gamgee", email: "sam@example.com" },
];
const categories = [{ id: 1, name: "Account and Access" }];
const priorities = [{ id: 1, name: "High", sortOrder: 1 }];
const statuses = [{ id: 1, name: "New", isDefault: true }];

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function ticketPage(tickets: unknown[], totalItems = tickets.length) {
  return { data: tickets, page: 1, pageSize: 10, totalItems, totalPages: totalItems ? 1 : 0 };
}

function defaultFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input);
  if (url.includes("/api/dev-requesters")) return Promise.resolve(response(requesters));
  if (url.includes("/api/categories")) return Promise.resolve(response(categories));
  if (url.includes("/api/priorities")) return Promise.resolve(response(priorities));
  if (url.includes("/api/statuses")) return Promise.resolve(response(statuses));
  if (url.includes("/api/tickets")) return Promise.resolve(response(ticketPage([])));
  return Promise.resolve(response({ data: [] }));
}

function renderMyTickets(requesterId = "1") {
  localStorage.setItem("requesterId", requesterId);
  window.history.pushState({}, "", "/my-tickets");
  render(<App />);
}

describe("My Tickets screen", () => {
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

  it("UI-11: shows the empty state and Create Ticket CTA for a requester with no tickets", async () => {
    renderMyTickets();

    expect(await screen.findByRole("heading", { name: "No tickets yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first support request to get started.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Create Ticket/ }).length).toBeGreaterThan(0);
    expect(screen.queryByText("No tickets match these filters")).not.toBeInTheDocument();
  });

  it("UI-12: shows no-results state and clears active filters", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/tickets") && url.includes("requestedPriorityId=1")) {
        return Promise.resolve(response(ticketPage([], 0)));
      }
      return defaultFetch(input, init);
    });
    const user = userEvent.setup();
    renderMyTickets();
    await screen.findByRole("heading", { name: "No tickets yet" });

    await user.selectOptions(screen.getByLabelText("Requested Priority"), "1");

    expect(await screen.findByRole("heading", { name: "No tickets match these filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear Filters/ })).toBeInTheDocument();
    expect(screen.queryByText("No tickets yet")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Clear Filters/ }));

    expect(await screen.findByRole("heading", { name: "No tickets yet" })).toBeInTheDocument();
  });

  it("UI-13: changes requester and reloads My Tickets with the new requester", async () => {
    const ticketForRequesterTwo = {
      ticketNumber: "TKT-2026-000002",
      summary: "Samwise ticket",
      description: "A ticket belonging to the second requester.",
      createdAt: "2026-09-04T00:00:00.000Z",
      updatedAt: "2026-09-04T00:00:00.000Z",
      category: categories[0],
      requestedPriority: priorities[0],
      currentStatus: statuses[0],
      requester: requesters[1],
    };
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const requesterHeader = String((init?.headers as Record<string, string> | undefined)?.["X-Dev-Requester-Id"] ?? "");
      if (url.includes("/api/tickets") && requesterHeader === "2") {
        return Promise.resolve(response(ticketPage([ticketForRequesterTwo])));
      }
      return defaultFetch(input, init);
    });
    const user = userEvent.setup();
    renderMyTickets();
    await screen.findByRole("heading", { name: "No tickets yet" });

    await user.click(screen.getByText("Frodo"));
    expect(await screen.findByRole("heading", { name: "Choose a requester" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Requester"), "2");
    await user.click(screen.getByRole("button", { name: "Continue to My Tickets" }));

    expect(await screen.findByText("TKT-2026-000002")).toBeInTheDocument();
    expect(screen.getByText("Samwise ticket")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).includes("/api/tickets") && String((init?.headers as Record<string, string> | undefined)?.["X-Dev-Requester-Id"]) === "2")).toBe(true);
  });
});
