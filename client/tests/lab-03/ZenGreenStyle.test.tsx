import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TopBar from "../../src/pages/TopBar";
import StaffTicketQueue from "../../src/pages/StaffTicketQueue/StaffTicketQueue";
import ConversationPanel from "../../src/pages/TicketDetail/ConversationPanel";

function response(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

describe("Lab 3 Zen Green styling", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("STYLE-01: keeps role, status, and priority badges as distinct variants", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/categories"))
          return Promise.resolve(response([{ id: 1, name: "Hardware" }]));
        if (url.includes("/api/priorities"))
          return Promise.resolve(response([{ id: 1, name: "High" }]));
        if (url.includes("/api/statuses"))
          return Promise.resolve(response([{ id: 1, name: "Open" }]));
        return Promise.resolve(
          response({
            items: [
              {
                id: 1,
                ticketNumber: "TKT-2026-000001",
                summary: "Printer issue",
                category: "Hardware",
                requestedPriority: "High",
                itPriority: "High",
                status: "Open",
                owner: null,
                requester: null,
                createdAt: "2026-09-01T00:00:00.000Z",
                updatedAt: "2026-09-01T00:00:00.000Z",
              },
            ],
            page: 1,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
          }),
        );
      }),
    );
    const { container } = render(
      <>
        <TopBar
          requester={{
            id: 1,
            name: "Frodo Baggins",
            email: "frodo@example.com",
          }}
          onChange={vi.fn()}
        />
        <StaffTicketQueue
          requester={{
            id: 1,
            name: "Sam Staff",
            email: "sam@example.com",
            isActive: true,
          }}
          onLogout={vi.fn()}
          onQueue={vi.fn()}
          onOpenTicket={vi.fn()}
        />
      </>,
    );

    expect(await screen.findByText("TKT-2026-000001")).toBeInTheDocument();
    const roleBadge = container.querySelector(".role-badge");
    const priorityBadge = container.querySelector(".badge.priority-high");
    const statusBadge = container.querySelector(".badge.status");
    expect(roleBadge).toBeInTheDocument();
    expect(priorityBadge).toBeInTheDocument();
    expect(statusBadge).toBeInTheDocument();
    expect(roleBadge?.className).not.toBe(priorityBadge?.className);
    expect(priorityBadge?.className).not.toBe(statusBadge?.className);
  });

  it("STYLE-02: gives internal notes a distinct panel and warning label", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/comments") || url.includes("/notes"))
          return Promise.resolve(response({ items: [] }));
        return Promise.resolve(response({ items: [] }));
      }),
    );
    const { container } = render(
      <ConversationPanel ticketRef="TKT-2026-000001" staff />,
    );
    await user.click(
      await screen.findByRole("tab", { name: /Internal Notes/ }),
    );

    expect(
      screen.getByText("Internal - not visible to Requester"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".conversation-empty.internal"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".conversation-compose.internal"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".conversation-list:not(.internal)"),
    ).not.toBeInTheDocument();
  });
});
