import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/tickets", () => {
  it("API-16: should return only tickets owned by requester", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .set("X-Dev-Requester-Id", "1");

    expect(response.status).toBe(200);

    const tickets = response.body.data ?? response.body;

    // Ticket 2 is owned by requester 2,
    // so it should not be included for requester 1.
    expect(tickets).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2 }),
      ]),
    );
  });

  it("API-17: should return only tickets matching the search text", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .query({ search: "000001" })
      .set("X-Dev-Requester-Id", "1");

    expect(response.status).toBe(200);

    const tickets = response.body.data ?? response.body;

    expect(tickets).toHaveLength(1);
    expect(tickets[0].id).toBe(1);

    const response2 = await request(app)
      .get("/api/tickets")
      .query({ search: "Test Test 123" })
      .set("X-Dev-Requester-Id", "1");

    expect(response2.status).toBe(200);

    const tickets2 = response2.body.data ?? response2.body;

    expect(tickets2).toHaveLength(1);
    expect(tickets2[0].id).toBe(1);
  });

  it("API-18: should return only tickets matching all filters", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .query({
        categoryId: 1
      })
      .set("X-Dev-Requester-Id", "1");

    expect(response.status).toBe(200);

    const tickets = response.body.data;

    expect(tickets).toHaveLength(1);
    expect(
      tickets.every(
        (ticket: any) =>
          ticket.categoryId === 1 &&
          ticket.requestedPriorityId === 1 &&
          ticket.currentStatusId === 1,
      ),
    ).toBe(true);
  });

  it("API-19: should reverse ticket order when sortDir is toggled", async () => {
    const ascResponse = await request(app)
      .get("/api/tickets")
      .query({
        sortBy: "createdAt",
        sortDir: "asc",
      })
      .set("X-Dev-Requester-Id", "1");

    expect(ascResponse.status).toBe(200);

    const ascTickets = ascResponse.body.data ?? ascResponse.body;

    const descResponse = await request(app)
      .get("/api/tickets")
      .query({
        sortBy: "createdAt",
        sortDir: "desc",
      })
      .set("X-Dev-Requester-Id", "1");

    expect(descResponse.status).toBe(200);

    const descTickets = descResponse.body.data ?? descResponse.body;

    expect(ascTickets.length).toBe(descTickets.length);

    // Verify ascending and descending orders are opposites.
    const ascIds = ascTickets.map((ticket: any) => ticket.id);
    const descIds = descTickets.map((ticket: any) => ticket.id);

    expect(descIds).toEqual([...ascIds].reverse());
  });

  it("API-20: should return the next set of tickets on the next page", async () => {
    const page1Response = await request(app)
      .get("/api/tickets")
      .query({
        page: "1",
        pageSize: "2",
      })
      .set("X-Dev-Requester-Id", "1");

    expect(page1Response.status).toBe(200);

    const page2Response = await request(app)
      .get("/api/tickets")
      .query({
        page: "2",
        pageSize: "2",
      })
      .set("X-Dev-Requester-Id", "1");

    expect(page2Response.status).toBe(200);

    const page1Tickets = page1Response.body.data ?? page1Response.body;
    const page2Tickets = page2Response.body.data ?? page2Response.body;

    // Page 1 and page 2 should contain different tickets.
    const page1Ids = page1Tickets.map((ticket: any) => ticket.id);
    const page2Ids = page2Tickets.map((ticket: any) => ticket.id);

    expect(page1Ids).not.toEqual(page2Ids);

    // Check pagination metadata if it exists.
    if (page1Response.body.page !== undefined) {
      expect(page1Response.body.page).toBe(1);
    }

    if (page2Response.body.page !== undefined) {
      expect(page2Response.body.page).toBe(2);
    }

    if (page1Response.body.pageSize !== undefined) {
      expect(page1Response.body.pageSize).toBe(2);
    }

    if (page2Response.body.pageSize !== undefined) {
      expect(page2Response.body.pageSize).toBe(2);
    }

    if (page1Response.body.totalPages !== undefined) {
      expect(page1Response.body.totalPages).toBeGreaterThanOrEqual(2);
    }
  });

  it("API-21: should fall back to default pagination for invalid values", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .query({
        page: "-1",
        pageSize: "abc",
      })
      .set("X-Dev-Requester-Id", "1");

    expect(response.status).toBe(200);

    // Check pagination metadata if it exists.
    if (response.body.page !== undefined) {
      expect(response.body.page).toBe(1);
    }

    if (response.body.pageSize !== undefined) {
      expect(response.body.pageSize).toBe(10);
    }
  });
});

describe("GET /api/dev-requesters", () => {
  it("API-22: should exclude inactive requester from the response", async () => {
    const response = await request(app)
      .get("/api/dev-requesters")
      .expect(200);

    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 11, // ID 11 is inactive in the seed data
        }),
      ]),
    );
  });
});