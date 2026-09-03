
plese ask me if you need any more file

I want you to put the code for attachment seperately 
the file you will need client/src/api/attachments.ts
src/lib/attachments.ts if you need 
|d


Then put AttachmentCreateTicket.tsx inside the createTicket folder an same with AttachmentTicketDetail.tsx

since the look will be similar you only need 1 cssfile /pages/Attachment.css

For the server also spilt the file like what I have done into 3 file

in client you need to craeate 

in page /ticket/id: put this below the detail the similary to the topbar there is a line below to hightlight witch page are we at right now we are only implementing attachment so when go to other page just leave it with a message to be implemented set the default page to the attachments for now

│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ Public Comments │ Attachments │ Service Actions │ Event Log    │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │    file                                                         x    │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │                     | + Add FIle Button   |                          │ │
│ └──────────────────────────────────────────────────────────────────────┘ │

and in /create-ticket does not need to have Public Comments, Service Actions, and Event Log only the attachments

use the same file list by linestyle for these 2 file but you are able to drag and drop the file in the area and it will add auto you click on the the file will download and there also be the add file button below tthe file if there is one if you can still add more file in the ticket 

:root {
  font-family: "DM Sans", sans-serif;
  color: var(--text);
  background: var(--page-bg);
  --primary-green: #006b3c;
  --secondary-green: #0b7a46;
  --pale-green: #eaf6ef;
  --page-bg: #f5f7f6;
  --surface: #ffffff;
  --text: #173b2d;
  --muted: #67756f;

  --border: #d9e1dd;
  --control-border: var(--border);
  --subtle-border: var(--border);
  --mobile-border: var(--border);
  --readonly-border: var(--border);
  --attachment-border: var(--border);

  --readonly-surface: var(--page-bg);
  --attachment-surface: var(--surface);

  /* --control-border: #c9d3ce;
  --subtle-border: #e8ecea;
  --mobile-border: #e8eee9;
  --readonly-surface: #f2f4f3;
  --attachment-surface: #f9fbfa;
  --readonly-border: #dde5e1;
  --attachment-border: #bfd6c9; */

  --focus-ring: rgba(0, 107, 60, 0.24);
  --hover-overlay: rgba(255, 255, 255, 0.08);
  --shadow-soft: rgba(23, 59, 45, 0.05);
  --shadow-card: rgba(23, 59, 45, 0.06);
  --shadow-selection: rgba(23, 59, 45, 0.12);

  --error: #b42318;
  --success: #16803c;

  --error-surface: #fdecec;
  --error-border: #e9bdb8;
  --error-banner-surface: #fef2f2;
  --error-banner-border: #fecaca;
  --success-banner-surface: #edfdf4;
  --success-banner-border: #b9edc8;
  
  --low-priority-surface: #eef8f1;
  --low-priority-text: #2b6b42;
  --medium-priority-surface: #fff7e8;
  --medium-priority-text: #8a5a00;
  --high-priority-surface: #fdecec;
  --high-priority-text: #9a2d23;
  --status-surface: #eef3fc;
  --status-text: #31588f;
}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  isActive Boolean  @default(true)
  tickets  Ticket[]
}

model Priority {
  id               Int      @id @default(autoincrement())
  name             String   @unique
  sortOrder        Int      @unique
  requestedTickets Ticket[] @relation("RequestedPriority")
  assignedTickets  Ticket[] @relation("ItPriority")
}

model Status {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isDefault Boolean  @default(false)
  tickets   Ticket[]
}

model DevRequester {
  id             Int             @id @default(autoincrement())
  name       String
  email          String          @unique
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  tickets        Ticket[]
}

model RelatedSystem {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  isActive Boolean  @default(true)
  tickets  Ticket[]
}

