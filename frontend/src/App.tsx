import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, useNavigate, Navigate } from "react-router-dom";
import { RequireAuth, RequireAdmin, LoginRoute } from "@/middleware";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import { fetchDashboard, logout, isAdminUser } from "@/api/client";
import type { DashboardData } from "@/types";
import Dashboard from "@/pages/Dashboard";
import Employee from "@/pages/Employee";
import Expense from "@/pages/Expense";
import ExpenseLineItems from "@/pages/ExpenseLineItems";
import ExpenseRecord from "@/pages/ExpenseRecord";
import ApprovalsHub from "@/pages/ApprovalsHub";
import ApprovalRules from "@/pages/ApprovalRules";
import AllApprovals from "@/pages/AllApprovals";
import ApprovalsExpenseRecordLineItems from "@/pages/ApprovalsExpenseRecordLineItems";
import NotFound from "@/pages/NotFound";

/** `sections` labels from `dashboard_api` (expenses/views.py) that map to sidebar routes */
const DASHBOARD_SECTION = {
  employees: "Employees",
  expenseRecords: "Expense records",
  expenseLineItems: "Expense line items",
} as const;

function AppLayout() {
  const navigate = useNavigate();
  const { setAuthStatus } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarState, setSidebarState] = useState<{
    hasEmployee: boolean;
    hasExpenses: boolean;
    hasExpenseList: boolean;
    hasApprovalsHub: boolean;
    hasApprovalRules: boolean;
    hasAllApprovals: boolean;
  }>({
    hasEmployee: false,
    hasExpenses: false,
    hasExpenseList: false,
    hasApprovalsHub: false,
    hasApprovalRules: false,
    hasAllApprovals: false,
  });

  useEffect(() => {
    fetchDashboard()
      .then((data: DashboardData) => {
        const sections = Array.isArray(data.sections) ? data.sections : [];
        const isAdmin = isAdminUser();
        setSidebarState({
          hasEmployee: sections.includes(DASHBOARD_SECTION.employees),
          hasExpenses: sections.includes(DASHBOARD_SECTION.expenseRecords),
          hasExpenseList: sections.includes(DASHBOARD_SECTION.expenseLineItems),
          hasApprovalsHub: true,
          hasApprovalRules: isAdmin,
          hasAllApprovals: isAdmin,
        });
      })
      .catch(() => {
        setSidebarState({
          hasEmployee: false,
          hasExpenses: false,
          hasExpenseList: false,
          hasApprovalsHub: true,
          hasApprovalRules: false,
          hasAllApprovals: false,
        });
      });
  }, []);

  function handleLogout() {
    logout();
    setAuthStatus("unauthenticated");
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-1 overflow-hidden">
      <Sidebar
        hasEmployee={sidebarState.hasEmployee}
        hasExpenses={sidebarState.hasExpenses}
        hasExpenseList={sidebarState.hasExpenseList}
        hasApprovalsHub={sidebarState.hasApprovalsHub}
        hasApprovalRules={sidebarState.hasApprovalRules}
        hasAllApprovals={sidebarState.hasAllApprovals}
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
              <Route path="/expense-line-items" element={<ExpenseLineItems />} />
              <Route path="/expense-records/:id" element={<ExpenseRecord />} />
              <Route path="/approvals" element={<ApprovalsHub />} />
              <Route
                path="/approval-rules"
                element={
                  <RequireAdmin>
                    <ApprovalRules />
                  </RequireAdmin>
                }
              />
              <Route
                path="/all-approvals"
                element={
                  <RequireAdmin>
                    <AllApprovals />
                  </RequireAdmin>
                }
              />
              <Route
                path="/all-approvals/expense-record/:id"
                element={
                  <RequireAdmin>
                    <ApprovalsExpenseRecordLineItems />
                  </RequireAdmin>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
