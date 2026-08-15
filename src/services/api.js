const API_BASE_URL =
  "https://barakah-khamari-server.vercel.app/api";

// ======================================================
// Main Request Function
// ======================================================

const request = async (url, options = {}) => {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(
      fullUrl,
      {
        ...options,

        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      }
    );

    // ====================================================
    // Read Response Safely
    // ====================================================

    const contentType =
      response.headers.get("content-type") || "";

    let data;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data = await response.json();
    } else {
      const text =
        await response.text();

      console.error(
        "Non-JSON Server Response:",
        {
          status: response.status,
          url: fullUrl,
          response: text,
        }
      );

      throw new Error(
        `সার্ভার থেকে সঠিক JSON response পাওয়া যায়নি। Status: ${response.status}`
      );
    }

    // ====================================================
    // Handle HTTP Error
    // ====================================================

    if (!response.ok) {
      console.error(
        "API Error:",
        {
          status: response.status,
          url: fullUrl,
          data,
        }
      );

      throw new Error(
        data?.message ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error(
      "API Request Error:",
      {
        url: fullUrl,
        method:
          options.method || "GET",
        error:
          error?.message || error,
      }
    );

    throw error;
  }
};

// ======================================================
// Generic API Object
// ======================================================

const api = {
  // ----------------------------------------------------
  // GET
  // ----------------------------------------------------

  get: async (
    url,
    config = {}
  ) => {
    const {
      params,
      ...options
    } = config;

    const queryString =
      params &&
      Object.keys(params).length
        ? `?${new URLSearchParams(
            params
          ).toString()}`
        : "";

    return request(
      `${url}${queryString}`,
      {
        method: "GET",
        ...options,
      }
    );
  },

  // ----------------------------------------------------
  // POST
  // ----------------------------------------------------

  post: async (
    url,
    data,
    config = {}
  ) => {
    return request(
      url,
      {
        method: "POST",

        body: JSON.stringify(
          data
        ),

        ...config,
      }
    );
  },

  // ----------------------------------------------------
  // PATCH
  // ----------------------------------------------------

  patch: async (
    url,
    data,
    config = {}
  ) => {
    return request(
      url,
      {
        method: "PATCH",

        body: JSON.stringify(
          data
        ),

        ...config,
      }
    );
  },

  // ----------------------------------------------------
  // DELETE
  // ----------------------------------------------------

  delete: async (
    url,
    config = {}
  ) => {
    return request(
      url,
      {
        method: "DELETE",
        ...config,
      }
    );
  },
};

// ======================================================
// Category API
// ======================================================

