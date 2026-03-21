import React from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import Employee from "./pages/Employee.jsx";
import Expense from "./pages/Expense.jsx";
import ExpenseList from "./pages/ExpenseList.jsx";
import ExpenseListPage from "./pages/ExpenseListPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import { RequireAuth, LoginRoute } from "./middleware";
import { AuthProvider } from "@context/AuthContext";
import { useAuth } from "@context/AuthContext";
import NotFoundPage from "./pages/NotFoundPage";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthStatus } = useAuth();
  const fullWidthPaths = ["/employee", "/expense", "/expense-list"];
  const mainClass =
    fullWidthPaths.some((p) => location.pathname.startsWith(p))
      ? "app-main app-main--full"
      : "app-main";

  function handleLogout() {
    setAuthStatus("unauthenticated");
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="app-header">
        <h1>Expense Management</h1>
        <button type="button" className="primary-button" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className={mainClass}>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employee" element={<Employee />} />
            <Route path="/expense" element={<Expense />} />
            <Route path="/expense-list" element={<ExpenseList />} />
            <Route path="/expense-record-list" element={<ExpenseListPage />} />
            <Route path="/expense-records/:id" element={<ExpenseDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;