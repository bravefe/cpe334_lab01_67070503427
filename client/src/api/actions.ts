import {
  ActionResult,
  ActionTaken,
  CreateActionTakenInput,
  UpdateActionTakenInput,
} from "../lib/actionTaken";
import { get, list, patch, post } from "./client";

const ticketPath = (ticketRef: string | number) =>
  `/api/tickets/${encodeURIComponent(String(ticketRef))}/actions`;

const staffTicketPath = (ticketRef: string | number) =>
  `/api/staff/tickets/${encodeURIComponent(String(ticketRef))}/actions`;

function unwrapAction(
  result: ActionTaken | { data: ActionTaken },
): ActionTaken {
  return "data" in result ? result.data : result;
}

export async function fetchActionsTaken(
  ticketRef: string | number,
  asStaff = false,
) {
  const result = await get<ActionTaken[] | { data: ActionTaken[] }>(
    asStaff ? staffTicketPath(ticketRef) : ticketPath(ticketRef),
  );
  return Array.isArray(result) ? result : result.data;
}

export function fetchActionResults() {
  return list<ActionResult>("/api/reference/action-results");
}

export async function createActionTaken(
  ticketRef: string | number,
  payload: CreateActionTakenInput,
) {
  const result = await post<ActionTaken | { data: ActionTaken }>(
    staffTicketPath(ticketRef),
    payload,
  );
  return unwrapAction(result);
}

export async function updateActionTaken(
  ticketRef: string | number,
  actionId: number,
  payload: UpdateActionTakenInput,
) {
  const result = await patch<ActionTaken | { data: ActionTaken }>(
    `${staffTicketPath(ticketRef)}/${actionId}`,
    payload,
  );
  return unwrapAction(result);
}
