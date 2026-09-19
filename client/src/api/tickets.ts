import { get, list, patch, post } from "./client";
import {
  CreateTicketPayload,
  InternalNote,
  StaffTicket,
  StaffTicketPage,
  StaffTicketQuery,
  TicketComment,
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

export function fetchStaffTickets(query: StaffTicketQuery) {
  const params = new URLSearchParams({
    q: query.search,
    sort: query.sort,
    sortDir: query.sortDir,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", String(query.category));
  if (query.requestedPriority)
    params.set("requestedPriority", query.requestedPriority);
  if (query.itPriority) params.set("itPriority", query.itPriority);
  if (query.owner) params.set("owner", query.owner);

  return get<StaffTicketPage>(`/api/staff/tickets?${params}`);
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

export function fetchStaffTicketDetail(ticketRef: string) {
  return get<StaffTicket>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}`,
  );
}

export function updateStaffOwner(ticketRef: string, ownerId: number | null) {
  return patch<StaffTicket>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/owner`,
    { ownerId },
  );
}

export function updateStaffPriority(ticketRef: string, itPriority: string) {
  return patch<StaffTicket>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/priority`,
    { itPriority },
  );
}

export function updateStaffStatus(
  ticketRef: string,
  status: string,
  resolutionSummary?: string,
) {
  return patch<StaffTicket>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/status`,
    { status, resolutionSummary },
  );
}

export function fetchTicketComments(ticketRef: string) {
  return get<{ items: TicketComment[] }>(
    `/api/tickets/${encodeURIComponent(ticketRef)}/comments`,
  );
}

export function createTicketComment(ticketRef: string, content: string) {
  return post<TicketComment>(
    `/api/tickets/${encodeURIComponent(ticketRef)}/comments`,
    { content },
  );
}

export function markTicketResolved(ticketRef: string) {
  return patch<unknown>(
    `/api/tickets/${encodeURIComponent(ticketRef)}/resolution`,
    { problemAppearsResolved: true },
  ).then(() => fetchTicketDetail(ticketRef));
}

export function fetchStaffComments(ticketRef: string) {
  return get<{ items: TicketComment[] }>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/comments`,
  );
}

export function createStaffComment(ticketRef: string, content: string) {
  return post<TicketComment>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/comments`,
    { content },
  );
}

export function fetchStaffNotes(ticketRef: string) {
  return get<{ items: InternalNote[] }>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/notes`,
  );
}

export function createStaffNote(ticketRef: string, content: string) {
  return post<InternalNote>(
    `/api/staff/tickets/${encodeURIComponent(ticketRef)}/notes`,
    { content },
  );
}
