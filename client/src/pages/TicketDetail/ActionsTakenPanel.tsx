import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  createActionTaken,
  fetchActionResults,
  fetchActionsTaken,
  updateActionTaken,
} from "../../api/actions";
import { ApiError } from "../../api/client";
import {
  ActionResult,
  ActionTaken,
  CreateActionTakenInput,
  UpdateActionTakenInput,
} from "../../lib/actionTaken";
import "./ActionsTakenPanel.css";

interface Props {
  ticketRef: string | number;
  ticketCreatedAt?: string;
  ticketStatus?: string;
  role?: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR" | string;
}

interface ActionForm {
  actionAt: string;
  description: string;
  resultId: string;
  followUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
}

const localDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toForm = (action: ActionTaken): ActionForm => ({
  actionAt: localDateTime(new Date(action.actionAt)),
  description: action.description,
  resultId: String(action.resultId),
  followUpRequired: action.followUpRequired,
  followUpNote: action.followUpNote ?? "",
  attachmentNotes: action.attachmentNotes ?? "",
});

const sortedActions = (items: ActionTaken[]) =>
  [...items].sort(
    (left, right) =>
      new Date(right.actionAt).getTime() - new Date(left.actionAt).getTime(),
  );

export default function ActionsTakenPanel({
  ticketRef,
  ticketCreatedAt,
  ticketStatus = "",
  role = "REQUESTER",
}: Props) {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [form, setForm] = useState<ActionForm | null>(null);
  const [editing, setEditing] = useState<ActionTaken | null>(null);
  const [conflict, setConflict] = useState<ActionTaken | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const submittingRef = useRef(false);

  const canManage = role === "IT_STAFF" || role === "ADMINISTRATOR";
  const canAdd = canManage && !["Closed", "Cancelled"].includes(ticketStatus);

  const loadActions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchActionsTaken(ticketRef);
      setActions(
        sortedActions(Array.isArray(data) ? data : ((data as any)?.data ?? [])),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load actions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActions();
  }, [ticketRef]);

  useEffect(() => {
    if (!canManage) return;
    setResultsLoading(true);
    fetchActionResults()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setResults(list.filter((result: ActionResult) => result.isActive));
      })
      .catch(() => setFormError("Unable to load action results."))
      .finally(() => setResultsLoading(false));
  }, [canManage]);

  useEffect(() => {
    if (!form) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current
      ?.querySelector<HTMLElement>("input, textarea, select, button")
      ?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [form !== null]);

  const openCreate = (trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setEditing(null);
    setConflict(null);
    setFormError("");
    setFieldError("");
    setForm({
      actionAt: localDateTime(new Date()),
      description: "",
      resultId: results[0] ? String(results[0].id) : "",
      followUpRequired: false,
      followUpNote: "",
      attachmentNotes: "",
    });
  };

  const openEdit = (action: ActionTaken, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setEditing(action);
    setConflict(null);
    setFormError("");
    setFieldError("");
    setForm(toForm(action));
  };

  const closeForm = () => {
    if (submittingRef.current) return;
    setForm(null);
    setEditing(null);
    setConflict(null);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeForm();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const updateField = <K extends keyof ActionForm>(
    key: K,
    value: ActionForm[K],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    if (key === "description" || key === "followUpNote") setFieldError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || submittingRef.current) return;

    const description = form.description.trim();
    if (description.length < 3) {
      setFieldError("Description must be at least 3 characters.");
      return;
    }
    if (form.followUpRequired && !form.followUpNote.trim()) {
      setFieldError("Follow-up Note is required.");
      return;
    }
    if (!form.resultId) {
      setFieldError("Select an action result.");
      return;
    }
    if (!editing) {
      const actionTime = new Date(form.actionAt).getTime();
      const createdTime = ticketCreatedAt
        ? new Date(ticketCreatedAt).getTime()
        : 0;
      if (
        !Number.isFinite(actionTime) ||
        (createdTime > 0 && actionTime < createdTime) ||
        actionTime > Date.now() + 60000
      ) {
        setFieldError(
          "Action date/time must be between ticket creation and now.",
        );
        return;
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    setFieldError("");
    const fields = {
      description,
      resultId: Number(form.resultId),
      followUpRequired: form.followUpRequired,
      followUpNote: form.followUpRequired ? form.followUpNote.trim() : null,
      attachmentNotes: form.attachmentNotes.trim() || null,
    };

    try {
      if (editing) {
        const payload: UpdateActionTakenInput = {
          ...fields,
          updatedAt: editing.updatedAt,
        };
        const updated = await updateActionTaken(ticketRef, editing.id, payload);
        setActions((current) =>
          sortedActions(
            current.map((item) => (item.id === updated.id ? updated : item)),
          ),
        );
      } else {
        const payload: CreateActionTakenInput = {
          ...fields,
          actionAt: new Date(form.actionAt).toISOString(),
        };
        const created = await createActionTaken(ticketRef, payload);
        setActions((current) => sortedActions([...current, created]));
      }
      setForm(null);
      setEditing(null);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (
          requestError.field === "followUpNote" ||
          requestError.field === "description"
        ) {
          setFieldError(requestError.message);
        } else if (requestError.status === 409 && requestError.current) {
          setConflict(requestError.current as ActionTaken);
          setFormError(
            "This action changed elsewhere. Load the latest version before saving again.",
          );
        } else {
          setFormError(requestError.message);
        }
      } else {
        setFormError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to save action.",
        );
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const loadConflict = () => {
    if (!conflict) return;
    setEditing(conflict);
    setForm(toForm(conflict));
    setConflict(null);
    setFormError("");
  };

  return (
    <section className="actions-taken" aria-label="Actions Taken">
      <div className="actions-heading">
        <div>
          <h2>Actions Taken</h2>
          <p>Service work recorded for this ticket.</p>
        </div>
        {canAdd && (
          <button
            type="button"
            className="actions-primary"
            onClick={(event) => openCreate(event.currentTarget)}
          >
            Add Action
          </button>
        )}
      </div>

      {error && (
        <div className="actions-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadActions()}>
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div className="actions-loading" role="status">
          Loading actions...
        </div>
      ) : actions.length === 0 ? (
        !error && (
          <p className="actions-empty">
            No actions recorded yet for this ticket.
          </p>
        )
      ) : (
        <div
          className="actions-list"
          role="table"
          aria-label="Actions Taken list"
        >
          <div className="actions-row actions-row-heading" role="row">
            <span role="columnheader">Action Date/Time</span>
            <span role="columnheader">Description</span>
            <span role="columnheader">Result</span>
            <span role="columnheader">Follow-up</span>
            <span role="columnheader">Performed By</span>
            {canManage && <span role="columnheader">Actions</span>}
          </div>
          {actions.map((action) => {
            const isExpanded = expanded.includes(action.id);
            const isLong = action.description.length > 180;
            return (
              <article className="actions-row" role="row" key={action.id}>
                <span
                  className="actions-cell actions-date"
                  role="cell"
                  data-label="Action Date/Time"
                >
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(action.actionAt))}
                </span>
                <div
                  className="actions-cell actions-description"
                  role="cell"
                  data-label="Description"
                >
                  <p>
                    {isLong && !isExpanded
                      ? `${action.description.slice(0, 180)}...`
                      : action.description}
                  </p>
                  {isLong && (
                    <button
                      type="button"
                      className="actions-text-button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpanded((current) =>
                          isExpanded
                            ? current.filter((id) => id !== action.id)
                            : [...current, action.id],
                        )
                      }
                    >
                      Show {isExpanded ? "less" : "more"}
                    </button>
                  )}
                  {action.attachmentNotes && (
                    <small>Attachment: {action.attachmentNotes}</small>
                  )}
                </div>
                <span className="actions-cell" role="cell" data-label="Result">
                  <span className="action-result-badge">
                    <span aria-hidden="true">✓ </span>
                    {action.result.name}
                  </span>
                </span>
                <span
                  className="actions-cell"
                  role="cell"
                  data-label="Follow-up"
                >
                  <span
                    className={
                      action.followUpRequired
                        ? "follow-up-required"
                        : "follow-up-none"
                    }
                  >
                    <span aria-hidden="true">
                      {action.followUpRequired ? "! " : "— "}
                    </span>
                    {action.followUpRequired ? "Required" : "—"}
                  </span>
                  {action.followUpRequired && action.followUpNote && (
                    <small>{action.followUpNote}</small>
                  )}
                </span>
                <span
                  className="actions-cell"
                  role="cell"
                  data-label="Performed By"
                >
                  {action.performedBy.name}
                </span>
                {canManage && (
                  <span
                    className="actions-cell actions-control"
                    role="cell"
                    data-label="Actions"
                  >
                    <button
                      type="button"
                      onClick={(event) => openEdit(action, event.currentTarget)}
                    >
                      Edit
                    </button>
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}

      {form && (
        <div
          className="actions-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            className="actions-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-modal-title"
            ref={dialogRef}
            onKeyDown={handleDialogKeyDown}
          >
            <div className="actions-modal-heading">
              <h2 id="action-modal-title">
                {editing ? "Edit Action" : "Add Action"}
              </h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={closeForm}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            {formError && (
              <div className="actions-error" role="alert">
                <span>{formError}</span>
                {conflict && (
                  <button type="button" onClick={loadConflict}>
                    Load latest version
                  </button>
                )}
              </div>
            )}
            <form onSubmit={(event) => void submit(event)} noValidate>
              <label className="actions-field">
                <span>Action Date/Time</span>
                <input
                  type="datetime-local"
                  value={form.actionAt}
                  min={
                    ticketCreatedAt
                      ? localDateTime(new Date(ticketCreatedAt))
                      : undefined
                  }
                  max={localDateTime(new Date())}
                  disabled={Boolean(editing)}
                  onChange={(event) =>
                    updateField("actionAt", event.target.value)
                  }
                />
                {editing && <small>The action date cannot be changed.</small>}
              </label>
              <label className="actions-field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  rows={3}
                  aria-invalid={Boolean(
                    fieldError &&
                    fieldError.toLowerCase().includes("description"),
                  )}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </label>
              <label className="actions-field">
                <span>Result</span>
                <select
                  value={form.resultId}
                  disabled={resultsLoading}
                  onChange={(event) =>
                    updateField("resultId", event.target.value)
                  }
                >
                  <option value="">Select a result</option>
                  {results.map((result) => (
                    <option value={result.id} key={result.id}>
                      {result.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="actions-checkbox">
                <input
                  type="checkbox"
                  checked={form.followUpRequired}
                  onChange={(event) =>
                    updateField("followUpRequired", event.target.checked)
                  }
                />
                <span>Follow-up Required</span>
              </label>
              {form.followUpRequired && (
                <label className="actions-field">
                  <span>Follow-up Note</span>
                  <textarea
                    value={form.followUpNote}
                    rows={2}
                    aria-invalid={Boolean(
                      fieldError &&
                      fieldError.toLowerCase().includes("follow-up"),
                    )}
                    onChange={(event) =>
                      updateField("followUpNote", event.target.value)
                    }
                  />
                </label>
              )}
              <label className="actions-field">
                <span>Attachment Notes</span>
                <input
                  type="text"
                  value={form.attachmentNotes}
                  onChange={(event) =>
                    updateField("attachmentNotes", event.target.value)
                  }
                />
              </label>
              {fieldError && (
                <p className="actions-field-error" role="alert">
                  {fieldError}
                </p>
              )}
              <div className="actions-modal-footer">
                <button
                  type="button"
                  className="actions-secondary"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="actions-primary"
                  disabled={
                    submitting || resultsLoading || results.length === 0
                  }
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
