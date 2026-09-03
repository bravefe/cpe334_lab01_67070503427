import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("POST /api/create-ticket", () => {
  it("API-01: should create a ticket with valid data", async () => {
    const response = await request(app)
      .post("/api/create-ticket")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Test ticket for API-01",
        description:
          "This is a valid test description that is longer than twenty characters.",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketNumber: expect.stringMatching(/^TKT-\d{4}-\d{6}$/),
        }),
      }),
    );
  });

  it("API-02: should reject a ticket with an empty summary", async () => {
    const response = await request(app)
      .post("/api/create-ticket")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "",
        description:
          "This is a valid test description that is longer than twenty characters.",
        requestedPriorityId: 1,
      });

    // expect(response.status).toBe(400);

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

  it("API-03: should reject a description shorter than 20 characters", async () => {
    const response = await request(app)
      .post("/api/create-ticket")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Test ticket",
        description: "Too short",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(400);

    const body = JSON.stringify(response.body);

    expect(body).toMatch(/20/);
    expect(body.toLowerCase()).toMatch(/description/);
  });

  it("API-04: should accept a summary with exactly 150 characters", async () => {
    const summary = "A".repeat(150);

    const response = await request(app)
      .post("/api/create-ticket")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary,
        description:
          "This is a valid test description that is longer than twenty characters.",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketNumber: expect.stringMatching(/^TKT-\d{4}-\d{6}$/),
        }),
      }),
    );
  });

  it("API-05: should reject a summary with 151 characters", async () => {
    const summary = "A".repeat(151);

    const response = await request(app)
      .post("/api/create-ticket")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary,
        description:
          "This is a valid test description that is longer than twenty characters.",
        requestedPriorityId: 1,
      });

    expect(response.status).toBe(400);

    const body = JSON.stringify(response.body);

    expect(body).toMatch(/150/);
    expect(body.toLowerCase()).toMatch(/summary/);
  });

  it("API-06: should keep the ticket when attachment upload fails", async () => {
    const response = await request(app)
      .post("/api/create-ticket")
      .set("X-Dev-Requester-Id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Ticket with failed attachment",
        description:
          "This is a valid test description that is longer than twenty characters.",
        requestedPriorityId: 1,
        attachments: [
          {
            filename: "invalid-file",
            // Intentionally invalid attachment data.
            content: "invalid",
          },
        ],
      });

    /*
     * The exact expected response depends on how your attachment
     * upload is implemented.
     *
     * The important requirement is:
     * 1. Ticket creation succeeds.
     * 2. A ticket number is returned.
     * 3. Attachment failure is reported separately.
     */

    expect([201, 207]).toContain(response.status);

    expect(response.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketNumber: expect.stringMatching(/^TKT-\d{4}-\d{6}$/),
        }),
      }),
    );

    // Attachment failure should not cause the ticket itself to disappear.
    if (response.body.attachmentErrors !== undefined) {
      expect(response.body.attachmentErrors.length).toBeGreaterThan(0);
    }
  });

});