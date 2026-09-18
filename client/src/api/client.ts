const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include" });

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw apiError(payload, "Unable to load data. Please try again.");
  }

  return response.json() as Promise<T>;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "TokTickIT",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw apiError(payload, "Unable to save data. Please try again.");
  }

  return payload as T;
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "TokTickIT",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw apiError(payload, "Unable to update data. Please try again.");
  }

  return payload as T;
}

export class ApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function apiError(payload: any, fallback: string): ApiError {
  return new ApiError(payload?.error?.message ?? fallback, payload?.error?.code);
}

export async function list<T>(path: string): Promise<{ data: T[] }> {
  const result = await get<T[] | { data: T[] }>(path);
  return { data: Array.isArray(result) ? result : result.data };
}
