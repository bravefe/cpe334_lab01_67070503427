import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Login from "../../src/pages/Login/Login";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const user = {
  id: 1,
  name: "Frodo Baggins",
  email: "frodo.b@shiremail.example.com",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};

describe("Lab 3 Login", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("UI-01: shows generic invalid-credential feedback and re-masks the password", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response({ error: { code: "INVALID_CREDENTIALS" } }, 401),
      );
    vi.stubGlobal("fetch", fetchMock);
    const events = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);
    await events.type(screen.getByLabelText("Email"), "frodo@example.com");
    await events.type(screen.getByLabelText("Password"), "wrong");
    // await events.click(screen.getByRole("button", { name: "Show password" }));
    await events.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("UI-02: shows the busy state while login is pending", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const pending = new Promise((done) => {
      resolve = done;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));
    const events = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);
    await events.type(screen.getByLabelText("Email"), "frodo@example.com");
    await events.type(screen.getByLabelText("Password"), "Password123!");
    await events.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Signing In…" })).toBeDisabled();
    resolve(response({ user }));
  });

  it("UI-03: shows the inactive-account banner", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ error: { code: "ACCOUNT_INACTIVE" } }, 403),
        ),
    );
    const events = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);
    await events.type(screen.getByLabelText("Email"), "inactive@example.com");
    await events.type(screen.getByLabelText("Password"), "Password123!");
    await events.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This account is inactive.",
    );
  });

  it("UI-04: validates empty fields without a network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const events = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);
    await events.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("UI-26: maps unexpected failures to safe copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response(
            { error: { code: "INTERNAL_ERROR", message: "stack trace" } },
            500,
          ),
        ),
    );
    const events = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);
    await events.type(screen.getByLabelText("Email"), "frodo@example.com");
    await events.type(screen.getByLabelText("Password"), "Password123!");
    await events.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to sign in. Please try again.",
      ),
    );
    expect(screen.queryByText("stack trace")).not.toBeInTheDocument();
  });
});
