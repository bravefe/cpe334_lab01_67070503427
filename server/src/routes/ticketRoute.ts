import { Router } from "express";
import { createTicket, getTicketDetail, getTickets } from "../controllers/ticketController.js";
import { requireRole } from "../middleware/authentication.js";

const router = Router();

router.get("/tickets", getTickets);
router.post("/create-ticket", requireRole("REQUESTER"), createTicket);
router.post("/tickets", requireRole("REQUESTER"), createTicket);
router.get("/tickets/:ticketNumber", getTicketDetail);

export default router;