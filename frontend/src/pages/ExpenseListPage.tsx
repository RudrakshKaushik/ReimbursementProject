import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchExpenseRecords, type ExpenseRecord } from "../api/client";

function ExpenseListPage() {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchExpenseRecords();
        setRecords(data);
      } catch {
        setError("Failed to load expense records");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>My Expense Records</h2>
      {records.length === 0 && <p>No expense records yet.</p>}
      <ul className="card-list">
        {records.map((record) => (
          <li key={record.id} className="card">
            <h3>
              {record.employee?.name} -{" "}
              {new Date(record.month).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short"
              })}
            </h3>
            <p>Status: {record.status}</p>
            <p>Total amount: {record.total_amount}</p>
            <Link to={`/records/${record.id}`}>View details</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseListPage;

