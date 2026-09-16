import { useEffect, useState } from "react";
import { fetchTicketDetail } from "../../api/tickets";
import { markTicketResolved } from "../../api/tickets";
import { Requester } from "../../lib/requester";
import { TicketDetail as TicketDetailType } from "../../lib/ticket";
import TopBar from "../TopBar";
import AttachmentTicketDetail from "./AttachmentTicketDetail";
import "./TicketDetail.css";
import ConversationPanel from "./ConversationPanel";
import "./ConversationPanel.css";

import { formatDate } from "../../lib/formatDate";

interface TicketDetailProps {
  requester?: Requester;
  ticketNumber: string;
  onBack: () => void;
  onLogout?: () => void;
  onCreateTicket?: () => void;
}

export default function TicketDetail({
  requester,
  ticketNumber,
  onBack,
  onLogout,
  onCreateTicket,
}: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("public-comments");
  const [resolutionBusy, setResolutionBusy] = useState(false);
  const [resolutionError, setResolutionError] = useState("");
  const createdFromForm =
    new URLSearchParams(window.location.search).get("created") === "1";

  useEffect(() => {
    setLoading(true);

    fetchTicketDetail(ticketNumber)
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
  }, [ticketNumber]);

  const canMarkResolved = [
    "Open",
    "In Progress",
    "Waiting for Requester",
  ].includes(ticket?.currentStatus?.name ?? "");
  const markResolved = async () => {
    if (
      !window.confirm(
        "Let IT Support know this looks fixed? They'll still need to formally close the ticket.",
      )
    )
      return;
    setResolutionBusy(true);
    setResolutionError("");
    try {
      setTicket(await markTicketResolved(ticketNumber));
    } catch (requestError) {
      setResolutionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the ticket.",
      );
    } finally {
      setResolutionBusy(false);
    }
  };

  return (
    <>
      <TopBar
        requester={requester}
        onChange={onLogout ?? (() => undefined)}
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

        {createdFromForm && (
          <div className="success-banner">Ticket created: {ticketNumber}</div>
        )}

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

            {canMarkResolved && !ticket.problemAppearsResolved && (
              <button
                type="button"
                disabled={resolutionBusy}
                onClick={() => void markResolved()}
              >
                {resolutionBusy ? "Saving..." : "Problem Appears Resolved"}
              </button>
            )}
            {ticket.problemAppearsResolved && (
              <p className="success-inline">
                You marked this as appearing resolved.
              </p>
            )}
            {resolutionError && (
              <div className="error-banner" role="alert">
                {resolutionError}
              </div>
            )}

            {/* Summary */}
            <div className="field full-width">
              <span>Summary</span>
              <input value={ticket.summary} readOnly aria-readonly="true" />
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

            <div
              className="ticket-tabs"
              role="tablist"
              aria-label="Ticket sections"
            >
              {[
                "Public Comments",
                "Attachments",
                // "Service Actions",
                // "Event Log",
              ].map((tab) => {
                const key = tab.toLowerCase().replace(" ", "-");
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    className={`attachment-tab${activeTab === key ? " active" : ""}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            {activeTab === "attachments" ? (
              <AttachmentTicketDetail ticketNumber={ticketNumber} />
            ) : activeTab === "public-comments" ? (
              <ConversationPanel ticketRef={ticketNumber} />
            ) : (
              <div className="attachment-empty">
                This section will be implemented later.
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
