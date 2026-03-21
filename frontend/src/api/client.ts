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

const api = axios.create({
  baseURL: "/api",
  // Auth in this app is Django session cookie-based, so include cookies.
  withCredentials: true,
  // Send the CSRF token back on write requests like POST/PATCH/DELETE.
  xsrfHeaderName: "X-CSRFToken",
  xsrfCookieName: "csrftoken"
});

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
    // If the session cookie is valid, this returns 200.
    await api.get("/dashboard/", { timeout: 2000 });
    return true;
  } catch (err) {
    // If the session cookie is missing/expired (401/403) OR the backend
    // is unreachable (network error), treat as logged out so we can redirect.
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403) return false;
      // Network / CORS / proxy errors often have no response; treat as unauthenticated.
      if (!err.response) return false;
      return false;
    }

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

