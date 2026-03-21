import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchExpenseList } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Pagination } from "../components/Pagination";

const PAGE_SIZE = 10;

function ExpenseStatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const styles = {
    approved: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-700",
  };
  const cls = styles[s] ?? "bg-gray-100 text-gray-600";
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function formatMonth(monthStr) {
  if (!monthStr) return "—";
  try {
    const d = new Date(monthStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  } catch {
    return monthStr;
  }
}

function Expense() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchExpenseList();
        setData(res);
      } catch (err) {
        setError("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const expenses = data?.expenses ?? [];
  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return expenses.slice(start, start + PAGE_SIZE);
  }, [expenses, currentPage]);

  if (loading) return <p className="text-left text-gray-600">Loading...</p>;

  if (error) {
    return (
      <div className="w-full text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Expense List
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.expenses) return null;

  return (
    <div className="w-full max-w-none text-left">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
        Expense List
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Total expenses: {data.total_expenses}
        {data.employee_email && ` · ${data.employee_email}`}
      </p>

      <DataTable
        columns={[
          {
            key: "num",
            header: "#",
            render: (_, idx) => (currentPage - 1) * PAGE_SIZE + idx + 1,
          },
          {
            key: "month",
            header: "Month",
            render: (exp) => (
              <span className="font-semibold text-gray-900">{formatMonth(exp.month)}</span>
            ),
          },
          {
            key: "employee",
            header: "Employee",
            render: (exp) => exp.employee?.name ?? "—",
          },
          {
            key: "status",
            header: "Status",
            render: (exp) => <ExpenseStatusBadge status={exp.status} />,
          },
          {
            key: "amount",
            header: "Total Amount",
            render: (exp) =>
              exp.total_amount != null ? `₹${exp.total_amount}` : "—",
          },
          {
            key: "items",
            header: "Line Items",
            render: (exp) => {
              const n = exp.line_items?.length ?? 0;
              return `${n} ${n === 1 ? "item" : "items"}`;
            },
          },
        ]}
        data={paginatedRows}
        getRowKey={(exp) => exp.id}
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={expenses.length}
            onPageChange={setCurrentPage}
          />
        }
      />
    </div>
  );
}

export default Expense;
