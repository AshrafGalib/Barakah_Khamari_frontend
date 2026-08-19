import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaEdit,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhone,
  FaPlus,
  FaSearch,
  FaStore,
  FaTrash,
  FaUser,
  FaTimes,
} from "react-icons/fa";

import { toast } from "react-toastify";

import {
  authAPI,
  roleAPI,
  supplierAPI,
} from "../services/api";

const EMPTY_FORM = {
  name: "",
  type: "মুরগির খামার",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: "সক্রিয়",
};

const SUPPLIER_TYPES = [
  "মুরগির খামার",
  "ডিম সরবরাহকারী",
  "মসলা সরবরাহকারী",
  "অন্যান্য",
];

const EMPTY_PAYMENT_FORM = {
  amount: "",
  paymentMethod: "ক্যাশ",
  date: new Date()
    .toISOString()
    .slice(0, 10),
  notes: "",
};

// ======================================================
// Permission Helpers
// ======================================================

const normalizePermission = (permission) => {
  if (!permission) {
    return "";
  }

  if (typeof permission === "string") {
    return permission.trim().toLowerCase();
  }

  if (typeof permission === "object") {
    return String(
      permission.key ||
        permission.name ||
        permission.code ||
        permission.permission ||
        ""
    )
      .trim()
      .toLowerCase();
  }

  return "";
};

const getPermissionList = (user) => {
  if (!user) {
    return [];
  }

  const possiblePermissionSources = [
    user.permissions,
    user.role?.permissions,
    user.rolePermissions,
    user.permissionList,
  ];

  for (
    const source of possiblePermissionSources
  ) {
    if (Array.isArray(source)) {
      return source
        .map(normalizePermission)
        .filter(Boolean);
    }
  }

  return [];
};

const hasPermission = (
  user,
  requiredPermissions = []
) => {
  if (!user) {
    return false;
  }

  // Admin has full access
  const userRole = String(
    user.role?.name ||
      user.role ||
      ""
  )
    .trim()
    .toLowerCase();

  if (userRole === "admin") {
    return true;
  }

  const permissions =
    getPermissionList(user);

  if (!permissions.length) {
    return false;
  }

  return requiredPermissions.some(
    (permission) => {
      const normalized =
        String(permission)
          .trim()
          .toLowerCase();

      return (
        permissions.includes(
          normalized
        ) ||
        permissions.includes(
          `${normalized}.action`
        )
      );
    }
  );
};

// Supplier permission aliases.
// Multiple aliases are supported so the component can work
// with either singular/plural permission naming.
const SUPPLIER_PERMISSIONS = {
  create: [
    "supplier.create",
    "suppliers.create",
    "supplier.add",
    "suppliers.add",
  ],

  update: [
    "supplier.update",
    "suppliers.update",
    "supplier.edit",
    "suppliers.edit",
  ],

  delete: [
    "supplier.delete",
    "suppliers.delete",
  ],

  payDue: [
    "supplier.pay_due",
    "suppliers.pay_due",
    "supplier.payDue",
    "suppliers.payDue",
    "supplier.payment",
    "suppliers.payment",
  ],
};

