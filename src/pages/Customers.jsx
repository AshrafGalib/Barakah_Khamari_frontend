import { useEffect, useMemo, useState } from "react";

import {
  FaEdit,
  FaPhone,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUser,
  FaTimes,
  FaMoneyBillWave,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { customerAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  notes: "",
  dueAmount: "",
};

const Customers = () => {
  // ==========================================
  // Permissions
  // ==========================================

  const { can } = usePermission();

  const canCreate = can(
    PERMISSIONS.CUSTOMERS_CREATE
  );

  const canUpdate = can(
    PERMISSIONS.CUSTOMERS_UPDATE
  );

  const canDelete = can(
    PERMISSIONS.CUSTOMERS_DELETE
  );

  const canDuePayment = can(
    PERMISSIONS.CUSTOMERS_DUE_PAYMENT
  );

  // ==========================================
  // States
  // ==========================================

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  const [saving, setSaving] = useState(false);

  // ==========================================
  // Due Payment Modal
  // ==========================================

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [paymentCustomer, setPaymentCustomer] =
    useState(null);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [payingDue, setPayingDue] =
    useState(false);

  // ==========================================
  // প্রথমবার Customer Load
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadCustomers = async () => {
      try {
        setLoading(true);

        const response =
          await customerAPI.getAll();

        if (cancelled) return;

        setCustomers(
          Array.isArray(response?.data)
            ? response.data
            : []
        );
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Load Customers Error:",
          error
        );

        toast.error(
          error?.message ||
            "Customer তালিকা লোড করা যায়নি"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // Customer Reload
  // ==========================================

  const reloadCustomers = async () => {
    try {
      const response =
        await customerAPI.getAll();

      setCustomers(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Reload Customers Error:",
        error
      );

      toast.error(
        error?.message ||
          "Customer তালিকা আপডেট করা যায়নি"
      );
    }
  };

  // ==========================================
  // Search
  // ==========================================

  const filteredCustomers = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return customers;
    }

    return customers.filter((customer) => {
      const name =
        String(
          customer?.name || ""
        ).toLowerCase();

      const phone =
        String(
          customer?.phone || ""
        ).toLowerCase();

      const address =
        String(
          customer?.address || ""
        ).toLowerCase();

      return (
        name.includes(keyword) ||
        phone.includes(keyword) ||
        address.includes(keyword)
      );
    });
  }, [customers, search]);

  // ==========================================
  // Summary
  // ==========================================

  const totalDue = useMemo(() => {
    return customers.reduce(
      (total, customer) =>
        total +
        Number(
          customer?.dueAmount || 0
        ),
      0
    );
  }, [customers]);

  const dueCustomerCount = useMemo(() => {
    return customers.filter(
      (customer) =>
        Number(
          customer?.dueAmount || 0
        ) > 0
    ).length;
  }, [customers]);

  // ==========================================
  // Format Money
  // ==========================================

  const formatMoney = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-BD",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  };

  // ==========================================
  // Add Customer Modal
  // ==========================================

  const openAddModal = () => {
    if (!canCreate) {
      toast.error(
        "Customer যোগ করার permission নেই"
      );

      return;
    }

    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowModal(true);
  };

  // ==========================================
  // Edit Customer Modal
  // ==========================================

  const openEditModal = (customer) => {
    if (!canUpdate) {
      toast.error(
        "Customer পরিবর্তন করার permission নেই"
      );

      return;
    }

    setEditingCustomer(customer);

    setForm({
      name:
        customer?.name || "",

      phone:
        customer?.phone || "",

      address:
        customer?.address || "",

      notes:
        customer?.notes || "",

      dueAmount:
        customer?.dueAmount ?? "",
    });

    setShowModal(true);
  };

  // ==========================================
  // Close Add/Edit Modal
  // ==========================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // ==========================================
  // Input Change
  // ==========================================

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

  // ==========================================
  // Submit Customer
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ========================================
    // Permission Check
    // ========================================

    if (editingCustomer) {
      if (!canUpdate) {
        toast.error(
          "Customer পরিবর্তন করার permission নেই"
        );

        return;
      }
    } else {
      if (!canCreate) {
        toast.error(
          "Customer যোগ করার permission নেই"
        );

        return;
      }
    }

    // ========================================
    // Form Values
    // ========================================

    const name =
      form.name.trim();

    const phone =
      form.phone.trim();

    const address =
      form.address.trim();

    const notes =
      form.notes.trim();

    const dueAmount =
      Number(
        form.dueAmount || 0
      );

    // ========================================
    // Validation
    // ========================================

    if (!name) {
      toast.error(
        "Customer-এর নাম দিন"
      );

      return;
    }

    if (
      !Number.isFinite(
        dueAmount
      ) ||
      dueAmount < 0
    ) {
      toast.error(
        "Due amount সঠিকভাবে দিন"
      );

      return;
    }

    // ========================================
    // Existing Customer Update
    // ========================================

    if (editingCustomer) {
      const customerData = {
        name,
        phone,
        address,
        notes,
      };

      try {
        setSaving(true);

        await customerAPI.update(
          editingCustomer._id,
          customerData
        );

        toast.success(
          "Customer-এর তথ্য সফলভাবে পরিবর্তন হয়েছে"
        );

        setShowModal(false);

        setEditingCustomer(null);

        setForm({
          ...EMPTY_FORM,
        });

        await reloadCustomers();
      } catch (error) {
        console.error(
          "Update Customer Error:",
          error
        );

        toast.error(
          error?.message ||
            "Customer তথ্য সংরক্ষণ করা যায়নি"
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    // ========================================
    // New Customer
    // ========================================

    const customerData = {
      name,
      phone,
      address,
      notes,

      dueAmount,

      paymentType:
        dueAmount > 0
          ? "বাকি"
          : "নগদ",
    };

    try {
      setSaving(true);

      await customerAPI.create(
        customerData
      );

      toast.success(
        "Customer সফলভাবে যোগ হয়েছে"
      );

      setShowModal(false);

      setEditingCustomer(null);

      setForm({
        ...EMPTY_FORM,
      });

      await reloadCustomers();
    } catch (error) {
      console.error(
        "Create Customer Error:",
        error
      );

      toast.error(
        error?.message ||
          "Customer তথ্য সংরক্ষণ করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Open Due Payment Modal
  // ==========================================

  const openPaymentModal = (customer) => {
    if (!canDuePayment) {
      toast.error(
        "Customer Due Payment নেওয়ার permission নেই"
      );

      return;
    }

    const currentDue =
      Number(
        customer?.dueAmount || 0
      );

    if (currentDue <= 0) {
      toast.info(
        "এই Customer-এর কোনো Due নেই"
      );

      return;
    }

    setPaymentCustomer(customer);

    setPaymentAmount("");

    setShowPaymentModal(true);
  };

  // ==========================================
  // Close Due Payment Modal
  // ==========================================

  const closePaymentModal = () => {
    if (payingDue) {
      return;
    }

    setShowPaymentModal(false);

    setPaymentCustomer(null);

    setPaymentAmount("");
  };

  // ==========================================
  // Pay Customer Due
  // ==========================================

  const handlePayDue = async (event) => {
    event.preventDefault();

    // ========================================
    // Permission Check
    // ========================================

    if (!canDuePayment) {
      toast.error(
        "Customer Due Payment নেওয়ার permission নেই"
      );

      return;
    }

    if (!paymentCustomer) {
      return;
    }

    const amount =
      Number(
        paymentAmount
      );

    const currentDue =
      Number(
        paymentCustomer?.dueAmount || 0
      );

    // ========================================
    // Validate Amount
    // ========================================

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Payment Amount সঠিক নয়"
      );

      return;
    }

    if (
      amount > currentDue
    ) {
      toast.error(
        "Payment Amount Customer-এর Due-এর চেয়ে বেশি হতে পারবে না"
      );

      return;
    }

    try {
      setPayingDue(true);

      // ======================================
      // Backend Due Payment
      //
      // Backend এখানে:
      // 1. Customer due কমাবে
      // 2. Cash Balance-এ cash inflow যোগ করবে
      // 3. Transaction-safe update করবে
      // ======================================

      await customerAPI.payDue(
        paymentCustomer._id,
        {
          amount,
        }
      );

      toast.success(
        `৳ ${formatMoney(
          amount
        )} Due Payment সফলভাবে গ্রহণ করা হয়েছে`
      );

      // ======================================
      // Close Modal
      // ======================================

      setShowPaymentModal(false);

      setPaymentCustomer(null);

      setPaymentAmount("");

      // ======================================
      // Reload Customer
      // ======================================

      await reloadCustomers();
    } catch (error) {
      console.error(
        "Customer Due Payment Error:",
        error
      );

      toast.error(
        error?.message ||
          "Due Payment গ্রহণ করা যায়নি"
      );
    } finally {
      setPayingDue(false);
    }
  };

  // ==========================================
  // Delete Customer
  // ==========================================

  const handleDelete = async (
    customer
  ) => {
    if (!canDelete) {
      toast.error(
        "Customer মুছে ফেলার permission নেই"
      );

      return;
    }

    const confirmed =
      window.confirm(
        `"${customer?.name}" Customer-কে মুছে ফেলতে চান?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await customerAPI.delete(
        customer._id
      );

      toast.success(
        "Customer সফলভাবে মুছে ফেলা হয়েছে"
      );

      await reloadCustomers();
    } catch (error) {
      console.error(
        "Delete Customer Error:",
        error
      );

      toast.error(
        error?.message ||
          "Customer মুছে ফেলা যায়নি"
      );
    }
  };

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
            Customer
          </h1>

          <p className="mt-1 text-sm text-base-content/60">
            Due থাকা Customer-এর তথ্য পরিচালনা করুন
          </p>

        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary gap-2"
          >
            <FaPlus />

            <span>
              নতুন Customer
            </span>
          </button>
        )}

      </div>

      {/* ====================================
          Summary Cards
      ==================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

        {/* Total Customer */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">

          <p className="text-xs text-base-content/50">
            মোট Customer
          </p>

          <p className="mt-1 text-2xl font-bold">
            {customers.length}
          </p>

        </div>

        {/* Due Customer */}

        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">

          <p className="text-xs text-base-content/50">
            Due Customer
          </p>

          <p className="mt-1 text-2xl font-bold text-warning">
            {dueCustomerCount}
          </p>

        </div>

        {/* Total Due */}

        <div className="col-span-2 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:col-span-1">

          <p className="text-xs text-base-content/50">
            মোট বাকি
          </p>

          <p className="mt-1 text-2xl font-bold text-error">
            ৳ {formatMoney(totalDue)}
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
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="নাম, ফোন অথবা ঠিকানা দিয়ে খুঁজুন..."
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
                  Customer
                </th>

                <th>
                  মোবাইল
                </th>

                <th>
                  ঠিকানা
                </th>

                <th>
                  বাকি
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
                    colSpan="5"
                    className="py-16 text-center"
                  >

                    <span className="loading loading-spinner loading-lg" />

                    <p className="mt-3 text-sm text-base-content/50">
                      তথ্য লোড হচ্ছে...
                    </p>

                  </td>

                </tr>

              ) : filteredCustomers.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="py-16 text-center"
                  >

                    <FaUser className="mx-auto mb-3 text-4xl text-base-content/20" />

                    <p className="font-semibold">
                      কোনো Customer পাওয়া যায়নি
                    </p>

                    <p className="mt-1 text-sm text-base-content/50">
                      নতুন Customer যোগ করুন
                    </p>

                  </td>

                </tr>

              ) : (

                filteredCustomers.map(
                  (customer) => {

                    const dueAmount =
                      Number(
                        customer?.dueAmount || 0
                      );

                    return (
                      <tr
                        key={
                          customer._id
                        }
                      >

                        {/* Customer */}

                        <td>

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <FaUser />
                            </div>

                            <div>

                              <p className="font-bold">
                                {customer.name}
                              </p>

                              {customer.notes && (
                                <p className="max-w-48 truncate text-xs text-base-content/50">
                                  {customer.notes}
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* Phone */}

                        <td>

                          {customer.phone ? (

                            <div className="flex items-center gap-2">

                              <FaPhone className="text-xs text-base-content/40" />

                              <span>
                                {customer.phone}
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

                          {customer.address ? (

                            <span className="block max-w-56 truncate">
                              {customer.address}
                            </span>

                          ) : (

                            <span className="text-base-content/30">
                              —
                            </span>

                          )}

                        </td>

                        {/* Due */}

                        <td>

                          <span
                            className={
                              dueAmount > 0
                                ? "font-bold text-error"
                                : "font-semibold text-success"
                            }
                          >
                            ৳{" "}
                            {formatMoney(
                              dueAmount
                            )}
                          </span>

                        </td>

                        {/* Actions */}

                        <td>

                          <div className="flex justify-end gap-2">

                            {/* Pay Due */}

                            {dueAmount > 0 &&
                              canDuePayment && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    openPaymentModal(
                                      customer
                                    )
                                  }
                                  className="btn btn-sm gap-2 btn-success"
                                  title="Due Payment"
                                >

                                  <FaMoneyBillWave />

                                  Pay Due

                                </button>

                              )}

                            {/* Update */}

                            {canUpdate && (

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    customer
                                  )
                                }
                                className="btn btn-sm btn-square btn-ghost text-info"
                                title="পরিবর্তন"
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
                                    customer
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

        ) : filteredCustomers.length === 0 ? (

          <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-sm">

            <FaUser className="mx-auto mb-3 text-4xl text-base-content/20" />

            <p className="font-semibold">
              কোনো Customer পাওয়া যায়নি
            </p>

            <p className="mt-1 text-sm text-base-content/50">
              নতুন Customer যোগ করুন
            </p>

          </div>

        ) : (

          filteredCustomers.map(
            (customer) => {

              const dueAmount =
                Number(
                  customer?.dueAmount || 0
                );

              return (
                <div
                  key={
                    customer._id
                  }
                  className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
                >

                  {/* Card Top */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FaUser />
                      </div>

                      <div className="min-w-0">

                        <h3 className="truncate font-bold">
                          {customer.name}
                        </h3>

                        <p className="mt-1 text-xs text-base-content/50">
                          Customer
                        </p>

                      </div>

                    </div>

                    <div
                      className={
                        dueAmount > 0
                          ? "badge badge-error"
                          : "badge badge-success"
                      }
                    >
                      {dueAmount > 0
                        ? "Due"
                        : "Paid"}
                    </div>

                  </div>

                  {/* Details */}

                  <div className="my-4 space-y-3 border-y border-base-200 py-4 text-sm">

                    {customer.phone && (

                      <div className="flex items-center gap-3">

                        <FaPhone className="w-4 shrink-0 text-base-content/40" />

                        <span>
                          {customer.phone}
                        </span>

                      </div>

                    )}

                    {customer.address && (

                      <div className="flex items-start gap-3">

                        <FaUser className="mt-1 w-4 shrink-0 text-base-content/40" />

                        <span>
                          {customer.address}
                        </span>

                      </div>

                    )}

                    <div className="flex items-center gap-3">

                      <FaMoneyBillWave
                        className={
                          dueAmount > 0
                            ? "w-4 shrink-0 text-error"
                            : "w-4 shrink-0 text-success"
                        }
                      />

                      <span
                        className={
                          dueAmount > 0
                            ? "font-bold text-error"
                            : "font-bold text-success"
                        }
                      >
                        {dueAmount > 0
                          ? "বাকি"
                          : "পরিশোধিত"}
                        : ৳{" "}
                        {formatMoney(
                          dueAmount
                        )}
                      </span>

                    </div>

                  </div>

                  {/* Actions */}

                  <div className="flex gap-2">

                    {/* Due Payment */}

                    {dueAmount > 0 &&
                      canDuePayment && (

                        <button
                          type="button"
                          onClick={() =>
                            openPaymentModal(
                              customer
                            )
                          }
                          className="btn btn-sm flex-1 btn-success"
                        >

                          <FaMoneyBillWave />

                          Due Pay

                        </button>

                      )}

                    {/* Update */}

                    {canUpdate && (

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            customer
                          )
                        }
                        className="btn btn-sm flex-1 btn-info btn-outline"
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
                            customer
                          )
                        }
                        className="btn btn-sm btn-error btn-outline"
                      >

                        <FaTrash />

                      </button>

                    )}

                  </div>

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

                  {editingCustomer
                    ? "Customer পরিবর্তন"
                    : "নতুন Customer"}

                </h2>

                <p className="mt-1 text-xs text-base-content/50">
                  Customer-এর তথ্য দিন
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

            {/* Modal Body */}

            <div className="overflow-y-auto">

              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5"
              >

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Name */}

                  <div className="form-control sm:col-span-2">

                    <label className="label">

                      <span className="label-text font-semibold">
                        Customer-এর নাম *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="যেমন: Rahim"
                      className="input input-bordered w-full"
                      required
                    />

                    {!editingCustomer && (

                      <label className="label">

                        <span className="label-text-alt text-base-content/50">
                          Cash/Nagad customer হলে backend থেকে
                          Customer 001, Customer 002 ইত্যাদি
                          auto-generate করা যাবে।
                        </span>

                      </label>

                    )}

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
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className="input input-bordered w-full"
                    />

                  </div>

                  {/* Due Amount */}

                  <div className="form-control">

                    <label className="label">

                      <span className="label-text font-semibold">
                        {editingCustomer
                          ? "বর্তমান বাকি"
                          : "প্রাথমিক বাকি"}
                      </span>

                    </label>

                    <input
                      type="number"
                      name="dueAmount"
                      value={
                        form.dueAmount
                      }
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      disabled={
                        Boolean(
                          editingCustomer
                        )
                      }
                      className="input input-bordered w-full disabled:bg-base-200 disabled:text-base-content"
                    />

                    {editingCustomer && (

                      <label className="label">

                        <span className="label-text-alt text-warning">
                          Due পরিবর্তন করতে Pay Due ব্যবহার করুন
                        </span>

                      </label>

                    )}

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
                      onChange={handleChange}
                      placeholder="Customer-এর ঠিকানা"
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
                      onChange={handleChange}
                      placeholder="অতিরিক্ত তথ্য..."
                      className="textarea textarea-bordered min-h-20 w-full"
                    />

                  </div>

                </div>

                {/* Footer */}

                <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">

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
                    disabled={
                      saving ||
                      (
                        editingCustomer
                          ? !canUpdate
                          : !canCreate
                      )
                    }
                    className="btn btn-primary"
                  >

                    {saving ? (

                      <>
                        <span className="loading loading-spinner loading-sm" />

                        সংরক্ষণ হচ্ছে...
                      </>

                    ) : editingCustomer ? (

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
          Due Payment Modal
      ==================================== */}

      {showPaymentModal &&
        paymentCustomer && (

          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-5">

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-base-100 shadow-2xl">

              {/* Header */}

              <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">

                    <FaMoneyBillWave />

                  </div>

                  <div>

                    <h2 className="text-lg font-bold">
                      Due Payment
                    </h2>

                    <p className="text-xs text-base-content/50">
                      Customer-এর বাকি পরিশোধ করুন
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    closePaymentModal
                  }
                  disabled={payingDue}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <FaTimes />
                </button>

              </div>

              {/* Body */}

              <form
                onSubmit={handlePayDue}
                className="space-y-5 p-5"
              >

                {/* Customer */}

                <div className="rounded-xl bg-base-200 p-4">

                  <p className="text-xs text-base-content/50">
                    Customer
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {paymentCustomer.name}
                  </p>

                  {paymentCustomer.phone && (

                    <p className="mt-1 text-sm text-base-content/60">
                      {paymentCustomer.phone}
                    </p>

                  )}

                </div>

                {/* Current Due */}

                <div className="rounded-xl bg-error/10 p-4">

                  <div className="flex items-center justify-between">

                    <span className="font-semibold">
                      বর্তমান বাকি
                    </span>

                    <span className="text-2xl font-bold text-error">
                      ৳{" "}
                      {formatMoney(
                        paymentCustomer.dueAmount
                      )}
                    </span>

                  </div>

                </div>

                {/* Payment Amount */}

                <div className="form-control">

                  <label className="label">

                    <span className="label-text font-semibold">
                      Payment Amount *
                    </span>

                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      paymentAmount
                    }
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="যত টাকা customer দিয়েছে"
                    className="input input-bordered input-lg w-full"
                    autoFocus
                    required
                  />

                  <label className="label">

                    <span className="label-text-alt text-base-content/50">
                      সর্বোচ্চ ৳{" "}
                      {formatMoney(
                        paymentCustomer.dueAmount
                      )}{" "}
                      পর্যন্ত নেওয়া যাবে
                    </span>

                  </label>

                </div>

                {/* Cash Flow Info */}

                <div className="rounded-xl border border-success/20 bg-success/5 p-4">

                  <div className="flex items-start gap-3">

                    <FaMoneyBillWave className="mt-1 shrink-0 text-success" />

                    <div>

                      <p className="text-sm font-semibold text-success">
                        Cash Balance Update হবে
                      </p>

                      <p className="mt-1 text-xs text-base-content/60">
                        Customer-এর কাছ থেকে নেওয়া
                        payment Cash Balance-এর
                        cash inflow হিসেবে যোগ হবে।
                      </p>

                    </div>

                  </div>

                </div>

                {/* Footer */}

                <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      closePaymentModal
                    }
                    disabled={payingDue}
                    className="btn btn-ghost"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={
                      payingDue ||
                      !paymentAmount ||
                      !canDuePayment
                    }
                    className="btn btn-success gap-2"
                  >

                    {payingDue ? (

                      <>
                        <span className="loading loading-spinner loading-sm" />

                        Payment নেওয়া হচ্ছে...
                      </>

                    ) : (

                      <>
                        <FaMoneyBillWave />

                        Due Payment নিন
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

export default Customers;
