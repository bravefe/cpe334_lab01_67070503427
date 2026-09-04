import { DragEvent, useRef, useState } from "react";
import "../Attachment.css";

interface AttachmentCreateTicketProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const validFile = (file: File) => /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name) && file.size <= 5 * 1024 * 1024;
const MAX_ACTIVE_ATTACHMENTS = 5;

export default function AttachmentCreateTicket({ files, onChange }: AttachmentCreateTicketProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");

  const add = (newFiles: File[]) => {
    const valid = newFiles.filter(validFile);
    const invalid = newFiles.length - valid.length;
    const remainingSlots = MAX_ACTIVE_ATTACHMENTS - files.length;

    if (remainingSlots <= 0) {
      setMessage("Attachment limit reached. You can upload up to 5 active attachments.");
      return;
    }

    const accepted = valid.slice(0, remainingSlots);
    const overflow = valid.length - accepted.length;

    if (invalid > 0 || overflow > 0) {
      setMessage(
        overflow > 0
          ? "Attachment limit reached. You can upload up to 5 active attachments."
          : "Only JPG, PNG, WEBP, and PDF files up to 5 MB are allowed.",
      );
    } else {
      setMessage("");
    }

    onChange([...files, ...accepted].slice(0, MAX_ACTIVE_ATTACHMENTS));
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    add(Array.from(event.dataTransfer.files));
  };

  const downloadLocalFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const remainingSlots = Math.max(0, MAX_ACTIVE_ATTACHMENTS - files.length);

  return <section className="attachment-section" aria-label="Attachments">
    <div className="attachment-list">
      {files.map((file, index) => (
        <div className="attachment-row" key={`${file.name}-${index}`}>
          <button className="attachment-name" type="button" onClick={() => downloadLocalFile(file)}>
            <span>{file.name}</span>
          </button>
          <button className="remove-attachment" type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}>x</button>
        </div>
      ))}
      <div className="attachment-limit-indicator">{remainingSlots} remaining</div>
      {/* {!files.length && <div className="attachment-empty">No attachments selected</div>} */}
    </div>
    <div className={`attachment-dropzone${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <p>Drag and drop your file here</p>
      <button type="button" onClick={() => input.current?.click()}>+ Add File</button>
      <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple onChange={(event) => { add(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    </div>
    {message && <p className="attachment-message">{message}</p>}
  </section>;
}