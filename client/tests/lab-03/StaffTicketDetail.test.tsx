import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import StaffTicketDetail from "../../src/pages/StaffTicketDetail/StaffTicketDetail";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const ticket = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "Cannot access email",
  description: "A detailed description.",
  category: "Account and Access",
  requestedPriority: "High",
  itPriority: "Medium",
  status: "In Progress",
  owner: { id: 2, name: "Sam Staff" },
  requester: { id: 1, name: "Frodo Baggins" },
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  resolutionSummary: "",
};

function renderDetail(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("fetch", fetchMock);
  return render(
    <StaffTicketDetail
      requester={{
        id: 2,
        name: "Sam Staff",
        email: "sam@example.com",
        isActive: true,
      }}
      ticketRef={ticket.ticketNumber}
      onLogout={vi.fn()}
      onQueue={vi.fn()}
    />,
  );
}

function defaultFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  if (url.includes("/comments") || url.includes("/notes"))
    return response({ items: [] });
  if (url.includes("/attachments")) return response({ data: [] });
  if (url.endsWith("/api/staff/tickets/TKT-2026-000001") && method === "GET")
    return response(ticket);
  return response(ticket);
}

describe("Lab 3 staff ticket detail", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("UI-13: only renders legal next status options", async () => {
    renderDetail(vi.fn().mockImplementation(defaultFetch));

    const status = await screen.findByLabelText("Current Status");
    expect(
      Array.from(status.querySelectorAll("option")).map(
        (option) => option.textContent,
      ),
    ).toEqual([
      "In Progress",
      "Waiting for Requester",
      "Resolved",
      "Cancelled",
    ]);
  });

  it("UI-14: distinguishes Internal Notes from Public Comments", async () => {
    const user = userEvent.setup();
    const { container } = renderDetail(
      vi.fn().mockImplementation(defaultFetch),
    );

    await screen.findByLabelText("Current Status");
    await user.click(screen.getByRole("tab", { name: /Internal Notes/ }));

    expect(
      screen.getByText("Internal - not visible to Requester"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Add Internal Note")).toBeInTheDocument();
    expect(
      container.querySelector(".conversation-compose.internal"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Internal - not visible to Requester").parentElement,
    ).toHaveClass("conversation-panel");
  });

  it("resizes detail textareas when the viewport changes size", async () => {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return 160;
      },
    });

    renderDetail(vi.fn().mockImplementation(defaultFetch));
    const description = await screen.findByLabelText("Description");
    expect(description.style.height).toBe("160px");

    Object.defineProperty(description, "scrollHeight", {
      configurable: true,
      get: () => 220,
    });

    window.dispatchEvent(new Event("resize"));

    await waitFor(() => {
      expect(description.style.height).toBe("220px");
    });
  });

  it("UI-15: blocks Resolved without a resolution summary", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation(defaultFetch);
    renderDetail(fetchMock);

    const status = await screen.findByLabelText("Current Status");
    await user.selectOptions(status, "Resolved");

    const warning = await screen.findByRole("alert");
    expect(warning).toHaveTextContent(
      "Resolution Summary is required when resolving a ticket.",
    );
    expect(warning).toHaveClass("warning-banner");
    expect(warning).not.toHaveClass("error-banner");
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
    ).toBe(false);
  });

  it("UI-16: confirms final status changes before sending", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation(defaultFetch);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderDetail(fetchMock);

    const status = await screen.findByLabelText("Current Status");
    await user.selectOptions(status, "Cancelled");

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("mark this ticket cancelled"),
    );
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
    ).toBe(false);
  });

  it("UI-28: preserves a saved owner when a later status update fails", async () => {
    const user = userEvent.setup();
    const updatedTicket = { ...ticket, owner: { id: 3, name: "Alex Staff" } };
    const fetchMock = vi
      .fn()
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url.includes("/comments") || url.includes("/notes"))
          return response({ items: [] });
        if (
          url.endsWith("/api/staff/tickets/TKT-2026-000001") &&
          method === "GET"
        )
          return response(ticket);
        if (url.endsWith("/owner") && method === "PATCH")
          return response(updatedTicket);
        if (url.endsWith("/status") && method === "PATCH")
          return response(
            {
              error: {
                message: "That status change isn't allowed from In Progress.",
              },
            },
            409,
          );
        if (url.includes("/attachments")) return response({ data: [] });
        return response({});
      });
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderDetail(fetchMock);

    const owner = await screen.findByLabelText("Ticket Owner");
    await user.selectOptions(owner, "2");
    await waitFor(() =>
      expect(screen.getByDisplayValue("Alex Staff")).toBeInTheDocument(),
    );

    const status = screen.getByLabelText("Current Status");
    await user.selectOptions(status, "Cancelled");

    expect(
      await screen.findByText(
        "That status change isn't allowed from In Progress.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alex Staff")).toBeInTheDocument();
  });
});
