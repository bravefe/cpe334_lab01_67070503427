export type AttachmentStatus = "ACTIVE" | "REMOVED";

export interface Attachment {
  attachmentId: number;
  originalFileName: string;
  status: AttachmentStatus;
  uploadedAt: string;
  removedAt?: string;
  removalReason?: string;
}