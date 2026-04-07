import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { fetchExpenseLineItemsByRecord } from "@/api/client";
import type { ExpenseLineItemEntry, ExpenseRecordLineItemsResponse } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import {
  LineItemApprovedBadge,
  WorkflowApprovalStatusBadge,
} from "@/components/ApprovalBadges";
import { formatDisplayDate } from "@/utils/date";

const PAGE_SIZE = 10;

function axiosErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const resp = err.response.data as Record<string, unknown>;
    const msg =
      (typeof resp.message === "string" && resp.message) ||
      (typeof resp.error === "string" && resp.error) ||
      (typeof resp.detail === "string" && resp.detail);
    return (msg as string) || fallback;
  }
  return fallback;
}

function truncate(str: string | undefined | null, maxLen = 60) {
  if (!str) return "—";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

function formatAmount(amount: string | number | undefined | null) {
  if (amount == null || amount === "") return "—";
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (Number.isNaN(n)) return String(amount);
  return `$${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function ApprovalsExpenseRecordLineItems() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ExpenseRecordLineItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError("Expense record id is required");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetchExpenseLineItemsByRecord(id);
        setData(res);
      } catch (err) {
        setError(axiosErrorMessage(err, "Failed to load expense line items"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const items = data?.line_items ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  if (loading) return <p className="text-left text-gray-600">Loading...</p>;

  if (error) {
    return (
      <div className="w-full text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Approvals Expense Record Line Items
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-none text-left">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Approvals Expense Record Line Items
          </h1>
          <p className="text-sm text-gray-600">
            Record #{data.expense_record_id} · {data.employee_name} · Month {data.month}
          </p>
          <p className="mt-1 text-sm text-gray-600">Total items: {data.total_items}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/all-approvals")}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to all approvals
        </button>
      </div>

      <DataTable<ExpenseLineItemEntry>
        columns={[
          {
            key: "id",
            header: "No.",
            render: (_, idx) => (currentPage - 1) * PAGE_SIZE + idx + 1,
          },
          {
            key: "category",
            header: "Category",
            render: (item) => item.category ?? "—",
          },
          {
            key: "vendor",
            header: "Vendor",
            render: (item) => truncate(item.vendor, 50),
            cellClassName: "max-w-[200px]",
          },
          {
            key: "amount",
            header: "Amount",
            render: (item) => formatAmount(item.amount),
          },
          {
            key: "description",
            header: "Description",
            render: (item) => (
              <span className="block max-w-[280px] font-medium text-gray-900">
                {truncate(item.description, 80)}
              </span>
            ),
            cellClassName: "max-w-[280px]",
          },
          {
            key: "date",
            header: "Date",
            render: (item) => formatDisplayDate(item.date),
          },
          {
            key: "approval_status",
            header: "Status",
            render: (item) => (
              <WorkflowApprovalStatusBadge approvalStatus={item.approval_status} />
            ),
          },
          {
            key: "is_approved",
            header: "Approved",
            render: (item) => <LineItemApprovedBadge isApproved={item.is_approved} />,
          },
          {
            key: "violation_reason",
            header: "Violation",
            render: (item) => {
              const v = item.violation_reason?.trim();
              if (!v) return <span className="text-gray-400">—</span>;
              return (
                <span className="block max-w-[220px] text-sm text-amber-900" title={v}>
                  {truncate(v, 72)}
                </span>
              );
            },
            cellClassName: "max-w-[240px]",
          },
        ]}
        data={paginatedRows}
        getRowKey={(item) => item.id}
        rowClassName={(item) =>
          item.is_approved === true
            ? "border-emerald-200/90 bg-emerald-50/95 hover:bg-emerald-100/80"
            : "border-gray-100 hover:bg-gray-50/50"
        }
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={items.length}
            onPageChange={setCurrentPage}
          />
        }
        minWidth="960px"
      />
    </div>
  );
}
