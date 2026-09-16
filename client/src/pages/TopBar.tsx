import { Requester } from "../lib/requester";
import "./TopBar.css";
import logo from "../icon/logo.png";

interface TopBarProps {
  requester?: Requester;
  role?: string;
  onChange: () => void;
  onMyTickets?: () => void;
  onCreateTicket?: () => void;
  onQueue?: () => void;
}

export default function TopBar({
  requester,
  role = "REQUESTER",
  onChange,
  onMyTickets,
  onCreateTicket,
  onQueue,
}: TopBarProps) {
  const currentPage = window.location.pathname;
  const isMyTicketsPage = currentPage === "/my-tickets";
  const isCreateTicketPage = currentPage === "/create-ticket";
  const isQueuePage = currentPage.startsWith("/queue");

  return (
    <nav className="topbar">
      <strong className="logo">
        <img src={logo} alt="TokTockIT logo" />
        TokTockIT
      </strong>

      {role === "REQUESTER" ? (
        <>
          <a
            className={isMyTicketsPage ? "active" : undefined}
            onClick={onMyTickets}
            aria-label="My Tickets"
            title="My Tickets"
          >
            <span className="nav-icon" aria-hidden="true">
              ▣
            </span>
            <span className="nav-label">My Tickets</span>
          </a>
          <a
            className={isCreateTicketPage ? "active" : undefined}
            onClick={onCreateTicket ?? onMyTickets}
            aria-label="Create Ticket"
            title="Create Ticket"
          >
            <span className="nav-icon" aria-hidden="true">
              ＋
            </span>
            <span className="nav-label">Create Ticket</span>
          </a>
        </>
      ) : (
        <a
          className={isQueuePage ? "active" : undefined}
          onClick={onQueue ?? onMyTickets}
          aria-label="My Queue"
          title="My Queue"
        >
          <span className="nav-icon" aria-hidden="true">
            ▣
          </span>
          <span className="nav-label">My Queue</span>
        </a>
      )}
      <a className="profile" onClick={onChange}>
        <span className="profile-name">
          {(requester?.name ?? "Profile").split(/\s+/).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </span>
        <span className="role-badge">{role.replaceAll("_", " ")}</span>
      </a>
      <button type="button" onClick={onChange} aria-label="Log out">
        Log out
      </button>
    </nav>
  );
}
