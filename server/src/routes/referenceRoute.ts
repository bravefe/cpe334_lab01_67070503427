import { Router } from "express";
import {
  getActionResults,
  getCategories,
  getPriorities,
  getRelatedSystems,
  getStatuses,
} from "../controllers/referenceController.js";

const router = Router();

router.get("/action-results", getActionResults);
router.get("/categories", getCategories);
router.get("/related-systems", getRelatedSystems);
router.get("/priorities", getPriorities);
router.get("/statuses", getStatuses);

export default router;
