import { Router } from "express";
import { requireRole } from "../middleware/authentication.js";
import {
  createUser,
  getUser,
  listUsers,
  resetPassword,
  updateUser,
} from "../controllers/adminController.js";
const router = Router();
router.use(requireRole("ADMINISTRATOR"));
router.get("/admin/users", listUsers);
router.post("/admin/users", createUser);
router.get("/admin/users/:id", getUser);
router.patch("/admin/users/:id", updateUser);
router.patch("/admin/users/:id/password", resetPassword);
export default router;
