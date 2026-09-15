import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChangePassword from "../../src/pages/ChangePassword/ChangePassword";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("Lab 3 Change Password", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("UI-05: updates the password-rule checklist live", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const events = userEvent.setup();
    render(<ChangePassword onComplete={vi.fn()} />);
    await events.type(screen.getByLabelText("New password"), "Password123!");
    expect(screen.getByText("minLength").closest("li")).toHaveClass("valid");
    expect(screen.getByText("uppercase").closest("li")).toHaveClass("valid");
    expect(screen.getByText("lowercase").closest("li")).toHaveClass("valid");
    expect(screen.getByText("number").closest("li")).toHaveClass("valid");
    expect(screen.getByText("special").closest("li")).toHaveClass("valid");
  });

  it("UI-06: disables continuation for mismatched confirmation", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const events = userEvent.setup();
    render(<ChangePassword onComplete={vi.fn()} />);
    await events.type(
      screen.getByLabelText("Current password"),
      "Password123!",
    );
    await events.type(screen.getByLabelText("New password"), "NewPassword123!");
    await events.type(
      screen.getByLabelText("Confirm password"),
      "Different123!",
    );
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save password" }),
    ).toBeDisabled();
  });

  it("UI-07: submits a valid password change and completes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ user: { mustChangePassword: false } }));
    vi.stubGlobal("fetch", fetchMock);
    const onComplete = vi.fn();
    const events = userEvent.setup();
    render(<ChangePassword onComplete={onComplete} />);
    await events.type(
      screen.getByLabelText("Current password"),
      "Password123!",
    );
    await events.type(screen.getByLabelText("New password"), "NewPassword123!");
    await events.type(
      screen.getByLabelText("Confirm password"),
      "NewPassword123!",
    );
    await events.click(screen.getByRole("button", { name: "Save password" }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/change-password"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("UI-08: keeps the form usable after a failed voluntary change", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response(
            { error: { message: "Current password is incorrect." } },
            401,
          ),
        ),
    );
    const events = userEvent.setup();
    render(<ChangePassword onComplete={vi.fn()} />);
    await events.type(
      screen.getByLabelText("Current password"),
      "WrongPassword123!",
    );
    await events.type(screen.getByLabelText("New password"), "NewPassword123!");
    await events.type(
      screen.getByLabelText("Confirm password"),
      "NewPassword123!",
    );
    await events.click(screen.getByRole("button", { name: "Save password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Current password is incorrect.",
    );
    expect(screen.getAllByDisplayValue("NewPassword123!")).toHaveLength(2);
  });
});
