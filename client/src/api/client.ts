const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function get<T>(path: string, requesterId?: number): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, requesterId
    ? { headers: { "X-Dev-Requester-Id": String(requesterId) } }
    : undefined);

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(payload?.error?.message ?? "Unable to load data. Please try again.");
  }

  return response.json() as Promise<T>;
}

export async function post<T>(path: string, requesterId: number, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Requester-Id": String(requesterId),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Unable to save data. Please try again.");
  }

  return payload as T;
}

export async function list<T>(path: string): Promise<{ data: T[] }> {
  const result = await get<T[] | { data: T[] }>(path);
  return { data: Array.isArray(result) ? result : result.data };
}
