import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const csrf = { "X-Requested-With": "TokTickIT" };

async function login(email: string, password = "Password123!") {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

describe("Lab 3 comments and notes API", () => {
  let requester: Agent;
  let staff: Agent;
  let ticketNumber: string;

  beforeAll(async () => {
    requester = await login("frodo.b@shiremail.example.com");
    staff = await login("arwen@rivendell.example.com");
    const ticket = await prisma.ticket.findFirst({
      where: { requesterId: 1 },
      orderBy: { id: "asc" },
    });
    ticketNumber = ticket?.ticketNumber ?? "TKT-2026-000001";
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("API-08: rejects a requester attempting to create an internal note", async () => {
    const response = await requester
      .post(`/api/staff/tickets/${ticketNumber}/notes`)
      .set(csrf)
      .send({ content: "private note" });

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.body)).not.toContain("private note");
  });

  it("API-27: requester can post a public comment on their own ticket", async () => {
    const response = await requester
      .post(`/api/tickets/${ticketNumber}/comments`)
      .set(csrf)
      .send({ content: "The issue is still happening." });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        content: "The issue is still happening.",
      }),
    );
  });

  it("API-28: rejects empty or whitespace-only comment content", async () => {
    const emptyResponse = await requester
      .post(`/api/tickets/${ticketNumber}/comments`)
      .set(csrf)
      .send({ content: "   " });
    expect(emptyResponse.status).toBe(400);

    const noContent = await requester
      .post(`/api/tickets/${ticketNumber}/comments`)
      .set(csrf)
      .send({});
    expect(noContent.status).toBe(400);
  });

  it("API-29: rejects comment content longer than 2000 characters", async () => {
    const response = await requester
      .post(`/api/tickets/${ticketNumber}/comments`)
      .set(csrf)
      .send({ content: "A".repeat(2001) });

    expect(response.status).toBe(400);
  });

  it("API-30: allows a requester to mark a problem as appearing resolved while the ticket is open", async () => {
    const openStatus = await prisma.status.findFirst({
      where: { name: "Open" },
    });
    if (openStatus) {
      await prisma.ticket.update({
        where: { ticketNumber },
        data: { currentStatusId: openStatus.id },
      });
    }

    const response = await requester
      .patch(`/api/tickets/${ticketNumber}/resolution`)
      .set(csrf)
      .send({ problemAppearsResolved: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ problemAppearsResolved: true }),
    );
  });

  it("API-31: rejects marking appears-resolved when the ticket is already resolved or closed", async () => {
    const ticket = await prisma.ticket.findFirst({
      where: { requesterId: 1 },
      orderBy: { id: "asc" },
    });
    await prisma.ticket.update({
      where: { id: ticket!.id },
      data: {
        currentStatusId: (await prisma.status.findFirst({
          where: { name: "Resolved" },
        }))!.id,
      },
    });

    const response = await requester
      .patch(`/api/tickets/${ticketNumber}/resolution`)
      .set(csrf)
      .send({ problemAppearsResolved: true });

    expect(response.status).toBe(409);
  });

  it("API-32: staff can post internal notes and requesters cannot see them", async () => {
    const noteResponse = await staff
      .post(`/api/staff/tickets/${ticketNumber}/notes`)
      .set(csrf)
      .send({ content: "Requested logs from the requester." });

    expect(noteResponse.status).toBe(201);

    const staffView = await staff.get(`/api/staff/tickets/${ticketNumber}`);
    expect(staffView.status).toBe(200);

    const requesterView = await requester.get(`/api/tickets/${ticketNumber}`);
    expect(requesterView.status).toBe(200);
    expect(JSON.stringify(requesterView.body)).not.toContain(
      "Requested logs from the requester.",
    );
  });

  it("API-33: requester cannot access the staff notes route directly", async () => {
    const response = await requester.get(
      `/api/staff/tickets/${ticketNumber}/notes`,
    );
    expect(response.status).toBe(403);
  });

  it("API-34: spoofed authorId and createdAt are ignored on note creation", async () => {
    const response = await staff
      .post(`/api/staff/tickets/${ticketNumber}/notes`)
      .set(csrf)
      .send({
        content: "Server owns the author and timestamp.",
        authorId: 999,
        createdAt: "2020-01-01T00:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body.authorId).not.toBe(999);
    expect(response.body.createdAt).not.toBe("2020-01-01T00:00:00.000Z");
  });
});