model Ticket {
  id                  Int             @id @default(autoincrement())
  ticketNumber        String          @unique
  requesterId         Int
  categoryId          Int
  relatedSystemId     Int
  summary             String          @db.VarChar(150)
  description         String          @db.VarChar(2000)
  requestedPriorityId Int
  itPriorityId        Int?
  currentStatusId     Int
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  requester           DevRequester    @relation(fields: [requesterId], references: [id], onDelete: Restrict)
  category            Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  relatedSystem       RelatedSystem   @relation(fields: [relatedSystemId], references: [id], onDelete: Restrict)
  requestedPriority   Priority        @relation("RequestedPriority", fields: [requestedPriorityId], references: [id], onDelete: Restrict)
  itPriority          Priority?       @relation("ItPriority", fields: [itPriorityId], references: [id], onDelete: Restrict)
  currentStatus       Status          @relation(fields: [currentStatusId], references: [id], onDelete: Restrict)
  attachments         Attachment[]
  // publicComments      PublicComment[]
  // serviceActions      ServiceAction[]
  // eventLogs           EventLog[]

  @@index([ticketNumber])
  @@index([requesterId])
  @@index([categoryId])
  @@index([requestedPriorityId])
  @@index([currentStatusId])
  @@index([createdAt])
}
enum AttachmentStatus {
  ACTIVE
  REMOVED
}

model Attachment {
  id               Int              @id @default(autoincrement())
  ticketId         Int
  originalFileName String
  storedFileName   String
  mimeType         String
  fileSize          Int
  status           AttachmentStatus @default(ACTIVE)
  removalReason    String?
  removedAt        DateTime?
  uploadedAt       DateTime         @default(now())
  ticket           Ticket           @relation(fields: [ticketId], references: [id], onDelete: Restrict)

  @@index([ticketId])
}

client/src/api/tickets.ts

import { get, list, post } from "./client";
import { CreateTicketPayload, Ticket, TicketDetail, TicketPage, TicketQuery } from "../lib/ticket";
import { RelatedSystem } from "../lib/reference";

