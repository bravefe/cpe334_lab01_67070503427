import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { getPrisma } from "../prisma.js";

const router = Router();

// ============================================================
// Configuration
// ============================================================

const SORT_FIELDS = [
  "createdAt",
  "ticketNumber",
  "summary",
  "requestedPriorityId",
  "currentStatusId",
  "updatedAt",
] as const;

type SortField = (typeof SORT_FIELDS)[number];

// ============================================================
// Helper Functions
// ============================================================

function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

function positiveInt(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function parseOptionalInt(
  value: unknown,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : undefined;
}

// ============================================================
// GET /api/tickets
// ============================================================

router.get(
  "/tickets",
  async (req: Request, res: Response) => {
    // --------------------------------------------------------
    // Query Parameters
    // --------------------------------------------------------

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const categoryId = parseOptionalInt(
      req.query.category,
    );

    const requestedPriorityId = parseOptionalInt(
      req.query.requestedPriorityId,
    );

    const currentStatusId = parseOptionalInt(
      req.query.currentStatusId,
    );

    // --------------------------------------------------------
    // Sorting
    // --------------------------------------------------------

    const requestedSortBy =
      typeof req.query.sortBy === "string"
        ? req.query.sortBy
        : "";

    const sortBy: SortField =
      SORT_FIELDS.includes(
        requestedSortBy as SortField,
      )
        ? (requestedSortBy as SortField)
        : "createdAt";

    const sortDir: Prisma.SortOrder =
      req.query.sortDir === "asc"
        ? "asc"
        : "desc";

    // --------------------------------------------------------
    // Pagination
    // --------------------------------------------------------

    const page = positiveInt(
      req.query.page,
      1,
    );

    const rawPageSize = positiveInt(
      req.query.pageSize,
      10,
    );

    // Maximum 50 tickets per page
    const pageSize = Math.min(
      rawPageSize,
      50,
    );

    const skip =
      (page - 1) * pageSize;

    // --------------------------------------------------------
    // Filters
    // --------------------------------------------------------

    const andFilters: Prisma.TicketWhereInput[] = [];

    // Search by Ticket Number or Summary
    if (search) {
      andFilters.push({
        OR: [
          {
            ticketNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            summary: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    // Category filter
    if (categoryId !== undefined) {
      andFilters.push({
        categoryId,
      });
    }

    // Requested Priority filter
    if (
      requestedPriorityId !== undefined
    ) {
      andFilters.push({
        requestedPriorityId,
      });
    }

    // Current Status filter
    if (
      currentStatusId !== undefined
    ) {
      andFilters.push({
        currentStatusId,
      });
    }

    const where: Prisma.TicketWhereInput =
      andFilters.length > 0
        ? {
            AND: andFilters,
          }
        : {};

    // --------------------------------------------------------
    // Database Query
    // --------------------------------------------------------

    try {
      const prisma = getPrisma();

      // ------------------------------------------------------
      // Order By
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // Get Tickets + Total Count
      // ------------------------------------------------------

      const [tickets, totalItems] =
        await prisma.$transaction([
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

          prisma.ticket.count({
            where,
          }),
        ]);

      // ------------------------------------------------------
      // Pagination Information
      // ------------------------------------------------------

      const totalPages = Math.ceil(
        totalItems / pageSize,
      );

      // ------------------------------------------------------
      // Response
      // ------------------------------------------------------

      return res.status(200).json({
        data: tickets,
        page,
        pageSize,
        totalItems,
        totalPages,
      });
    } catch (error) {
      console.error(
        "GET /api/tickets failed",
        error,
      );

      return errorResponse(
        res,
        500,
        "INTERNAL_ERROR",
        "Unable to retrieve tickets right now.",
      );
    }
  },
);

export default router;