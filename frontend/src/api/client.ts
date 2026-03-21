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

const DEMO_EMPLOYEES: EmployeeListResponse = {
  success: true,
  total_employees: 14,
  employees: [
    { id: 1, name: "Shaury", email: "shaurydeep.saxena@bitloom.ai", manager: null, is_active: true },
    { id: 2, name: "Alex Chen", email: "alex.chen@bitloom.ai", manager: 1, is_active: true },
    { id: 3, name: "Jordan Lee", email: "jordan.lee@bitloom.ai", manager: 1, is_active: false },
    { id: 4, name: "Sam Wilson", email: "sam.wilson@bitloom.ai", manager: 2, is_active: true },
    { id: 5, name: "Riley Park", email: "riley.park@bitloom.ai", manager: 1, is_active: true },
    { id: 6, name: "Morgan Blake", email: "morgan.blake@bitloom.ai", manager: 2, is_active: true },
    { id: 7, name: "Casey Rivera", email: "casey.rivera@bitloom.ai", manager: 5, is_active: false },
    { id: 8, name: "Taylor Kim", email: "taylor.kim@bitloom.ai", manager: 1, is_active: true },
    { id: 9, name: "Jamie Fox", email: "jamie.fox@bitloom.ai", manager: 6, is_active: true },
    { id: 10, name: "Drew Hayes", email: "drew.hayes@bitloom.ai", manager: 2, is_active: false },
    { id: 11, name: "Quinn Reed", email: "quinn.reed@bitloom.ai", manager: 5, is_active: true },
    { id: 12, name: "Avery Stone", email: "avery.stone@bitloom.ai", manager: 1, is_active: true },
    { id: 13, name: "Skyler Moss", email: "skyler.moss@bitloom.ai", manager: 8, is_active: true },
    { id: 14, name: "Reese Cole", email: "reese.cole@bitloom.ai", manager: 6, is_active: false },
  ],
};

export async function fetchEmployees(): Promise<EmployeeListResponse> {
  // const response = await api.get<EmployeeListResponse>("/dashboard/employee/");
  // return response.data;
  return Promise.resolve(DEMO_EMPLOYEES);

}

const DEMO_EXPENSE_LIST: ExpenseListResponse = {
  success: true,
  employee_email: "shaurydeep.saxena@bitloom.ai",
  total_expenses: 12,
  expenses: [
    {
      id: 6,
      employee: { id: 1, name: "shaury", email: "shaurydeep.saxena@bitloom.ai", manager: null, is_active: true },
      month: "2026-03-01",
      status: "pending",
      total_amount: "478.69",
      current_approver: null,
      created_at: "2026-03-19T13:50:20.309811Z",
      updated_at: "2026-03-19T13:52:20.911654Z",
      line_items: [{ id: 30, description: "Fuel", date: "2018-12-07", category: "Petrol", amount: "11.89", vendor: "NABIL ZOUROB", created_at: "" }],
    },
    {
      id: 7,
      employee: { id: 1, name: "shaury", email: "shaurydeep.saxena@bitloom.ai", manager: null, is_active: true },
      month: "2026-02-01",
      status: "approved",
      total_amount: "125.00",
      current_approver: null,
      created_at: "2026-02-15T10:00:00Z",
      updated_at: "2026-02-16T11:00:00Z",
      line_items: [],
    },
    {
      id: 8,
      employee: { id: 2, name: "Alex Chen", email: "alex.chen@bitloom.ai", manager: 1, is_active: true },
      month: "2026-03-01",
      status: "pending",
      total_amount: "89.50",
      current_approver: 1,
      created_at: "2026-03-18T09:00:00Z",
      updated_at: "2026-03-18T09:00:00Z",
      line_items: [],
    },
    { id: 9, employee: { id: 1, name: "shaury", email: "shaurydeep.saxena@bitloom.ai", manager: null, is_active: true }, month: "2026-01-01", status: "rejected", total_amount: "210.00", current_approver: null, created_at: "", updated_at: "", line_items: [] },
    { id: 10, employee: { id: 2, name: "Alex Chen", email: "alex.chen@bitloom.ai", manager: 1, is_active: true }, month: "2026-02-01", status: "approved", total_amount: "55.00", current_approver: null, created_at: "", updated_at: "", line_items: [] },
    { id: 11, employee: { id: 3, name: "Jordan Lee", email: "jordan.lee@bitloom.ai", manager: 1, is_active: false }, month: "2026-03-01", status: "pending", total_amount: "320.00", current_approver: 1, created_at: "", updated_at: "", line_items: [] },
    { id: 12, employee: { id: 1, name: "shaury", email: "shaurydeep.saxena@bitloom.ai", manager: null, is_active: true }, month: "2025-12-01", status: "approved", total_amount: "199.99", current_approver: null, created_at: "", updated_at: "", line_items: [] },
    { id: 13, employee: { id: 2, name: "Alex Chen", email: "alex.chen@bitloom.ai", manager: 1, is_active: true }, month: "2025-12-01", status: "approved", total_amount: "78.50", current_approver: null, created_at: "", updated_at: "", line_items: [] },
    { id: 14, employee: { id: 4, name: "Sam Wilson", email: "sam.wilson@bitloom.ai", manager: 2, is_active: true }, month: "2026-01-01", status: "pending", total_amount: "156.25", current_approver: 2, created_at: "", updated_at: "", line_items: [] },
    { id: 15, employee: { id: 1, name: "shaury", email: "shaurydeep.saxena@bitloom.ai", manager: null, is_active: true }, month: "2025-11-01", status: "approved", total_amount: "442.00", current_approver: null, created_at: "", updated_at: "", line_items: [] },
    { id: 16, employee: { id: 5, name: "Riley Park", email: "riley.park@bitloom.ai", manager: 1, is_active: true }, month: "2026-02-01", status: "rejected", total_amount: "95.00", current_approver: null, created_at: "", updated_at: "", line_items: [] },
    { id: 17, employee: { id: 3, name: "Jordan Lee", email: "jordan.lee@bitloom.ai", manager: 1, is_active: false }, month: "2026-01-01", status: "approved", total_amount: "67.80", current_approver: null, created_at: "", updated_at: "", line_items: [] },
  ],
};

