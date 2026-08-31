import { useEffect, useState } from "react";
import { fetchTicketDetail } from "../../api/tickets";
import { Requester } from "../../lib/requester";
import { TicketDetail as TicketDetailType } from "../../lib/ticket";
import TopBar from "../TopBar";
import "./TicketDetail.css";

interface TicketDetailProps {
  requester?: Requester;
  requesterId: number;
  ticketNumber: string;
  onBack: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function TicketDetail({ requester, requesterId, ticketNumber, onBack }: TicketDetailProps) {
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
      .catch(() => setError("Could not load this ticket."))
      .finally(() => setLoading(false));
  }, [requesterId, ticketNumber]);

  return (
    <>
      <TopBar requester={requester} onChange={() => window.location.assign("/choose-requester")} onMyTickets={onBack} onCreateTicket={() => window.location.assign("/create-ticket")} />
      <main className="page detail-page">
        <div className="detail-header">
          <div className="breadcrumbs">My Tickets &nbsp;&gt;&nbsp; Ticket Details</div>
          <button className="back-link" onClick={onBack}>← Back to My Tickets</button>
        </div>

        {loading && <div className="empty">Loading ticket...</div>}
        {error && <div className="empty"><h2>{error}</h2></div>}

        {ticket && (
          <section className="detail-card">
            <div className="detail-grid">
              <div className="detail-field"><label>Ticket No.</label><span>{ticket.ticketNumber}</span></div>
              <div className="detail-field"><label>Ticket Date</label><span>{formatDate(ticket.createdAt)}</span></div>
              <div className="detail-field"><label>Category</label><span>{ticket.category?.name ?? ""}</span></div>
              <div className="detail-field"><label>Related System</label><span>{ticket.relatedSystem?.name ?? ""}</span></div>
            </div>

            <div className="detail-grid second-row">
              <div className="detail-field"><label>Requester</label><span>{ticket.requester?.name ?? ""}</span></div>
              <div className="detail-field"><label>Requested Priority</label><span className="badge priority-tag">{ticket.requestedPriority?.name ?? ""}</span></div>
              <div className="detail-field"><label>Current Status</label><span className="badge status-tag">{ticket.currentStatus?.name ?? ""}</span></div>
            </div>

            <div className="detail-field summary-row">
              <label>Summary</label>
              <span>{ticket.summary}</span>
            </div>

            <div className="detail-field text-block">
              <label>Description</label>
              <p>{ticket.description}</p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
