import { Category, Priority, RelatedSystem, Status } from "./reference";
import { Requester } from "./requester";
import { Attachment } from "./attachments";

export interface Ticket {
  ticketNumber: string;
  requesterId: number;
  summary: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  requestedPriority: Priority;
  currentStatus: Status;
  requester: Requester;
  categoryId?: number;
  relatedSystemId?: number;
  requestedPriorityId?: number;
  currentStatusId?: number;
}

export interface TicketDetail extends Ticket {
  categoryId: number;
  relatedSystemId: number;
  requestedPriorityId: number;
  currentStatusId: number;
  attachments: Attachment[];
  relatedSystem?: RelatedSystem;
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

export interface CreateTicketPayload {
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriorityId: number;
}

export interface TicketPage {
  data: Ticket[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
