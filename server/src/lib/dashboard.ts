import { Role } from "@prisma/client";

// Matches the Status.name values created in seed.ts.
export const STATUS = {
  NEW: "New",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_REQUESTER: "Waiting for Requester",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
} as const;

// A ticket counts as "open" until it is Resolved / Closed / Cancelled.
// (Reopened and the seeded "Pending" status therefore count as open.)
export const INACTIVE_STATUSES: string[] = [
  STATUS.RESOLVED,
  STATUS.CLOSED,
  STATUS.CANCELLED,
];

export const RECENT_TICKETS_LIMIT = 5;

export const ROLE_LABELS: Record<Role, string> = {
  REQUESTER: "Requester",
  IT_STAFF: "IT Staff",
  ADMINISTRATOR: "Administrator",
};

export type RecentTicket = {
  id: number;
  ticketNumber: string;
  title: string;
  status: string;
  updatedAt: string;
};

// The client turns this into a Ticket Queue / My Tickets drill-down link.
export type DashboardFilter = {
  status?: string[];
  excludeStatus?: string[];
  owner?: "unassigned" | "me";
  priorityId?: number;
};

export type RequesterDashboard = {
  totalOpen: number;
  waitingForYou: number;
  recentlyResolved: number;
  closed: number;
  recentTickets: RecentTicket[];
  filters: Record<string, DashboardFilter>;
};

export type PriorityCount = {
  priorityId: number;
  priorityName: string;
  count: number;
};

export type StaffDashboard = {
  unassigned: number;
  myAssigned: number;
  new: number;
  open: number;
  inProgress: number;
  waitingForRequester: number;
  byPriority: PriorityCount[];
  recentTickets: RecentTicket[];
  filters: Record<string, DashboardFilter>;
};

export type AdminDashboard = StaffDashboard & {
  userCounts: {
    total: number;
    active: number;
    byRole: { role: string; count: number }[];
  };
};

export const requesterFilters = (): Record<string, DashboardFilter> => ({
  totalOpen: { excludeStatus: INACTIVE_STATUSES },
  waitingForYou: { status: [STATUS.WAITING_FOR_REQUESTER] },
  recentlyResolved: { status: [STATUS.RESOLVED] },
  closed: { status: [STATUS.CLOSED] },
});

export const staffFilters = (): Record<string, DashboardFilter> => ({
  unassigned: { owner: "unassigned", excludeStatus: INACTIVE_STATUSES },
  myAssigned: { owner: "me", excludeStatus: INACTIVE_STATUSES },
  new: { status: [STATUS.NEW] },
  open: { status: [STATUS.OPEN] },
  inProgress: { status: [STATUS.IN_PROGRESS] },
  waitingForRequester: { status: [STATUS.WAITING_FOR_REQUESTER] },
});

export const toRecentTicket = (t: {
  id: number;
  ticketNumber: string;
  summary: string;
  updatedAt: Date;
  currentStatus: { name: string };
}): RecentTicket => ({
  id: t.id,
  ticketNumber: t.ticketNumber,
  title: t.summary,
  status: t.currentStatus.name,
  updatedAt: t.updatedAt.toISOString(),
});

// Shared Prisma fragments used by the ticket / staff / admin services.
export const withStatus = (name: string) => ({ currentStatus: { name } });

export const isActiveTicket = {
  currentStatus: { name: { notIn: INACTIVE_STATUSES } },
} as const;

export const recentTicketSelect = {
  id: true,
  ticketNumber: true,
  summary: true,
  updatedAt: true,
  currentStatus: { select: { name: true } },
} as const;
