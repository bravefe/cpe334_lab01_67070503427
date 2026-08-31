import { get } from "./client";
import { TicketPage, TicketQuery } from "../lib/ticket";

export function fetchTickets(requesterId: number, query: TicketQuery) {
  const params = new URLSearchParams({
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.category) {
    params.set("category", String(query.category));
  }
  if (query.requestedPriorityId) {
    params.set("requestedPriorityId", String(query.requestedPriorityId));
  }
  if (query.currentStatusId) {
    params.set("currentStatusId", String(query.currentStatusId));
  }

  return get<TicketPage>(`/api/tickets?${params}`, requesterId);
}
