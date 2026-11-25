const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../index");
const User = require("../models/user.schema");
const Url = require("../models/url.schema");

jest.mock("../models/user.schema", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../models/url.schema", () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
}));

const userId = "507f1f77bcf86cd799439011";
const apiKey = `lf_live_${"a".repeat(64)}`;

function authCookie() {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return `token=${token}`;
}

describe("versioned API endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue({ plan: "free" });
    Url.countDocuments.mockResolvedValue(0);
    Url.create.mockResolvedValue({
      _id: "507f1f77bcf86cd799439012",
      originalUrl: "https://example.com",
      shortCode: "generated",
      clickCount: 0,
      isActive: true,
    });
  });

  test("rejects invalid registration payloads", async () => {
    const response = await request(app)
      .post("/api/v1/users/register")
      .send({ name: "A", email: "not-an-email", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Request validation failed");
  });

  test.each([
    ["GET", "/api/v1/users/me"],
    ["PUT", "/api/v1/users/me"],
    ["GET", "/api/v1/users/me/api-key"],
    ["POST", "/api/v1/users/me/api-key"],
    ["POST", "/api/v1/users/logout"],
    ["GET", "/api/v1/urls/analytics"],
    ["GET", "/api/v1/urls/my"],
    ["PUT", `/api/v1/urls/${userId}`],
    ["PATCH", `/api/v1/urls/${userId}/status`],
    ["DELETE", `/api/v1/urls/${userId}`],
    ["POST", "/api/v1/payment/create-order"],
    ["POST", "/api/v1/payment/verify"],
    ["GET", "/api/v1/payment/history"],
  ])("requires authentication for %s %s", async (method, path) => {
    const response = await request(app)[method.toLowerCase()](path);

    expect(response.status).toBe(401);
  });

  test("requires an API key to create a link through the API endpoint", async () => {
    const response = await request(app)
      .post("/api/v1/links")
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(401);
    expect(Url.create).not.toHaveBeenCalled();
  });

  test("protects the authenticated URL creation endpoint", async () => {
    const response = await request(app)
      .post("/api/v1/urls/shorten")
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(401);
    expect(Url.create).not.toHaveBeenCalled();
  });

  test("creates a link through the v1 endpoint for an authenticated free user", async () => {
    const response = await request(app)
      .post("/api/v1/urls/shorten")
      .set("Cookie", authCookie())
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(Url.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, originalUrl: "https://example.com" }),
    );
  });

  test("blocks creation at the free monthly limit", async () => {
    Url.countDocuments.mockResolvedValue(25);

    const response = await request(app)
      .post("/api/v1/urls/shorten")
      .set("Cookie", authCookie())
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(429);
    expect(response.body.message).toContain("25 links per month");
    expect(Url.create).not.toHaveBeenCalled();
  });

  test("creates a link through the v1 API-key endpoint", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => userId },
        plan: "pro",
      }),
    });

    const response = await request(app)
      .post("/api/v1/links")
      .set("Authorization", `Bearer ${apiKey}`)
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(201);
    expect(Url.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, originalUrl: "https://example.com" }),
    );
    expect(Url.countDocuments).not.toHaveBeenCalled();
  });

  test("rejects API requests on the old unversioned paths", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(404);
  });

  test("redirect endpoint reports unknown short codes", async () => {
    Url.findOne.mockResolvedValue(null);

    const response = await request(app).get("/unknown-code");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("URL not found");
  });
});