export const categoryAPI = {
  // ----------------------------------------------------
  // Get All Categories
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/categories"
    );
  },

  // ----------------------------------------------------
  // Get Category By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/categories/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Category
  // ----------------------------------------------------

  create: (category) => {
    return request(
      "/categories",
      {
        method: "POST",

        body: JSON.stringify(
          category
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Update Category
  // ----------------------------------------------------

  update: (
    id,
    category
  ) => {
    return request(
      `/categories/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          category
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Category
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/categories/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

// ======================================================
// Supplier API
// ======================================================

export const supplierAPI = {
  // ----------------------------------------------------
  // Get All Suppliers
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/suppliers"
    );
  },

  // ----------------------------------------------------
  // Get Supplier By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/suppliers/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Supplier
  // ----------------------------------------------------

  create: (supplier) => {
    return request(
      "/suppliers",
      {
        method: "POST",

        body: JSON.stringify(
          supplier
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Update Supplier
  // ----------------------------------------------------

  update: (
    id,
    supplier
  ) => {
    return request(
      `/suppliers/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          supplier
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Supplier
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/suppliers/${id}`,
      {
        method: "DELETE",
      }
    );
  },

  // ----------------------------------------------------
  // Supplier Due Payment
  //
  // Supplier-এর outstanding purchase due payment।
  //
  // Example:
  // Purchase Total = 5,000
  // Previously Paid = 3,000
  // Due = 2,000
  //
  // পরে 2,000 টাকা payment করলে
  // Supplier due কমবে
  // এবং Cash Balance থেকে টাকা বাদ যাবে।
  // ----------------------------------------------------

 payDue: (
  id,
  payment
) => {
  return request(
    `/suppliers/${id}/due-payment`,
    {
      method: "POST",

      body: JSON.stringify(
        payment
      ),
    }
  );
},
};

// ======================================================
// Product API
// ======================================================

export const productAPI = {
  // ----------------------------------------------------
  // Get All Products
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/products"
    );
  },

  // ----------------------------------------------------
  // Get Product By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/products/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Product
  // ----------------------------------------------------

  create: (product) => {
    return request(
      "/products",
      {
        method: "POST",

        body: JSON.stringify(
          product
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Update Product
  // ----------------------------------------------------

  update: (
    id,
    product
  ) => {
    return request(
      `/products/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          product
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Product
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/products/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

// ======================================================
// Purchase API
// ======================================================

export const purchaseAPI = {
  // ----------------------------------------------------
  // Get All Purchases
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/purchases"
    );
  },

  // ----------------------------------------------------
  // Get Purchase By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/purchases/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Purchase
  // ----------------------------------------------------

  create: (purchase) => {
    return request(
      "/purchases",
      {
        method: "POST",

        body: JSON.stringify(
          purchase
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Purchase
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/purchases/${id}`,
      {
        method: "DELETE",
      }
    );
  },

  // ----------------------------------------------------
  // Purchase Due Payment
  //
  // নির্দিষ্ট Purchase-এর outstanding due payment।
  //
  // Example:
  // Total = 5,000
  // Paid = 3,000
  // Due = 2,000
  //
  // পরে 2,000 payment করলে
  // purchase due = 0
  // এবং cash balance update হবে।
  // ----------------------------------------------------

  payDue: (
    id,
    payment
  ) => {
    return request(
      `/purchases/${id}/due-payment`,
      {
        method: "PATCH",

        body: JSON.stringify(
          payment
        ),
      }
    );
  },
};

// ======================================================
// Customer API
// ======================================================

export const customerAPI = {
  // ----------------------------------------------------
  // Get All Customers
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/customers"
    );
  },

  // ----------------------------------------------------
  // Get Customer By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/customers/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Customer
  // ----------------------------------------------------

  create: (customer) => {
    return request(
      "/customers",
      {
        method: "POST",

        body: JSON.stringify(
          customer
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Update Customer
  // ----------------------------------------------------

  update: (
    id,
    customer
  ) => {
    return request(
      `/customers/${id}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          customer
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Customer
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/customers/${id}`,
      {
        method: "DELETE",
      }
    );
  },

  // ----------------------------------------------------
  // Customer Due Payment
  //
  // Customer pays outstanding due.
  // This is treated as cash inflow.
  // ----------------------------------------------------

  payDue: (
    id,
    payment
  ) => {
    return request(
      `/customers/${id}/due-payment`,
      {
        method: "PATCH",

        body: JSON.stringify(
          payment
        ),
      }
    );
  },
};

// ======================================================
// Sales API
// ======================================================

export const salesAPI = {
  // ----------------------------------------------------
  // Get All Sales
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/sales"
    );
  },

  // ----------------------------------------------------
  // Get Sale By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/sales/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Sale
  // ----------------------------------------------------

  create: (sale) => {
    return request(
      "/sales",
      {
        method: "POST",

        body: JSON.stringify(
          sale
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Sale
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/sales/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

// ======================================================
// Expense API
// ======================================================

export const expenseAPI = {
  // ----------------------------------------------------
  // Get All Expenses
  // ----------------------------------------------------

  getAll: () => {
    return request(
      "/expenses"
    );
  },

  // ----------------------------------------------------
  // Get Expense By ID
  // ----------------------------------------------------

  getById: (id) => {
    return request(
      `/expenses/${id}`
    );
  },

  // ----------------------------------------------------
  // Create Expense
  // ----------------------------------------------------

  create: (data) => {
    return request(
      "/expenses",
      {
        method: "POST",

        body: JSON.stringify(
          data
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Update Expense
  // ----------------------------------------------------

  update: (
    id,
    data
  ) => {
    return request(
      `/expenses/${id}`,
      {
        method: "PUT",

        body: JSON.stringify(
          data
        ),
      }
    );
  },

  // ----------------------------------------------------
  // Delete Expense
  // ----------------------------------------------------

  delete: (id) => {
    return request(
      `/expenses/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

// ======================================================
// Dashboard API
// ======================================================

export const dashboardAPI = {
  // ----------------------------------------------------
  // Get Dashboard Data
  // ----------------------------------------------------

  getDashboard: (
    filter = "today",
    fromDate = "",
    toDate = ""
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      "filter",
      filter
    );

    if (fromDate) {
      params.set(
        "fromDate",
        fromDate
      );
    }

    if (toDate) {
      params.set(
        "toDate",
        toDate
      );
    }

    return request(
      `/dashboard?${params.toString()}`
    );
  },
};

// ======================================================
// Cash Balance API
// ======================================================

export const cashBalanceAPI = {
  // ----------------------------------------------------
  // Get Today's Cash Balance
  // ----------------------------------------------------

  getToday: () => {
    return request(
      "/cash-balance/today"
    );
  },

  // ----------------------------------------------------
  // Get Cash Balance By Date
  // ----------------------------------------------------

  getByDate: (date) => {
    return request(
      `/cash-balance/${date}`
    );
  },

  // ----------------------------------------------------
  // Check Opening Balance Status
  //
  // GET:
  // /api/cash-balance/opening-status
  //
  // Used by Dashboard on initial load.
  // ----------------------------------------------------

  checkOpeningBalance: () => {
    return request(
      "/cash-balance/opening-status"
    );
  },

  // ----------------------------------------------------
  // Set Opening Balance
  //
  // POST:
  // /api/cash-balance/opening
  //
  // Existing backend route.
  // ----------------------------------------------------

  setOpeningBalance: (
    openingBalance,
    date = ""
  ) => {
    const data = {
      openingBalance:
        Number(
          openingBalance
        ) || 0,
    };

    if (date) {
      data.date = date;
    }

    return request(
      "/cash-balance/opening",
      {
        method: "POST",

        body: JSON.stringify(
          data
        ),
      }
    );
  },
};

// ======================================================
// Default Export
// ======================================================

export default api;