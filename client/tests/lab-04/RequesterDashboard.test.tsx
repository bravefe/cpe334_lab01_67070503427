import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTickets } from "../../src/api/tickets";
import Dashboard from "../../src/pages/Dashboard/Dashboard";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    json: async () => body,
  };
}

describe("Lab 4 Requester Dashboard", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("UI-05: renders zero metrics without an error when the requester has no tickets", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        totalOpen: 0,
        waitingForYou: 0,
        recentlyResolved: 0,
        closed: 0,
        recentTickets: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <Dashboard
        requester={{
          id: 1,
          name: "Frodo Baggins",
          email: "frodo@example.com",
          role: "REQUESTER",
        }}
      />,
    );

    for (const label of [
      "Total Open",
      "Waiting for You",
      "Recently Resolved",
      "Closed",
    ]) {
      expect(
        await screen.findByRole("button", {
          name: `${label}: 0. View tickets`,
        }),
      ).toBeInTheDocument();
    }

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/requester/dashboard",
      expect.objectContaining({ method: "GET" }),
    );

    await fetchTickets({
      search: "",
      sortBy: "createdAt",
      sortDir: "desc",
      page: 1,
      pageSize: 10,
    });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const url = new URL(String(input));
          return url.pathname === "/api/tickets/";
        }),
      ).toBe(true);
    });
  });
});
