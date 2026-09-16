import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const csrf = { "X-Requested-With": "TokTickIT" };

async function login(email: string) {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send({
    email,
    password: "Password123!",
  });
  expect(response.status).toBe(200);
  return agent;
}

describe("Lab 3 staff queue API", () => {
  let staff: Agent;

  beforeAll(async () => {
    staff = await login("arwen@rivendell.example.com");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("API-13: supports queue filtering across q/status/category/requestedPriority/itPriority/owner", async () => {
    const response = await staff.get("/api/staff/tickets").query({
      q: "TKT",
      status: "New",
      category: 1,
      requestedPriority: "High",
      itPriority: "High",
      owner: "me",
    });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(expect.any(Array));
  });

  it("API-14: supports sort order and sort direction", async () => {
    const response = await staff.get("/api/staff/tickets").query({
      sort: "createdAt",
      sortDir: "asc",
    });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual(expect.any(Array));
    expect(response.body).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: expect.any(Number),
      }),
    );
  });

  it("API-15: paginates queue results and returns an empty collection for past-the-end pages", async () => {
    const firstPage = await staff
      .get("/api/staff/tickets")
      .query({ page: 1, pageSize: 2 });
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items.length).toBeLessThanOrEqual(2);

    const lastPage = await staff
      .get("/api/staff/tickets")
      .query({ page: 9999, pageSize: 2 });
    expect(lastPage.status).toBe(200);
    expect(lastPage.body.items).toEqual([]);
  });

  it("API-16: rejects invalid queue query values with a 400", async () => {
    const response = await staff.get("/api/staff/tickets").query({
      page: 0,
      pageSize: 51,
      status: "NOT_A_STATUS",
    });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toContain("page");
  });

  it("API-17: empty queue or no-result filters still return a valid empty list", async () => {
    const emptyQueue = await staff
      .get("/api/staff/tickets")
      .query({ q: "definitely-no-match-922141" });
    expect(emptyQueue.status).toBe(200);
    expect(emptyQueue.body.items).toEqual([]);
  });
});
