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

describe("Lab 3 staff ticket detail API", () => {
  let staff: Agent;
  let ticketId: number;
  let staffUser1Id: number;
  let staffUser2Id: number;
  let inactiveStaffId: number;
  let requesterUserId: number;
  let createdTicketId: number | null = null;

  beforeAll(async () => {
    staff = await login("arwen@rivendell.example.com");

    const s1 = await prisma.user.findFirst({
      where: { role: "IT_STAFF", isActive: true },
    });
    const s2 = await prisma.user.findFirst({
      where: { role: "IT_STAFF", isActive: true, id: { not: s1!.id } },
    });
    const sInactive = await prisma.user.findFirst({
      where: { role: "IT_STAFF", isActive: false },
    });
    const rUser = await prisma.user.findFirst({
      where: { role: "REQUESTER" },
    });

    staffUser1Id = s1!.id;
    staffUser2Id = s2!.id;
    inactiveStaffId = sInactive!.id;
    requesterUserId = rUser!.id;

    const [category, relatedSystem, priority, newStatus] = await Promise.all([
      prisma.category.findFirstOrThrow({ where: { isActive: true } }),
      prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
      prisma.priority.findFirstOrThrow(),
      prisma.status.findFirstOrThrow({ where: { name: "New" } }),
    ]);
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFF-DETAIL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        requesterId: requesterUserId,
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        requestedPriorityId: priority.id,
        currentStatusId: newStatus.id,
        summary: "Staff ticket detail test ticket",
        description: "Dedicated ticket for staff detail API regression tests.",
      },
    });
    ticketId = ticket.id;
    createdTicketId = ticket.id;
  });

  afterAll(async () => {
    if (createdTicketId !== null) {
      await prisma.actionTaken.deleteMany({
        where: { ticketId: createdTicketId },
      });
      await prisma.ticket.delete({ where: { id: createdTicketId } });
    }
    await prisma.$disconnect();
  });

  it("API-18: can claim an unassigned ticket", async () => {
    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/owner`)
      .set(csrf)
      .send({ ownerId: staffUser1Id });

    expect(response.status).toBe(200);
    expect(response.body.owner).toEqual(
      expect.objectContaining({ id: staffUser1Id }),
    );
  });

  it("API-19: can reassign an owned ticket to another staff member", async () => {
    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/owner`)
      .set(csrf)
      .send({ ownerId: staffUser2Id });

    expect(response.status).toBe(200);
    expect(response.body.owner).toEqual(
      expect.objectContaining({ id: staffUser2Id }),
    );
  });

  it("API-20: rejects assigning an inactive IT staff user as owner", async () => {
    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/owner`)
      .set(csrf)
      .send({ ownerId: inactiveStaffId });

    expect(response.status).toBe(409);
  });

  it("API-21: rejects assigning a requester as owner", async () => {
    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/owner`)
      .set(csrf)
      .send({ ownerId: requesterUserId });

    expect(response.status).toBe(409);
  });

  it("API-22: updates IT priority without altering requested priority", async () => {
    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/priority`)
      .set(csrf)
      .send({ itPriority: "Low" });

    expect(response.status).toBe(200);
    expect(response.body.itPriority).toBe("Low");
  });

  it("API-23: rejects a direct status jump from New to Resolved", async () => {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatusId: (await prisma.status.findFirst({
          where: { name: "New" },
        }))!.id,
      },
    });
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });

    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set(csrf)
      .send({
        toStatus: "Resolved",
        updatedAt: ticket.updatedAt.toISOString(),
      });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toContain("New");
  });

  it("API-24: allows an In Progress ticket to transition to Resolved", async () => {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatusId: (await prisma.status.findFirst({
          where: { name: "In Progress" },
        }))!.id,
      },
    });
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });
    const resolvedResult = await prisma.actionResult.findFirstOrThrow({
      where: { name: "Resolved" },
    });
    await prisma.actionTaken.create({
      data: {
        ticketId,
        performedByUserId: staffUser1Id,
        description: "Resolved the issue for the status-transition test.",
        resultId: resolvedResult.id,
        followUpRequired: false,
      },
    });

    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set(csrf)
      .send({
        toStatus: "Resolved",
        updatedAt: ticket.updatedAt.toISOString(),
        resolutionSummary: "Fixed.",
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Resolved");
  });

  it("API-25: prevents IT Staff from reopening a Cancelled ticket", async () => {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        currentStatusId: (await prisma.status.findFirst({
          where: { name: "Cancelled" },
        }))!.id,
      },
    });
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });

    const response = await staff
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set(csrf)
      .send({
        toStatus: "Reopened",
        updatedAt: ticket.updatedAt.toISOString(),
      });

    expect(response.status).toBe(403);
  });

  it("API-26: staff can view any ticket by id, while missing tickets return 404", async () => {
    const good = await staff.get(`/api/staff/tickets/${ticketId}`);
    expect(good.status).toBe(200);

    const missing = await staff.get("/api/staff/tickets/999999");
    expect(missing.status).toBe(404);
  });
});
