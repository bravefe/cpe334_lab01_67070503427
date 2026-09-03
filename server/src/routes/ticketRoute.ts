import { Router } from "express";
import { createTicket, getTicketDetail, getTickets } from "../controllers/ticketController.js";

const router = Router();

router.get("/tickets", getTickets);
router.post("/create-ticket", createTicket);
router.get("/tickets/:ticketNumber", getTicketDetail);

export default router;