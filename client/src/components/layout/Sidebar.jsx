import { NavLink } from "react-router-dom";
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  Link2,
  Crown,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLinks } from "../dashboard/useLinks";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "My Links", path: "/links", icon: Link2 },
  { name: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { name: "Plans", path: "/plans", icon: Crown },
  { name: "Settings", path: "/settings", icon: Settings },
];

function Navigation({ mobile = false }) {
  return (
    <nav
      aria-label="Main navigation"
      className={mobile ? "flex w-full justify-around" : "space-y-1"}
    >
      {menuItems.map(({ name, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            mobile
              ? `flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`
              : `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`
          }
        >
          <Icon size={mobile ? 20 : 18} />
          <span>{name}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  const { currentUser, accountError } = useLinks();
  const linksUsed = currentUser?.linksUsed || 0;
  const linkLimit = currentUser?.linkLimit || 25;
  const usagePercent = Math.min(100, Math.round((linksUsed / linkLimit) * 100));
  const isPro = ["pro", "premium"].includes(currentUser?.plan?.toLowerCase());

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <NavLink to="/dashboard" className="mb-10 flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
            <Zap size={19} fill="currentColor" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            LinkFlow
          </span>
        </NavLink>

        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <Navigation />

        {isPro ? (
          <div className="mt-auto flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <Sparkles size={15} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Pro plan</span>
          </div>
        ) : (
          <div className="mt-auto rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Free plan</span>
              <Sparkles size={15} className="text-blue-600" />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {currentUser
                ? `${linksUsed} of ${linkLimit} monthly links used`
                : accountError
                  ? "Usage unavailable"
                  : "Loading usage…"}
            </p>
            <div
              role="progressbar"
              aria-label="Monthly link usage"
              aria-valuenow={linksUsed}
              aria-valuemin={0}
              aria-valuemax={linkLimit}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100"
            >
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${usagePercent}%` }} />
            </div>
            <NavLink
              to="/plans"
              className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Explore Pro <span aria-hidden="true">→</span>
            </NavLink>
          </div>
        )}
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden">
        <Navigation mobile />
      </div>
    </>
  );
}

export default Sidebar;
