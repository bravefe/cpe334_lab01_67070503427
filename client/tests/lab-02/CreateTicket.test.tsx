import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("Create Ticket screen", () => {
  it("shows the create ticket form when a requester is selected", () => {
    localStorage.setItem("requesterId", "1");
    window.history.pushState({}, "", "/create-ticket");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Create Ticket" })).toBeInTheDocument();
    expect(screen.getByText("Submit a new support request.")).toBeInTheDocument();
  });

  it("navigates to create ticket from the top bar", async () => {
    localStorage.setItem("requesterId", "1");
    window.history.pushState({}, "", "/my-tickets");

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText("Create Ticket"));

    expect(await screen.findByRole("heading", { name: "Create Ticket" })).toBeInTheDocument();
  });
});
