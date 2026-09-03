import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getPrisma } from "../prisma.js";

export const uploadDirectory = path.resolve(process.cwd(), "uploads");
export const maxFileSize = 5 * 1024 * 1024;

export async function ownedTicket(ticketNumber: string, requesterId: number) {
  return getPrisma().ticket.findFirst({ where: { ticketNumber, requesterId } });
}

export function formatAttachment(attachment: { id: number; originalFileName: string; status: "ACTIVE" | "REMOVED"; uploadedAt: Date; removedAt: Date | null; removalReason: string | null }) {
  return {
    attachmentId: attachment.id,
    originalFileName: attachment.originalFileName,
    status: attachment.status,
    uploadedAt: attachment.uploadedAt.toISOString(),
    ...(attachment.removedAt ? { removedAt: attachment.removedAt.toISOString() } : {}),
    ...(attachment.removalReason ? { removalReason: attachment.removalReason } : {}),
  };
}

export async function listAttachments(ticketNumber: string, requesterId: number) {
  const ticket = await ownedTicket(ticketNumber, requesterId);
  if (!ticket) return null;
  const attachments = await getPrisma().attachment.findMany({ where: { ticketId: ticket.id }, orderBy: { uploadedAt: "desc" } });
  return attachments.map(formatAttachment);
}

export async function saveAttachment(ticketNumber: string, requesterId: number, file: Express.Multer.File) {
  const ticket = await ownedTicket(ticketNumber, requesterId);
  if (!ticket) return { kind: "not-found" as const };
  const activeCount = await getPrisma().attachment.count({ where: { ticketId: ticket.id, status: "ACTIVE" } });
  if (activeCount >= 5) {
    await fs.unlink(file.path).catch(() => undefined);
    return { kind: "limit" as const };
  }
  const attachment = await getPrisma().attachment.create({ data: { ticketId: ticket.id, originalFileName: file.originalname, storedFileName: path.basename(file.filename), mimeType: file.mimetype, fileSize: file.size } });
  return { kind: "created" as const, attachment: formatAttachment(attachment) };
}

export async function downloadableAttachment(attachmentId: number, requesterId: number) {
  return getPrisma().attachment.findFirst({ where: { id: attachmentId, status: "ACTIVE", ticket: { requesterId } } });
}

export async function softRemoveAttachment(attachmentId: number, requesterId: number, reason: string) {
  const existing = await getPrisma().attachment.findFirst({ where: { id: attachmentId, ticket: { requesterId } } });
  if (!existing) return { kind: "not-found" as const };
  if (existing.status === "REMOVED") return { kind: "removed" as const };
  const attachment = await getPrisma().attachment.update({ where: { id: attachmentId }, data: { status: "REMOVED", removalReason: reason, removedAt: new Date() } });
  return { kind: "updated" as const, attachment: formatAttachment(attachment) };
}

export async function prepareUploadDirectory() { await fs.mkdir(uploadDirectory, { recursive: true }); }
export function storedFileName(fileName: string) { return `${randomUUID()}${path.extname(fileName).toLowerCase()}`; }