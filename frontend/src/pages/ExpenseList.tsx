import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IconPencil } from "@tabler/icons-react";
import { fetchExpenseLineItemList } from "@/api/client";
import type { ExpenseLineItemListResponse, ExpenseLineItemEntry } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { EditExpenseLineItemModal } from "@/components/EditExpenseLineItemModal";
import { formatDisplayDate } from "@/utils/date";
import {
  WorkflowApprovalStatusBadge,
  LineItemApprovedBadge,
} from "@/components/ApprovalBadges";

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

function truncate(str: string | undefined, maxLen = 60) {
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

export default function ExpenseList() {
  const [data, setData] = useState<ExpenseLineItemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState<ExpenseLineItemEntry | null>(null);

  const reloadList = useCallback(async () => {
    const res = await fetchExpenseLineItemList();
    setData(res);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        await reloadList();
      } catch (err) {
        setError(axiosErrorMessage(err, "Failed to load expense items"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadList]);

  const items = data?.expense_list ?? [];
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
          Expense Line Items
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.expense_list) return null;

  return (
    <div className="w-full max-w-none text-left">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
        Expense Line Items
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Total items: {data.total_items}
        {data.employee_email && ` · ${data.employee_email}`}
      </p>

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
              <WorkflowApprovalStatusBadge
                approvalStatus={item.approval_status}
              />
            ),
          },
          {
            key: "is_approved",
            header: "Approved",
            render: (item) => (
              <LineItemApprovedBadge isApproved={item.is_approved} />
            ),
          },
          {
            key: "attachment",
            header: "Attachment",
            align: "right",
            render: (item) => {
              const fileUrl = item.attachment?.file;
              return fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {item.attachment?.filename ?? "View"}
                </a>
              ) : (
                <span className="text-gray-400">—</span>
              );
            },
          },
          {
            key: "actions",
            header: "Action",
            render: (item) => (
              <button
                type="button"
                aria-label="Edit line item"
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 p-2 text-white shadow-sm hover:bg-blue-700"
                onClick={() => setEditingItem(item)}
              >
                <IconPencil size={18} stroke={2} />
              </button>
            ),
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
        minWidth="800px"
      />

      <EditExpenseLineItemModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={reloadList}
      />
    </div>
  );
}
