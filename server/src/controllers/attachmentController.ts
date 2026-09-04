import { NextFunction, Request, Response } from "express";
import { createRequire } from "node:module";
import type * as multerTypes from "multer";
import path from "node:path";
import { downloadableAttachment, listAttachments, maxFileSize, saveAttachment, softRemoveAttachment, uploadDirectory } from "../services/attachmentService.js";

type MulterFactory = {
  (options?: multerTypes.Options): multerTypes.Multer;
  diskStorage(options?: multerTypes.DiskStorageOptions): multerTypes.StorageEngine;
};

const require = createRequire(import.meta.url);
const createMulter = require("multer") as MulterFactory;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const storage = createMulter.diskStorage({
  destination: uploadDirectory,
  filename: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
    callback(null, `${Date.now()}-${path.basename(file.originalname)}`);
  },
});
export const attachmentUpload = createMulter({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (_req: Request, file: Express.Multer.File, callback: multerTypes.FileFilterCallback) => callback(null, allowedTypes.has(file.mimetype)),
});


export function handleAttachmentUpload(req: Request, res: Response, next: NextFunction) {
  attachmentUpload.single("file")(req, res, (uploadError: unknown) => {
    if (uploadError && typeof uploadError === "object" && "code" in uploadError && uploadError.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: { code: "FILE_TOO_LARGE", message: "Attachment must not exceed 5 MB." } });
    }
    if (uploadError) return next(uploadError);
    return next();
  });
}
function requesterId(req: Request) { const id = Number(req.header("X-Dev-Requester-Id")); return Number.isInteger(id) && id > 0 ? id : null; }
function error(res: Response, status: number, code: string, message: string) { return res.status(status).json({ error: { code, message } }); }

export async function getAttachments(req: Request, res: Response) {
  const id = requesterId(req); if (!id) return error(res, 400, "VALIDATION_ERROR", "A valid requester context is required.");
  const result = await listAttachments(String(req.params.ticketNumber), id); if (!result) return error(res, 404, "NOT_FOUND", "Ticket not found."); return res.json({ data: result });
}

export async function uploadAttachment(req: Request, res: Response) {
  const id = requesterId(req); if (!id) return error(res, 400, "VALIDATION_ERROR", "A valid requester context is required.");
  if (!req.file) return error(res, 415, "UNSUPPORTED_MEDIA_TYPE", "Only JPG, PNG, WEBP, and PDF files are allowed.");
  const result = await saveAttachment(String(req.params.ticketNumber), id, req.file);
  if (result.kind === "not-found") return error(res, 404, "NOT_FOUND", "Ticket not found.");
  if (result.kind === "limit") return error(res, 422, "ATTACHMENT_LIMIT", "A ticket can have at most 5 active attachments.");
  return res.status(201).json({ data: result.attachment });
}

export async function downloadAttachment(req: Request, res: Response) {
  const id = requesterId(req); if (!id) return res.status(404).end();
  const attachment = await downloadableAttachment(Number(req.params.attachmentId), id); if (!attachment) return res.status(404).end();
  return res.download(path.join(uploadDirectory, attachment.storedFileName), attachment.originalFileName);
}

export async function removeAttachment(req: Request, res: Response) {
  const id = requesterId(req); const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!id) return error(res, 404, "NOT_FOUND", "Attachment not found."); if (!reason) return error(res, 400, "VALIDATION_ERROR", "Removal reason is required.");
  const result = await softRemoveAttachment(Number(req.params.attachmentId), id, reason);
  if (result.kind === "not-found") return error(res, 404, "NOT_FOUND", "Attachment not found."); if (result.kind === "removed") return error(res, 409, "ALREADY_REMOVED", "Attachment is already removed."); return res.json({ data: result.attachment });
}