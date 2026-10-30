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
  let requesterUserId: number;
  let testTicket!: { id: number; ticketNumber: string; createdAt: Date };
  let closedTicket!: { id: number; ticketNumber: string };
  let activeResult: { id: number; name: string };
  const testTicketIds: number[] = [];

  beforeAll(async () => {
    requester = await authenticated("frodo.b@shiremail.example.com");
    staff = await authenticated("arwen@rivendell.example.com");

    const [foundStaff, foundRequester, foundResult, openStatus, closedStatus, category, system, priority] =
      await Promise.all([
        prisma.user.findUnique({
          where: { email: "arwen@rivendell.example.com" },
        }),
        prisma.user.findUnique({
          where: { email: "frodo.b@shiremail.example.com" },
        }),
        prisma.actionResult.findFirst({ where: { isActive: true } }),
        prisma.status.findFirst({ where: { name: "Open" } }),
        prisma.status.findFirst({ where: { name: "Closed" } }),
        prisma.category.findFirst({ where: { isActive: true } }),
        prisma.relatedSystem.findFirst({ where: { isActive: true } }),
        prisma.priority.findFirst(),
      ]);
    if (!foundStaff) throw new Error("Staff user not found");
    if (!foundRequester) throw new Error("Requester user not found");
    if (!foundResult) throw new Error("No active action result found");
    if (!openStatus || !closedStatus || !category || !system || !priority) {
      throw new Error("Ticket reference data is missing");
    }
    staffUser = {
      id: foundStaff.id,
      name: foundStaff.name,
      email: foundStaff.email,
    };
    requesterUserId = foundRequester.id;
    activeResult = { id: foundResult.id, name: foundResult.name };

    const ticketSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACTION-${ticketSuffix}`,
        summary: "Test Ticket for Actions Taken",
        description:
          "This is a detailed description for testing actions taken API.",
        categoryId: category.id,
        relatedSystemId: system.id,
        requestedPriorityId: priority.id,
        currentStatusId: openStatus.id,
        requesterId: requesterUserId,
      },
    });
    testTicket = {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      createdAt: ticket.createdAt,
    };
    testTicketIds.push(ticket.id);

    const closed = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACTION-CLOSED-${ticketSuffix}`,
        summary: "Closed Test Ticket",
        description:
          "This is a closed ticket created for testing action rejection.",
        categoryId: category.id,
        relatedSystemId: system.id,
        requestedPriorityId: priority.id,
        currentStatusId: closedStatus.id,
        requesterId: requesterUserId,
      },
    });
    closedTicket = {
      id: closed.id,
      ticketNumber: closed.ticketNumber,
    };
    testTicketIds.push(closed.id);
  });

  afterAll(async () => {
    if (testTicketIds.length) {
      await prisma.actionTaken.deleteMany({
        where: { ticketId: { in: testTicketIds } },
      });
      await prisma.ticket.deleteMany({
        where: { id: { in: testTicketIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("MIG-01: preserves existing tickets and adds no Action Taken rows", async () => {
    const appliedMigration = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date }>
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20260924080139_lab4'
        AND finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `;
    expect(appliedMigration).toHaveLength(1);

    const legacyTickets = await prisma.ticket.findMany({
      where: {
        ticketNumber: {
          in: Array.from(
            { length: 12 },
            (_, index) => `TKT-2026-${String(index + 1).padStart(6, "0")}`,
          ),
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        summary: true,
        createdAt: true,
      },
      orderBy: { ticketNumber: "asc" },
    });

    expect(legacyTickets).toHaveLength(12);
    expect(legacyTickets.map(({ ticketNumber }) => ticketNumber)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `TKT-2026-${String(index + 1).padStart(6, "0")}`,
      ),
    );
    expect(legacyTickets.map(({ summary }) => summary)).toEqual([
      "Test Test 123",
      "Campus Wi-Fi not working",
      "LEB2 App crashes on assignment upload",
      "Cannot connect to campus VPN from off-campus",
      "Library 2nd floor printer paper jam",
      "Instructor permissions missing for grading portal",
      "Laptop battery drains rapidly while sleeping",
      "Intermittent Wi-Fi disconnects in Science Building",
      "Spam filter test request",
      "Password reset for remote VPN account",
      "External monitor not detected via HDMI",
      "Unable to view course announcements",
    ]);
    expect(
      legacyTickets.every(
        ({ createdAt }) => createdAt.toISOString() === "2026-01-01T00:00:00.000Z",
      ),
    ).toBe(true);

    const actionCountAtMigration = await prisma.actionTaken.count({
      where: {
        ticketId: { in: legacyTickets.map(({ id }) => id) },
        createdAt: { lte: appliedMigration[0].finished_at },
      },
    });
    expect(actionCountAtMigration).toBe(0);
  });

  it("API-01: performedById sent by client on create is ignored; server sets it from session", async () => {
    const spoofedUserId = 99999;
    const actionPayload = {
      performedById: spoofedUserId,
      performedByUserId: spoofedUserId,
      actionAt: new Date().toISOString(),
      description:
        "Diagnostic check completed with spoofed performedById attempt",
      resultId: activeResult.id,
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "none",
    };

    const response = await staff
      .post(`/api/staff/tickets/${testTicket.id}/actions`)
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
      .post(`/api/staff/tickets/${closedTicket.id}/actions`)
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
      .post(`/api/staff/tickets/${testTicket.id}/actions`)
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

  it("uses Prisma's current-time default when actionAt is omitted", async () => {
    const requestStartedAt = Date.now();
    const response = await staff
      .post(`/api/staff/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send({
        description: "Action recorded using the server timestamp default",
        resultId: activeResult.id,
        followUpRequired: false,
        followUpNote: null,
      });

    expect(response.status).toBe(201);
    const created = response.body.data ?? response.body;
    const actionAt = new Date(created.actionAt).getTime();
    expect(actionAt).toBeGreaterThanOrEqual(requestStartedAt - 5000);
    expect(actionAt).toBeLessThanOrEqual(Date.now() + 5000);

    const inDb = await prisma.actionTaken.findUnique({
      where: { id: created.id },
    });
    expect(inDb?.actionAt.toISOString()).toBe(created.actionAt);
  });

  it("API-04: rejects create with followUpRequired=true and empty note with 400 and field: 'followUpNote'", async () => {
    const actionPayload = {
      actionAt: new Date().toISOString(),
      description: "Follow-up required test description",
      resultId: activeResult.id,
      followUpRequired: true,
      followUpNote: "   ", // whitespace only
    };

    const response = await staff
      .post(`/api/staff/tickets/${testTicket.id}/actions`)
      .set(csrf)
      .send(actionPayload);

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.field).toBe("followUpNote");
  });

  it("API-05: rejects edit with stale updatedAt with 409 Conflict, returning current record without overwriting data", async () => {
    // First, create an action to edit
    const createRes = await staff
      .post(`/api/staff/tickets/${testTicket.id}/actions`)
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
      .patch(`/api/staff/tickets/${testTicket.id}/actions/${actionId}`)
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
      .patch(`/api/staff/tickets/${testTicket.id}/actions/${actionId}`)
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

  it("AUTH-05: denies a Requester access to another Requester's Actions Taken", async () => {
    const otherRequester = await prisma.user.findUniqueOrThrow({
      where: { email: "sam.gamgee@shiremail.example.com" },
    });
    const sourceTicket = await prisma.ticket.findUniqueOrThrow({
      where: { id: testTicket.id },
    });
    const ticketNumber = `TKT-AUTH-05-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const foreignTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: otherRequester.id,
        categoryId: sourceTicket.categoryId,
        relatedSystemId: sourceTicket.relatedSystemId,
        summary: "Foreign requester actions access test",
        description: "Dedicated ticket to verify requester action privacy.",
        requestedPriorityId: sourceTicket.requestedPriorityId,
        currentStatusId: sourceTicket.currentStatusId,
      },
    });
    const privateDescription = "PRIVATE ACTION DATA MUST NOT BE RETURNED";
    const foreignAction = await prisma.actionTaken.create({
      data: {
        ticketId: foreignTicket.id,
        description: privateDescription,
        resultId: activeResult.id,
        performedByUserId: staffUser.id,
        followUpRequired: false,
      },
    });

    try {
      const response = await requester.get(
        `/api/tickets/${ticketNumber}/actions`,
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toEqual({
        code: "FORBIDDEN",
        message: "You are not allowed to access this ticket.",
      });
      expect(response.body.data).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(privateDescription);
      expect(response.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: foreignAction.id }),
        ]),
      );
    } finally {
      await prisma.actionTaken.delete({ where: { id: foreignAction.id } });
      await prisma.ticket.delete({ where: { id: foreignTicket.id } });
    }
  });

  it("allows a Requester to view Actions Taken for their own ticket", async () => {
    const requesterUser = await prisma.user.findUnique({
      where: { email: "frodo.b@shiremail.example.com" },
    });
    if (!requesterUser) throw new Error("Requester user not found");

    const requesterTicket = await prisma.ticket.findFirst({
      where: { requesterId: requesterUser.id },
      orderBy: { id: "asc" },
    });
    if (!requesterTicket) throw new Error("Requester ticket not found");

    const response = await requester.get(
      `/api/tickets/${requesterTicket.ticketNumber}/actions`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
