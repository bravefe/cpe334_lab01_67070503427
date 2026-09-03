import { get, list, post } from "./client";
import { CreateTicketPayload, Ticket, TicketDetail, TicketPage, TicketQuery } from "../lib/ticket";
import { RelatedSystem } from "../lib/reference";

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

export function createTicket(requesterId: number, input: CreateTicketPayload) {
  return post<{ data: Ticket }>("/api/create-ticket", requesterId, input).then((result) => result.data);
}

export function fetchTicketDetail(requesterId: number, ticketNumber: string) {
  return get<{ data: TicketDetail }>(`/api/tickets/${encodeURIComponent(ticketNumber)}`, requesterId).then((result) => result.data);
}
