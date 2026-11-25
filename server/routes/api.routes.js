const router = require("express").Router();
const authenticateApiKey = require("../middlewares/apiKey.middleware");
const validate = require("../middlewares/validate.middleware");
const { createUrlSchema } = require("../validators/url.validator");
const { createShortUrl } = require("../controllers/url.controller");

router.post("/links", authenticateApiKey, validate(createUrlSchema), createShortUrl);

module.exports = router;
