import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { productAPI } from "../services/api";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("সব");

  // ==========================================
  // Load Products
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await productAPI.getAll();

        if (cancelled) return;

        setProducts(response.data || []);
      } catch (error) {
        if (cancelled) return;

        toast.error(
          error.message || "Inventory লোড করা যায়নি"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // Categories
  // ==========================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.categoryName)
          .filter(Boolean)
      ),
    ];

    return uniqueCategories;
  }, [products]);

  // ==========================================
  // Stock Information
  // ==========================================

  const getStockInfo = (product) => {
    const isPoultry = product.unit === "কেজি + পিস";

    if (isPoultry) {
      const pieces = Number(product.stockPieces) || 0;
      const weight = Number(product.totalWeight) || 0;
      const minimumPieces =
        Number(product.minimumPieces) || 0;

      if (pieces <= 0 || weight <= 0) {
        return {
          status: "out",
          label: "স্টক শেষ",
          pieces,
          weight,
        };
      }

      if (pieces <= minimumPieces) {
        return {
          status: "low",
          label: "কম স্টক",
          pieces,
          weight,
        };
      }

      return {
        status: "available",
        label: "মজুদ আছে",
        pieces,
        weight,
      };
    }

    const quantity =
      Number(product.stockQuantity) || 0;

    const minimumQuantity =
      Number(product.minimumQuantity) || 0;

    if (quantity <= 0) {
      return {
        status: "out",
        label: "স্টক শেষ",
        quantity,
      };
    }

    if (quantity <= minimumQuantity) {
      return {
        status: "low",
        label: "কম স্টক",
        quantity,
      };
    }

    return {
      status: "available",
      label: "মজুদ আছে",
      quantity,
    };
  };

  // ==========================================
  // Search + Filter
  // ==========================================

  const filteredProducts = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name
          ?.toLowerCase()
          .includes(keyword) ||
        product.categoryName
          ?.toLowerCase()
          .includes(keyword) ||
        product.brand
          ?.toLowerCase()
          .includes(keyword);

      const matchesCategory =
        categoryFilter === "সব" ||
        product.categoryName === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // ==========================================
  // Summary
  // ==========================================

  const summary = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    let available = 0;

    products.forEach((product) => {
      const stock = getStockInfo(product);

      if (stock.status === "low") {
        lowStock++;
      } else if (stock.status === "out") {
        outOfStock++;
      } else {
        available++;
      }
    });

    return {
      total: products.length,
      available,
      lowStock,
      outOfStock,
    };
  }, [products]);

  // ==========================================
  // Status Badge
  // ==========================================

  const getStatusClass = (status) => {
    if (status === "available") {
      return "badge-success";
    }

    if (status === "low") {
      return "badge-warning";
    }

    return "badge-error";
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">
      {/* =====================================
          Header
      ====================================== */}

      <div>
        <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
          ইনভেন্টরি
        </h1>

        <p className="mt-1 text-sm text-base-content/60">
          আপনার সকল পণ্যের বর্তমান স্টক দেখুন
        </p>
      </div>

      {/* =====================================
          Summary Cards
      ====================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">
                মোট পণ্য
              </p>

              <p className="mt-1 text-2xl font-bold">
                {summary.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FaBoxOpen />
            </div>
          </div>
        </div>

        {/* Available */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">
                মজুদ আছে
              </p>

              <p className="mt-1 text-2xl font-bold text-success">
                {summary.available}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <FaBoxOpen />
            </div>
          </div>
        </div>

        {/* Low */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">
                কম স্টক
              </p>

              <p className="mt-1 text-2xl font-bold text-warning">
                {summary.lowStock}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <FaExclamationTriangle />
            </div>
          </div>
        </div>

        {/* Out */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">
                স্টক শেষ
              </p>

              <p className="mt-1 text-2xl font-bold text-error">
                {summary.outOfStock}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error/10 text-error">
              <FaTimesCircle />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
          Search + Category
      ====================================== */}

      <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          {/* Search */}

          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="পণ্যের নাম, ব্র্যান্ড বা ক্যাটাগরি দিয়ে খুঁজুন..."
              className="input input-bordered w-full pl-11"
            />
          </div>

          {/* Category */}

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="select select-bordered w-full"
          >
            <option value="সব">
              সব ক্যাটাগরি
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================
          Desktop Table
      ====================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>পণ্য</th>
                <th>ক্যাটাগরি</th>
                <th>ইউনিট</th>
                <th>বর্তমান স্টক</th>
                <th>ন্যূনতম স্টক</th>
                <th>অবস্থা</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-16 text-center"
                  >
                    <span className="loading loading-spinner loading-lg" />

                    <p className="mt-3 text-sm text-base-content/50">
                      Inventory লোড হচ্ছে...
                    </p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-16 text-center"
                  >
                    <FaBoxOpen className="mx-auto mb-3 text-4xl text-base-content/20" />

                    <p className="font-semibold">
                      কোনো পণ্য পাওয়া যায়নি
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock =
                    getStockInfo(product);

                  const isPoultry =
                    product.unit ===
                    "কেজি + পিস";

                  return (
                    <tr key={product._id}>
                      {/* Product */}

                      <td>
                        <div>
                          <p className="font-bold">
                            {product.name}
                          </p>

                          {product.brand && (
                            <p className="text-xs text-base-content/50">
                              {product.brand}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category */}

                      <td>
                        <span className="badge badge-outline">
                          {product.categoryName ||
                            "—"}
                        </span>
                      </td>

                      {/* Unit */}

                      <td>
                        {product.unit}
                      </td>

                      {/* Current Stock */}

                      <td>
                        {isPoultry ? (
                          <div>
                            <p className="font-bold">
                              {stock.pieces} পিস
                            </p>

                            <p className="text-xs text-base-content/50">
                              {stock.weight} কেজি
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold">
                            {stock.quantity}{" "}
                            {product.unit}
                          </p>
                        )}
                      </td>

                      {/* Minimum */}

                      <td>
                        {isPoultry ? (
                          <div>
                            <p>
                              {Number(
                                product.minimumPieces
                              ) || 0}{" "}
                              পিস
                            </p>
                          </div>
                        ) : (
                          <p>
                            {Number(
                              product.minimumQuantity
                            ) || 0}{" "}
                            {product.unit}
                          </p>
                        )}
                      </td>

                      {/* Status */}

                      <td>
                        <span
                          className={`badge ${getStatusClass(
                            stock.status
                          )}`}
                        >
                          {stock.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================
          Mobile Cards
      ====================================== */}

      <div className="grid gap-4 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 py-16 text-center">
            <span className="loading loading-spinner loading-lg" />

            <p className="mt-3 text-sm text-base-content/50">
              Inventory লোড হচ্ছে...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
            <FaBoxOpen className="mx-auto mb-3 text-4xl text-base-content/20" />

            <p className="font-semibold">
              কোনো পণ্য পাওয়া যায়নি
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock =
              getStockInfo(product);

            const isPoultry =
              product.unit ===
              "কেজি + পিস";

            return (
              <div
                key={product._id}
                className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
              >
                {/* Top */}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-base-content/50">
                      {product.categoryName ||
                        "কোনো ক্যাটাগরি নেই"}
                    </p>
                  </div>

                  <span
                    className={`badge shrink-0 ${getStatusClass(
                      stock.status
                    )}`}
                  >
                    {stock.label}
                  </span>
                </div>

                {/* Stock */}

                <div className="my-4 grid grid-cols-2 gap-3 border-y border-base-200 py-4">
                  <div>
                    <p className="text-xs text-base-content/50">
                      বর্তমান স্টক
                    </p>

                    {isPoultry ? (
                      <>
                        <p className="mt-1 font-bold">
                          {stock.pieces} পিস
                        </p>

                        <p className="text-xs text-base-content/50">
                          {stock.weight} কেজি
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 font-bold">
                        {stock.quantity}{" "}
                        {product.unit}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">
                      ন্যূনতম স্টক
                    </p>

                    <p className="mt-1 font-bold">
                      {isPoultry
                        ? `${
                            Number(
                              product.minimumPieces
                            ) || 0
                          } পিস`
                        : `${
                            Number(
                              product.minimumQuantity
                            ) || 0
                          } ${product.unit}`}
                    </p>
                  </div>
                </div>

                {/* Brand */}

                {product.brand && (
                  <p className="text-sm text-base-content/60">
                    ব্র্যান্ড: {product.brand}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inventory;