import { getPrisma } from "../prisma.js";

export type ActionAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | {
      kind: "success";
      ticket: {
        id: number;
        requesterId: number;
        createdAt: Date;
        currentStatus: {
          name: string;
        };
      };
    };

export async function resolveActionTicketAccess(
  ticketId: number,
  userId: number,
  role: string,
): Promise<ActionAccessResult> {
  const ticket = await getPrisma().ticket.findUnique({
    where: { id: ticketId },
    include: {
      currentStatus: true,
    },
  });

  if (!ticket) {
    return { kind: "not_found" };
  }

  if (role === "REQUESTER" && ticket.requesterId !== userId) {
    return { kind: "forbidden" };
  }

  return {
    kind: "success",
    ticket,
  };
}

function mapAction(action: any) {
  return {
    id: action.id,
    ticketId: action.ticketId,
    actionAt: action.actionAt.toISOString(),
    description: action.description,
    resultId: action.resultId,
    result: {
      id: action.result.id,
      name: action.result.name,
    },
    performedBy: {
      id: action.performedBy.id,
      name: action.performedBy.name,
    },
    followUpRequired: action.followUpRequired,
    followUpNote: action.followUpNote,
    attachmentNotes: action.attachmentNotes,
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
  };
}

export async function listActionsTaken(ticketId: number) {
  const actions = await getPrisma().actionTaken.findMany({
    where: { ticketId },
    include: {
      result: true,
      performedBy: true,
    },
    orderBy: {
      actionAt: "desc",
    },
  });

  return actions.map(mapAction);
}

export async function createActionTaken({
  ticketId,
  performedByUserId,
  actionAt,
  description,
  resultId,
  followUpRequired,
  followUpNote,
  attachmentNotes,
}: {
  ticketId: number;
  performedByUserId: number;
  actionAt: Date;
  description: string;
  resultId: number;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
}) {
  const prisma = getPrisma();

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      currentStatus: true,
    },
  });

  if (!ticket) {
    return { kind: "not_found" as const };
  }

  if (
    ticket.currentStatus.name === "Closed" ||
    ticket.currentStatus.name === "Cancelled"
  ) {
    return { kind: "closed" as const };
  }

  if (actionAt < ticket.createdAt || actionAt > new Date()) {
    return { kind: "invalid_action_time" as const };
  }

  const result = await prisma.actionResult.findUnique({
    where: { id: resultId },
  });

  if (!result || !result.isActive) {
    return { kind: "invalid_result" as const };
  }

  const created = await prisma.actionTaken.create({
    data: {
      ticketId,
      actionAt,
      description,
      resultId,
      performedByUserId,
      followUpRequired,
      followUpNote: followUpRequired ? followUpNote : null,
      attachmentNotes,
    },
    include: {
      result: true,
      performedBy: true,
    },
  });

  return {
    kind: "success" as const,
    data: mapAction(created),
  };
}

export async function updateActionTaken({
  ticketId,
  actionId,
  updatedAt,
  data,
}: {
  ticketId: number;
  actionId: number;
  updatedAt: Date;
  data: {
    description?: string;
    resultId?: number;
    followUpRequired?: boolean;
    followUpNote?: string | null;
    attachmentNotes?: string | null;
  };
}) {
  const prisma = getPrisma();

  const existing = await prisma.actionTaken.findFirst({
    where: {
      id: actionId,
      ticketId,
    },
    include: {
      result: true,
      performedBy: true,
    },
  });

  if (!existing) {
    return { kind: "not_found" as const };
  }

  if (existing.updatedAt.getTime() !== updatedAt.getTime()) {
    return {
      kind: "conflict" as const,
      current: mapAction(existing),
    };
  }

  if (data.resultId !== undefined) {
    const result = await prisma.actionResult.findUnique({
      where: { id: data.resultId },
    });

    if (!result || !result.isActive) {
      return { kind: "invalid_result" as const };
    }
  }

  const followUpRequired = data.followUpRequired ?? existing.followUpRequired;

  let followUpNote =
    data.followUpNote !== undefined ? data.followUpNote : existing.followUpNote;

  if (!followUpRequired) {
    followUpNote = null;
  } else if (!followUpNote?.trim()) {
    return { kind: "missing_follow_up_note" as const };
  }

  try {
    const updated = await prisma.actionTaken.update({
      where: {
        id: actionId,
      },
      data: {
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.resultId !== undefined ? { resultId: data.resultId } : {}),
        ...(data.followUpRequired !== undefined
          ? { followUpRequired: data.followUpRequired }
          : {}),
        followUpNote,
        ...(data.attachmentNotes !== undefined
          ? { attachmentNotes: data.attachmentNotes }
          : {}),
      },
      include: {
        result: true,
        performedBy: true,
      },
    });

    return {
      kind: "success" as const,
      data: mapAction(updated),
    };
  } catch (error) {
    // Another update may have won the race after our initial read.
    const current = await prisma.actionTaken.findUnique({
      where: { id: actionId },
      include: {
        result: true,
        performedBy: true,
      },
    });

    if (current) {
      return {
        kind: "conflict" as const,
        current: mapAction(current),
      };
    }

    throw error;
  }
}
