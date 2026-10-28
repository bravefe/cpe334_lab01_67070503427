import { useCallback, useEffect, useState } from "react";
import TopBar from "../TopBar";
import {
  getAdminDashboard,
  getRequesterDashboard,
  getStaffDashboard,
} from "../../api/dashboard";
import { fetchPriorities } from "../../api/referenceData";
import {
  AdminDashboard,
  RecentTicket,
  RequesterDashboard,
  StaffDashboard,
} from "../../lib/dashboard";
import { Priority } from "../../lib/reference";
import { Requester } from "../../lib/requester";
import "./Dashboard.css";

interface DashboardProps {
  requester: Requester;
}

interface MetricCardDef {
  label: string;
  value: number;
  href: string;
}

const navigate = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

/* ---------- small shared pieces ---------- */

function MetricCard({ label, value, href }: MetricCardDef) {
  return (
    <button
      type="button"
      className="dash-card"
      onClick={() => navigate(href)}
      aria-label={`${label}: ${value}. View tickets`}
    >
      <span className="dash-card-label">{label}</span>
      <span className="dash-card-value">{value}</span>
    </button>
  );
}

function MetricGrid({
  cards,
  columns,
  loading,
}: {
  cards: MetricCardDef[];
  columns: 4 | 6;
  loading: boolean;
}) {
  return (
    <section
      className={`dash-grid dash-grid-${columns}`}
      aria-label="Ticket summary"
    >
      {loading
        ? Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="dash-card dash-skeleton" aria-hidden="true">
              <span className="skeleton-line short" />
              <span className="skeleton-line tall" />
            </div>
          ))
        : cards.map((card) => <MetricCard key={card.label} {...card} />)}
    </section>
  );
}

