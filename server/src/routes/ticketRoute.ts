import { Router } from "express";
import {
  createTicket,
  createTicketComment,
  getTicketComments,
  getTicketDetail,
  getTickets,
  updateTicketResolution,
  createAction,
  getActions,
  updateAction,
} from "../controllers/ticketController.js";
import { requireRole } from "../middleware/authentication.js";

const router = Router();

router.get("/tickets", getTickets);
router.post("/create-ticket", requireRole("REQUESTER"), createTicket);
router.post("/tickets", requireRole("REQUESTER"), createTicket);
router.get("/tickets/:ticketNumber", getTicketDetail);
router.get("/tickets/:ticketNumber/comments", getTicketComments);
router.post("/tickets/:ticketNumber/comments", createTicketComment);
router.patch("/tickets/:ticketNumber/resolution", updateTicketResolution);

router.post(
  "/tickets/:ticketId/actions",
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  createAction,
);

router.get("/tickets/:ticketId/actions", getActions);

router.patch(
  "/tickets/:ticketId/actions/:actionId",
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  updateAction,
);

export default router;
