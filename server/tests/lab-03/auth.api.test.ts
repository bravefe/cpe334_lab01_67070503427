import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/lib/password.js";

const prisma = getPrisma();
const csrf = { "X-Requested-With": "TokTickIT" };
const activeEmail = "frodo.b@shiremail.example.com";
const inactiveEmail = "gandalf@istari.example.com";
const temporaryEmail = "merry.b@shiremail.example.com";
const initialPassword = "Password123!";

async function login(email = activeEmail, password = initialPassword) {
  return request(app)
    .post("/api/auth/login")
    .set(csrf)
    .send({ email, password });
}

describe("Lab 3 authentication API", () => {
  beforeEach(async () => {
    await prisma.user.update({
      where: { email: temporaryEmail },
      data: {
        passwordHash: await hashPassword(initialPassword),
        mustChangePassword: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("API-01: logs in with valid credentials and returns safe user data", async () => {
    const response = await login();
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("tt_session=")]),
    );
    expect(response.body.user).toEqual(
      expect.objectContaining({ email: activeEmail, role: "REQUESTER" }),
    );
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });

  it("API-02: changes a temporary password and refreshes the session", async () => {
    const agent = request.agent(app);
    const loggedIn = await agent
      .post("/api/auth/login")
      .send({ email: temporaryEmail, password: initialPassword });
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.user.mustChangePassword).toBe(true);

    const changed = await agent
      .post("/api/auth/change-password")
      .set(csrf)
      .send({
        currentPassword: initialPassword,
        newPassword: "NewPassword123!",
      });
    expect(changed.status).toBe(200);
    expect(changed.body).toEqual({ mustChangePassword: false });
    expect((await agent.get("/api/auth/me")).body.mustChangePassword).toBe(
      false,
    );
    expect((await agent.get("/api/categories")).status).toBe(200);
  });

  it("API-03: rejects invalid credentials generically", async () => {
    const response = await login(activeEmail, "WrongPassword123!");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  });

  it("API-04: rejects inactive accounts without a session", async () => {
    const response = await login(inactiveEmail);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_INACTIVE");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("API-05: rejects /me without a session", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(JSON.stringify(response.body)).not.toContain("Frodo");
  });

  it("API-06: invalidates a logged-out session", async () => {
    const agent = request.agent(app);
    expect(
      (
        await agent
          .post("/api/auth/login")
          .send({ email: activeEmail, password: initialPassword })
      ).status,
    ).toBe(200);
    expect((await agent.post("/api/auth/logout").set(csrf)).status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("API-07: rejects weak or unchanged passwords without changing state", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: temporaryEmail, password: initialPassword });
    const weak = await agent
      .post("/api/auth/change-password")
      .set(csrf)
      .send({ currentPassword: initialPassword, newPassword: "weak" });
    expect(weak.status).toBe(400);
    const unchanged = await agent
      .post("/api/auth/change-password")
      .set(csrf)
      .send({ currentPassword: initialPassword, newPassword: initialPassword });
    expect(unchanged.status).toBe(400);
    expect((await agent.get("/api/auth/me")).body.mustChangePassword).toBe(
      true,
    );
  });
});
