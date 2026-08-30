import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

// API 22 
describe("GET /api/dev-requesters", () => {
  it("AC-25: should exclude inactive requester from the response", async () => {
    const prisma = getPrisma();

    // Make sure requester ID 11 is inactive
    await prisma.devRequester.update({
      where: { id: 11 },
      data: { isActive: false },
    });

    const response = await request(app)
      .get("/api/dev-requesters")
      .expect(200);

    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 11,
        }),
      ]),
    );
  });
});