import type React from "react";

const thBase = "px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500";
const tdBase = "px-4 py-3.5 text-sm";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T, rowIndex: number) => React.ReactNode;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  footer?: React.ReactNode;
  minWidth?: string;
}

export function DataTable<T = unknown>({
  columns,
  data,
  getRowKey,
  footer,
  minWidth = "640px",
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth: minWidth.includes("px") ? minWidth : `${minWidth}px` }}
        >
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${thBase} ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={String(getRowKey(row))}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${tdBase} ${col.align === "right" ? "text-right" : ""} ${col.cellClassName ?? ""}`}
                  >
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

export default DataTable;
