import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canRoleTransition,
  type Role,
} from "../../../src/lib/statusTransitions.js";

const expectedTransitions: Record<string, Record<string, Role[]>> = {
  New: {
    Open: ["IT_STAFF", "ADMINISTRATOR"],
    Cancelled: ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"],
  },
  Open: {
    "In Progress": ["IT_STAFF", "ADMINISTRATOR"],
    "Waiting for Requester": ["IT_STAFF", "ADMINISTRATOR"],
    Cancelled: ["IT_STAFF", "ADMINISTRATOR"],
  },
  "In Progress": {
    "Waiting for Requester": ["IT_STAFF", "ADMINISTRATOR"],
    Resolved: ["IT_STAFF", "ADMINISTRATOR"],
    Cancelled: ["IT_STAFF", "ADMINISTRATOR"],
  },
  "Waiting for Requester": {
    "In Progress": ["IT_STAFF", "ADMINISTRATOR"],
    Cancelled: ["IT_STAFF", "ADMINISTRATOR"],
  },
  Resolved: {
    Closed: ["IT_STAFF", "ADMINISTRATOR"],
    Reopened: ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"],
  },
  Closed: {
    Reopened: ["ADMINISTRATOR"],
  },
  Cancelled: {
    Reopened: ["ADMINISTRATOR"],
  },
  Reopened: {
    "In Progress": ["IT_STAFF", "ADMINISTRATOR"],
    Cancelled: ["IT_STAFF", "ADMINISTRATOR"],
  },
};

const roles: Role[] = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];
const statuses = Object.keys(expectedTransitions);

describe("role-based status transitions", () => {
  it("allows exactly the transitions assigned to each role", () => {
    for (const from of statuses) {
      for (const to of statuses) {
        const allowedRoles = expectedTransitions[from][to] ?? [];
        for (const role of roles) {
          expect(canRoleTransition(from, to, role), `${role}: ${from} -> ${to}`)
            .toBe(allowedRoles.includes(role));
        }
      }
    }
  });

  it("returns each role's allowed next statuses", () => {
    for (const from of statuses) {
      for (const role of roles) {
        const expected = Object.entries(expectedTransitions[from])
          .filter(([, allowedRoles]) => allowedRoles.includes(role))
          .map(([to]) => to);
        expect(allowedNextStatuses(from, role), `${role} from ${from}`).toEqual(
          expected,
        );
      }
    }
  });

  it("rejects unknown roles and statuses", () => {
    expect(canRoleTransition("New", "Open", "SUPERVISOR")).toBe(false);
    expect(allowedNextStatuses("New", "SUPERVISOR")).toEqual([]);
    expect(canRoleTransition("Unknown", "Open", "ADMINISTRATOR")).toBe(false);
    expect(allowedNextStatuses("Unknown", "ADMINISTRATOR")).toEqual([]);
  });
});
