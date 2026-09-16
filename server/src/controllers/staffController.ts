import type { Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const transitionMap: Record<string, string[]> = {
  New: ["Open", "Cancelled"],
  Open: ["In Progress", "Waiting for Requester", "Cancelled"],
  "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["Open", "In Progress", "Cancelled"],
  Cancelled: [],
};
const error = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });
const id = (value: unknown) =>
  Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const detail = {
  requester: true,
  ticketOwner: true,
  category: true,
  relatedSystem: true,
  requestedPriority: true,
  itPriority: true,
  currentStatus: true,
  attachments: true,
} as const;

async function resolveTicketRef(value: string | undefined) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const numericId = Number(normalized);
  if (Number.isInteger(numericId) && numericId > 0) {
    return getPrisma().ticket.findUnique({
      where: { id: numericId },
      include: detail,
    });
  }
  return getPrisma().ticket.findUnique({
    where: { ticketNumber: normalized },
    include: detail,
  });
}

export async function listStaffTickets(req: Request, res: Response) {
  const pageValue = Number(req.query.page ?? 1);
  const pageSizeValue = Number(req.query.pageSize ?? 10);

  if (!Number.isInteger(pageValue) || pageValue < 1) {
    return error(
      res,
      400,
      "VALIDATION_ERROR",
      "page must be an integer greater than 0.",
    );
  }
  if (
    !Number.isInteger(pageSizeValue) ||
    pageSizeValue < 1 ||
    pageSizeValue > 50
  ) {
    return error(
      res,
      400,
      "VALIDATION_ERROR",
      "pageSize must be an integer between 1 and 50.",
    );
  }

  const page = pageValue;
  const pageSize = pageSizeValue;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const statusName =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const categoryId = req.query.category
    ? Number(req.query.category)
    : undefined;
  const priorityName =
    typeof req.query.requestedPriority === "string"
      ? req.query.requestedPriority
      : undefined;
  const itPriorityName =
    typeof req.query.itPriority === "string" ? req.query.itPriority : undefined;
  const ownerValue =
    typeof req.query.owner === "string" ? req.query.owner : undefined;

  if (statusName) {
    const status = await getPrisma().status.findFirst({
      where: { name: { equals: statusName, mode: "insensitive" } },
    });
    if (!status) {
      return error(res, 400, "VALIDATION_ERROR", "status is invalid.");
    }
  }

  const where: any = {};
  if (q) {
    where.OR = [
      { ticketNumber: { contains: q, mode: "insensitive" as const } },
      { summary: { contains: q, mode: "insensitive" as const } },
    ];
  }
  if (statusName) {
    const status = await getPrisma().status.findFirst({
      where: { name: { equals: statusName, mode: "insensitive" } },
    });
    where.currentStatusId = status!.id;
  }
  if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
    where.categoryId = categoryId;
  }
  if (priorityName) {
    const priority = await getPrisma().priority.findFirst({
      where: { name: { equals: priorityName, mode: "insensitive" } },
    });
    if (!priority) {
      return error(
        res,
        400,
        "VALIDATION_ERROR",
        "requestedPriority is invalid.",
      );
    }
    where.requestedPriorityId = priority.id;
  }
  if (itPriorityName) {
    const priority = await getPrisma().priority.findFirst({
      where: { name: { equals: itPriorityName, mode: "insensitive" } },
    });
    if (!priority) {
      return error(res, 400, "VALIDATION_ERROR", "itPriority is invalid.");
    }
    where.itPriorityId = priority.id;
  }
  if (ownerValue === "me") {
    where.ticketOwnerId = req.user!.id;
  } else if (ownerValue === "unassigned") {
    where.ticketOwnerId = null;
  }

  const [totalItems, rows] = await Promise.all([
    getPrisma().ticket.count({ where }),
    getPrisma().ticket.findMany({
      where,
      include: detail,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({
    items: rows.map(formatTicket),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  });
}

function formatTicket(ticket: any) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    summary: ticket.summary,
    description: ticket.description,
    category: ticket.category?.name,
    requestedPriority: ticket.requestedPriority?.name,
    itPriority: ticket.itPriority?.name,
    status: ticket.currentStatus?.name,
    owner: ticket.ticketOwner
      ? { id: ticket.ticketOwner.id, name: ticket.ticketOwner.name }
      : null,
    requester: ticket.requester
      ? { id: ticket.requester.id, name: ticket.requester.name }
      : null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    attachments: ticket.attachments,
  };
}

export async function getStaffTicket(req: Request, res: Response) {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) return error(res, 404, "NOT_FOUND", "Ticket not found.");
  return res.json(formatTicket(ticket));
}

