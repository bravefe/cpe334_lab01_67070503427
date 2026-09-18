import { getPrisma } from "../prisma.js";

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
  resolutionSummary?: string,
) {
  return getPrisma().ticket.update({
    where: { id: ticketId },
    data: {
      currentStatusId: statusId,
      resolutionSummary,
    },
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
