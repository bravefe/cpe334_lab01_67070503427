import type { NextFunction, Request, Response } from "express";
import { createRequire } from "node:module";
import type * as multerTypes from "multer";
import path from "node:path";
import {
  downloadableAttachment,
  listAttachments,
  maxFileSize,
  saveAttachment,
  softRemoveAttachment,
  storedFileName,
  uploadDirectory,
} from "../services/attachmentService.js";

type MulterFactory = {
  (options?: multerTypes.Options): multerTypes.Multer;
  diskStorage(options?: multerTypes.DiskStorageOptions): multerTypes.StorageEngine;
};

const require = createRequire(import.meta.url);
const createMulter = require("multer") as MulterFactory;

const allowedTypes: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

const storage = createMulter.diskStorage({
  destination: uploadDirectory,
  filename: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    callback(null, storedFileName(file.originalname));
  },
});

export const attachmentUpload = createMulter({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: multerTypes.FileFilterCallback,
  ) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, allowedTypes[file.mimetype]?.includes(extension) ?? false);
  },
});

export function handleAttachmentUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  attachmentUpload.single("file")(req, res, (uploadError: unknown) => {
    if (
      uploadError &&
      typeof uploadError === "object" &&
      "code" in uploadError &&
      uploadError.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: "Attachment must not exceed 5 MB.",
        },
      });
    }
    if (uploadError) return next(uploadError);
    return next();
  });
}

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({ error: { code, message } });
}

export async function getAttachments(req: Request, res: Response) {
  const userId = req.user!.id;
  const ticketNumber = String(req.params.ticketNumber ?? "");

  const result = await listAttachments(ticketNumber, userId);
  if (!result) {
    return sendError(res, 404, "NOT_FOUND", "Ticket not found.");
  }

  return res.status(200).json({ data: result });
}

export async function uploadAttachment(req: Request, res: Response) {
  const userId = req.user!.id;
  const ticketNumber = String(req.params.ticketNumber ?? "");

  if (!req.file) {
    return sendError(
      res,
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Only JPG, PNG, WEBP, and PDF files are allowed.",
    );
  }

  const result = await saveAttachment(ticketNumber, userId, req.file);
  if (result.kind === "not-found") {
    return sendError(res, 404, "NOT_FOUND", "Ticket not found.");
  }
  if (result.kind === "limit") {
    return sendError(
      res,
      422,
      "ATTACHMENT_LIMIT",
      "A ticket can have at most 5 active attachments.",
    );
  }

  return res.status(201).json({ data: result.attachment });
}

export async function downloadAttachment(req: Request, res: Response) {
  const userId = req.user!.id;
  const attachmentId = Number(req.params.attachmentId);

  const attachment = await downloadableAttachment(attachmentId, userId);
  if (!attachment) {
    return res.status(404).end();
  }

  return res.download(
    path.join(uploadDirectory, attachment.storedFileName),
    attachment.originalFileName,
  );
}

export async function removeAttachment(req: Request, res: Response) {
  const userId = req.user!.id;
  const attachmentId = Number(req.params.attachmentId);
  const reason =
    typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

  if (!reason) {
    return sendError(res, 400, "VALIDATION_ERROR", "Removal reason is required.");
  }

  const result = await softRemoveAttachment(attachmentId, userId, reason);
  if (result.kind === "not-found") {
    return sendError(res, 404, "NOT_FOUND", "Attachment not found.");
  }
  if (result.kind === "removed") {
    return sendError(
      res,
      409,
      "ALREADY_REMOVED",
      "Attachment is already removed.",
    );
  }

  return res.status(200).json({ data: result.attachment });
}