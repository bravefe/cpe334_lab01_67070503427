import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// void request; void app;
// describe.todo("GET /api/categories", () => {
//   it.todo("returns the four seeded categories in id order", async () => {
//     // TODO(Issue 4): implement this assertion.
//     expect(true).toBe(true);
//   });
// });

// Issue 4 — write this test yourself, using health.test.ts as the pattern.
// Requires the DB to be migrated and seeded first.
// It should assert: GET /api/categories returns 200 and the four seeded
// category names in id order.

describe("GET /api/categories", () => {
  it("returns 200 and the seeded categories in id order", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ]);
  });
});