import type { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from "../lib/password.js";
import { isValidEmail, normalizeEmail } from "../lib/email.js";
import {
  createSession,
  revokeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../lib/session.js";
import {
  findUserByEmail,
  findUserById,
  updateUserPassword,
} from "../services/authService.js";

const publicUser = (user: {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
});

export async function login(req: Request, res: Response): Promise<void> {
  const emailRaw = typeof req.body?.email === "string" ? req.body.email : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!emailRaw || !password || !isValidEmail(emailRaw)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Email and password are required.",
      },
    });
    return;
  }

  const email = normalizeEmail(emailRaw);
  const user = await findUserByEmail(email);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      error: {
        code: "ACCOUNT_INACTIVE",
        message: "This account is inactive. Contact an administrator.",
      },
    });
    return;
  }

  res.cookie(
    SESSION_COOKIE,
    createSession(publicUser(user)),
    sessionCookieOptions(),
  );

  res.status(200).json({ user: publicUser(user) });
}

export function logout(req: Request, res: Response): void {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) {
    revokeSession(token);
  }

  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, clearOptions);
  res.status(204).end();
}

export function me(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
    return;
  }

  res.status(200).json(publicUser(req.user));
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  const validationError = validatePassword(newPassword);
  if (validationError) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: validationError },
    });
    return;
  }

  const user = await findUserById(req.user!.id);

  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    res.status(401).json({
      error: {
        code: "INVALID_PASSWORD",
        message: "Current password is incorrect.",
      },
    });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "New password must differ from current password.",
      },
    });
    return;
  }

  const updatedUser = await updateUserPassword(
    user.id,
    await hashPassword(newPassword),
  );

  const currentToken = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (currentToken) {
    revokeSession(currentToken);
  }

  res.cookie(
    SESSION_COOKIE,
    createSession(publicUser(updatedUser)),
    sessionCookieOptions(),
  );

  res.status(200).json({ mustChangePassword: false });
}
