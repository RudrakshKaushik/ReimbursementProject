import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchApprovalRules } from "@/api/client";
import type { ApprovalRulesResponse, ApprovalRuleRow } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { RuleActiveBadge } from "@/components/ApprovalBadges";

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

export default function ApprovalRules() {
  const [data, setData] = useState<ApprovalRulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchApprovalRules();
        setData(res);
      } catch (err) {
        setError(axiosErrorMessage(err, "Failed to load approval rules"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rulesRows = data?.rules ?? [];
  const totalPages = Math.max(1, Math.ceil(rulesRows.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rulesRows.slice(start, start + PAGE_SIZE);
  }, [rulesRows, currentPage]);

  if (loading) {
    return <p className="text-left text-gray-600">Loading...</p>;
  }

  if (error) {
    return (
      <div className="w-full text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Approval rules
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.rules) return null;

  return (
    <div className="w-full max-w-none text-left">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
        Approval rules
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Total rules: {data.total_rules}
      </p>

      <DataTable<ApprovalRuleRow>
        columns={[
          {
            key: "no",
            header: "No.",
            render: (_, idx) => (currentPage - 1) * PAGE_SIZE + idx + 1,
          },
          { key: "name", header: "Name", render: (row) => row.name },
          {
            key: "min_amount",
            header: "Min amount",
            render: (row) => row.min_amount,
          },
          {
            key: "max_amount",
            header: "Max amount",
            render: (row) => row.max_amount,
          },
          {
            key: "approver",
            header: "Approver (employee id)",
            render: (row) => row.approver,
          },
          {
            key: "is_active",
            header: "Active",
            render: (row) => <RuleActiveBadge isActive={row.is_active} />,
          },
        ]}
        data={paginatedRows}
        getRowKey={(row) => row.id}
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={rulesRows.length}
            onPageChange={setCurrentPage}
          />
        }
      />
    </div>
  );
}
