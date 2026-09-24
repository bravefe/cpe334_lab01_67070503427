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

describe("Lab 4 Actions Taken API", () => {
  let requester: Agent;
  let staff: Agent;
  let staffUser: { id: number; name: string; email: string };
  let testTicket: { id: number; ticketNumber: string; createdAt: Date };
  let closedTicket: { id: number; ticketNumber: string };
  let activeResult: { id: number; name: string };

  beforeAll(async () => {
    requester = await authenticated("frodo.b@shiremail.example.com");
    staff = await authenticated("arwen@rivendell.example.com");

    const foundStaff = await prisma.user.findUnique({
      where: { email: "arwen@rivendell.example.com" },
    });
    if (!foundStaff) throw new Error("Staff user not found");
    staffUser = {
      id: foundStaff.id,
      name: foundStaff.name,
      email: foundStaff.email,
    };

    const foundResult = await prisma.actionResult.findFirst({
      where: { isActive: true },
    });
    if (!foundResult) throw new Error("No active action result found");
    activeResult = { id: foundResult.id, name: foundResult.name };

    // Find or create an open/in-progress ticket for testing
    let ticket = await prisma.ticket.findFirst({
      where: {
        currentStatus: {
          name: { notIn: ["Closed", "Cancelled"] },
        },
      },
      include: { currentStatus: true },
      orderBy: { id: "asc" },
    });

    if (!ticket) {
      const openStatus = await prisma.status.findFirst({
        where: { name: "Open" },
      });
      const category = await prisma.category.findFirst();
      const system = await prisma.relatedSystem.findFirst();
      const priority = await prisma.priority.findFirst();
      const reqUser = await prisma.user.findFirst({
        where: { role: "REQUESTER" },
      });

      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-TEST-000001",
          summary: "Test Ticket for Actions Taken",
          description: "This is a detailed description for testing actions taken API.",
          categoryId: category!.id,
          relatedSystemId: system!.id,
          requestedPriorityId: priority!.id,
          currentStatusId: openStatus!.id,
          requesterId: reqUser!.id,
        },
        include: { currentStatus: true },
      });
    }
    testTicket = {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      createdAt: ticket.createdAt,
    };

    // Find or setup a Closed ticket for API-02
    let closedStatus = await prisma.status.findFirst({
      where: { name: "Closed" },
    });
    if (!closedStatus) {
      closedStatus = await prisma.status.create({
        data: { name: "Closed", isDefault: false },
      });
    }

    let closed = await prisma.ticket.findFirst({
      where: { currentStatusId: closedStatus.id },
    });

    if (!closed) {
      const category = await prisma.category.findFirst();
      const system = await prisma.relatedSystem.findFirst();
      const priority = await prisma.priority.findFirst();
      const reqUser = await prisma.user.findFirst({
        where: { role: "REQUESTER" },
      });

      closed = await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-TEST-CLOSED-01",
          summary: "Closed Test Ticket",
          description: "This is a closed ticket created for testing action rejection.",
          categoryId: category!.id,
          relatedSystemId: system!.id,
          requestedPriorityId: priority!.id,
          currentStatusId: closedStatus.id,
          requesterId: reqUser!.id,
        },
      });
    }
    closedTicket = {
      id: closed.id,
      ticketNumber: closed.ticketNumber,
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("API-01: performedById sent by client on create is ignored; server sets it from session", async () => {
    const spoofedUserId = 99999;
    const actionPayload = {
      performedById: spoofedUserId,
      performedByUserId: spoofedUserId,
      actionAt: new Date().toISOString(),
      description: "Diagnostic check completed with spoofed performedById attempt",
      resultId: activeResult.id,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "none",
    };

    const response = await staff
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send(actionPayload);

    expect(response.status).toBe(201);

    const record = response.body.data ?? response.body;
    expect(record.performedBy).toBeDefined();
    expect(record.performedBy.id).toBe(staffUser.id);
    expect(record.performedBy.id).not.toBe(spoofedUserId);

    // Verify in database as well
    const inDb = await prisma.actionTaken.findUnique({
      where: { id: record.id },
    });
    expect(inDb).not.toBeNull();
    expect(inDb?.performedByUserId).toBe(staffUser.id);
  });

  it("API-02: rejects creating Action Taken on a Closed Ticket with 409 Conflict", async () => {
    const actionPayload = {
      actionAt: new Date().toISOString(),
      description: "Attempting action on a closed ticket",
      resultId: activeResult.id,
      followUpRequired: false,
      followUpNote: null,
    };

    const response = await staff
      .post(`/api/tickets/${closedTicket.id}/actions`)
      .set(csrf)
      .send(actionPayload);

    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe("INVALID_STATUS");
    expect(response.body.error.message).toMatch(/Closed or Cancelled/i);
  });

  it("API-03: creates a valid Action Taken under the correct Ticket and actor", async () => {
    const actionPayload = {
      actionAt: new Date().toISOString(),
      description: "Replaced hardware component and verified system operation",
      resultId: activeResult.id,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "diagnostic_screenshot.png",
    };

    const response = await staff
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send(actionPayload);

    expect(response.status).toBe(201);

    const created = response.body.data ?? response.body;
    expect(created.id).toBeTypeOf("number");
    expect(created.ticketId).toBe(testTicket.id);
    expect(created.description).toBe(actionPayload.description);
    expect(created.resultId).toBe(activeResult.id);
    expect(created.followUpRequired).toBe(false);
    expect(created.attachmentNotes).toBe("diagnostic_screenshot.png");
    expect(created.performedBy).toEqual(
      expect.objectContaining({
        id: staffUser.id,
        name: staffUser.name,
      }),
    );
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeDefined();
  });

  it("API-04: rejects create with followUpRequired=true and empty note with 422 and field: 'followUpNote'", async () => {
    const actionPayload = {
      actionAt: new Date().toISOString(),
      description: "Follow-up required test description",
      resultId: activeResult.id,
      followUpRequired: true,
      followUpNote: "   ", // whitespace only
    };

    const response = await staff
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send(actionPayload);

    expect(response.status).toBe(422);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.field).toBe("followUpNote");
  });

  it("API-05: rejects edit with stale updatedAt with 409 Conflict, returning current record without overwriting data", async () => {
    // First, create an action to edit
    const createRes = await staff
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send({
        actionAt: new Date().toISOString(),
        description: "Original action description before concurrent edit",
        resultId: activeResult.id,
        followUpRequired: false,
        followUpNote: null,
      });

    expect(createRes.status).toBe(201);
    const createdAction = createRes.body.data ?? createRes.body;
    const actionId = createdAction.id;
    const initialUpdatedAt = createdAction.updatedAt;

    // Simulate another update that advances updatedAt
    const intermediateRes = await staff
      .patch(`/api/tickets/${testTicket.id}/actions/${actionId}`)
      .set(csrf)
      .send({
        description: "Intermediate valid update",
        updatedAt: initialUpdatedAt,
      });

    expect(intermediateRes.status).toBe(200);
    const updatedAction = intermediateRes.body.data ?? intermediateRes.body;
    expect(updatedAction.description).toBe("Intermediate valid update");

    // Now try to update using the stale initialUpdatedAt
    const staleUpdateRes = await staff
      .patch(`/api/tickets/${testTicket.id}/actions/${actionId}`)
      .set(csrf)
      .send({
        description: "Overwriting update with stale token",
        updatedAt: initialUpdatedAt, // Stale!
      });

    expect(staleUpdateRes.status).toBe(409);
    expect(staleUpdateRes.body.error).toBeDefined();
    expect(staleUpdateRes.body.error.code).toBe("CONFLICT");

    // Current record must be returned
    expect(staleUpdateRes.body.error.current).toBeDefined();
    expect(staleUpdateRes.body.error.current.description).toBe(
      "Intermediate valid update",
    );

    // Verify database record was NOT overwritten
    const inDb = await prisma.actionTaken.findUnique({
      where: { id: actionId },
    });
    expect(inDb?.description).toBe("Intermediate valid update");
  });

  it("AUTH-01: rejects Requester directly calling POST /api/tickets/:id/actions with 403 Forbidden", async () => {
    const actionPayload = {
      actionAt: new Date().toISOString(),
      description: "Requester unauthorized action creation attempt",
      resultId: activeResult.id,
      followUpRequired: false,
      followUpNote: null,
    };

    const response = await requester
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send(actionPayload);

    expect(response.status).toBe(403);
  });
});
