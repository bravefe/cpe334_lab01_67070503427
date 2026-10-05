import { useEffect, useState } from "react";

import { getCurrentUser } from "./api/auth";

import ChangePassword from "./pages/ChangePassword/ChangePassword";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import Login from "./pages/Login/Login";
import MyTickets from "./pages/MyTickets/MyTickets";
import TicketDetail from "./pages/TicketDetail/TicketDetail";
import StaffTicketQueue from "./pages/StaffTicketQueue/StaffTicketQueue";
import StaffTicketDetail from "./pages/StaffTicketDetail/StaffTicketDetail";
import UserManagement from "./pages/UserManagement/UserManagement";

import { AuthUser } from "./lib/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [path, setPath] = useState(window.location.pathname);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    const handleAppLogout = () => {
      window.history.replaceState({}, "", "/login");
      setPath("/login");
      setUser(null);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("app:logout", handleAppLogout);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("app:logout", handleAppLogout);
    };
  }, []);

  const goTo = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(new URL(nextPath, window.location.origin).pathname);
  };

  const getDefaultPath = (role: string) => {
    if (role === "IT_STAFF") {
      return "/queue";
    }

    if (role === "ADMINISTRATOR") {
      return "/admin/users";
    }

    return "/my-tickets";
  };

  if (loading) {
    return (
      <main className="selection">
        <div className="loading">Loading...</div>
      </main>
    );
  }

  // Not logged in → /login
  if (!user) {
    if (path !== "/login") {
      window.history.replaceState({}, "", "/login");
      setPath("/login");
    }

    return <Login onLogin={setUser} />;
  }

  // User must change password → /change-password
  if (user.mustChangePassword) {
    if (path !== "/change-password") {
      window.history.replaceState({}, "", "/change-password");
      setPath("/change-password");
    }

    return (
      <ChangePassword
        onComplete={() => {
          setUser({ ...user, mustChangePassword: false });
          goTo(getDefaultPath(user.role));
        }}
      />
    );
  }

  // Logged-in users should not stay on auth pages.
  if (path === "/login" || path === "/change-password") {
    const defaultPath = getDefaultPath(user.role);

    window.history.replaceState({}, "", defaultPath);
    setPath(defaultPath);
  }

  const requester = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };

  const onMyTickets = () => goTo("/my-tickets");
  const onCreateTicket = () => goTo("/create-ticket");
  const onQueue = () => goTo("/queue");
  const onDefault = () => goTo(getDefaultPath(user.role));

  if (path.startsWith("/queue") && user.role == "REQUESTER") {
    return (
      <main className="selection">
        <div className="selection-card">
          <h1>Access forbidden</h1>
          <p className="muted">
            You are not permitted to view the IT Staff queue.
          </p>
          <button type="button" className="primary" onClick={onDefault}>
            ← Back to My Tickets
          </button>
        </div>
      </main>
    );
  }

  if (path.startsWith("/admin/users") && user.role !== "ADMINISTRATOR") {
    return (
      <main className="selection">
        <div className="selection-card">
          <h1>Access forbidden</h1>
          <p className="muted">
            You are not permitted to view User Management.
          </p>
          <button type="button" className="primary" onClick={onDefault}>
            ← Back
          </button>
        </div>
      </main>
    );
  }

  if (user.role === "ADMINISTRATOR") {
    if (path.startsWith("/admin/users")) {
      return <UserManagement currentUserId={user.id} user={requester} />;
    }
    if (path === "/queue") {
      return (
        <main className="selection">
          <StaffTicketQueue
            requester={requester}
            onOpenTicket={(ticketRef) => goTo(`/queue/${ticketRef}`)}
          />
        </main>
      );
    }
  }

  if (user.role === "IT_STAFF") {
    if (path === "/queue") {
      return (
        <StaffTicketQueue
          requester={requester}
          onOpenTicket={(ticketRef) => goTo(`/queue/${ticketRef}`)}
        />
      );
    }

    const staffTicketMatch = path.match(/^\/queue\/(.+)$/);

    if (staffTicketMatch) {
      return (
        <StaffTicketDetail
          requester={requester}
          ticketRef={staffTicketMatch[1]}
          onQueue={onQueue}
        />
      );
    }

    return (
      <StaffTicketQueue
        requester={requester}
        onOpenTicket={(ticketRef) => goTo(`/queue/${ticketRef}`)}
      />
    );
  }

  if (path === "/my-tickets") {
    return (
      <MyTickets
        requester={requester}
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
      />
    );
  }

  return (
    <MyTickets
      requester={requester}
      onCreateTicket={onCreateTicket}
      onOpenTicket={(ticketNumber) => goTo(`/ticket/${ticketNumber}`)}
    />
  );
}
