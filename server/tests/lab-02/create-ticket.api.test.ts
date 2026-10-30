import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const csrfHeaders = { "X-Requested-With": "TokTickIT" };
const requesterEmail = "frodo.b@shiremail.example.com";
let requester: Agent;
let categoryId: number;
let relatedSystemId: number;
let requestedPriorityId: number;
const createdTicketIds: number[] = [];

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password: "Password123!" });
  expect(response.status).toBe(200);
  return agent;
}

async function createTicket(overrides: Record<string, unknown> = {}) {
  const response = await requester
    .post("/api/tickets")
    .set(csrfHeaders)
    .send({
      categoryId,
      relatedSystemId,
      summary: "Test ticket for the current API",
      description:
        "This is a valid test description that is longer than twenty characters.",
      requestedPriorityId,
      ...overrides,
    });

  if (response.status === 201 && Number.isInteger(response.body.data?.id)) {
    createdTicketIds.push(response.body.data.id);
  }
  return response;
}

describe("POST /api/tickets", () => {
  beforeAll(async () => {
    requester = await authenticated(requesterEmail);
    const [category, relatedSystem, priority] = await Promise.all([
      prisma.category.findFirst({ where: { isActive: true } }),
      prisma.relatedSystem.findFirst({ where: { isActive: true } }),
      prisma.priority.findFirst(),
    ]);
    if (!category || !relatedSystem || !priority) {
      throw new Error("Ticket reference data is missing from the test database");
    }
    categoryId = category.id;
    relatedSystemId = relatedSystem.id;
    requestedPriorityId = priority.id;
  });

  afterAll(async () => {
    if (createdTicketIds.length) {
      await prisma.ticket.deleteMany({
        where: { id: { in: createdTicketIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("generates unique ticket numbers in the expected format", async () => {
    const response1 = await createTicket({ summary: "First unique test ticket" });
    const response2 = await createTicket({ summary: "Second unique test ticket" });

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);

    const ticketNumber1 = response1.body.data.ticketNumber;
    const ticketNumber2 = response2.body.data.ticketNumber;
    expect(ticketNumber1).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(ticketNumber2).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(ticketNumber1).not.toBe(ticketNumber2);
  });

  it("creates a ticket with valid data", async () => {
    const response = await createTicket();

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        ticketNumber: expect.stringMatching(/^TKT-\d{4}-\d{6}$/),
      }),
    );
  });

  it("rejects a ticket with an empty summary", async () => {
    const response = await createTicket({ summary: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fieldErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "summary",
          message: "Summary must be between 5 and 150 characters.",
        }),
      ]),
    );
  });

  it("rejects a description shorter than 20 characters", async () => {
    const response = await createTicket({
      summary: "Short description case",
      description: "Too short",
    });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toMatch(/20/);
    expect(JSON.stringify(response.body).toLowerCase()).toMatch(/description/);
  });

  it("accepts a summary with exactly 150 characters", async () => {
    const response = await createTicket({ summary: "A".repeat(150) });

    expect(response.status).toBe(201);
    expect(response.body.data.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
  });

  it("rejects a summary with 151 characters", async () => {
    const response = await createTicket({ summary: "A".repeat(151) });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toMatch(/150/);
    expect(JSON.stringify(response.body).toLowerCase()).toMatch(/summary/);
  });

  it.each([
    ["categoryId", 9999, undefined, undefined],
    ["relatedSystemId", undefined, 9999, undefined],
    ["requestedPriorityId", undefined, undefined, 9999],
  ])("rejects an invalid %s reference", async (
    field,
    invalidCategoryId,
    invalidRelatedSystemId,
    invalidPriorityId,
  ) => {
    const response = await createTicket({
      ...(invalidCategoryId === undefined
        ? {}
        : { categoryId: invalidCategoryId }),
      ...(invalidRelatedSystemId === undefined
        ? {}
        : { relatedSystemId: invalidRelatedSystemId }),
      ...(invalidPriorityId === undefined
        ? {}
        : { requestedPriorityId: invalidPriorityId }),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fieldErrors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field })]),
    );
  });
});
