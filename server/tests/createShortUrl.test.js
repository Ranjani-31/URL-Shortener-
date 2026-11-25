const { createShortUrl } = require("../controllers/url.controller");
const Url = require("../models/url.schema");

jest.mock("../models/url.schema", () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

describe("createShortUrl", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: "user123", plan: "free" },
      validatedBody: { originalUrl: "https://example.com" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
    Url.countDocuments.mockResolvedValue(0);
    Url.create.mockResolvedValue({
      _id: "url123",
      originalUrl: "https://example.com",
      shortCode: "generated",
      clickCount: 0,
      isActive: true,
    });
  });

  test("rejects free users who request a custom alias", async () => {
    req.validatedBody.alias = "my-brand";

    await expect(createShortUrl(req, res)).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(Url.create).not.toHaveBeenCalled();
  });

  test("creates a link with a generated short code for free users", async () => {
    await createShortUrl(req, res);

    const now = new Date();
    expect(Url.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        originalUrl: "https://example.com",
        shortCode: expect.stringMatching(/^[a-zA-Z0-9_-]{8}$/),
      }),
    );
    expect(Url.countDocuments).toHaveBeenCalledWith({
      userId: "user123",
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
    );
  });

  test("rejects free users who have already created 25 links this month", async () => {
    Url.countDocuments.mockResolvedValue(25);

    await expect(createShortUrl(req, res)).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringContaining("up to 25 links per month"),
    });

    expect(Url.create).not.toHaveBeenCalled();
  });

  test("allows Pro users to create a custom alias", async () => {
    req.user.plan = "pro";
    req.validatedBody.alias = "My-Brand";

    await createShortUrl(req, res);

    expect(Url.countDocuments).not.toHaveBeenCalled();
    expect(Url.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        shortCode: "my-brand",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
