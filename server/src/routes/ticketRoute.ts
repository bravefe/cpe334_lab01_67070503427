import { Router } from "express";
import {
  createTicket,
  createTicketComment,
  getTicketComments,
  getTicketDetail,
  getTickets,
  updateTicketResolution,
} from "../controllers/ticketController.js";
import {
  createAction,
  getActions,
  updateAction,
} from "../controllers/actionTakenController.js";
import { requireRole } from "../middleware/authentication.js";

const router = Router();

router.get("/tickets", getTickets);
router.post("/create-ticket", requireRole("REQUESTER"), createTicket);
router.post("/tickets", requireRole("REQUESTER"), createTicket);
router.get("/tickets/:ticketNumber", getTicketDetail);
router.get("/tickets/:ticketNumber/comments", getTicketComments);
router.post("/tickets/:ticketNumber/comments", createTicketComment);
router.patch("/tickets/:ticketNumber/resolution", updateTicketResolution);

router.get("/tickets/:ticketId/actions", getActions);
router.post(
  "/tickets/:ticketId/actions",
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  createAction,
);
router.patch(
  "/tickets/:ticketId/actions/:actionId",
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  updateAction,
);

export default router;
