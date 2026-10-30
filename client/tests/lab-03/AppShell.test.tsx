import { cleanup, render, screen } from "@testing-library/react";
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

describe("Lab 3 application shell", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("UI-24: loads an authenticated requester into the requester shell", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((input: RequestInfo | URL) =>
          String(input).includes("/api/auth/me")
            ? Promise.resolve(response(requester))
            : Promise.resolve(response({ data: [] })),
        ),
    );
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "My Tickets" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Create Ticket")).toBeInTheDocument();
  });

  it("UI-25: shows the login shell when the session expires", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ error: { code: "UNAUTHENTICATED" } }, 401),
        ),
    );
    render(<App />);
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("navigates to the role dashboard when the logo is clicked", async () => {
    window.history.replaceState({}, "", "/my-tickets");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) =>
        String(input).includes("/api/auth/me")
          ? Promise.resolve(response(requester))
          : Promise.resolve(response({ data: [] })),
      ),
    );
    const user = userEvent.setup();

    render(<App />);
    await screen.findByRole("heading", { name: "My Tickets" });
    await user.click(screen.getByRole("button", { name: "Go to dashboard" }));

    expect(window.location.pathname).toBe("/requester/dashboard");
    expect(
      await screen.findByRole("heading", { name: "Welcome, Frodo!" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["IT_STAFF", "/staff/dashboard"],
    ["ADMINISTRATOR", "/admin/dashboard"],
  ] as const)(
    "navigates %s to its dashboard when the logo is clicked",
    async (role, dashboardPath) => {
      window.history.replaceState({}, "", "/queue");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((input: RequestInfo | URL) => {
          const url = new URL(String(input));
          if (url.pathname === "/api/auth/me") {
            return Promise.resolve(response({ ...requester, role }));
          }
          if (url.pathname === "/api/staff/tickets/") {
            return Promise.resolve(
              response({
                items: [],
                page: 1,
                pageSize: 10,
                totalItems: 0,
                totalPages: 0,
              }),
            );
          }
          if (
            url.pathname === "/api/staff/dashboard" ||
            url.pathname === "/api/admin/dashboard"
          ) {
            return Promise.resolve(
              response({
                byPriority: [],
                recentTickets: [],
                userCounts: { total: 0, active: 0, byRole: [] },
              }),
            );
          }
          return Promise.resolve(response([]));
        }),
      );
      const user = userEvent.setup();

      render(<App />);
      await user.click(await screen.findByRole("button", { name: "Go to dashboard" }));

      expect(window.location.pathname).toBe(dashboardPath);
      expect(
        await screen.findByRole("heading", { name: "Welcome back, Frodo!" }),
      ).toBeInTheDocument();
    },
  );
});
