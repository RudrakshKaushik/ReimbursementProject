import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  approveExpenseRecord,
  fetchExpenseRecord,
  type ExpenseRecord
} from "../api/client";

function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!record) return <p>Not found</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="link-button">
        ← Back
      </button>

      <h2>
        Expense for {record.employee?.name} -{" "}
        {new Date(record.month).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short"
        })}
      </h2>

      <p>Status: {record.status}</p>
      <p>Total amount: {record.total_amount}</p>

      <h3>Line items</h3>
      {(!record.line_items || record.line_items.length === 0) && (
        <p>No line items yet.</p>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {record.line_items?.map((item) => (
            <tr key={item.id}>
              <td>{item.date}</td>
              <td>{item.description}</td>
              <td>{item.category}</td>
              <td>{item.vendor}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="actions">
        <button
          disabled={record.status === "approved" || approving}
          onClick={handleApprove}
          className="primary-button"
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

export default ExpenseDetailPage;

