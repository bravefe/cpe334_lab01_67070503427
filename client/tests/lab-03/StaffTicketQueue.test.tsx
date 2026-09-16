import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import StaffTicketQueue from "../../src/pages/StaffTicketQueue/StaffTicketQueue";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const ticket = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "Cannot access email",
  category: "Account and Access",
  requestedPriority: "High",
  itPriority: "Medium",
  status: "Open",
  owner: { id: 2, name: "Sam Staff" },
  requester: { id: 1, name: "Frodo Baggins" },
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function renderQueue() {
  return render(
    <StaffTicketQueue
      requester={{
        id: 2,
        name: "Sam Staff",
        email: "sam@example.com",
        isActive: true,
      }}
      onLogout={vi.fn()}
      onQueue={vi.fn()}
      onOpenTicket={vi.fn()}
    />,
  );
}

function referenceResponse(input: RequestInfo | URL) {
  const url = String(input);
  if (url.includes("/api/categories"))
    return response([{ id: 1, name: "Account and Access" }]);
  if (url.includes("/api/priorities"))
    return response([
      { id: 1, name: "High" },
      { id: 2, name: "Medium" },
    ]);
  if (url.includes("/api/statuses"))
    return response([
      { id: 1, name: "Open" },
      { id: 2, name: "Closed" },
    ]);
  return undefined;
}

describe("Lab 3 staff ticket queue", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("UI-09: renders queue rows and columns from the response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        return Promise.resolve(
          referenceResponse(input) ??
            response({
              items: [ticket],
              page: 1,
              pageSize: 10,
              totalItems: 1,
              totalPages: 1,
            }),
        );
      }),
    );

    renderQueue();

    expect(await screen.findByText("TKT-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Cannot access email")).toBeInTheDocument();
    expect(screen.getAllByText("Account and Access").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Req\. Priority/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /IT Priority/ }),
    ).toBeInTheDocument();
  });

  it("UI-10: shows the empty queue state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) =>
        Promise.resolve(
          referenceResponse(input) ??
            response({
              items: [],
              page: 1,
              pageSize: 10,
              totalItems: 0,
              totalPages: 0,
            }),
        ),
      ),
    );

    renderQueue();

    expect(
      await screen.findByText("No tickets in the queue yet."),
    ).toBeInTheDocument();
  });

  it("UI-11: distinguishes filtered no-results and can clear filters", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      return Promise.resolve(
        referenceResponse(input) ??
          response(
            url.includes("status=Closed")
              ? {
                  items: [],
                  page: 1,
                  pageSize: 10,
                  totalItems: 0,
                  totalPages: 0,
                }
              : {
                  items: [ticket],
                  page: 1,
                  pageSize: 10,
                  totalItems: 1,
                  totalPages: 1,
                },
          ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    renderQueue();
    await screen.findByText("TKT-2026-000001");
    await user.selectOptions(screen.getByLabelText("Status"), "Closed");

    expect(
      await screen.findByText("No tickets match your search or filters."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("TKT-2026-000001")).toBeInTheDocument();
  });

  it("UI-12: sends search and filter values to the queue API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) =>
      Promise.resolve(
        referenceResponse(input) ??
          response({
            items: [ticket],
            page: 1,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
          }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderQueue();
    await screen.findByText("TKT-2026-000001");
    const search = screen.getByLabelText("Search");
    await user.type(search, "email");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes("q=email"),
        ),
      ).toBe(true),
    );
  });

  it("UI-27: shows a safe failure and preserves the current search", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (
        url.includes("/api/categories") ||
        url.includes("/api/priorities") ||
        url.includes("/api/statuses")
      )
        return Promise.resolve(referenceResponse(input));
      return Promise.resolve(
        response({ error: { message: "Unable to load the queue." } }, 500),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    renderQueue();
    const search = screen.getByLabelText("Search");
    await user.type(search, "printer");
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", { name: "Unable to load the queue." }),
    ).toBeInTheDocument();
    expect(search).toHaveValue("printer");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
