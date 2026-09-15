import jwt from "jsonwebtoken";
import crypto from "node:crypto";

export const SESSION_COOKIE = "tt_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export type SessionUser = { id: number; name: string; email: string; role: string; isActive: boolean; mustChangePassword: boolean };
export type SessionPayload = SessionUser & { jti: string; exp?: number };
const revokedSessions = new Map<string, number>();
const secret = () => process.env.JWT_SECRET ?? "toktickit-local-development-secret";

export function createSession(user: SessionUser) {
  return jwt.sign({ ...user, jti: crypto.randomUUID() }, secret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function readSession(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, secret()) as SessionPayload;
    const revokedUntil = revokedSessions.get(payload.jti);
    if (revokedUntil && revokedUntil > Date.now()) return null;
    if (revokedUntil) revokedSessions.delete(payload.jti);
    return payload;
  } catch { return null; }
}

export function revokeSession(token: string) {
  const payload = readSession(token);
  if (payload) revokedSessions.set(payload.jti, payload.exp ? payload.exp * 1000 : Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: SESSION_MAX_AGE_SECONDS * 1000 };
}