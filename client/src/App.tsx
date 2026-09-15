import { useEffect, useState } from "react";
import { get } from "./api/client";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import Login, { AuthUser } from "./pages/Login/Login";
import MyTickets from "./pages/MyTickets/MyTickets";
import TicketDetail from "./pages/TicketDetail/TicketDetail";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [path, setPath] = useState(window.location.pathname);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<AuthUser>("/api/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const goTo = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(new URL(nextPath, window.location.origin).pathname);
  };

  if (loading)
    return (
      <main className="selection">
        <div className="loading">Loading...</div>
      </main>
    );
  if (!user) return <Login onLogin={setUser} />;
  if (user.mustChangePassword)
    return (
      <ChangePassword
        onComplete={() => setUser({ ...user, mustChangePassword: false })}
      />
    );

  const requester = {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
  };
  const logout = async () => {
    await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/auth/logout`,
      {
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "TokTickIT" },
      },
    );
    setUser(null);
  };
  const onMyTickets = () => goTo("/my-tickets");
  const onCreateTicket = () => goTo("/create-ticket");

  if (path === "/my-tickets") {
    return (
      <MyTickets
        requester={requester}
        onChange={logout}
        onMyTickets={onMyTickets}
        onCreateTicket={onCreateTicket}
        onOpenTicket={(ticketNumber) => goTo(`/ticket/${ticketNumber}`)}
      />
    );
  }

  if (path === "/create-ticket") {
    return (
      <CreateTicket
        requester={requester}
        onBack={onMyTickets}
        onLogout={logout}
        onCreateTicket={onCreateTicket}
        onOpenTicket={(ticketNumber) =>
          goTo(`/ticket/${ticketNumber}?created=1`)
        }
      />
    );
  }

  const ticketMatch = path.match(/^\/ticket\/(.+)$/);
  if (ticketMatch) {
    return (
      <TicketDetail
        requester={requester}
        ticketNumber={ticketMatch[1]}
        onBack={onMyTickets}
        onLogout={logout}
      />
    );
  }

  return (
    <MyTickets
      requester={requester}
      onChange={() => undefined}
      onMyTickets={onMyTickets}
      onCreateTicket={onCreateTicket}
      onOpenTicket={(ticketNumber) => goTo(`/ticket/${ticketNumber}`)}
    />
  );
}
