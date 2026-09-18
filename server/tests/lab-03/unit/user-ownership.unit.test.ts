import { describe, expect, it } from "vitest";
import { isTicketOwnerEligible } from "../../../src/lib/userOwnership.js";

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
});
