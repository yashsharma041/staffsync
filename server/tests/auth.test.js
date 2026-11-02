// Integration tests: need a running MongoDB. Uses MONGO_TEST_URI or a local "staffsync_test" DB.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret";

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

const email = `test${Date.now()}@example.com`;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/staffsync_test");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Authentication", () => {
  test("registers an employee and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Test User", email, password: "secret123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("employee");
  });

  test("ignores a client-supplied role", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Sneaky", email: `s${email}`, password: "secret123", role: "hr" });
    expect(res.body.user.role).toBe("employee");
  });

  test("rejects a wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "wrong-pass" });
    expect(res.status).toBe(401);
  });

  test("logs in and reads /me", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password: "secret123" });
    expect(login.status).toBe(200);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  test("blocks protected routes without a token", async () => {
    expect((await request(app).get("/api/leaves/me")).status).toBe(401);
  });

  test("blocks employees from HR routes", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password: "secret123" });
    const res = await request(app).get("/api/employees").set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(403);
  });
});
