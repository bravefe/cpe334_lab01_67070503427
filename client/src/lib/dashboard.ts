// lib/dashboard.ts
// Types and small helpers only. API calls live in api/dashboard.ts.

export interface RecentTicket {
  id: number;
  title: string;
  status: string;
  updatedAt: string; // ISO date string
}

export interface PriorityCount {
  priorityId: number;
  priorityName: string;
  count: number;
}

export interface RoleCount {
  role: string;
  count: number;
}

export interface UserCounts {
  total: number;
  active: number;
  byRole: RoleCount[];
}

/** GET /api/requester/dashboard */
export interface RequesterDashboard {
  totalOpen: number;
  waitingForYou: number;
  recentlyResolved: number;
  closed: number;
  recentTickets: RecentTicket[]; // max 5
}

/** GET /api/staff/dashboard */
export interface StaffDashboard {
  unassigned: number;
  myAssigned: number;
  new: number;
  open: number;
  inProgress: number;
  waitingForRequester: number;
  byPriority: PriorityCount[];
  recentTickets: RecentTicket[];
}

/** GET /api/admin/dashboard = staff payload + userCounts */
export interface AdminDashboard extends StaffDashboard {
  userCounts: UserCounts;
}

/** Error thrown when the dashboard API returns a non-2xx response. */
export class DashboardApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DashboardApiError";
  }
}