function RecentTickets({
  title,
  tickets,
  loading,
  viewAllHref,
  ticketHref,
}: {
  title: string;
  tickets: RecentTicket[];
  loading: boolean;
  viewAllHref: string;
  ticketHref: (id: number) => string;
}) {
  return (
    <section className="dash-panel" aria-labelledby="recent-heading">
      <div className="dash-panel-header">
        <h2 id="recent-heading">{title}</h2>
        <a
          href={viewAllHref}
          className="dash-link"
          onClick={(e) => {
            e.preventDefault();
            navigate(viewAllHref);
          }}
        >
          View all
        </a>
      </div>

      {loading ? (
        <ul className="recent-list" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="recent-row dash-skeleton">
              <span className="skeleton-line" />
            </li>
          ))}
        </ul>
      ) : tickets.length === 0 ? (
        <p className="muted dash-empty">No recent tickets.</p>
      ) : (
        <ul className="recent-list">
          {tickets.slice(0, 5).map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                className="recent-row"
                onClick={() => navigate(ticketHref(ticket.id))}
              >
                <span className="recent-id">#{ticket.id}</span>
                <span className="recent-title">{ticket.title}</span>
                <span className="dash-badge status-badge">{ticket.status}</span>
                <span className="recent-time">
                  {formatDate(ticket.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuickActions({
  actions,
}: {
  actions: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <section className="dash-panel" aria-labelledby="quick-heading">
      <h2 id="quick-heading">Quick Actions</h2>
      <div className="quick-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.primary ? "primary" : undefined}
            onClick={() => navigate(action.href)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- page ---------- */

export default function Dashboard({ requester }: DashboardProps) {
  const role = requester.role;
  const isRequester = role === "REQUESTER";
  const isAdmin = role === "ADMINISTRATOR";
  const firstName = requester.name.trim().split(/\s+/)[0] || requester.name;

  const [requesterData, setRequesterData] = useState<RequesterDashboard | null>(
    null,
  );
  const [staffData, setStaffData] = useState<
    StaffDashboard | AdminDashboard | null
  >(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        if (isRequester) {
          setRequesterData(await getRequesterDashboard(signal));
        } else {
          const [dashboard, priorityResult] = await Promise.all([
            isAdmin
              ? getAdminDashboard(signal)
              : getStaffDashboard(signal),
            fetchPriorities(),
          ]);
          if (signal?.aborted) return;
          setStaffData(dashboard);
          setPriorities(
            priorityResult.data.sort((a, b) => a.sortOrder - b.sortOrder),
          );
        }
      } catch (err) {
        if (signal?.aborted) return;
        setError(
          err instanceof Error ? err.message : "Unable to load the dashboard.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [isRequester, isAdmin],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const hasData = isRequester ? requesterData !== null : staffData !== null;
  const showSkeleton = loading && !hasData;

  /* ----- requester view ----- */
  const renderRequester = () => {
    const d = requesterData;
    const cards: MetricCardDef[] = [
      {
        label: "Total Open",
        value: d?.totalOpen ?? 0,
        href: "/my-tickets?status=New,Open,In Progress,Waiting for Requester,Reopened",
      },
      {
        label: "Waiting for You",
        value: d?.waitingForYou ?? 0,
        href: "/my-tickets?status=Waiting for Requester",
      },
      {
        label: "Recently Resolved",
        value: d?.recentlyResolved ?? 0,
        href: "/my-tickets?status=Resolved",
      },
      {
        label: "Closed",
        value: d?.closed ?? 0,
        href: "/my-tickets?status=Closed",
      },
    ];

    return (
      <>
        <MetricGrid cards={cards} columns={4} loading={showSkeleton} />
        <div className="dash-lower">
          <RecentTickets
            title="My Recent Tickets"
            tickets={d?.recentTickets ?? []}
            loading={showSkeleton}
            viewAllHref="/my-tickets"
            ticketHref={(id) => `/ticket/${id}`}
          />
          <QuickActions
            actions={[
              { label: "Create Ticket", href: "/create-ticket", primary: true },
              { label: "View My Tickets", href: "/my-tickets" },
            ]}
          />
        </div>
      </>
    );
  };

  /* ----- staff / admin view ----- */
  const renderStaff = () => {
    const d = staffData;
    const cards: MetricCardDef[] = [
      {
        label: "Unassigned",
        value: d?.unassigned ?? 0,
        href: "/queue?filter=unassigned",
      },
      {
        label: "My Assigned",
        value: d?.myAssigned ?? 0,
        href: "/queue?filter=my-assigned",
      },
      { label: "New", value: d?.new ?? 0, href: "/queue?status=New" },
      { label: "Open", value: d?.open ?? 0, href: "/queue?status=Open" },
      {
        label: "In Progress",
        value: d?.inProgress ?? 0,
        href: "/queue?status=In Progress",
      },
      {
        label: "Waiting for Requester",
        value: d?.waitingForRequester ?? 0,
        href: "/queue?status=Waiting for Requester",
      },
    ];

    const priorityRows = priorities.map((priority) => ({
      name: priority.name,
      count:
        d?.byPriority.find(
          (p) =>
            p.priorityName.toLowerCase() === priority.name.toLowerCase(),
        )?.count ?? 0,
    }));

    const userCounts = d && "userCounts" in d ? d.userCounts : null;

    return (
      <>
        <MetricGrid cards={cards} columns={6} loading={showSkeleton} />

        <section className="dash-panel" aria-labelledby="priority-heading">
          <h2 id="priority-heading">By IT Priority</h2>
          <ul className="priority-list">
            {priorityRows.map((row) => (
              <li key={row.name}>
                <button
                  type="button"
                  className="priority-row"
                  onClick={() => navigate(`/queue?priority=${row.name}`)}
                  aria-label={`${row.name} priority: ${row.count} tickets`}
                >
                  <span
                    className={`dash-badge priority-badge priority-${row.name.toLowerCase()}`}
                  >
                    {row.name}
                  </span>
                  <span className="priority-count">
                    {showSkeleton ? "–" : row.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {isAdmin && (
          <section className="dash-panel" aria-labelledby="users-heading">
            <div className="dash-panel-header">
              <h2 id="users-heading">Users</h2>
              <a
                href="/admin/users"
                className="dash-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/admin/users");
                }}
              >
                Manage users
              </a>
            </div>
            {showSkeleton || !userCounts ? (
              <div className="dash-skeleton" aria-hidden="true">
                <span className="skeleton-line" />
              </div>
            ) : (
              <div className="user-counts">
                <div className="user-stat">
                  <span className="dash-card-label">Total</span>
                  <span className="user-stat-value">{userCounts.total}</span>
                </div>
                <div className="user-stat">
                  <span className="dash-card-label">Active</span>
                  <span className="user-stat-value">{userCounts.active}</span>
                </div>
                {userCounts.byRole.map((r) => (
                  <div key={r.role} className="user-stat">
                    <span className="dash-card-label">{r.role}</span>
                    <span className="user-stat-value">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="dash-lower">
          <RecentTickets
            title="My Recent Tickets"
            tickets={d?.recentTickets ?? []}
            loading={showSkeleton}
            viewAllHref="/queue"
            ticketHref={(id) => `/queue/${id}`}
          />
          <QuickActions
            actions={[
              { label: "Create Ticket", href: "/create-ticket", primary: true },
              { label: "Search Tickets", href: "/queue?focus=search" },
              { label: "My Queue", href: "/queue?filter=my-assigned" },
            ]}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <TopBar requester={requester} />
      <main className="dashboard-page">
        <header className="dash-header">
          <div>
            <h1>
              {isRequester
                ? `Welcome, ${firstName}!`
                : `Welcome back, ${firstName}!`}
            </h1>
            <p className="muted">
              {isRequester
                ? "Here is where your tickets stand."
                : "Here is your ticket overview."}
            </p>
          </div>
          <button
            type="button"
            className="dash-refresh"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <span aria-hidden="true">↻</span>{" "}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="dash-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}

        {isRequester ? renderRequester() : renderStaff()}
      </main>
    </>
  );
}
