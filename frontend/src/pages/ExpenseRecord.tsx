import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  approveExpenseRecord,
  fetchExpenseRecord,
  type ExpenseRecord
} from "@/api/client";

function ExpenseRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/expense";

  const [record, setRecord] = useState<ExpenseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const idValue = id;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchExpenseRecord(idValue);
        setRecord(data);
      } catch {
        setError("Failed to load expense record");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleApprove() {
    if (!id) return;

    try {
      setApproving(true);
      const updated = await approveExpenseRecord(id);
      setRecord(updated);
      // Optional: navigate back to list after approval
      // navigate("/");
    } catch {
      alert("Failed to approve record");
    } finally {
      setApproving(false);
    }
  }

  if (loading) return <p className="text-gray-600">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!record) return <p className="text-gray-600">Not found</p>;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(returnTo)}
        className="mb-3 cursor-pointer border-none bg-transparent p-0 text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        Expense for {record.employee?.name} -{" "}
        {new Date(record.month).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short"
        })}
      </h2>

      <p className="mb-1 text-gray-700">Status: {record.status}</p>
      <p className="mb-4 text-gray-700">Total amount: {record.total_amount}</p>

      <h3 className="mb-2 text-base font-semibold text-gray-900">Line items</h3>
      {(!record.line_items || record.line_items.length === 0) && (
        <p className="mb-4 text-gray-500">No line items yet.</p>
      )}

      {record.line_items && record.line_items.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Vendor</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {record.line_items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{item.date}</td>
                  <td className="px-4 py-3 text-gray-700">{item.description}</td>
                  <td className="px-4 py-3 text-gray-700">{item.category}</td>
                  <td className="px-4 py-3 text-gray-700">{item.vendor}</td>
                  <td className="px-4 py-3 text-gray-700">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          disabled={record.status === "approved" || approving}
          onClick={handleApprove}
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-default disabled:bg-gray-400"
        >
          {record.status === "approved"
            ? "Approved"
            : approving
              ? "Approving..."
              : "Approve"}
        </button>
      </div>
    </div>
  );
}

export default ExpenseRecord;

