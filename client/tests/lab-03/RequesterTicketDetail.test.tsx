import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const requester = {
  id: 1,
  name: "Frodo Baggins",
  email: "frodo@example.com",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};
const ticket = {
  ticketNumber: "TKT-2026-000001",
  summary: "Test ticket",
  description: "A long enough ticket description.",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  requester: { id: 1, name: requester.name },
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 1, name: "Email" },
  requestedPriority: { id: 1, name: "High" },
  currentStatus: { id: 2, name: "Open" },
  attachments: [],
};

describe("Lab 3 requester ticket detail", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("UI-21/UI-22: renders the public-comments tab and ticket detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/auth/me"))
          return Promise.resolve(response(requester));
        if (url.includes("/api/tickets/TKT-2026-000001"))
          return Promise.resolve(response({ data: ticket }));
        return Promise.resolve(response({ data: [] }));
      }),
    );
    window.history.pushState({}, "", "/ticket/TKT-2026-000001");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Ticket Details" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("tab", { name: "Public Comments" }),
    ).toBeInTheDocument();
  });

  it("UI-23/UI-30: preserves the detail surface when an attachment request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/auth/me"))
          return Promise.resolve(response(requester));
        if (url.includes("/attachments"))
          return Promise.resolve(
            response(
              { error: { message: "Unable to load data. Please try again." } },
              500,
            ),
          );
        if (url.includes("/api/tickets/TKT-2026-000001"))
          return Promise.resolve(response({ data: ticket }));
        return Promise.resolve(response({ data: [] }));
      }),
    );
    window.history.pushState({}, "", "/ticket/TKT-2026-000001");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Ticket Details" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Unable to load data. Please try again."),
    ).toBeInTheDocument();
  });
});
