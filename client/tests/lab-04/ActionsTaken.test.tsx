import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionsTakenPanel from "../../src/pages/TicketDetail/ActionsTakenPanel";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const sampleActions = [
  {
    id: 1,
    ticketId: 101,
    actionAt: "2026-09-24T10:00:00.000Z",
    description: "Replaced hardware component and ran diagnostics.",
    resultId: 1,
    result: { id: 1, name: "Resolved" },
    performedBy: { id: 2, name: "Sam Staff" },
    followUpRequired: true,
    followUpNote: "Check back in 2 days to verify temperature stability.",
    attachmentNotes: "log_output.txt",
    createdAt: "2026-09-24T10:05:00.000Z",
    updatedAt: "2026-09-24T10:05:00.000Z",
  },
  {
    id: 2,
    ticketId: 101,
    actionAt: "2026-09-24T08:00:00.000Z",
    description: "Initial inspection of reported network issue.",
    resultId: 2,
    result: { id: 2, name: "In Progress" },
    performedBy: { id: 3, name: "Merry Staff" },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-09-24T08:15:00.000Z",
    updatedAt: "2026-09-24T08:15:00.000Z",
  },
];

const sampleResults = [
  { id: 1, name: "Resolved", isActive: true },
  { id: 2, name: "In Progress", isActive: true },
  { id: 3, name: "Escalated", isActive: true },
];

function setupFetchMock(actions = sampleActions, results = sampleResults) {
  return vi
    .fn()
    .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();

      if (url.includes("/api/action-results")) {
        return Promise.resolve(response(results));
      }
      if (url.includes("/actions") && method === "GET") {
        return Promise.resolve(response(actions));
      }
      return Promise.resolve(response({}));
    });
}

describe("Lab 4 Actions Taken UI Component", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("UI-01: renders read-only for Requester session with no Add or Edit controls", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    render(
      <ActionsTakenPanel
        ticketRef="TKT-2026-000001"
        role="REQUESTER"
        ticketCreatedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    expect(
      await screen.findByText(
        "Replaced hardware component and ran diagnostics.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Initial inspection of reported network issue."),
    ).toBeInTheDocument();

    // Verify no "Add Action" button exists
    expect(
      screen.queryByRole("button", { name: /Add Action/i }),
    ).not.toBeInTheDocument();

    // Verify no "Edit" buttons exist in DOM
    expect(
      screen.queryByRole("button", { name: /Edit/i }),
    ).not.toBeInTheDocument();
  });

  it("UI-02: renders defined empty state with zero records without errors", async () => {
    vi.stubGlobal("fetch", setupFetchMock([]));

    render(
      <ActionsTakenPanel
        ticketRef="TKT-2026-000001"
        role="REQUESTER"
        ticketCreatedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    expect(
      await screen.findByText("No actions recorded yet for this ticket."),
    ).toBeInTheDocument();

    // No error banners
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // No table rendered when empty
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("UI-03: disables submit button on first click and sends only one request on rapid double-click", async () => {
    let resolveCreate: (value: unknown) => void = () => undefined;
    const pendingPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });

    const postCalls: unknown[] = [];
    const fetchMock = vi
      .fn()
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("/api/action-results")) {
          return Promise.resolve(response(sampleResults));
        }
        if (url.includes("/actions") && method === "GET") {
          return Promise.resolve(response([]));
        }
        if (url.includes("/actions") && method === "POST") {
          postCalls.push(JSON.parse(String(init?.body ?? "{}")));
          return pendingPromise;
        }
        return Promise.resolve(response({}));
      });

    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <ActionsTakenPanel
        ticketRef="TKT-2026-000001"
        role="IT_STAFF"
        ticketCreatedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    console.log("sampleResults:", sampleResults);

    // Open Add Action modal
    const addBtn = await screen.findByRole("button", { name: /Add Action/i });
    await user.click(addBtn);

    // Dialog should be open
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Fill in required description
    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, "Hardware replacement complete and verified.");

    // Select result if not already selected
    const resultSelect = screen.getByLabelText(/Result/i);
    await user.selectOptions(resultSelect, "1");

    console.log("result select:", resultSelect.innerHTML);
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();

    // Rapid double click
    await user.click(saveButton);
    await user.click(saveButton);

    // Verify submit button disabled immediately and shows busy label
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent("Saving...");

    // Verify exactly one POST request fired
    expect(postCalls.length).toBe(1);

    // Clean up pending promise
    resolveCreate(
      response(
        {
          id: 99,
          ticketId: 101,
          actionAt: new Date().toISOString(),
          description: "Hardware replacement complete and verified.",
          resultId: 1,
          result: { id: 1, name: "Resolved" },
          performedBy: { id: 2, name: "Sam Staff" },
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        201,
      ),
    );
  });

  it("STYLE-01: adheres to Zen Green design tokens and CSS class conventions", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { container } = render(
      <ActionsTakenPanel
        ticketRef="TKT-2026-000001"
        role="IT_STAFF"
        ticketCreatedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    expect(
      await screen.findByText(
        "Replaced hardware component and ran diagnostics.",
      ),
    ).toBeInTheDocument();

    expect(container.querySelector(".actions-taken")).toBeInTheDocument();
    expect(container.querySelector(".actions-primary")).toBeInTheDocument();
    expect(container.querySelector(".actions-list")).toBeInTheDocument();
    expect(container.querySelector(".actions-row")).toBeInTheDocument();
    expect(container.querySelector(".action-result-badge")).toBeInTheDocument();
  });

  it("STYLE-02: pairs color with text labels and non-color cues on result badges and follow-up tags", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { container } = render(
      <ActionsTakenPanel
        ticketRef="TKT-2026-000001"
        role="IT_STAFF"
        ticketCreatedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    expect(
      await screen.findByText(
        "Replaced hardware component and ran diagnostics.",
      ),
    ).toBeInTheDocument();

    // Result badge pairs checkmark icon with text label "Resolved"
    const resultBadge = container.querySelector(".action-result-badge");
    expect(resultBadge).toBeInTheDocument();
    expect(resultBadge).toHaveTextContent("Resolved");
    expect(resultBadge).toHaveTextContent("✓");

    // Follow-up required tag pairs warning icon with text label "Required"
    const followUpRequired = container.querySelector(".follow-up-required");
    expect(followUpRequired).toBeInTheDocument();
    expect(followUpRequired).toHaveTextContent("Required");
    expect(followUpRequired).toHaveTextContent("!");
  });

  it("RESP-02: collapses table to stacked card layout with data-labels on mobile width", async () => {
    vi.stubGlobal("fetch", setupFetchMock());

    const { container } = render(
      <ActionsTakenPanel
        ticketRef="TKT-2026-000001"
        role="IT_STAFF"
        ticketCreatedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    expect(
      await screen.findByText(
        "Replaced hardware component and ran diagnostics.",
      ),
    ).toBeInTheDocument();

    // Check data-label attributes for mobile card layout
    const cells = container.querySelectorAll(".actions-cell");
    const labels = Array.from(cells)
      .map((cell) => cell.getAttribute("data-label"))
      .filter(Boolean);

    expect(labels).toContain("Action Date/Time");
    expect(labels).toContain("Description");
    expect(labels).toContain("Result");
    expect(labels).toContain("Follow-up");
    expect(labels).toContain("Performed By");
    expect(labels).toContain("Actions");
  });
});
