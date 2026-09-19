import { get, patch, post } from "./client";
import { ManagedUser, UserInput, UserRole } from "../lib/user";

export function fetchUsers(query: { q?: string; role?: UserRole } = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.role) params.set("role", query.role);
  const suffix = params.size ? `?${params}` : "";
  return get<{ items: ManagedUser[] }>(`/api/admin/users${suffix}`);
}

export function createUser(input: UserInput & { initialPassword: string }) {
  return post<ManagedUser>("/api/admin/users", input);
}

export function updateUser(id: number, input: UserInput) {
  return patch<ManagedUser>(`/api/admin/users/${id}`, input);
}

export function resetUserPassword(id: number, newPassword: string) {
  return patch<{ mustChangePassword: boolean }>(`/api/admin/users/${id}/password`, {
    newPassword,
  });
}
