import { Router } from "express";
import { requireRole } from "../middleware/authentication.js";
import {
  createNote,
  createStaffComment,
  getStaffTicket,
  listNotes,
  listStaffComments,
  listStaffTickets,
  updateOwner,
  updatePriority,
  updateStatus,
} from "../controllers/staffController.js";
import {
  createAction,
  getActions,
  updateAction,
} from "../controllers/actionTakenController.js";
const router = Router();
router.use(requireRole("IT_STAFF", "ADMINISTRATOR"));
router.get("/staff/tickets", listStaffTickets);
router.get("/staff/tickets/:id", getStaffTicket);

router.patch("/staff/tickets/:id/owner", updateOwner);
router.patch("/staff/tickets/:id/priority", updatePriority);
router.patch("/staff/tickets/:id/status", updateStatus);

router.get("/staff/tickets/:id/comments", listStaffComments);
router.post("/staff/tickets/:id/comments", createStaffComment);
router.get("/staff/tickets/:id/notes", listNotes);
router.post("/staff/tickets/:id/notes", createNote);

router.get("/staff/tickets/:id/actions", getActions);
router.post("/staff/tickets/:id/actions", createAction);
router.patch("/staff/tickets/:id/actions/:actionId", updateAction);

export default router;
