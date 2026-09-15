import { Attachment } from "../lib/attachments";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function headers(): HeadersInit {
  return { "X-Requested-With": "TokTickIT" };
}

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => undefined);
  return payload?.error?.message ?? fallback;
}

export async function fetchAttachments(ticketNumber: string) {
  const response = await fetch(
    `${API_URL}/api/tickets/${encodeURIComponent(ticketNumber)}/attachments`,
    { credentials: "include", headers: headers() },
  );
  if (!response.ok)
    throw new Error(await readError(response, "Unable to load attachments."));
  const payload = (await response.json()) as
    | Attachment[]
    | { data?: Attachment[] };
  return {
    data: Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : [],
  };
}

export async function uploadAttachment(ticketNumber: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(
    `${API_URL}/api/tickets/${encodeURIComponent(ticketNumber)}/attachments`,
    {
      method: "POST",
      credentials: "include",
      headers: headers(),
      body,
    },
  );
  if (!response.ok)
    throw new Error(await readError(response, "Unable to upload attachment."));
  const result = (await response.json()) as { data: Attachment };
  return result.data;
}

export async function downloadAttachment(
  attachmentId: number,
  fileName: string,
) {
  const response = await fetch(
    `${API_URL}/api/attachments/${attachmentId}/download`,
    { credentials: "include", headers: headers() },
  );
  if (!response.ok)
    throw new Error(
      await readError(response, "Unable to download attachment."),
    );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function removeAttachment(attachmentId: number, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new Error("Removal reason is required.");

  const response = await fetch(
    `${API_URL}/api/attachments/${attachmentId}/remove`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason: trimmedReason }),
    },
  );
  if (!response.ok)
    throw new Error(await readError(response, "Unable to remove attachment."));
  const result = (await response.json()) as { data: Attachment };
  return result.data;
}
