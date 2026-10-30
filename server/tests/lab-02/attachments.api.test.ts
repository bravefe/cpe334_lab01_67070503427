import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import {
  maxFileSize,
  prepareUploadDirectory,
} from "../../src/services/attachmentService.js";

const prisma = getPrisma();
const csrfHeaders = { "X-Requested-With": "TokTickIT" };
let requester: Agent;
let otherRequester: Agent;
let requesterId: number;
let categoryId: number;
let relatedSystemId: number;
let priorityId: number;
let newStatusId: number;
let ticketNumber = "";
let ticketId = 0;

async function authenticated(email: string): Promise<Agent> {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password: "Password123!" });
  expect(response.status).toBe(200);
  return agent;
}

async function upload(filename: string, content: Buffer, mimeType: string) {
  return requester
    .post(`/api/tickets/${ticketNumber}/attachments`)
    .set(csrfHeaders)
    .attach("file", content, { filename, contentType: mimeType });
}

async function createTicket() {
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requesterId,
      categoryId,
      relatedSystemId,
      summary: "Attachment API test ticket",
      description: "This ticket exists to test attachment lifecycle behavior.",
      requestedPriorityId: priorityId,
      currentStatusId: newStatusId,
    },
  });
  ticketNumber = ticket.ticketNumber;
  ticketId = ticket.id;
}

