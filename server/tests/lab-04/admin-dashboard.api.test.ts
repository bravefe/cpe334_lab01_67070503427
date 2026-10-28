import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const password = "Password123!";

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

describe("Lab 4 Admin Dashboard API", () => {
  let staff: Agent;

  beforeAll(async () => {
    staff = await authenticated("arwen@rivendell.example.com"); // active IT Staff
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("IT Staff calling GET /api/admin/dashboard is rejected with 403 Forbidden and receives no dashboard data", async () => {
    const response = await staff.get("/api/admin/dashboard");

    expect(response.status).toBe(403);

    // No dashboard payload may leak through the rejection.
    const body = response.body.data ?? response.body;
    expect(body.userCounts).toBeUndefined();
    expect(body.unassigned).toBeUndefined();
    expect(body.recentTickets).toBeUndefined();
  });
});
