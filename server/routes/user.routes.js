const router = require("express").Router();

const validate = require("../middlewares/validate.middleware");

const {
  registerSchema,
  loginSchema,

} = require("../validators/user.validator");

const {
  registerUser,
  loginUser,
  logoutUser
} = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");
const {
  getCurrentUser,
  updateCurrentUser,
  getApiKeyMetadata,
  regenerateApiKey,
} = require("../controllers/user.controller");
const { updateProfileSchema } = require("../validators/user.validator");

const { authLimiter } = require("../middlewares/rateLimiter");
router.get("/me",authLimiter, authenticate, getCurrentUser);
router.put("/me", authLimiter, authenticate, validate(updateProfileSchema), updateCurrentUser);
router.get("/me/api-key", authLimiter, authenticate, getApiKeyMetadata);
router.post("/me/api-key", authLimiter, authenticate, regenerateApiKey);

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUser
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  loginUser
);

router.post("/logout", authLimiter, authenticate, logoutUser);

module.exports = router;