import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { getPrisma } from "../prisma.js";

const router = Router();

const SORT_FIELDS = new Set([
  "createdAt",
  "ticketNumber",
  "summary",
  "requestedPriorityId",
  "currentStatusId",
  "updatedAt",
]);

function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({
    error: { code, message },
  });
}

function positiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

router.get("/tickets", async (req: Request, res: Response) => {
  const requesterHeader = req.header("X-Dev-Requester-Id");
  const requesterId = parseOptionalInt(requesterHeader);

  if (!requesterId || requesterId <= 0) {
    return errorResponse(
      res,
      400,
      "VALIDATION_ERROR",
      "X-Dev-Requester-Id is required and must be a positive integer.",
    );
  }

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const categoryId = parseOptionalInt(req.query.category);
  const requestedPriorityId = parseOptionalInt(req.query.requestedPriorityId);
  const currentStatusId = parseOptionalInt(req.query.currentStatusId);

  const sortBy =
    typeof req.query.sortBy === "string" && SORT_FIELDS.has(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
  const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";

  const page = positiveInt(req.query.page, 1);
  const rawPageSize = positiveInt(req.query.pageSize, 10);
  const pageSize = Math.min(rawPageSize, 50);
  const skip = (page - 1) * pageSize;

  const where: Prisma.TicketWhereInput = {
    requesterId,
  };

  const andFilters: Record<string, unknown>[] = [];

  if (search) {
    andFilters.push({
      OR: [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (categoryId !== undefined) andFilters.push({ categoryId });
  if (requestedPriorityId !== undefined) andFilters.push({ requestedPriorityId });
  if (currentStatusId !== undefined) andFilters.push({ currentStatusId });
  if (andFilters.length > 0) where.AND = andFilters;

  try {
    const prisma = getPrisma();

      const orderBy: Prisma.TicketOrderByWithRelationInput[] =
        sortBy === "ticketNumber"
          ? [
              {
                ticketNumber: sortDir,
              },
            ]
          : [
              {
                [sortBy]: sortDir,
              },
              {
                ticketNumber: sortDir,
              },
            ];

    const [tickets, totalItems] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          ticketNumber: true,
          summary: true,
          categoryId: true,
          requestedPriorityId: true,
          currentStatusId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return res.status(200).json({
      data: tickets,
      page,
      pageSize,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/tickets failed", error);
    return errorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Unable to retrieve tickets right now.",
    );
  }
});

export default router;
