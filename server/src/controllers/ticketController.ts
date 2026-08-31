import { Request, Response } from "express";
import {
  parseTicketQuery,
  type TicketQuery,
} from "../lib/tickets.js";
import { getTicketsService } from "../services/ticketService.js";

export async function getTickets(
  req: Request,
  res: Response
): Promise<void> {
  const requesterId = Number(
    req.header("X-Dev-Requester-Id")
  );

  if (!Number.isInteger(requesterId) || requesterId <= 0) {
    res.status(400).json({
      error: "A valid requester context is required",
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
      error: "Failed to fetch tickets",
    });
  }
}