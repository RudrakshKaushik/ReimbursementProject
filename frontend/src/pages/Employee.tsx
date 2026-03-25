import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchEmployees } from "@/api/client";
import type { EmployeeListResponse, EmployeeItem } from "@/types";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 10;

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
          : "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function Employee() {
  const [data, setData] = useState<EmployeeListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchEmployees();
        setData(res);
      } catch (err) {
        const fallback = "Failed to load employees";
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

  const employees = data?.employees ?? [];
  const managerById = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return employees.slice(start, start + PAGE_SIZE);
  }, [employees, currentPage]);

  function resolveManager(manager: number | null) {
    if (manager == null) return "—";
    if (managerById.has(manager)) return managerById.get(manager)!;
    return String(manager);
  }

  if (loading) return <p className="text-left text-gray-600">Loading...</p>;

  if (error) {
    return (
      <div className="w-full text-left">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Employee List
        </h1>
        <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.employees) return null;

  return (
    <div className="w-full max-w-none text-left">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
        Employee List
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        Total employees: {data.total_employees}
      </p>

      <DataTable<EmployeeItem>
        columns={[
          {
            key: "id",
            header: "No.",
            render: (_, idx) => (currentPage - 1) * PAGE_SIZE + idx + 1,
          },
          {
            key: "name",
            header: "Name",
            render: (emp) => <span className="font-semibold text-gray-900">{emp.name}</span>,
          },
          { key: "email", header: "Email", render: (emp) => emp.email },
          {
            key: "manager",
            header: "Manager",
            render: (emp) => resolveManager(emp.manager),
          },
          {
            key: "status",
            header: "Status",
            render: (emp) => <StatusBadge active={emp.is_active} />,
          },
        ]}
        data={paginatedRows}
        getRowKey={(emp) => emp.id}
        footer={
          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={employees.length}
            onPageChange={setCurrentPage}
          />
        }
      />
    </div>
  );
}
