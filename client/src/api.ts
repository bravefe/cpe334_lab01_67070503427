const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category { id: number; name: string }
export interface Priority { id: number; name: string; sortOrder: number }
export interface Status { id: number; name: string; isDefault: boolean }
export interface Requester { id: number; name: string; email: string }
export interface Ticket {
  ticketNumber: string; requesterId: number; summary: string; createdAt: string; updatedAt: string;
  category: Category; requestedPriority: Priority; currentStatus: Status; requester: Requester;
}
export interface TicketQuery { search: string; category?: number; requestedPriorityId?: number; currentStatusId?: number; sortBy: string; sortDir: "asc" | "desc"; page: number; pageSize: number }
export interface TicketPage { data: Ticket[]; page: number; pageSize: number; totalItems: number; totalPages: number }
export interface SystemStatus { online: boolean; categories: Category[] }

async function get<T>(path: string, requesterId?: number): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, requesterId ? { headers: { "X-Dev-Requester-Id": String(requesterId) } } : undefined);
  if (!response.ok) throw new Error("Unable to load data. Please try again.");
  return response.json() as Promise<T>;
}
async function list<T>(path: string): Promise<{ data: T[] }> {
  const result = await get<T[] | { data: T[] }>(path);
  return { data: Array.isArray(result) ? result : result.data };
}
export const fetchRequesters = () => list<Requester>("/api/dev-requesters");
export const fetchCategories = () => list<Category>("/api/categories");
export const fetchPriorities = () => list<Priority>("/api/priorities");
export const fetchStatuses = () => list<Status>("/api/statuses");
export async function checkSystem(): Promise<SystemStatus> {
  await get<unknown>("/api/health");
  const result = await fetchCategories();
  return { online: true, categories: result.data };
}
export function fetchTickets(requesterId: number, query: TicketQuery) {
  const params = new URLSearchParams({ search: query.search, sortBy: query.sortBy, sortDir: query.sortDir, page: String(query.page), pageSize: String(query.pageSize) });
  if (query.category) params.set("category", String(query.category));
  if (query.requestedPriorityId) params.set("requestedPriorityId", String(query.requestedPriorityId));
  if (query.currentStatusId) params.set("currentStatusId", String(query.currentStatusId));
  return get<TicketPage>(`/api/tickets?${params}`, requesterId);
}
