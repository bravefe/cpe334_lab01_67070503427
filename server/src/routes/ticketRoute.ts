import { Router } from "express";
import {
  getRequesterDashboard,
  createTicket,
  createTicketComment,
  getTicketComments,
  getTicketDetail,
  getTickets,
  updateTicketResolution,
} from "../controllers/ticketController.js";
import { requireRole } from "../middleware/authentication.js";

const router = Router();

router.get(
  "/requester/dashboard",
  requireRole("REQUESTER"),
  getRequesterDashboard,
);
router.get("/tickets", getTickets);
router.post("/create-ticket", requireRole("REQUESTER"), createTicket);
router.post("/tickets", requireRole("REQUESTER"), createTicket);
router.get("/tickets/:ticketNumber", getTicketDetail);
router.get("/tickets/:ticketNumber/comments", getTicketComments);
router.post("/tickets/:ticketNumber/comments", createTicketComment);
router.patch(
  "/tickets/:ticketNumber/resolution",
  requireRole("REQUESTER"),
  updateTicketResolution,
);

export default router;
