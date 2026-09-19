import { get, post } from "./client";
import { AuthUser } from "../lib/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Requested-With": "TokTickIT",
  };
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const code = payload?.error?.code;
    if (code === "INVALID_CREDENTIALS")
      throw new Error("Invalid email or password.");
    if (code === "ACCOUNT_INACTIVE")
      throw new Error("This account is inactive. Contact an administrator.");
    throw new Error("Unable to sign in. Please try again.");
  }

  return payload.user as AuthUser;
}

export function getCurrentUser() {
  return get<AuthUser>("/api/auth/me");
}

export function changePassword(currentPassword: string, newPassword: string) {
  return post<{ mustChangePassword: boolean }>("/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

export function logout() {
  return post<undefined>("/api/auth/logout", undefined);
}
