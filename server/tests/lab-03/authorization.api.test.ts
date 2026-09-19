import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const csrf = { "X-Requested-With": "TokTickIT" };
const password = "Password123!";

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

describe("Lab 3 authorization API", () => {
  let requester: Agent;
  let otherRequester: Agent;
  let staff: Agent;
  let admin: Agent;
  let ownedTicketNumber = "";
  let otherTicketNumber = "";

  beforeAll(async () => {
    requester = await authenticated("frodo.b@shiremail.example.com");
    otherRequester = await authenticated("sam.gamgee@shiremail.example.com");
    staff = await authenticated("arwen@rivendell.example.com");
    admin = await authenticated("elrond@rivendell.example.com");
    const tickets = await prisma.ticket.findMany({
      orderBy: { id: "asc" },
      take: 2,
    });
    ownedTicketNumber =
      tickets.find((ticket) => ticket.requesterId === 1)?.ticketNumber ??
      tickets[0].ticketNumber;
    otherTicketNumber =
      tickets.find((ticket) => ticket.requesterId !== 1)?.ticketNumber ??
      tickets[1].ticketNumber;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("SEC-01: ignores a spoofed requesterId query parameter", async () => {
    const response = await requester
      .get("/api/tickets")
      .query({ requesterId: 2 });
    expect(response.status).toBe(200);
    expect(
      (response.body.data ?? []).every(
        (ticket: { requesterId: number }) => ticket.requesterId === 1,
      ),
    ).toBe(true);
  });

  it("SEC-02: forbids requester access to staff notes", async () => {
    const response = await requester
      .post(`/api/staff/tickets/1/notes`)
      .set(csrf)
      .send({ content: "private note" });
    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).not.toContain("private note");
  });

  it.each(["/api/tickets", "/api/staff/tickets", "/api/admin/users"])(
    "SEC-03: protects %s without a session",
    async (path) => {
      const response = await request(app).get(path);
      expect(response.status).toBe(401);
      expect(response.body.error).toEqual(
        expect.objectContaining({ code: "UNAUTHENTICATED" }),
      );
    },
  );

  it("SEC-04: enforces staff and administrator role boundaries", async () => {
    expect((await requester.get("/api/staff/tickets")).status).toBe(403);
    expect((await staff.get("/api/admin/users")).status).toBe(403);
  });

  it("SEC-05: does not expose another requester's ticket", async () => {
    const response = await requester.get(`/api/tickets/${otherTicketNumber}`);
    expect([403, 404]).toContain(response.status);
    expect(JSON.stringify(response.body)).not.toContain(otherTicketNumber);
  });

  it("SEC-06: omits internal notes from requester ticket detail", async () => {
    const response = await requester.get(`/api/tickets/${ownedTicketNumber}`);
    expect(response.status).toBe(200);
    expect(response.body.data ?? response.body).not.toHaveProperty(
      "internalNotes",
    );
  });

  it("SEC-07: denies requester and staff access to every admin endpoint", async () => {
    for (const agent of [requester, staff]) {
      expect((await agent.get("/api/admin/users")).status).toBe(403);
      expect(
        (await agent.post("/api/admin/users").set(csrf).send({})).status,
      ).toBe(403);
    }
  });

  it("SEC-08: ignores the legacy requester header without a session", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("X-Dev-Requester-Id", "1");
    expect(response.status).toBe(401);
  });

  it("SEC-09: derives ticket ownership from the authenticated session", async () => {
    const response = await requester.post("/api/tickets").set(csrf).send({
      requesterId: 2,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Session ownership test",
      description:
        "The server must derive ownership from the authenticated session.",
      requestedPriorityId: 1,
    });
    expect(response.status).toBe(201);
    const ticketNumber = response.body.data.ticketNumber;
    const created = await prisma.ticket.findUniqueOrThrow({
      where: { ticketNumber },
    });
    expect(created.requesterId).toBe(1);
    await prisma.ticket.delete({ where: { ticketNumber } });
  });
});
