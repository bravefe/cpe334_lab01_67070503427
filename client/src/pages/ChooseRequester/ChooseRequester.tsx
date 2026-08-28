import { useState } from "react";
import { Requester } from "../../lib/requester";
import TopBar from "../TopBar";
import "./ChooseRequester.css";

interface ChooseRequesterProps {
  requesters: Requester[];
  loading: boolean;
  error: string;
  retry: () => void;
  onSelect: (id: number) => void;
  onChange: () => void;
  onMyTickets: () => void;
}

export default function ChooseRequester({
  requesters,
  loading,
  error,
  retry,
  onSelect,
  onChange,
  onMyTickets,
}: ChooseRequesterProps) {
  const [selected, setSelected] = useState("");

  return (
    <>
      <TopBar onChange={onChange} onMyTickets={onMyTickets} />
      <main className="selection">
        <div className="selection-card">
          <div className="brand-mark">◷</div>
          <p className="eyebrow">TOKTockIT / DEVELOPMENT TOOL</p>
          <h1>Choose a requester</h1>
          <p className="muted">Development testing tool - not a login.</p>

          {loading ? (
            <div className="loading">Loading requesters...</div>
          ) : error ? (
            <div className="error">
              <p>{error}</p>
              <button onClick={retry}>Retry</button>
            </div>
          ) : requesters.length === 0 ? (
            <div className="empty">
              <p>No active requesters are available.</p>
            </div>
          ) : (
            <>
              <label htmlFor="requester">Requester</label>
              <select
                id="requester"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">Select a requester</option>
                {requesters.map((requester) => (
                  <option key={requester.id} value={requester.id}>
                    {requester.name}
                  </option>
                ))}
              </select>
              <button
                className="primary wide"
                disabled={!selected}
                onClick={() => onSelect(Number(selected))}
              >
                Continue to My Tickets
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
