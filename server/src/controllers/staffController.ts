import type { Request, Response } from "express";
import { validateContent } from "../lib/content.js";
import {
  createStaffCommentOrNote,
  findPriorityByName,
  findStatusByName,
  findUserById,
  listStaffCommentsOrNotes,
  listStaffTickets as listStaffTicketsService,
  resolveStaffTicket,
  transitionMap,
  updateStaffTicketOwner,
  updateStaffTicketPriority,
  updateStaffTicketStatus,
} from "../services/staffService.js";

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({ error: { code, message } });
}

function parsePositiveId(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
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
    problemAppearsResolved: ticket.problemAppearsResolved,
    attachments: ticket.attachments,
  };
}

async function resolveTicketRef(value: string | undefined) {
  return resolveStaffTicket(value);
}

export async function listStaffTickets(
  req: Request,
  res: Response,
): Promise<void> {
  const pageValue = Number(req.query.page ?? 1);
  const pageSizeValue = Number(req.query.pageSize ?? 10);

  if (!Number.isInteger(pageValue) || pageValue < 1) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "page must be an integer greater than 0.",
    );
    return;
  }

  if (
    !Number.isInteger(pageSizeValue) ||
    pageSizeValue < 1 ||
    pageSizeValue > 50
  ) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "pageSize must be an integer between 1 and 50.",
    );
    return;
  }

  const page = pageValue;
  const pageSize = pageSizeValue;
  const requestedSort =
    typeof req.query.sort === "string" ? req.query.sort : "createdAt";
  const sort = [
    "createdAt",
    "ticketNumber",
    "summary",
    "updatedAt",
    "requestedPriority",
    "itPriority",
    "status",
    "owner",
  ].includes(requestedSort)
    ? requestedSort
    : "createdAt";
  const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const statusName =
    typeof req.query.status === "string" ? req.query.status.trim() : undefined;
  const categoryId = req.query.category
    ? Number(req.query.category)
    : undefined;
  const priorityName =
    typeof req.query.requestedPriority === "string"
      ? req.query.requestedPriority.trim()
      : undefined;
  const itPriorityName =
    typeof req.query.itPriority === "string"
      ? req.query.itPriority.trim()
      : undefined;
  const ownerValue =
    typeof req.query.owner === "string" ? req.query.owner.trim() : undefined;

  const where: any = {};

  if (q) {
    where.OR = [
      { ticketNumber: { contains: q, mode: "insensitive" as const } },
      { summary: { contains: q, mode: "insensitive" as const } },
    ];
  }

  if (statusName) {
    const status = await findStatusByName(statusName);
    if (!status) {
      sendError(res, 400, "VALIDATION_ERROR", "status is invalid.");
      return;
    }
    where.currentStatusId = status.id;
  }

  if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
    where.categoryId = categoryId;
  }

  if (priorityName) {
    const priority = await findPriorityByName(priorityName);
    if (!priority) {
      sendError(res, 400, "VALIDATION_ERROR", "requestedPriority is invalid.");
      return;
    }
    where.requestedPriorityId = priority.id;
  }

  if (itPriorityName) {
    const priority = await findPriorityByName(itPriorityName);
    if (!priority) {
      sendError(res, 400, "VALIDATION_ERROR", "itPriority is invalid.");
      return;
    }
    where.itPriorityId = priority.id;
  }

  if (ownerValue === "me") {
    where.ticketOwnerId = req.user!.id;
  } else if (ownerValue === "unassigned") {
    where.ticketOwnerId = null;
  } else if (ownerValue) {
    const ownerId = parsePositiveId(ownerValue);
    if (ownerId) {
      where.ticketOwnerId = ownerId;
    }
  }

  const { totalItems, rows } = await listStaffTicketsService(
    where,
    page,
    pageSize,
    sort as Parameters<typeof listStaffTicketsService>[3],
    sortDir,
  );

  res.status(200).json({
    items: rows.map(formatTicket),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  });
}

export async function getStaffTicket(
  req: Request,
  res: Response,
): Promise<void> {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  res.status(200).json(formatTicket(ticket));
}

