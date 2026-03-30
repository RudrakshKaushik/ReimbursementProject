import React, { useEffect, useState } from "react";
import axios from "axios";
import { updateExpenseLineItem } from "@/api/client";
import type { ExpenseLineItemEntry, ExpenseLineItemUpdatePayload } from "@/types";

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

type EditFormState = {
  description: string;
  amount: string;
  category: string;
  vendor: string;
  date: string;
};

const emptyForm = (): EditFormState => ({
  description: "",
  amount: "",
  category: "",
  vendor: "",
  date: "",
});

export type EditExpenseLineItemModalProps = {
  item: ExpenseLineItemEntry | null;
  onClose: () => void;
  /** Called after a successful save so the parent can refetch data. */
  onSuccess: () => void | Promise<void>;
};

export function EditExpenseLineItemModal({
  item,
  onClose,
  onSuccess,
}: EditExpenseLineItemModalProps) {
  const [form, setForm] = useState<EditFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setForm({
      description: item.description ?? "",
      amount:
        item.amount != null && item.amount !== "" ? String(item.amount) : "",
      category: item.category ?? "",
      vendor: item.vendor ?? "",
      date: item.date ?? "",
    });
    setSaveError(null);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [item, onClose, saving]);

  if (!item) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amountTrim = form.amount.trim();
    let amountPayload: number | undefined;
    if (amountTrim !== "") {
      const n = parseFloat(amountTrim);
      if (Number.isNaN(n)) {
        setSaveError("Amount must be a valid number.");
        return;
      }
      amountPayload = n;
    }

    const payload: ExpenseLineItemUpdatePayload = {
      description: form.description,
      category: form.category,
      vendor: form.vendor,
      date: form.date.trim() || undefined,
    };
    if (amountPayload !== undefined) payload.amount = amountPayload;

    try {
      setSaving(true);
      setSaveError(null);
      await updateExpenseLineItem(item.id, payload);
      await onSuccess();
      onClose();
    } catch (err) {
      setSaveError(axiosErrorMessage(err, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-line-item-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="edit-line-item-title"
          className="text-lg font-semibold text-gray-900"
        >
          Edit expense line item
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Line item #{item.id} — all fields optional for partial update.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Amount
            <input
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Category
            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Vendor
            <input
              type="text"
              value={form.vendor}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendor: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Date (YYYY-MM-DD)
            <input
              type="text"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              placeholder="2026-03-30"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {saveError && (
            <p className="text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
