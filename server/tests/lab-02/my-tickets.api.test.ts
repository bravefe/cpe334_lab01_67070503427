import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const requesterEmail = "frodo.b@shiremail.example.com";
const otherRequesterEmail = "sam.gamgee@shiremail.example.com";
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

describe("GET /api/tickets", () => {
  beforeAll(async () => {
    requester = await authenticated(requesterEmail);
    otherRequester = await authenticated(otherRequesterEmail);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns only tickets owned by the authenticated requester", async () => {
    const response = await requester.get("/api/tickets");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ticketNumber: "TKT-2026-000001" }),
      ]),
    );
    expect(response.body.data).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ticketNumber: "TKT-2026-000002" }),
      ]),
    );
  });

  it("returns only tickets matching the search text", async () => {
    const byNumber = await requester
      .get("/api/tickets")
      .query({ search: "000001" });

    expect(byNumber.status).toBe(200);
    expect(byNumber.body.data).toHaveLength(1);
    expect(byNumber.body.data[0].ticketNumber).toBe("TKT-2026-000001");

    const bySummary = await requester
      .get("/api/tickets")
      .query({ search: "Test Test 123" });

    expect(bySummary.status).toBe(200);
    expect(bySummary.body.data).toHaveLength(1);
    expect(bySummary.body.data[0].ticketNumber).toBe("TKT-2026-000001");
  });

  it("returns only tickets matching all supplied filters", async () => {
    const seededTicket = await prisma.ticket.findUniqueOrThrow({
      where: { ticketNumber: "TKT-2026-000001" },
    });
    const response = await requester.get("/api/tickets").query({
      categoryId: seededTicket.categoryId,
      priorityId: seededTicket.requestedPriorityId,
    });

    expect(response.status).toBe(200);
    expect(
      response.body.data.every(
        (ticket: { categoryId: number; requestedPriorityId: number }) =>
          ticket.categoryId === seededTicket.categoryId &&
          ticket.requestedPriorityId === seededTicket.requestedPriorityId,
      ),
    ).toBe(true);
  });

  it("reverses ticket order when sort direction is toggled", async () => {
    const ascending = await requester
      .get("/api/tickets")
      .query({ sortBy: "createdAt", sortDir: "asc" });
    const descending = await requester
      .get("/api/tickets")
      .query({ sortBy: "createdAt", sortDir: "desc" });

    expect(ascending.status).toBe(200);
    expect(descending.status).toBe(200);
    const ascendingNumbers = ascending.body.data.map(
      (ticket: { ticketNumber: string }) => ticket.ticketNumber,
    );
    const descendingNumbers = descending.body.data.map(
      (ticket: { ticketNumber: string }) => ticket.ticketNumber,
    );
    expect(descendingNumbers).toEqual([...ascendingNumbers].reverse());
  });

  it("returns the next set of tickets on the next page", async () => {
    const page1 = await requester
      .get("/api/tickets")
      .query({ page: "1", pageSize: "2" });
    const page2 = await requester
      .get("/api/tickets")
      .query({ page: "2", pageSize: "2" });

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.totalItems).toBeGreaterThan(2);
    expect(page1.body.data.map((ticket: { id: number }) => ticket.id)).not.toEqual(
      page2.body.data.map((ticket: { id: number }) => ticket.id),
    );
    expect(page1.body.page).toBe(1);
    expect(page2.body.page).toBe(2);
    expect(page1.body.pageSize).toBe(2);
    expect(page2.body.pageSize).toBe(2);
    expect(page1.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("falls back to default pagination for invalid values", async () => {
    const response = await otherRequester
      .get("/api/tickets")
      .query({ page: "-1", pageSize: "abc" });

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);
  });
});
