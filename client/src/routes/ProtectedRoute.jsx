import {Navigate, Outlet} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
    const {isAuthenticated, isCheckingAuth } = useAuth();
    if (isCheckingAuth) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600"
            >
                <span
                    aria-hidden="true"
                    className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 motion-reduce:animate-none"
                />
                <span className="text-sm font-medium">Loading...</span>
            </div>
        );
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}