import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchMyApprovals } from "@/api/client";
import type { MyApprovalsResponse, MyApprovalRow } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { ApprovalRecordStatusBadge } from "@/components/ApprovalBadges";

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

export default function ApprovalsHub() {
  const [data, setData] = useState<MyApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchMyApprovals();
        setData(res);
      } catch (err) {
        setError(axiosErrorMessage(err, "Failed to load my approvals"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const approvalsRows = data?.approvals ?? [];
  const totalPages = Math.max(1, Math.ceil(approvalsRows.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return approvalsRows.slice(start, start + PAGE_SIZE);
  }, [approvalsRows, currentPage]);

  if (loading) {
    return <p className="text-left text-gray-600">Loading...</p>;
  }

  if (error) {
    return (
      <div className="w-full text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          My approvals
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.approvals) return null;

  return (
    <div className="w-full max-w-none text-left">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
        My approvals
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Total: {approvalsRows.length}
      </p>

      <DataTable<MyApprovalRow>
        columns={[
          { key: "id", header: "Approval ID", render: (row) => row.id },
          {
            key: "expense_record_id",
            header: "Expense record",
            render: (row) => row.expense_record_id,
          },
          { key: "employee", header: "Employee", render: (row) => row.employee },
          {
            key: "status",
            header: "Status",
            render: (row) => <ApprovalRecordStatusBadge status={row.status} />,
          },
        ]}
        data={paginatedRows}
        getRowKey={(row) => row.id}
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={approvalsRows.length}
            onPageChange={setCurrentPage}
          />
        }
      />
    </div>
  );
}
