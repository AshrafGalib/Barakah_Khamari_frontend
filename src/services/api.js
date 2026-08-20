// ======================================================
// API Configuration & Environment
// ======================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://barakah-khamari-server.vercel.app/api";

const TOKEN_KEY = "barakah_token";
const USER_KEY = "barakah_user";

// ======================================================
// Session Management Helpers
// ======================================================

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const saveAuthSession = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing stored user session:", error);
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ======================================================
// Core HTTP Client Request Engine
// ======================================================

const buildQueryString = (params) => {
  if (!params || typeof params !== "object") return "";
  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
  const query = new URLSearchParams(cleanedParams).toString();
  return query ? `?${query}` : "";
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get("content-type") || "";

    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON Response received:", {
        status: response.status,
        url,
        text,
      });
      throw new Error(
        `সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে। (Status: ${response.status})`
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${options.method || "GET"} ${endpoint}]:`, error.message);
    throw error;
  }
};

// ======================================================
// Generic API Wrapper Object
// ======================================================

const api = {
  get: (url, params = {}, config = {}) =>
    request(`${url}${buildQueryString(params)}`, { method: "GET", ...config }),

  post: (url, data, config = {}) =>
    request(url, { method: "POST", body: JSON.stringify(data), ...config }),

  patch: (url, data, config = {}) =>
    request(url, { method: "PATCH", body: JSON.stringify(data), ...config }),

  put: (url, data, config = {}) =>
    request(url, { method: "PUT", body: JSON.stringify(data), ...config }),

  delete: (url, config = {}) =>
    request(url, { method: "DELETE", ...config }),
};

// ======================================================
// Domain Service Modules
// ======================================================

export const authAPI = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const { token, user } = response?.data || {};
    if (token) saveAuthSession(token, user);
    return response;
  },

  me: () => api.get("/auth/me"),
  createUser: (userData) => api.post("/auth/register", userData),
  logout: () => clearAuthSession(),
};

export const roleAPI = {
  getAll: (params) => api.get("/roles", params),
  getById: (id) => api.get(`/roles/${id}`),
  getPermissions: () => api.get("/roles/permissions"),
  create: (roleData) => api.post("/roles", roleData),
  update: (id, roleData) => api.patch(`/roles/${id}`, roleData),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const userAPI = {
  getAll: (params) => api.get("/users", params),
  getById: (id) => api.get(`/users/${id}`),
  getAvailableRoles: () => api.get("/users/available-roles"),
  create: (userData) => api.post("/users", userData),
  update: (id, userData) => api.patch(`/users/${id}`, userData),
  updateRole: (id, roleId) => api.patch(`/users/${id}/role`, { roleId }),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/users/${id}`),
};

export const categoryAPI = {
  getAll: (params) => api.get("/categories", params),
  getById: (id) => api.get(`/categories/${id}`),
  create: (category) => api.post("/categories", category),
  update: (id, category) => api.patch(`/categories/${id}`, category),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const supplierAPI = {
  getAll: (params) => api.get("/suppliers", params),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (supplier) => api.post("/suppliers", supplier),
  update: (id, supplier) => api.patch(`/suppliers/${id}`, supplier),
  delete: (id) => api.delete(`/suppliers/${id}`),
  payDue: (id, payment) => api.post(`/suppliers/${id}/due-payment`, payment),
};

export const productAPI = {
  getAll: (params) => api.get("/products", params),
  getById: (id) => api.get(`/products/${id}`),
  create: (product) => api.post("/products", product),
  update: (id, product) => api.patch(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
};

export const purchaseAPI = {
  getAll: (params) => api.get("/purchases", params),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (purchase) => api.post("/purchases", purchase),
  delete: (id) => api.delete(`/purchases/${id}`),
  payDue: (id, payment) => api.patch(`/purchases/${id}/due-payment`, payment),
};

export const customerAPI = {
  getAll: (params) => api.get("/customers", params),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customer) => api.post("/customers", customer),
  update: (id, customer) => api.patch(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
  payDue: (id, payment) => api.patch(`/customers/${id}/due-payment`, payment),
};

export const salesAPI = {
  getAll: (params) => api.get("/sales", params),
  getById: (id) => api.get(`/sales/${id}`),
  create: (sale) => api.post("/sales", sale),
  delete: (id) => api.delete(`/sales/${id}`),
};

export const expenseAPI = {
  getAll: (params) => api.get("/expenses", params),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post("/expenses", data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const dashboardAPI = {
  getDashboard: (filter = "today", fromDate = "", toDate = "") =>
    api.get("/dashboard", { filter, fromDate, toDate }),
};

export const cashBalanceAPI = {
  getToday: () => api.get("/cash-balance/today"),
  getByDate: (date) => api.get(`/cash-balance/${date}`),
  checkOpeningBalance: () => api.get("/cash-balance/opening-status"),
  setOpeningBalance: (openingBalance, date = "") =>
    api.post("/cash-balance/opening", {
      openingBalance: Number(openingBalance) || 0,
      ...(date ? { date } : {}),
    }),
};

// ==========================================
// Reports API Module
// ==========================================

export const reportsAPI = {
  getSummary: (params) => api.get("/reports/summary", params),
};

export default api;