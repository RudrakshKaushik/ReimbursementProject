export type ExpenseEmployee = {
  name: string;
};

export type ExpenseLineItem = {
  id: string | number;
  date: string;
  description: string;
  category: string;
  vendor: string;
  amount: number;
};

export type ExpenseRecord = {
  id: string | number;
  employee?: ExpenseEmployee;
  month: string;
  status: string;
  total_amount: number;
  line_items?: ExpenseLineItem[];
};

export type ApprovalApiResponse = {
  expense_record_id: string | number;
  status: string;
  total_amount: number;
  violations?: Array<{
    line_item_id: string | number;
    amount: number;
    reason: string;
  }>;
  approvals_created?: Array<string | number>;
};

export type LoginSuccessResponse = {
  token: string;
  success: true;
  message: string;
  user_id: number;
  username: string;
  /** e.g. `"admin"` — controls approval UI visibility */
  role: string;
  redirect_url: string;
};

export type LoginErrorResponse = {
  success: false;
  message: string;
  user_id?: number;
  redirect_url?: string;
};

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

export type EmployeeItem = {
  id: number;
  name: string;
  email: string;
  manager: number | null;
  is_active: boolean;
};

export type EmployeeListResponse = {
  success: boolean;
  total_employees: number;
  employees: EmployeeItem[];
};

export type ExpenseListEmployee = EmployeeItem;

export type AttachmentInfo = {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  file: string;
};

export type ExpenseLineItemEntry = {
  id: number;
  description: string;
  date: string;
  category: string;
  /** API may return number or string */
  amount: string | number;
  vendor: string;
  attachment?: AttachmentInfo;
  created_at?: string;
  /** Final approval flag — independent of `approval_status` workflow text */
  is_approved?: boolean;
  /** Workflow / queue label (e.g. pending) — not the same as `is_approved` */
  approval_status?: string;
};

export type ExpenseListItem = {
  id: number;
  employee: ExpenseListEmployee;
  month: string;
  status: string;
  total_amount: string;
  current_approver: number | null;
  created_at: string;
  updated_at: string;
  line_items?: ExpenseLineItemEntry[];
};

export type ExpenseListResponse = {
  success: boolean;
  employee_email: string;
  total_expenses: number;
  expenses: ExpenseListItem[];
};

export type ExpenseLineItemListResponse = {
  success: boolean;
  employee_email: string;
  total_items: number;
  expense_list: ExpenseLineItemEntry[];
};

export type DashboardExpense = {
  id: number;
  month: string;
  status: string;
  total_amount: string;
  line_items?: ExpenseLineItemEntry[];
};

export type DashboardData = {
  success: boolean;
  employee: EmployeeItem;
  expenses: DashboardExpense[];
  expense_list: ExpenseLineItemEntry[];
  sections: string[];
};

export type MyApprovalRow = {
  id: number;
  expense_record_id: number;
  employee: string;
  status: string;
};

export type MyApprovalsResponse = {
  success: boolean;
  approvals: MyApprovalRow[];
};

export type ApprovalRuleRow = {
  id: number;
  name: string;
  min_amount: string;
  max_amount: string;
  approver: number;
  is_active: boolean;
};

export type ApprovalRulesResponse = {
  success: boolean;
  total_rules: number;
  rules: ApprovalRuleRow[];
};

export type AllApprovalRow = {
  approval_id: number;
  expense_record_id: number;
  employee_id: number;
  employee_name: string;
  approver_name: string;
  status: string;
  comments: string | null;
  approved_at: string | null;
};

export type AllApprovalsResponse = {
  success: boolean;
  total_approvals: number;
  approvals: AllApprovalRow[];
};

/** PATCH body for `update_expense_line_item` (partial) */
export type ExpenseLineItemUpdatePayload = {
  description?: string;
  date?: string;
  category?: string;
  amount?: number | string;
  vendor?: string;
};
