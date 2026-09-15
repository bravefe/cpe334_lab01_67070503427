import { describe, it, expect } from "vitest";
import { areEmailsEqual, isValidEmail } from "../../../src/lib/email.js";

describe("Email Unit Tests", () => {
  describe("UNIT-07: Email equality comparator (BR-11)", () => {
    it("should consider emails equal regardless of casing", () => {
      expect(areEmailsEqual("A@x.com", "a@x.com")).toBe(true);
      expect(areEmailsEqual("User.Name@Domain.COM", "user.name@domain.com")).toBe(true);
      expect(areEmailsEqual("TEST@SUB.EXAMPLE.ORG", "test@sub.example.org")).toBe(true);
      expect(areEmailsEqual("MixedCase@example.com", "mIXEDcASE@EXAMPLE.COM")).toBe(true);
    });

    it("should handle surrounding whitespace during comparison", () => {
      expect(areEmailsEqual(" a@x.com ", "a@x.com")).toBe(true);
      expect(areEmailsEqual("a@x.com", "  A@X.COM\t")).toBe(true);
    });

    it("should return false for distinct email addresses", () => {
      expect(areEmailsEqual("a@x.com", "b@x.com")).toBe(false);
      expect(areEmailsEqual("user1@example.com", "user2@example.com")).toBe(false);
      expect(areEmailsEqual("user@domain.com", "user@otherdomain.com")).toBe(false);
    });

    it("should return false for empty or non-string inputs", () => {
      expect(areEmailsEqual("", "")).toBe(false);
      expect(areEmailsEqual("a@x.com", "")).toBe(false);
      expect(areEmailsEqual(null, "a@x.com")).toBe(false);
      expect(areEmailsEqual(undefined, undefined)).toBe(false);
    });
  });

  describe("UNIT-08: Email format validator (BR-11)", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "first.last@example.com",
        "user+tag@domain.co.th",
        "a@x.com",
        "admin@subdomain.example.org",
        "user_name-123@domain.io",
      ];

      for (const email of validEmails) {
        expect(isValidEmail(email), `Expected ${email} to be valid`).toBe(true);
      }
    });

    it("should reject malformed email formats", () => {
      const invalidEmails = [
        "",
        "   ",
        "plainaddress",
        "@missinglocal.com",
        "missingdomain@",
        "missingatsign.com",
        "user@.com",
        "user@domain..com",
        "user@domain",
        "user name@domain.com",
        "user@domain space.com",
        "user@@domain.com",
        null,
        undefined,
        12345,
      ];

      for (const email of invalidEmails) {
        expect(isValidEmail(email), `Expected ${JSON.stringify(email)} to be invalid`).toBe(false);
      }
    });
  });
});

