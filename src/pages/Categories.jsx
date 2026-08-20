import { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaSearch,
  FaTags,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { categoryAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

const EMPTY_FORM = {
  name: "",
  description: "",
  unit: "পিস",
  status: "সক্রিয়",
};

const UNITS = [
  "পিস",
  "কেজি",
  "কেজি + পিস",
  "প্যাকেট",
  "বক্স",
  "লিটার",
];

function Categories() {
  // ==============================
  // Permissions
  // ==============================
  const { can } = usePermission();

  const canCreate = can(PERMISSIONS.CATEGORIES_CREATE);
  const canUpdate = can(PERMISSIONS.CATEGORIES_UPDATE);
  const canDelete = can(PERMISSIONS.CATEGORIES_DELETE);

  // ==============================
  // States
  // ==============================
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==============================
  // Load Categories
  // ==============================
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryAPI.getAll();

        if (!cancelled) {
          setCategories(response?.data || []);
        }
      } catch (error) {
        console.error("Category Load Error:", error);
        if (!cancelled) {
          toast.error(error.message || "ক্যাটাগরি লোড করা যায়নি");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==============================
  // Search
  // ==============================
  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return categories;
    }

    return categories.filter((category) => {
      const name = category.name?.toLowerCase() || "";
      const description = category.description?.toLowerCase() || "";

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [categories, search]);

  // ==============================
  // Modal Handlers
  // ==============================
  const openAddModal = () => {
    if (!canCreate) {
      toast.error("আপনার Category তৈরি করার permission নেই");
      return;
    }

    setEditingCategory(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    if (!canUpdate) {
      toast.error("আপনার Category পরিবর্তন করার permission নেই");
      return;
    }

    setEditingCategory(category);
    setForm({
      name: category.name || "",
      description: category.description || "",
      unit: category.unit || "পিস",
      status: category.status || "সক্রিয়",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM });
  };

  // ==============================
  // Form Change
  // ==============================
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==============================
  // Add / Update Category
  // ==============================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (editingCategory && !canUpdate) {
      toast.error("আপনার Category পরিবর্তন করার permission নেই");
      return;
    }

    if (!editingCategory && !canCreate) {
      toast.error("আপনার Category তৈরি করার permission নেই");
      return;
    }

    const name = form.name.trim();
    if (!name) {
      toast.error("ক্যাটাগরির নাম দিন");
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      unit: form.unit,
      status: form.status,
    };

    try {
      setSaving(true);

      if (editingCategory) {
        const response = await categoryAPI.update(
          editingCategory._id,
          payload
        );

        setCategories((previous) =>
          previous.map((category) =>
            category._id === editingCategory._id
              ? response.data || { ...category, ...payload }
              : category
          )
        );

        toast.success("ক্যাটাগরি সফলভাবে পরিবর্তন হয়েছে");
      } else {
        const response = await categoryAPI.create(payload);

        setCategories((previous) => [
          response.data,
          ...previous,
        ]);

        toast.success("ক্যাটাগরি সফলভাবে যোগ হয়েছে");
      }

      closeModal();
    } catch (error) {
      console.error("Category Save Error:", error);
      toast.error(error.message || "ক্যাটাগরি সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // Delete Category
  // ==============================
  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("আপনার Category মুছে ফেলার permission নেই");
      return;
    }

    const confirmed = window.confirm(
      "আপনি কি এই ক্যাটাগরিটি মুছে ফেলতে চান?"
    );

    if (!confirmed) return;

    try {
      await categoryAPI.delete(id);

      setCategories((previous) =>
        previous.filter((category) => category._id !== id)
      );

      toast.success("ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে");
    } catch (error) {
      console.error("Category Delete Error:", error);
      toast.error(error.message || "ক্যাটাগরি মুছে ফেলা যায়নি");
    }
  };

  // ==============================
  // UI Render
  // ==============================
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12">
            <FaTags className="text-lg text-primary sm:text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">ক্যাটাগরি</h1>
            <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
              পণ্যের ক্যাটাগরি পরিচালনা করুন
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary w-full gap-2 sm:w-auto"
          >
            <FaPlus />
            <span>নতুন ক্যাটাগরি</span>
          </button>
        )}
      </div>

      {/* Search Bar & Stats */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ক্যাটাগরি খুঁজুন..."
                className="input input-bordered w-full pl-10"
              />
            </div>

            <p className="text-sm text-base-content/60">
              মোট ক্যাটাগরি:{" "}
              <span className="font-bold text-base-content">
                {filteredCategories.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card hidden overflow-hidden border border-base-300 bg-base-100 shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ক্যাটাগরি</th>
                    <th>বর্ণনা</th>
                    <th>ইউনিট</th>
                    <th>স্ট্যাটাস</th>
                    {(canUpdate || canDelete) && (
                      <th className="text-right">অ্যাকশন</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={canUpdate || canDelete ? 6 : 5}>
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category, index) => (
                      <tr key={category._id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <FaTags className="text-sm text-primary" />
                            </div>
                            <span className="font-semibold">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm text-base-content/60">
                            {category.description || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-outline">
                            {category.unit}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              category.status === "সক্রিয়"
                                ? "badge-success"
                                : "badge-ghost"
                            }`}
                          >
                            {category.status}
                          </span>
                        </td>
                        {(canUpdate || canDelete) && (
                          <td>
                            <div className="flex justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(category)}
                                  className="btn btn-sm btn-square btn-ghost text-info"
                                  title="পরিবর্তন করুন"
                                >
                                  <FaEdit />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(category._id)}
                                  className="btn btn-sm btn-square btn-ghost text-error"
                                  title="মুছে ফেলুন"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="space-y-3 md:hidden">
            {filteredCategories.length === 0 ? (
              <div className="card border border-base-300 bg-base-100 shadow-sm">
                <EmptyState />
              </div>
            ) : (
              filteredCategories.map((category, index) => (
                <div
                  key={category._id}
                  className="card border border-base-300 bg-base-100 shadow-sm"
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <FaTags className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate font-bold">
                            {category.name}
                          </h2>
                          <p className="text-xs text-base-content/50">
                            ক্যাটাগরি #{index + 1}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge shrink-0 ${
                          category.status === "সক্রিয়"
                            ? "badge-success"
                            : "badge-ghost"
                        }`}
                      >
                        {category.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-base-content/60">
                      {category.description || "কোনো বর্ণনা নেই"}
                    </p>

                    <div className="mt-2 rounded-xl bg-base-200/50 p-2.5">
                      <p className="text-xs text-base-content/50">ইউনিট</p>
                      <p className="mt-0.5 font-semibold text-sm">
                        {category.unit}
                      </p>
                    </div>

                    {(canUpdate || canDelete) && (
                      <div className="mt-3 flex gap-2">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="btn btn-sm flex-1 btn-outline btn-info"
                          >
                            <FaEdit />
                            পরিবর্তন
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(category._id)}
                            className="btn btn-sm btn-outline btn-error"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
          <div className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-base-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold sm:text-xl">
                  {editingCategory ? "ক্যাটাগরি পরিবর্তন" : "নতুন ক্যাটাগরি"}
                </h3>
                <p className="mt-0.5 text-xs text-base-content/50">
                  ক্যাটাগরির তথ্য পূরণ করুন
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

            <form onSubmit={handleSubmit} className="space-y-4 p-5 overflow-y-auto">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">
                    ক্যাটাগরির নাম *
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="যেমন: মুরগি"
                  className="input input-bordered w-full"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">বর্ণনা</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="ক্যাটাগরি সম্পর্কে সংক্ষিপ্ত বর্ণনা"
                  className="textarea textarea-bordered min-h-20 w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">ইউনিট *</span>
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">স্ট্যাটাস</span>
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

              <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="btn btn-ghost"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={saving || (editingCategory ? !canUpdate : !canCreate)}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : editingCategory ? (
                    "পরিবর্তন সংরক্ষণ"
                  ) : (
                    "ক্যাটাগরি যোগ করুন"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function LoadingState() {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm py-16 text-center">
      <span className="loading loading-spinner loading-lg text-primary mx-auto" />
      <p className="mt-3 text-sm text-base-content/50">
        ক্যাটাগরি লোড হচ্ছে...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 mb-3">
        <FaTags className="text-xl text-base-content/30" />
      </div>
      <h3 className="font-semibold">কোনো ক্যাটাগরি পাওয়া যায়নি</h3>
      <p className="mt-1 text-sm text-base-content/50">
        নতুন ক্যাটাগরি যোগ করুন অথবা অন্য নামে খুঁজুন।
      </p>
    </div>
  );
}

export default Categories;