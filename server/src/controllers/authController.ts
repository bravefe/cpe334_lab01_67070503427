import type { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import {
  comparePassword,
  hashPassword,
  validatePassword,
} from "../lib/password.js";
import {
  createSession,
  revokeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../lib/session.js";

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

export async function login(req: Request, res: Response) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Email and password are required.",
      },
    });
    return;
  }
  const user = await getPrisma().user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
    return;
  }
  // if (!user) {
  //   res.status(401).json({
  //     error: {
  //       code: "INVALID_EMAIL",
  //       message: "Email not found.",
  //     },
  //   });
  //   return;
  // }

  // const isPasswordValid = await comparePassword(password, user.passwordHash);

  // if (!isPasswordValid) {
  //   res.status(401).json({
  //     error: {
  //       code: "INVALID_PASSWORD",
  //       message: "Incorrect password.",
  //     },
  //   });
  //   return;
  // }

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

export function logout(req: Request, res: Response) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) revokeSession(token);
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
}
export function me(req: Request, res: Response) {
  res.status(200).json(publicUser(req.user!));
}

export async function changePassword(req: Request, res: Response) {
  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  const error = validatePassword(newPassword);
  if (error) {
    res
      .status(400)
      .json({ error: { code: "VALIDATION_ERROR", message: error } });
    return;
  }
  const user = await getPrisma().user.findUnique({
    where: { id: req.user!.id },
  });
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
  await getPrisma().user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });
  res.status(200).json({ mustChangePassword: false });
}
