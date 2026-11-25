import { useEffect, useMemo, useState } from "react";
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
  ArrowDownRight,
  ArrowUpRight,
  Globe2,
  MousePointerClick,
  MonitorSmartphone,
  Radio,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api/axios";
import { useLinks } from "../components/dashboard/useLinks";

function percentageOfTotal(clicks, total) {
  return total ? Math.round((clicks / total) * 100) : 0;
}

function BreakdownCard({ title, subtitle, icon: Icon, items, total, showDetail = false }) {
  const colors = ["bg-blue-600", "bg-indigo-500", "bg-violet-500", "bg-sky-500", "bg-slate-400", "bg-teal-500"];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500"><Icon size={17} /></div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {items.length ? (
        <div className="mt-5 space-y-4">
          {items.map((item, index) => {
            const percent = percentageOfTotal(item.clicks, total);
            return (
              <div key={`${item.label}-${item.detail || ""}`}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700">
                    {item.label}{showDetail && item.detail && <span className="ml-1 font-normal text-slate-400">· {item.detail}</span>}
                  </span>
                  <span className="shrink-0 text-slate-500">{item.clicks.toLocaleString()} <span className="text-slate-400">({percent}%)</span></span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-400">No traffic data for this period yet.</p>
      )}
    </section>
  );
}

function Analytics() {
  const navigate = useNavigate();
  const { shortcodeId } = useParams();
  const {
    links,
    isLoading: areLinksLoading,
    selectedLinkForAnalytics,
    setSelectedLinkForAnalytics,
  } = useLinks();
  const [dateRange, setDateRange] = useState("7");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const selectedLink = shortcodeId
    ? links.find((link) => link.code === shortcodeId || link.id === shortcodeId)
    : links.find((link) => link.id === selectedLinkForAnalytics);
  const unresolvedShortcode = Boolean(shortcodeId && !selectedLink && !areLinksLoading);
  const queryKey = `${shortcodeId || selectedLink?.id || "all"}:${dateRange}`;
  const currentResult = result?.queryKey === queryKey ? result.data : null;
  const currentError = error?.queryKey === queryKey ? error.message : "";
  const isLoading = !currentResult && !currentError;

  useEffect(() => {
    if ((shortcodeId && !selectedLink) || unresolvedShortcode) return undefined;

    let active = true;
    const params = { range: dateRange };
    if (selectedLink) params.linkId = selectedLink.id;

    axios.get("/api/v1/urls/analytics", { params })
      .then((response) => {
        if (active) {
          setResult({ queryKey, data: response.data.data });
          setError(null);
        }
      })
      .catch((requestError) => {
        console.error("Unable to load analytics:", requestError);
        if (active) {
          setError({
            queryKey,
            message:
              requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load analytics. Please try again.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [dateRange, queryKey, selectedLink, shortcodeId, unresolvedShortcode]);

  const chartData = useMemo(
    () => (currentResult?.daily || []).map((item) => ({
      day: new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clicks: item.clicks,
    })),
    [currentResult],
  );
  const totalClicks = currentResult?.summary.totalClicks || 0;
  const countries = currentResult?.countries || [];
  const devices = currentResult?.devices || [];
  const referrers = currentResult?.referrers || [];
  const topCountry = countries[0]?.label || "—";
  const topReferrer = referrers[0]?.label || "—";

  const stats = [
    { label: "Total clicks", value: totalClicks.toLocaleString(), detail: `${dateRange === "all" ? "All time" : `Last ${dateRange} days`}`, icon: MousePointerClick },
    { label: "Unique visitors", value: (currentResult?.summary.uniqueVisitors || 0).toLocaleString(), detail: "Based on anonymized visitors", icon: Radio },
    { label: "Top country", value: topCountry, detail: countries[0] ? `${percentageOfTotal(countries[0].clicks, totalClicks)}% of clicks` : "No traffic yet", icon: Globe2 },
    { label: "Top referrer", value: topReferrer, detail: referrers[0] ? `${percentageOfTotal(referrers[0].clicks, totalClicks)}% of clicks` : "No traffic yet", icon: ArrowUpRight },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Understand where your audience finds your links.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="analytics-link">Select link</label>
          <select
            id="analytics-link"
            value={selectedLink?.id ?? ""}
            onChange={(event) => {
              const nextLink = links.find((link) => link.id === event.target.value);
              setSelectedLinkForAnalytics(nextLink?.id ?? null);
              navigate(nextLink ? `/analytics/${encodeURIComponent(nextLink.code)}` : "/analytics");
            }}
            className="max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">🌐 All links (global overview)</option>
            {links.map((link) => <option key={link.id} value={link.id}>/{link.code}</option>)}
          </select>
          <label className="sr-only" htmlFor="analytics-range">Date range</label>
          <select id="analytics-range" value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {selectedLink && (
        <div className="flex flex-col justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm text-blue-900">Showing analytics for <span className="font-semibold">/{selectedLink.code}</span></p>
          <button type="button" onClick={() => {
            setSelectedLinkForAnalytics(null);
            navigate("/analytics");
          }} className="self-start text-sm font-semibold text-blue-700 hover:text-blue-800 sm:self-auto">Reset to all links</button>
        </div>
      )}
      {unresolvedShortcode && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn’t find the link “{shortcodeId}”. It may have been deleted.
        </p>
      )}
      {currentError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{currentError}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={18} /></div>
            </div>
            <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-slate-900">{isLoading ? "—" : value}</p>
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Clicks over time</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedLink ? `Daily performance for /${selectedLink.code}` : "Daily performance across your links"}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400"><ArrowDownRight size={14} /> Click events</span>
        </div>
        <div className="h-64 w-full">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="analyticsClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={35} />
                <Tooltip />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#2563eb" strokeWidth={2.5} fill="url(#analyticsClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {isLoading ? "Loading analytics…" : "No click data for this period yet."}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard title="Top countries" subtitle="Where your audience is" icon={Globe2} items={countries} total={totalClicks} />
        <BreakdownCard title="Devices & browsers" subtitle="How people are browsing" icon={MonitorSmartphone} items={devices} total={totalClicks} showDetail />
        <BreakdownCard title="Top referrers" subtitle="Where clicks come from" icon={ArrowDownRight} items={referrers} total={totalClicks} />
      </section>
    </div>
  );
}

export default Analytics;
