import { Requester } from "../lib/requester";
import "./TopBar.css";
import logo from "../icon/logo.png";

interface TopBarProps {
  requester?: Requester;
  onChange: () => void;
  onMyTickets: () => void;
}

export default function TopBar({ requester, onChange, onMyTickets }: TopBarProps) {
  const currentPage = window.location.pathname;
  const isMyTicketsPage = currentPage === "/my-tickets" || currentPage === "/my-ticket";
  const isChooseRequesterPage = currentPage === "/choose-requester";

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
        <span className="nav-icon" aria-hidden="true">▣</span>
        <span className="nav-label">My Tickets</span>
      </a>
      <a aria-label="Create Ticket" title="Create Ticket">
        <span className="nav-icon" aria-hidden="true">＋</span>
        <span className="nav-label">Create Ticket</span>
      </a>
      <a
        className={`profile${isChooseRequesterPage ? " active" : ""}`}
        onClick={onChange}
      >
        <span className="profile-name">
          {(requester?.name ?? "Profile").split(/\s+/).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </span>
      </a>
    </nav>
  );
}