const Suppliers = () => {
  // ==========================================
  // Supplier States
  // ==========================================

  const [suppliers, setSuppliers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [
    editingSupplier,
    setEditingSupplier,
  ] = useState(null);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
    });

  const [saving, setSaving] =
    useState(false);

  // ==========================================
  // Permission States
  // ==========================================

  const [currentUser, setCurrentUser] =
    useState(null);

  const [
    permissionsLoading,
    setPermissionsLoading,
  ] = useState(true);

  // ==========================================
  // Due Payment States
  // ==========================================

  const [
    showPaymentModal,
    setShowPaymentModal,
  ] = useState(false);

  const [
    paymentSupplier,
    setPaymentSupplier,
  ] = useState(null);

  const [
    paymentForm,
    setPaymentForm,
  ] = useState({
    ...EMPTY_PAYMENT_FORM,
  });

  const [
    paymentSaving,
    setPaymentSaving,
  ] = useState(false);

  // ==========================================
  // Load Current User + Permissions
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadPermissions =
      async () => {
        try {
          setPermissionsLoading(true);

          // --------------------------------------
          // Get Current Logged-in User
          // --------------------------------------

          const meResponse =
            await authAPI.me();

          if (cancelled) {
            return;
          }

          const user =
            meResponse?.data ||
            meResponse?.user ||
            null;

          if (!user) {
            setCurrentUser(null);
            return;
          }

          // --------------------------------------
          // If permissions already exist
          // --------------------------------------

          const existingPermissions =
            getPermissionList(user);

          if (
            existingPermissions.length > 0 ||
            String(
              user.role?.name ||
                user.role ||
                ""
            )
              .trim()
              .toLowerCase() ===
              "admin"
          ) {
            setCurrentUser(user);
            return;
          }

          // --------------------------------------
          // Load Role Permissions
          // --------------------------------------

          if (user.roleId) {
            try {
              const roleResponse =
                await roleAPI.getById(
                  user.roleId
                );

              if (cancelled) {
                return;
              }

              const role =
                roleResponse?.data ||
                roleResponse?.role ||
                null;

              if (role) {
                setCurrentUser({
                  ...user,
                  role: {
                    ...(typeof user.role ===
                    "object"
                      ? user.role
                      : {}),
                    ...role,
                  },
                  permissions:
                    role.permissions ||
                    user.permissions ||
                    [],
                });

                return;
              }
            } catch (roleError) {
              console.error(
                "Load Role Permission Error:",
                roleError
              );
            }
          }

          setCurrentUser(user);
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Load Permission Error:",
            error
          );

          setCurrentUser(null);
        } finally {
          if (!cancelled) {
            setPermissionsLoading(false);
          }
        }
      };

    loadPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // Permission Checks
  // ==========================================

  const canCreateSupplier =
    hasPermission(
      currentUser,
      SUPPLIER_PERMISSIONS.create
    );

  const canUpdateSupplier =
    hasPermission(
      currentUser,
      SUPPLIER_PERMISSIONS.update
    );

  const canDeleteSupplier =
    hasPermission(
      currentUser,
      SUPPLIER_PERMISSIONS.delete
    );

  const canPaySupplierDue =
    hasPermission(
      currentUser,
      SUPPLIER_PERMISSIONS.payDue
    );

  // ==========================================
  // প্রথমবার Supplier Load
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialSuppliers =
      async () => {
        try {
          const response =
            await supplierAPI.getAll();

          if (cancelled) {
            return;
          }

          setSuppliers(
            response.data || []
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          toast.error(
            error.message ||
              "সরবরাহকারীর তালিকা লোড করা যায়নি"
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadInitialSuppliers();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // Supplier Reload
  // ==========================================

  const reloadSuppliers =
    async () => {
      try {
        const response =
          await supplierAPI.getAll();

        setSuppliers(
          response.data || []
        );
      } catch (error) {
        toast.error(
          error.message ||
            "সরবরাহকারীর তালিকা আপডেট করা যায়নি"
        );
      }
    };

  // ==========================================
  // Search Filter
  // ==========================================

  const filteredSuppliers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return suppliers;
      }

      return suppliers.filter(
        (supplier) => {
          const name =
            supplier.name?.toLowerCase() ||
            "";

          const type =
            supplier.type?.toLowerCase() ||
            "";

          const phone =
            supplier.phone?.toLowerCase() ||
            "";

          const contactPerson =
            supplier.contactPerson?.toLowerCase() ||
            "";

          const address =
            supplier.address?.toLowerCase() ||
            "";

          return (
            name.includes(keyword) ||
            type.includes(keyword) ||
            phone.includes(keyword) ||
            contactPerson.includes(keyword) ||
            address.includes(keyword)
          );
        }
      );
    }, [suppliers, search]);

  // ==========================================
  // Total Supplier Due
  // ==========================================

  const totalSupplierDue =
    useMemo(() => {
      return suppliers.reduce(
        (total, supplier) =>
          total +
          (Number(
            supplier.currentDue
          ) || 0),
        0
      );
    }, [suppliers]);

  // ==========================================
  // Add Modal
  // ==========================================

  const openAddModal = () => {
    if (!canCreateSupplier) {
      toast.error(
        "Supplier যোগ করার permission আপনার নেই"
      );

      return;
    }

    setEditingSupplier(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowModal(true);
  };

  // ==========================================
  // Edit Modal
  // ==========================================

  const openEditModal = (
    supplier
  ) => {
    if (!canUpdateSupplier) {
      toast.error(
        "Supplier পরিবর্তন করার permission আপনার নেই"
      );

      return;
    }

    setEditingSupplier(
      supplier
    );

    setForm({
      name:
        supplier.name || "",

      type:
        supplier.type ||
        "মুরগির খামার",

      contactPerson:
        supplier.contactPerson ||
        "",

      phone:
        supplier.phone || "",

      email:
        supplier.email || "",

      address:
        supplier.address || "",

      notes:
        supplier.notes || "",

      status:
        supplier.status ||
        "সক্রিয়",
    });

    setShowModal(true);
  };

  // ==========================================
  // Close Supplier Modal
  // ==========================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingSupplier(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // ==========================================
  // Input Change
  // ==========================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // ==========================================
  // Submit Supplier
  // ==========================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    // ----------------------------------------
    // Permission Check
    // ----------------------------------------

    if (editingSupplier) {
      if (!canUpdateSupplier) {
        toast.error(
          "Supplier পরিবর্তন করার permission আপনার নেই"
        );

        return;
      }
    } else {
      if (!canCreateSupplier) {
        toast.error(
          "Supplier যোগ করার permission আপনার নেই"
        );

        return;
      }
    }

    const supplierName =
      form.name.trim();

    if (!supplierName) {
      toast.error(
        "সরবরাহকারী/খামারের নাম দিন"
      );

      return;
    }

    const supplierData = {
      ...form,

      name:
        supplierName,

      contactPerson:
        form.contactPerson.trim(),

      phone:
        form.phone.trim(),

      email:
        form.email.trim(),

      address:
        form.address.trim(),

      notes:
        form.notes.trim(),
    };

    try {
      setSaving(true);

      if (editingSupplier) {
        await supplierAPI.update(
          editingSupplier._id,
          supplierData
        );

        toast.success(
          "সরবরাহকারীর তথ্য সফলভাবে পরিবর্তন হয়েছে"
        );
      } else {
        await supplierAPI.create(
          supplierData
        );

        toast.success(
          "সরবরাহকারী সফলভাবে যোগ হয়েছে"
        );
      }

      setShowModal(false);

      setEditingSupplier(null);

      setForm({
        ...EMPTY_FORM,
      });

      await reloadSuppliers();
    } catch (error) {
      toast.error(
        error.message ||
          "তথ্য সংরক্ষণ করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Delete Supplier
  // ==========================================

  const handleDelete =
    async (supplier) => {
      if (!canDeleteSupplier) {
        toast.error(
          "Supplier মুছে ফেলার permission আপনার নেই"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `"${supplier.name}" সরবরাহকারীটি মুছে ফেলতে চান?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await supplierAPI.delete(
          supplier._id
        );

        toast.success(
          "সরবরাহকারী সফলভাবে মুছে ফেলা হয়েছে"
        );

        await reloadSuppliers();
      } catch (error) {
        toast.error(
          error.message ||
            "সরবরাহকারী মুছে ফেলা যায়নি"
        );
      }
    };

  // ==========================================
  // Open Due Payment Modal
  // ==========================================

  const openPaymentModal =
    (supplier) => {
      if (!canPaySupplierDue) {
        toast.error(
          "Supplier Due payment করার permission আপনার নেই"
        );

        return;
      }

      const currentDue =
        Number(
          supplier.currentDue
        ) || 0;

      if (currentDue <= 0) {
        toast.info(
          "এই Supplier-এর কোনো outstanding Due নেই"
        );

        return;
      }

      setPaymentSupplier(
        supplier
      );

      setPaymentForm({
        ...EMPTY_PAYMENT_FORM,

        amount: "",

        paymentMethod:
          "ক্যাশ",

        date: new Date()
          .toISOString()
          .slice(0, 10),

        notes: "",
      });

      setShowPaymentModal(
        true
      );
    };

  // ==========================================
  // Close Due Payment Modal
  // ==========================================

  const closePaymentModal =
    () => {
      if (paymentSaving) {
        return;
      }

      setShowPaymentModal(
        false
      );

      setPaymentSupplier(null);

      setPaymentForm({
        ...EMPTY_PAYMENT_FORM,
      });
    };

  // ==========================================
  // Payment Input Change
  // ==========================================

  const handlePaymentChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setPaymentForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  // ==========================================
  // Submit Due Payment
  // ==========================================

  const handlePaymentSubmit =
    async (event) => {
      event.preventDefault();

      if (!canPaySupplierDue) {
        toast.error(
          "Supplier Due payment করার permission আপনার নেই"
        );

        return;
      }

      if (!paymentSupplier) {
        return;
      }

      const amount =
        Number(
          paymentForm.amount
        );

      const currentDue =
        Number(
          paymentSupplier.currentDue
        ) || 0;

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        toast.error(
          "সঠিক payment amount দিন"
        );

        return;
      }

      if (
        amount > currentDue
      ) {
        toast.error(
          `Payment amount বর্তমান Due-এর চেয়ে বেশি হতে পারবে না। Current Due: ৳${currentDue.toFixed(
            2
          )}`
        );

        return;
      }

      try {
        setPaymentSaving(true);

        await supplierAPI.payDue(
          paymentSupplier._id,
          {
            amount,

            paymentMethod:
              paymentForm.paymentMethod,

            date:
              paymentForm.date,

            notes:
              paymentForm.notes.trim(),
          }
        );

        toast.success(
          "Supplier Due সফলভাবে পরিশোধ করা হয়েছে"
        );

        closePaymentModal();

        await reloadSuppliers();
      } catch (error) {
        toast.error(
          error.message ||
            "Supplier Due payment করা যায়নি"
        );
      } finally {
        setPaymentSaving(false);
      }
    };

  // ==========================================
  // Permission Loading
  // ==========================================

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg" />

          <p className="mt-3 text-sm text-base-content/50">
            Permission যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ====================================
          Page Header
      ==================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
            সরবরাহকারী
          </h1>

          <p className="mt-1 text-sm text-base-content/60">
            খামার, ডিম ও অন্যান্য
            সরবরাহকারীর তথ্য পরিচালনা করুন
          </p>
        </div>

        {canCreateSupplier && (
          <button
            type="button"
            onClick={
              openAddModal
            }
            className="btn btn-primary gap-2"
          >
            <FaPlus />

            <span>
              নতুন সরবরাহকারী
            </span>
          </button>
        )}
      </div>

      {/* ====================================
          Summary Cards
      ==================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <p className="text-xs text-base-content/50">
            মোট সরবরাহকারী
          </p>

          <p className="mt-1 text-2xl font-bold">
            {suppliers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <p className="text-xs text-base-content/50">
            সক্রিয়
          </p>

          <p className="mt-1 text-2xl font-bold text-success">
            {
              suppliers.filter(
                (supplier) =>
                  supplier.status ===
                  "সক্রিয়"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <p className="text-xs text-base-content/50">
            নিষ্ক্রিয়
          </p>

          <p className="mt-1 text-2xl font-bold text-error">
            {
              suppliers.filter(
                (supplier) =>
                  supplier.status !==
                  "সক্রিয়"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-sm">
          <p className="text-xs text-base-content/60">
            মোট Supplier Due
          </p>

          <p className="mt-1 text-2xl font-bold text-warning">
            ৳
            {totalSupplierDue.toFixed(
              2
            )}
          </p>
        </div>
      </div>

      {/* ====================================
          Search
      ==================================== */}

      <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />

          <input
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="নাম, ফোন, ধরন, ঠিকানা দিয়ে খুঁজুন..."
            className="input input-bordered w-full pl-11"
          />
        </div>
      </div>

      {/* ====================================
          Desktop Table
      ==================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  সরবরাহকারী
                </th>

                <th>
                  ধরন
                </th>

                <th>
                  যোগাযোগ
                </th>

                <th>
                  ঠিকানা
                </th>

                <th>
                  Due
                </th>

                <th>
                  অবস্থা
                </th>

                <th className="text-right">
                  কাজ
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-16 text-center"
                  >
                    <span className="loading loading-spinner loading-lg" />

                    <p className="mt-3 text-sm text-base-content/50">
                      তথ্য লোড হচ্ছে...
                    </p>
                  </td>
                </tr>
              ) : filteredSuppliers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-16 text-center"
                  >
                    <FaStore className="mx-auto mb-3 text-4xl text-base-content/20" />

                    <p className="font-semibold">
                      কোনো সরবরাহকারী পাওয়া যায়নি
                    </p>

                    <p className="mt-1 text-sm text-base-content/50">
                      নতুন সরবরাহকারী যোগ করুন
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(
                  (supplier) => {
                    const due =
                      Number(
                        supplier.currentDue
                      ) || 0;

                    return (
                      <tr
                        key={
                          supplier._id
                        }
                      >
                        {/* Supplier */}

                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <FaStore />
                            </div>

                            <div>
                              <p className="font-bold">
                                {
                                  supplier.name
                                }
                              </p>

                              {supplier.contactPerson && (
                                <p className="text-xs text-base-content/50">
                                  {
                                    supplier.contactPerson
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}

                        <td>
                          <span className="badge badge-outline">
                            {
                              supplier.type
                            }
                          </span>
                        </td>

                        {/* Contact */}

                        <td>
                          {supplier.phone ? (
                            <div className="flex items-center gap-2">
                              <FaPhone className="text-xs text-base-content/40" />

                              <span>
                                {
                                  supplier.phone
                                }
                              </span>
                            </div>
                          ) : (
                            <span className="text-base-content/30">
                              —
                            </span>
                          )}
                        </td>

                        {/* Address */}

                        <td>
                          {supplier.address ? (
                            <div className="flex max-w-56 items-center gap-2">
                              <FaMapMarkerAlt className="shrink-0 text-xs text-base-content/40" />

                              <span className="truncate">
                                {
                                  supplier.address
                                }
                              </span>
                            </div>
                          ) : (
                            <span className="text-base-content/30">
                              —
                            </span>
                          )}
                        </td>

                        {/* Due */}

                        <td>
                          {due >
                          0 ? (
                            <div>
                              <p className="font-bold text-warning">
                                ৳
                                {due.toFixed(
                                  2
                                )}
                              </p>

                              {canPaySupplierDue && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPaymentModal(
                                      supplier
                                    )
                                  }
                                  className="btn btn-xs btn-warning mt-1 gap-1"
                                >
                                  <FaMoneyBillWave />

                                  পরিশোধ
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-success badge-outline">
                              Due নেই
                            </span>
                          )}
                        </td>

                        {/* Status */}

                        <td>
                          <span
                            className={`badge ${
                              supplier.status ===
                              "সক্রিয়"
                                ? "badge-success"
                                : "badge-ghost"
                            }`}
                          >
                            {
                              supplier.status
                            }
                          </span>
                        </td>

                        {/* Actions */}

                        <td>
                          <div className="flex justify-end gap-2">
                            {canUpdateSupplier && (
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    supplier
                                  )
                                }
                                className="btn btn-sm btn-square btn-ghost text-info"
                                title="পরিবর্তন"
                              >
                                <FaEdit />
                              </button>
                            )}

                            {canDeleteSupplier && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    supplier
                                  )
                                }
                                className="btn btn-sm btn-square btn-ghost text-error"
                                title="মুছে ফেলুন"
                              >
                                <FaTrash />
                              </button>
                            )}
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

      {/* ====================================
          Mobile Cards
      ==================================== */}

      <div className="grid gap-4 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 py-16 text-center">
            <span className="loading loading-spinner loading-lg" />

            <p className="mt-3 text-sm text-base-content/50">
              তথ্য লোড হচ্ছে...
            </p>
          </div>
        ) : filteredSuppliers.length ===
          0 ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-sm">
            <FaStore className="mx-auto mb-3 text-4xl text-base-content/20" />

            <p className="font-semibold">
              কোনো সরবরাহকারী পাওয়া যায়নি
            </p>

            <p className="mt-1 text-sm text-base-content/50">
              নতুন সরবরাহকারী যোগ করুন
            </p>
          </div>
        ) : (
          filteredSuppliers.map(
            (supplier) => {
              const due =
                Number(
                  supplier.currentDue
                ) || 0;

              return (
                <div
                  key={
                    supplier._id
                  }
                  className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
                >
                  {/* Card Top */}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FaStore />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold">
                          {
                            supplier.name
                          }
                        </h3>

                        <p className="mt-1 text-xs text-base-content/50">
                          {
                            supplier.type
                          }
                        </p>
                      </div>
                    </div>

                    <span
                      className={`badge shrink-0 ${
                        supplier.status ===
                        "সক্রিয়"
                          ? "badge-success"
                          : "badge-ghost"
                      }`}
                    >
                      {
                        supplier.status
                      }
                    </span>
                  </div>

                  {/* Due Box */}

                  <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-base-content/50">
                          বর্তমান Due
                        </p>

                        <p className="text-xl font-bold text-warning">
                          ৳
                          {due.toFixed(
                            2
                          )}
                        </p>
                      </div>

                      {due > 0 &&
                        canPaySupplierDue && (
                          <button
                            type="button"
                            onClick={() =>
                              openPaymentModal(
                                supplier
                              )
                            }
                            className="btn btn-sm btn-warning gap-2"
                          >
                            <FaMoneyBillWave />

                            Due পরিশোধ
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Details */}

                  <div className="my-4 space-y-3 border-y border-base-200 py-4 text-sm">
                    {supplier.contactPerson && (
                      <div className="flex items-center gap-3">
                        <FaUser className="w-4 shrink-0 text-base-content/40" />

                        <span>
                          {
                            supplier.contactPerson
                          }
                        </span>
                      </div>
                    )}

                    {supplier.phone && (
                      <div className="flex items-center gap-3">
                        <FaPhone className="w-4 shrink-0 text-base-content/40" />

                        <span>
                          {
                            supplier.phone
                          }
                        </span>
                      </div>
                    )}

                    {supplier.address && (
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="mt-1 w-4 shrink-0 text-base-content/40" />

                        <span>
                          {
                            supplier.address
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}

                  {(canUpdateSupplier ||
                    canDeleteSupplier) && (
                    <div className="flex gap-2">
                      {canUpdateSupplier && (
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              supplier
                            )
                          }
                          className="btn btn-sm flex-1 btn-info btn-outline"
                        >
                          <FaEdit />

                          পরিবর্তন
                        </button>
                      )}

                      {canDeleteSupplier && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              supplier
                            )
                          }
                          className="btn btn-sm btn-error btn-outline"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>

      {/* ====================================
          Add/Edit Modal
      ==================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-base-100 shadow-2xl">
            {/* Modal Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-base-300 bg-base-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  {editingSupplier
                    ? "সরবরাহকারী পরিবর্তন"
                    : "নতুন সরবরাহকারী"}
                </h2>

                <p className="mt-1 text-xs text-base-content/50">
                  সরবরাহকারী/খামারের তথ্য দিন
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="btn btn-sm btn-circle btn-ghost"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}

            <div className="overflow-y-auto">
              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5 p-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}

                  <div className="form-control sm:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">
                        সরবরাহকারী/খামারের নাম *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="যেমন: রহমান পোল্ট্রি ফার্ম"
                      className="input input-bordered w-full"
                      required
                    />
                  </div>

                  {/* Type */}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        সরবরাহকারীর ধরন
                      </span>
                    </label>

                    <select
                      name="type"
                      value={
                        form.type
                      }
                      onChange={
                        handleChange
                      }
                      className="select select-bordered w-full"
                    >
                      {SUPPLIER_TYPES.map(
                        (type) => (
                          <option
                            key={
                              type
                            }
                            value={
                              type
                            }
                          >
                            {
                              type
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* Status */}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        অবস্থা
                      </span>
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
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

                  {/* Contact Person */}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        যোগাযোগ ব্যক্তির নাম
                      </span>
                    </label>

                    <input
                      type="text"
                      name="contactPerson"
                      value={
                        form.contactPerson
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="নাম"
                      className="input input-bordered w-full"
                    />
                  </div>

                  {/* Phone */}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        মোবাইল নম্বর
                      </span>
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="01XXXXXXXXX"
                      className="input input-bordered w-full"
                    />
                  </div>

                  {/* Email */}

                  <div className="form-control sm:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">
                        ইমেইল
                      </span>
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="example@email.com"
                      className="input input-bordered w-full"
                    />
                  </div>

                  {/* Address */}

                  <div className="form-control sm:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">
                        ঠিকানা
                      </span>
                    </label>

                    <textarea
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="সম্পূর্ণ ঠিকানা"
                      className="textarea textarea-bordered min-h-24 w-full"
                    />
                  </div>

                  {/* Notes */}

                  <div className="form-control sm:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">
                        নোট
                      </span>
                    </label>

                    <textarea
                      name="notes"
                      value={
                        form.notes
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="অতিরিক্ত তথ্য..."
                      className="textarea textarea-bordered min-h-20 w-full"
                    />
                  </div>
                </div>

                {/* Footer */}

                <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving
                    }
                    className="btn btn-ghost"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />

                        সংরক্ষণ হচ্ছে...
                      </>
                    ) : editingSupplier ? (
                      "পরিবর্তন সংরক্ষণ"
                    ) : (
                      "সংরক্ষণ করুন"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================
          Supplier Due Payment Modal
      ==================================== */}

      {showPaymentModal &&
        paymentSupplier && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-5">
            <div className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-base-100 shadow-2xl">
              {/* Header */}

              <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold sm:text-xl">
                    Supplier Due Payment
                  </h2>

                  <p className="mt-1 text-xs text-base-content/50">
                    {
                      paymentSupplier.name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closePaymentModal
                  }
                  disabled={
                    paymentSaving
                  }
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Body */}

              <form
                onSubmit={
                  handlePaymentSubmit
                }
                className="space-y-5 overflow-y-auto p-5"
              >
                {/* Current Due */}

                <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
                  <p className="text-sm text-base-content/60">
                    বর্তমান Supplier Due
                  </p>

                  <p className="mt-1 text-3xl font-bold text-warning">
                    ৳
                    {(
                      Number(
                        paymentSupplier.currentDue
                      ) || 0
                    ).toFixed(
                      2
                    )}
                  </p>
                </div>

                {/* Amount */}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Payment Amount *
                    </span>
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={
                      paymentForm.amount
                    }
                    onChange={
                      handlePaymentChange
                    }
                    min="0.01"
                    max={
                      paymentSupplier.currentDue
                    }
                    step="0.01"
                    placeholder="যেমন: 2000"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Payment Method */}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Payment Method
                    </span>
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      paymentForm.paymentMethod
                    }
                    onChange={
                      handlePaymentChange
                    }
                    className="select select-bordered w-full"
                  >
                    <option value="ক্যাশ">
                      ক্যাশ
                    </option>

                    <option value="ব্যাংক">
                      ব্যাংক
                    </option>

                    <option value="বিকাশ">
                      বিকাশ
                    </option>

                    <option value="নগদ">
                      নগদ
                    </option>

                    <option value="অন্যান্য">
                      অন্যান্য
                    </option>
                  </select>
                </div>

                {/* Date */}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Payment Date
                    </span>
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={
                      paymentForm.date
                    }
                    onChange={
                      handlePaymentChange
                    }
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Notes */}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      নোট
                    </span>
                  </label>

                  <textarea
                    name="notes"
                    value={
                      paymentForm.notes
                    }
                    onChange={
                      handlePaymentChange
                    }
                    placeholder="যেমন: পুরাতন বকেয়া পরিশোধ"
                    className="textarea textarea-bordered min-h-24 w-full"
                  />
                </div>

                {/* Footer */}

                <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closePaymentModal
                    }
                    disabled={
                      paymentSaving
                    }
                    className="btn btn-ghost"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={
                      paymentSaving
                    }
                    className="btn btn-warning"
                  >
                    {paymentSaving ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />

                        Payment হচ্ছে...
                      </>
                    ) : (
                      <>
                        <FaMoneyBillWave />

                        Due পরিশোধ করুন
                      </>
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

export default Suppliers;