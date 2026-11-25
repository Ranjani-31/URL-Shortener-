import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import axios from "../../api/axios";
import { useLinks } from "../dashboard/useLinks";

const pageNames = {
  "/dashboard": "Dashboard",
  "/links": "My Links",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/plans": "Plans",
};

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useLinks();
  const [logoutError, setLogoutError] = useState("");
  const [isLogoutMenuOpen, setIsLogoutMenuOpen] = useState(false);

  async function logout() {
    setLogoutError("");
    try {
      await axios.post("/api/v1/users/logout");
      setCurrentUser(null);
      setIsLogoutMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Unable to log out:", error);
      setLogoutError(
        error.response?.data?.message || error.message || "Unable to log out.",
      );
    }
  }

  return (
    <header className="flex h-[68px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {pageNames[pathname] || "Dashboard"}
        </p>
        <p className="hidden text-xs text-slate-500 sm:block">
          Your links, all in one place.
        </p>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <Bell size={19} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-slate-50"
          aria-label="Open account settings"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {(currentUser?.name || "A").slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-5 text-slate-800">
              {currentUser?.name || "Account"}
            </p>
            <p className="text-xs text-slate-500">{currentUser?.plan || "URL Shortener"}</p>
          </div>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLogoutMenuOpen((isOpen) => !isOpen)}
            aria-label="Open account actions"
            aria-expanded={isLogoutMenuOpen}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <LogOut size={17} />
          </button>
          {isLogoutMenuOpen && (
            <div className="absolute right-0 top-11 z-40 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
              >
                Log out
              </button>
              {logoutError && (
                <p role="alert" className="px-3 py-1 text-xs text-red-600">
                  {logoutError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
