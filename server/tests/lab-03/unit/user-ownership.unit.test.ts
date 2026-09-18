import { describe, expect, it } from "vitest";
import {
  isTicketOwnerEligible,
  wouldRemoveLastActiveAdministrator,
} from "../../../src/lib/userOwnership.js";

describe("ticket ownership helpers", () => {
  it("UNIT-11: only active IT staff or administrators can own a ticket", () => {
    expect(isTicketOwnerEligible({ role: "IT_STAFF", isActive: true })).toBe(
      true,
    );
    expect(
      isTicketOwnerEligible({ role: "ADMINISTRATOR", isActive: true }),
    ).toBe(true);
    expect(isTicketOwnerEligible({ role: "REQUESTER", isActive: true })).toBe(
      false,
    );
    expect(isTicketOwnerEligible({ role: "IT_STAFF", isActive: false })).toBe(
      false,
    );
    expect(
      isTicketOwnerEligible({ role: "ADMINISTRATOR", isActive: false }),
    ).toBe(false);
  });

  it("UNIT-12: blocks only changes that remove the last active administrator", () => {
    const onlyAdmin = [{ id: 1, role: "ADMINISTRATOR", isActive: true }];
    expect(wouldRemoveLastActiveAdministrator(onlyAdmin, 1, { isActive: false })).toBe(true);
    expect(wouldRemoveLastActiveAdministrator(onlyAdmin, 1, { role: "REQUESTER" })).toBe(true);
    expect(wouldRemoveLastActiveAdministrator(onlyAdmin, 1, {})).toBe(false);
    expect(wouldRemoveLastActiveAdministrator([...onlyAdmin, { id: 2, role: "ADMINISTRATOR", isActive: true }], 1, { isActive: false })).toBe(false);
  });
});
