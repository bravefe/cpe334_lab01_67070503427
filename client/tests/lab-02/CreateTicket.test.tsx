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
});
