import { describe, expect, it } from "vitest";
import {
  comparePassword,
  hashPassword,
  validatePassword,
  BCRYPT_COST,
} from "../../../src/lib/password.js";

describe("password helpers", () => {
  it("UNIT-01: hashes and verifies passwords with bcrypt cost 12", async () => {
    const password = "Password123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword("WrongPassword123!", hash)).toBe(false);
    expect(BCRYPT_COST).toBe(12);
  });

  it.each([
    ["Password123!", true],
    ["short1!", false],
    ["password123!", false],
    ["PASSWORD123!", false],
    ["Password!!!!!!", false],
    ["Password123", false],
  ])("UNIT-02: validates password policy for %s", (password, valid) => {
    const result = validatePassword(password);
    if (valid) expect(result).toBeNull();
    else expect(result).toEqual(expect.any(String));
  });
});
