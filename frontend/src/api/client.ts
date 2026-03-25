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

const envApiUrl =
  (import.meta.env as Record<string, string | undefined>).api_url ??
  import.meta.env.VITE_API_URL;

const AUTH_COOKIE_NAME = "auth_token";

function setAuthTokenCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

function clearAuthTokenCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function getAuthTokenFromCookie(): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(`${AUTH_COOKIE_NAME}=`.length));
}

function getAuthToken(): string | null {
  return getAuthTokenFromCookie();
}

const api = axios.create({
  baseURL: envApiUrl,
  // Auth in this app is Django session cookie-based, so include cookies.
  withCredentials: true,
  // Send the CSRF token back on write requests like POST/PATCH/DELETE.
  xsrfHeaderName: "X-CSRFToken",
  xsrfCookieName: "csrftoken"
});

const existingToken = getAuthToken();
if (existingToken) {
  api.defaults.headers.common.Authorization = `Token ${existingToken}`;
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Token ${token}`;
  } else if (config.headers) {
    delete config.headers.Authorization;
  }
  return config;
});

export async function fetchEmployees(): Promise<EmployeeListResponse> {
  const response = await api.get<EmployeeListResponse>("/dashboard/employee/");
  return response.data;

}

export async function fetchExpenseList(): Promise<ExpenseListResponse> {
  const response = await api.get<ExpenseListResponse>("/dashboard/expenses/");
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
    await api.post(`/approval_api/`, { expense_record_id: id });
    // approval_api updates the ExpenseRecord on the backend, so refetch to return the full record
    return await fetchExpenseRecord(id);
  } catch {
    const record = await fetchExpenseRecord(id);
    return record;
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>("/dashboard/");
  return response.data;
}

export async function checkAuth(): Promise<boolean> {
  if (getAuthToken()) return true;
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
    if (response.data.success) {
      setAuthTokenCookie(response.data.token);
      api.defaults.headers.common.Authorization = `Token ${response.data.token}`;
    }
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

export function logout() {
  clearAuthTokenCookie();
  delete api.defaults.headers.common.Authorization;
}

export default api;
