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

// Each test creates many tickets, so give them more than the 5s default.
const LONG = 60_000;

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

  async function setAppearsResolved(ticketNumber: string, value: unknown) {
    return agents[ROLE.requester]
      .patch(`/api/tickets/${ticketNumber}/resolution`)
      .set(csrf)
      .send({ problemAppearsResolved: value });
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
  it(
    "API-06: Resolved requires an Action Taken with a Resolved result",
    async () => {
      // No Action Taken -> rejected, then accepted once one is added.
      const ticket = await makeTicket("In Progress");

      const rejected = await patchStatus(
        agents[ROLE.staff],
        ticket.id,
        "Resolved",
      );
      expect(rejected.status, "no action taken").toBe(409);
      expect(rejected.body.error.message).toMatch(/Action Taken/i);
      expect(await dbStatus(ticket.id)).toBe("In Progress");

      await addResolvedAction(ticket.id);

      const accepted = await patchStatus(
        agents[ROLE.staff],
        ticket.id,
        "Resolved",
      );
      expect(accepted.status, "with Resolved action").toBe(200);
      expect(await dbStatus(ticket.id)).toBe("Resolved");

      // A non-Resolved result does not satisfy the gate.
      const other = await prisma.actionResult.findFirst({
        where: { name: { not: "Resolved" }, isActive: true },
      });
      const ticket2 = await makeTicket("In Progress");
      if (other) {
        await prisma.actionTaken.create({
          data: {
            ticketId: ticket2.id,
            performedByUserId: staffUser.id,
            actionAt: new Date(),
            description: "Investigated but not fixed yet.",
            resultId: other.id,
            followUpRequired: false,
          },
        });
      }
      const notEnough = await patchStatus(
        agents[ROLE.staff],
        ticket2.id,
        "Resolved",
      );
      expect(notEnough.status, "non-Resolved action").toBe(409);
      expect(await dbStatus(ticket2.id)).toBe("In Progress");
    },
    LONG,
  );

  // -------------------------------------------------------------------------
  // API-07 | BR-09 | Transition not in the matrix
  // -------------------------------------------------------------------------
  it(
    "API-07: invalid transitions, unknown status and stale updatedAt are rejected",
    async () => {
      // New -> Resolved is not in the matrix (gate satisfied, so only the matrix rejects).
      const t1 = await makeTicket("New");
      await addResolvedAction(t1.id);
      const invalid = await patchStatus(agents[ROLE.staff], t1.id, "Resolved");
      expect(invalid.status, "New -> Resolved").toBe(409);
      expect(invalid.body.error.code).toBe("INVALID_TRANSITION");
      expect(await dbStatus(t1.id)).toBe("New");

      // Unknown status value.
      const t2 = await makeTicket("New");
      const unknown = await patchStatus(agents[ROLE.staff], t2.id, "Banana");
      expect(unknown.status, "unknown status").toBe(400);
      expect(await dbStatus(t2.id)).toBe("New");

      // Stale updatedAt.
      const t3 = await makeTicket("New");
      const stale = await agents[ROLE.staff]
        .patch(`/api/staff/tickets/${t3.id}/status`)
        .set(csrf)
        .send({ toStatus: "Open", updatedAt: "2000-01-01T00:00:00.000Z" });
      expect(stale.status, "stale updatedAt").toBe(409);
      expect(await dbStatus(t3.id)).toBe("New");
    },
    LONG,
  );

  // -------------------------------------------------------------------------
  // AUTH-02 | BR-10, AC-12 | Only Administrator may exit Cancelled/Closed
  // -------------------------------------------------------------------------
  it(
    "AUTH-02: only Administrator may reopen Cancelled/Closed tickets",
    async () => {
      for (const from of ["Cancelled", "Closed"]) {
        const forStaff = await makeTicket(from);
        const staffRes = await patchStatus(
          agents[ROLE.staff],
          forStaff.id,
          "Reopened",
        );
        expect(staffRes.status, `${from} -> Reopened as staff`).toBe(403);
        expect(await dbStatus(forStaff.id)).toBe(from);

        const forAdmin = await makeTicket(from);
        const adminRes = await patchStatus(
          agents[ROLE.admin],
          forAdmin.id,
          "Reopened",
        );
        expect(adminRes.status, `${from} -> Reopened as admin`).toBe(200);
        expect(await dbStatus(forAdmin.id)).toBe("Reopened");
      }
    },
    LONG,
  );

  // -------------------------------------------------------------------------
  // AUTH-03 | api-spec §5 | Authorization sweep: endpoints x roles
  // -------------------------------------------------------------------------
  it(
    "AUTH-03: authorization matrix sweep (endpoints x roles)",
    async () => {
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
          const agent = caller === "anonymous" ? null : agents[caller];
          const response = await endpoint.run(agent);
          expect(response.status, `${endpoint.name} as ${caller}`).toBe(
            endpoint.expected[caller],
          );
        }
      }
    },
    LONG,
  );

  // -------------------------------------------------------------------------
  // WF-01 | BR-09 | Every edge in the matrix, for every allowed role
  // -------------------------------------------------------------------------
  it(
    "WF-01: every matrix edge succeeds for allowed roles and is rejected for others",
    async () => {
      // Allowed roles succeed on every edge.
      for (const [from, targets] of Object.entries(transitionMatrix)) {
        for (const [to, roles] of Object.entries(targets)) {
          for (const role of roles as string[]) {
            const agent = agents[role];
            if (!agent)
              throw new Error(
                `No agent for role "${role}" - check ROLE constants`,
              );

            const ticket = await makeTicket(from);
            if (to === "Resolved") await addResolvedAction(ticket.id);

            const response = await patchStatus(agent, ticket.id, to);
            expect(response.status, `${from} -> ${to} as ${role}`).toBe(200);
            expect(
              await dbStatus(ticket.id),
              `${from} -> ${to} as ${role}`,
            ).toBe(to);
          }
        }
      }

      // Disallowed roles get 403 (requester is blocked by the route itself).
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
    },
    LONG,
  );

  // -------------------------------------------------------------------------
  // WF-02 | BR-08 | "Appears resolved" flag is advisory only
  // -------------------------------------------------------------------------
  it(
    "WF-02: requester 'appears resolved' flag is advisory only",
    async () => {
      // Setting the flag does not change the status.
      const t1 = await makeTicket("In Progress");
      const set = await setAppearsResolved(t1.ticketNumber, true);
      expect(set.status).toBe(200);
      expect(set.body.problemAppearsResolved).toBe(true);
      const inDb = await prisma.ticket.findUniqueOrThrow({
        where: { id: t1.id },
        include: { currentStatus: true },
      });
      expect(inDb.problemAppearsResolved).toBe(true);
      expect(inDb.currentStatus.name).toBe("In Progress");

      // The flag does not satisfy the Resolved gate.
      const gate = await patchStatus(agents[ROLE.staff], t1.id, "Resolved");
      expect(gate.status, "flag must not satisfy gate").toBe(409);
      expect(await dbStatus(t1.id)).toBe("In Progress");

      // The flag can be cleared without any status change.
      const t2 = await makeTicket("Open");
      await setAppearsResolved(t2.ticketNumber, true);
      const cleared = await setAppearsResolved(t2.ticketNumber, false);
      expect(cleared.status).toBe(200);
      const clearedDb = await prisma.ticket.findUniqueOrThrow({
        where: { id: t2.id },
        include: { currentStatus: true },
      });
      expect(clearedDb.problemAppearsResolved).toBe(false);
      expect(clearedDb.currentStatus.name).toBe("Open");

      // A non-boolean flag is rejected.
      const t3 = await makeTicket("Open");
      const bad = await setAppearsResolved(t3.ticketNumber, "yes");
      expect(bad.status, "non-boolean flag").toBe(400);

      // Staff ticket detail displays the flag (adjust path if your route differs).
      const t4 = await makeTicket("Open");
      await setAppearsResolved(t4.ticketNumber, true);
      const detail = await agents[ROLE.staff].get(
        `/api/staff/tickets/${t4.ticketNumber}`,
      );
      expect(detail.status).toBe(200);
      const body = detail.body.data ?? detail.body;
      expect(body.problemAppearsResolved).toBe(true);
    },
    LONG,
  );
});
