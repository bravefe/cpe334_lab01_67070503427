import { Router } from "express";
import { downloadAttachment, getAttachments, handleAttachmentUpload, removeAttachment, uploadAttachment } from "../controllers/attachmentController.js";

const router = Router();
router.get("/tickets/:ticketNumber/attachments", getAttachments);
router.post("/tickets/:ticketNumber/attachments", handleAttachmentUpload, uploadAttachment);
router.get("/attachments/:attachmentId/download", downloadAttachment);
router.patch("/attachments/:attachmentId/remove", removeAttachment);
export default router;