import { describe, expect, it } from "vitest";
import {
  createCommentOrNote,
  validateContent,
} from "../../../src/lib/content.js";

describe("content helpers", () => {
  it("UNIT-09: trims content, rejects empty-after-trim values, and enforces the 2000-character cap", () => {
    expect(validateContent("  hello world  ")).toBe("hello world");
    expect(validateContent("   ")).toBeNull();
    expect(validateContent("")).toBeNull();
    expect(validateContent("a".repeat(2000))).toBe("a".repeat(2000));
    expect(validateContent("a".repeat(2001))).toBeNull();
  });

  it("UNIT-10: ignores spoofed authorId/createdAt values and keeps the server identity/timestamp", () => {
    const serverNow = 1700000000000;
    const item = createCommentOrNote(
      {
        content: "  client data should be ignored  ",
        authorId: 999,
        createdAt: "2020-01-01T00:00:00.000Z",
      },
      {
        authorId: 42,
        now: serverNow,
      },
    );

    expect(item).toEqual(
      expect.objectContaining({
        content: "client data should be ignored",
        authorId: 42,
        createdAt: serverNow,
      }),
    );
    expect(item.authorId).not.toBe(999);
    expect(item.createdAt).not.toBe("2020-01-01T00:00:00.000Z");
  });
});
