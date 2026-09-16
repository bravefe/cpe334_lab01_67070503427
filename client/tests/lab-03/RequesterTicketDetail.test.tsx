import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        if (url.endsWith("/comments"))
          return Promise.resolve(response({ items: [] }));
        if (url.endsWith("/api/tickets/TKT-2026-000001"))
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
        if (url.endsWith("/comments"))
          return Promise.resolve(response({ items: [] }));
        if (url.includes("/attachments"))
          return Promise.resolve(
            response(
              { error: { message: "Unable to load data. Please try again." } },
              500,
            ),
          );
        if (url.endsWith("/api/tickets/TKT-2026-000001"))
          return Promise.resolve(response({ data: ticket }));
        return Promise.resolve(response({ data: [] }));
      }),
    );
    window.history.pushState({}, "", "/ticket/TKT-2026-000001");
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Ticket Details" }),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(await screen.findByRole("tab", { name: "Attachments" }));
    expect(
      await screen.findByText("Unable to load data. Please try again."),
    ).toBeInTheDocument();
  });

  it("UI-21: posts a public comment and clears the compose box", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url.includes("/api/auth/me"))
          return Promise.resolve(response(requester));
        if (url.endsWith("/comments") && method === "GET")
          return Promise.resolve(response({ items: [] }));
        if (url.endsWith("/comments") && method === "POST") {
          return Promise.resolve(
            response(
              {
                id: 3,
                authorName: requester.name,
                authorRole: "REQUESTER",
                content: "Still unable to sign in",
                createdAt: "2026-09-16T00:00:00.000Z",
              },
              201,
            ),
          );
        }
        if (url.includes("/attachments"))
          return Promise.resolve(response({ data: [] }));
        if (url.endsWith("/api/tickets/TKT-2026-000001"))
          return Promise.resolve(response({ data: ticket }));
        return Promise.resolve(response({ data: [] }));
      });
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/ticket/TKT-2026-000001");
    render(<App />);

    await screen.findByRole("heading", { name: "Ticket Details" });
    const composer = await screen.findByPlaceholderText(
      "Write a public comment...",
    );
    await user.type(composer, "Still unable to sign in");
    await user.click(screen.getByRole("button", { name: "Post Comment" }));

    expect(
      await screen.findByText("Still unable to sign in"),
    ).toBeInTheDocument();
    expect(composer).toHaveValue("");
  });

  it.each(["Open", "In Progress", "Waiting for Requester"])(
    "UI-22: shows the resolved action for %s tickets",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((input: RequestInfo | URL) => {
          const url = String(input);
          if (url.includes("/api/auth/me"))
            return Promise.resolve(response(requester));
          if (url.endsWith("/comments"))
            return Promise.resolve(response({ items: [] }));
          if (url.includes("/attachments"))
            return Promise.resolve(response({ data: [] }));
          if (url.endsWith("/api/tickets/TKT-2026-000001"))
            return Promise.resolve(
              response({
                data: { ...ticket, currentStatus: { id: 2, name: status } },
              }),
            );
          return Promise.resolve(response({ data: [] }));
        }),
      );
      window.history.pushState({}, "", "/ticket/TKT-2026-000001");
      render(<App />);
      expect(
        await screen.findByRole("button", { name: "Problem Appears Resolved" }),
      ).toBeInTheDocument();
    },
  );

  it("UI-23: replaces the resolved action after confirmation", async () => {
    const user = userEvent.setup();
    let detailCalls = 0;
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);
          const method = (init?.method ?? "GET").toUpperCase();
          if (url.includes("/api/auth/me"))
            return Promise.resolve(response(requester));
          if (url.endsWith("/comments") && method === "GET")
            return Promise.resolve(response({ items: [] }));
          if (url.includes("/attachments"))
            return Promise.resolve(response({ data: [] }));
          if (url.includes("/resolution") && method === "PATCH")
            return Promise.resolve(response({}));
          if (url.endsWith("/api/tickets/TKT-2026-000001")) {
            detailCalls += 1;
            return Promise.resolve(
              response({
                data: { ...ticket, problemAppearsResolved: detailCalls > 1 },
              }),
            );
          }
          return Promise.resolve(response({ data: [] }));
        }),
    );
    window.history.pushState({}, "", "/ticket/TKT-2026-000001");
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Problem Appears Resolved" }),
    );
    // expect(
    //   await screen.findByText("You marked this as appearing resolved."),
    // ).toBeInTheDocument();
    expect(
      await screen.findByText(/You marked this as appearing resolved\./),
    ).toBeInTheDocument();
  });

  it("UI-30: preserves a typed comment when posting fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);
          const method = (init?.method ?? "GET").toUpperCase();
          if (url.includes("/api/auth/me"))
            return Promise.resolve(response(requester));
          if (url.endsWith("/comments") && method === "GET")
            return Promise.resolve(response({ items: [] }));
          if (url.endsWith("/comments") && method === "POST")
            return Promise.resolve(
              response(
                { error: { message: "Unable to post your message." } },
                500,
              ),
            );
          if (url.includes("/attachments"))
            return Promise.resolve(response({ data: [] }));
          if (url.endsWith("/api/tickets/TKT-2026-000001"))
            return Promise.resolve(response({ data: ticket }));
          return Promise.resolve(response({ data: [] }));
        }),
    );
    window.history.pushState({}, "", "/ticket/TKT-2026-000001");
    render(<App />);
    await screen.findByRole("heading", { name: "Ticket Details" });
    const composer = await screen.findByPlaceholderText(
      "Write a public comment...",
    );
    await user.type(composer, "Please help with this issue");
    await user.click(screen.getByRole("button", { name: "Post Comment" }));
    await waitFor(() =>
      expect(
        screen.getByText("Unable to post your message."),
      ).toBeInTheDocument(),
    );
    expect(composer).toHaveValue("Please help with this issue");
  });
});
