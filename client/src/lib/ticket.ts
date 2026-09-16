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
  itPriority?: Priority;
  problemAppearsResolved?: boolean;
  resolutionSummary?: string | null;
}

export interface StaffTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  description?: string;
  category?: string;
  relatedSystem?: RelatedSystem;
  requestedPriority?: string;
  itPriority?: string;
  status?: string;
  owner: { id: number; name: string } | null;
  requester: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  resolutionSummary?: string | null;
}

export interface StaffTicketPage {
  items: StaffTicket[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface StaffTicketQuery {
  search: string;
  status?: string;
  category?: number;
  requestedPriority?: string;
  itPriority?: string;
  owner?: "me" | "unassigned" | string;
  sort: "createdAt" | "updatedAt" | "itPriority" | "status";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  authorRole?: string;
  content: string;
  createdAt: string;
}

export interface InternalNote {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
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
