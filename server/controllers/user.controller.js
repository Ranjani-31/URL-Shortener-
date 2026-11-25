const crypto = require("crypto");
const User = require("../models/user.schema");
const Url = require("../models/url.schema");
const AppError = require("../utils/AppError");

const MONTHLY_LINK_LIMIT = 25;

function serializeUser(user, linksUsed) {
  return {
  
    name: user.name,
    email: user.email,
    isGoogleConnected: Boolean(user.googleId),
    createdAt: user.createdAt,
    plan: user.plan,
    linksUsed,
    linkLimit: MONTHLY_LINK_LIMIT,
  };
}

async function monthlyLinksUsed(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return Url.countDocuments({ userId, createdAt: { $gte: monthStart } });
}

exports.getCurrentUser = async (req, res) => {
 
  const [user, linksUsed] = await Promise.all([
    User.findById(req.user.id).select("name email googleId createdAt plan"),
    monthlyLinksUsed(req.user.id),
  ]);

  if (!user) throw new AppError("User not found", 404);

  return res.status(200).json({
    status: "success",
    data: { user: serializeUser(user, linksUsed) },
  });
};

exports.updateCurrentUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { name: req.validatedBody.name } },
    { new: true, runValidators: true },
  ).select("name email googleId createdAt plan");

  if (!user) throw new AppError("User not found", 404);

  return res.status(200).json({
    status: "success",
    data: { user: serializeUser(user, await monthlyLinksUsed(req.user.id)) },
  });
};

exports.getApiKeyMetadata = async (req, res) => {
  const user = await User.findById(req.user.id).select("apiKeyPrefix");
  if (!user) throw new AppError("User not found", 404);

  return res.status(200).json({
    status: "success",
    data: {
      hasApiKey: Boolean(user.apiKeyPrefix),
      prefix: user.apiKeyPrefix || null,
    },
  });
};

exports.regenerateApiKey = async (req, res) => {
  const apiKey = `lf_live_${crypto.randomBytes(32).toString("hex")}`;
  const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { apiKeyHash, apiKeyPrefix: apiKey.slice(0, 16) } },
    { new: true },
  ).select("apiKeyPrefix");

  if (!user) throw new AppError("User not found", 404);

  return res.status(201).json({
    status: "success",
    data: { apiKey, prefix: user.apiKeyPrefix },
  });
};
