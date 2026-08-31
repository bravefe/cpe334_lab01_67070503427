import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("POST /api/tickets", () => {
  it("creates a ticket for the selected requester", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Email access problem",
        description: "The user cannot access their email account after the latest update.",
        requestedPriorityId: 2,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(response.body.data.requesterId).toBe(1);
  });
});
