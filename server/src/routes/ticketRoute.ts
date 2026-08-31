import { Router } from "express";
import { getTickets } from "../controllers/ticketController.js";

const router = Router();

router.get("/tickets", getTickets);

export default router;