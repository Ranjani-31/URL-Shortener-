const router = require("express").Router();
const validate = require("../middlewares/validate.middleware");
const { redirectParamsSchema } = require("../validators/url.validator");
const { redirectUrl } = require("../controllers/url.controller");

router.get(
  "/:shortCode",
  validate(redirectParamsSchema, "params"),
  redirectUrl
);

module.exports = router;
