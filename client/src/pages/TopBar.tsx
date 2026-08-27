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
      <a className="active" onClick={onMyTickets}>▣ My Tickets</a>
      <a>＋ Create Ticket</a>
      <a className="profile"onClick={onChange}>
        {requester?.name ?? "Profile"}
      </a>
    </nav>
  );
}
