const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/user.schema");
const Payment = require("../models/payment.schema");
const AppError = require("../utils/appError");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}); 

// 1. Create a Razorpay Order (POST /api/payment/create-order)
const createOrder = async (req, res, next) => {
  try {
    // Prevent already-Pro users from paying twice
    if (["pro", "premium"].includes(req.user.plan)) {
      return next(new AppError("You are already on the Pro plan.", 400));
    }

    const options = {
      amount: 499 * 100, // Razorpay expects amount in paise (₹499 = 49900 paise)
      currency: "INR",
      receipt: `rcpt_${req.user.id.toString().slice(-8)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      status: "success",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Safe to send public Key ID to frontend
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Payment Signature & Upgrade User (POST /api/payment/verify)
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(new AppError("Payment details are incomplete.", 400));
    }

    // Recreate the signature using your secret key
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Compare signatures safely
    if (expectedSignature !== razorpay_signature) {
      return next(new AppError("Payment verification failed. Invalid signature.", 400));
    }

    const existingPayment = await Payment.findOne({
      $or: [
        { razorpayOrderId: razorpay_order_id },
        { razorpayPaymentId: razorpay_payment_id },
      ],
    });

    if (existingPayment) {
      const existingUser = await User.findById(req.user.id);
      if (existingUser && existingUser.plan !== "pro") {
        existingUser.plan = "pro";
        existingUser.planActivatedAt = new Date();
        await existingUser.save();
      }

      return res.status(200).json({
        status: "success",
        message: "Payment already recorded.",
        plan: "pro",
      });
    }

    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (error) {
      paymentDetails = null;
    }

    await Payment.create({
      userId: req.user.id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: paymentDetails?.amount ?? 49900,
      currency: paymentDetails?.currency ?? "INR",
      planPurchased: "pro",
      status: "success",
    });

    // Signature is valid! Upgrade the user's plan in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        plan: "pro",
        planActivatedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Payment verified! Upgraded to Pro plan.",
      plan: updatedUser.plan,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .select("razorpayOrderId razorpayPaymentId amount currency planPurchased status createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = { createOrder, verifyPayment, getPaymentHistory };