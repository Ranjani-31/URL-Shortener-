const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// 1. Strict Auth Limiter (IP-based)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  limit: 50, // Max 10 attempts per 15 mins
  standardHeaders: "draft-8", // Sends modern RateLimit headers
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// 2. Plan-Aware Link Creation Limiter (User-ID based)
const createLinkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // Track by authenticated user ID (falls back to IP if unauthenticated)
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  // Pro users get 60 links/min; Free users get 10 links/min
  limit: (req) => (req.user?.plan === "pro" ? 60 : 10),
  message: {
    status: "fail",
    message: "Rate limit exceeded. Upgrade to Pro for higher API throughput.",
  },
});

// 3. General Dashboard & Analytics API Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 250, // 250 requests per 15 mins
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests. Please slow down and try again shortly.",
  },
});

module.exports = { authLimiter, createLinkLimiter, apiLimiter };