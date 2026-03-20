import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";
import { RequireAuth, LoginRoute } from "./middleware";
import { AuthProvider } from "@context/AuthContext";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<LoginRoute />} />

            <Route
              path="/"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />

            <Route
              path="/records/:id"
              element={
                <RequireAuth>
                  <ExpenseDetailPage />
                </RequireAuth>
              }
            />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;