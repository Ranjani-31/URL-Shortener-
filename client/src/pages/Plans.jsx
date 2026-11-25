import { useState } from "react";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { useLinks } from "../components/dashboard/useLinks";
import axios from "../api/axios";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise;

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT_URL;
      script.onload = () => {
        if (window.Razorpay) {
          resolve();
        } else {
          razorpayScriptPromise = undefined;
          reject(new Error("Razorpay checkout could not be initialized."));
        }
      };
      script.onerror = () => {
        razorpayScriptPromise = undefined;
        reject(new Error("Unable to load Razorpay checkout. Please try again."));
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function getPaymentErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Unable to complete payment. Please try again."
  );
}

const freeFeatures = [
  "25 short links per month",
  "Link analytics",
  "Standard redirects",
];

const proFeatures = [
  "Unlimited short links",
  "Custom aliases",
  "Expiration dates",
  "Advanced link analytics",
  "Priority support",
];

function Plans() {
  const { currentUser, isAccountLoading, setCurrentUser } = useLinks();
  const [notice, setNotice] = useState("");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const rawPlan = currentUser?.plan?.toLowerCase();
  const currentPlan = rawPlan === "premium" || rawPlan === "pro" ? "pro" : "free";

  async function choosePro() {
    setNotice("");
    setIsCheckoutLoading(true);

    try {
      const orderResponse = await axios.post("/api/v1/payment/create-order");
      const order = orderResponse.data;

      if (!order?.orderId || !order?.keyId || !order?.amount || !order?.currency) {
        throw new Error("The server returned an invalid payment order.");
      }

      await loadRazorpayScript();

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "URL Shortener",
        description: "Pro plan upgrade",
        order_id: order.orderId,
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
        },
        theme: { color: "#2563eb" },
        handler: async (payment) => {
          try {
            const verificationResponse = await axios.post("/api/v1/payment/verify", {
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });

            if (verificationResponse.data?.plan !== "pro") {
              throw new Error("Payment was received, but the plan upgrade was not confirmed.");
            }

            setCurrentUser((user) =>
              user ? { ...user, plan: verificationResponse.data.plan } : user,
            );
            setNotice("Payment successful! Your account is now on the Pro plan.");
          } catch (error) {
            console.error("Unable to verify Razorpay payment:", error);
            setNotice(getPaymentErrorMessage(error));
          } finally {
            setIsCheckoutLoading(false);
          }
        },
        modal: {
          ondismiss: () => setIsCheckoutLoading(false),
        },
      });

      checkout.on("payment.failed", (event) => {
        setNotice(
          event.error?.description ||
            "Payment failed. Please try again or choose another payment method.",
        );
        setIsCheckoutLoading(false);
      });

      checkout.open();
    } catch (error) {
      console.error("Unable to start Razorpay checkout:", error);
      setNotice(getPaymentErrorMessage(error));
      setIsCheckoutLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles size={13} />
          Simple pricing
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Choose the plan that fits
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Start free and upgrade when you need more control over your links.
        </p>
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm text-blue-800">
          {notice}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Zap size={20} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Free</h2>
              <p className="mt-1 text-sm text-slate-500">For personal projects and casual use.</p>
            </div>
            {currentPlan === "free" && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                Current
              </span>
            )}
          </div>

          <div className="mt-6 flex items-end gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">₹0</span>
            <span className="pb-1 text-sm text-slate-500">/ month</span>
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Check size={12} strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={isAccountLoading || currentPlan === "free"}
            className="mt-8 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-400"
          >
            {currentPlan === "free" ? "Current plan" : "Switch to Free"}
          </button>
        </article>

        <article className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-lg shadow-blue-100/70">
          <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Most popular
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Crown size={20} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Pro</h2>
          <p className="mt-1 text-sm text-slate-500">For teams and high-volume link sharing.</p>

          <div className="mt-6 flex items-end gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">₹499</span>
            <span className="pb-1 text-sm text-slate-500">one-time</span>
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Check size={12} strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={choosePro}
            disabled={isAccountLoading || isCheckoutLoading || currentPlan === "pro"}
            className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            {currentPlan === "pro"
              ? "Current plan"
              : isCheckoutLoading
                ? "Preparing checkout..."
                : "Upgrade to Pro"}
          </button>
        </article>
      </div>

      <p className="text-center text-xs text-slate-400">
        One-time payment. No recurring charge.
      </p>
    </div>
  );
}

export default Plans;
