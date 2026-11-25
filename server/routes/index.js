const express = require("express");
const { apiLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();
const v1Router = express.Router();

v1Router.use("/users", require("./user.routes"));
v1Router.use("/urls", require("./url.routes"));
v1Router.use("/auth", require("./auth.routes"));
v1Router.use("/payment", require("./payment.routes"));
v1Router.use("/", require("./api.routes"));

router.use("/api/v1", apiLimiter, v1Router);
router.use("/", require("./redirect.routes"));

module.exports = router;