import { DragEvent, useRef, useState } from "react";
import "../Attachment.css";

interface AttachmentCreateTicketProps {
  files: File[];
  onChange: (files: File[]) => void;
}

const validFile = (file: File) => /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name) && file.size <= 5 * 1024 * 1024;

export default function AttachmentCreateTicket({ files, onChange }: AttachmentCreateTicketProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");

  const add = (newFiles: File[]) => {
    const accepted = newFiles.filter(validFile);
    setMessage(accepted.length === newFiles.length ? "" : "Only JPG, PNG, WEBP, and PDF files up to 5 MB are allowed.");
    onChange([...files, ...accepted].slice(0, 5));
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