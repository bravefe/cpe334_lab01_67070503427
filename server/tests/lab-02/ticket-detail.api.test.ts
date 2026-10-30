import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
let requester: Agent;
let otherRequester: Agent;

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password: "Password123!" });
  expect(response.status).toBe(200);
  return agent;
}

describe("GET /api/tickets/:ticketNumber", () => {
  beforeAll(async () => {
    requester = await authenticated("frodo.b@shiremail.example.com");
    otherRequester = await authenticated("sam.gamgee@shiremail.example.com");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns the authenticated requester's ticket detail", async () => {
    const response = await requester.get("/api/tickets/TKT-2026-000001");

    expect(response.status).toBe(200);
    expect(response.body.data.ticketNumber).toBe("TKT-2026-000001");
    expect(response.body.data.summary).toBe("Test Test 123");
  });

  it("forbids another requester from accessing the ticket", async () => {
    const response = await otherRequester.get(
      "/api/tickets/TKT-2026-000001",
    );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to access this ticket.",
      },
    });
    expect(response.body.data).toBeUndefined();
  });
});