export async function fetchExpenseList(): Promise<ExpenseListResponse> {
  // const response = await api.get<ExpenseListResponse>("/dashboard/expenselist/");
  // return response.data;
  return Promise.resolve(DEMO_EXPENSE_LIST);
}

const DEMO_EXPENSE_LINE_ITEM_LIST: ExpenseLineItemListResponse = {
  success: true,
  employee_email: "shaurydeep.saxena@bitloom.ai",
  total_items: 7,
  expense_list: [
    { id: 30, description: "NABIL ZOUROB, 35426 GODDARD RD. Fuel: Regular, 4.955 Gallons.", date: "2018-12-07", category: "Petrol/Diesel bill", amount: "11.89", vendor: "NABIL ZOUROB", created_at: "2026-03-19T13:50:39.928162Z" },
    { id: 31, description: "Black Rock Bar & Grill, Canton, MI. Crab Cakes, Ribeye Filet.", date: "2018-12-06", category: "Food and Beverages", amount: "154.31", vendor: "Black Rock Bar & Grill", created_at: "2026-03-19T13:50:39.938841Z" },
    { id: 32, description: "STARBUCKS Store #859. Chorizo Egg Sndwch, Gr Latte Macchiato.", date: "2018-12-11", category: "Food and Beverages", amount: "10.34", vendor: "STARBUCKS", created_at: "2026-03-19T13:50:39.941843Z" },
    { id: 33, description: "Embassy Suites Livonia Ganders. Subtotal charge.", date: "2018-12-06", category: "Food and Beverages", amount: "16.96", vendor: "Embassy Suites", created_at: "2026-03-19T13:50:39.944843Z" },
    { id: 34, description: "Black Rock Bar & Grill. Total including $20.00 tip.", date: "2018-12-06", category: "Food and Beverages", amount: "174.31", vendor: "Black Rock Bar & Grill", created_at: "2026-03-19T13:50:39.948838Z" },
    { id: 35, description: "Starbucks Coffee #2485. Banana Nut Bread.", date: "2018-12-06", category: "Food and Beverages", amount: "6.25", vendor: "Starbucks Coffee", created_at: "2026-03-19T13:50:39.950846Z" },
    { id: 36, description: "BLACK SALT Creve Coeur. Order: 10 - Back.", date: "2025-09-16", category: "Food and Beverages", amount: "104.63", vendor: "BLACK SALT Creve Coeur", created_at: "2026-03-19T13:50:45.899093Z" },
  ],
};

