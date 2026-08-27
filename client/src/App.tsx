import { useEffect, useState } from "react";
import { fetchRequesters } from "./api/requesters";
import { Requester } from "./lib/requester";
import ChooseRequester from "./pages/ChooseRequester/ChooseRequester";
import MyTickets from "./pages/MyTickets/MyTickets";

export default function App() {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [requesterId, setRequesterId] = useState<number | null>(() =>
    Number(localStorage.getItem("requesterId")) || null,
  );
  const [path, setPath] = useState(window.location.pathname);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequesters = () => {
    setLoading(true);
    setError("");
    fetchRequesters()
      .then((result) => setRequesters(result.data))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequesters();
  }, []);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const goTo = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const handleSelect = (id: number) => {
    localStorage.setItem("requesterId", String(id));
    setRequesterId(id);
    goTo("/my-tickets");
  };

  const handleChangeRequester = () => {
    localStorage.removeItem("requesterId");
    setRequesterId(null);
    goTo("/choose-requester");
  };

  const handleMyTickets = () => goTo("/my-ticket");

  if (!requesterId || (path !== "/my-tickets" && path !== "/my-ticket")) {
    return (
      <ChooseRequester
        requesters={requesters}
        loading={loading}
        error={error}
        retry={loadRequesters}
        onSelect={handleSelect}
      />
    );
  }

  return (
    <MyTickets
      requester={requesters.find((item) => item.id === requesterId)}
      requesterId={requesterId}
      onChange={handleChangeRequester}
      onMyTickets={handleMyTickets}
    />
  );
}
