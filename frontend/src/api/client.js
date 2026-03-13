import axios from "axios";

const api = axios.create({
  baseURL: "/api"
});

export async function fetchExpenseRecords() {
  const response = await api.get("/expense-records/");
  return response.data;
}

export async function fetchExpenseRecord(id) {
  const response = await api.get(`/expense-records/${id}/`);
  return response.data;
}

export async function approveExpenseRecord(id) {
  const response = await api.post(`/expense-records/${id}/approve/`);
  return response.data;
}

export default api;