export async function fetchExpenseLineItemList(): Promise<ExpenseLineItemListResponse> {
  // const response = await api.get<ExpenseLineItemListResponse>("/dashboard/expenselist/");
  // return response.data;
  return Promise.resolve(DEMO_EXPENSE_LINE_ITEM_LIST);
}

export async function fetchExpenseRecords(): Promise<ExpenseRecord[]> {
  const response = await api.get<ExpenseRecord[]>("/expense-records/");
  return response.data;
}

const DEMO_EXPENSE_RECORD: ExpenseRecord = {
  id: 6,
  employee: { name: "Shaury" },
  month: "2026-03-01",
  status: "pending",
  total_amount: 478.69,
  line_items: [
    { id: 30, date: "2018-12-07", description: "NABIL ZOUROB. Fuel: Regular, 4.955 Gallons.", category: "Petrol/Diesel bill", vendor: "NABIL ZOUROB", amount: 11.89 },
    { id: 31, date: "2018-12-06", description: "Black Rock Bar & Grill. Crab Cakes, Ribeye Filet.", category: "Food and Beverages", vendor: "Black Rock Bar & Grill", amount: 154.31 },
    { id: 32, date: "2018-12-11", description: "STARBUCKS Store #859.", category: "Food and Beverages", vendor: "STARBUCKS", amount: 10.34 },
    { id: 33, date: "2018-12-06", description: "Embassy Suites. Subtotal charge.", category: "Food and Beverages", vendor: "Embassy Suites", amount: 16.96 },
    { id: 34, date: "2018-12-06", description: "Black Rock Bar & Grill. Total including tip.", category: "Food and Beverages", vendor: "Black Rock Bar & Grill", amount: 174.31 },
  ],
};

export async function fetchExpenseRecord(id: string): Promise<ExpenseRecord> {
  try {
    const response = await api.get<ExpenseRecord>(`/expense-records/${id}/`);
    return response.data;
  } catch {
    return { ...DEMO_EXPENSE_RECORD, id: Number(id) || id };
  }
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

const DEMO_DASHBOARD: DashboardData = {
  success: true,
  employee: {
    id: 1,
    name: "Shaury",
    email: "shaurydeep.saxena@bitloom.ai",
    manager: null,
    is_active: true,
  },
  expenses: [
    { id: 6, month: "2026-03-01", status: "pending", total_amount: "478.69", line_items: [] },
    { id: 7, month: "2026-02-01", status: "approved", total_amount: "125.00", line_items: [] },
    { id: 8, month: "2026-03-01", status: "pending", total_amount: "89.50", line_items: [] },
    { id: 9, month: "2026-01-01", status: "rejected", total_amount: "210.00", line_items: [] },
    { id: 10, month: "2026-02-01", status: "approved", total_amount: "55.00", line_items: [] },
  ],
  expense_list: [
    { id: 30, description: "NABIL ZOUROB. Fuel: Regular, 4.955 Gallons.", date: "2018-12-07", category: "Petrol/Diesel bill", amount: "11.89", vendor: "NABIL ZOUROB", created_at: "" },
    { id: 31, description: "Black Rock Bar & Grill. Crab Cakes, Ribeye Filet.", date: "2018-12-06", category: "Food and Beverages", amount: "154.31", vendor: "Black Rock Bar & Grill", created_at: "" },
    { id: 32, description: "STARBUCKS Store #859.", date: "2018-12-11", category: "Food and Beverages", amount: "10.34", vendor: "STARBUCKS", created_at: "" },
    { id: 33, description: "Embassy Suites. Subtotal charge.", date: "2018-12-06", category: "Food and Beverages", amount: "16.96", vendor: "Embassy Suites", created_at: "" },
    { id: 34, description: "Black Rock Bar & Grill. Total including tip.", date: "2018-12-06", category: "Food and Beverages", amount: "174.31", vendor: "Black Rock Bar & Grill", created_at: "" },
  ],
  sections: ["employee", "expenses", "expense_list"],
};

export async function fetchDashboard(): Promise<DashboardData> {
  try {
    const response = await api.get<DashboardData>("/dashboard/");
    return response.data;
  } catch {
    return DEMO_DASHBOARD;
  }
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
