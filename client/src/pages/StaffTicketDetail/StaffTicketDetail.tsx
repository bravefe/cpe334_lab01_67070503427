import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  fetchStaffTicketDetail,
  updateStaffOwner,
  updateStaffPriority,
  updateStaffStatus,
} from "../../api/tickets";
import { StaffTicket } from "../../lib/ticket";
import TopBar from "../TopBar";
import AttachmentTicketDetail from "../TicketDetail/AttachmentTicketDetail";
import ConversationPanel from "../TicketDetail/ConversationPanel";
import "../TicketDetail/ConversationPanel.css";
import "./StaffTicketDetail.css";

const transitions: Record<string, string[]> = {
  New: ["Open", "Cancelled"],
  Open: ["In Progress", "Waiting for Requester", "Cancelled"],
  "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["Open", "In Progress", "Cancelled"],
  Cancelled: [],
};

interface Props {
  requester?: { id: number; name: string; email: string; isActive: boolean };
  ticketRef: string;
  onLogout: () => void;
  onQueue: () => void;
}
export default function StaffTicketDetail({
  requester,
  ticketRef,
  onLogout,
  onQueue,
}: Props) {
  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState("");
  const [conversationTab, setConversationTab] = useState<
    "comments" | "notes" | "attachments"
  >("comments");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const resolutionRef = useRef<HTMLTextAreaElement>(null);

  const load = () => {
    setLoading(true);
    setError("");
    fetchStaffTicketDetail(ticketRef)
      .then((result) => {
        setTicket(result);
        setSummary(result.resolutionSummary ?? "");
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load ticket.",
        ),
      )
      .finally(() => setLoading(false));
  };
  useEffect(load, [ticketRef]);

  useLayoutEffect(() => {
    for (const textarea of [descriptionRef.current, resolutionRef.current]) {
      if (!textarea) continue;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [ticket?.description, summary]);

  const saveOwner = async (ownerId: number | null) => {
    setBusy("owner");
    setError("");
    try {
      setTicket(await updateStaffOwner(ticketRef, ownerId));
      setMessage("Owner updated.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update owner.",
      );
    } finally {
      setBusy("");
    }
  };
  const savePriority = async (value: string) => {
    setBusy("priority");
    try {
      setTicket(await updateStaffPriority(ticketRef, value));
      setMessage("IT Priority updated.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update priority.",
      );
    } finally {
      setBusy("");
    }
  };
  const canDisplayResolutionSummary = ["Resolved", "Closed"].includes(
    ticket?.status ?? "",
  );
  const canEditResolutionSummary = [
    "In Progress",
    "Waiting for Requester",
  ].includes(ticket?.status ?? "");

  const saveStatus = async (value: string) => {
    if (value === "Resolved" && !summary.trim()) {
      setError("Resolution Summary is required when resolving a ticket.");
      setMessage("");
      return;
    }
    if (
      (value === "Resolved" || value === "Cancelled") &&
      !window.confirm(
        `Are you sure you want to mark this ticket ${value.toLowerCase()}?`,
      )
    )
      return;
    setBusy("status");
    setError("");
    try {
      setTicket(await updateStaffStatus(ticketRef, value, summary));
      setMessage(`Status updated to ${value}.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update status.",
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <TopBar
        requester={requester}
        role="IT_STAFF"
        onChange={onLogout}
        onQueue={onQueue}
      />
      <main className="page staff-detail-page">
        <header className="detail-header">
          <div>
            <p className="muted">My Queue &gt; Ticket Detail</p>
            <h1>Ticket Detail</h1>
          </div>
          <button type="button" onClick={onQueue}>
            ← Back to Queue
          </button>
        </header>
        {loading && <div className="empty">Loading ticket...</div>}
        {error && !ticket && (
          <div className="empty">
            <h2 className="error-message">{error}</h2>
            <button onClick={load}>Retry</button>
          </div>
        )}
        {ticket && (
          <section className="ticket-form-card">
            <div className="staff-detail-grid">
              <ReadOnly label="Ticket No." value={ticket.ticketNumber} />
              <ReadOnly
                label="Requester"
                value={ticket.requester?.name ?? "-"}
              />
              <ReadOnly label="Category" value={ticket.category ?? "-"} />
              <ReadOnly
                label="Requested Priority"
                value={ticket.requestedPriority ?? "-"}
              />
              <label className="field">
                <span>Ticket Owner</span>
                <select
                  disabled={busy === "owner"}
                  value={ticket.owner?.id ?? ""}
                  onChange={(event) =>
                    void saveOwner(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {ticket.owner && (
                    <option value={ticket.owner.id}>{ticket.owner.name}</option>
                  )}
                  {!ticket.owner && requester && (
                    <option value={requester.id}>Claim for me</option>
                  )}
                </select>
              </label>
              <label className="field">
                <span>IT Priority</span>
                <select
                  disabled={busy === "priority"}
                  value={ticket.itPriority ?? ""}
                  onChange={(event) => void savePriority(event.target.value)}
                >
                  {["Low", "Medium", "High"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Current Status</span>
                <select
                  disabled={busy === "status"}
                  value={ticket.status ?? ""}
                  onChange={(event) => void saveStatus(event.target.value)}
                >
                  <option value={ticket.status}>{ticket.status}</option>
                  {(transitions[ticket.status ?? ""] ?? []).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            {ticket.problemAppearsResolved && (
              <p className="success-inline">
                The ticket have been marked as resolved.
              </p>
            )}
            <div className="field full-width">
              <span>Summary</span>
              <input value={ticket.summary} readOnly aria-readonly="true" />
            </div>
            <div className="field full-width">
              <span>Description</span>
              <textarea
                value={ticket.description ?? "-"}
                readOnly
                aria-readonly="true"
                ref={descriptionRef}
                rows={1}
              />
            </div>
            {(canDisplayResolutionSummary || canEditResolutionSummary) && (
              <label className="field full-width resolution-field">
                <span>Resolution Summary</span>
                <textarea
                  value={summary}
                  ref={resolutionRef}
                  rows={1}
                  className="compact-textarea"
                  readOnly={canDisplayResolutionSummary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder={
                    canDisplayResolutionSummary
                      ? ""
                      : "Describe the resolution before selecting Resolved."
                  }
                  aria-label="Resolution Summary"
                />
              </label>
            )}
            {error && (
              <div
                className={
                  error.includes("Resolution Summary is required")
                    ? "warning-banner"
                    : "error-banner"
                }
                role="alert"
              >
                {error}
              </div>
            )}
            {message && <div className="success-banner">{message}</div>}
            <div
              className="ticket-tabs"
              role="tablist"
              aria-label="Ticket sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={conversationTab === "comments"}
                className={`attachment-tab${conversationTab === "comments" ? " active" : ""}`}
                onClick={() => setConversationTab("comments")}
              >
                Public Comments
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={conversationTab === "notes"}
                className={`attachment-tab${conversationTab === "notes" ? " active" : ""}`}
                onClick={() => setConversationTab("notes")}
              >
                Internal Notes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={conversationTab === "attachments"}
                className={`attachment-tab${conversationTab === "attachments" ? " active" : ""}`}
                onClick={() => setConversationTab("attachments")}
              >
                Attachments
              </button>
            </div>
            {conversationTab === "comments" || conversationTab === "notes" ? (
              <ConversationPanel
                ticketRef={ticketRef}
                staff
                activeTab={conversationTab}
                showTabs={false}
              />
            ) : (
              <section
                className="attachment-section"
                aria-label="Ticket attachments"
              >
                <AttachmentTicketDetail ticketNumber={ticketRef} />
              </section>
            )}
          </section>
        )}
      </main>
    </>
  );
}
function ReadOnly({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="field read-only">
      <span>{label}</span>
      {multiline ? <p>{value}</p> : <div className="field-value">{value}</div>}
    </div>
  );
}
