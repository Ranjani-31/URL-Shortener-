import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Link2,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import axios from "../api/axios";
import { useLinks } from "../components/dashboard/useLinks";

function Dashboard() {
  const navigate = useNavigate();
  const { links, currentUser, isLoading, loadError, reloadLinks, setSelectedLinkForAnalytics } = useLinks();
  const isPro = ["pro", "premium"].includes(currentUser?.plan?.toLowerCase());
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    let active = true;
    function loadAnalytics() {
      axios.get("/api/v1/urls/analytics", { params: { range: "7" } })
        .then((response) => {
          if (active) {
            setAnalytics(response.data.data);
            setAnalyticsError("");
          }
        })
        .catch((requestError) => {
          console.error("Unable to load dashboard analytics:", requestError);
          if (active) {
            setAnalyticsError(
              requestError.response?.data?.message ||
                requestError.message ||
                "Unable to load click analytics.",
            );
          }
        });
    }

    loadAnalytics();
    window.addEventListener("focus", loadAnalytics);

    return () => {
      active = false;
      window.removeEventListener("focus", loadAnalytics);
    };
  }, []);

  const chartData = useMemo(
    () => (analytics?.daily || []).slice(-7).map((item) => ({
      day: new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      clicks: item.clicks,
    })),
    [analytics],
  );

  const totalClicks = links.reduce((total, link) => total + link.clicks, 0);
  const activeLinks = links.filter((link) => link.status === "Active").length;
  const topLink = [...links].sort((a, b) => b.clicks - a.clicks)[0];
  const previousClicks = analytics?.previousPeriodClicks;
  const recentClicks = analytics?.summary?.totalClicks || 0;
  const clickTrend = previousClicks > 0
    ? `${recentClicks >= previousClicks ? "+" : ""}${Math.round(((recentClicks - previousClicks) / previousClicks) * 1000) / 10}%`
    : recentClicks > 0
      ? "New activity"
      : null;
  const recentLinks = useMemo(
    () => [...links]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [links],
  );

  const stats = [
    {
      label: "Total clicks",
      value: isLoading ? "—" : totalClicks.toLocaleString(),
      hint: "Across all your links",
      icon: MousePointerClick,
      trend: clickTrend,
      trendIsNegative: clickTrend?.startsWith("-"),
    },
    {
      label: "Active links",
      value: isLoading ? "—" : activeLinks,
      hint: "Ready to share",
      icon: Activity,
    },
    {
      label: "Top performing link",
      value: topLink ? `/${topLink.code}` : "—",
      hint: topLink ? `${topLink.clicks.toLocaleString()} clicks` : "No clicks yet",
      icon: Link2,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {loadError && (
        <div role="alert" className="flex flex-col justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
          <span>{loadError}</span>
          <button type="button" onClick={reloadLinks} className="self-start font-semibold underline sm:self-auto">Retry</button>
        </div>
      )}
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, hint, icon: Icon, trend, trendIsNegative }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={19} />
              </div>
              {trend && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${trendIsNegative ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {trendIsNegative ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                  {trend}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Clicks over time</h2>
              <p className="mt-1 text-sm text-slate-500">A quick look at your link traffic this week.</p>
            </div>
            <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500">Last 7 days</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashboardClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={32} />
                <Tooltip />
                <Area type="monotone" dataKey="clicks" stroke="#2563eb" strokeWidth={2.5} fill="url(#dashboardClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {analyticsError && <p role="alert" className="mt-2 text-xs text-red-600">{analyticsError}</p>}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Recent links</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest creations</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/links")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLinks.map((link) => (
              <button
                type="button"
                key={link.id}
                onClick={() => {
                  setSelectedLinkForAnalytics(link.id);
                  navigate(`/analytics/${encodeURIComponent(link.code)}`);
                }}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-blue-600">/{link.code}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-400">{link.originalUrl}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-600">{link.clicks.toLocaleString()}</span>
              </button>
            ))}
            {!recentLinks.length && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Your recent links will show up here.</p>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Sparkles size={19} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isPro ? "Pro plan" : "Free plan"}
              {!isPro && <span className="ml-1 font-normal text-slate-400">· {currentUser ? `${currentUser.linksUsed} / ${currentUser.linkLimit} monthly links used` : "Loading usage…"}</span>}
            </p>
            {isPro ? (
              <p className="mt-1 text-xs text-slate-500">Unlimited short links and all Pro features</p>
            ) : (
              <div className="mt-2 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${currentUser ? Math.min(100, Math.round((currentUser.linksUsed / currentUser.linkLimit) * 100)) : 0}%` }} />
              </div>
            )}
          </div>
        </div>
        {isPro ? (
          <p className="self-start text-sm font-semibold text-blue-700 sm:self-auto">
            All Pro features enabled
          </p>
        ) : (
          <button type="button" onClick={() => navigate("/plans")} className="self-start rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto">
            Upgrade plan
          </button>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
