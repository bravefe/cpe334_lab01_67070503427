import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// import * as api from "../../src/api.js";
import App from "../../src/App.js";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // WORKED EXAMPLE — provided for you.
  // it("renders the TokTickIT heading", () => {
  //   render(<App />);
  //   expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  // });

  // Issue 4 — write these yourself. Hint: mock the api module with
  // vi.spyOn(api, "checkSystem").mockResolvedValue(...) / .mockRejectedValue(...)
  // then click the button and assert the Online list / Offline message.

  it.todo("shows Online and the seeded categories on success")
  it.todo("shows an Offline error message when the API is unavailable")

  // it("shows Online and the seeded categories on success", async () => {
  //   const categories = [
  //     { id: 1, name: "Account and Access" },
  //     { id: 2, name: "Hardware" },
  //     { id: 3, name: "Software" },
  //     { id: 4, name: "Network" },
  //   ];

  //   vi.spyOn(api, "checkSystem").mockResolvedValue({
  //     online: true,
  //     categories,
  //   });

  //   render(<App />);
  //   const user = userEvent.setup();
  //   await user.click(screen.getByRole("button", { name: /check system/i }));

  //   expect(await screen.findByText(/System Status: Online/i)).toBeInTheDocument();
  //   const items = await screen.findAllByRole("listitem");
  //   expect(items).toHaveLength(4);
  //   expect(screen.getByText("Account and Access")).toBeInTheDocument();
  //   expect(screen.getByText("Hardware")).toBeInTheDocument();
  //   expect(screen.getByText("Software")).toBeInTheDocument();
  //   expect(screen.getByText("Network")).toBeInTheDocument();
  // });

  // it("shows an Offline error message when the API is unavailable", async () => {
  //   vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Unable to connect"));

  //   render(<App />);
  //   const user = userEvent.setup();
  //   await user.click(screen.getByRole("button", { name: /check system/i }));

  //   expect(await screen.findByText(/System Status: Offline/i)).toBeInTheDocument();
  // });

});
