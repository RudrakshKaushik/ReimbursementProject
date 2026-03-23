import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, useNavigate, Navigate } from "react-router-dom";
import { RequireAuth, LoginRoute } from "@/middleware";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import { fetchDashboard, logout } from "@/api/client";
import Dashboard from "@/pages/Dashboard";
import Employee from "@/pages/Employee";
import Expense from "@/pages/Expense";
import ExpenseList from "@/pages/ExpenseList";
import ExpenseRecord from "@/pages/ExpenseRecord";
import NotFound from "@/pages/NotFound";

function AppLayout() {
  const navigate = useNavigate();
  const { setAuthStatus } = useAuth();
  const [sections, setSections] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchDashboard()
      .then((data) => setSections(data.sections ?? []))
      .catch(() => setSections([]));
  }, []);

  function handleLogout() {
    logout();
    setAuthStatus("unauthenticated");
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-1 overflow-hidden">
      <Sidebar
        sections={sections}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <AppHeader onLogout={handleLogout} />
        <main className="mx-auto w-full flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <Routes>
            <Route path="/login" element={<LoginRoute />} />

            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employee" element={<Employee />} />
              <Route path="/expense" element={<Expense />} />
              <Route path="/expense-list" element={<ExpenseList />} />
              <Route path="/expense-records/:id" element={<ExpenseRecord />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