export async function updateOwner(req: Request, res: Response) {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) return error(res, 404, "NOT_FOUND", "Ticket not found.");

  const ownerId = req.body?.ownerId === null ? null : id(req.body?.ownerId);
  if (req.body?.ownerId !== null && !ownerId)
    return error(res, 400, "VALIDATION_ERROR", "A valid owner is required.");
  if (ownerId) {
    const owner = await getPrisma().user.findUnique({ where: { id: ownerId } });
    if (!owner) return error(res, 400, "VALIDATION_ERROR", "User not found.");
    if (!owner.isActive || !["IT_STAFF", "ADMINISTRATOR"].includes(owner.role))
      return error(
        res,
        409,
        "INVALID_OWNER",
        "Ticket owner must be an active IT Staff or Administrator.",
      );
  }
  const updated = await getPrisma().ticket.update({
    where: { id: ticket.id },
    data: { ticketOwnerId: ownerId },
    include: detail,
  });
  return res.json(formatTicket(updated));
}

export async function updatePriority(req: Request, res: Response) {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) return error(res, 404, "NOT_FOUND", "Ticket not found.");

  const name =
    typeof req.body?.itPriority === "string" ? req.body.itPriority : "";
  const priority = await getPrisma().priority.findFirst({
    where: { name: { equals: name.replace(/_/g, " "), mode: "insensitive" } },
  });
  if (!priority)
    return error(res, 400, "VALIDATION_ERROR", "Invalid IT priority.");
  const updated = await getPrisma().ticket.update({
    where: { id: ticket.id },
    data: { itPriorityId: priority.id },
    include: detail,
  });
  return res.json(formatTicket(updated));
}

export async function updateStatus(req: Request, res: Response) {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) return error(res, 404, "NOT_FOUND", "Ticket not found.");

  const target =
    typeof req.body?.status === "string"
      ? req.body.status.replace(/_/g, " ")
      : "";
  const status = await getPrisma().status.findFirst({
    where: { name: { equals: target, mode: "insensitive" } },
  });
  if (!status)
    return error(res, 404, "NOT_FOUND", "Ticket or status not found.");
  const allowed = transitionMap[ticket.currentStatus.name] ?? [];
  if (!allowed.includes(status.name))
    return error(
      res,
      409,
      "INVALID_TRANSITION",
      `Status may change from ${ticket.currentStatus.name} to: ${allowed.join(", ") || "none"}.`,
    );
  const updated = await getPrisma().ticket.update({
    where: { id: ticket.id },
    data: {
      currentStatusId: status.id,
      resolutionSummary:
        typeof req.body.resolutionSummary === "string"
          ? req.body.resolutionSummary.trim()
          : undefined,
    },
    include: detail,
  });
  return res.json(formatTicket(updated));
}

async function comments(req: Request, res: Response, internal: boolean) {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) return error(res, 404, "NOT_FOUND", "Ticket not found.");

  const content =
    typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (req.method === "POST" && (!content || content.length > 2000))
    return error(
      res,
      400,
      "VALIDATION_ERROR",
      "Content must be between 1 and 2000 characters.",
    );
  if (req.method === "GET") {
    const items = internal
      ? await getPrisma().internalNote.findMany({
          where: { ticketId: ticket.id },
          include: { author: true },
          orderBy: { createdAt: "asc" },
        })
      : await getPrisma().publicComment.findMany({
          where: { ticketId: ticket.id },
          include: { author: true },
          orderBy: { createdAt: "asc" },
        });
    return res.json({ items });
  }
  const item = internal
    ? await getPrisma().internalNote.create({
        data: { ticketId: ticket.id, authorId: req.user!.id, content },
        include: { author: true },
      })
    : await getPrisma().publicComment.create({
        data: { ticketId: ticket.id, authorId: req.user!.id, content },
        include: { author: true },
      });
  return res.status(201).json(item);
}
export const listStaffComments = (req: Request, res: Response) =>
  comments(req, res, false);
export const createStaffComment = (req: Request, res: Response) =>
  comments(req, res, false);
export const listNotes = (req: Request, res: Response) =>
  comments(req, res, true);
export const createNote = (req: Request, res: Response) =>
  comments(req, res, true);
