import { cleanup, render, screen } from "@testing-library/react";
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

/**
 * This ticket has Actions Taken records, but none of them
 * have the "Resolved" result.
 */
const actionsWithoutResolvedGate = [
  {
    id: 1,
    ticketId: 1,
    actionAt: "2026-09-24T08:00:00.000Z",
    description: "Initial inspection of reported network issue.",
    resultId: 2,
    result: {
      id: 2,
      name: "In Progress",
    },
    performedBy: {
      id: 3,
      name: "Merry Staff",
    },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-09-24T08:15:00.000Z",
    updatedAt: "2026-09-24T08:15:00.000Z",
  },
];

function defaultFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();

  // Ticket detail
  if (url.endsWith("/api/staff/tickets/TKT-2026-000001") && method === "GET") {
    return Promise.resolve(response(ticket));
  }

  // Actions Taken
  if (
    url.endsWith("/api/staff/tickets/TKT-2026-000001/actions") &&
    method === "GET"
  ) {
    return Promise.resolve(response(actionsWithoutResolvedGate));
  }

  // Comments / Internal Notes
  if (url.includes("/comments") || url.includes("/notes")) {
    return Promise.resolve(response({ items: [] }));
  }

  // Attachments
  if (url.includes("/attachments")) {
    return Promise.resolve(response({ data: [] }));
  }

  // Prevent an accidental status update from succeeding.
  if (
    url.endsWith("/api/staff/tickets/TKT-2026-000001/status") &&
    method === "PATCH"
  ) {
    return Promise.resolve(
      response(
        {
          error: {
            message:
              "Resolved status requires a Resolved Actions Taken record.",
          },
        },
        409,
      ),
    );
  }

  return Promise.resolve(response({}));
}

describe("Lab 4 TicketWorkflow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("UI-04: disables Resolved when the ticket has no Resolved-gate action", async () => {
    const fetchMock = vi.fn().mockImplementation(defaultFetch);
    vi.stubGlobal("fetch", fetchMock);

    render(
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

    const resolvedOption = await screen.findByRole("option", {
      name: "Resolved",
    });

    const status = resolvedOption.parentElement as HTMLSelectElement;

    expect(resolvedOption).toBeInTheDocument();
    expect(resolvedOption).toBeDisabled();
    expect(status).toHaveValue("In Progress");
    // The UI should explain why Resolved is disabled.
    expect(
      screen.getByText(/Resolved.*action|action.*Resolved|Resolved.*required/i),
    ).toBeInTheDocument();

    // No status PATCH should have been sent.
    expect(
      fetchMock.mock.calls.some(([input, init]) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        return (
          method === "PATCH" &&
          url.endsWith("/api/staff/tickets/TKT-2026-000001/status")
        );
      }),
    ).toBe(false);
  });
});
