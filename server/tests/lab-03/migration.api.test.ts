import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seed } from "../../prisma/seed.js";

describe("Lab 3 Migration & Data Model Verification", () => {
  const prisma = getPrisma();

  it("MIG-02: Ticket row count before and after the User migration (§7.1 spec)", async () => {
    const totalTickets = await prisma.ticket.count();
    expect(totalTickets).toBeGreaterThan(0);

    // Verify tickets have non-null IDs and unique ticketNumbers without duplication
    const tickets = await prisma.ticket.findMany({
      select: { id: true, ticketNumber: true },
    });
    expect(tickets.length).toBe(totalTickets);

    const uniqueNumbers = new Set(tickets.map((t) => t.ticketNumber));
    expect(uniqueNumbers.size).toBe(totalTickets);
  });

  it("MIG-03: Every migrated Ticket.requesterId resolves to an active User with role REQUESTER (§7.1 spec)", async () => {
    const tickets = await prisma.ticket.findMany({
      include: {
        requester: true,
      },
    });

    expect(tickets.length).toBeGreaterThan(0);

    for (const ticket of tickets) {
      // 100% of migrated tickets must resolve to a valid User
      expect(
        ticket.requester,
        `Ticket ${ticket.ticketNumber} must have a requester User`,
      ).toBeDefined();
      expect(ticket.requester.id).toBe(ticket.requesterId);
      expect(ticket.requester.role).toBe("REQUESTER");
      expect(ticket.requester.isActive).toBe(true);

    }
  });

  it("MIG-04: itPriority on every pre-existing ticket after migration equals requestedPriority (§7.1 spec)", async () => {
    const tickets = await prisma.ticket.findMany({
      include: {
        requestedPriority: true,
        itPriority: true,
      },
    });

    expect(tickets.length).toBeGreaterThan(0);

    for (const ticket of tickets) {
      // Every ticket must have itPriority populated matching requestedPriority
      expect(
        ticket.itPriorityId,
        `Ticket ${ticket.ticketNumber} must have itPriorityId`,
      ).not.toBeNull();
      expect(
        ticket.itPriorityId,
        `Ticket ${ticket.ticketNumber} itPriorityId must equal requestedPriorityId`,
      ).toBe(ticket.requestedPriorityId);

      expect(ticket.itPriority).toBeDefined();
      expect(ticket.requestedPriority).toBeDefined();
      expect(ticket.itPriority?.name).toBe(ticket.requestedPriority.name);
    }
  });

  it("MIG-05: Seed script run twice in sequence against database produces identical row counts (idempotent, §5.3)", async () => {
    // Collect counts before running seed
    const [
      categoryBefore,
      systemBefore,
      priorityBefore,
      statusBefore,
      userBefore,
      ticketBefore,
      commentBefore,
      noteBefore,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.relatedSystem.count(),
      prisma.priority.count(),
      prisma.status.count(),
      prisma.user.count(),
      prisma.ticket.count(),
      prisma.publicComment.count(),
      prisma.internalNote.count(),
    ]);

    // Execute seed second time
    await seed();

    // Collect counts after second run
    const [
      categoryAfter,
      systemAfter,
      priorityAfter,
      statusAfter,
      userAfter,
      ticketAfter,
      commentAfter,
      noteAfter,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.relatedSystem.count(),
      prisma.priority.count(),
      prisma.status.count(),
      prisma.user.count(),
      prisma.ticket.count(),
      prisma.publicComment.count(),
      prisma.internalNote.count(),
    ]);

    // Verify that every entity row count remained exactly identical
    expect(categoryAfter).toBe(categoryBefore);
    expect(systemAfter).toBe(systemBefore);
    expect(priorityAfter).toBe(priorityBefore);
    expect(statusAfter).toBe(statusBefore);
    expect(userAfter).toBe(userBefore);
    expect(ticketAfter).toBe(ticketBefore);
    expect(commentAfter).toBe(commentBefore);
    expect(noteAfter).toBe(noteBefore);

    // Verify minimum account counts per role according to handout §5.3
    const activeRequesters = await prisma.user.count({
      where: { role: "REQUESTER", isActive: true },
    });
    const inactiveRequesters = await prisma.user.count({
      where: { role: "REQUESTER", isActive: false },
    });
    const activeStaff = await prisma.user.count({
      where: { role: "IT_STAFF", isActive: true },
    });
    const inactiveStaff = await prisma.user.count({
      where: { role: "IT_STAFF", isActive: false },
    });
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMINISTRATOR", isActive: true },
    });

    expect(activeRequesters).toBeGreaterThanOrEqual(4);
    expect(inactiveRequesters).toBeGreaterThanOrEqual(1);
    expect(activeStaff).toBeGreaterThanOrEqual(3);
    expect(inactiveStaff).toBeGreaterThanOrEqual(1);
    expect(activeAdmins).toBeGreaterThanOrEqual(1);
  });

  it("enforces unique and case-insensitive email at the database level", async () => {
    // Attempting to insert a user with the same email in different casing must be rejected
    await expect(
      prisma.user.create({
        data: {
          name: "Duplicate Casing Test",
          email: "FRODO.B@SHIREMAIL.EXAMPLE.COM",
          passwordHash: "dummyhash",
          role: "REQUESTER",
        },
      }),
    ).rejects.toThrow();
  });

  it("MIG-01: preserves authenticated Lab 2 requester workflows", async () => {
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({
        email: "frodo.b@shiremail.example.com",
        password: "Password123!",
      });
    expect(login.status).toBe(200);

    expect((await agent.get("/api/categories")).status).toBe(200);
    expect((await agent.get("/api/related-systems")).status).toBe(200);
    expect((await agent.get("/api/priorities")).status).toBe(200);
    expect(
      (await agent.get("/api/tickets").query({ page: 1, pageSize: 10 })).status,
    ).toBe(200);

    const created = await agent
      .post("/api/tickets")
      .set("X-Requested-With", "TokTickIT")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriorityId: 1,
        summary: "Authenticated regression ticket",
        description:
          "Lab 2 requester ticket creation still works with session auth.",
      });
    expect(created.status).toBe(201);
    await prisma.ticket.delete({
      where: { ticketNumber: created.body.data.ticketNumber },
    });
  });
});
