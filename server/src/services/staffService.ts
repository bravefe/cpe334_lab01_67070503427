import { getPrisma } from "../prisma.js";
// services/staffService.ts  (add imports + function)
import {
  RECENT_TICKETS_LIMIT,
  STATUS,
  isActiveTicket,
  recentTicketSelect,
  staffFilters,
  toRecentTicket,
  withStatus,
  type PriorityCount,
  type StaffDashboard,
} from "../lib/dashboard.js";

export const ticketDetailInclude = {
  requester: true,
  ticketOwner: true,
  category: true,
  relatedSystem: true,
  requestedPriority: true,
  itPriority: true,
  currentStatus: true,
  attachments: true,
} as const;

export const transitionMap: Record<string, string[]> = {
  New: ["Open", "Cancelled"],
  Open: ["In Progress", "Waiting for Requester", "Cancelled"],
  "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["Open", "In Progress", "Cancelled"],
  Cancelled: [],
};

export type StaffSortField =
  | "createdAt"
  | "ticketNumber"
  | "summary"
  | "updatedAt"
  | "requestedPriority"
  | "itPriority"
  | "status"
  | "owner";
export type StaffSortDirection = "asc" | "desc";

export async function getStaffDashboardService(
  staffUserId: number,
): Promise<StaffDashboard> {
  const prisma = getPrisma();

  const [
    unassigned,
    myAssigned,
    newCount,
    open,
    inProgress,
    waitingForRequester,
    priorityGroups,
    priorities,
    recent,
  ] = await Promise.all([
    prisma.ticket.count({ where: { ticketOwnerId: null, ...isActiveTicket } }),
    prisma.ticket.count({
      where: { ticketOwnerId: staffUserId, ...isActiveTicket },
    }),
    prisma.ticket.count({ where: withStatus(STATUS.NEW) }),
    prisma.ticket.count({ where: withStatus(STATUS.OPEN) }),
    prisma.ticket.count({ where: withStatus(STATUS.IN_PROGRESS) }),
    prisma.ticket.count({ where: withStatus(STATUS.WAITING_FOR_REQUESTER) }),
    prisma.ticket.groupBy({
      by: ["itPriorityId"],
      where: isActiveTicket,
      _count: { _all: true },
    }),
    prisma.priority.findMany({ orderBy: { sortOrder: "desc" } }), // High → Low
    prisma.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: RECENT_TICKETS_LIMIT,
      select: recentTicketSelect,
    }),
  ]);

  const counts = new Map(
    priorityGroups.map((g) => [g.itPriorityId, g._count._all]),
  );
  const byPriority: PriorityCount[] = priorities.map((p) => ({
    priorityId: p.id,
    priorityName: p.name,
    count: counts.get(p.id) ?? 0,
  }));

  return {
    unassigned,
    myAssigned,
    new: newCount,
    open,
    inProgress,
    waitingForRequester,
    byPriority,
    recentTickets: recent.map(toRecentTicket),
    filters: staffFilters(),
  };
}

export async function resolveStaffTicket(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const numericId = Number(normalized);
  if (Number.isInteger(numericId) && numericId > 0) {
    return getPrisma().ticket.findUnique({
      where: { id: numericId },
      include: ticketDetailInclude,
    });
  }

  return getPrisma().ticket.findUnique({
    where: { ticketNumber: normalized },
    include: ticketDetailInclude,
  });
}

export async function findStatusByName(name: string) {
  return getPrisma().status.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
}

export async function findPriorityByName(name: string) {
  return getPrisma().priority.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
}

export async function findUserById(id: number) {
  return getPrisma().user.findUnique({ where: { id } });
}

export async function listStaffTickets(
  where: any,
  page: number,
  pageSize: number,
  sort: StaffSortField = "createdAt",
  sortDir: StaffSortDirection = "desc",
) {
  const orderBy: any =
    sort === "requestedPriority"
      ? { requestedPriority: { sortOrder: sortDir } }
      : sort === "itPriority"
        ? { itPriority: { sortOrder: sortDir } }
        : sort === "status"
          ? { currentStatus: { name: sortDir } }
          : sort === "owner"
            ? { ticketOwner: { name: sortDir } }
            : { [sort]: sortDir };

  const [totalItems, rows] = await Promise.all([
    getPrisma().ticket.count({ where }),
    getPrisma().ticket.findMany({
      where,
      include: ticketDetailInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { totalItems, rows };
}

export async function updateStaffTicketOwner(
  ticketId: number,
  ownerId: number | null,
) {
  return getPrisma().ticket.update({
    where: { id: ticketId },
    data: { ticketOwnerId: ownerId },
    include: ticketDetailInclude,
  });
}

export async function updateStaffTicketPriority(
  ticketId: number,
  priorityId: number,
) {
  return getPrisma().ticket.update({
    where: { id: ticketId },
    data: { itPriorityId: priorityId },
    include: ticketDetailInclude,
  });
}

export async function updateStaffTicketStatus(
  ticketId: number,
  statusId: number,
  expectedUpdatedAt: Date,
  opts: { resolutionSummary?: string; resetResolvedFlag?: boolean } = {},
) {
  const result = await getPrisma().ticket.updateMany({
    where: { id: ticketId, updatedAt: expectedUpdatedAt }, // optimistic lock
    data: {
      currentStatusId: statusId,
      ...(opts.resolutionSummary !== undefined
        ? { resolutionSummary: opts.resolutionSummary }
        : {}),
      ...(opts.resetResolvedFlag ? { problemAppearsResolved: false } : {}),
    },
  });
  if (result.count === 0) return null;
  return getPrisma().ticket.findUnique({
    where: { id: ticketId },
    include: ticketDetailInclude,
  });
}

export async function listStaffCommentsOrNotes(
  ticketId: number,
  isInternal: boolean,
) {
  if (isInternal) {
    const notes = await getPrisma().internalNote.findMany({
      where: { ticketId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    return { kind: "notes" as const, items: notes };
  }

  const comments = await getPrisma().publicComment.findMany({
    where: { ticketId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return { kind: "comments" as const, items: comments };
}

export async function createStaffCommentOrNote(
  ticketId: number,
  authorId: number,
  content: string,
  isInternal: boolean,
) {
  if (isInternal) {
    return getPrisma().internalNote.create({
      data: { ticketId, authorId, content },
      include: { author: true },
    });
  }

  return getPrisma().publicComment.create({
    data: { ticketId, authorId, content },
    include: { author: true },
  });
}
