import { useEffect, useState } from "react";
import { fetchRequesters } from "./api/requesters";
import { Requester } from "./lib/requester";
import ChooseRequester from "./pages/ChooseRequester/ChooseRequester";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import MyTickets from "./pages/MyTickets/MyTickets";
import TicketDetail from "./pages/TicketDetail/TicketDetail";

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
    if (window.location.pathname === "/") {
      setPath("/choose-requester");
    }
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

  const selectedRequester = requesters.find((item) => item.id === requesterId);

  const handleSelect = (id: number) => {
    localStorage.setItem("requesterId", String(id));
    setRequesterId(id);
    goTo("/my-tickets");
  };

  const handleChangeRequester = () => {
    goTo("/choose-requester");
  };

  const handleMyTickets = () => goTo("/my-tickets");
  const handleCreateTicket = () => goTo("/create-ticket");
  const handleOpenTicket = (ticketNumber: string) => goTo(`/ticket/${ticketNumber}`);

  const sharedProps = {
    requesters,
    requester: selectedRequester,
    loading,
    error,
    retry: loadRequesters,
    onChange: handleChangeRequester,
    onMyTickets: handleMyTickets,
    onCreateTicket: handleCreateTicket,
  };

  if (path === "/choose-requester") {
    return (
      <ChooseRequester
        {...sharedProps}
        onSelect={handleSelect}
        onMyTickets={handleMyTickets}
      />
    );
  }

  if (path === "/my-tickets") {
    if (!requesterId) {
      return <ChooseRequester {...sharedProps} onSelect={handleSelect} onMyTickets={handleMyTickets} />;
    }

    return (
      <MyTickets
        requester={selectedRequester}
        requesterId={requesterId}
        onChange={handleChangeRequester}
        onMyTickets={handleMyTickets}
        onCreateTicket={handleCreateTicket}
        onOpenTicket={handleOpenTicket}
      />
    );
  }

  if (path === "/create-ticket") {
    if (!requesterId) {
      return <ChooseRequester {...sharedProps} onSelect={handleSelect} onMyTickets={handleMyTickets} />;
    }

    return (
      <CreateTicket
        requester={selectedRequester}
        requesterId={requesterId}
        onBack={handleMyTickets}
        onCreateTicket={handleCreateTicket}
        onOpenTicket={handleOpenTicket}
      />
    );
  }

  const ticketMatch = path.match(/^\/ticket\/(.+)$/);
  if (ticketMatch) {
    if (!requesterId) {
      return <ChooseRequester {...sharedProps} onSelect={handleSelect} onMyTickets={handleMyTickets} />;
    }

    return (
      <TicketDetail
        requester={selectedRequester}
        requesterId={requesterId}
        ticketNumber={ticketMatch[1]}
        onBack={handleMyTickets}
      />
    );
  }

  return <ChooseRequester {...sharedProps} onSelect={handleSelect} onMyTickets={handleMyTickets} />;
}
