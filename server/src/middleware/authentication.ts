import type { NextFunction, Request, Response } from "express";
import { readSession, type SessionPayload } from "../lib/session.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.tt_session as string | undefined;
  const user = token ? readSession(token) : null;

  if (!user || !user.isActive) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.tt_session as string | undefined;
  const user = token ? readSession(token) : null;

  if (user?.isActive) {
    req.user = user;
  }

  next();
}

export function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    ["POST", "PATCH", "DELETE"].includes(req.method) &&
    req.get("X-Requested-With") !== "TokTickIT"
  ) {
    res.status(403).json({
      error: {
        code: "CSRF_REQUIRED",
        message: "A valid request origin is required.",
      },
    });
    return;
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required.",
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You are not authorized to perform this action.",
        },
      });
      return;
    }

    next();
  };
}

export function requireCompletedPasswordChange(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.mustChangePassword) {
    res.status(403).json({
      error: {
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your password before continuing.",
      },
    });
    return;
  }

  next();
}