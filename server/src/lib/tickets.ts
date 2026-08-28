import { Request } from "express";

export const SORT_FIELDS = [
  "createdAt",
  "ticketNumber",
  "summary",
  "requestedPriorityId",
  "currentStatusId",
  "updatedAt",
] as const;

export type SortField = (typeof SORT_FIELDS)[number];

export type SortDirection = "asc" | "desc";

export interface TicketQuery {
  page: number;
  pageSize: number;
  sortBy: SortField;
  sortDir: SortDirection;
  search: string;
  categoryId?: number;
  priorityId?: number;
  statusId?: number;
}

function positiveInteger(
  value: unknown
): number | undefined {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : undefined;
}

export function parseTicketQuery(
  req: Request
): TicketQuery {
  const page =
    positiveInteger(req.query.page) ?? 1;

  const requestedPageSize =
    positiveInteger(req.query.pageSize) ?? 10;

  const pageSize = Math.min(
    requestedPageSize,
    50
  );

  const sortByValue = String(
    req.query.sortBy ?? "createdAt"
  );

  const sortBy: SortField =
    SORT_FIELDS.includes(
      sortByValue as SortField
    )
      ? (sortByValue as SortField)
      : "createdAt";

  const sortDir: SortDirection =
    req.query.sortDir === "asc"
      ? "asc"
      : "desc";

  const search = String(
    req.query.search ?? ""
  ).trim();

  return {
    page,
    pageSize,
    sortBy,
    sortDir,
    search,
    categoryId: positiveInteger(
      req.query.category
    ),
    priorityId: positiveInteger(
      req.query.requestedPriorityId
    ),
    statusId: positiveInteger(
      req.query.currentStatusId
    ),
  };
}