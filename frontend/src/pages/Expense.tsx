import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { fetchExpenseList } from "@/api/client";
import type { ExpenseListResponse, ExpenseListItem } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 10;

function ExpenseStatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const styles: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-700",
  };
  const cls = styles[s] ?? "bg-gray-100 text-gray-600";
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function formatMonth(monthStr: string) {
  if (!monthStr) return "—";
  try {
    const d = new Date(monthStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  } catch {
    return monthStr;
  }
}

export default function Expense() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [data, setData] = useState<ExpenseListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchExpenseList();
        setData(res);
      } catch (err) {
        const fallback = "Failed to load expenses";
        if (axios.isAxiosError(err) && err.response?.data) {
          const resp = err.response.data as any;
          const msg =
            (typeof resp?.message === "string" && resp.message) ||
            (typeof resp?.error === "string" && resp.error) ||
            (typeof resp?.detail === "string" && resp.detail);
          setError(msg ?? fallback);
        } else {
          setError(fallback);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const expenses = data?.expenses ?? [];
  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  function handlePageChange(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (page <= 1) next.delete("page");
      else next.set("page", String(page));
      return next;
    });
  }

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return expenses.slice(start, start + PAGE_SIZE);
  }, [expenses, safePage]);

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

      <DataTable<ExpenseListItem>
        columns={[
          {
            key: "id",
            header: "No.",
            render: (_, idx) => (safePage - 1) * PAGE_SIZE + idx + 1,
          },
          {
            key: "employee",
            header: "Employee",
            render: (exp) => exp.employee?.name ?? "—",
          },
          {
            key: "amount",
            header: "Total Amount",
            render: (exp) =>
              exp.total_amount != null ? `$ ${exp.total_amount}` : "—",
          },
          {
            key: "status",
            header: "Status",
            render: (exp) => <ExpenseStatusBadge status={exp.status} />,
          },
          {
            key: "items",
            header: "Line Items",
            render: (exp) => {
              const n = exp.line_items?.length ?? 0;
              return `${n} ${n === 1 ? "item" : "items"}`;
            },
          },
          {
            key: "month",
            header: "Month",
            render: (exp) => (
              <span className="font-semibold text-gray-900">{formatMonth(exp.month)}</span>
            ),
          },
          {
            key: "action",
            header: "Action",
            render: (exp) => (
              <Link
                to={`/expense-records/${exp.id}`}
                state={{ returnTo: safePage === 1 ? "/expense" : `/expense?page=${safePage}` }}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                View →
              </Link>
            ),
          },
        ]}
        data={paginatedRows}
        getRowKey={(exp) => exp.id}
        footer={
          <Pagination
            currentPage={safePage}
            pageSize={PAGE_SIZE}
            totalItems={expenses.length}
            onPageChange={handlePageChange}
          />
        }
      />
    </div>
  );
}
