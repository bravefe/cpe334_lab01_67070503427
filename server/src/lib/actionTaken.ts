export interface CreateActionTakenInput {
    actionAt: Date;
    description: string;
    resultId: number;
    followUpRequired: boolean;
    followUpNote: string | null;
    attachmentNotes: string | null;
}

export interface UpdateActionTakenInput {
    description?: string;
    resultId?: number;
    followUpRequired?: boolean;
    followUpNote?: string | null;
    attachmentNotes?: string | null;
}

export function parseActionTakenCreateInput(body: unknown):
    | { ok: true; data: CreateActionTakenInput }
    | { ok: false; fieldErrors: Array<{ field: string; message: string }> } {
    const value =
        typeof body === "object" && body !== null
            ? body as Record<string, unknown>
            : {};

    const fieldErrors: Array<{ field: string; message: string }> = [];

    const description =
        typeof value.description === "string"
            ? value.description.trim()
            : "";

    if (description.length < 3) {
        fieldErrors.push({
            field: "description",
            message: "Description must be at least 3 characters.",
        });
    }

    const actionAt =
        typeof value.actionAt === "string"
            ? new Date(value.actionAt)
            : null;

    if (!actionAt || Number.isNaN(actionAt.getTime())) {
        fieldErrors.push({
            field: "actionAt",
            message: "Action date/time must be a valid date.",
        });
    }

    const resultId = Number(value.resultId);

    if (!Number.isInteger(resultId) || resultId <= 0) {
        fieldErrors.push({
            field: "resultId",
            message: "Result is required.",
        });
    }

    if (typeof value.followUpRequired !== "boolean") {
        fieldErrors.push({
            field: "followUpRequired",
            message: "Follow-up Required must be a boolean.",
        });
    }

    const followUpRequired =
        typeof value.followUpRequired === "boolean"
            ? value.followUpRequired
            : false;

    const followUpNote =
        typeof value.followUpNote === "string"
            ? value.followUpNote.trim()
            : null;

    if (followUpRequired && !followUpNote) {
        fieldErrors.push({
            field: "followUpNote",
            message: "Follow-up Note is required when Follow-up Required is true.",
        });
    }

    const attachmentNotes =
        typeof value.attachmentNotes === "string"
            ? value.attachmentNotes.trim() || null
            : null;

    if (fieldErrors.length > 0) {
        return {
            ok: false,
            fieldErrors,
        };
    }

    return {
        ok: true,
        data: {
            actionAt: actionAt!,
            description,
            resultId,
            followUpRequired,
            followUpNote: followUpRequired ? followUpNote : null,
            attachmentNotes,
        },
    };
}

export function parseActionTakenUpdateInput(body: unknown):
    | {
        ok: true;
        updatedAt: Date;
        data: UpdateActionTakenInput;
    }
    | {
        ok: false;
        fieldErrors: Array<{ field: string; message: string }>;
    } {
    const value =
        typeof body === "object" && body !== null
            ? body as Record<string, unknown>
            : {};

    const fieldErrors: Array<{ field: string; message: string }> = [];

    const updatedAt =
        typeof value.updatedAt === "string"
            ? new Date(value.updatedAt)
            : null;

    if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
        fieldErrors.push({
            field: "updatedAt",
            message: "updatedAt is required and must be a valid date.",
        });
    }

    const data: UpdateActionTakenInput = {};

    if ("description" in value) {
        if (typeof value.description !== "string") {
            fieldErrors.push({
                field: "description",
                message: "Description must be a string.",
            });
        } else {
            data.description = value.description.trim();

            if (data.description.length < 3) {
                fieldErrors.push({
                    field: "description",
                    message: "Description must be at least 3 characters.",
                });
            }
        }
    }

    if ("resultId" in value) {
        const resultId = Number(value.resultId);

        if (!Number.isInteger(resultId) || resultId <= 0) {
            fieldErrors.push({
                field: "resultId",
                message: "Result is invalid.",
            });
        } else {
            data.resultId = resultId;
        }
    }

    if ("followUpRequired" in value) {
        if (typeof value.followUpRequired !== "boolean") {
            fieldErrors.push({
                field: "followUpRequired",
                message: "Follow-up Required must be a boolean.",
            });
        } else {
            data.followUpRequired = value.followUpRequired;
        }
    }

    if ("followUpNote" in value) {
        if (
            value.followUpNote !== null &&
            typeof value.followUpNote !== "string"
        ) {
            fieldErrors.push({
                field: "followUpNote",
                message: "Follow-up Note must be a string or null.",
            });
        } else {
            data.followUpNote =
                typeof value.followUpNote === "string"
                    ? value.followUpNote.trim() || null
                    : null;
        }
    }

    if ("attachmentNotes" in value) {
        if (
            value.attachmentNotes !== null &&
            typeof value.attachmentNotes !== "string"
        ) {
            fieldErrors.push({
                field: "attachmentNotes",
                message: "Attachment Notes must be a string or null.",
            });
        } else {
            data.attachmentNotes =
                typeof value.attachmentNotes === "string"
                    ? value.attachmentNotes.trim() || null
                    : null;
        }
    }

    if (
        data.followUpRequired === true &&
        !data.followUpNote
    ) {
        fieldErrors.push({
            field: "followUpNote",
            message: "Follow-up Note is required when Follow-up Required is true.",
        });
    }

    if (fieldErrors.length > 0) {
        return { ok: false, fieldErrors };
    }

    return {
        ok: true,
        updatedAt: updatedAt!,
        data,
    };
}