import { Requester } from "../lib/requester";
import "./TopBar.css";
import logo from "../icon/logo.png";

interface TopBarProps {
  requester?: Requester;
  onChange: () => void;
  onMyTickets: () => void;
  onCreateTicket?: () => void;
}

export default function TopBar({
  requester,
  onChange,
  onMyTickets,
  onCreateTicket,
}: TopBarProps) {
  const currentPage = window.location.pathname;
  const isMyTicketsPage = currentPage === "/my-tickets";
  const isCreateTicketPage = currentPage === "/create-ticket";

  return (
    <nav className="topbar">
      <strong className="logo">
        <img src={logo} alt="TokTockIT logo" />
        TokTockIT
      </strong>

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
      <a className="profile" onClick={onChange}>
        <span className="profile-name">
          {(requester?.name ?? "Profile").split(/\s+/).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </span>
      </a>
      <button type="button" onClick={onChange} aria-label="Log out">
        Log out
      </button>
    </nav>
  );
}
