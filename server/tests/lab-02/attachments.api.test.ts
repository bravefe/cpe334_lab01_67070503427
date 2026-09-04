import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { maxFileSize, prepareUploadDirectory } from "../../src/services/attachmentService.js";

const prisma = getPrisma();
const requesterId = 1;
let ticketNumber = "";
let ticketId = 0;

async function upload(filename: string, content: Buffer, mimeType: string) {
  return request(app)
    .post(`/api/tickets/${ticketNumber}/attachments`)
    .set("X-Dev-Requester-Id", String(requesterId))
    .attach("file", content, { filename, contentType: mimeType });
}

async function createTicket() {
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requesterId,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Attachment API test ticket",
      description: "This ticket exists to test attachment lifecycle behavior.",
      requestedPriorityId: 1,
      currentStatusId: 1,
    },
  });
  ticketNumber = ticket.ticketNumber;
  ticketId = ticket.id;
}

describe("Attachment API", () => {
  beforeAll(async () => {
    await prepareUploadDirectory();
  });

  beforeEach(async () => {
    await createTicket();
  });

  afterEach(async () => {
    await prisma.attachment.deleteMany({ where: { ticketId } });
    await prisma.ticket.delete({ where: { id: ticketId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("API-07: rejects GIF attachments without creating one", async () => {
    const response = await upload("image.gif", Buffer.from("gif data"), "image/gif");

    expect(response.status).toBe(415);
    expect(await prisma.attachment.count({ where: { ticketId } })).toBe(0);
  });

  it("API-08: rejects a valid PDF larger than 5 MB", async () => {
    const response = await upload("large.pdf", Buffer.alloc(maxFileSize + 1), "application/pdf");

    expect(response.status).toBe(413);
    expect(await prisma.attachment.count({ where: { ticketId } })).toBe(0);
  });

  it("API-09: rejects a sixth active attachment", async () => {
    for (let index = 0; index < 5; index += 1) {
      expect((await upload(`file-${index}.png`, Buffer.from(`file ${index}`), "image/png")).status).toBe(201);
    }

    const response = await upload("sixth.png", Buffer.from("sixth"), "image/png");

    expect(response.status).toBe(422);
    expect(await prisma.attachment.count({ where: { ticketId, status: "ACTIVE" } })).toBe(5);
  });

  it("API-10: uploads a valid attachment to an owned ticket", async () => {
    const response = await upload("evidence.png", Buffer.from("png data"), "image/png");

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(expect.objectContaining({
      originalFileName: "evidence.png",
      status: "ACTIVE",
    }));
    expect(await prisma.attachment.count({ where: { ticketId, status: "ACTIVE" } })).toBe(1);
  });

  it("API-11: lists active and removed attachment metadata", async () => {
    const activeUpload = await upload("active.png", Buffer.from("active"), "image/png");
    const removedUpload = await upload("removed.png", Buffer.from("removed"), "image/png");
    const removedId = removedUpload.body.data.attachmentId;

    expect((await request(app)
      .patch(`/api/attachments/${removedId}/remove`)
      .set("X-Dev-Requester-Id", String(requesterId))
      .send({ reason: "No longer needed" })).status).toBe(200);

    const response = await request(app)
      .get(`/api/tickets/${ticketNumber}/attachments`)
      .set("X-Dev-Requester-Id", String(requesterId));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ attachmentId: activeUpload.body.data.attachmentId, status: "ACTIVE" }),
      expect.objectContaining({ attachmentId: removedId, status: "REMOVED", removalReason: "No longer needed" }),
    ]));
  });

  it("API-12: downloads an active attachment with its original content", async () => {
    const content = Buffer.from("downloadable attachment content");
    const uploadResponse = await upload("original.pdf", content, "application/pdf");
    const response = await request(app)
      .get(`/api/attachments/${uploadResponse.body.data.attachmentId}/download`)
      .set("X-Dev-Requester-Id", String(requesterId));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(content);
    expect(response.headers["content-disposition"]).toContain("original.pdf");
  });

  it("API-13: removes an attachment with a valid reason", async () => {
    const uploadResponse = await upload("remove-me.png", Buffer.from("remove me"), "image/png");
    const response = await request(app)
      .patch(`/api/attachments/${uploadResponse.body.data.attachmentId}/remove`)
      .set("X-Dev-Requester-Id", String(requesterId))
      .send({ reason: "Uploaded by mistake" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({ status: "REMOVED", removalReason: "Uploaded by mistake" }));
  });

  it("API-14: rejects an empty removal reason and keeps the attachment active", async () => {
    const uploadResponse = await upload("keep-me.png", Buffer.from("keep me"), "image/png");
    const response = await request(app)
      .patch(`/api/attachments/${uploadResponse.body.data.attachmentId}/remove`)
      .set("X-Dev-Requester-Id", String(requesterId))
      .send({ reason: "   " });

    expect(response.status).toBe(400);
    expect(await prisma.attachment.findUniqueOrThrow({ where: { id: uploadResponse.body.data.attachmentId } })).toEqual(expect.objectContaining({ status: "ACTIVE", removedAt: null }));
  });

  it("API-15: does not download a removed attachment", async () => {
    const uploadResponse = await upload("removed.png", Buffer.from("removed"), "image/png");
    const attachmentId = uploadResponse.body.data.attachmentId;
    await request(app)
      .patch(`/api/attachments/${attachmentId}/remove`)
      .set("X-Dev-Requester-Id", String(requesterId))
      .send({ reason: "Removed for testing" });

    const response = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Dev-Requester-Id", String(requesterId));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });

  it("API-16: hides another requester's attachment", async () => {
    const uploadResponse = await upload("private.png", Buffer.from("private"), "image/png");
    const attachmentId = uploadResponse.body.data.attachmentId;

    const listResponse = await request(app)
      .get(`/api/tickets/${ticketNumber}/attachments`)
      .set("X-Dev-Requester-Id", "2");
    const downloadResponse = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Dev-Requester-Id", "2");

    expect(listResponse.status).toBe(404);
    expect(downloadResponse.status).toBe(404);
    expect(listResponse.body.data).toBeUndefined();
    expect(downloadResponse.body).toEqual({});
  });

  it("API-24: allows an upload after an attachment is removed", async () => {
    const firstUpload = await upload("first.png", Buffer.from("first"), "image/png");
    await request(app)
      .patch(`/api/attachments/${firstUpload.body.data.attachmentId}/remove`)
      .set("X-Dev-Requester-Id", String(requesterId))
      .send({ reason: "Free active slot" });

    const response = await upload("replacement.png", Buffer.from("replacement"), "image/png");

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("ACTIVE");
    expect(await prisma.attachment.count({ where: { ticketId, status: "ACTIVE" } })).toBe(1);
  });
});