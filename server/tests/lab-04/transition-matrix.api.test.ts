import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canRoleTransition,
  isLegalStatusTransition,
  isResolvedGateMet,
  transitionMatrix,
} from "../../src/lib/statusTransitions.js";

const ALL_STATUSES = Object.keys(transitionMatrix);

describe("UNIT-04 | BR-09 | status-transition matrix lookup", () => {
  it("returns true for every pair documented in the matrix", () => {
    for (const [from, targets] of Object.entries(transitionMatrix)) {
      for (const to of Object.keys(targets)) {
        expect(isLegalStatusTransition(from, to), `${from} -> ${to}`).toBe(
          true,
        );
      }
    }
  });

  it("returns false for every pair NOT in the matrix", () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const documented = Object.prototype.hasOwnProperty.call(
          transitionMatrix[from],
          to,
        );
        if (!documented) {
          expect(isLegalStatusTransition(from, to), `${from} -> ${to}`).toBe(
            false,
          );
        }
      }
    }
  });

  it.each([
    ["New", "Resolved"],
    ["New", "Closed"],
    ["Open", "Resolved"],
    ["Closed", "Open"],
    ["Cancelled", "Open"],
    ["Resolved", "Open"],
  ])("rejects %s -> %s", (from, to) => {
    expect(isLegalStatusTransition(from, to)).toBe(false);
  });

  it("rejects self-transitions", () => {
    for (const s of ALL_STATUSES) {
      expect(isLegalStatusTransition(s, s), s).toBe(false);
    }
  });

  it("rejects unknown statuses and inherited object keys", () => {
    expect(isLegalStatusTransition("Nope", "Open")).toBe(false);
    expect(isLegalStatusTransition("New", "Nope")).toBe(false);
    expect(isLegalStatusTransition("", "")).toBe(false);
    expect(isLegalStatusTransition("New", "toString")).toBe(false);
    expect(isLegalStatusTransition("constructor", "Open")).toBe(false);
  });

  it("only allows Reopened out of Cancelled/Closed, and only for Administrator", () => {
    for (const from of ["Cancelled", "Closed"]) {
      expect(Object.keys(transitionMatrix[from])).toEqual(["Reopened"]);
      expect(canRoleTransition(from, "Reopened", "Administrator")).toBe(true);
      expect(canRoleTransition(from, "Reopened", "IT Staff")).toBe(false);
      expect(canRoleTransition(from, "Reopened", "Requester")).toBe(false);
    }
  });

  it("never lets a Requester perform any transition", () => {
    for (const from of ALL_STATUSES) {
      expect(allowedNextStatuses(from, "Requester"), from).toEqual([]);
    }
  });

  it("allowedNextStatuses hides admin-only edges from IT Staff", () => {
    expect(allowedNextStatuses("Closed", "IT Staff")).toEqual([]);
    expect(allowedNextStatuses("Closed", "Administrator")).toEqual([
      "Reopened",
    ]);
  });
});

describe("UNIT-05 | BR-07 | Resolved-gate check", () => {
  it("returns false when there are no Actions Taken", () => {
    expect(isResolvedGateMet([])).toBe(false);
  });

  it("returns false when no Action Taken has the Resolved result", () => {
    expect(
      isResolvedGateMet([
        { result: { name: "Needs Follow-up" } },
        { result: { name: "Escalated" } },
        { result: null },
      ]),
    ).toBe(false);
  });

  it("returns true once a Resolved-result Action Taken exists", () => {
    expect(
      isResolvedGateMet([
        { result: { name: "Needs Follow-up" } },
        { result: { name: "Resolved" } },
      ]),
    ).toBe(true);
  });

  it("is case-sensitive on the result name", () => {
    expect(isResolvedGateMet([{ result: { name: "resolved" } }])).toBe(false);
  });
});
