import { DragEvent, useRef, useState } from "react";
import "../Attachment.css";

interface AttachmentCreateTicketProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const allowedMimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};
const validFile = (file: File) => {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return allowedMimeTypes[extension] === file.type && file.size <= 5 * 1024 * 1024;
};
const MAX_ACTIVE_ATTACHMENTS = 5;

export default function AttachmentCreateTicket({ files, onChange }: AttachmentCreateTicketProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "warning">("error");

  const add = (newFiles: File[]) => {
    const valid = newFiles.filter(validFile);
    const invalid = newFiles.length - valid.length;
    const remainingSlots = MAX_ACTIVE_ATTACHMENTS - files.length;

    if (remainingSlots <= 0) {
      setMessage("Attachment limit reached. You can upload up to 5 active attachments.");
      setMessageTone("warning");
      return;
    }

    const accepted = valid.slice(0, remainingSlots);
    const overflow = valid.length - accepted.length;

    if (invalid > 0 || overflow > 0) {
      setMessageTone(overflow > 0 ? "warning" : "error");
      setMessage(
        overflow > 0
          ? "Attachment limit reached. You can upload up to 5 active attachments."
          : "Only JPG, PNG, WEBP, and PDF files up to 5 MB are allowed.",
      );
    } else {
      setMessage("");
      setMessageTone("error");
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
    <label className="field full-width attachment-label" style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
      <span>Attachment</span><div className="attachment-limit-indicator" style={{ margin: 0 }}>{remainingSlots} remaining</div>
    </label>
    <div className="attachment-list">
      {files.map((file, index) => (
        <div className="attachment-row" key={`${file.name}-${index}`}>
          <button className="attachment-name" type="button" onClick={() => downloadLocalFile(file)}>
            <span>{file.name}</span>
          </button>
          <button className="remove-attachment" type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}>x</button>
        </div>
      ))}
      {/* {!files.length && <div className="attachment-empty">No attachments selected</div>} */}
    </div>
    {remainingSlots > 0 && (
      <div className={`attachment-dropzone${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
        <p>Drag and drop your file here</p>
        <button type="button" onClick={() => input.current?.click()}>+ Add File</button>
      </div>
    )}
    <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} onChange={(event) => { add(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    {message && <p className={`attachment-message ${messageTone}`}>{message}</p>}
  </section>;
}