export async function updateOwner(req: Request, res: Response): Promise<void> {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  const rawOwnerId = req.body?.ownerId;
  const ownerId = rawOwnerId === null ? null : parsePositiveId(rawOwnerId);

  if (rawOwnerId !== null && !ownerId) {
    sendError(res, 400, "VALIDATION_ERROR", "A valid owner is required.");
    return;
  }

  if (ownerId) {
    const owner = await findUserById(ownerId);
    if (!owner) {
      sendError(res, 400, "VALIDATION_ERROR", "User not found.");
      return;
    }

    if (
      !owner.isActive ||
      !["IT_STAFF", "ADMINISTRATOR"].includes(owner.role)
    ) {
      sendError(
        res,
        409,
        "INVALID_OWNER",
        "Ticket owner must be an active IT Staff or Administrator.",
      );
      return;
    }
  }

  const updated = await updateStaffTicketOwner(ticket.id, ownerId);

  res.status(200).json(formatTicket(updated));
}

export async function updatePriority(
  req: Request,
  res: Response,
): Promise<void> {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  const name =
    typeof req.body?.itPriority === "string" ? req.body.itPriority.trim() : "";
  const priority = await findPriorityByName(name.replace(/_/g, " "));

  if (!priority) {
    sendError(res, 400, "VALIDATION_ERROR", "Invalid IT priority.");
    return;
  }

  const updated = await updateStaffTicketPriority(ticket.id, priority.id);

  res.status(200).json(formatTicket(updated));
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  const target =
    typeof req.body?.status === "string"
      ? req.body.status.trim().replace(/_/g, " ")
      : "";

  const status = await findStatusByName(target);

  if (!status) {
    sendError(res, 404, "NOT_FOUND", "Ticket or status not found.");
    return;
  }

  const allowed = transitionMap[ticket.currentStatus.name] ?? [];
  if (!allowed.includes(status.name)) {
    sendError(
      res,
      409,
      "INVALID_TRANSITION",
      `Status may change from ${ticket.currentStatus.name} to: ${allowed.join(", ") || "none"}.`,
    );
    return;
  }

  const updated = await updateStaffTicketStatus(
    ticket.id,
    status.id,
    typeof req.body.resolutionSummary === "string"
      ? req.body.resolutionSummary.trim()
      : undefined,
  );

  res.status(200).json(formatTicket(updated));
}

async function handleCommentsOrNotes(
  req: Request,
  res: Response,
  isInternal: boolean,
): Promise<void> {
  const ticket = await resolveTicketRef(req.params.id);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (req.method === "GET") {
    if (isInternal) {
      const { items: notes } = await listStaffCommentsOrNotes(ticket.id, true);

      res.status(200).json({
        items: notes.map((note) => ({
          id: note.id,
          ticketId: note.ticketId,
          authorId: note.authorId,
          authorName: note.author.name,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
        })),
      });
      return;
    }

    const { items: comments } = await listStaffCommentsOrNotes(
      ticket.id,
      false,
    );

    res.status(200).json({
      items: comments.map((comment) => ({
        id: comment.id,
        ticketId: comment.ticketId,
        authorId: comment.authorId,
        authorName: comment.author.name,
        authorRole: comment.author.role,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
    });
    return;
  }

  const content = validateContent(req.body?.content);
  if (!content) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Content must be between 1 and 2000 characters.",
    );
    return;
  }

  if (isInternal) {
    const note = await createStaffCommentOrNote(
      ticket.id,
      req.user!.id,
      content,
      true,
    );

    res.status(201).json({
      id: note.id,
      ticketId: note.ticketId,
      authorId: note.authorId,
      authorName: note.author.name,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
    });
    return;
  }

  const comment = await createStaffCommentOrNote(
    ticket.id,
    req.user!.id,
    content,
    false,
  );

  res.status(201).json({
    id: comment.id,
    ticketId: comment.ticketId,
    authorId: comment.authorId,
    authorName: comment.author.name,
    authorRole: comment.author.role,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  });
}

export const listStaffComments = (req: Request, res: Response) =>
  handleCommentsOrNotes(req, res, false);

export const createStaffComment = (req: Request, res: Response) =>
  handleCommentsOrNotes(req, res, false);

export const listNotes = (req: Request, res: Response) =>
  handleCommentsOrNotes(req, res, true);

export const createNote = (req: Request, res: Response) =>
  handleCommentsOrNotes(req, res, true);
