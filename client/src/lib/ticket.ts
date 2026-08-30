import { Category, Priority, Status } from "./reference";
import { Requester } from "./requester";

export interface Ticket {
  ticketNumber: string;
  requesterId: number;
  summary: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  requestedPriority: Priority;
  currentStatus: Status;
  requester: Requester;
}

export interface TicketQuery {
  search: string;
  category?: number;
  requestedPriorityId?: number;
  currentStatusId?: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface TicketPage {
  data: Ticket[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
