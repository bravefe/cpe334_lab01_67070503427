import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { transitionMatrix } from "../../src/lib/statusTransitions.js";

const prisma = getPrisma();
const csrf = { "X-Requested-With": "TokTickIT" };
const password = "Password123!";

// ---------------------------------------------------------------------------
// HELPERS - adjust these if your seed data / role strings differ
// ---------------------------------------------------------------------------

// Must match SessionPayload.role / User.role in the DB AND the Role strings
// used in lib/statusTransition.ts.
const ROLE = {
  requester: "REQUESTER",
  staff: "IT_STAFF",
  admin: "ADMINISTRATOR",
} as const;

const REQUESTER_EMAIL = "frodo.b@shiremail.example.com";
const STAFF_EMAIL = "arwen@rivendell.example.com";

// What staff/admin get on PATCH /api/tickets/:ticketNumber/resolution
// (requester-only endpoint). Set to match your resolveTicketAccess behaviour.
const STAFF_ON_RESOLUTION_EXPECTED = 403;

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

describe("Lab 4 Ticket Workflow API", () => {
  let agents: Record<string, Agent>;
  let staffUser: { id: number };
  let requesterUser: { id: number };
  let statusByName: Record<string, number>;
  let resolvedResult: { id: number };
  let refs: { categoryId: number; systemId: number; priorityId: number };

  const createdTicketIds: number[] = [];
  let counter = 0;

  async function makeTicket(statusName: string) {
    counter += 1;
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-${Date.now()}-${counter}`,
        summary: `Workflow test ticket ${counter}`,
        description: "Ticket created by the Lab 4 workflow test suite.",
        categoryId: refs.categoryId,
        relatedSystemId: refs.systemId,
        requestedPriorityId: refs.priorityId,
        itPriorityId: refs.priorityId,
        currentStatusId: statusByName[statusName],
        requesterId: requesterUser.id,
      },
    });
    createdTicketIds.push(ticket.id);
    return ticket;
  }

  async function addResolvedAction(ticketId: number) {
    return prisma.actionTaken.create({
      data: {
        ticketId,
        performedByUserId: staffUser.id,
        actionAt: new Date(),
        description: "Fix applied and verified; marking result as Resolved.",
        resultId: resolvedResult.id,
        followUpRequired: false,
      },
    });
  }

  async function dbStatus(ticketId: number): Promise<string> {
    const t = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { currentStatus: true },
    });
    return t.currentStatus.name;
  }

  // Always sends a fresh updatedAt so the stale check never interferes.
  async function patchStatus(
    agent: Agent | null,
    ticketId: number,
    toStatus: string,
  ) {
    const t = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });
    const caller = agent ?? request(app);
    return caller
      .patch(`/api/staff/tickets/${ticketId}/status`)
      .set(csrf)
      .send({ toStatus, updatedAt: t.updatedAt.toISOString() });
  }

  beforeAll(async () => {
    const adminUser = await prisma.user.findFirst({
      where: { role: ROLE.admin, isActive: true },
    });
    if (!adminUser) throw new Error(`No active ${ROLE.admin} user seeded`);

    const foundStaff = await prisma.user.findUnique({
      where: { email: STAFF_EMAIL },
    });
    const foundRequester = await prisma.user.findUnique({
      where: { email: REQUESTER_EMAIL },
    });
    if (!foundStaff || !foundRequester) throw new Error("Seed users missing");
    staffUser = { id: foundStaff.id };
    requesterUser = { id: foundRequester.id };

    agents = {
      [ROLE.requester]: await authenticated(REQUESTER_EMAIL),
      [ROLE.staff]: await authenticated(STAFF_EMAIL),
      [ROLE.admin]: await authenticated(adminUser.email),
    };

    const statuses = await prisma.status.findMany();
    statusByName = Object.fromEntries(statuses.map((s) => [s.name, s.id]));
    for (const name of Object.keys(transitionMatrix)) {
      if (!(name in statusByName))
        throw new Error(`Status "${name}" not seeded`);
    }

    const result = await prisma.actionResult.findFirst({
      where: { name: "Resolved" },
    });
    if (!result) throw new Error('ActionResult "Resolved" not seeded');
    resolvedResult = { id: result.id };

    const category = await prisma.category.findFirst({
      where: { isActive: true },
    });
    const system = await prisma.relatedSystem.findFirst({
      where: { isActive: true },
    });
    const priority = await prisma.priority.findFirst();
    if (!category || !system || !priority)
      throw new Error("Lookup data missing");
    refs = {
      categoryId: category.id,
      systemId: system.id,
      priorityId: priority.id,
    };
  });

  afterAll(async () => {
    if (createdTicketIds.length) {
      await prisma.actionTaken.deleteMany({
        where: { ticketId: { in: createdTicketIds } },
      });
      await prisma.ticket.deleteMany({
        where: { id: { in: createdTicketIds } },
      });
    }
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // API-06 | AC-05, AC-06 | Resolved gate
  // -------------------------------------------------------------------------
  it("API-06: Resolved is rejected without a Resolved-result Action Taken and succeeds with one", async () => {
    const ticket = await makeTicket("In Progress");

    const rejected = await patchStatus(
      agents[ROLE.staff],
      ticket.id,
      "Resolved",
    );
    expect(rejected.status).toBe(409);
    expect(rejected.body.error).toBeDefined();
    expect(rejected.body.error.message).toMatch(/Action Taken/i);
    expect(await dbStatus(ticket.id)).toBe("In Progress");

    await addResolvedAction(ticket.id);

    const accepted = await patchStatus(
      agents[ROLE.staff],
      ticket.id,
      "Resolved",
    );
    expect(accepted.status).toBe(200);
    expect(await dbStatus(ticket.id)).toBe("Resolved");
  });

  it("API-06: an Action Taken with a non-Resolved result does not satisfy the gate", async () => {
    const ticket = await makeTicket("In Progress");
    const other = await prisma.actionResult.findFirst({
      where: { name: { not: "Resolved" }, isActive: true },
    });
    if (other) {
      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          performedByUserId: staffUser.id,
          actionAt: new Date(),
          description: "Investigated but not fixed yet.",
          resultId: other.id,
          followUpRequired: false,
        },
      });
    }

    const response = await patchStatus(
      agents[ROLE.staff],
      ticket.id,
      "Resolved",
    );
    expect(response.status).toBe(409);
    expect(await dbStatus(ticket.id)).toBe("In Progress");
  });

  // -------------------------------------------------------------------------
  // API-07 | BR-09 | Transition not in the matrix
  // -------------------------------------------------------------------------
  it("API-07: New -> Resolved is rejected with 409 Conflict", async () => {
    const ticket = await makeTicket("New");
    await addResolvedAction(ticket.id); // gate satisfied, so only the matrix can reject

    const response = await patchStatus(
      agents[ROLE.staff],
      ticket.id,
      "Resolved",
    );
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("INVALID_TRANSITION");
    expect(await dbStatus(ticket.id)).toBe("New");
  });

  it("API-07: unknown status value is rejected with 400", async () => {
    const ticket = await makeTicket("New");
    const response = await patchStatus(agents[ROLE.staff], ticket.id, "Banana");
    expect(response.status).toBe(400);
    expect(await dbStatus(ticket.id)).toBe("New");
  });

  it("API-07: stale updatedAt is rejected with 409 and the ticket is unchanged", async () => {
    const ticket = await makeTicket("New");
    const response = await agents[ROLE.staff]
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set(csrf)
      .send({ toStatus: "Open", updatedAt: "2000-01-01T00:00:00.000Z" });
    expect(response.status).toBe(409);
    expect(await dbStatus(ticket.id)).toBe("New");
  });

  // -------------------------------------------------------------------------
  // AUTH-02 | BR-10, AC-12 | Only Administrator may exit Cancelled/Closed
  // -------------------------------------------------------------------------
  describe("AUTH-02: exiting Cancelled/Closed", () => {
    it.each(["Cancelled", "Closed"])(
      "IT Staff gets 403 on %s -> Reopened and the status is unchanged",
      async (from) => {
        const ticket = await makeTicket(from);
        const response = await patchStatus(
          agents[ROLE.staff],
          ticket.id,
          "Reopened",
        );
        expect(response.status).toBe(403);
        expect(await dbStatus(ticket.id)).toBe(from);
      },
    );

    it.each(["Cancelled", "Closed"])(
      "Administrator succeeds on %s -> Reopened",
      async (from) => {
        const ticket = await makeTicket(from);
        const response = await patchStatus(
          agents[ROLE.admin],
          ticket.id,
          "Reopened",
        );
        expect(response.status).toBe(200);
        expect(await dbStatus(ticket.id)).toBe("Reopened");
      },
    );
  });

  // -------------------------------------------------------------------------
  // AUTH-03 | api-spec §5 | Authorization sweep: endpoints x roles
  // -------------------------------------------------------------------------
  describe("AUTH-03: authorization matrix sweep", () => {
    type Caller = "anonymous" | (typeof ROLE)[keyof typeof ROLE];

    const callers: Caller[] = [
      "anonymous",
      ROLE.requester,
      ROLE.staff,
      ROLE.admin,
    ];

    const endpoints: {
      name: string;
      run: (agent: Agent | null) => Promise<{ status: number }>;
      expected: Record<Caller, number>;
    }[] = [
      {
        name: "PATCH /api/staff/tickets/:id/status",
        run: async (agent) => {
          const t = await makeTicket("New");
          return patchStatus(agent, t.id, "Open");
        },
        expected: {
          anonymous: 401,
          [ROLE.requester]: 403,
          [ROLE.staff]: 200,
          [ROLE.admin]: 200,
        },
      },
      {
        name: "PATCH /api/tickets/:ticketNumber/resolution",
        run: async (agent) => {
          const t = await makeTicket("Open");
          return (agent ?? request(app))
            .patch(`/api/tickets/${t.ticketNumber}/resolution`)
            .set(csrf)
            .send({ problemAppearsResolved: true });
        },
        expected: {
          anonymous: 401,
          [ROLE.requester]: 200, // ticket is owned by the seeded requester
          [ROLE.staff]: STAFF_ON_RESOLUTION_EXPECTED,
          [ROLE.admin]: STAFF_ON_RESOLUTION_EXPECTED,
        },
      },
      {
        name: "POST /api/staff/tickets/:id/actions",
        run: async (agent) => {
          const t = await makeTicket("Open");
          return (agent ?? request(app))
            .post(`/api/staff/tickets/${t.id}/actions`)
            .set(csrf)
            .send({
              actionAt: t.createdAt.toISOString(),
              description: "Authorization sweep action description",
              resultId: resolvedResult.id,
              followUpRequired: false,
              followUpNote: null,
            });
        },
        expected: {
          anonymous: 401,
          [ROLE.requester]: 403,
          [ROLE.staff]: 201,
          [ROLE.admin]: 201,
        },
      },
    ];

    for (const endpoint of endpoints) {
      for (const caller of callers) {
        it(`${endpoint.name} as ${caller} -> ${endpoint.expected[caller]}`, async () => {
          const agent = caller === "anonymous" ? null : agents[caller];
          const response = await endpoint.run(agent);
          expect(response.status).toBe(endpoint.expected[caller]);
        });
      }
    }
  });

  // -------------------------------------------------------------------------
  // WF-01 | BR-09 | Every edge in the matrix, for every allowed role
  // -------------------------------------------------------------------------
  describe("WF-01: every matrix edge succeeds for its allowed roles", () => {
    const edges = Object.entries(transitionMatrix).flatMap(([from, targets]) =>
      Object.entries(targets).flatMap(([to, roles]) =>
        roles.map((role) => ({ from, to, role: role as string })),
      ),
    );

    it.each(edges)("$from -> $to as $role", async ({ from, to, role }) => {
      const agent = agents[role];
      if (!agent)
        throw new Error(`No agent for role "${role}" - check ROLE constants`);

      const ticket = await makeTicket(from);
      if (to === "Resolved") await addResolvedAction(ticket.id);

      const response = await patchStatus(agent, ticket.id, to);
      expect(response.status).toBe(200);
      expect(await dbStatus(ticket.id)).toBe(to);
    });

    it("rejects every edge for roles not allowed on it (excluding the requester-blocked route)", async () => {
      for (const [from, targets] of Object.entries(transitionMatrix)) {
        for (const [to, allowedRoles] of Object.entries(targets)) {
          for (const role of [ROLE.staff, ROLE.admin]) {
            if ((allowedRoles as string[]).includes(role)) continue;
            const ticket = await makeTicket(from);
            if (to === "Resolved") await addResolvedAction(ticket.id);
            const response = await patchStatus(agents[role], ticket.id, to);
            expect(response.status, `${from} -> ${to} as ${role}`).toBe(403);
            expect(await dbStatus(ticket.id)).toBe(from);
          }
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // WF-02 | BR-08 | "Appears resolved" flag is advisory only
  // -------------------------------------------------------------------------
  describe("WF-02: requester 'appears resolved' flag is advisory", () => {
    it("setting the flag does not change the ticket status", async () => {
      const ticket = await makeTicket("In Progress");

      const response = await agents[ROLE.requester]
        .patch(`/api/tickets/${ticket.ticketNumber}/resolution`)
        .set(csrf)
        .send({ problemAppearsResolved: true });

      expect(response.status).toBe(200);
      expect(response.body.problemAppearsResolved).toBe(true);

      const inDb = await prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: { currentStatus: true },
      });
      expect(inDb.problemAppearsResolved).toBe(true);
      expect(inDb.currentStatus.name).toBe("In Progress");
    });

    it("the flag does not satisfy the Resolved gate", async () => {
      const ticket = await makeTicket("In Progress");
      await agents[ROLE.requester]
        .patch(`/api/tickets/${ticket.ticketNumber}/resolution`)
        .set(csrf)
        .send({ problemAppearsResolved: true });

      const response = await patchStatus(
        agents[ROLE.staff],
        ticket.id,
        "Resolved",
      );
      expect(response.status).toBe(409);
      expect(await dbStatus(ticket.id)).toBe("In Progress");
    });

    it("the flag can be cleared again without any status change", async () => {
      const ticket = await makeTicket("Open");
      await agents[ROLE.requester]
        .patch(`/api/tickets/${ticket.ticketNumber}/resolution`)
        .set(csrf)
        .send({ problemAppearsResolved: true });
      const cleared = await agents[ROLE.requester]
        .patch(`/api/tickets/${ticket.ticketNumber}/resolution`)
        .set(csrf)
        .send({ problemAppearsResolved: false });

      expect(cleared.status).toBe(200);
      const inDb = await prisma.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: { currentStatus: true },
      });
      expect(inDb.problemAppearsResolved).toBe(false);
      expect(inDb.currentStatus.name).toBe("Open");
    });

    it("rejects a non-boolean flag with 400", async () => {
      const ticket = await makeTicket("Open");
      const response = await agents[ROLE.requester]
        .patch(`/api/tickets/${ticket.ticketNumber}/resolution`)
        .set(csrf)
        .send({ problemAppearsResolved: "yes" });
      expect(response.status).toBe(400);
    });

    it("staff ticket detail displays the flag", async () => {
      // Adjust the path if your staff detail route differs.
      const ticket = await makeTicket("Open");
      await agents[ROLE.requester]
        .patch(`/api/tickets/${ticket.ticketNumber}/resolution`)
        .set(csrf)
        .send({ problemAppearsResolved: true });

      const response = await agents[ROLE.staff].get(
        `/api/staff/tickets/${ticket.ticketNumber}`,
      );
      expect(response.status).toBe(200);
      const body = response.body.data ?? response.body;
      expect(body.problemAppearsResolved).toBe(true);
    });
  });
});
