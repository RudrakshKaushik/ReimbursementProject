import React, { useEffect, useState } from "react";
import api from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeInfo = {
  id: number;
  name: string;
  email: string;
  manager: number | null;
  is_active: boolean;
};

type LineItem = {
  id: number;
  description: string;
  date: string;
  category: string;
  amount: string;
  vendor: string;
  created_at: string;
};

type Expense = {
  id: number;
  month: string;
  status: string;
  total_amount: string;
  line_items: LineItem[];
};

type DashboardData = {
  success: boolean;
  employee: EmployeeInfo;
  expenses: Expense[];
  expense_list: LineItem[];
  sections: string[];
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "badge-draft" },
    pending: { label: "Pending", cls: "badge-pending" },
    approved: { label: "Approved", cls: "badge-approved" },
    rejected: { label: "Rejected", cls: "badge-rejected" },
  };
  const s = map[status?.toLowerCase()] ?? { label: status, cls: "badge-draft" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon, label, value, sub,
}: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="summary-card">
      <div className="summary-icon">{icon}</div>
      <div className="summary-body">
        <p className="summary-label">{label}</p>
        <p className="summary-value">{value}</p>
        {sub && <p className="summary-sub">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "lineitems">("expenses");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<DashboardData>("/dashboard/");
        setData(res.data);
      } catch {
        setError("Failed to load dashboard. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="dash-center">
        <div className="spinner" />
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>Loading dashboard…</p>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="dash-center">
        <div className="error-box">
          <span className="error-icon">⚠️</span>
          <p>{error ?? "No data received."}</p>
        </div>
      </div>
    );
  }

  const { employee, expenses, expense_list } = data;

  // ── Derived stats ──
  const totalSpend = expense_list.reduce(
    (sum, item) => sum + parseFloat(item.amount || "0"), 0
  );
  const approved = expenses.filter((e) => e.status === "approved").length;
  const pending = expenses.filter((e) => e.status === "pending").length;

  return (
    <div className="dash-root">
      {/* ── Header ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="avatar">{employee.name.charAt(0).toUpperCase()}</div>
          <div>
            <h1 className="dash-title">Welcome back, {employee.name.split(" ")[0]} 👋</h1>
            <p className="dash-subtitle">{employee.email}</p>
          </div>
        </div>
        <div className="dash-header-right">
          <span className={`emp-badge ${employee.is_active ? "active" : "inactive"}`}>
            {employee.is_active ? "● Active" : "● Inactive"}
          </span>
        </div>
      </header>

      {/* ── Summary Cards ── */}
      <section className="summary-grid">
        <SummaryCard
          icon="💰"
          label="Total Spend"
          value={`₹${totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
          sub="Across all records"
        />
        <SummaryCard
          icon="📋"
          label="Expense Records"
          value={expenses.length}
          sub="All months"
        />
        <SummaryCard
          icon="✅"
          label="Approved"
          value={approved}
          sub={`${expenses.length ? ((approved / expenses.length) * 100).toFixed(0) : 0}% approval rate`}
        />
        <SummaryCard
          icon="⏳"
          label="Pending Review"
          value={pending}
          sub="Awaiting approval"
        />
        <SummaryCard
          icon="🧾"
          label="Total Line Items"
          value={expense_list.length}
          sub="Individual bills"
        />
      </section>

      {/* ── Tabs ── */}
      <div className="dash-tabs">
        <button
          className={`dash-tab ${activeTab === "expenses" ? "dash-tab--active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          📁 Expense Records
          <span className="tab-count">{expenses.length}</span>
        </button>
        <button
          className={`dash-tab ${activeTab === "lineitems" ? "dash-tab--active" : ""}`}
          onClick={() => setActiveTab("lineitems")}
        >
          🧾 Line Items
          <span className="tab-count">{expense_list.length}</span>
        </button>
      </div>

      {/* ── Expense Records Table ── */}
      {activeTab === "expenses" && (
        <div className="dash-card">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No expense records found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Month</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                    <th>Line Items</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp, idx) => (
                    <tr key={exp.id}>
                      <td className="td-muted">{idx + 1}</td>
                      <td className="td-bold">
                        {new Date(exp.month).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td><StatusBadge status={exp.status} /></td>
                      <td className="td-amount">
                        ₹{parseFloat(exp.total_amount).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="td-muted">{exp.line_items?.length ?? 0} items</td>
                      <td>
                        <a href={`/records/${exp.id}`} className="view-link">
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Line Items Table ── */}
      {activeTab === "lineitems" && (
        <div className="dash-card">
          {expense_list.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No line items found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expense_list.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="td-muted">{idx + 1}</td>
                      <td className="td-muted">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className="category-tag">{item.category || "—"}</span>
                      </td>
                      <td className="td-desc">{item.description || "—"}</td>
                      <td className="td-muted">{item.vendor || "—"}</td>
                      <td className="td-amount">
                        ₹{parseFloat(item.amount).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
