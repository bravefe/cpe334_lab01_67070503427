import { Request, Response } from "express";
import {
  parseTicketQuery,
  type TicketQuery,
} from "../lib/tickets.js";
import {
  createTicketService,
  getTicketDetailService,
  getTicketsService,
  TicketValidationError,
} from "../services/ticketService.js";

function getRequesterId(req: Request): number | null {
  const requesterId = Number(req.header("X-Dev-Requester-Id"));
  return Number.isInteger(requesterId) && requesterId > 0 ? requesterId : null;
}

export async function getTickets(
  req: Request,
  res: Response,
): Promise<void> {
  const requesterId = getRequesterId(req);

  if (!requesterId) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "A valid requester context is required." },
    });
    return;
  }

  const query: TicketQuery = parseTicketQuery(req);

  try {
    const result = await getTicketsService({
      requesterId,
      query,
    });

    res.status(200).json(result);
  } catch (_error) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch tickets." },
    });
  }
}

export async function createTicket(
  req: Request,
  res: Response,
): Promise<void> {
  const requesterId = getRequesterId(req);

  if (!requesterId) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "A valid requester context is required." },
    });
    return;
  }

  const body = req.body ?? {};
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
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
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Ticket validation failed.",
        fieldErrors,
      },
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
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket validation failed.",
          fieldErrors: [{ field: error.field, message: error.message }],
        },
      });
      return;
    }

    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "ERROR 500: Unable to create ticket." },
    });
  }
}

export async function getTicketDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const requesterId = getRequesterId(req);

  if (!requesterId) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "ERROR 400: A valid requester context is required." },
    });
    return;
  }

  const ticketNumber = String(req.params.ticketNumber ?? "").trim();

  if (!ticketNumber) {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "ERROR 404: Ticket not found." },
    });
    return;
  }

  try {
    const ticket = await getTicketDetailService({ requesterId, ticketNumber });

    if (!ticket) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "ERROR 404: Ticket not found." },
      });
      return;
    }

    res.status(200).json({ data: ticket });
  } catch (_error) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "ERROR 500: Failed to load ticket detail." },
    });
  }
}