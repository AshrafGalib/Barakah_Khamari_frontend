import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaTrash,
  FaWeightHanging,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { categoryAPI, productAPI } from "../services/api";

const INITIAL_FORM = {
  name: "",
  categoryId: "",
  categoryName: "",
  unit: "",
  brand: "",

  stockQuantity: "",
  minimumQuantity: "",

  stockPieces: "",
  minimumPieces: "",

  totalWeight: "",

  status: "সক্রিয়",
  description: "",
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);

  // ==========================================
  // Load Products + Categories
  // ==========================================

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [productResponse, categoryResponse] =
          await Promise.all([
            productAPI.getAll(),
            categoryAPI.getAll(),
          ]);

        if (!active) return;

        setProducts(productResponse?.data || []);
        setCategories(categoryResponse?.data || []);
      } catch (error) {
        if (!active) return;

        console.error(error);

        toast.error(
          error.message || "Data লোড করা যায়নি"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // Reload Products
  // ==========================================

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll();

      setProducts(response?.data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error.message || "Product লোড করা যায়নি"
      );
    }
  };

  // ==========================================
  // Form Change
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // Category Change
  // ==========================================

  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;

    const selectedCategory = categories.find(
      (category) =>
        String(category._id) === String(categoryId)
    );

    const selectedUnit = selectedCategory?.unit || "";

    const isPoultry =
      selectedUnit === "কেজি + পিস";

    setForm((previous) => ({
      ...previous,

      categoryId,
      categoryName: selectedCategory?.name || "",
      unit: selectedUnit,

      // Category পরিবর্তন করলে
      // আগের incompatible stock data remove
      stockQuantity: isPoultry
        ? ""
        : previous.stockQuantity,

      minimumQuantity: isPoultry
        ? ""
        : previous.minimumQuantity,

      stockPieces: isPoultry
        ? previous.stockPieces
        : "",

      minimumPieces: isPoultry
        ? previous.minimumPieces
        : "",

      totalWeight: isPoultry
        ? previous.totalWeight
        : "",
    }));
  };

  // ==========================================
  // Is Poultry Product?
  // ==========================================

  const isPoultryProduct =
    form.unit === "কেজি + পিস";

  // ==========================================
  // Open Add Modal
  // ==========================================

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setShowModal(true);
  };

  // ==========================================
  // Open Edit Modal
  // ==========================================

  const openEditModal = (product) => {
    const isPoultry =
      product.unit === "কেজি + পিস";

    setEditingId(product._id);

    setForm({
      name: product.name || "",

      categoryId: product.categoryId || "",

      categoryName: product.categoryName || "",

      unit: product.unit || "",

      brand: product.brand || "",

      stockQuantity: isPoultry
        ? ""
        : product.stockQuantity ?? "",

      minimumQuantity: isPoultry
        ? ""
        : product.minimumQuantity ?? "",

      stockPieces: isPoultry
        ? product.stockPieces ?? ""
        : "",

      minimumPieces: isPoultry
        ? product.minimumPieces ?? ""
        : "",

      totalWeight: isPoultry
        ? product.totalWeight ?? ""
        : "",

      status: product.status || "সক্রিয়",

      description: product.description || "",
    });

    setShowModal(true);
  };

  // ==========================================
  // Close Modal
  // ==========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
  };

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Product-এর নাম দিন");
      return;
    }

    if (!form.categoryId) {
      toast.error("Category নির্বাচন করুন");
      return;
    }

    if (!form.unit) {
      toast.error(
        "Category-এর Unit নির্ধারণ করা নেই"
      );
      return;
    }

    const isPoultry =
      form.unit === "কেজি + পিস";

    let payload;

    // ========================================
    // Poultry Payload
    // ========================================

    if (isPoultry) {
      const pieces =
        form.stockPieces === ""
          ? 0
          : Number(form.stockPieces);

      const minimumPieces =
        form.minimumPieces === ""
          ? 0
          : Number(form.minimumPieces);

      const totalWeight =
        form.totalWeight === ""
          ? 0
          : Number(form.totalWeight);

      if (pieces < 0) {
        toast.error(
          "Pieces negative হতে পারবে না"
        );
        return;
      }

      if (minimumPieces < 0) {
        toast.error(
          "Minimum Pieces negative হতে পারবে না"
        );
        return;
      }

      if (totalWeight < 0) {
        toast.error(
          "Weight negative হতে পারবে না"
        );
        return;
      }

      payload = {
        name: form.name.trim(),

        categoryId: form.categoryId,

        categoryName: form.categoryName,

        unit: form.unit,

        brand: form.brand.trim(),

        // Poultry হলে quantity null
        stockQuantity: null,

        minimumQuantity: null,

        stockPieces: pieces,

        minimumPieces,

        totalWeight,

        status: form.status,

        description: form.description.trim(),
      };
    } else {
      // ======================================
      // Normal Product Payload
      // ======================================

      const stockQuantity =
        form.stockQuantity === ""
          ? 0
          : Number(form.stockQuantity);

      const minimumQuantity =
        form.minimumQuantity === ""
          ? 0
          : Number(form.minimumQuantity);

      if (stockQuantity < 0) {
        toast.error(
          "Stock negative হতে পারবে না"
        );
        return;
      }

      if (minimumQuantity < 0) {
        toast.error(
          "Minimum Stock negative হতে পারবে না"
        );
        return;
      }

      payload = {
        name: form.name.trim(),

        categoryId: form.categoryId,

        categoryName: form.categoryName,

        unit: form.unit,

        brand: form.brand.trim(),

        stockQuantity,

        minimumQuantity,

        // Normal Product হলে এগুলো null
        stockPieces: null,

        minimumPieces: null,

        totalWeight: null,

        status: form.status,

        description: form.description.trim(),
      };
    }

    try {
      setSaving(true);

      if (editingId) {
        await productAPI.update(
          editingId,
          payload
        );

        toast.success(
          "Product সফলভাবে পরিবর্তন হয়েছে"
        );
      } else {
        await productAPI.create(payload);

        toast.success(
          "Product সফলভাবে যোগ হয়েছে"
        );
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ ...INITIAL_FORM });

      await loadProducts();
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Product সংরক্ষণ করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "আপনি কি এই Product মুছে ফেলতে চান?"
    );

    if (!confirmed) return;

    try {
      await productAPI.delete(id);

      toast.success(
        "Product সফলভাবে মুছে ফেলা হয়েছে"
      );

      await loadProducts();
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Product মুছে ফেলা যায়নি"
      );
    }
  };

  // ==========================================
  // Search
  // ==========================================

  const filteredProducts = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    if (!searchText) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          ?.toLowerCase()
          .includes(searchText) ||

        product.categoryName
          ?.toLowerCase()
          .includes(searchText) ||

        product.brand
          ?.toLowerCase()
          .includes(searchText)
      );
    });
  }, [products, search]);

  // ==========================================
  // Statistics
  // ==========================================

  const statistics = useMemo(() => {
    let totalPieces = 0;
    let totalWeight = 0;
    let lowStock = 0;

    products.forEach((product) => {
      const isPoultry =
        product.unit === "কেজি + পিস";

      if (isPoultry) {
        totalPieces +=
          Number(product.stockPieces) || 0;

        totalWeight +=
          Number(product.totalWeight) || 0;

        if (
          Number(product.stockPieces || 0) <=
          Number(product.minimumPieces || 0)
        ) {
          lowStock += 1;
        }
      } else {
        if (
          Number(product.stockQuantity || 0) <=
          Number(product.minimumQuantity || 0)
        ) {
          lowStock += 1;
        }
      }
    });

    return {
      totalProducts: products.length,
      totalPieces,
      totalWeight,
      lowStock,
    };
  }, [products]);

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-6">

      {/* ======================================
          Header
      ======================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Products
          </h1>

          <p className="mt-1 text-sm text-base-content/60">
            Product, Stock এবং Inventory পরিচালনা করুন
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
        >
          <FaPlus />
          Product যোগ করুন
        </button>
      </div>

      {/* ======================================
          Statistics
      ======================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Products */}

        <div className="card border bg-base-100 shadow-sm">
          <div className="card-body p-5">

            <p className="text-sm text-base-content/60">
              মোট Product
            </p>

            <h2 className="text-2xl font-bold">
              {statistics.totalProducts}
            </h2>

          </div>
        </div>

        {/* Total Pieces */}

        <div className="card border bg-base-100 shadow-sm">
          <div className="card-body p-5">

            <p className="text-sm text-base-content/60">
              মোট Poultry
            </p>

            <h2 className="text-2xl font-bold">
              {statistics.totalPieces} টি
            </h2>

          </div>
        </div>

        {/* Total Weight */}

        <div className="card border bg-base-100 shadow-sm">
          <div className="card-body p-5">

            <p className="text-sm text-base-content/60">
              মোট Poultry Weight
            </p>

            <h2 className="text-2xl font-bold">
              {statistics.totalWeight.toFixed(2)} kg
            </h2>

          </div>
        </div>

        {/* Low Stock */}

        <div className="card border bg-base-100 shadow-sm">
          <div className="card-body p-5">

            <p className="text-sm text-base-content/60">
              Low Stock
            </p>

            <h2 className="text-2xl font-bold">
              {statistics.lowStock}
            </h2>

          </div>
        </div>

      </div>

      {/* ======================================
          Search
      ======================================= */}

      <div className="card border bg-base-100 shadow-sm">
        <div className="card-body p-4">

          <div className="relative w-full max-w-md">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Product / Category / Brand খুঁজুন..."
              className="input input-bordered w-full pl-11"
            />

          </div>

        </div>
      </div>

      {/* ======================================
          Product Table
      ======================================= */}

      <div className="card border bg-base-100 shadow-sm">

        <div className="card-body p-0">

          <div className="overflow-x-auto">

            <table className="table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Stock</th>
                  <th>Pieces</th>
                  <th>Weight</th>
                  <th>Minimum</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="py-16 text-center"
                    >
                      <FaBoxOpen className="mx-auto mb-3 text-4xl text-base-content/20" />

                      <p className="font-medium">
                        কোনো Product পাওয়া যায়নি
                      </p>

                      {search && (
                        <p className="mt-1 text-sm text-base-content/50">
                          Search পরিবর্তন করে আবার চেষ্টা করুন
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(
                    (product, index) => {
                      const isPoultry =
                        product.unit ===
                        "কেজি + পিস";

                      const currentPieces =
                        Number(
                          product.stockPieces
                        ) || 0;

                      const minimumPieces =
                        Number(
                          product.minimumPieces
                        ) || 0;

                      const currentQuantity =
                        Number(
                          product.stockQuantity
                        ) || 0;

                      const minimumQuantity =
                        Number(
                          product.minimumQuantity
                        ) || 0;

                      const isLowStock =
                        isPoultry
                          ? currentPieces <=
                            minimumPieces
                          : currentQuantity <=
                            minimumQuantity;

                      return (
                        <tr key={product._id}>

                          {/* Number */}

                          <td>
                            {index + 1}
                          </td>

                          {/* Product */}

                          <td>
                            <div className="min-w-[140px]">

                              <div className="font-semibold">
                                {product.name}
                              </div>

                              {product.description && (
                                <div className="max-w-[200px] truncate text-xs text-base-content/50">
                                  {product.description}
                                </div>
                              )}

                            </div>
                          </td>

                          {/* Category */}

                          <td>
                            <div className="min-w-[110px]">

                              <div>
                                {product.categoryName ||
                                  "-"}
                              </div>

                              <span className="badge badge-ghost badge-sm mt-1">
                                {product.unit || "-"}
                              </span>

                            </div>
                          </td>

                          {/* Brand */}

                          <td>
                            {product.brand || "-"}
                          </td>

                          {/* Stock */}

                          <td>
                            {isPoultry ? (
                              <span className="text-base-content/50">
                                -
                              </span>
                            ) : (
                              <div className="whitespace-nowrap">
                                <span className="font-semibold">
                                  {currentQuantity}
                                </span>{" "}
                                <span className="text-sm text-base-content/60">
                                  {product.unit}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Pieces */}

                          <td>
                            {isPoultry ? (
                              <div className="whitespace-nowrap">
                                <span className="font-semibold">
                                  {currentPieces}
                                </span>{" "}
                                <span className="text-sm text-base-content/60">
                                  টি
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Weight */}

                          <td>
                            {isPoultry ? (
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                <FaWeightHanging className="text-base-content/40" />

                                <span className="font-semibold">
                                  {Number(
                                    product.totalWeight
                                  ).toFixed(2)}
                                </span>

                                <span className="text-sm text-base-content/60">
                                  kg
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Minimum */}

                          <td>
                            {isPoultry ? (
                              <div className="whitespace-nowrap">
                                <span className="font-semibold">
                                  {minimumPieces}
                                </span>{" "}
                                <span className="text-sm text-base-content/60">
                                  টি
                                </span>
                              </div>
                            ) : (
                              <div className="whitespace-nowrap">
                                <span className="font-semibold">
                                  {minimumQuantity}
                                </span>{" "}
                                <span className="text-sm text-base-content/60">
                                  {product.unit}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Status */}

                          <td>
                            {isLowStock ? (
                              <span className="badge badge-warning gap-1 whitespace-nowrap">
                                <FaExclamationTriangle />
                                Low Stock
                              </span>
                            ) : (
                              <span className="badge badge-success whitespace-nowrap">
                                Stock আছে
                              </span>
                            )}
                          </td>

                          {/* Actions */}

                          <td>
                            <div className="flex gap-1">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(product)
                                }
                                className="btn btn-sm btn-square btn-ghost text-info"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    product._id
                                  )
                                }
                                className="btn btn-sm btn-square btn-ghost text-error"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>
        </div>
      </div>

      {/* ======================================
          Add / Edit Modal
      ======================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-base-100 shadow-2xl">

            {/* Modal Header */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-base-100 p-5">

              <div>
                <h2 className="text-xl font-bold">
                  {editingId
                    ? "Product Edit"
                    : "নতুন Product"}
                </h2>

                <p className="mt-1 text-xs text-base-content/50">
                  Product-এর stock information দিন
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >

              {/* Product Name */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-medium">
                    Product Name *
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="যেমন: Murgi"
                  className="input input-bordered w-full"
                  required
                />

              </div>

              {/* Category + Brand */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="form-control">

                  <label className="label">
                    <span className="label-text font-medium">
                      Category *
                    </span>
                  </label>

                  <select
                    value={form.categoryId}
                    onChange={
                      handleCategoryChange
                    }
                    className="select select-bordered w-full"
                    required
                  >

                    <option value="">
                      Category নির্বাচন করুন
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category._id}
                          value={category._id}
                        >
                          {category.name}
                          {category.unit
                            ? ` — ${category.unit}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="form-control">

                  <label className="label">
                    <span className="label-text font-medium">
                      Brand
                    </span>
                  </label>

                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="যেমন: BD Foods"
                    className="input input-bordered w-full"
                  />

                </div>

              </div>

              {/* Unit Information */}

              {form.unit && (
                <div className="rounded-xl border border-info/20 bg-info/5 p-4">

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <p className="text-xs text-base-content/50">
                        Selected Category
                      </p>

                      <p className="font-semibold">
                        {form.categoryName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-base-content/50">
                        Unit
                      </p>

                      <span className="badge badge-info">
                        {form.unit}
                      </span>
                    </div>

                  </div>

                </div>
              )}

              {/* =================================
                  NORMAL PRODUCT STOCK
              ================================== */}

              {!isPoultryProduct && form.unit && (
                <div className="rounded-xl border bg-base-200/40 p-4">

                  <div className="mb-4">

                    <h3 className="font-semibold">
                      Stock Information
                    </h3>

                    <p className="mt-1 text-xs text-base-content/50">
                      Category-এর Unit অনুযায়ী Stock দিন।
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* Current */}

                    <div className="form-control">

                      <label className="label">
                        <span className="label-text">
                          Current Stock
                        </span>
                      </label>

                      <div className="join w-full">

                        <input
                          type="number"
                          name="stockQuantity"
                          value={
                            form.stockQuantity
                          }
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="5"
                          className="input input-bordered join-item w-full"
                        />

                        <span className="btn join-item no-animation">
                          {form.unit}
                        </span>

                      </div>

                    </div>

                    {/* Minimum */}

                    <div className="form-control">

                      <label className="label">
                        <span className="label-text">
                          Minimum Stock
                        </span>
                      </label>

                      <div className="join w-full">

                        <input
                          type="number"
                          name="minimumQuantity"
                          value={
                            form.minimumQuantity
                          }
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="2"
                          className="input input-bordered join-item w-full"
                        />

                        <span className="btn join-item no-animation">
                          {form.unit}
                        </span>

                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* =================================
                  POULTRY STOCK
              ================================== */}

              {isPoultryProduct && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">

                  <div className="mb-4">

                    <h3 className="font-semibold">
                      Poultry Stock Information
                    </h3>

                    <p className="mt-1 text-xs text-base-content/50">
                      মুরগির Stock Pieces এবং Weight
                      অনুযায়ী সংরক্ষণ হবে।
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* Pieces */}

                    <div className="form-control">

                      <label className="label">
                        <span className="label-text">
                          Current Pieces
                        </span>
                      </label>

                      <div className="join w-full">

                        <input
                          type="number"
                          name="stockPieces"
                          value={
                            form.stockPieces
                          }
                          onChange={handleChange}
                          min="0"
                          step="1"
                          placeholder="41"
                          className="input input-bordered join-item w-full"
                        />

                        <span className="btn join-item no-animation">
                          টি
                        </span>

                      </div>

                    </div>

                    {/* Minimum Pieces */}

                    <div className="form-control">

                      <label className="label">
                        <span className="label-text">
                          Minimum Pieces
                        </span>
                      </label>

                      <div className="join w-full">

                        <input
                          type="number"
                          name="minimumPieces"
                          value={
                            form.minimumPieces
                          }
                          onChange={handleChange}
                          min="0"
                          step="1"
                          placeholder="10"
                          className="input input-bordered join-item w-full"
                        />

                        <span className="btn join-item no-animation">
                          টি
                        </span>

                      </div>

                    </div>

                    {/* Weight */}

                    <div className="form-control">

                      <label className="label">
                        <span className="label-text">
                          Total Weight
                        </span>
                      </label>

                      <div className="join w-full">

                        <input
                          type="number"
                          name="totalWeight"
                          value={
                            form.totalWeight
                          }
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="61.5"
                          className="input input-bordered join-item w-full"
                        />

                        <span className="btn join-item no-animation">
                          kg
                        </span>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* Status */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text">
                    Status
                  </span>
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >

                  <option value="সক্রিয়">
                    সক্রিয়
                  </option>

                  <option value="নিষ্ক্রিয়">
                    নিষ্ক্রিয়
                  </option>

                </select>

              </div>

              {/* Description */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text">
                    Description
                  </span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Product সম্পর্কে তথ্য..."
                  className="textarea textarea-bordered min-h-[100px] w-full"
                />

              </div>

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >

                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}

                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Products;