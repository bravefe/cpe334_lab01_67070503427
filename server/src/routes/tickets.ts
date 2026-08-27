import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

const SORT_FIELDS = [
  "createdAt",
  "ticketNumber",
  "summary",
  "requestedPriorityId",
  "currentStatusId",
  "updatedAt",
] as const;

type SortField = (typeof SORT_FIELDS)[number];

router.get("/tickets", async (req: Request, res: Response) => {
  const requesterId = Number(req.header("X-Dev-Requester-Id"));

  if (!Number.isInteger(requesterId) || requesterId <= 0) {
    res.status(400).json({
      error: "A valid requester context is required",
    });
    return;
  }

  const pageValue = Number(req.query.page);
  const pageSizeValue = Number(req.query.pageSize);

  const page =
    Number.isInteger(pageValue) && pageValue > 0
      ? pageValue
      : 1;

  const pageSize =
    Number.isInteger(pageSizeValue) && pageSizeValue > 0
      ? Math.min(pageSizeValue, 50)
      : 10;

  const sortByValue = String(
    req.query.sortBy ?? "createdAt"
  );

  const sortBy: SortField = SORT_FIELDS.includes(
    sortByValue as SortField
  )
    ? (sortByValue as SortField)
    : "createdAt";

  const sortDir =
    req.query.sortDir === "asc"
      ? "asc"
      : "desc";

  const search = String(
    req.query.search ?? ""
  ).trim();

  const categoryId = Number(
    req.query.category
  );

  const priorityId = Number(
    req.query.requestedPriorityId
  );

  const statusId = Number(
    req.query.currentStatusId
  );

  try {
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

      ...(Number.isInteger(categoryId) && categoryId > 0
        ? { categoryId }
        : {}),

      ...(Number.isInteger(priorityId) && priorityId > 0
        ? { requestedPriorityId: priorityId }
        : {}),

      ...(Number.isInteger(statusId) && statusId > 0
        ? { currentStatusId: statusId }
        : {}),
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
          {
            [sortBy]: sortDir,
          },
          ...(sortBy === "createdAt"
            ? [{ ticketNumber: sortDir }]
            : []),
        ] as never,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.status(200).json({
      data: tickets,
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(
        totalItems / pageSize
      ),
    });
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch tickets",
    });
  }
});

export default router;