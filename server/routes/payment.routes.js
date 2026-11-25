const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/auth.middleware");
const { createOrder, verifyPayment, getPaymentHistory } = require("../controllers/payment.controller");

router.post("/create-order", authenticate, createOrder);
router.post("/verify", authenticate, verifyPayment);
router.get("/history", authenticate, getPaymentHistory);

module.exports = router;