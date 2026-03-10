import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import ExpenseListPage from "./pages/ExpenseListPage";
import ExpenseDetailPage from "./pages/ExpenseDetailPage";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Management</h1>
        <nav>
          <Link to="/">My Expenses</Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ExpenseListPage />} />
          <Route path="/records/:id" element={<ExpenseDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

