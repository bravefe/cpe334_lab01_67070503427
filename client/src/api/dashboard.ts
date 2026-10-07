// api/dashboard.ts
import {
  AdminDashboard,
  DashboardApiError,
  RequesterDashboard,
  StaffDashboard,
} from "../lib/dashboard";
import { API_URL } from "./client";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: "GET",
    credentials: "include", // session cookie; server derives the user (BR-14)
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = await res.json();
      message =
        body?.error?.message ??
        body?.message ??
        (typeof body?.error === "string" ? body.error : message);
    } catch {
      /* non-JSON error body */
    }
    throw new DashboardApiError(res.status, message);
  }

  return (await res.json()) as T;
}

/** Requester dashboard. No user id is sent; the server uses the session. */
export function getRequesterDashboard(
  signal?: AbortSignal,
): Promise<RequesterDashboard> {
  return getJson<RequesterDashboard>("/api/requester/dashboard", signal);
}

/** IT Staff / Administrator dashboard. */
export function getStaffDashboard(
  signal?: AbortSignal,
): Promise<StaffDashboard> {
  return getJson<StaffDashboard>("/api/staff/dashboard", signal);
}

/** Administrator-only dashboard. */
export function getAdminDashboard(
  signal?: AbortSignal,
): Promise<AdminDashboard> {
  return getJson<AdminDashboard>("/api/admin/dashboard", signal);
}
