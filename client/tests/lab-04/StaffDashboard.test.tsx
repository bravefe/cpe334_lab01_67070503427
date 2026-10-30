import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../../src/pages/Dashboard/Dashboard";
import StaffTicketQueue from "../../src/pages/StaffTicketQueue/StaffTicketQueue";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    json: async () => body,
  };
}

describe("Lab 4 Staff Dashboard", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("UI-06: clicking Unassigned opens a pre-filtered queue using the staff ticket API", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/staff/dashboard") {
        return Promise.resolve(
          response({
            unassigned: 3,
            myAssigned: 2,
            new: 1,
            open: 1,
            inProgress: 2,
            waitingForRequester: 0,
            byPriority: [],
            recentTickets: [],
          }),
        );
      }

      if (url.pathname === "/api/priorities") {
        return Promise.resolve(
          response([{ id: 1, name: "High", sortOrder: 1 }]),
        );
      }

      if (
        url.pathname === "/api/categories" ||
        url.pathname === "/api/statuses"
      ) {
        return Promise.resolve(response([]));
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

      return Promise.resolve(response({}));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <Dashboard
        requester={{
          id: 2,
          name: "Sam Staff",
          email: "sam@example.com",
          role: "IT_STAFF",
        }}
      />,
    );

    const unassignedCard = await screen.findByRole("button", {
      name: "Unassigned: 3. View tickets",
    });
    await user.click(unassignedCard);

    expect(window.location.pathname).toBe("/queue");
    expect(window.location.search).toBe("?filter=unassigned");

    render(
      <StaffTicketQueue
        requester={{
          id: 2,
          name: "Sam Staff",
          email: "sam@example.com",
          role: "IT_STAFF",
        }}
        onOpenTicket={vi.fn()}
      />,
    );

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(([input]) => {
        const url = new URL(String(input));
        return url.pathname === "/api/staff/tickets/";
      });

      expect(request).toBeDefined();
      const queueUrl = new URL(String(request?.[0]));
      expect(queueUrl.searchParams.get("owner")).toBe("unassigned");
    });

    expect(screen.getByLabelText("Owner")).toHaveValue("unassigned");
  });

  it("opens a recent ticket using its public ticket number", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/staff/dashboard") {
        return Promise.resolve(
          response({
            unassigned: 0,
            myAssigned: 0,
            new: 0,
            open: 0,
            inProgress: 0,
            waitingForRequester: 0,
            byPriority: [],
            recentTickets: [
              {
                id: 14,
                ticketNumber: "TKT-2026-000014",
                title: "Unable to access email",
                status: "Open",
                updatedAt: "2026-10-30T00:00:00.000Z",
              },
            ],
          }),
        );
      }

      return Promise.resolve(response([]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <Dashboard
        requester={{
          id: 2,
          name: "Sam Staff",
          email: "sam@example.com",
          role: "IT_STAFF",
        }}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /TKT-2026-000014/ }),
    );

    expect(window.location.pathname).toBe("/queue/TKT-2026-000014");
  });

  it("RESP-01: dashboard metric grids reflow at desktop, tablet, and mobile breakpoints", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/staff/dashboard") {
        return Promise.resolve(
          response({
            unassigned: 3,
            myAssigned: 2,
            new: 1,
            open: 1,
            inProgress: 2,
            waitingForRequester: 0,
            byPriority: [],
            recentTickets: [],
          }),
        );
      }

      if (url.pathname === "/api/priorities") {
        return Promise.resolve(
          response([{ id: 1, name: "High", sortOrder: 1 }]),
        );
      }

      return Promise.resolve(response([]));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(
      <Dashboard
        requester={{
          id: 2,
          name: "Sam Staff",
          email: "sam@example.com",
          role: "IT_STAFF",
        }}
      />,
    );

    expect(
      await screen.findByRole("button", {
        name: "Waiting for Requester: 0. View tickets",
      }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".dash-grid-6 > .dash-card")).toHaveLength(
      6,
    );

    const styles = readFileSync(
      resolve(process.cwd(), "src/pages/Dashboard/Dashboard.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /\.dash-grid-6\s*\{\s*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(styles).toMatch(
      /\.dash-grid-4\s*\{\s*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(styles).toMatch(/\.dash-grid\s*\{\s*display:\s*grid;\s*gap:\s*16px/);
    expect(styles).toMatch(
      /@media \(min-width:\s*768px\) and \(max-width:\s*1199px\)[\s\S]*?\.dash-grid-6\s*\{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(styles).toMatch(
      /@media \(min-width:\s*768px\) and \(max-width:\s*1199px\)[\s\S]*?\.dash-grid-4\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(styles).toMatch(
      /@media \(max-width:\s*767px\)[\s\S]*?\.dash-grid-6,\s*\.dash-grid-4[\s\S]*?grid-template-columns:\s*1fr/,
    );
    expect(styles).toMatch(/\.dashboard-page\s*\{\s*width:\s*min\(100% - 48px/);
    expect(styles).toMatch(
      /@media \(max-width:\s*767px\)[\s\S]*?\.dashboard-page\s*\{\s*width:\s*min\(100% - 32px/,
    );
  });
});
