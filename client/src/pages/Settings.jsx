import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Clipboard,
  Code2,
  Copy,
  KeyRound,
  ShieldCheck,
  Sparkles,
  UserRound,
  ReceiptText,
} from "lucide-react";
import axios from "../api/axios";
import { useLinks } from "../components/dashboard/useLinks";

function Settings() {
  const navigate = useNavigate();
  const {
    currentUser,
    setCurrentUser,
    isAccountLoading,
    accountError,
    reloadAccount,
  } = useLinks();
  const [name, setName] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [keyInfo, setKeyInfo] = useState(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const isPro = ["pro", "premium"].includes(currentUser?.plan?.toLowerCase());

  useEffect(() => {
    let active = true;
    axios.get("/api/v1/users/me/api-key")
      .then((response) => {
        if (active) setKeyInfo(response.data.data);
      })
      .catch((requestError) => {
        console.error("Unable to load API key status:", requestError);
        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load API key status.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPro) return;

    let active = true;
    setPaymentsLoading(true);
    axios.get("/api/v1/payment/history")
      .then((response) => {
        if (active) setPayments(response.data?.data?.payments || []);
      })
      .catch((requestError) => {
        console.error("Unable to load payment history:", requestError);
        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load payment history.",
          );
        }
      })
      .finally(() => {
        if (active) setPaymentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isPro]);

  const linkLimit = currentUser?.linkLimit || 25;
  const linksUsed = currentUser?.linksUsed || 0;
  const usagePercent = Math.min(100, Math.round((linksUsed / linkLimit) * 100));
  const apiKeyDisplay = keyInfo?.hasApiKey
    ? `${keyInfo.prefix}${"•".repeat(20)}`
    : "No API key generated";
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const apiKeyForSnippet = newApiKey || "<YOUR_API_KEY>";
  const bearerHeader = ["Author", "ization: Bearer "].join("");
  const snippet = `curl -X POST ${apiBaseUrl}/api/v1/links \\
  -H "${bearerHeader}${apiKeyForSnippet}" \\
  -H "Content-Type: application/json" \\
  -d '{"originalUrl":"https://example.com"}'`;

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setError("");
      window.setTimeout(() => setCopied(""), 1800);
    } catch (copyError) {
      console.error(`Unable to copy ${label}:`, copyError);
      setError(`Unable to copy ${label}. Check your browser permissions.`);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await axios.put("/api/v1/users/me", {
        name: (name ?? currentUser?.name ?? "").trim(),
      });
      setCurrentUser(response.data.data.user);
      setName(response.data.data.user.name);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (requestError) {
      console.error("Unable to save profile:", requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to save profile changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function regenerateKey() {
    if (keyInfo?.hasApiKey && !window.confirm("Regenerate your API key? The current key will stop working immediately.")) return;
    setError("");
    setIsGeneratingKey(true);
    try {
      const response = await axios.post("/api/v1/users/me/api-key");
      setNewApiKey(response.data.data.apiKey);
      setKeyInfo({ hasApiKey: true, prefix: response.data.data.prefix });
      setNotice("Copy this key now. It will not be shown again.");
      setCopied("");
    } catch (requestError) {
      console.error("Unable to generate API key:", requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate an API key.",
      );
    } finally {
      setIsGeneratingKey(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile, plan, and developer tools.</p>
      </div>
      {accountError && (
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
          <span>{accountError}</span>
          <button type="button" onClick={reloadAccount} className="self-start font-semibold underline sm:self-auto">Retry</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{notice}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><UserRound size={18} /></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <p className="mt-0.5 text-xs text-slate-500">Your account information and preferences.</p>
          </div>
        </div>
        <form onSubmit={saveProfile}>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input required minLength={2} maxLength={50} value={name ?? currentUser?.name ?? ""} onChange={(event) => setName(event.target.value)} disabled={isAccountLoading || !currentUser} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email address
              <span className="relative mt-1.5 block">
                <input type="email" disabled value={currentUser?.email || ""} className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-32 text-sm text-slate-500" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  {currentUser?.isGoogleConnected ? "Google connected" : "Email account"}
                </span>
              </span>
            </label>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            {saved && <span role="status" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={14} /> Changes saved</span>}
            <button type="submit" disabled={isSaving || isAccountLoading || !currentUser} className="ml-auto rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{isSaving ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </section>

      {!isPro && (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ShieldCheck size={18} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{currentUser?.plan || "Free"} tier</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Current plan</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Your current monthly link usage and plan features.</p>
            </div>
          </div>
          {!isPro && <button type="button" onClick={() => navigate("/plans")} className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Upgrade to Pro</button>}
        </div>
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <div className="flex justify-between gap-3 text-xs"><span className="font-medium text-slate-700">Monthly links</span><span className="text-slate-500">{currentUser ? `${linksUsed} of ${linkLimit} used` : "Loading usage…"}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${usagePercent}%` }} /></div>
          <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> {linkLimit} links per month</span>
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> Link analytics</span>
            <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> Custom aliases</span>
          </div>
        </div>
      </section>
      )}

      {isPro && (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ReceiptText size={18} /></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Payment history</h2>
            <p className="mt-0.5 text-xs text-slate-500">Your completed Pro plan payments.</p>
          </div>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {paymentsLoading && <p className="py-4 text-sm text-slate-500">Loading payment history…</p>}
          {!paymentsLoading && payments.length === 0 && <p className="py-4 text-sm text-slate-500">No payments found.</p>}
          {payments.map((payment) => (
            <div key={payment._id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Pro plan</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{payment.razorpayPaymentId}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {payment.currency === "INR" ? "₹" : `${payment.currency} `}
                  {(payment.amount / 100).toFixed(2)}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {payment.status} · {new Date(payment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {!isPro && (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><KeyRound size={18} /></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Developer API key</h2>
            <p className="mt-0.5 text-xs text-slate-500">Use your key to create and manage links programmatically.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
            <input aria-label="Masked API key" readOnly value={keyInfo ? apiKeyDisplay : "Loading API key…"} className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-sm text-slate-600 outline-none" />
            <button type="button" disabled={!newApiKey} onClick={() => copyText(newApiKey, "API key")} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40">
              {copied === "API key" ? <Check size={14} /> : <Copy size={14} />}
              {copied === "API key" ? "Copied" : "Copy key"}
            </button>
          </div>
          <button type="button" disabled={!keyInfo || isGeneratingKey} onClick={regenerateKey} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"><Sparkles size={15} /> {isGeneratingKey ? "Generating…" : keyInfo?.hasApiKey ? "Regenerate key" : "Generate key"}</button>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-300"><Code2 size={14} /> Example request</span>
            <button type="button" onClick={() => copyText(snippet, "code snippet")} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white">{copied === "code snippet" ? <Check size={13} /> : <Clipboard size={13} />}{copied === "code snippet" ? "Copied" : "Copy"}</button>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-blue-100"><code>{snippet}</code></pre>
        </div>
        <p className="mt-3 text-xs text-slate-400">API keys are stored hashed. A generated key is shown only once; copy it before leaving this page.</p>
      </section>
      )}
    </div>
  );
}

export default Settings;
