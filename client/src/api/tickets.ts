import { get, list, post } from "./client";
import {
  CreateTicketPayload,
  Ticket,
  TicketDetail,
  TicketPage,
  TicketQuery,
} from "../lib/ticket";
import { RelatedSystem } from "../lib/reference";

export function fetchTickets(query: TicketQuery) {
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

  return get<TicketPage>(`/api/tickets?${params}`);
}

export function createTicket(input: CreateTicketPayload) {
  return post<{ data: Ticket }>("/api/create-ticket", input).then(
    (result) => result.data,
  );
}

export function fetchTicketDetail(ticketNumber: string) {
  return get<{ data: TicketDetail }>(
    `/api/tickets/${encodeURIComponent(ticketNumber)}`,
  ).then((result) => result.data);
}
