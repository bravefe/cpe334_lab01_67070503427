export type Ticket = {
  ticketNumber: string;
  summary: string;
  categoryId: number;
  requestedPriorityId: number;
  currentStatusId: number;
  createdAt: string;
  updatedAt: string;
};

export type ReferenceItem = {
  id: number;
  name: string;
  sortOrder?: number;
  isDefault?: boolean;
};

export type TicketListResponse = {
  data: Ticket[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type ErrorEnvelope = {
  error?: {
    message?: string;
  };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function requesterId(): string {
  const candidates = [
    localStorage.getItem("devRequesterId"),
    localStorage.getItem("requesterId"),
    localStorage.getItem("selectedRequesterId"),
    localStorage.getItem("toktickit.requesterId"),
  ];

  const value = candidates.find((candidate) => candidate && candidate.trim() !== "");
  if (!value) {
    throw new Error("No Development Requester is selected. Please choose a requester first.");
  }

  return value;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Dev-Requester-Id": requesterId(),
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & ErrorEnvelope;

  if (!response.ok) {
    throw new Error(body.error?.message ?? "The server could not complete the request.");
  }

  return body as T;
}

export async function getTickets(params: {
  search: string;
  categoryId: number | "";
  requestedPriorityId: number | "";
  currentStatusId: number | "";
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page: number;
  pageSize: number;
}): Promise<TicketListResponse> {
  const query = new URLSearchParams();

  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.categoryId !== "") query.set("category", String(params.categoryId));
  if (params.requestedPriorityId !== "") {
    query.set("requestedPriorityId", String(params.requestedPriorityId));
  }
  if (params.currentStatusId !== "") {
    query.set("currentStatusId", String(params.currentStatusId));
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  return getJson<TicketListResponse>(`/api/tickets?${query.toString()}`);
}

export async function getCategories(): Promise<ReferenceItem[]> {
  const response = await getJson<{ data: ReferenceItem[] }>("/api/categories");
  return response.data;
}

export async function getPriorities(): Promise<ReferenceItem[]> {
  const response = await getJson<{ data: ReferenceItem[] }>("/api/priorities");
  return response.data;
}

export async function getStatuses(): Promise<ReferenceItem[]> {
  const response = await getJson<{ data: ReferenceItem[] }>("/api/statuses");
  return response.data;
}
