import React, { useEffect, useMemo, useState } from "react";
import { fetchExpenseLineItemList } from "../api/client";
import { DataTable } from "../components/DataTable";
import { Pagination } from "../components/Pagination";

const PAGE_SIZE = 10;

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function truncate(str, maxLen = 60) {
  if (!str) return "—";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

function ExpenseList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchExpenseLineItemList();
        setData(res);
      } catch (err) {
        setError("Failed to load expense items");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

      <DataTable
        columns={[
          {
            key: "num",
            header: "#",
            render: (_, idx) => (currentPage - 1) * PAGE_SIZE + idx + 1,
          },
          {
            key: "date",
            header: "Date",
            render: (item) => formatDate(item.date),
          },
          {
            key: "description",
            header: "Description",
            render: (item) => (
              <span className="font-medium text-gray-900 max-w-[280px] block">
                {truncate(item.description, 80)}
              </span>
            ),
            cellClassName: "max-w-[280px]",
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
            render: (item) => (item.amount != null ? `₹${item.amount}` : "—"),
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
        ]}
        data={paginatedRows}
        getRowKey={(item) => item.id}
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={items.length}
            onPageChange={setCurrentPage}
          />
        }
        minWidth="720px"
      />
    </div>
  );
}

export default ExpenseList;
