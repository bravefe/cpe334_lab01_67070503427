import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("GET /api/tickets", () => {
  let requesterA: { id: number };
  let requesterB: { id: number };
  let category: { id: number };
  let system: { id: number };
  let lowPriority: { id: number };
  let highPriority: { id: number };
  let newStatus: { id: number };

  beforeAll(async () => {
    const prisma = getPrisma();
    const timestamp = Date.now();

    // Create test requesters
    requesterA = await prisma.devRequester.create({
      data: {
        name: "Requester A",
        email: `requester-a-${timestamp}@test.example.com`,
        isActive: true,
      },
    });

    requesterB = await prisma.devRequester.create({
      data: {
        name: "Requester B",
        email: `requester-b-${timestamp}@test.example.com`,
        isActive: true,
      },
    });

    // Get reference data
    const [categoryData, systemData, priorities, statuses] = await Promise.all([
      prisma.category.findFirst({ where: { isActive: true } }),
      prisma.relatedSystem.findFirst({ where: { isActive: true } }),
      prisma.priority.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.status.findMany({ where: { isDefault: true } }),
    ]);

    category = categoryData!;
    system = systemData!;
    lowPriority = priorities[0];
    highPriority = priorities[priorities.length - 1];
    newStatus = statuses[0];

    // Create test tickets for Requester A
    for (let i = 1; i <= 15; i++) {
      await prisma.ticket.create({
        data: {
          ticketNumber: `API16-A-${timestamp}-${String(i).padStart(3, "0")}`,
          requesterId: requesterA.id,
          categoryId: category.id,
          relatedSystemId: system.id,
          summary: `Ticket ${i} from Requester A`,
          description: `This is a test ticket ${i} owned by Requester A with enough description text.`,
          requestedPriorityId: i % 2 === 0 ? highPriority.id : lowPriority.id,
          currentStatusId: newStatus.id,
        },
      });
    }

    // Create test tickets for Requester B
    for (let i = 1; i <= 5; i++) {
      await prisma.ticket.create({
        data: {
          ticketNumber: `API16-B-${timestamp}-${String(i).padStart(3, "0")}`,
          requesterId: requesterB.id,
          categoryId: category.id,
          relatedSystemId: system.id,
          summary: `Ticket ${i} from Requester B`,
          description: `This is a test ticket ${i} owned by Requester B with enough description text.`,
          requestedPriorityId: lowPriority.id,
          currentStatusId: newStatus.id,
        },
      });
    }
  });

  it("API-16: returns only tickets owned by the current requester", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("X-Dev-Requester-Id", String(requesterB.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.totalItems).toBe(5);
    expect(res.body.data.length).toBe(5);

    // Verify all tickets belong to Requester B
    res.body.data.forEach((ticket: any) => {
      expect(ticket.requesterId).toBe(requesterB.id);
      expect(ticket.ticketNumber).toContain("API16-B-");
    });

    // Verify Requester A's tickets are NOT included
    const ticketNumbers = res.body.data.map((t: any) => t.ticketNumber);
    const requesterATickets = ticketNumbers.filter((num: string) =>
      num.includes("API16-A-")
    );
    expect(requesterATickets.length).toBe(0);
  });

  it("API-17: filters tickets by partial ticket number (case-insensitive)", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ search: "API16-A-001" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.ticketNumber.toLowerCase()).toContain("api16-a-001");
    });
  });

  it("API-17: search is case-insensitive", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ search: "api16-a-001" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.ticketNumber.toLowerCase()).toContain("api16-a-001");
    });
  });

  it("API-17: filters tickets by summary search", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ search: "Ticket 1" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((ticket: any) => {
      expect(
        ticket.ticketNumber.toLowerCase().includes("ticket 1") ||
        ticket.summary.toLowerCase().includes("ticket 1")
      ).toBe(true);
    });
  });

  it("API-18: filters by category and priority combined", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({
        category: category.id,
        requestedPriorityId: highPriority.id,
      })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(res.status).toBe(200);
    res.body.data.forEach((ticket: any) => {
      expect(ticket.categoryId).toBe(category.id);
      expect(ticket.requestedPriorityId).toBe(highPriority.id);
    });
  });

  it("API-19: reverses sort order when sortDir is toggled", async () => {
    const resAsc = await request(app)
      .get("/api/tickets")
      .query({ sortBy: "createdAt", sortDir: "asc" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    const resDesc = await request(app)
      .get("/api/tickets")
      .query({ sortBy: "createdAt", sortDir: "desc" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(resAsc.status).toBe(200);
    expect(resDesc.status).toBe(200);

    const ascDates = resAsc.body.data.map((t: any) => t.createdAt);
    const descDates = resDesc.body.data.map((t: any) => t.createdAt);

    // Verify ascending order
    for (let i = 0; i < ascDates.length - 1; i++) {
      expect(
        new Date(ascDates[i]).getTime() <=
        new Date(ascDates[i + 1]).getTime()
      ).toBe(true);
    }

    // Verify descending order
    for (let i = 0; i < descDates.length - 1; i++) {
      expect(
        new Date(descDates[i]).getTime() >=
        new Date(descDates[i + 1]).getTime()
      ).toBe(true);
    }
  });

  it("API-20: pagination loads correct page and metadata", async () => {
    const pageSize = 5;

    const page1 = await request(app)
      .get("/api/tickets")
      .query({ pageSize, page: 1 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    const page2 = await request(app)
      .get("/api/tickets")
      .query({ pageSize, page: 2 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    expect(page1.body.page).toBe(1);
    expect(page1.body.pageSize).toBe(pageSize);
    expect(page2.body.page).toBe(2);
    expect(page2.body.pageSize).toBe(pageSize);

    expect(page1.body.data.length).toBe(pageSize);
    expect(page2.body.data.length).toBe(pageSize);

    // Verify different tickets on each page
    const page1Numbers = page1.body.data.map((t: any) => t.ticketNumber);
    const page2Numbers = page2.body.data.map((t: any) => t.ticketNumber);

    expect(page1Numbers).not.toEqual(page2Numbers);
    expect(page1.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("API-21: invalid page values fall back to default (page 1)", async () => {
    const resNegative = await request(app)
      .get("/api/tickets")
      .query({ page: -1 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    const resNonNumeric = await request(app)
      .get("/api/tickets")
      .query({ page: "abc" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    const resZero = await request(app)
      .get("/api/tickets")
      .query({ page: 0 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(resNegative.status).toBe(200);
    expect(resNonNumeric.status).toBe(200);
    expect(resZero.status).toBe(200);

    expect(resNegative.body.page).toBe(1);
    expect(resNonNumeric.body.page).toBe(1);
    expect(resZero.body.page).toBe(1);
  });

  it("API-21: invalid pageSize values fall back to default (size 10)", async () => {
    const resNegative = await request(app)
      .get("/api/tickets")
      .query({ pageSize: -5 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    const resNonNumeric = await request(app)
      .get("/api/tickets")
      .query({ pageSize: "xyz" })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    const resZero = await request(app)
      .get("/api/tickets")
      .query({ pageSize: 0 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(resNegative.status).toBe(200);
    expect(resNonNumeric.status).toBe(200);
    expect(resZero.status).toBe(200);

    expect(resNegative.body.pageSize).toBe(10);
    expect(resNonNumeric.body.pageSize).toBe(10);
    expect(resZero.body.pageSize).toBe(10);
  });

  it("API-21: pageSize exceeding 50 is capped at 50", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({ pageSize: 100 })
      .set("X-Dev-Requester-Id", String(requesterA.id));

    expect(res.status).toBe(200);
    expect(res.body.pageSize).toBe(50);
  });
});

describe("GET /api/dev-requesters", () => {
  let inactiveRequester: { id: number };
  let activeRequester: { id: number };

  beforeAll(async () => {
    const prisma = getPrisma();
    const timestamp = Date.now();

    activeRequester = await prisma.devRequester.create({
      data: {
        name: "Active Requester",
        email: `active-${timestamp}@test-dev.example.com`,
        isActive: true,
      },
    });

    inactiveRequester = await prisma.devRequester.create({
      data: {
        name: "Inactive Requester",
        email: `inactive-${timestamp}@test-dev.example.com`,
        isActive: false,
      },
    });
  });

  it("API-22: returns only active requesters", async () => {
    const res = await request(app).get("/api/dev-requesters");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);

    // Verify no inactive requester in the list
    const requesterIds = res.body.data.map((r: any) => r.id);
    expect(requesterIds).not.toContain(inactiveRequester.id);

    // Verify active requester is in the list
    expect(requesterIds).toContain(activeRequester.id);

    // Verify all returned requesters have the required fields
    res.body.data.forEach((requester: any) => {
      expect(requester.id).toBeDefined();
      expect(requester.name).toBeDefined();
    });
  });
});