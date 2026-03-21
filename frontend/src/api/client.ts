import axios from "axios";

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

export type ExpenseLineItemListResponse = {
  success: boolean;
  employee_email: string;
  total_items: number;
  expense_list: ExpenseLineItemEntry[];
};

const api = axios.create({
  baseURL: "/api",
  // Auth in this app is Django session cookie-based, so include cookies.
  withCredentials: true
});

export async function fetchEmployees(): Promise<EmployeeListResponse> {
  const response = await api.get<EmployeeListResponse>("/dashboard/employee/");
  return response.data;

}

export async function fetchExpenseList(): Promise<ExpenseListResponse> {
  const response = await api.get<ExpenseListResponse>("/dashboard/expenselist/");
  return response.data;
}

export async function fetchExpenseLineItemList(): Promise<ExpenseLineItemListResponse> {
  const response = await api.get<ExpenseLineItemListResponse>("/dashboard/expenselist/");
  return response.data;
}

export async function fetchExpenseRecords(): Promise<ExpenseRecord[]> {
  const response = await api.get<ExpenseRecord[]>("/expense-records/");
  return response.data;
}

export async function fetchExpenseRecord(id: string): Promise<ExpenseRecord> {
  const response = await api.get<ExpenseRecord>(`/expense-records/${id}/`);
  return response.data;
}

export async function approveExpenseRecord(id: string): Promise<ExpenseRecord> {
  const response = await api.post<ExpenseRecord>(`/expense-records/${id}/approve/`);
  return response.data;
}

export async function checkAuth(): Promise<boolean> {
  try {
    await api.get("/dashboard/", { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>("/login/", {
      email,
      password
    });
    return response.data;
  } catch (err) {
    // If the backend uses non-2xx for invalid credentials, try to extract the payload anyway.
    if (axios.isAxiosError(err) && err.response?.data) {
      const data = err.response.data as Partial<LoginErrorResponse>;
      if (data.success === false && typeof data.message === "string") {
        return {
          success: false,
          message: data.message
        };
      }
    }

    throw err;
  }
}

export default api;

