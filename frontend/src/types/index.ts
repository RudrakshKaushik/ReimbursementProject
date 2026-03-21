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

export type LoginSuccessResponse = {
  success: true;
  message: string;
  user_id: number;
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
  amount: string;
  vendor: string;
  attachment?: AttachmentInfo;
  created_at: string;
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
