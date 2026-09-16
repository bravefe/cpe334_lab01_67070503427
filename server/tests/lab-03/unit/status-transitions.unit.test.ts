import { describe, expect, it } from "vitest";
import { isLegalStatusTransition } from "../../../src/lib/statusTransitions.js";

const legalPairs = [
  ["New", "Open"],
  ["New", "Cancelled"],
  ["Open", "In Progress"],
  ["Open", "Waiting for Requester"],
  ["Open", "Cancelled"],
  ["In Progress", "Waiting for Requester"],
  ["In Progress", "Resolved"],
  ["In Progress", "Cancelled"],
  ["Waiting for Requester", "In Progress"],
  ["Waiting for Requester", "Resolved"],
  ["Waiting for Requester", "Cancelled"],
  ["Resolved", "Closed"],
  ["Resolved", "Reopened"],
  ["Closed", "Reopened"],
  ["Reopened", "Open"],
  ["Reopened", "In Progress"],
  ["Reopened", "Cancelled"],
] as const;

describe("status transition helpers", () => {
  it("UNIT-05: recognizes every legal transition in the status matrix", () => {
    for (const [from, to] of legalPairs) {
      expect(isLegalStatusTransition(from, to)).toBe(true);
    }

    const illegalPairs = [
      ["New", "In Progress"],
      ["New", "Resolved"],
      ["Open", "Resolved"],
      ["Open", "Closed"],
      ["In Progress", "Open"],
      ["Waiting for Requester", "Open"],
      ["Resolved", "Open"],
      ["Closed", "Open"],
      ["Reopened", "Resolved"],
      ["Cancelled", "Open"],
    ] as const;

    for (const [from, to] of illegalPairs) {
      expect(isLegalStatusTransition(from, to)).toBe(false);
    }
  });

  it("UNIT-06: no statuses are legal after Cancelled", () => {
    const allStatuses = [
      "New",
      "Open",
      "In Progress",
      "Waiting for Requester",
      "Resolved",
      "Closed",
      "Reopened",
      "Cancelled",
    ] as const;

    for (const next of allStatuses) {
      expect(isLegalStatusTransition("Cancelled", next)).toBe(false);
    }
  });
});
