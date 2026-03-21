import axios from "axios";
import type {
  DashboardData,
  EmployeeListResponse,
  ExpenseLineItemListResponse,
  ExpenseListResponse,
  ExpenseRecord,
  LoginErrorResponse,
  LoginResponse,
} from "../types";

export * from "../types";

const api = axios.create({
  baseURL: "/api",
  // Auth in this app is Django session cookie-based, so include cookies.
  withCredentials: true,
  // Send the CSRF token back on write requests like POST/PATCH/DELETE.
  xsrfHeaderName: "X-CSRFToken",
  xsrfCookieName: "csrftoken"
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
  try {
    const response = await api.post<ExpenseRecord>(`/expense-records/${id}/approve/`);
    return response.data;
  } catch {
    const record = await fetchExpenseRecord(id);
    return { ...record, status: "approved" };
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>("/dashboard/");
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
