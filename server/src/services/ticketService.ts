import { getPrisma } from "../prisma.js";
import type { TicketQuery } from "../lib/tickets.js";

interface GetTicketsParams {
  requesterId: number;
  query: TicketQuery;
}

interface CreateTicketParams {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriorityId: number;
}

interface GetTicketDetailParams {
  requesterId: number;
  ticketNumber: string;
}

async function generateTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  const lastTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: "desc",
    },
  });

  const nextValue = lastTicket ? Number(lastTicket.ticketNumber.slice(-6)) + 1 : 1;
  return `${prefix}${String(nextValue).padStart(6, "0")}`;
}

export async function getTicketsService({
  requesterId,
  query,
}: GetTicketsParams) {
  const {
    page,
    pageSize,
    sortBy,
    sortDir,
    search,
    categoryId,
    priorityId,
    statusId,
  } = query;

  const where = {
    requesterId,

    ...(search
      ? {
          OR: [
            {
              ticketNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              summary: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(categoryId ? { categoryId } : {}),
    ...(priorityId ? { requestedPriorityId: priorityId } : {}),
    ...(statusId ? { currentStatusId: statusId } : {}),
  };

  const [totalItems, tickets] = await Promise.all([
    getPrisma().ticket.count({ where }),
    getPrisma().ticket.findMany({
      where,
      include: {
        category: true,
        requestedPriority: true,
        currentStatus: true,
        requester: true,
      },
      orderBy: [
        { [sortBy]: sortDir },
        ...(sortBy === "createdAt" ? [{ ticketNumber: sortDir }] : []),
      ] as never,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: tickets,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

export async function createTicketService({
  requesterId,
  categoryId,
  relatedSystemId,
  summary,
  description,
  requestedPriorityId,
}: CreateTicketParams) {
  const prisma = getPrisma();

  const [category, relatedSystem, priority, defaultStatus] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId } }),
    prisma.relatedSystem.findUnique({ where: { id: relatedSystemId } }),
    prisma.priority.findUnique({ where: { id: requestedPriorityId } }),
    prisma.status.findFirst({ where: { isDefault: true } }),
  ]);

  if (!category || !category.isActive) {
    throw new Error("Invalid category.");
  }

  if (!relatedSystem || !relatedSystem.isActive) {
    throw new Error("Invalid related system.");
  }

  if (!priority) {
    throw new Error("Invalid priority.");
  }

  if (!defaultStatus) {
    throw new Error("Default status unavailable.");
  }

  const ticketNumber = await generateTicketNumber();

  const created = await prisma.ticket.create({
    data: {
      ticketNumber,
      requesterId,
      categoryId,
      relatedSystemId,
      summary,
      description,
      requestedPriorityId,
      currentStatusId: defaultStatus.id,
    },
  });

  return {
    ticketNumber: created.ticketNumber,
    requesterId: created.requesterId,
    summary: created.summary,
    description: created.description,
    categoryId: created.categoryId,
    relatedSystemId: created.relatedSystemId,
    requestedPriorityId: created.requestedPriorityId,
    currentStatusId: created.currentStatusId,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function getTicketDetailService({
  requesterId,
  ticketNumber,
}: GetTicketDetailParams) {
  const ticket = await getPrisma().ticket.findUnique({
    where: { ticketNumber },
    include: {
      requester: true,
      category: true,
      relatedSystem: true,
      requestedPriority: true,
      currentStatus: true,
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!ticket || ticket.requesterId !== requesterId) {
    return null;
  }

  return {
    ticketNumber: ticket.ticketNumber,
    summary: ticket.summary,
    description: ticket.description,
    categoryId: ticket.categoryId,
    relatedSystemId: ticket.relatedSystemId,
    requestedPriorityId: ticket.requestedPriorityId,
    currentStatusId: ticket.currentStatusId,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    requester: { id: ticket.requester.id, name: ticket.requester.name },
    category: { id: ticket.category.id, name: ticket.category.name },
    relatedSystem: { id: ticket.relatedSystem.id, name: ticket.relatedSystem.name },
    requestedPriority: { id: ticket.requestedPriority.id, name: ticket.requestedPriority.name },
    currentStatus: { id: ticket.currentStatus.id, name: ticket.currentStatus.name },
    attachments: ticket.attachments.map((attachment) => ({
      attachmentId: attachment.id,
      originalFileName: attachment.originalFileName,
      status: attachment.status,
      uploadedAt: attachment.uploadedAt.toISOString(),
      ...(attachment.removedAt ? { removedAt: attachment.removedAt.toISOString() } : {}),
      ...(attachment.removalReason ? { removalReason: attachment.removalReason } : {}),
    })),
  };
}