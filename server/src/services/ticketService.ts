import { getPrisma } from "../prisma.js";
import type {
  TicketQuery,
} from "../lib/tickets.js";

interface GetTicketsParams {
  requesterId: number;
  query: TicketQuery;
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

    ...(categoryId
      ? { categoryId }
      : {}),

    ...(priorityId
      ? {
          requestedPriorityId: priorityId,
        }
      : {}),

    ...(statusId
      ? {
          currentStatusId: statusId,
        }
      : {}),
  };

  const [totalItems, tickets] =
    await Promise.all([
      getPrisma().ticket.count({
        where,
      }),

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
            ? [
                {
                  ticketNumber: sortDir,
                },
              ]
            : []),
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
    totalPages: Math.ceil(
      totalItems / pageSize
    ),
  };
}