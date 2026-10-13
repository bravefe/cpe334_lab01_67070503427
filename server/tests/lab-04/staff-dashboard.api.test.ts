import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const password = "Password123!";

const INACTIVE_STATUSES = ["Resolved", "Closed", "Cancelled"];
const PERF_PREFIX = "TKT-PERF-S-";
const PERF_TICKET_COUNT = 500;
const PERF_THRESHOLD_MS = 500;

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

// Independent expectation: plain findMany + JS counting, deliberately different
// from the service's count()/groupBy() queries.
async function expectedStaffDashboard(staffUserId: number) {
  const [tickets, priorities] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        ticketOwnerId: true,
        itPriorityId: true,
        currentStatus: { select: { name: true } },
      },
    }),
    prisma.priority.findMany({ orderBy: { sortOrder: "desc" } }),
  ]);

  const active = tickets.filter(
    (t) => !INACTIVE_STATUSES.includes(t.currentStatus.name),
  );
  const withStatus = (name: string) =>
    tickets.filter((t) => t.currentStatus.name === name).length;

  return {
    unassigned: active.filter((t) => t.ticketOwnerId === null).length,
    myAssigned: active.filter((t) => t.ticketOwnerId === staffUserId).length,
    new: withStatus("New"),
    open: withStatus("Open"),
    inProgress: withStatus("In Progress"),
    waitingForRequester: withStatus("Waiting for Requester"),
    byPriority: priorities.map((p) => ({
      priorityId: p.id,
      priorityName: p.name,
      count: active.filter((t) => t.itPriorityId === p.id).length,
    })),
  };
}

function metrics(body: any) {
  return {
    unassigned: body.unassigned,
    myAssigned: body.myAssigned,
    new: body.new,
    open: body.open,
    inProgress: body.inProgress,
    waitingForRequester: body.waitingForRequester,
    byPriority: body.byPriority,
  };
}

describe("Lab 4 Staff Dashboard API", () => {
  let staff: Agent;
  let staffUser: { id: number };

  beforeAll(async () => {
    staff = await authenticated("arwen@rivendell.example.com");
    const found = await prisma.user.findUnique({
      where: { email: "arwen@rivendell.example.com" },
    });
    if (!found) throw new Error("Staff user not found");
    staffUser = { id: found.id };
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: PERF_PREFIX } },
    });
    await prisma.$disconnect();
  });

  it("API-09: dashboard counts match a hand-computed expectation from the seeded dataset", async () => {
    const expected = await expectedStaffDashboard(staffUser.id);

    const response = await staff.get("/api/staff/dashboard");
    expect(response.status).toBe(200);

    const body = response.body.data ?? response.body;
    expect(metrics(body)).toEqual(expected);

    // Shape guarantees from the spec: recentTickets capped at 5, filters present.
    expect(Array.isArray(body.recentTickets)).toBe(true);
    expect(body.recentTickets.length).toBeLessThanOrEqual(5);
    expect(body.filters).toBeDefined();
  });

  it("PERF-01: GET /api/staff/dashboard responds within threshold against ~500 Tickets with correct counts", async () => {
    // Clean up leftovers from a previous crashed run, then seed.
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: PERF_PREFIX } },
    });

    const [statuses, priorities, category, system, requester, staffUsers] =
      await Promise.all([
        prisma.status.findMany(),
        prisma.priority.findMany(),
        prisma.category.findFirstOrThrow(),
        prisma.relatedSystem.findFirstOrThrow(),
        prisma.user.findFirstOrThrow({
          where: { email: "frodo.b@shiremail.example.com" },
        }),
        prisma.user.findMany({ where: { role: "IT_STAFF", isActive: true } }),
      ]);

    const cycleStatuses = [
      "New",
      "Open",
      "In Progress",
      "Waiting for Requester",
      "Resolved",
      "Closed",
    ].map((name) => statuses.find((s) => s.name === name)!.id);

    await prisma.ticket.createMany({
      data: Array.from({ length: PERF_TICKET_COUNT }, (_, i) => {
        const priorityId = priorities[i % priorities.length].id;
        return {
          ticketNumber: `${PERF_PREFIX}${String(i).padStart(6, "0")}`,
          requesterId: requester.id,
          // every 4th ticket stays unassigned
          ticketOwnerId:
            i % 4 === 0 ? null : staffUsers[i % staffUsers.length].id,
          categoryId: category.id,
          relatedSystemId: system.id,
          summary: `Perf ticket ${i}`,
          description:
            "Seeded by PERF-01 for dashboard performance smoke test.",
          requestedPriorityId: priorityId,
          itPriorityId: priorityId,
          currentStatusId: cycleStatuses[i % cycleStatuses.length],
        };
      }),
    });

    const expected = await expectedStaffDashboard(staffUser.id);

    // Warm-up so the first-connection cost isn't counted.
    await staff.get("/api/staff/dashboard");

    const started = performance.now();
    const response = await staff.get("/api/staff/dashboard");
    const elapsed = performance.now() - started;

    expect(response.status).toBe(200);
    expect(elapsed).toBeLessThan(PERF_THRESHOLD_MS);

    const body = response.body.data ?? response.body;
    expect(metrics(body)).toEqual(expected);
    expect(body.recentTickets.length).toBeLessThanOrEqual(5);
  }, 30_000);
});
