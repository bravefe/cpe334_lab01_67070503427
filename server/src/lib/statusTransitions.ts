// const transitions: Record<string, string[]> = {
//   New: ["Open", "Cancelled"],
//   Open: ["In Progress", "Waiting for Requester", "Cancelled"],
//   "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
//   "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
//   Resolved: ["Closed", "Reopened"],
//   Closed: ["Reopened"],
//   Reopened: ["Open", "In Progress", "Cancelled"],
//   Cancelled: [],
// };

// export function isLegalStatusTransition(from: string, to: string): boolean {
//   return (transitions[from] ?? []).includes(to);
// }

// lib/statusTransition.ts
export type Role = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

const HUMAN_ROLE_MAP = {
  REQUESTER: "REQUESTER",
  IT_STAFF: "IT_STAFF",
  ADMINISTRATOR: "ADMINISTRATOR",
} as const;

const STAFF: Role[] = ["IT_STAFF", "ADMINISTRATOR"];
const ADMIN: Role[] = ["ADMINISTRATOR"];

function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") return null;

  const trimmed = role.trim();
  if (trimmed in HUMAN_ROLE_MAP) {
    return HUMAN_ROLE_MAP[trimmed as keyof typeof HUMAN_ROLE_MAP];
  }

  const direct: Record<string, Role> = {
    Requester: "REQUESTER",
    "IT Staff": "IT_STAFF",
    Administrator: "ADMINISTRATOR",
  };

  return direct[trimmed] ?? null;
}

export const transitionMatrix: Record<string, Record<string, Role[]>> = {
  New: { Open: STAFF, Cancelled: STAFF },
  Open: {
    "In Progress": STAFF,
    "Waiting for Requester": STAFF,
    Cancelled: STAFF,
  },
  "In Progress": {
    "Waiting for Requester": STAFF,
    Resolved: STAFF,
    Cancelled: STAFF,
  },
  "Waiting for Requester": {
    "In Progress": STAFF,
    Resolved: STAFF,
    Cancelled: STAFF,
  },
  Resolved: { Closed: STAFF, Reopened: STAFF },
  Closed: { Reopened: ADMIN },
  Cancelled: { Reopened: ADMIN },
  Reopened: { Open: STAFF, "In Progress": STAFF, Cancelled: STAFF },
};

// Kept so existing callers/tests don't break. This is UNIT-04.
export function isLegalStatusTransition(from: string, to: string): boolean {
  return Object.prototype.hasOwnProperty.call(transitionMatrix[from] ?? {}, to);
}

export function canRoleTransition(
  from: string,
  to: string,
  role: string,
): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  return (transitionMatrix[from]?.[to] ?? []).some(
    (allowedRole) => normalizeRole(allowedRole) === normalizedRole,
  );
}

export function allowedNextStatuses(from: string, role: string): string[] {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return [];

  return Object.entries(transitionMatrix[from] ?? {})
    .filter(([, roles]) =>
      roles.some(
        (allowedRole) => normalizeRole(allowedRole) === normalizedRole,
      ),
    )
    .map(([to]) => to);
}

// UNIT-05
export function isResolvedGateMet(
  actions: { result: { name: string } | null }[],
): boolean {
  return actions.some((a) => a.result?.name === "Resolved");
}
