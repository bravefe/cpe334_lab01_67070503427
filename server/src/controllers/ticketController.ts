import type { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { validateContent } from "../lib/content.js";
import { parseTicketQuery, type TicketQuery } from "../lib/tickets.js";
import {
  createTicketService,
  getTicketDetailService,
  getTicketsService,
  TicketValidationError,
} from "../services/ticketService.js";

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...extra,
    },
  });
}

export async function getTickets(req: Request, res: Response): Promise<void> {
  const requesterId = req.user!.id;
  const query: TicketQuery = parseTicketQuery(req);

  try {
    const result = await getTicketsService({
      requesterId,
      query,
    });

    res.status(200).json(result);
  } catch (_error) {
    sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch tickets.");
  }
}

export async function createTicket(req: Request, res: Response): Promise<void> {
  const requesterId = req.user!.id;

  const body = req.body ?? {};
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const categoryId = Number(body.categoryId);
  const relatedSystemId = Number(body.relatedSystemId);
  const requestedPriorityId = Number(body.requestedPriorityId);

  const fieldErrors: Array<{ field: string; message: string }> = [];

  if (!summary || summary.length < 5 || summary.length > 150) {
    fieldErrors.push({
      field: "summary",
      message: "Summary must be between 5 and 150 characters.",
    });
  }

  if (!description || description.length < 20 || description.length > 2000) {
    fieldErrors.push({
      field: "description",
      message: "Description must be between 20 and 2000 characters.",
    });
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    fieldErrors.push({
      field: "categoryId",
      message: "Category is required.",
    });
  }

  if (!Number.isInteger(relatedSystemId) || relatedSystemId <= 0) {
    fieldErrors.push({
      field: "relatedSystemId",
      message: "Related system is required.",
    });
  }

  if (!Number.isInteger(requestedPriorityId) || requestedPriorityId <= 0) {
    fieldErrors.push({
      field: "requestedPriorityId",
      message: "Requested priority is required.",
    });
  }

  if (fieldErrors.length > 0) {
    sendError(res, 400, "VALIDATION_ERROR", "Ticket validation failed.", {
      fieldErrors,
    });
    return;
  }

  try {
    const ticket = await createTicketService({
      requesterId,
      categoryId,
      relatedSystemId,
      summary,
      description,
      requestedPriorityId,
    });

    res.status(201).json({ data: ticket });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      sendError(res, 400, "VALIDATION_ERROR", "Ticket validation failed.", {
        fieldErrors: [{ field: error.field, message: error.message }],
      });
      return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Unable to create ticket.");
  }
}

export async function getTicketDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const requesterId = req.user!.id;
  const ticketRef = String(
    req.params.ticketNumber ?? req.params.id ?? "",
  ).trim();

  if (!ticketRef) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  try {
    const result = await getTicketDetailService({ requesterId, ticketRef });

    if (result.kind === "not_found") {
      sendError(res, 404, "NOT_FOUND", "Ticket not found.");
      return;
    }

    if (result.kind === "forbidden") {
      sendError(
        res,
        403,
        "FORBIDDEN",
        "You are not allowed to access this ticket.",
      );
      return;
    }

    res.status(200).json({ data: result.data });
  } catch (_error) {
    sendError(res, 500, "INTERNAL_ERROR", "Failed to load ticket detail.");
  }
}

async function resolveTicketAccess(req: Request) {
  const ref = String(req.params.ticketNumber ?? req.params.id ?? "").trim();
  if (!ref) return null;

  const numericId = Number(ref);
  const ticket =
    Number.isInteger(numericId) && numericId > 0
      ? await getPrisma().ticket.findUnique({
          where: { id: numericId },
          include: { requester: true, currentStatus: true },
        })
      : await getPrisma().ticket.findUnique({
          where: { ticketNumber: ref },
          include: { requester: true, currentStatus: true },
        });

  if (!ticket) return null;

  if (req.user!.role === "REQUESTER" && ticket.requesterId !== req.user!.id) {
    return "forbidden" as const;
  }

  return ticket;
}

export async function getTicketComments(
  req: Request,
  res: Response,
): Promise<void> {
  const ticket = await resolveTicketAccess(req);

  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (ticket === "forbidden") {
    sendError(
      res,
      403,
      "FORBIDDEN",
      "You are not allowed to access this ticket.",
    );
    return;
  }

  const comments = await getPrisma().publicComment.findMany({
    where: { ticketId: ticket.id },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });

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
}

export async function createTicketComment(
  req: Request,
  res: Response,
): Promise<void> {
  const ticket = await resolveTicketAccess(req);

  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (ticket === "forbidden") {
    sendError(
      res,
      403,
      "FORBIDDEN",
      "You are not allowed to access this ticket.",
    );
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

  const created = await getPrisma().publicComment.create({
    data: {
      ticketId: ticket.id,
      authorId: req.user!.id,
      content,
    },
    include: { author: true },
  });

  res.status(201).json({
    id: created.id,
    ticketId: created.ticketId,
    authorId: created.authorId,
    authorName: created.author.name,
    authorRole: created.author.role,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
  });
}

export async function updateTicketResolution(
  req: Request,
  res: Response,
): Promise<void> {
  const ticket = await resolveTicketAccess(req);

  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (ticket === "forbidden") {
    sendError(
      res,
      403,
      "FORBIDDEN",
      "You are not allowed to access this ticket.",
    );
    return;
  }

  const value = req.body?.problemAppearsResolved;
  if (typeof value !== "boolean") {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "problemAppearsResolved must be a boolean.",
    );
    return;
  }

  const allowedStatuses = ["Open", "In Progress", "Waiting for Requester"];
  if (!allowedStatuses.includes(ticket.currentStatus.name)) {
    sendError(
      res,
      409,
      "INVALID_STATUS",
      `Ticket status must be one of: ${allowedStatuses.join(", ")}.`,
    );
    return;
  }

  const rawSummary = req.body?.resolutionSummary;
  const resolutionSummary =
    typeof rawSummary === "string"
      ? rawSummary.trim()
      : rawSummary === null
        ? null
        : undefined;

  const updated = await getPrisma().ticket.update({
    where: { id: ticket.id },
    data: {
      problemAppearsResolved: value,
      ...(resolutionSummary !== undefined ? { resolutionSummary } : {}),
    },
    include: { currentStatus: true },
  });

  res.status(200).json({
    ...updated,
    status: updated.currentStatus.name,
    currentStatus: undefined,
    currentStatusId: undefined,
  });
}
