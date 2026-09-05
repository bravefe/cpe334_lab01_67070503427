import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const fetchMock = vi.fn();
const requester = { id: 1, name: "Frodo Baggins", email: "frodo@example.com" };
const category = { id: 1, name: "Account and Access" };
const relatedSystem = { id: 1, name: "Email" };
const priority = { id: 1, name: "High", sortOrder: 1 };
const status = { id: 1, name: "New", isDefault: true };

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderTicketDetail(ticketNumber = "TKT-2026-000001") {
  localStorage.setItem("requesterId", "1");
  window.history.pushState({}, "", `/ticket/${ticketNumber}`);
  render(<App />);
}

describe("Requester ticket detail attachments", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("UI-15: adds a valid attachment from ticket detail without reload", async () => {
    const user = userEvent.setup();
    const uploadedAttachment = {
      attachmentId: 10,
      originalFileName: "new-attachment.png",
      status: "ACTIVE",
      uploadedAt: "2026-09-04T00:00:00.000Z",
    };

    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();

      if (url.includes("/api/dev-requesters")) return Promise.resolve(response([requester]));
      if (url.includes("/api/categories")) return Promise.resolve(response([category]));
      if (url.includes("/api/related-systems")) return Promise.resolve(response([relatedSystem]));
      if (url.includes("/api/priorities")) return Promise.resolve(response([priority]));
      if (url.includes("/api/tickets/TKT-2026-000001") && method === "GET") {
        return Promise.resolve(response({
          data: {
            ticketNumber: "TKT-2026-000001",
            requesterId: 1,
            summary: "Ticket detail attachment upload",
            description: "This description is long enough to be valid.",
            createdAt: "2026-09-04T00:00:00.000Z",
            updatedAt: "2026-09-04T00:00:00.000Z",
            category,
            relatedSystem,
            requestedPriority: priority,
            currentStatus: status,
            requester,
            categoryId: 1,
            relatedSystemId: 1,
            requestedPriorityId: 1,
            currentStatusId: 1,
            attachments: [],
          },
        }));
      }
      if (url.includes("/api/tickets/TKT-2026-000001/attachments") && method === "GET") {
        return Promise.resolve(response({ data: [] }));
      }
      if (url.includes("/api/tickets/TKT-2026-000001/attachments") && method === "POST") {
        return Promise.resolve(response({ data: uploadedAttachment }, 201));
      }

      return Promise.resolve(response({ data: [] }));
    });

    renderTicketDetail();

    await screen.findByRole("heading", { name: "Ticket Details" });
    const file = new File(["png-content"], "new-attachment.png", { type: "image/png" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, file);

    expect(await screen.findByRole("button", { name: /Download new-attachment.png/i })).toBeInTheDocument();
    expect(screen.getByText("new-attachment.png")).toBeInTheDocument();
    expect(screen.queryByText("Loading ticket...")).not.toBeInTheDocument();
  });

  it("UI-16: renders a removed attachment with reason and removal time", async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();

      if (url.includes("/api/dev-requesters")) return Promise.resolve(response([requester]));
      if (url.includes("/api/categories")) return Promise.resolve(response([category]));
      if (url.includes("/api/related-systems")) return Promise.resolve(response([relatedSystem]));
      if (url.includes("/api/priorities")) return Promise.resolve(response([priority]));
      if (url.includes("/api/tickets/TKT-2026-000001/attachments") && method === "GET") {
        return Promise.resolve(response({
          data: [{
            attachmentId: 7,
            originalFileName: "removed.pdf",
            status: "REMOVED",
            uploadedAt: "2026-09-04T00:00:00.000Z",
            removedAt: "2026-09-04T01:00:00.000Z",
            removalReason: "No longer needed",
          }],
        }));
      }
      if (url.includes("/api/tickets/TKT-2026-000001") && method === "GET") {
        return Promise.resolve(response({
          data: {
            ticketNumber: "TKT-2026-000001",
            requesterId: 1,
            summary: "Ticket detail attachment removed",
            description: "This description is long enough to be valid.",
            createdAt: "2026-09-04T00:00:00.000Z",
            updatedAt: "2026-09-04T00:00:00.000Z",
            category,
            relatedSystem,
            requestedPriority: priority,
            currentStatus: status,
            requester,
            categoryId: 1,
            relatedSystemId: 1,
            requestedPriorityId: 1,
            currentStatusId: 1,
            attachments: [{
              attachmentId: 7,
              originalFileName: "removed.pdf",
              status: "REMOVED",
              uploadedAt: "2026-09-04T00:00:00.000Z",
              removedAt: "2026-09-04T01:00:00.000Z",
              removalReason: "No longer needed",
            }],
          },
        }));
      }

      return Promise.resolve(response({ data: [] }));
    });

    renderTicketDetail();

    await screen.findByRole("heading", { name: "Ticket Details" });
    const removedRow = screen.getByText("removed.pdf").closest(".attachment-row");
    const downloadButton = screen.getByRole("button", { name: /Download removed.pdf/i });

    expect(removedRow).toHaveClass("removed");
    expect(downloadButton).toBeDisabled();
    expect(screen.getAllByText("No longer needed").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Removed at:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Removed").length).toBeGreaterThan(0);
  });
});
