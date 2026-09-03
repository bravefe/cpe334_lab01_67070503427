import { list, get } from "./client";
import { Category, Priority, RelatedSystem, Status, SystemStatus } from "../lib/reference";

export const fetchCategories = () => list<Category>("/api/categories");
export const fetchRelatedSystems = () => list<RelatedSystem>("/api/related-systems");
export const fetchPriorities = () => list<Priority>("/api/priorities");
export const fetchStatuses = () => list<Status>("/api/statuses");

export async function checkSystem(): Promise<SystemStatus> {
  await get<unknown>("/api/health");
  const result = await fetchCategories();
  return { online: true, categories: result.data };
}
