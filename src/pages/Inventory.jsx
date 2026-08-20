import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { productAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

const Inventory = () => {
  // ==========================================
  // Permissions
  // ==========================================
  const { can } = usePermission();
  const canViewInventory = can(PERMISSIONS.INVENTORY_VIEW);

  // ==========================================
  // States
  // ==========================================
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("সব");

  // ==========================================
  // Load Products
  // ==========================================
  useEffect(() => {
    if (!canViewInventory) return;

    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAll();

        if (cancelled) return;
        setProducts(response.data || []);
      } catch (error) {
        if (cancelled) return;

        console.error("Inventory Load Error:", error);
        toast.error(error.message || "Inventory লোড করা যায়নি");
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
  }, [canViewInventory]);

  // ==========================================
  // Helper: Get Stock Info
  // ==========================================
  const getStockInfo = useCallback((product) => {
    if (!product) return { status: "out", label: "স্টক শেষ", quantity: 0 };

    const isPoultry = product.unit === "কেজি + পিস";

    if (isPoultry) {
      const pieces = Number(product.stockPieces) || 0;
      const weight = Number(product.totalWeight) || 0;
      const minimumPieces = Number(product.minimumPieces) || 0;

      if (pieces <= 0 || weight <= 0) {
        return { status: "out", label: "স্টক শেষ", pieces, weight };
      }

      if (pieces <= minimumPieces) {
        return { status: "low", label: "কম স্টক", pieces, weight };
      }

      return { status: "available", label: "মজুদ আছে", pieces, weight };
    }

    const quantity = Number(product.stockQuantity) || 0;
    const minimumQuantity = Number(product.minimumQuantity) || 0;

    if (quantity <= 0) {
      return { status: "out", label: "স্টক শেষ", quantity };
    }

    if (quantity <= minimumQuantity) {
      return { status: "low", label: "কম স্টক", quantity };
    }

    return { status: "available", label: "মজুদ আছে", quantity };
  }, []);

  // ==========================================
  // Helper: Status Badge Class
  // ==========================================
  const getStatusClass = useCallback((status) => {
    switch (status) {
      case "available":
        return "badge-success";
      case "low":
        return "badge-warning";
      default:
        return "badge-error";
    }
  }, []);

  // ==========================================
  // Memoized Stock Map (Optimizes Heavy Iteration)
  // ==========================================
  const stockInfoMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      map.set(product._id, getStockInfo(product));
    });
    return map;
  }, [products, getStockInfo]);

  // ==========================================
  // Unique Categories
  // ==========================================
  const categories = useMemo(() => {
    const unique = [
      ...new Set(products.map((p) => p.categoryName).filter(Boolean)),
    ];
    return unique;
  }, [products]);

  // ==========================================
  // Search + Category Filter
  // ==========================================
  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name?.toLowerCase().includes(keyword) ||
        product.categoryName?.toLowerCase().includes(keyword) ||
        product.brand?.toLowerCase().includes(keyword);

      const matchesCategory =
        categoryFilter === "সব" || product.categoryName === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // ==========================================
  // Summary Calculation
  // ==========================================
  const summary = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    let available = 0;

    products.forEach((product) => {
      const stock = stockInfoMap.get(product._id);
      if (stock?.status === "low") lowStock++;
      else if (stock?.status === "out") outOfStock++;
      else available++;
    });

    return {
      total: products.length,
      available,
      lowStock,
      outOfStock,
    };
  }, [products, stockInfoMap]);

  // ==========================================
  // Permission Denied View
  // ==========================================
  if (!canViewInventory) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-error/20 bg-base-100 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
            <FaTimesCircle className="text-3xl" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Permission Denied</h2>
          <p className="mt-2 text-sm text-base-content/60">
            Inventory দেখার permission আপনার নেই।
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Loading View
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-3 text-sm text-base-content/50">
            Inventory লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
          ইনভেন্টরি
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          আপনার সকল পণ্যের বর্তমান স্টক দেখুন
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">মোট পণ্য</p>
              <p className="mt-1 text-2xl font-bold">{summary.total}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FaBoxOpen />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">মজুদ আছে</p>
              <p className="mt-1 text-2xl font-bold text-success">
                {summary.available}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <FaBoxOpen />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">কম স্টক</p>
              <p className="mt-1 text-2xl font-bold text-warning">
                {summary.lowStock}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <FaExclamationTriangle />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/50">স্টক শেষ</p>
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

      {/* Search & Category Filter */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পণ্যের নাম, ব্র্যান্ড বা ক্যাটাগরি দিয়ে খুঁজুন..."
              className="input input-bordered w-full pl-11"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="সব">সব ক্যাটাগরি</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
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
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <FaBoxOpen className="mx-auto mb-3 text-4xl text-base-content/20" />
                    <p className="font-semibold">কোনো পণ্য পাওয়া যায়নি</p>
                    <p className="mt-1 text-sm text-base-content/50">
                      আপনার search/filter অনুযায়ী কোনো product পাওয়া যায়নি।
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = stockInfoMap.get(product._id);
                  const isPoultry = product.unit === "কেজি + পিস";

                  return (
                    <tr key={product._id}>
                      <td>
                        <div>
                          <p className="font-bold">{product.name}</p>
                          {product.brand && (
                            <p className="text-xs text-base-content/50">
                              {product.brand}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {product.categoryName || "—"}
                        </span>
                      </td>
                      <td>{product.unit || "—"}</td>
                      <td>
                        {isPoultry ? (
                          <div>
                            <p className="font-bold">{stock?.pieces ?? 0} পিস</p>
                            <p className="text-xs text-base-content/50">
                              {stock?.weight ?? 0} কেজি
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold">
                            {stock?.quantity ?? 0} {product.unit}
                          </p>
                        )}
                      </td>
                      <td>
                        {isPoultry
                          ? `${Number(product.minimumPieces) || 0} পিস`
                          : `${Number(product.minimumQuantity) || 0} ${product.unit}`}
                      </td>
                      <td>
                        <span className={`badge ${getStatusClass(stock?.status)}`}>
                          {stock?.label}
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

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-sm">
            <FaBoxOpen className="mx-auto mb-3 text-4xl text-base-content/20" />
            <p className="font-semibold">কোনো পণ্য পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-base-content/50">
              আপনার search/filter অনুযায়ী কোনো product পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock = stockInfoMap.get(product._id);
            const isPoultry = product.unit === "কেজি + পিস";

            return (
              <div
                key={product._id}
                className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{product.name}</h3>
                    <p className="mt-1 text-xs text-base-content/50">
                      {product.categoryName || "কোনো ক্যাটাগরি নেই"}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${getStatusClass(stock?.status)}`}>
                    {stock?.label}
                  </span>
                </div>

                <div className="my-4 grid grid-cols-2 gap-3 border-y border-base-200 py-4">
                  <div>
                    <p className="text-xs text-base-content/50">বর্তমান স্টক</p>
                    {isPoultry ? (
                      <>
                        <p className="mt-1 font-bold">{stock?.pieces ?? 0} পিস</p>
                        <p className="text-xs text-base-content/50">
                          {stock?.weight ?? 0} কেজি
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 font-bold">
                        {stock?.quantity ?? 0} {product.unit}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-base-content/50">ন্যূনতম স্টক</p>
                    <p className="mt-1 font-bold">
                      {isPoultry
                        ? `${Number(product.minimumPieces) || 0} পিস`
                        : `${Number(product.minimumQuantity) || 0} ${product.unit}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/50">ইউনিট</span>
                  <span className="font-semibold">{product.unit || "—"}</span>
                </div>

                {product.brand && (
                  <p className="mt-2 text-sm text-base-content/60">
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