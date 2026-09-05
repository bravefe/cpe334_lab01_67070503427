import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AttachmentCreateTicket from "../../src/pages/CreateTicket/AttachmentCreateTicket";
import AttachmentTicketDetail from "../../src/pages/TicketDetail/AttachmentTicketDetail";

function makeFile(name: string, size = 1024, type = "application/pdf") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("Attachment controls", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("UI-08: rejects gif or oversized PDF files before upload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AttachmentCreateTicket files={[]} onChange={onChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [makeFile("bad.gif", 100, "image/gif"), makeFile("oversized.pdf", 6 * 1024 * 1024, "application/pdf")]);

    expect(await screen.findByText("Only JPG, PNG, WEBP, and PDF files up to 5 MB are allowed.")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });

  it("UI-09: shows remaining slots and blocks the 6th file", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const files = Array.from({ length: 5 }, (_, index) => makeFile(`file-${index + 1}.pdf`, 256, "application/pdf"));
    render(<AttachmentCreateTicket files={files} onChange={onChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [makeFile("file-6.pdf", 256, "application/pdf")]);

    expect(screen.getByText("0 remaining")).toBeInTheDocument();
    expect(await screen.findByText("Attachment limit reached. You can upload up to 5 active attachments.")).toBeInTheDocument();
  });

  it("UI-10: blocks removal without a non-empty reason", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/tickets/TKT-2026-000001/attachments")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [{
            attachmentId: 1,
            originalFileName: "invoice.pdf",
            status: "ACTIVE",
            uploadedAt: "2026-09-04T00:00:00.000Z",
          }] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
    vi.stubGlobal("fetch", fetchMock);

    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("");
    render(<AttachmentTicketDetail requesterId={1} ticketNumber="TKT-2026-000001" />);

    const removeButton = await screen.findByRole("button", { name: /Remove invoice.pdf/i });
    await userEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText("Removal reason is required.")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(promptSpy).toHaveBeenCalledWith("Please enter a reason for removing this attachment:");
  });
});
