import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchPriorities,
  fetchStatuses,
} from "../../api/referenceData";
import { fetchStaffTickets } from "../../api/tickets";
import { Category, Priority, Status } from "../../lib/reference";
import { StaffTicket, StaffTicketQuery } from "../../lib/ticket";
import { formatDate } from "../../lib/formatDate";
import TopBar from "../TopBar";
import "./StaffTicketQueue.css";

interface StaffTicketQueueProps {
  requester?: { id: number; name: string; email: string; isActive: boolean };
  onLogout: () => void;
  onQueue: () => void;
  onOpenTicket: (ticketRef: string) => void;
}

const initialQuery: StaffTicketQuery = {
  search: "",
  sort: "createdAt",
  sortDir: "desc",
  page: 1,
  pageSize: 10,
};

export default function StaffTicketQueue({
  requester,
  onLogout,
  onQueue,
  onOpenTicket,
}: StaffTicketQueueProps) {
  const [query, setQuery] = useState(initialQuery);
  const [draftSearch, setDraftSearch] = useState("");
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
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

  const load = () => {
    setState("loading");
    setError("");
    fetchStaffTickets(query)
      .then((result) => {
        setTickets(result.items);
        setMeta(result);
        setState("ready");
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the queue.",
        );
        setState("error");
      });
  };

  useEffect(load, [query]);

  const update = (change: Partial<StaffTicketQuery>) =>
    setQuery((current) => ({ ...current, ...change, page: 1 }));
  const clear = () => {
    setDraftSearch("");
    setQuery(initialQuery);
  };
  const sort = (field: StaffTicketQuery["sort"]) =>
    setQuery((current) => ({
      ...current,
      sort: field,
      sortDir:
        current.sort === field && current.sortDir === "asc" ? "desc" : "asc",
      page: 1,
    }));
  const hasFilters = Boolean(
    query.search ||
    query.status ||
    query.category ||
    query.requestedPriority ||
    query.itPriority ||
    query.owner,
  );

  return (
    <>
      <TopBar
        requester={requester}
        role="IT_STAFF"
        onChange={onLogout}
        onQueue={onQueue}
      />
      <main className="page staff-queue-page">
        <header className="page-header">
          <div>
            <h1>My Queue</h1>
            <p className="muted">Triage and resolve support tickets.</p>
          </div>
          <div className="actions">
            <button type="button" onClick={clear}>
              ↻ Clear Filters
            </button>
          </div>
        </header>
        <section className="queue-filters">
          <label className="search-field" htmlFor="staff-ticket-search">
            Search
            <input
              id="staff-ticket-search"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" && update({ search: draftSearch })
              }
              placeholder="Search by ticket number or summary..."
            />
          </label>
          <div className="queue-filter-fields">
            <Filter
              label="Status"
              value={query.status}
              options={options.statuses}
              onChange={(value) =>
                update({
                  status: typeof value === "string" ? value : undefined,
                })
              }
            />
            <Filter
              label="Category"
              value={query.category}
              options={options.categories}
              onChange={(value) =>
                update({ category: value as number | undefined })
              }
              numeric
            />
            <Filter
              label="Requested Priority"
              value={query.requestedPriority}
              options={options.priorities}
              onChange={(value) =>
                update({
                  requestedPriority:
                    typeof value === "string" ? value : undefined,
                })
              }
            />
            <Filter
              label="IT Priority"
              value={query.itPriority}
              options={options.priorities}
              onChange={(value) =>
                update({
                  itPriority: typeof value === "string" ? value : undefined,
                })
              }
            />
            <label>
              Owner
              <select
                value={query.owner ?? ""}
                onChange={(event) =>
                  update({ owner: event.target.value || undefined })
                }
              >
                <option value="">All owners</option>
                <option value="me">My tickets</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </label>
          </div>
        </section>
        {state === "loading" && (
          <section className="ticket-panel queue-loading">
            Loading queue...
          </section>
        )}
        {state === "error" && (
          <section className="empty">
            <h2 className="error-message">Unable to load the queue.</h2>
            <p className="muted">{error}</p>
            <button type="button" onClick={load}>
              Retry
            </button>
          </section>
        )}
        {state === "ready" && meta.totalItems === 0 && (
          <section className="empty">
            <h2>
              {hasFilters
                ? "No tickets match your search or filters."
                : "No tickets in the queue yet."}
            </h2>
            {hasFilters && (
              <button type="button" onClick={clear}>
                Clear filters
              </button>
            )}
          </section>
        )}
        {state === "ready" && tickets.length > 0 && (
          <>
            <section className="ticket-panel queue-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <SortButton
                        label="Ticket No."
                        field="createdAt"
                        query={query}
                        onSort={sort}
                      />
                    </th>
                    <th>
                      <SortButton
                        label="Created Date"
                        field="createdAt"
                        query={query}
                        onSort={sort}
                      />
                    </th>
                    <th>Summary</th>
                    <th>Category</th>
                    <th>Req. Priority</th>
                    <th>IT Priority</th>
                    <th>
                      <SortButton
                        label="Status"
                        field="status"
                        query={query}
                        onSort={sort}
                      />
                    </th>
                    <th>
                      <SortButton
                        label="Owner"
                        field="updatedAt"
                        query={query}
                        onSort={sort}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onOpenTicket(ticket.ticketNumber)}
                    >
                      <td className="ticket-number">{ticket.ticketNumber}</td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td className="summary" title={ticket.summary}>
                        {ticket.summary}
                      </td>
                      <td>{ticket.category ?? "-"}</td>
                      <td>
                        <Badge value={ticket.requestedPriority} />
                      </td>
                      <td>
                        <Badge value={ticket.itPriority} />
                      </td>
                      <td>
                        <Badge value={ticket.status} status />
                      </td>
                      <td>
                        {ticket.owner?.name ?? (
                          <span className="muted">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer className="queue-pagination">
                <span>
                  Showing {(meta.page - 1) * meta.pageSize + 1} to{" "}
                  {Math.min(meta.page * meta.pageSize, meta.totalItems)} of{" "}
                  {meta.totalItems} tickets
                </span>
                <div>
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setQuery({ ...query, page: meta.page - 1 })}
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: meta.totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      type="button"
                      className={page === meta.page ? "selected" : ""}
                      key={page}
                      onClick={() => setQuery({ ...query, page })}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setQuery({ ...query, page: meta.page + 1 })}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function Badge({
  value,
  status = false,
}: {
  value?: string;
  status?: boolean;
}) {
  return (
    <span
      className={`badge ${status ? "status" : `priority-${(value ?? "").toLowerCase()}`}`}
    >
      {value ?? "-"}
    </span>
  );
}
function SortButton({
  label,
  field,
  query,
  onSort,
}: {
  label: string;
  field: StaffTicketQuery["sort"];
  query: StaffTicketQuery;
  onSort: (field: StaffTicketQuery["sort"]) => void;
}) {
  return (
    <button type="button" onClick={() => onSort(field)}>
      {label}
      {query.sort === field ? (query.sortDir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );
}
function Filter({
  label,
  value,
  options,
  onChange,
  numeric = false,
}: {
  label: string;
  value?: string | number;
  options: { id: number; name: string }[];
  onChange: (value?: string | number) => void;
  numeric?: boolean;
}) {
  return (
    <label>
      {label}
      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
              ? numeric
                ? Number(event.target.value)
                : event.target.value
              : undefined,
          )
        }
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.id} value={numeric ? option.id : option.name}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
