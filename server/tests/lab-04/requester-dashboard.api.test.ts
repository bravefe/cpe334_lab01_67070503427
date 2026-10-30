import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const password = "Password123!";

const INACTIVE_STATUSES = ["Resolved", "Closed", "Cancelled"];
const PERF_PREFIX = "TKT-PERF-R-";
const PERF_TICKET_COUNT = 50;
const PERF_THRESHOLD_MS = 500;

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

// Independent expectation: findMany + JS counting.
async function expectedRequesterDashboard(requesterId: number) {
  const tickets = await prisma.ticket.findMany({
    where: { requesterId },
    select: { currentStatus: { select: { name: true } } },
  });
  const withStatus = (name: string) =>
    tickets.filter((t) => t.currentStatus.name === name).length;

  return {
    totalOpen: tickets.filter(
      (t) => !INACTIVE_STATUSES.includes(t.currentStatus.name),
    ).length,
    waitingForYou: withStatus("Waiting for Requester"),
    recentlyResolved: withStatus("Resolved"),
    closed: withStatus("Closed"),
  };
}

function metrics(body: any) {
  return {
    totalOpen: body.totalOpen,
    waitingForYou: body.waitingForYou,
    recentlyResolved: body.recentlyResolved,
    closed: body.closed,
  };
}

describe("Lab 4 Requester Dashboard API", () => {
  let frodoAgent: Agent;
  let frodo: { id: number };
  let sam: { id: number };

  beforeAll(async () => {
    frodoAgent = await authenticated("frodo.b@shiremail.example.com");

    const [foundFrodo, foundSam] = await Promise.all([
      prisma.user.findUnique({
        where: { email: "frodo.b@shiremail.example.com" },
      }),
      prisma.user.findUnique({
        where: { email: "sam.gamgee@shiremail.example.com" },
      }),
    ]);
    if (!foundFrodo || !foundSam) throw new Error("Seed requesters not found");
    frodo = { id: foundFrodo.id };
    sam = { id: foundSam.id };
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: PERF_PREFIX } },
    });
    await prisma.$disconnect();
  });

  it("API-08: spoofed/foreign requester id in the query is ignored; only the session's data is returned", async () => {
    // Precondition: the spoof target actually owns tickets, otherwise the test proves nothing.
    const samTicketCount = await prisma.ticket.count({
      where: { requesterId: sam.id },
    });
    expect(samTicketCount).toBeGreaterThan(0);

    const baseline = await frodoAgent.get("/api/requester/dashboard");
    expect(baseline.status).toBe(200);

    const spoofed = await frodoAgent.get(
      `/api/requester/dashboard?requesterId=${sam.id}&userId=${sam.id}&requester=${sam.id}`,
    );
    expect(spoofed.status).toBe(200);

    const baselineBody = baseline.body.data ?? baseline.body;
    const spoofedBody = spoofed.body.data ?? spoofed.body;

    // Foreign id changes nothing...
    expect(metrics(spoofedBody)).toEqual(metrics(baselineBody));
    // ...and the numbers are Frodo's own, computed independently from the DB.
    expect(metrics(spoofedBody)).toEqual(
      await expectedRequesterDashboard(frodo.id),
    );

    // Every recent ticket belongs to the session user, none to the spoofed id.
    expect(spoofedBody.recentTickets.length).toBeLessThanOrEqual(5);
    const recentIds = spoofedBody.recentTickets.map(
      (t: { id: number }) => t.id,
    );
    const owners = await prisma.ticket.findMany({
      where: { id: { in: recentIds } },
      select: { requesterId: true },
    });
    expect(owners.every((t) => t.requesterId === frodo.id)).toBe(true);
  });

  it("PERF-02: GET /api/requester/dashboard responds within threshold for a Requester with ~50 Tickets; recentTickets capped at 5", async () => {
    // Dedicated requester so no other suite's expectations are touched.
    const perfEmail = "galadriel@lothlorien.example.com";
    const perfAgent = await authenticated(perfEmail);
    const perfUser = await prisma.user.findUniqueOrThrow({
      where: { email: perfEmail },
    });

    await prisma.ticket.deleteMany({
      where: { ticketNumber: { startsWith: PERF_PREFIX } },
    });

    const [statuses, priority, category, system] = await Promise.all([
      prisma.status.findMany({
        where: { name: { in: ["Resolved", "Closed"] } },
      }),
      prisma.priority.findFirstOrThrow(),
      prisma.category.findFirstOrThrow(),
      prisma.relatedSystem.findFirstOrThrow(),
    ]);

    // Resolved/Closed only: these never feed the staff dashboard's
    // unassigned/status/priority counts, so this test can run beside
    // staff-dashboard.api.test.ts without racing it.
    await prisma.ticket.createMany({
      data: Array.from({ length: PERF_TICKET_COUNT }, (_, i) => ({
        ticketNumber: `${PERF_PREFIX}${String(i).padStart(6, "0")}`,
        requesterId: perfUser.id,
        ticketOwnerId: null,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: `Perf requester ticket ${i}`,
        description:
          "Seeded by PERF-02 for requester dashboard performance smoke test.",
        requestedPriorityId: priority.id,
        itPriorityId: priority.id,
        currentStatusId: statuses[i % statuses.length].id,
      })),
    });

    const expected = await expectedRequesterDashboard(perfUser.id);

    // Warm-up so the first-connection cost isn't counted.
    await perfAgent.get("/api/requester/dashboard");

    const started = performance.now();
    const response = await perfAgent.get("/api/requester/dashboard");
    const elapsed = performance.now() - started;

    expect(response.status).toBe(200);
    expect(elapsed).toBeLessThan(PERF_THRESHOLD_MS);

    const body = response.body.data ?? response.body;
    expect(metrics(body)).toEqual(expected);

    // Capped at 5 even though the requester owns 50+ tickets.
    expect(body.recentTickets).toHaveLength(5);
  }, 30_000);
});
