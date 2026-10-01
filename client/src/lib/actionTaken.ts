export interface ActionResult {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionAt: string;
  description: string;
  resultId: number;
  result: { id: number; name: string };
  performedBy: { id: number; name: string };
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionTakenInput {
  actionAt: string;
  description: string;
  resultId: number;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
}

export interface UpdateActionTakenInput {
  updatedAt: string;
  description: string;
  resultId: number;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
}
