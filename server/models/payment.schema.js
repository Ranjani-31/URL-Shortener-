const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
    required: true,
    unique: true, // Prevents the same payment receipt from being redeemed twice!
  },
  razorpaySignature: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true, // Stored in paise (e.g., 49900) or rupees (499)
  },
  currency: {
    type: String,
    default: "INR",
  },
  planPurchased: {
    type: String,
    default: "pro",
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);