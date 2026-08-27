import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

const router = Router();

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json(categories);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch categories",
    });
  }
});

router.get("/priorities", async (_req: Request, res: Response) => {
  try {
    const priorities = await getPrisma().priority.findMany({
      select: {
        id: true,
        name: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    res.status(200).json(priorities);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch priorities",
    });
  }
});

router.get("/statuses", async (_req: Request, res: Response) => {
  try {
    const statuses = await getPrisma().status.findMany({
      select: {
        id: true,
        name: true,
        isDefault: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json(statuses);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch statuses",
    });
  }
});

router.get("/dev-requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().devRequester.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(requesters);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch requesters",
    });
  }
});

export default router;