describe("Attachment API", () => {
  beforeAll(async () => {
    requester = await authenticated("frodo.b@shiremail.example.com");
    otherRequester = await authenticated("sam.gamgee@shiremail.example.com");
    const [requesterUser, category, system, priority, newStatus] =
      await Promise.all([
        prisma.user.findUniqueOrThrow({
          where: { email: "frodo.b@shiremail.example.com" },
        }),
        prisma.category.findFirstOrThrow({ where: { isActive: true } }),
        prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } }),
        prisma.priority.findFirstOrThrow(),
        prisma.status.findFirstOrThrow({ where: { name: "New" } }),
      ]);
    requesterId = requesterUser.id;
    categoryId = category.id;
    relatedSystemId = system.id;
    priorityId = priority.id;
    newStatusId = newStatus.id;
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

  it("rejects GIF attachments without creating one", async () => {
    const response = await upload(
      "image.gif",
      Buffer.from("gif data"),
      "image/gif",
    );

    expect(response.status).toBe(415);
    expect(await prisma.attachment.count({ where: { ticketId } })).toBe(0);
  });

  it("rejects a valid PDF larger than 5 MB", async () => {
    const response = await upload(
      "large.pdf",
      Buffer.alloc(maxFileSize + 1),
      "application/pdf",
    );

    expect(response.status).toBe(413);
    expect(await prisma.attachment.count({ where: { ticketId } })).toBe(0);
  });

  it("rejects a sixth active attachment", async () => {
    for (let index = 0; index < 5; index += 1) {
      const response = await upload(
        `file-${index}.png`,
        Buffer.from(`file ${index}`),
        "image/png",
      );
      expect(response.status).toBe(201);
    }

    const response = await upload(
      "sixth.png",
      Buffer.from("sixth"),
      "image/png",
    );

    expect(response.status).toBe(422);
    expect(await prisma.attachment.count({ where: { ticketId, status: "ACTIVE" } })).toBe(5);
  });

  it("uploads a valid attachment to an owned ticket", async () => {
    const response = await upload(
      "evidence.png",
      Buffer.from("png data"),
      "image/png",
    );

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        originalFileName: "evidence.png",
        status: "ACTIVE",
      }),
    );
    expect(await prisma.attachment.count({ where: { ticketId, status: "ACTIVE" } })).toBe(1);
  });

  it("lists active and removed attachment metadata", async () => {
    const activeUpload = await upload(
      "active.png",
      Buffer.from("active"),
      "image/png",
    );
    const removedUpload = await upload(
      "removed.png",
      Buffer.from("removed"),
      "image/png",
    );
    const removedId = removedUpload.body.data.attachmentId;

    expect(
      (
        await requester
          .patch(`/api/attachments/${removedId}/remove`)
          .set(csrfHeaders)
          .send({ reason: "No longer needed" })
      ).status,
    ).toBe(200);

    const response = await requester.get(
      `/api/tickets/${ticketNumber}/attachments`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attachmentId: activeUpload.body.data.attachmentId,
          status: "ACTIVE",
        }),
        expect.objectContaining({
          attachmentId: removedId,
          status: "REMOVED",
          removalReason: "No longer needed",
        }),
      ]),
    );
  });

  it("downloads an active attachment with its original content", async () => {
    const content = Buffer.from("downloadable attachment content");
    const uploadResponse = await upload(
      "original.pdf",
      content,
      "application/pdf",
    );
    const response = await requester.get(
      `/api/attachments/${uploadResponse.body.data.attachmentId}/download`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(content);
    expect(response.headers["content-disposition"]).toContain("original.pdf");
  });

  it("removes an attachment with a valid reason", async () => {
    const uploadResponse = await upload(
      "remove-me.png",
      Buffer.from("remove me"),
      "image/png",
    );
    const response = await requester
      .patch(`/api/attachments/${uploadResponse.body.data.attachmentId}/remove`)
      .set(csrfHeaders)
      .send({ reason: "Uploaded by mistake" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        status: "REMOVED",
        removalReason: "Uploaded by mistake",
      }),
    );
  });

  it("rejects an empty removal reason and keeps the attachment active", async () => {
    const uploadResponse = await upload(
      "keep-me.png",
      Buffer.from("keep me"),
      "image/png",
    );
    const attachmentId = uploadResponse.body.data.attachmentId;
    const response = await requester
      .patch(`/api/attachments/${attachmentId}/remove`)
      .set(csrfHeaders)
      .send({ reason: "   " });

    expect(response.status).toBe(400);
    expect(
      await prisma.attachment.findUniqueOrThrow({ where: { id: attachmentId } }),
    ).toEqual(expect.objectContaining({ status: "ACTIVE", removedAt: null }));
  });

  it("does not download a removed attachment", async () => {
    const uploadResponse = await upload(
      "removed.png",
      Buffer.from("removed"),
      "image/png",
    );
    const attachmentId = uploadResponse.body.data.attachmentId;
    await requester
      .patch(`/api/attachments/${attachmentId}/remove`)
      .set(csrfHeaders)
      .send({ reason: "Removed for testing" });

    const response = await requester.get(
      `/api/attachments/${attachmentId}/download`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });

  it("hides another requester's attachment", async () => {
    const uploadResponse = await upload(
      "private.png",
      Buffer.from("private"),
      "image/png",
    );
    const attachmentId = uploadResponse.body.data.attachmentId;

    const listResponse = await otherRequester.get(
      `/api/tickets/${ticketNumber}/attachments`,
    );
    const downloadResponse = await otherRequester.get(
      `/api/attachments/${attachmentId}/download`,
    );

    expect(listResponse.status).toBe(404);
    expect(downloadResponse.status).toBe(404);
    expect(listResponse.body.data).toBeUndefined();
    expect(downloadResponse.body).toEqual({});
  });

  it("allows an upload after an attachment is removed", async () => {
    const firstUpload = await upload(
      "first.png",
      Buffer.from("first"),
      "image/png",
    );
    await requester
      .patch(`/api/attachments/${firstUpload.body.data.attachmentId}/remove`)
      .set(csrfHeaders)
      .send({ reason: "Free active slot" });

    const response = await upload(
      "replacement.png",
      Buffer.from("replacement"),
      "image/png",
    );

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("ACTIVE");
    expect(await prisma.attachment.count({ where: { ticketId, status: "ACTIVE" } })).toBe(1);
  });
});
