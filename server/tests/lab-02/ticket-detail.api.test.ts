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
it("API-23: should return 404 when requester B tries to access requester A's ticket", async () => {
    const response = await request(app)
      .get("/api/tickets/TKT-2026-000001")
      .set("X-Dev-Requester-Id", "2");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "ERROR 404: Ticket not found.",
      },
    });

    // Make sure no ticket data is returned.
    expect(response.body.data).toBeUndefined();
  });
});