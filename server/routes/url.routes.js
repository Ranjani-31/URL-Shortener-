const router = require("express").Router();

const validate = require("../middlewares/validate.middleware");

const {
  createUrlSchema,
  updateUrlSchema,
  updateUrlStatusSchema,
  urlIdParamsSchema,
} = require("../validators/url.validator");

const {
  createShortUrl,
  getUserUrls,
  updateUserUrl,
  updateUserUrlStatus,
  deleteUserUrl,
} = require("../controllers/url.controller");
const { getUserAnalytics } = require("../controllers/analytics.controller");

const authenticate = require("../middlewares/auth.middleware");
const { createLinkLimiter } = require("../middlewares/rateLimiter");

router.get("/analytics", authenticate, getUserAnalytics);
router.get("/my", authenticate, getUserUrls);
router.put(
  "/:id",
  authenticate,
  validate(urlIdParamsSchema, "params"),
  validate(updateUrlSchema),
  updateUserUrl
);
router.patch(
  "/:id/status",
  authenticate,
  validate(urlIdParamsSchema, "params"),
  validate(updateUrlStatusSchema),
  updateUserUrlStatus
);
router.delete(
  "/:id",
  authenticate,
  validate(urlIdParamsSchema, "params"),
  deleteUserUrl
);

router.post(
  "/shorten",
  authenticate,
  createLinkLimiter,
  validate(createUrlSchema, "body"),
  createShortUrl
);



module.exports = router;