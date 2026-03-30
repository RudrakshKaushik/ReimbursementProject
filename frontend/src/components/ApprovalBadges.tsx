import React from "react";

const dotBase =
  "inline-block h-2.5 w-2.5 shrink-0 rounded-full align-middle shadow-sm ring-2 ring-black/5";

const tooltipPanel =
  "pointer-events-none absolute bottom-full left-1/2 z-[100] mb-1.5 max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 whitespace-normal rounded-md bg-gray-900 px-2 py-1.5 text-left text-xs font-medium leading-snug text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100";

function StatusDot({
  className,
  title,
  label,
}: {
  className: string;
  title: string;
  label: string;
}) {
  return (
    <span
      className="group relative inline-flex cursor-default items-center justify-center align-middle"
      aria-label={label}
      title={title}
    >
      <span className={`${dotBase} ${className}`} aria-hidden />
      <span role="tooltip" className={tooltipPanel}>
        {title}
      </span>
    </span>
  );
}

/**
 * Expense / approval record status strings (e.g. APPROVED, REJECTED, ADMIN PENDING).
 */
export function ApprovalRecordStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes("reject")) {
    return (
      <StatusDot
        className="bg-red-500"
        title={status}
        label={`Status: ${status}`}
      />
    );
  }
  if (s.includes("pending")) {
    return (
      <StatusDot
        className="bg-amber-400"
        title={status}
        label={`Status: ${status}`}
      />
    );
  }
  if (s.includes("approv")) {
    return (
      <StatusDot
        className="bg-emerald-500"
        title={status}
        label={`Status: ${status}`}
      />
    );
  }
  return (
    <StatusDot
      className="bg-slate-400"
      title={status}
      label={`Status: ${status}`}
    />
  );
}

/**
 * Line-item `approval_status` workflow label; empty shows a neutral dot.
 */
export function WorkflowApprovalStatusBadge({
  approvalStatus,
}: {
  approvalStatus: string | undefined;
}) {
  const raw = approvalStatus?.trim();
  if (!raw) {
    return (
      <StatusDot
        className="bg-slate-300"
        title="No approval status"
        label="Approval status unknown"
      />
    );
  }
  return <ApprovalRecordStatusBadge status={raw} />;
}

/**
 * Line-item `is_approved` — green dot vs red dot.
 */
export function LineItemApprovedBadge({
  isApproved,
}: {
  isApproved: boolean | undefined;
}) {
  if (isApproved === true) {
    return (
      <StatusDot
        className="bg-emerald-500"
        title="Approved"
        label="Approved"
      />
    );
  }
  if (isApproved === false) {
    return (
      <StatusDot
        className="bg-red-500"
        title="Pending"
        label="Pending"
      />
    );
  }
  return (
    <StatusDot
      className="bg-slate-300"
      title="Unknown"
      label="Approval unknown"
    />
  );
}

/**
 * Approval rule `is_active` — green vs red dot.
 */
export function RuleActiveBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <StatusDot
        className="bg-emerald-500"
        title="Active"
        label="Rule active"
      />
    );
  }
  return (
    <StatusDot
      className="bg-red-500"
      title="Inactive"
      label="Rule inactive"
    />
  );
}
