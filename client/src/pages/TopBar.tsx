import { Requester } from "../lib/requester";
import "./TopBar.css";

interface TopBarProps {
  requester?: Requester;
  onChange: () => void;
}

export default function TopBar({ requester, onChange }: TopBarProps) {
  return (
    <nav className="topbar">
      <strong className="logo">◷ TokTockIT</strong>
      <a className="active">▣ My Tickets</a>
      <a>＋ Create Ticket</a>
      <span className="profile">
        <button onClick={onChange}> {requester?.name ?? "Profile"}</button>
      </span>
    </nav>
  );
}
