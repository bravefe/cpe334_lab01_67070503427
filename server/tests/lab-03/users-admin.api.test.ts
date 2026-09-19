import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request, { type Agent } from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

const prisma = getPrisma();
const csrf = { "X-Requested-With": "TokTickIT" };
const adminEmail = "elrond@rivendell.example.com";
const password = "Password123!";
const testEmail = "lab3.admin-test@example.com";
let admin: Agent;
let createdId = 0;

async function login(email: string, value = password) {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/login")
    .send({ email, password: value });
  expect(response.status).toBe(200);
  return agent;
}

const userData = (email = testEmail) => ({
  name: "Lab Three User",
  email,
  role: "IT_STAFF",
  isActive: true,
  initialPassword: password,
});

describe("Lab 3 administrator users API", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "lab3.admin-" } },
    });
    admin = await login(adminEmail);
  });

  afterAll(async () => {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isActive: true, role: "ADMINISTRATOR" },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: "lab3.admin-" } },
    });
    await prisma.$disconnect();
  });

  it("API-35: searches and filters the administrator user list", async () => {
    const search = await admin
      .get("/api/admin/users")
      .query({ q: "elrond", role: "ADMINISTRATOR" });
    expect(search.status).toBe(200);
    expect(search.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: adminEmail, role: "ADMINISTRATOR" }),
      ]),
    );
    expect(
      search.body.items.every(
        (user: { role: string }) => user.role === "ADMINISTRATOR",
      ),
    ).toBe(true);
  });

  it("API-36: creates a user with a temporary initial password", async () => {
    const response = await admin
      .post("/api/admin/users")
      .set(csrf)
      .send(userData());
    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({ email: testEmail, mustChangePassword: true }),
    );
    createdId = response.body.id;
    const newUser = await login(testEmail);
    expect((await newUser.get("/api/auth/me")).body.mustChangePassword).toBe(
      true,
    );
  });

  it("API-37: rejects creating a duplicate email case-insensitively", async () => {
    const response = await admin
      .post("/api/admin/users")
      .set(csrf)
      .send(userData(testEmail.toUpperCase()));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("DUPLICATE_EMAIL");
  });

  it("API-38: rejects changing an email to one used by another user", async () => {
    const response = await admin
      .patch(`/api/admin/users/${createdId}`)
      .set(csrf)
      .send({ email: adminEmail.toUpperCase() });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("DUPLICATE_EMAIL");
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: createdId } })).email,
    ).toBe(testEmail);
  });

  it("API-39: prevents an administrator from deactivating their own account", async () => {
    const self = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
    });
    const response = await admin
      .patch(`/api/admin/users/${self.id}`)
      .set(csrf)
      .send({ isActive: false });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("SELF_DEACTIVATION");
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: self.id } }))
        .isActive,
    ).toBe(true);
  });

  it("API-40: protects the last active administrator from deactivation or role change", async () => {
    const sole = await admin
      .post("/api/admin/users")
      .set(csrf)
      .send({
        ...userData("lab3.admin-sole@example.com"),
        role: "ADMINISTRATOR",
      });
    const original = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
    });
    await prisma.user.update({
      where: { id: original.id },
      data: { isActive: false },
    });
    const deactivate = await admin
      .patch(`/api/admin/users/${sole.body.id}`)
      .set(csrf)
      .send({ isActive: false });
    const roleChange = await admin
      .patch(`/api/admin/users/${sole.body.id}`)
      .set(csrf)
      .send({ role: "REQUESTER" });
    expect(deactivate.body.error.code).toBe("LAST_ADMIN");
    expect(roleChange.body.error.code).toBe("LAST_ADMIN");
    await prisma.user.update({
      where: { id: original.id },
      data: { isActive: true },
    });
  });

  it("API-41: resets a password as a new initial password", async () => {
    const newPassword = "ResetPassword123!";
    const response = await admin
      .patch(`/api/admin/users/${createdId}/password`)
      .set(csrf)
      .send({ newPassword });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mustChangePassword: true });
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: testEmail, password })
      ).status,
    ).toBe(401);
    await expect(
      (await login(testEmail, newPassword)).get("/api/auth/me"),
    ).resolves.toMatchObject({ body: { mustChangePassword: true } });
  });

  it("API-42: replaces a user's single role", async () => {
    const response = await admin
      .patch(`/api/admin/users/${createdId}`)
      .set(csrf)
      .send({ role: "REQUESTER" });
    expect(response.status).toBe(200);
    expect(response.body.role).toBe("REQUESTER");
  });

  it("API-43: rejects invalid roles and malformed emails without persisting them", async () => {
    const invalidRole = await admin
      .post("/api/admin/users")
      .set(csrf)
      .send({
        ...userData("lab3.admin-invalid@example.com"),
        role: "SUPER_ADMIN",
      });
    const invalidEmail = await admin
      .patch(`/api/admin/users/${createdId}`)
      .set(csrf)
      .send({ email: "not-an-email" });
    expect(invalidRole.status).toBe(400);
    expect(invalidEmail.status).toBe(400);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: createdId } })).email,
    ).toBe(testEmail);
  });
});
