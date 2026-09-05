import { ChangeEvent, useEffect, useState } from "react";
import { fetchCategories, fetchPriorities, fetchRelatedSystems } from "../../api/referenceData";
import { createTicket } from "../../api/tickets";
import { uploadAttachment } from "../../api/attachments";
import { Category, Priority, RelatedSystem } from "../../lib/reference";
import { Requester } from "../../lib/requester";
import { CreateTicketPayload } from "../../lib/ticket";
import TopBar from "../TopBar";
import AttachmentCreateTicket from "./AttachmentCreateTicket";
import "./CreateTicket.css";

interface CreateTicketProps {
  requester?: Requester;
  requesterId: number | null;
  onBack: () => void;
  onCreateTicket?: () => void;
  onOpenTicket?: (ticketNumber: string) => void;
}

const emptyForm = {
  categoryId: "",
  relatedSystemId: "",
  summary: "",
  description: "",
  requestedPriorityId: "",
};

export default function CreateTicket({ requester, requesterId, onBack, onCreateTicket, onOpenTicket }: CreateTicketProps) {
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [referenceError, setReferenceError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

    useEffect(() => {
    loadReferenceData();
    }, []);

  const loadReferenceData = () => {
    setReferenceError("");
    Promise.all([fetchCategories(), fetchPriorities(), fetchRelatedSystems()])
      .then(([categoriesResult, prioritiesResult, systemsResult]) => {
        setCategories(categoriesResult.data);
        setPriorities(prioritiesResult.data);
        setRelatedSystems(systemsResult.data);
      })
      .catch((error: Error) => setReferenceError(error.message));
  };

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.summary.trim()) nextErrors.summary = "Summary is required.";
    else if (form.summary.trim().length < 5 || form.summary.trim().length > 150) nextErrors.summary = "Summary must be 5-150 characters.";

    if (!form.description.trim()) nextErrors.description = "Description is required.";
    else if (form.description.trim().length < 20 || form.description.trim().length > 2000) nextErrors.description = "Description must be 20-2000 characters.";

    if (!form.categoryId) nextErrors.categoryId = "Please select a category.";
    if (!form.relatedSystemId) nextErrors.relatedSystemId = "Please select a related system.";
    if (!form.requestedPriorityId) nextErrors.requestedPriorityId = "Please select a priority.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    if (!requesterId) {
      setSubmitError("Choose a requester before submitting a ticket.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const payload: CreateTicketPayload = {
      categoryId: Number(form.categoryId),
      relatedSystemId: Number(form.relatedSystemId),
      summary: form.summary.trim(),
      description: form.description.trim(),
      requestedPriorityId: Number(form.requestedPriorityId),
    };

    try {
      const created = await createTicket(requesterId, payload);
      const uploadResults = await Promise.allSettled(
        attachmentFiles.map((file) => uploadAttachment(requesterId, created.ticketNumber, file)),
      );
      const failedFiles = attachmentFiles.filter((_, index) => uploadResults[index]?.status === "rejected");
      setSuccessTicket(created.ticketNumber);
      setForm(emptyForm);
      setAttachmentFiles([]);
      if (failedFiles.length > 0) {
        setSubmitError(
          `Ticket created, but these attachments failed to upload: ${failedFiles.map((file) => file.name).join(", ")}. Open Ticket Details to retry.`,
        );
      } else {
        onOpenTicket?.(created.ticketNumber);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar requester={requester} onChange={() => window.location.assign("/choose-requester")} onMyTickets={onBack} onCreateTicket={onCreateTicket ?? onBack} />
      <main className="page create-ticket-page">
        <div className="detail-header">
          <div>
            <h1>Create Ticket</h1>
            <p className="muted">Submit a new support request.</p>
          </div>
          <button className="back-link" onClick={onBack}>← Back to My Tickets</button>
        </div>

        <section className="ticket-form-card">
          <div className="info-grid">
            <div className="field read-only"><label>Ticket No.</label><span>Implemented Automatically</span></div>
            <div className="field read-only"><label>Ticket Date</label><span>Implemented Automatically</span></div>
            <div className="field read-only"><label>Requester</label><span>{requester?.name ?? ""}</span></div>
            <div className="field read-only"><label>Current Status</label><span>New</span></div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Category</span>
              <select value={form.categoryId} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("categoryId", event.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.categoryId && <small>{errors.categoryId}</small>}
            </label>

            <label className="field">
              <span>Related System</span>
              <select value={form.relatedSystemId} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("relatedSystemId", event.target.value)}>
                <option value="">Select system</option>
                {relatedSystems.map((system) => (
                  <option key={system.id} value={system.id}>{system.name}</option>
                ))}
              </select>
              {errors.relatedSystemId && <small>{errors.relatedSystemId}</small>}
            </label>

            <label className="field">
              <span>Requested Priority</span>
              <select value={form.requestedPriorityId} onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("requestedPriorityId", event.target.value)}>
                <option value="">Select priority</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>{priority.name}</option>
                ))}
              </select>
              {errors.requestedPriorityId && <small>{errors.requestedPriorityId}</small>}
            </label>
          </div>

          {referenceError && (
            <div className="error-banner">
              <span>Reference data could not be loaded. Please try again.</span>
              <button type="button" onClick={loadReferenceData}>Retry</button>
            </div>
          )}

          <label className="field full-width">
            <span>Summary</span>
            <input
              value={form.summary}
              maxLength={150}
              placeholder="Enter a short summary of your issue..."
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("summary", event.target.value)}
            />
            {errors.summary && <small>{errors.summary}</small>}
          </label>

          <label className="field full-width">
            <span>Description</span>
            <textarea
              value={form.description}
              rows={6}
              placeholder="Describe your issue in detail..."
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => updateField("description", event.target.value)}
            />
            {errors.description && <small>{errors.description}</small>}
          </label>
          <AttachmentCreateTicket files={attachmentFiles} onChange={setAttachmentFiles} />

          {submitError && <div className="error-banner">{submitError}</div>}
          {successTicket && <div className="success-banner">Ticket created: {successTicket}</div>}

          <div className="submit-row">
            <button type="button" className="secondary-button" onClick={onBack}>Cancel</button>
            <button type="button" className="primary" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </section>

        {/* <section className="ticket-form-card">
          <AttachmentCreateTicket files={attachmentFiles} onChange={setAttachmentFiles} />
        </section> */}

      </main>
    </>
  );
}
