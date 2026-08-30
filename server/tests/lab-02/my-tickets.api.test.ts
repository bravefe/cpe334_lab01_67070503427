import { describe, it, expect } from "vitest";
import request from "supertest";

import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();

describe("GET /api/tickets", () => {
  // `GET /api/tickets` as Requester B | List contains none of Requester A's Tickets
  it("does not return Requester A's tickets to Requester B", async () => {
    const requesters = await prisma.devRequester.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
      take: 2,
    });

    expect(requesters.length).toBeGreaterThanOrEqual(2);

    const requesterA = requesters[0];
    const requesterB = requesters[1];

    const res = await request(app)
      .get("/api/tickets")
      .query({
        requesterId: requesterB.id,
      });

    expect(res.status).toBe(200);

    const tickets = res.body.tickets ?? res.body;

    expect(
      tickets.every(
        (ticket: { requesterId: number }) =>
          ticket.requesterId !== requesterA.id,
      ),
    ).toBe(true);
  });

  // `GET /api/tickets?search=<partial ticket #>` | Only Tickets whose number contains the text (case-insensitive) returned
  it("returns only tickets whose number contains the search text", async () => {
    const searchText = "000001";

    const res = await request(app)
      .get("/api/tickets")
      .query({
        search: searchText,
      });

    expect(res.status).toBe(200);

    const tickets = res.body.tickets ?? res.body;

    expect(
      tickets.every(
        (ticket: { ticketNumber: string }) =>
          ticket.ticketNumber
            .toLowerCase()
            .includes(searchText.toLowerCase()),
      ),
    ).toBe(true);
  });

  // API-18 — AC-16 / BR-13
  it("applies category and requested priority filters together", async () => {
    const category = await prisma.category.findUniqueOrThrow({
      where: {
        name: "Hardware",
      },
    });

    const priority = await prisma.priority.findUniqueOrThrow({
      where: {
        name: "Low",
      },
    });

    const res = await request(app)
      .get("/api/tickets")
      .query({
        category: category.id,
        requestedPriorityId: priority.id,
      });

    expect(res.status).toBe(200);

    const tickets = res.body.tickets ?? res.body;

    for (const ticket of tickets) {
      expect(ticket.categoryId).toBe(category.id);
      expect(ticket.requestedPriorityId).toBe(priority.id);
    }
  });

  // API-19 — AC-17
  it("reverses the ticket order when sortDir is toggled", async () => {
    const ascending = await request(app)
      .get("/api/tickets")
      .query({
        sortBy: "createdAt",
        sortDir: "asc",
        pageSize: 100,
      });

    const descending = await request(app)
      .get("/api/tickets")
      .query({
        sortBy: "createdAt",
        sortDir: "desc",
        pageSize: 100,
      });

    expect(ascending.status).toBe(200);
    expect(descending.status).toBe(200);

    const ascTickets = ascending.body.tickets ?? ascending.body;
    const descTickets = descending.body.tickets ?? descending.body;

    expect(descTickets.map((t: { id: number }) => t.id)).toEqual(
      [...ascTickets].reverse().map((t: { id: number }) => t.id),
    );
  });

  // API-20 — AC-18
  it("returns the next set of tickets when moving to the next page", async () => {
    const page1 = await request(app)
      .get("/api/tickets")
      .query({
        page: 1,
        pageSize: 10,
      });

    const page2 = await request(app)
      .get("/api/tickets")
      .query({
        page: 2,
        pageSize: 10,
      });

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    expect(page1.body.page).toBe(1);
    expect(page1.body.pageSize).toBe(10);

    expect(page2.body.page).toBe(2);
    expect(page2.body.pageSize).toBe(10);

    expect(page1.body.totalPages).toBe(10);
    expect(page2.body.totalPages).toBe(10);

    const page1Tickets = page1.body.tickets ?? [];
    const page2Tickets = page2.body.tickets ?? [];

    expect(page1Tickets.length).toBe(10);
    expect(page2Tickets.length).toBe(10);

    expect(
      page1Tickets.map((t: { id: number }) => t.id),
    ).not.toEqual(
      page2Tickets.map((t: { id: number }) => t.id),
    );
  });

  // API-21 — BR-15
  it("falls back to page 1 and page size 10 for invalid pagination values", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .query({
        page: -1,
        pageSize: "not-a-number",
      });

    expect(res.status).toBe(200);

    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
  });
});

describe("GET /api/dev-requesters", () => {
  // API-22 — AC-25 / BR-06
  it("does not return inactive requesters", async () => {
    const res = await request(app).get("/api/dev-requesters");

    expect(res.status).toBe(200);

    const requesters = res.body.requesters ?? res.body;

    expect(
      requesters.every(
        (requester: { isActive: boolean }) =>
          requester.isActive !== false,
      ),
    ).toBe(true);
  });
});
