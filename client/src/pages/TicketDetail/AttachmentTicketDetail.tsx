import { DragEvent, useEffect, useRef, useState } from "react";
import { downloadAttachment, fetchAttachments, removeAttachment, uploadAttachment } from "../../api/attachments";
import { Attachment } from "../../lib/attachments";
import { formatDate } from "../../lib/formatDate";
import "../Attachment.css";

interface AttachmentTicketDetailProps { requesterId: number; ticketNumber: string; }
const validFile = (file: File) => /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name) && file.size <= 5 * 1024 * 1024;

export default function AttachmentTicketDetail({ requesterId, ticketNumber }: AttachmentTicketDetailProps) {
  const input = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => fetchAttachments(requesterId, ticketNumber).then((result) => setAttachments(Array.isArray(result.data) ? result.data : [])).catch((error: Error) => setMessage(error.message));
  useEffect(() => { void load(); }, [requesterId, ticketNumber]);

  const add = async (newFiles: File[]) => {
    const accepted = newFiles.filter(validFile);
    if (accepted.length !== newFiles.length) setMessage("Only JPG, PNG, WEBP, and PDF files up to 5 MB are allowed.");
    setBusy(true);
    try {
      const uploaded = await Promise.all(accepted.map((file) => uploadAttachment(requesterId, ticketNumber, file)));
      setAttachments((current) => [...uploaded, ...current]);
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to upload attachment."); }
    finally { setBusy(false); }
  };

  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void add(Array.from(event.dataTransfer.files)); };
  const remove = async (attachment: Attachment) => {
    const reason = window.prompt("Please enter a reason for removing this attachment:");
    if (reason === null) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setMessage("Removal reason is required.");
      return;
    }

    try {
      await removeAttachment(requesterId, attachment.attachmentId, trimmedReason);
      setAttachments((current) => current.filter((item) => item.attachmentId !== attachment.attachmentId));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove attachment.");
    }
  };

  return <section className="attachment-section" aria-label="Attachments">
    <div className="attachment-list">
      {attachments.map((attachment) => {
        const isRemoved = attachment.status === "REMOVED";
        return (
          <div className={`attachment-row${isRemoved ? " removed" : ""}`} key={attachment.attachmentId}>
            <button
              className="attachment-name"
              type="button"
              disabled={isRemoved}
              onClick={() => {
                if (isRemoved) return;
                void downloadAttachment(requesterId, attachment.attachmentId, attachment.originalFileName);
              }}
              aria-label={`Download ${attachment.originalFileName} uploaded on ${formatDate(attachment.uploadedAt)}`}
            >
              <span>{attachment.originalFileName}</span>
              <span className="attachment-uploaded-at">{formatDate(attachment.uploadedAt)}</span>
            </button>
            {isRemoved ? (
              <div className="attachment-removed-meta">
                <span className="attachment-status-badge">Removed</span>
                <span className="attachment-removal-reason">{attachment.removalReason ?? "Attachment removed"}</span>
              </div>
            ) : (
              <button className="remove-attachment" type="button" onClick={() => void remove(attachment)} aria-label={`Remove ${attachment.originalFileName}`}>x</button>
            )}
          </div>
        );
      })}
    </div>
    <div className={`attachment-dropzone${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <p>{busy ? "Uploading..." : "Drag and drop your file here"}</p><button type="button" disabled={busy} onClick={() => input.current?.click()}>+ Add File</button><input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple onChange={(event) => { void add(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    </div>
    {message && <p className="attachment-message">{message}</p>}
  </section>;
}