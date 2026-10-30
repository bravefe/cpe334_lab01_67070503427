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
    expect(response.body.data.allowedNextStatuses).toEqual(
      expect.any(Array),
    );
  });

  it("returns transitions allowed for the current requester and ticket status", async () => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "frodo.b@shiremail.example.com" },
    });
    const [category, relatedSystem, priority, newStatus] = await Promise.all([
      prisma.category.findFirstOrThrow({ where: { isActive: true } }),
      prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
      prisma.priority.findFirstOrThrow(),
      prisma.status.findUniqueOrThrow({ where: { name: "New" } }),
    ]);
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-DETAIL-TRANSITIONS-${Date.now()}`,
        summary: "Requester status transition permissions",
        description: "Temporary ticket for transition permission testing.",
        requesterId: owner.id,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        requestedPriorityId: priority.id,
        currentStatusId: newStatus.id,
      },
    });

    try {
      const response = await requester.get(
        `/api/tickets/${ticket.ticketNumber}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data.allowedNextStatuses).toEqual(["Cancelled"]);
    } finally {
      await prisma.ticket.delete({ where: { id: ticket.id } });
    }
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
