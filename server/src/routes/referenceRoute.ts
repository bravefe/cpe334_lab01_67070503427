import { Router } from "express";
import {
  getCategories,
  getPriorities,
  getStatuses,
  getDevRequesters,
} from "../controllers/referenceController.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/priorities", getPriorities);
router.get("/statuses", getStatuses);
router.get("/dev-requesters", getDevRequesters);

export default router;