import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCategories,
  getPriorities,
  getStatuses,
  getTickets,
  type ReferenceItem,
  type Ticket,
} from "../lib/ticketApi";

import "../design/MyTickets.css";

type SortField =
  | "createdAt"
  | "ticketNumber"
  | "requestedPriorityId"
  | "currentStatusId"
  | "updatedAt";

type ListState = "loading" | "success" | "error";

const PAGE_SIZE = 8;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function lookupName(items: ReferenceItem[], id: number, fallback: string) {
  return items.find((item) => item.id === id)?.name ?? fallback;
}

function priorityClass(name: string) {
  return `priority-badge priority-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

function statusClass(name: string) {
  return `status-badge status-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

function SortButton({
  field,
  label,
  sortBy,
  sortDir,
  onChange,
}: {
  field: SortField;
  label: string;
  sortBy: SortField;
  sortDir: "asc" | "desc";
  onChange: (field: SortField) => void;
}) {
  const active = sortBy === field;

  return (
    <button
      type="button"
      className={`sort-button ${active ? "active" : ""}`}
      onClick={() => onChange(field)}
      aria-label={`Sort by ${label}${active ? `, currently ${sortDir === "asc" ? "ascending" : "descending"}` : ""}`}
    >
      {label}
      <span aria-hidden="true">{active ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>
    </button>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <tr key={index} className="skeleton-row" aria-hidden="true">
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <td key={cellIndex}>
              <span className="skeleton-line" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function MyTickets({
  onCreateTicket,
  onChangeRequester,
  onOpenTicket,
}: {
  onCreateTicket?: () => void;
  onChangeRequester?: () => void;
  onOpenTicket?: (ticketNumber: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [requestedPriorityId, setRequestedPriorityId] = useState<number | "">("");
  const [currentStatusId, setCurrentStatusId] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [listState, setListState] = useState<ListState>("loading");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<ReferenceItem[]>([]);
  const [priorities, setPriorities] = useState<ReferenceItem[]>([]);
  const [statuses, setStatuses] = useState<ReferenceItem[]>([]);
  const [referencesLoaded, setReferencesLoaded] = useState(false);
  const [referencesError, setReferencesError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const loadReferences = useCallback(async () => {
    try {
      setReferencesError("");
      const [categoryData, priorityData, statusData] = await Promise.all([
        getCategories(),
        getPriorities(),
        getStatuses(),
      ]);
      setCategories(categoryData);
      setPriorities(priorityData);
      setStatuses(statusData);
      setReferencesLoaded(true);
    } catch (err) {
      setReferencesLoaded(false);
      setReferencesError(
        err instanceof Error ? err.message : "Unable to load filter options.",
      );
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setListState("loading");
    setError("");

    try {
      const response = await getTickets({
        search,
        categoryId,
        requestedPriorityId,
        currentStatusId,
        sortBy,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      });
      setTickets(response.data);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
      setPage(response.page);
      setListState("success");
    } catch (err) {
      setTickets([]);
      setTotalItems(0);
      setTotalPages(0);
      setError(err instanceof Error ? err.message : "Unable to load your tickets.");
      setListState("error");
    }
  }, [categoryId, currentStatusId, page, requestedPriorityId, search, sortBy, sortDir]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTickets();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadTickets]);

  const hasFilters = useMemo(
    () =>
      Boolean(search.trim()) ||
      categoryId !== "" ||
      requestedPriorityId !== "" ||
      currentStatusId !== "",
    [categoryId, currentStatusId, requestedPriorityId, search],
  );

  function updateFilter(action: () => void) {
    action();
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setRequestedPriorityId("");
    setCurrentStatusId("");
    setPage(1);
  }

  function changeSort(field: SortField) {
    setPage(1);
    if (sortBy === field) {
      setSortDir((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortDir("asc");
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(page * PAGE_SIZE, totalItems);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (page >= totalPages - 3) return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, -1, page - 1, page, page + 1, -2, totalPages];
  }, [page, totalPages]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => setProfileOpen(false)} aria-label="TokTickIT home">
            <span className="brand-icon" aria-hidden="true">◷</span>
            <span className="brand-name">TikTockIT</span>
          </button>

          <nav className="nav-links" aria-label="Primary navigation">
            <button type="button" className="nav-link active" aria-current="page">
              <span aria-hidden="true">▣</span>
              My Tickets
            </button>
            <button type="button" className="nav-link" onClick={onCreateTicket}>
              <span aria-hidden="true">⊕</span>
              Create Ticket
            </button>
          </nav>

          <div className="profile-wrap">
            <button
              type="button"
              className="profile-button"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="profile-icon" aria-hidden="true">◉</span>
              <span>Profile</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {profileOpen && (
              <div className="profile-menu" role="menu">
                <button type="button" role="menuitem" onClick={onChangeRequester}>
                  Change Requester
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="page-content">
        <section className="page-heading">
          <div>
            <h1>My Tickets</h1>
            <p>View and track all of your support requests.</p>
          </div>
          <div className="page-actions">
            <button type="button" className="secondary-button" onClick={clearFilters}>
              <span aria-hidden="true">↻</span>
              Clear Filters
            </button>
            <button type="button" className="primary-button" onClick={onCreateTicket}>
              <span aria-hidden="true">＋</span>
              Create Ticket
            </button>
          </div>
        </section>

        <section className="filter-panel" aria-label="Ticket search and filters">
        
          <div className="search-field">
            <span>Search</span>
            {/* <span className="search-icon" aria-hidden="true">⌕</span> */}
            <input
              type="search"
              value={search}
              onChange={(event) => updateFilter(() => setSearch(event.target.value))}
              placeholder="Search by ticket number or summary..."
              aria-label="Search by ticket number or summary"
            />
          </div>

          <label className="filter-field">
            <span>Category</span>
            <select
              value={categoryId}
              onChange={(event) => updateFilter(() => setCategoryId(event.target.value ? Number(event.target.value) : ""))}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Requested Priority</span>
            <select
              value={requestedPriorityId}
              onChange={(event) => updateFilter(() => setRequestedPriorityId(event.target.value ? Number(event.target.value) : ""))}
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>{priority.name}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Current Status</span>
            <select
              value={currentStatusId}
              onChange={(event) => updateFilter(() => setCurrentStatusId(event.target.value ? Number(event.target.value) : ""))}
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </label>
        </section>

        {(referencesError || !referencesLoaded) && (
          <div className="inline-error" role="alert">
            <div>
              <strong>Filter options unavailable.</strong>
              <span>{referencesError || "Loading filter options…"}</span>
            </div>
            {referencesError && (
              <button type="button" className="link-button" onClick={() => void loadReferences()}>
                Retry
              </button>
            )}
          </div>
        )}

        {listState === "error" ? (
          <section className="state-card" role="alert">
            <div className="state-icon" aria-hidden="true">!</div>
            <h2>Unable to load your tickets</h2>
            <p>{error}</p>
            <button type="button" className="primary-button" onClick={() => void loadTickets()}>
              Retry
            </button>
          </section>
        ) : (
          <section className="ticket-table-card">
            {listState === "loading" ? (
              <div className="table-wrapper" aria-busy="true">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket No.</th>
                      <th>Created Date</th>
                      <th>Summary</th>
                      <th>Category</th>
                      <th>Requested Priority</th>
                      <th>Current Status</th>
                      <th>Ticket Owner</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody><SkeletonRows /></tbody>
                </table>
              </div>
            ) : totalItems === 0 ? (
              <div className="state-card table-state">
                <div className="state-icon" aria-hidden="true">⌕</div>
                <h2>{hasFilters ? "No tickets match your filters" : "You have no tickets yet"}</h2>
                <p>
                  {hasFilters
                    ? "Try changing your search or filters to see more results."
                    : "Create a support ticket to see it here."}
                </p>
                {hasFilters ? (
                  <button type="button" className="secondary-button" onClick={clearFilters}>
                    Clear Filters
                  </button>
                ) : (
                  <button type="button" className="primary-button" onClick={onCreateTicket}>
                    <span aria-hidden="true">＋</span>
                    Create Ticket
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-wrapper desktop-table">
                  <table>
                    <thead>
                      <tr>
                        <th><SortButton field="ticketNumber" label="Ticket No." sortBy={sortBy} sortDir={sortDir} onChange={changeSort} /></th>
                        <th><SortButton field="createdAt" label="Created Date" sortBy={sortBy} sortDir={sortDir} onChange={changeSort} /></th>
                        <th>Summary</th>
                        <th>Category</th>
                        <th><SortButton field="requestedPriorityId" label="Requested Priority" sortBy={sortBy} sortDir={sortDir} onChange={changeSort} /></th>
                        <th><SortButton field="currentStatusId" label="Current Status" sortBy={sortBy} sortDir={sortDir} onChange={changeSort} /></th>
                        <th>Ticket Owner</th>
                        <th><SortButton field="updatedAt" label="Last Updated" sortBy={sortBy} sortDir={sortDir} onChange={changeSort} /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => {
                        const category = lookupName(categories, ticket.categoryId, "Unknown");
                        const priority = lookupName(priorities, ticket.requestedPriorityId, "Unknown");
                        const status = lookupName(statuses, ticket.currentStatusId, "Unknown");
                        return (
                          <tr key={ticket.ticketNumber}>
                            <td>
                              <button
                                type="button"
                                className="ticket-number"
                                onClick={() => onOpenTicket?.(ticket.ticketNumber)}
                              >
                                {ticket.ticketNumber}
                              </button>
                            </td>
                            <td>{formatDate(ticket.createdAt)}</td>
                            <td className="summary-cell" title={ticket.summary}>{ticket.summary}</td>
                            <td>{category}</td>
                            <td><span className={priorityClass(priority)}>{priority}</span></td>
                            <td><span className={statusClass(status)}>{status}</span></td>
                            <td>Unassigned</td>
                            <td>{formatDate(ticket.updatedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-ticket-list">
                  {tickets.map((ticket) => {
                    const category = lookupName(categories, ticket.categoryId, "Unknown");
                    const priority = lookupName(priorities, ticket.requestedPriorityId, "Unknown");
                    const status = lookupName(statuses, ticket.currentStatusId, "Unknown");
                    return (
                      <article className="ticket-card" key={ticket.ticketNumber}>
                        <div className="ticket-card-top">
                          <button
                            type="button"
                            className="ticket-number"
                            onClick={() => onOpenTicket?.(ticket.ticketNumber)}
                          >
                            {ticket.ticketNumber}
                          </button>
                          <span className={statusClass(status)}>{status}</span>
                        </div>
                        <h2>{ticket.summary}</h2>
                        <dl>
                          <div><dt>Created Date</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
                          <div><dt>Category</dt><dd>{category}</dd></div>
                          <div><dt>Requested Priority</dt><dd><span className={priorityClass(priority)}>{priority}</span></dd></div>
                          <div><dt>Ticket Owner</dt><dd>Unassigned</dd></div>
                          <div><dt>Last Updated</dt><dd>{formatDate(ticket.updatedAt)}</dd></div>
                        </dl>
                      </article>
                    );
                  })}
                </div>

                <footer className="pagination-bar">
                  <p>Showing {startItem} to {endItem} of {totalItems} tickets</p>
                  <div className="pagination-controls" aria-label="Ticket pagination">
                    <button
                      type="button"
                      className="page-button page-nav"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      ‹ Previous
                    </button>
                    {pageNumbers.map((number, index) => (
                      number < 0 ? (
                        <span key={`ellipsis-${index}`} className="page-ellipsis">…</span>
                      ) : (
                        <button
                          key={number}
                          type="button"
                          className={`page-button ${page === number ? "current" : ""}`}
                          aria-current={page === number ? "page" : undefined}
                          onClick={() => setPage(number)}
                        >
                          {number}
                        </button>
                      )
                    ))}
                    <button
                      type="button"
                      className="page-button page-nav"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    >
                      Next ›
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
