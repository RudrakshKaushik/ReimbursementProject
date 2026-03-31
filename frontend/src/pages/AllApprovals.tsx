import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchAllApprovals } from "@/api/client";
import type { AllApprovalsResponse, AllApprovalRow } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { ApprovalRecordStatusBadge } from "@/components/ApprovalBadges";
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

export default function AllApprovals() {
  const [data, setData] = useState<AllApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchAllApprovals();
        setData(res);
      } catch (err) {
        setError(axiosErrorMessage(err, "Failed to load all approvals"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rows = data?.approvals ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  if (loading) {
    return <p className="text-left text-gray-600">Loading...</p>;
  }

  if (error) {
    return (
      <div className="w-full text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          All approvals
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.approvals) return null;

  return (
    <div className="w-full max-w-none space-y-10 text-left">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          All approvals
        </h1>
        <p className="text-sm text-gray-600">
          Total approvals: {data.total_approvals}
        </p>
      </div>

      <DataTable<AllApprovalRow>
        columns={[
          {
            key: "approval_id",
            header: "Approval ID",
            render: (row) => row.approval_id,
          },
          {
            key: "expense_record_id",
            header: "Expense record",
            render: (row) => row.expense_record_id,
          },
          {
            key: "employee_name",
            header: "Employee",
            render: (row) => row.employee_name,
          },
          {
            key: "approver_name",
            header: "Approver",
            render: (row) => row.approver_name,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <ApprovalRecordStatusBadge status={row.status} />,
          },
          {
            key: "comments",
            header: "Comments",
            render: (row) => (row.comments ? row.comments : "—"),
          },
          {
            key: "approved_at",
            header: "Approved at",
            render: (row) => formatDisplayDate(row.approved_at),
          },
        ]}
        data={paginatedRows}
        getRowKey={(row) => row.approval_id}
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={rows.length}
            onPageChange={setCurrentPage}
          />
        }
      />
    </div>
  );
}
