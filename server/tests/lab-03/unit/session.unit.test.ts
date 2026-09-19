import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import {
  createSession,
  readSession,
  revokeSession,
  SESSION_MAX_AGE_SECONDS,
  type SessionUser,
} from "../../../src/lib/session.js";

const user: SessionUser = {
  id: 1,
  name: "Frodo Baggins",
  email: "frodo.b@shiremail.example.com",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};

describe("session helpers", () => {
  it("UNIT-03: accepts valid JWTs and rejects tampered or expired tokens", () => {
    const token = createSession(user);
    expect(readSession(token)).toEqual(expect.objectContaining(user));

    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(readSession(tampered)).toBeNull();

    const expired = jwt.sign(
      { ...user, jti: "expired-session" },
      process.env.JWT_SECRET ?? "toktickit-local-development-secret",
      { expiresIn: -1 },
    );
    expect(readSession(expired)).toBeNull();
  });

  it("UNIT-04: rejects a revoked session before its natural expiry", () => {
    const token = createSession(user);
    expect(readSession(token)).not.toBeNull();
    revokeSession(token);
    expect(readSession(token)).toBeNull();
    expect(SESSION_MAX_AGE_SECONDS).toBe(8 * 60 * 60);
  });
});
