import { useEffect, useState } from "react";
import { fetchCategories, fetchPriorities, fetchStatuses } from "../../api/referenceData";
import { fetchTickets } from "../../api/tickets";
import { Category, Priority, Status } from "../../lib/reference";
import { Requester } from "../../lib/requester";
import { Ticket, TicketQuery } from "../../lib/ticket";
import TopBar from "../TopBar";
import "./MyTickets.css";

const initialQuery: TicketQuery = {
  search: "",
  sortBy: "createdAt",
  sortDir: "desc",
  page: 1,
  pageSize: 10,
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

interface MyTicketsProps {
  requester?: Requester;
  requesterId: number | null;
  onChange: () => void;
  onMyTickets: () => void;
}

export default function MyTickets({ requester, requesterId, onChange, onMyTickets }: MyTicketsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [draftSearch, setDraftSearch] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
  const [state, setState] = useState("loading");
  const [options, setOptions] = useState<{
    categories: Category[];
    priorities: Priority[];
    statuses: Status[];
  }>({ categories: [], priorities: [], statuses: [] });

  useEffect(() => {
    Promise.all([fetchCategories(), fetchPriorities(), fetchStatuses()])
      .then(([categories, priorities, statuses]) =>
        setOptions({
          categories: categories.data,
          priorities: priorities.data,
          statuses: statuses.data,
        }),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!requesterId) {
      setTickets([]);
      setMeta({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
      setState("ready");
      return;
    }

    setState("loading");
    fetchTickets(requesterId, query)
      .then((result) => {
        setTickets(result.data);
        setMeta(result);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [requesterId, query]);

  const update = (change: Partial<TicketQuery>) =>
    setQuery((current) => ({ ...current, ...change, page: 1 }));

  const clear = () => {
    setDraftSearch("");
    setQuery(initialQuery);
  };

  const sort = (field: string) =>
    setQuery((current) => ({
      ...current,
      sortBy: field,
      sortDir: current.sortBy === field && current.sortDir === "asc" ? "desc" : "asc",
      page: 1,
    }));

  const sortable: [string, string, boolean][] = [
    ["ticketNumber", "Ticket No.", true],
    ["createdAt", "Created Date", true],
    ["summary", "Summary", false],
    ["category", "Category", false],
    ["requestedPriorityId", "Requested Priority", true],
    ["currentStatusId", "Current Status", true],
    ["requester", "Ticket Owner", false],
    ["updatedAt", "Last Updated", true],
  ];

  const hasFilters = Boolean(
    query.search || query.category || query.requestedPriorityId || query.currentStatusId,
  );

  return (
    <>
      <TopBar requester={requester} onChange={onChange} onMyTickets={onMyTickets} />
      <main className="page">
        <header className="page-header">
          <div>
            <h1>My Tickets</h1>
            <p className="muted">View and track all of your support requests.</p>
          </div>
          <div className="actions">
            <button onClick={clear}>↻ Clear Filters</button>
            <button className="primary">＋ Create Ticket</button>
          </div>
        </header>

        <section className="filters">
          <label className="search-field" htmlFor="ticket-search">
            Search
            <input
              id="ticket-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && update({ search: draftSearch })}
              placeholder="Search by ticket number or summary..."
            />
          </label>
          <Filter
            label="Category"
            value={query.category}
            options={options.categories}
            onChange={(value) => update({ category: value })}
            all="All Categories"
          />
          <Filter
            label="Requested Priority"
            value={query.requestedPriorityId}
            options={options.priorities}
            onChange={(value) => update({ requestedPriorityId: value })}
            all="All Priorities"
          />
          <Filter
            label="Current Status"
            value={query.currentStatusId}
            options={options.statuses}
            onChange={(value) => update({ currentStatusId: value })}
            all="All Statuses"
          />
        </section>

        <section className="ticket-panel">
          {state === "loading" && <div className="loading rows">Loading tickets...</div>}
          {state === "error" && (
            <div className="empty">
              <h2>Could not load tickets</h2>
              <button onClick={() => setQuery({ ...query })}>Retry</button>
            </div>
          )}
          {state === "ready" && meta.totalItems === 0 && (
            <div className="empty">
              <h2>
                {!requesterId
                  ? "No Requester Selected"
                  : hasFilters
                    ? "No tickets match these filters"
                    : "No tickets yet"}
              </h2>
              <p className="muted">
                {!requesterId
                  ? "Choose a requester to view their tickets."
                  : meta.totalItems
                    ? "Try clearing the filters."
                    : "Create your first support request to get started."}
              </p>
              {requesterId && (
                <button className="primary" onClick={clear}>
                  {meta.totalItems ? "Clear Filters" : "＋ Create Ticket"}
                </button>
              )}
            </div>
          )}
          {state === "ready" && tickets.length > 0 && (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {sortable.map(([field, label, canSort]) => (
                        <th key={field}>
                          <button disabled={!canSort} onClick={() => sort(field)}>
                            {label}
                            {query.sortBy === field && (query.sortDir === "asc" ? " ↑" : " ↓")}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.ticketNumber}>
                        <td className="ticket-number">{ticket.ticketNumber}</td>
                        <td className="created-date">{formatDate(ticket.createdAt)}</td>
                        <td className="summary">{ticket.summary}</td>
                        <td>{ticket.category.name}</td>
                        <td>
                          <span className={`badge priority-${ticket.requestedPriority.name.toLowerCase()}`}>
                            {ticket.requestedPriority.name}
                          </span>
                        </td>
                        <td><span className="badge status">{ticket.currentStatus.name}</span></td>
                        <td>{ticket.requester.name}</td>
                        <td>{formatDate(ticket.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer>
                <span>
                  Showing {(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} tickets
                </span>
                <div>
                  <button disabled={meta.page <= 1} onClick={() => setQuery({ ...query, page: meta.page - 1 })}>Previous</button>
                  {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((page) => (
                    <button className={page === meta.page ? "selected" : ""} key={page} onClick={() => setQuery({ ...query, page })}>
                      {page}
                    </button>
                  ))}
                  <button disabled={meta.page >= meta.totalPages} onClick={() => setQuery({ ...query, page: meta.page + 1 })}>Next</button>
                </div>
              </footer>
            </>
          )}
        </section>
      </main>
    </>
  );
}

interface FilterProps {
  label: string;
  value?: number;
  options: { id: number; name: string }[];
  onChange: (value?: number) => void;
  all: string;
}

function Filter({ label, value, options, onChange, all }: FilterProps) {
  return (
    <label>
      {label}
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}>
        <option value="">{all}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}
