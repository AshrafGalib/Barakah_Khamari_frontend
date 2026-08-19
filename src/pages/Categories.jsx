import { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaSearch,
  FaTags,
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

function Categories() {
  // ==============================
  // Permissions
  // ==============================

  const { can } = usePermission();

  const canCreate = can(
    PERMISSIONS.CATEGORIES_CREATE
  );

  const canUpdate = can(
    PERMISSIONS.CATEGORIES_UPDATE
  );

  const canDelete = can(
    PERMISSIONS.CATEGORIES_DELETE
  );

  // ==============================
  // States
  // ==============================

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

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

        const response =
          await categoryAPI.getAll();

        if (!cancelled) {
          setCategories(
            response?.data || []
          );
        }
      } catch (error) {
        console.error(
          "Category Load Error:",
          error
        );

        if (!cancelled) {
          toast.error(
            error.message ||
              "ক্যাটাগরি লোড করা যায়নি"
          );
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
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return categories;
    }

    return categories.filter(
      (category) => {
        const name =
          category.name?.toLowerCase() ||
          "";

        const description =
          category.description?.toLowerCase() ||
          "";

        return (
          name.includes(keyword) ||
          description.includes(keyword)
        );
      }
    );
  }, [categories, search]);

  // ==============================
  // Add Modal
  // ==============================

  const openAddModal = () => {
    if (!canCreate) {
      toast.error(
        "আপনার Category তৈরি করার permission নেই"
      );
      return;
    }

    setEditingCategory(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowModal(true);
  };

  // ==============================
  // Edit Modal
  // ==============================

  const openEditModal = (category) => {
    if (!canUpdate) {
      toast.error(
        "আপনার Category পরিবর্তন করার permission নেই"
      );
      return;
    }

    setEditingCategory(category);

    setForm({
      name: category.name || "",

      description:
        category.description || "",

      unit:
        category.unit || "পিস",

      status:
        category.status || "সক্রিয়",
    });

    setShowModal(true);
  };

  // ==============================
  // Close Modal
  // ==============================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingCategory(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // ==============================
  // Form Change
  // ==============================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

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

    // ==========================
    // Permission Guard
    // ==========================

    if (editingCategory && !canUpdate) {
      toast.error(
        "আপনার Category পরিবর্তন করার permission নেই"
      );
      return;
    }

    if (!editingCategory && !canCreate) {
      toast.error(
        "আপনার Category তৈরি করার permission নেই"
      );
      return;
    }

    // ==========================
    // Validation
    // ==========================

    const name = form.name.trim();

    if (!name) {
      toast.error(
        "ক্যাটাগরির নাম দিন"
      );
      return;
    }

    try {
      setSaving(true);

      // ==========================
      // Update
      // ==========================

      if (editingCategory) {
        const response =
          await categoryAPI.update(
            editingCategory._id,
            {
              name,

              description:
                form.description.trim(),

              unit: form.unit,

              status: form.status,
            }
          );

        setCategories(
          (previous) =>
            previous.map(
              (category) =>
                category._id ===
                editingCategory._id
                  ? response.data
                  : category
            )
        );

        toast.success(
          "ক্যাটাগরি সফলভাবে পরিবর্তন হয়েছে"
        );
      }

      // ==========================
      // Create
      // ==========================

      else {
        const response =
          await categoryAPI.create({
            name,

            description:
              form.description.trim(),

            unit: form.unit,

            status: form.status,
          });

        setCategories(
          (previous) => [
            response.data,
            ...previous,
          ]
        );

        toast.success(
          "ক্যাটাগরি সফলভাবে যোগ হয়েছে"
        );
      }

      setShowModal(false);

      setEditingCategory(null);

      setForm({
        ...EMPTY_FORM,
      });
    } catch (error) {
      console.error(
        "Category Save Error:",
        error
      );

      toast.error(
        error.message ||
          "ক্যাটাগরি সংরক্ষণ করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // Delete Category
  // ==============================

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error(
        "আপনার Category মুছে ফেলার permission নেই"
      );
      return;
    }

    const confirmed =
      window.confirm(
        "আপনি কি এই ক্যাটাগরিটি মুছে ফেলতে চান?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await categoryAPI.delete(id);

      setCategories(
        (previous) =>
          previous.filter(
            (category) =>
              category._id !== id
          )
      );

      toast.success(
        "ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে"
      );
    } catch (error) {
      console.error(
        "Category Delete Error:",
        error
      );

      toast.error(
        error.message ||
          "ক্যাটাগরি মুছে ফেলা যায়নি"
      );
    }
  };

  // ==============================
  // UI
  // ==============================

  return (
    <div className="mx-auto w-full max-w-7xl">

      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <div className="mb-5 sm:mb-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Title */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12">

              <FaTags className="text-lg text-primary sm:text-xl" />

            </div>

            <div>

              <h1 className="text-xl font-bold sm:text-2xl">
                ক্যাটাগরি
              </h1>

              <p className="mt-1 text-xs text-base-content/60 sm:text-sm">
                পণ্যের ক্যাটাগরি পরিচালনা করুন
              </p>

            </div>

          </div>

          {/* Add Button */}

          {canCreate && (
            <button
              type="button"
              onClick={openAddModal}
              className="btn btn-primary w-full gap-2 sm:w-auto"
            >
              <FaPlus />
              নতুন ক্যাটাগরি
            </button>
          )}

        </div>
      </div>

      {/* ================================= */}
      {/* Search */}
      {/* ================================= */}

      <div className="card mb-5 border border-base-300 bg-base-100 shadow-sm">

        <div className="card-body p-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* Search Input */}

            <div className="relative w-full sm:max-w-md">

              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ক্যাটাগরি খুঁজুন..."
                className="input input-bordered w-full pl-10"
              />

            </div>

            {/* Count */}

            <p className="text-sm text-base-content/60">

              মোট ক্যাটাগরি:{" "}

              <span className="font-bold text-base-content">
                {filteredCategories.length}
              </span>

            </p>

          </div>

        </div>

      </div>

      {/* ================================= */}
      {/* Loading */}
      {/* ================================= */}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* ================================= */}
          {/* Desktop Table */}
          {/* ================================= */}

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

                    {(canUpdate ||
                      canDelete) && (
                      <th className="text-right">
                        অ্যাকশন
                      </th>
                    )}

                  </tr>

                </thead>

                <tbody>

                  {filteredCategories.map(
                    (
                      category,
                      index
                    ) => (
                      <tr
                        key={
                          category._id
                        }
                      >

                        {/* Number */}

                        <td>
                          {index + 1}
                        </td>

                        {/* Category */}

                        <td>

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">

                              <FaTags className="text-primary" />

                            </div>

                            <span className="font-semibold">
                              {category.name}
                            </span>

                          </div>

                        </td>

                        {/* Description */}

                        <td>

                          <span className="text-sm text-base-content/60">
                            {category.description ||
                              "—"}
                          </span>

                        </td>

                        {/* Unit */}

                        <td>

                          <span className="badge badge-outline">
                            {category.unit}
                          </span>

                        </td>

                        {/* Status */}

                        <td>

                          <span
                            className={`badge ${
                              category.status ===
                              "সক্রিয়"
                                ? "badge-success"
                                : "badge-ghost"
                            }`}
                          >
                            {category.status}
                          </span>

                        </td>

                        {/* Actions */}

                        {(canUpdate ||
                          canDelete) && (
                          <td>

                            <div className="flex justify-end gap-1">

                              {/* Edit */}

                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      category
                                    )
                                  }
                                  className="btn btn-sm btn-ghost text-info"
                                  title="পরিবর্তন করুন"
                                >
                                  <FaEdit />
                                </button>
                              )}

                              {/* Delete */}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      category._id
                                    )
                                  }
                                  className="btn btn-sm btn-ghost text-error"
                                  title="মুছে ফেলুন"
                                >
                                  <FaTrash />
                                </button>
                              )}

                            </div>

                          </td>
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {/* Empty */}

              {filteredCategories.length ===
                0 && (
                <EmptyState />
              )}

            </div>

          </div>

          {/* ================================= */}
          {/* Mobile Cards */}
          {/* ================================= */}

          <div className="space-y-3 md:hidden">

            {filteredCategories.map(
              (
                category,
                index
              ) => (
                <div
                  key={category._id}
                  className="card border border-base-300 bg-base-100 shadow-sm"
                >

                  <div className="card-body p-4">

                    {/* Card Header */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">

                          <FaTags className="text-primary" />

                        </div>

                        <div className="min-w-0">

                          <h2 className="truncate font-bold">
                            {category.name}
                          </h2>

                          <p className="text-xs text-base-content/50">
                            ক্যাটাগরি #
                            {index + 1}
                          </p>

                        </div>

                      </div>

                      <span
                        className={`badge shrink-0 ${
                          category.status ===
                          "সক্রিয়"
                            ? "badge-success"
                            : "badge-ghost"
                        }`}
                      >
                        {category.status}
                      </span>

                    </div>

                    {/* Description */}

                    <p className="mt-3 text-sm text-base-content/60">
                      {category.description ||
                        "কোনো বর্ণনা নেই"}
                    </p>

                    {/* Unit */}

                    <div className="mt-2 rounded-xl bg-base-200 p-3">

                      <p className="text-xs text-base-content/50">
                        ইউনিট
                      </p>

                      <p className="mt-1 font-semibold">
                        {category.unit}
                      </p>

                    </div>

                    {/* Actions */}

                    {(canUpdate ||
                      canDelete) && (
                      <div
                        className={`mt-3 grid gap-2 ${
                          canUpdate &&
                          canDelete
                            ? "grid-cols-2"
                            : "grid-cols-1"
                        }`}
                      >

                        {/* Edit */}

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                            className="btn btn-sm btn-outline btn-info"
                          >
                            <FaEdit />
                            পরিবর্তন
                          </button>
                        )}

                        {/* Delete */}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                category._id
                              )
                            }
                            className="btn btn-sm btn-outline btn-error"
                          >
                            <FaTrash />
                            মুছুন
                          </button>
                        )}

                      </div>
                    )}

                  </div>

                </div>
              )
            )}

            {/* Empty */}

            {filteredCategories.length ===
              0 && (
              <EmptyState />
            )}

          </div>
        </>
      )}

      {/* ================================= */}
      {/* Add / Edit Modal */}
      {/* ================================= */}

      {showModal && (
        <dialog className="modal modal-open">

          <div className="modal-box w-11/12 max-w-lg p-4 sm:p-6">

            {/* Modal Header */}

            <div className="mb-5">

              <h3 className="text-lg font-bold sm:text-xl">

                {editingCategory
                  ? "ক্যাটাগরি পরিবর্তন"
                  : "নতুন ক্যাটাগরি"}

              </h3>

              <p className="mt-1 text-xs text-base-content/50 sm:text-sm">
                ক্যাটাগরির তথ্য পূরণ করুন
              </p>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* Name */}

              <div>

                <label className="label">

                  <span className="label-text font-medium">
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

              {/* Description */}

              <div>

                <label className="label">

                  <span className="label-text font-medium">
                    বর্ণনা
                  </span>

                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                  placeholder="ক্যাটাগরি সম্পর্কে সংক্ষিপ্ত বর্ণনা"
                  className="textarea textarea-bordered w-full"
                  rows="3"
                />

              </div>

              {/* Unit */}

              <div>

                <label className="label">

                  <span className="label-text font-medium">
                    ইউনিট *
                  </span>

                </label>

                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >

                  <option value="পিস">
                    পিস
                  </option>

                  <option value="কেজি">
                    কেজি
                  </option>

                  <option value="কেজি + পিস">
                    কেজি + পিস
                  </option>

                  <option value="প্যাকেট">
                    প্যাকেট
                  </option>

                  <option value="বক্স">
                    বক্স
                  </option>

                  <option value="লিটার">
                    লিটার
                  </option>

                </select>

              </div>

              {/* Status */}

              <div>

                <label className="label">

                  <span className="label-text font-medium">
                    স্ট্যাটাস
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

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="btn w-full sm:w-auto"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    (editingCategory
                      ? !canUpdate
                      : !canCreate)
                  }
                  className="btn btn-primary w-full sm:w-auto"
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

          {/* Modal Backdrop */}

          <form className="modal-backdrop">

            <button
              type="button"
              onClick={closeModal}
            >
              বন্ধ
            </button>

          </form>

        </dialog>
      )}

    </div>
  );
}

// =====================================
// Loading Component
// =====================================

function LoadingState() {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">

      <div className="card-body">

        <div className="flex flex-col items-center justify-center py-12">

          <span className="loading loading-spinner loading-lg text-primary" />

          <p className="mt-3 text-sm text-base-content/50">
            ক্যাটাগরি লোড হচ্ছে...
          </p>

        </div>

      </div>

    </div>
  );
}

// =====================================
// Empty Component
// =====================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12">

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-base-200">

        <FaTags className="text-2xl text-base-content/30" />

      </div>

      <h3 className="mt-4 font-semibold">
        কোনো ক্যাটাগরি পাওয়া যায়নি
      </h3>

      <p className="mt-1 text-center text-sm text-base-content/50">
        নতুন ক্যাটাগরি যোগ করুন অথবা অন্য নামে খুঁজুন।
      </p>

    </div>
  );
}

export default Categories;