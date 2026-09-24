import type { Request, Response } from "express";
import { resolveStaffTicket } from "../services/staffService.js";
import {
  createActionTaken,
  listActionsTaken,
  resolveActionTicketAccess,
  updateActionTaken,
} from "../services/actionTakenService.js";
import {
  parseActionTakenCreateInput,
  parseActionTakenUpdateInput,
} from "../lib/actionTaken.js";

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

function resolveTicketParam(req: Request): string {
  return String(
    req.params.ticketId ?? req.params.ticketNumber ?? req.params.id ?? "",
  ).trim();
}

export async function createAction(req: Request, res: Response): Promise<void> {
  const ticketRef = resolveTicketParam(req);
  if (!ticketRef) {
    sendError(res, 400, "VALIDATION_ERROR", "Ticket reference is required.");
    return;
  }

  const ticket = await resolveStaffTicket(ticketRef);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  const access = await resolveActionTicketAccess(
    ticket.id,
    req.user!.id,
    req.user!.role,
  );

  if (access.kind === "not_found") {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (access.kind === "forbidden") {
    sendError(
      res,
      403,
      "FORBIDDEN",
      "You are not allowed to access this ticket.",
    );
    return;
  }

  const parsed = parseActionTakenCreateInput(req.body);

  if (!parsed.ok) {
    const followUpErr = parsed.fieldErrors.find((e) => e.field === "followUpNote");
    const descErr = parsed.fieldErrors.find((e) => e.field === "description");
    const actionAtErr = parsed.fieldErrors.find((e) => e.field === "actionAt");

    if (followUpErr) {
      sendError(res, 422, "VALIDATION_ERROR", followUpErr.message, {
        field: "followUpNote",
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }

    if (descErr) {
      sendError(res, 422, "VALIDATION_ERROR", descErr.message, {
        field: "description",
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }

    if (actionAtErr) {
      sendError(res, 422, "INVALID_ACTION_TIME", actionAtErr.message, {
        field: "actionAt",
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }

    sendError(res, 400, "VALIDATION_ERROR", "Action Taken validation failed.", {
      fieldErrors: parsed.fieldErrors,
    });
    return;
  }

  const result = await createActionTaken({
    ticketId: ticket.id,
    performedByUserId: req.user!.id,
    ...parsed.data,
  });

  if (result.kind === "not_found") {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (result.kind === "closed") {
    sendError(
      res,
      409,
      "INVALID_STATUS",
      "Actions Taken cannot be created for Closed or Cancelled tickets.",
    );
    return;
  }

  if (result.kind === "invalid_action_time") {
    sendError(
      res,
      422,
      "INVALID_ACTION_TIME",
      "Action date/time must be on or after the Ticket creation time and not later than the current server time.",
      { field: "actionAt" },
    );
    return;
  }

  if (result.kind === "invalid_result") {
    sendError(res, 400, "VALIDATION_ERROR", "Result is invalid or inactive.", {
      field: "resultId",
    });
    return;
  }

  res.status(201).json({
    ...result.data,
    data: result.data,
  });
}

export async function getActions(req: Request, res: Response): Promise<void> {
  const ticketRef = resolveTicketParam(req);
  if (!ticketRef) {
    sendError(res, 400, "VALIDATION_ERROR", "Ticket reference is required.");
    return;
  }

  const ticket = await resolveStaffTicket(ticketRef);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  const access = await resolveActionTicketAccess(
    ticket.id,
    req.user!.id,
    req.user!.role,
  );

  if (access.kind === "not_found") {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (access.kind === "forbidden") {
    sendError(
      res,
      403,
      "FORBIDDEN",
      "You are not allowed to access this ticket.",
    );
    return;
  }

  const actions = await listActionsTaken(ticket.id);

  res.status(200).json({
    data: actions,
  });
}

export async function updateAction(req: Request, res: Response): Promise<void> {
  const ticketRef = resolveTicketParam(req);
  const actionId = Number(req.params.actionId);

  if (!ticketRef) {
    sendError(res, 400, "VALIDATION_ERROR", "Ticket reference is required.");
    return;
  }

  if (!Number.isInteger(actionId) || actionId <= 0) {
    sendError(res, 400, "VALIDATION_ERROR", "Invalid action ID.");
    return;
  }

  const ticket = await resolveStaffTicket(ticketRef);
  if (!ticket) {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  const access = await resolveActionTicketAccess(
    ticket.id,
    req.user!.id,
    req.user!.role,
  );

  if (access.kind === "not_found") {
    sendError(res, 404, "NOT_FOUND", "Ticket not found.");
    return;
  }

  if (access.kind === "forbidden") {
    sendError(
      res,
      403,
      "FORBIDDEN",
      "You are not allowed to access this ticket.",
    );
    return;
  }

  const parsed = parseActionTakenUpdateInput(req.body);

  if (!parsed.ok) {
    const followUpErr = parsed.fieldErrors.find((e) => e.field === "followUpNote");
    const descErr = parsed.fieldErrors.find((e) => e.field === "description");

    if (followUpErr) {
      sendError(res, 422, "VALIDATION_ERROR", followUpErr.message, {
        field: "followUpNote",
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }

    if (descErr) {
      sendError(res, 422, "VALIDATION_ERROR", descErr.message, {
        field: "description",
        fieldErrors: parsed.fieldErrors,
      });
      return;
    }

    sendError(res, 400, "VALIDATION_ERROR", "Action Taken validation failed.", {
      fieldErrors: parsed.fieldErrors,
    });
    return;
  }

  const result = await updateActionTaken({
    ticketId: ticket.id,
    actionId,
    updatedAt: parsed.updatedAt,
    data: parsed.data,
  });

  if (result.kind === "not_found") {
    sendError(res, 404, "NOT_FOUND", "Action Taken not found.");
    return;
  }

  if (result.kind === "conflict") {
    sendError(
      res,
      409,
      "CONFLICT",
      "The Action Taken was modified by another user.",
      { current: result.current },
    );
    return;
  }

  if (result.kind === "invalid_result") {
    sendError(res, 400, "VALIDATION_ERROR", "Result is invalid or inactive.", {
      field: "resultId",
    });
    return;
  }

  if (result.kind === "missing_follow_up_note") {
    sendError(
      res,
      422,
      "VALIDATION_ERROR",
      "Follow-up Note is required when Follow-up Required is true.",
      {
        field: "followUpNote",
        fieldErrors: [
          {
            field: "followUpNote",
            message:
              "Follow-up Note is required when Follow-up Required is true.",
          },
        ],
      },
    );
    return;
  }

  res.status(200).json({
    ...result.data,
    data: result.data,
  });
}
