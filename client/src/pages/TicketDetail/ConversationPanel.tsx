import { FormEvent, useEffect, useState } from "react";
import {
  createStaffComment,
  createStaffNote,
  createTicketComment,
  fetchStaffComments,
  fetchStaffNotes,
  fetchTicketComments,
} from "../../api/tickets";
import { InternalNote, TicketComment } from "../../lib/ticket";
import { formatDate } from "../../lib/formatDate";

interface ConversationPanelProps {
  ticketRef: string;
  staff?: boolean;
  activeTab?: "comments" | "notes";
  showTabs?: boolean;
}

export default function ConversationPanel({
  ticketRef,
  staff = false,
  activeTab,
  showTabs = true,
}: ConversationPanelProps) {
  const [internalTab, setInternalTab] = useState<"comments" | "notes">(
    "comments",
  );
  const tab = activeTab ?? internalTab;
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const requests = staff
      ? Promise.all([fetchStaffComments(ticketRef), fetchStaffNotes(ticketRef)])
      : Promise.all([fetchTicketComments(ticketRef)]);
    requests
      .then(([commentResult, noteResult]) => {
        setComments(commentResult.items);
        if (noteResult) setNotes(noteResult.items);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [staff, ticketRef]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) return;
    setBusy(true);
    setError("");
    try {
      if (staff && tab === "notes") {
        const note = await createStaffNote(ticketRef, trimmed);
        setNotes((current) => [...current, note]);
      } else {
        const comment = staff
          ? await createStaffComment(ticketRef, trimmed)
          : await createTicketComment(ticketRef, trimmed);
        setComments((current) => [...current, comment]);
      }
      setContent("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to post your message.",
      );
    } finally {
      setBusy(false);
    }
  };

  const entries = tab === "comments" ? comments : notes;

  return (
    <section className="conversation-panel" aria-label="Ticket conversation">
      {staff && showTabs && (
        <div
          className="ticket-tabs"
          role="tablist"
          aria-label="Ticket sections"
        >
          <button
            type="button"
            className={`attachment-tab${tab === "comments" ? " active" : ""}`}
            onClick={() => setInternalTab("comments")}
            role="tab"
            aria-selected={tab === "comments"}
          >
            Public Comments ({comments.length})
          </button>
          <button
            type="button"
            className={`attachment-tab${tab === "notes" ? " active" : ""}`}
            onClick={() => setInternalTab("notes")}
            role="tab"
            aria-selected={tab === "notes"}
          >
            Internal Notes ({notes.length})
          </button>
          <button
            type="button"
            className="attachment-tab"
            role="tab"
            aria-selected={tab === "attachments"}
          >
            Attachments
          </button>
        </div>
      )}
      {/* {!staff && <h2 className="conversation-heading">Public Comments</h2>} */}
      {/* {tab === "notes" && (
        <p className="internal-note-label">
          Internal - not visible to Requester
        </p>
      )} */}
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p className="muted">Loading conversation...</p>
      ) : entries.length === 0 ? (
        <p
          className={`conversation-empty${tab === "notes" ? " internal" : ""}`}
        >
          {tab === "notes" ? "No internal notes yet." : "No comments yet."}
        </p>
      ) : (
        <div
          className={
            tab === "notes" ? "conversation-list internal" : "conversation-list"
          }
        >
          {entries.map((entry) => (
            <article className="conversation-entry" key={entry.id}>
              <header>
                <strong>{entry.authorName}</strong>

                {"authorRole" in entry && (
                  <span>
                    {entry.authorRole === "REQUESTER"
                      ? "Requester"
                      : "IT Support"}
                  </span>
                )}

                <time dateTime={entry.createdAt}>
                  {formatDate(entry.createdAt)}
                </time>
              </header>

              <p>{entry.content}</p>
            </article>
          ))}
        </div>
      )}
      {/* Compose form at the bottom */}
      <form
        className={
          tab === "notes"
            ? "conversation-compose internal"
            : "conversation-compose"
        }
        onSubmit={submit}
      >
        <label htmlFor={`${ticketRef}-${tab}-content`}>
          {tab === "notes" ? "Add Internal Note" : "Add Public Comment"}

          <textarea
            id={`${ticketRef}-${tab}-content`}
            value={content}
            maxLength={2000}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              tab === "notes"
                ? "Write an internal note..."
                : "Write a public comment..."
            }
          />
        </label>

        <button
          className="primary"
          type="submit"
          disabled={busy || !content.trim()}
        >
          {busy ? "Posting..." : tab === "notes" ? "Add Note" : "Post Comment"}
        </button>
      </form>
    </section>
  );
}
