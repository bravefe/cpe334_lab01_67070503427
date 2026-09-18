import type { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { hashPassword, validatePassword } from "../lib/password.js";
import { isValidEmail, normalizeEmail } from "../lib/email.js";

const VALID_ROLES = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"] as const;
type RoleType = (typeof VALID_ROLES)[number];

function isValidRole(role: unknown): role is RoleType {
  return typeof role === "string" && VALID_ROLES.includes(role as RoleType);
}

function formatSafeUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    ...(typeof user.mustChangePassword === "boolean"
      ? { mustChangePassword: user.mustChangePassword }
      : {}),
  };
}

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({ error: { code, message } });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const roleQuery = typeof req.query.role === "string" ? req.query.role : undefined;
  const role = roleQuery && isValidRole(roleQuery) ? roleQuery : undefined;

  const users = await getPrisma().user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
    },
    orderBy: { name: "asc" },
  });

  res.status(200).json({ items: users.map(formatSafeUser) });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  const user = await getPrisma().user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  res.status(200).json(formatSafeUser(user));
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const {
    name,
    email,
    role,
    isActive = true,
    initialPassword,
  } = req.body ?? {};

  const passwordError = validatePassword(initialPassword);

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !isValidEmail(email) ||
    !isValidRole(role) ||
    passwordError
  ) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      passwordError ?? "Invalid user details.",
    );
    return;
  }

  const normalizedEmail = normalizeEmail(email);

  const existing = await getPrisma().user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });

  if (existing) {
    sendError(
      res,
      409,
      "DUPLICATE_EMAIL",
      "A user with this email already exists.",
    );
    return;
  }

  const passwordHash = await hashPassword(initialPassword);

  const user = await getPrisma().user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role,
      isActive: Boolean(isActive),
      passwordHash,
      mustChangePassword: true,
    },
  });

  res.status(201).json(formatSafeUser(user));
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  const current = await getPrisma().user.findUnique({
    where: { id: userId },
  });

  if (!current) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  const data = req.body ?? {};

  if (userId === req.user!.id && data.isActive === false) {
    sendError(
      res,
      409,
      "SELF_DEACTIVATION",
      "You cannot deactivate your own account.",
    );
    return;
  }

  if (data.role !== undefined && !isValidRole(data.role)) {
    sendError(res, 400, "VALIDATION_ERROR", "Invalid role.");
    return;
  }

  if (data.email !== undefined) {
    if (!isValidEmail(data.email)) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid email address.");
      return;
    }

    const normalizedEmail = normalizeEmail(data.email);
    const duplicate = await getPrisma().user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        NOT: { id: userId },
      },
    });

    if (duplicate) {
      sendError(
        res,
        409,
        "DUPLICATE_EMAIL",
        "A user with this email already exists.",
      );
      return;
    }
  }

  if (
    current.role === "ADMINISTRATOR" &&
    current.isActive &&
    (data.isActive === false || (data.role && data.role !== "ADMINISTRATOR"))
  ) {
    const count = await getPrisma().user.count({
      where: { role: "ADMINISTRATOR", isActive: true },
    });

    if (count <= 1) {
      sendError(
        res,
        409,
        "LAST_ADMIN",
        "At least one active administrator is required.",
      );
      return;
    }
  }

  const updated = await getPrisma().user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
      ...(data.email !== undefined
        ? { email: normalizeEmail(data.email) }
        : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(typeof data.isActive === "boolean"
        ? { isActive: data.isActive }
        : {}),
    },
  });

  res.status(200).json(formatSafeUser(updated));
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  const passwordError = validatePassword(req.body?.newPassword);
  if (passwordError) {
    sendError(res, 400, "VALIDATION_ERROR", passwordError);
    return;
  }

  const user = await getPrisma()
    .user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(req.body.newPassword),
        mustChangePassword: true,
      },
    })
    .catch(() => null);

  if (!user) {
    sendError(res, 404, "NOT_FOUND", "User not found.");
    return;
  }

  res.status(200).json({ mustChangePassword: true });
}
