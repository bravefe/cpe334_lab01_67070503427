import { Router } from "express";
import { changePassword, login, logout, me } from "../controllers/authController.js";
import { authenticate, optionalAuthenticate, requireCsrf } from "../middleware/authentication.js";

const router = Router();
router.post("/auth/login", login);
router.post("/auth/logout", requireCsrf, optionalAuthenticate, logout);
router.get("/auth/me", authenticate, me);
router.post("/auth/change-password", requireCsrf, authenticate, changePassword);
export default router;