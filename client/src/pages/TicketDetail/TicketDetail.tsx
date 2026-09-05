import { useEffect, useState } from "react";
import { fetchTicketDetail } from "../../api/tickets";
import { Requester } from "../../lib/requester";
import { TicketDetail as TicketDetailType } from "../../lib/ticket";
import TopBar from "../TopBar";
import AttachmentTicketDetail from "./AttachmentTicketDetail";
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
  const [activeTab, setActiveTab] = useState("attachments");
  const createdFromForm = new URLSearchParams(window.location.search).get("created") === "1";

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

        {createdFromForm && <div className="success-banner">Ticket created: {ticketNumber}</div>}

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

            <div className="ticket-tabs" role="tablist" aria-label="Ticket sections">
              {["Public Comments", "Attachments", "Service Actions", "Event Log"].map((tab) => {
                const key = tab.toLowerCase().replace(" ", "-");
                return <button key={tab} type="button" role="tab" className={`attachment-tab${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)}>{tab}</button>;
              })}
            </div>
            {activeTab === "attachments" ? <AttachmentTicketDetail requesterId={requesterId} ticketNumber={ticketNumber} /> : <div className="attachment-empty">This section will be implemented later.</div>}
          </section>
        )}
      </main>
    </>
  );
}

