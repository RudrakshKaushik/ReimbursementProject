import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard, type DashboardData } from "@/api/client";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Approved", cls: "bg-green-100 text-green-800" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status?.toLowerCase()] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon, label, value, sub,
}: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-2xl leading-none">{icon}</div>
      <div className="flex-1">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mb-1 text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="m-0 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "lineitems">("expenses");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetchDashboard();
        setData(res);
      } catch {
        setError("Failed to load dashboard. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="mt-4 text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-8 py-6 text-red-700">
          <span className="text-2xl">⚠️</span>
          <p className="font-medium">{error ?? "No data received."}</p>
        </div>
      </div>
    );
  }

  // Backend response shape is not guaranteed; defend against missing fields.
  const employee = data.employee;
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const expense_list = Array.isArray(data.expense_list) ? data.expense_list : [];

  const employeeName = employee?.name ?? "User";
  const employeeEmail = employee?.email ?? "";
  const employeeIsActive = employee?.is_active ?? false;

  // ── Derived stats ──
  const totalSpend = expense_list.reduce(
    (sum, item) => sum + parseFloat(item.amount || "0"), 0
  );
  const approved = expenses.filter((e) => e.status === "approved").length;
  const pending = expenses.filter((e) => e.status === "pending").length;

  return (
    <div className="mx-auto w-full">
      <header className="mb-7 flex items-center justify-between rounded-2xl bg-gradient-to-br from-slate-800 to-blue-600 px-8 py-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/25 text-2xl font-bold">
            {employeeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="mb-1 text-xl font-bold">
              Welcome, {employeeName.split(" ")[0]} 👋
            </h1>
            <p className="m-0 text-sm opacity-80">{employeeEmail}</p>
          </div>
        </div>
        <span
          className={`rounded-full border border-white/50 px-3 py-1.5 text-xs font-semibold ${
            employeeIsActive
              ? "bg-green-500/25 text-green-200"
              : "bg-red-500/25 text-red-200"
          }`}
        >
          {employeeIsActive ? "● Active" : "● Inactive"}
        </span>
      </header>

      <section className="mb-7 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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

      <div className="mb-4 flex gap-2 border-b-2 border-gray-200">
        <button
          type="button"
          className={`flex items-center gap-2 rounded-t-lg border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "expenses"
              ? "border-blue-600 bg-blue-50 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("expenses")}
        >
          📁 Expense Records
          <span className={`min-w-5 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
            activeTab === "expenses" ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-700"
          }`}>
            {expenses.length}
          </span>
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-t-lg border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "lineitems"
              ? "border-blue-600 bg-blue-50 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("lineitems")}
        >
          🧾 Line Items
          <span className={`min-w-5 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
            activeTab === "lineitems" ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-700"
          }`}>
            {expense_list.length}
          </span>
        </button>
      </div>

      {activeTab === "expenses" && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-gray-400">
              <span className="text-4xl">📭</span>
              <p className="text-base">No expense records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Line Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp, idx) => (
                    <tr key={exp.id} className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {new Date(exp.month).toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                      <td className="px-4 py-3 font-bold tabular-nums text-emerald-600">
                        ₹{parseFloat(exp.total_amount).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{exp.line_items?.length ?? 0} items</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/expense-records/${exp.id}`}
                          state={{ returnTo: "/dashboard" }}
                          className="text-sm font-semibold text-blue-600 transition-opacity hover:opacity-70"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "lineitems" && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {expense_list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-gray-400">
              <span className="text-4xl">📭</span>
              <p className="text-base">No line items found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expense_list.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                          {item.category || "—"}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-gray-700">{item.description || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.vendor || "—"}</td>
                      <td className="px-4 py-3 font-bold tabular-nums text-emerald-600">
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
