
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Settings from "../pages/Settings";
import Analytics from "../pages/Analytics";
import Links from "../pages/Links";
import Plans from "../pages/Plans";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/links" element={<Links />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics/:shortcodeId" element={<Analytics />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
