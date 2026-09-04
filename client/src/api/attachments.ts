import { Attachment } from "../lib/attachments";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function headers(requesterId: number): HeadersInit {
  return { "X-Dev-Requester-Id": String(requesterId) };
}

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => undefined);
  return payload?.error?.message ?? fallback;
}

export async function fetchAttachments(requesterId: number, ticketNumber: string) {
  const response = await fetch(`${API_URL}/api/tickets/${encodeURIComponent(ticketNumber)}/attachments`, { headers: headers(requesterId) });
  if (!response.ok) throw new Error(await readError(response, "Unable to load attachments."));
  return response.json() as Promise<{ data: Attachment[] }>;
}

export async function uploadAttachment(requesterId: number, ticketNumber: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/tickets/${encodeURIComponent(ticketNumber)}/attachments`, {
    method: "POST", headers: headers(requesterId), body,
  });
  if (!response.ok) throw new Error(await readError(response, "Unable to upload attachment."));
  const result = await response.json() as { data: Attachment };
  return result.data;
}

export async function downloadAttachment(requesterId: number, attachmentId: number, fileName: string) {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, { headers: headers(requesterId) });
  if (!response.ok) throw new Error(await readError(response, "Unable to download attachment."));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function removeAttachment(requesterId: number, attachmentId: number, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new Error("Removal reason is required.");

  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/remove`, {
    method: "PATCH", headers: { ...headers(requesterId), "Content-Type": "application/json" },
    body: JSON.stringify({ reason: trimmedReason }),
  });
  if (!response.ok) throw new Error(await readError(response, "Unable to remove attachment."));
  const result = await response.json() as { data: Attachment };
  return result.data;
}