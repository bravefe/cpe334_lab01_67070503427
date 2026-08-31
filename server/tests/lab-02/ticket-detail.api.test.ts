import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/tickets/:ticketNumber", () => {
  it("returns the current requester's owned ticket detail", async () => {
    const response = await request(app)
      .get("/api/tickets/TKT-2026-000001")
      .set("X-Dev-Requester-Id", "1");

    expect(response.status).toBe(200);
    expect(response.body.data.ticketNumber).toBe("TKT-2026-000001");
    expect(response.body.data.summary).toBe("Test Test 123");
  });
});
