import { useEffect, useState } from "react";
import { getCurrentUser, logout as logoutUser } from "./api/auth";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import Login from "./pages/Login/Login";
import { AuthUser } from "./lib/auth";
import MyTickets from "./pages/MyTickets/MyTickets";
import TicketDetail from "./pages/TicketDetail/TicketDetail";
import StaffTicketQueue from "./pages/StaffTicketQueue/StaffTicketQueue";
import StaffTicketDetail from "./pages/StaffTicketDetail/StaffTicketDetail";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [path, setPath] = useState(window.location.pathname);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
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
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };
  const onMyTickets = () => goTo("/my-tickets");
  const onCreateTicket = () => goTo("/create-ticket");
  const onQueue = () => goTo("/queue");

  if (path.startsWith("/queue") && user.role !== "IT_STAFF") {
    return (
      <main className="selection">
        <div className="selection-card">
          <h1>Access forbidden</h1>
          <p className="muted">
            You are not permitted to view the IT Staff queue.
          </p>
          <button type="button" className="primary" onClick={onMyTickets}>
            ← Back to My Tickets
          </button>
        </div>
      </main>
    );
  }

  if (user.role === "IT_STAFF") {
    if (path === "/queue")
      return (
        <StaffTicketQueue
          requester={requester}
          onLogout={logout}
          onQueue={onQueue}
          onOpenTicket={(ticketRef) => goTo(`/queue/${ticketRef}`)}
        />
      );
    const staffTicketMatch = path.match(/^\/queue\/(.+)$/);
    if (staffTicketMatch)
      return (
        <StaffTicketDetail
          requester={requester}
          ticketRef={staffTicketMatch[1]}
          onLogout={logout}
          onQueue={onQueue}
        />
      );
    return (
      <StaffTicketQueue
        requester={requester}
        onLogout={logout}
        onQueue={onQueue}
        onOpenTicket={(ticketRef) => goTo(`/queue/${ticketRef}`)}
      />
    );
  }

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
