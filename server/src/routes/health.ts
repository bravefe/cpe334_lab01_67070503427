import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// router.get("/api/healthCategories", async (_req: Request, res: Response) => {
//   try {
//     const categories = await getPrisma().category.findMany({
//       select: { id: true, name: true },
//       orderBy: { id: "asc" },
//     });

//     res.status(200).json(categories);
//   } catch (_error) {
//     res.status(500).json({ error: "Failed to fetch categories" });
//   }
// });

export default router;