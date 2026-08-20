import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaWeightHanging,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { categoryAPI, productAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

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
  // ==================================================
  // Permissions
  // ==================================================
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.PRODUCTS_CREATE);
  const canUpdate = can(PERMISSIONS.PRODUCTS_UPDATE);
  const canDelete = can(PERMISSIONS.PRODUCTS_DELETE);

  // ==================================================
  // States
  // ==================================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  // ==================================================
  // Load Products + Categories
  // ==================================================
  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [productResponse, categoryResponse] = await Promise.all([
          productAPI.getAll(),
          categoryAPI.getAll(),
        ]);

        if (active) {
          setProducts(productResponse?.data || []);
          setCategories(categoryResponse?.data || []);
        }
      } catch (error) {
        console.error("Data loading error:", error);
        if (active) {
          toast.error(error.message || "Data লোড করা যায়নি");
        }
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

  // ==================================================
  // Form Handlers
  // ==================================================
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;
    const selectedCategory = categories.find(
      (category) => String(category._id) === String(categoryId)
    );

    const selectedUnit = selectedCategory?.unit || "";
    const isPoultry = selectedUnit === "কেজি + পিস";

    setForm((previous) => ({
      ...previous,
      categoryId,
      categoryName: selectedCategory?.name || "",
      unit: selectedUnit,
      stockQuantity: isPoultry ? "" : previous.stockQuantity,
      minimumQuantity: isPoultry ? "" : previous.minimumQuantity,
      stockPieces: isPoultry ? previous.stockPieces : "",
      minimumPieces: isPoultry ? previous.minimumPieces : "",
      totalWeight: isPoultry ? previous.totalWeight : "",
    }));
  };

  const isPoultryProduct = form.unit === "কেজি + পিস";

  // ==================================================
  // Modal Handlers
  // ==================================================
  const openAddModal = () => {
    if (!canCreate) {
      toast.error("Product তৈরি করার permission আপনার নেই");
      return;
    }

    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    if (!canUpdate) {
      toast.error("Product পরিবর্তন করার permission আপনার নেই");
      return;
    }

    const isPoultry = product.unit === "কেজি + পিস";

    setEditingId(product._id);
    setForm({
      name: product.name || "",
      categoryId: product.categoryId || "",
      categoryName: product.categoryName || "",
      unit: product.unit || "",
      brand: product.brand || "",
      stockQuantity: isPoultry ? "" : product.stockQuantity ?? "",
      minimumQuantity: isPoultry ? "" : product.minimumQuantity ?? "",
      stockPieces: isPoultry ? product.stockPieces ?? "" : "",
      minimumPieces: isPoultry ? product.minimumPieces ?? "" : "",
      totalWeight: isPoultry ? product.totalWeight ?? "" : "",
      status: product.status || "সক্রিয়",
      description: product.description || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
  };

  // ==================================================
  // Submit Creation / Update
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editingId && !canUpdate) {
      toast.error("Product পরিবর্তন করার permission আপনার নেই");
      return;
    }

    if (!editingId && !canCreate) {
      toast.error("Product তৈরি করার permission আপনার নেই");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Product-এর নাম দিন");
      return;
    }

    if (!form.categoryId) {
      toast.error("Category নির্বাচন করুন");
      return;
    }

    if (!form.unit) {
      toast.error("Category-এর Unit নির্ধারণ করা নেই");
      return;
    }

    const isPoultry = form.unit === "কেজি + পিস";

    // Build payload directly based on type
    const payload = isPoultry
      ? {
          name: form.name.trim(),
          categoryId: form.categoryId,
          categoryName: form.categoryName,
          unit: form.unit,
          brand: form.brand.trim(),
          stockQuantity: null,
          minimumQuantity: null,
          stockPieces: form.stockPieces === "" ? 0 : Number(form.stockPieces),
          minimumPieces: form.minimumPieces === "" ? 0 : Number(form.minimumPieces),
          totalWeight: form.totalWeight === "" ? 0 : Number(form.totalWeight),
          status: form.status,
          description: form.description.trim(),
        }
      : {
          name: form.name.trim(),
          categoryId: form.categoryId,
          categoryName: form.categoryName,
          unit: form.unit,
          brand: form.brand.trim(),
          stockQuantity: form.stockQuantity === "" ? 0 : Number(form.stockQuantity),
          minimumQuantity: form.minimumQuantity === "" ? 0 : Number(form.minimumQuantity),
          stockPieces: null,
          minimumPieces: null,
          totalWeight: null,
          status: form.status,
          description: form.description.trim(),
        };

    // Validation Check on calculated payload values
    if (isPoultry) {
      if (payload.stockPieces < 0 || payload.minimumPieces < 0 || payload.totalWeight < 0) {
        toast.error("Stock বা Weight নেগেটিভ হতে পারবে না");
        return;
      }
    } else {
      if (payload.stockQuantity < 0 || payload.minimumQuantity < 0) {
        toast.error("Stock নেগেটিভ হতে পারবে না");
        return;
      }
    }

    try {
      setSaving(true);

      if (editingId) {
        const res = await productAPI.update(editingId, payload);
        const updatedProduct = res?.data || { _id: editingId, ...payload };

        setProducts((prev) =>
          prev.map((item) => (item._id === editingId ? updatedProduct : item))
        );
        toast.success("Product সফলভাবে পরিবর্তন হয়েছে");
      } else {
        const res = await productAPI.create(payload);
        if (res?.data) {
          setProducts((prev) => [res.data, ...prev]);
        }
        toast.success("Product সফলভাবে যোগ হয়েছে");
      }

      closeModal();
    } catch (error) {
      console.error("Product save error:", error);
      toast.error(error.message || "Product সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // Delete Product
  // ==================================================
  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("Product মুছে ফেলার permission আপনার নেই");
      return;
    }

    const confirmed = window.confirm("আপনি কি এই Product মুছে ফেলতে চান?");
    if (!confirmed) return;

    try {
      await productAPI.delete(id);
      setProducts((prev) => prev.filter((item) => item._id !== id));
      toast.success("Product সফলভাবে মুছে ফেলা হয়েছে");
    } catch (error) {
      console.error("Product delete error:", error);
      toast.error(error.message || "Product মুছে ফেলা যায়নি");
    }
  };

  // ==================================================
  // Filtered Products
  // ==================================================
  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return products;

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(searchText) ||
        product.categoryName?.toLowerCase().includes(searchText) ||
        product.brand?.toLowerCase().includes(searchText)
      );
    });
  }, [products, search]);

  // ==================================================
  // Statistics
  // ==================================================
  const statistics = useMemo(() => {
    let totalPieces = 0;
    let totalWeight = 0;
    let lowStock = 0;

    products.forEach((product) => {
      const isPoultry = product.unit === "কেজি + পিস";

      if (isPoultry) {
        totalPieces += Number(product.stockPieces) || 0;
        totalWeight += Number(product.totalWeight) || 0;

        if (Number(product.stockPieces || 0) <= Number(product.minimumPieces || 0)) {
          lowStock += 1;
        }
      } else {
        if (Number(product.stockQuantity || 0) <= Number(product.minimumQuantity || 0)) {
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

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Products</h1>
          <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
            Product, Stock এবং Inventory পরিচালনা করুন
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary w-full gap-2 sm:w-auto"
          >
            <FaPlus />
            <span>Product যোগ করুন</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 sm:text-sm">মোট Product</p>
            <h2 className="text-xl font-bold sm:text-2xl">{statistics.totalProducts}</h2>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 sm:text-sm">মোট Poultry</p>
            <h2 className="text-xl font-bold sm:text-2xl">{statistics.totalPieces} টি</h2>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 sm:text-sm">Poultry Weight</p>
            <h2 className="text-xl font-bold sm:text-2xl">
              {statistics.totalWeight.toFixed(2)} kg
            </h2>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 sm:text-sm">Low Stock</p>
            <h2 className="text-xl font-bold text-warning sm:text-2xl">{statistics.lowStock}</h2>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="relative w-full sm:max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Product / Category / Brand খুঁজুন..."
              className="input input-bordered w-full pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table & List View */}
      <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm">
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
                {(canUpdate || canDelete) && <th className="text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={canUpdate || canDelete ? 10 : 9} className="py-12 text-center">
                    <FaBoxOpen className="mx-auto mb-2 text-3xl text-base-content/20" />
                    <p className="font-semibold text-base-content/70">কোনো Product পাওয়া যায়নি</p>
                    {search && (
                      <p className="mt-1 text-xs text-base-content/50">
                        খোঁজার ফিল্টারটি পরিবর্তন করার চেষ্টা করুন
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const isPoultry = product.unit === "কেজি + পিস";
                  const currentPieces = Number(product.stockPieces) || 0;
                  const minimumPieces = Number(product.minimumPieces) || 0;
                  const currentQuantity = Number(product.stockQuantity) || 0;
                  const minimumQuantity = Number(product.minimumQuantity) || 0;

                  const isLowStock = isPoultry
                    ? currentPieces <= minimumPieces
                    : currentQuantity <= minimumQuantity;

                  return (
                    <tr key={product._id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="min-w-[140px]">
                          <div className="font-semibold">{product.name}</div>
                          {product.description && (
                            <div className="max-w-[180px] truncate text-xs text-base-content/50">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="min-w-[110px]">
                          <div>{product.categoryName || "-"}</div>
                          <span className="badge badge-ghost badge-sm mt-0.5">
                            {product.unit || "-"}
                          </span>
                        </div>
                      </td>
                      <td>{product.brand || "-"}</td>
                      <td>
                        {isPoultry ? (
                          <span className="text-base-content/40">—</span>
                        ) : (
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">{currentQuantity}</span>{" "}
                            <span className="text-xs text-base-content/60">{product.unit}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {isPoultry ? (
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">{currentPieces}</span>{" "}
                            <span className="text-xs text-base-content/60">টি</span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">—</span>
                        )}
                      </td>
                      <td>
                        {isPoultry ? (
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <FaWeightHanging className="text-xs text-base-content/40" />
                            <span className="font-semibold">
                              {Number(product.totalWeight || 0).toFixed(2)}
                            </span>
                            <span className="text-xs text-base-content/60">kg</span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">—</span>
                        )}
                      </td>
                      <td>
                        {isPoultry ? (
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">{minimumPieces}</span>{" "}
                            <span className="text-xs text-base-content/60">টি</span>
                          </div>
                        ) : (
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">{minimumQuantity}</span>{" "}
                            <span className="text-xs text-base-content/60">{product.unit}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {isLowStock ? (
                          <span className="badge badge-warning gap-1 whitespace-nowrap text-xs">
                            <FaExclamationTriangle className="text-xs" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-success whitespace-nowrap text-xs">
                            Stock আছে
                          </span>
                        )}
                      </td>
                      {(canUpdate || canDelete) && (
                        <td>
                          <div className="flex justify-end gap-1">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="btn btn-sm btn-square btn-ghost text-info"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(product._id)}
                                className="btn btn-sm btn-square btn-ghost text-error"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-base-100 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  {editingId ? "Product পরিবর্তন" : "নতুন Product"}
                </h2>
                <p className="mt-0.5 text-xs text-base-content/50">
                  Product-এর stock information পুরন করুন
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="space-y-4 p-5 overflow-y-auto">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Product Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="যেমন: Broiler Murgi"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Category *</span>
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={handleCategoryChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">Category নির্বাচন করুন</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name} {category.unit ? ` — (${category.unit})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Brand</span>
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

              {form.unit && (
                <div className="rounded-xl border border-info/20 bg-info/5 p-3.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="text-xs text-base-content/50 block">Selected Category</span>
                      <span className="font-semibold">{form.categoryName}</span>
                    </div>
                    <div>
                      <span className="badge badge-info">{form.unit}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Normal Product Stock Inputs */}
              {!isPoultryProduct && form.unit && (
                <div className="rounded-xl border border-base-300 bg-base-200/40 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Stock Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">
                        <span className="label-text text-xs font-medium">Current Stock</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="number"
                          name="stockQuantity"
                          value={form.stockQuantity}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="input input-bordered join-item w-full"
                        />
                        <span className="btn join-item no-animation text-xs">{form.unit}</span>
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-xs font-medium">Minimum Stock</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="number"
                          name="minimumQuantity"
                          value={form.minimumQuantity}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0"
                          className="input input-bordered join-item w-full"
                        />
                        <span className="btn join-item no-animation text-xs">{form.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Poultry Stock Inputs */}
              {isPoultryProduct && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Poultry Stock Information</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="label">
                        <span className="label-text text-xs font-medium">Current Pieces</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="number"
                          name="stockPieces"
                          value={form.stockPieces}
                          onChange={handleChange}
                          min="0"
                          step="1"
                          placeholder="0"
                          className="input input-bordered join-item w-full"
                        />
                        <span className="btn join-item no-animation text-xs">টি</span>
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-xs font-medium">Minimum Pieces</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="number"
                          name="minimumPieces"
                          value={form.minimumPieces}
                          onChange={handleChange}
                          min="0"
                          step="1"
                          placeholder="0"
                          className="input input-bordered join-item w-full"
                        />
                        <span className="btn join-item no-animation text-xs">টি</span>
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text text-xs font-medium">Total Weight</span>
                      </label>
                      <div className="join w-full">
                        <input
                          type="number"
                          name="totalWeight"
                          value={form.totalWeight}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="input input-bordered join-item w-full"
                        />
                        <span className="btn join-item no-animation text-xs">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Status</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="সক্রিয়">সক্রিয়</option>
                  <option value="নিষ্ক্রিয়">নিষ্ক্রিয়</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Product সম্পর্কে তথ্য..."
                  className="textarea textarea-bordered min-h-20 w-full"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
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
                  disabled={saving || (editingId ? !canUpdate : !canCreate)}
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

// Loading Skeleton
function LoadingState() {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm py-20 text-center">
      <span className="loading loading-spinner loading-lg text-primary mx-auto" />
      <p className="mt-3 text-sm text-base-content/50">Products লোড হচ্ছে...</p>
    </div>
  );
}

export default Products;