export function fetchTickets(requesterId: number, query: TicketQuery) {
  const params = new URLSearchParams({
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.category) {
    params.set("category", String(query.category));
  }
  if (query.requestedPriorityId) {
    params.set("requestedPriorityId", String(query.requestedPriorityId));
  }
  if (query.currentStatusId) {
    params.set("currentStatusId", String(query.currentStatusId));
  }

  return get<TicketPage>(`/api/tickets?${params}`, requesterId);
}

export function createTicket(requesterId: number, input: CreateTicketPayload) {
  return post<{ data: Ticket }>("/api/create-ticket", requesterId, input).then((result) => result.data);
}

export function fetchTicketDetail(requesterId: number, ticketNumber: string) {
  return get<{ data: TicketDetail }>(`/api/tickets/${encodeURIComponent(ticketNumber)}`, requesterId).then((result) => result.data);
}

client/src/pages/CreateTicket/CreateTicket.tsx

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { fetchCategories, fetchPriorities, fetchRelatedSystems } from "../../api/referenceData";
import { createTicket } from "../../api/tickets";
import { Category, Priority, RelatedSystem } from "../../lib/reference";
import { Requester } from "../../lib/requester";
import { CreateTicketPayload } from "../../lib/ticket";
import TopBar from "../TopBar";
import "./CreateTicket.css";

interface CreateTicketProps {
  requester?: Requester;
  requesterId: number;
  onBack: () => void;
  onCreateTicket?: () => void;
}

const emptyForm = {
  categoryId: "",
  relatedSystemId: "",
  summary: "",
  description: "",
  requestedPriorityId: "",
};

export default function CreateTicket({ requester, requesterId, onBack, onCreateTicket }: CreateTicketProps) {
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

    useEffect(() => {
    fetchCategories()
        .then((result) => setCategories(result.data))
        .catch((error) => console.error("Failed to fetch categories:", error));

    fetchPriorities()
        .then((result) => setPriorities(result.data))
        .catch((error) => console.error("Failed to fetch priorities:", error));

    fetchRelatedSystems()
        .then((result) => setRelatedSystems(result.data))
        .catch((error) => console.error("Failed to fetch related systems:", error));
    }, []);

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
      setSuccessTicket(created.ticketNumber);
      setForm(emptyForm);
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

          {/* <div className="attachment-box">
            <p>Drag and drop your file here</p>
            <span>or</span>
            <button type="button" className="secondary-button">Browse File</button>
          </div> */}

          {submitError && <div className="error-banner">{submitError}</div>}
          {successTicket && <div className="success-banner">Ticket created: {successTicket}</div>}

          <div className="submit-row">
            <button type="button" className="secondary-button" onClick={onBack}>Cancel</button>
            <button type="button" className="primary" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

client/src/pages/TicketDetail/TicketDetail.tsx

import { useEffect, useState } from "react";
import { fetchTicketDetail } from "../../api/tickets";
import { Requester } from "../../lib/requester";
import { TicketDetail as TicketDetailType } from "../../lib/ticket";
import TopBar from "../TopBar";
import "./TicketDetail.css";

import { formatDate } from "../../lib/formatDate";

interface TicketDetailProps {
  requester?: Requester;
  requesterId: number;
  ticketNumber: string;
  onBack: () => void;
  onCreateTicket?: () => void;
}


export default function TicketDetail({
  requester,
  requesterId,
  ticketNumber,
  onBack,
  onCreateTicket,
}: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);

    fetchTicketDetail(requesterId, ticketNumber)
      .then((result) => {
        setTicket(result);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [requesterId, ticketNumber]);
  
  return (
    <>
      <TopBar
        requester={requester}
        onChange={() => window.location.assign("/choose-requester")}
        onMyTickets={onBack}
        onCreateTicket={() => window.location.assign("/create-ticket")}
      />

      <main className="page ticket-detail-page">
        <div className="detail-header">
          <div>
            <h1>Ticket Details</h1>
            <p className="muted">View the details of your support request.</p>
          </div>

          <button className="back-link" onClick={onBack}>
            ← Back to My Tickets
          </button>
        </div>

        {loading && <div className="empty">Loading ticket...</div>}

        {error && (
          <div className="empty">
            <h2 className="error-message">{error}</h2>
          </div>
        )}

        {ticket && (
          <section className="ticket-form-card">
            {/* Ticket information */}
            <div className="info-grid">
              <div className="field read-only">
                <span>Ticket No.</span>
                <div className="field-value">{ticket.ticketNumber}</div>
              </div>

              <div className="field read-only">
                <span>Ticket Date</span>
                <div className="field-value">
                  {formatDate(ticket.createdAt)}
                </div>
              </div>

              <div className="field read-only">
                <span>Requester</span>
                <div className="field-value">
                  {ticket.requester?.name ?? ""}
                </div>
              </div>

              <div className="field read-only">
                <span>Last Updated</span>
                <div className="field-value">
                  {formatDate(ticket.updatedAt)}
                </div>
              </div>
            </div>

            {/* Editable fields in the future */}
            <div className="form-grid">
              <label className="field">
                <span>Category</span>
                <select value={ticket.category?.id ?? ""} disabled>
                  <option value={ticket.category?.id ?? ""}>
                    {ticket.category?.name ?? ""}
                  </option>
                </select>
              </label>

              <label className="field">
                <span>Related System</span>
                <select value={ticket.relatedSystem?.id ?? ""} disabled>
                  <option value={ticket.relatedSystem?.id ?? ""}>
                    {ticket.relatedSystem?.name ?? ""}
                  </option>
                </select>
              </label>

              <label className="field">
                <span>Requested Priority</span>
                <select value={ticket.requestedPriority?.id ?? ""} disabled>
                  <option value={ticket.requestedPriority?.id ?? ""}>
                    {ticket.requestedPriority?.name ?? ""}
                  </option>
                </select>
              </label>

              <label className="field">
                <span>Current Status</span>
                <select value={ticket.currentStatus?.id ?? ""} disabled>
                  <option value={ticket.currentStatus?.id ?? ""}>
                    {ticket.currentStatus?.name ?? ""}
                  </option>
                </select>
              </label>

              {/* <div className="field">
                <span>Current Status</span>
                <div className="field-value status-value">
                  {ticket.currentStatus?.name ?? ""}
                </div>
              </div> */}

            </div>

            {/* Summary */}
            <div className="field full-width">
              <span>Summary</span>
              <input
                value={ticket.summary}
                readOnly
                aria-readonly="true"
              />
            </div>

            {/* Description */}
            <div className="field full-width">
              <span>Description</span>
              <textarea
                value={ticket.description}
                readOnly
                aria-readonly="true"
                rows={6}
              />
            </div>

            {/* <div className="attachment-box">
              <p>Attachments</p>
              <span>No attachments</span>
            </div> */}
          </section>
        )}
      </main>
    </>
  );
}

