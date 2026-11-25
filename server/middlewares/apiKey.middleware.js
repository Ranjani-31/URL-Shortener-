const crypto = require("crypto");
const User = require("../models/user.schema");
const AppError = require("../utils/AppError");

async function authenticateApiKey(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer (lf_live_[a-f0-9]{64})$/);

  if (!match) {
    return next(new AppError("A valid API key is required", 401));
  }

  try {
    const apiKeyHash = crypto.createHash("sha256").update(match[1]).digest("hex");
    const user = await User.findOne({ apiKeyHash }).select("_id plan");

    if (!user) {
      return next(new AppError("A valid API key is required", 401));
    }

    req.userId = user._id.toString();
    req.user = { id: req.userId, plan: user.plan };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticateApiKey;
