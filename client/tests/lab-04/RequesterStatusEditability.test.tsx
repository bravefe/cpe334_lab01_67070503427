import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TicketDetail from "../../src/pages/TicketDetail/TicketDetail";

const ticketApi = vi.hoisted(() => ({
  fetchTicketDetail: vi.fn(),
  markTicketResolved: vi.fn(),
  updateTicketStatus: vi.fn(),
}));

vi.mock("../../src/api/tickets", () => ticketApi);
vi.mock("../../src/pages/TicketDetail/AttachmentTicketDetail", () => ({
  default: () => null,
}));
vi.mock("../../src/pages/TicketDetail/ConversationPanel", () => ({
  default: () => null,
}));
vi.mock("../../src/pages/TicketDetail/ActionsTakenPanel", () => ({
  default: () => null,
}));

function makeTicket(currentStatus: string, allowedNextStatuses: string[]) {
  const statusId = currentStatus === "New" ? 1 : 2;
  return {
    ticketNumber: "TKT-2026-000001",
    requesterId: 1,
    summary: "Cannot access email",
    description: "Unable to access the email account.",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    category: { id: 1, name: "Account and Access" },
    requestedPriority: { id: 1, name: "High", sortOrder: 1 },
    currentStatus: { id: statusId, name: currentStatus, isDefault: false },
    requester: {
      id: 1,
      name: "Frodo Baggins",
      email: "frodo@example.com",
    },
    categoryId: 1,
    relatedSystemId: 1,
    requestedPriorityId: 1,
    currentStatusId: statusId,
    relatedSystem: { id: 1, name: "Email" },
    attachments: [],
    allowedNextStatuses,
  };
}

describe("Requester ticket status editability", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("uses API-provided transitions to enable, update, and disable the status control", async () => {
    const user = userEvent.setup();
    ticketApi.fetchTicketDetail
      .mockResolvedValueOnce(makeTicket("New", ["Cancelled"]))
      .mockResolvedValueOnce(makeTicket("Cancelled", []));
    ticketApi.updateTicketStatus.mockResolvedValue({});

    render(
      <TicketDetail
        requester={{
          id: 1,
          name: "Frodo Baggins",
          email: "frodo@example.com",
        }}
        ticketNumber="TKT-2026-000001"
        onBack={vi.fn()}
      />,
    );

    const status = await screen.findByRole("combobox", {
      name: "Current Status",
    });
    expect(status).toBeEnabled();
    expect(
      screen.getByRole("option", { name: "Cancelled" }),
    ).toBeInTheDocument();

    await user.selectOptions(status, "Cancelled");

    await waitFor(() => {
      expect(ticketApi.updateTicketStatus).toHaveBeenCalledWith(
        "TKT-2026-000001",
        "Cancelled",
        "2026-10-01T00:00:00.000Z",
      );
      expect(status).toBeDisabled();
    });
    expect(status).toHaveValue("Cancelled");
  });
});
