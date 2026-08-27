import { Requester } from "../lib/requester";
import "./TopBar.css";

interface TopBarProps {
  requester?: Requester;
  onChange: () => void;
  onMyTickets: () => void;
}

export default function TopBar({ requester, onChange, onMyTickets }: TopBarProps) {
  return (
    <nav className="topbar">
      <strong className="logo">◷ TokTockIT</strong>
      <a className="active" onClick={onMyTickets} aria-label="My Tickets" title="My Tickets">
        <span className="nav-icon" aria-hidden="true">▣</span>
        <span className="nav-label">My Tickets</span>
      </a>
      <a aria-label="Create Ticket" title="Create Ticket">
        <span className="nav-icon" aria-hidden="true">＋</span>
        <span className="nav-label">Create Ticket</span>
      </a>
      <a className="profile"onClick={onChange}>
        <span className="profile-name">
          {(requester?.name ?? "Profile").split(/\s+/).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </span>
      </a>
    </nav>
  );
}
