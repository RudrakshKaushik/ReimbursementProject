import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import { useAuth } from "@context/AuthContext";
import { isAdminUser } from "@/api/client";

function LoadingRoute() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <p className="text-slate-600">Checking session...</p>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === "unknown") return <LoadingRoute />;

  if (authStatus !== "authenticated") {
    const returnTo = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}

/** Must be used inside `RequireAuth`. Sends non-admins to the dashboard. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (!isAdminUser()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function LoginRoute() {
  const { authStatus } = useAuth();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") ?? "/dashboard";

  if (authStatus === "unknown") return <LoadingRoute />;

  if (authStatus === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  return <Login />;
}