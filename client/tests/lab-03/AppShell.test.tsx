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
});
