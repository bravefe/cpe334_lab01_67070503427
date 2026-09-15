import { useEffect, useRef, useState } from "react";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const currentPage = window.location.pathname;
  const isMyTicketsPage = currentPage === "/my-tickets";
  const isCreateTicketPage = currentPage === "/create-ticket";

  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

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
      <div className="profile-menu" ref={profileMenuRef}>
        <button
          type="button"
          className="profile"
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          onClick={() => setProfileOpen((open) => !open)}
        >
          <span className="profile-name">
            {(requester?.name ?? "Profile").split(/\s+/).map((part) => (
              <span key={part}>{part}</span>
            ))}
          </span>
          <span className="profile-chevron" aria-hidden="true">
            ⌄
          </span>
        </button>
        {profileOpen && (
          <div className="profile-dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setProfileOpen(false);
                onChange();
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
