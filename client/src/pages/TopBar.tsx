import { useEffect, useRef, useState } from "react";
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
  onAdmin?: () => void;
}

export default function TopBar({
  requester,
  role = "REQUESTER",
  onChange,
  onMyTickets,
  onCreateTicket,
  onQueue,
  onAdmin,
}: TopBarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const currentPage = window.location.pathname;
  const isMyTicketsPage = currentPage === "/my-tickets";
  const isCreateTicketPage = currentPage === "/create-ticket";
  const isQueuePage = currentPage === "/queue";

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isProfileMenuOpen]);

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
      ) : role === "IT_STAFF" ? (
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
      ) : (
        <a
          className={currentPage === "/admin/users" ? "active" : undefined}
          onClick={onAdmin}
          aria-label="Admin"
          title="User Management"
        >
          <span className="nav-icon" aria-hidden="true">
            ▣
          </span>
          <span className="nav-label">Admin</span>
        </a>
      )}
      <div className="profile-menu" ref={profileMenuRef}>
        <button
          type="button"
          className="profile"
          aria-haspopup="menu"
          aria-expanded={isProfileMenuOpen}
          aria-label={`Profile menu for ${requester?.name ?? "Profile"}`}
          onClick={() => setIsProfileMenuOpen((open) => !open)}
        >
          <span className="profile-name">
            {(requester?.name ?? "Profile").split(/\s+/).map((part) => (
              <span key={part}>{part}</span>
            ))}
          </span>
          <span className="role-badge">{role.replaceAll("_", " ")}</span>
        </button>
        {isProfileMenuOpen && (
          <div className="profile-dropdown" role="menu" aria-label="Profile">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsProfileMenuOpen(false);
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
