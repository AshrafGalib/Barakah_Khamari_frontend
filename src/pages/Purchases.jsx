import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTimes,
  FaReceipt,
  FaTruck,
  FaBox,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-toastify";

import {
  purchaseAPI,
  productAPI,
  supplierAPI,
} from "../services/api";

import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

// ======================================================
// Current Local Date & Time
// ======================================================

const getCurrentDateTime = () => {
  const now = new Date();

  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
};

// ======================================================
// Empty Form
// ======================================================

const createEmptyForm = () => ({
  purchaseDate: getCurrentDateTime(),
  invoiceNo: "",
  supplierId: "",
  productId: "",
  quantity: "",
  pieces: "",
  weight: "",
  buyingPrice: "",
  paidAmount: "",
  paymentMethod: "ক্যাশ",
  notes: "",
});

const Purchase = () => {
  // ====================================================
  // Permissions
  // ====================================================

  const { can } = usePermission();

  const canCreatePurchase = can(
    PERMISSIONS.PURCHASES_CREATE
  );

  const canDeletePurchase = can(
    PERMISSIONS.PURCHASES_DELETE
  );

  // ====================================================
  // States
  // ====================================================

  const [purchases, setPurchases] = useState([]);

  const [products, setProducts] = useState([]);

  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState(
    createEmptyForm()
  );

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  // ====================================================
  // Initial Data Load
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const [
          purchaseResponse,
          productResponse,
          supplierResponse,
        ] = await Promise.all([
          purchaseAPI.getAll(),
          productAPI.getAll(),
          supplierAPI.getAll(),
        ]);

        if (cancelled) {
          return;
        }

        setPurchases(
          purchaseResponse?.data || []
        );

        setProducts(
          productResponse?.data || []
        );

        setSuppliers(
          supplierResponse?.data || []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Initial purchase loading error:",
          error
        );

        toast.error(
          error.message ||
            "Purchase data load করা যায়নি"
        );
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ====================================================
  // Load Data
  // ====================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        purchaseResponse,
        productResponse,
        supplierResponse,
      ] = await Promise.all([
        purchaseAPI.getAll(),
        productAPI.getAll(),
        supplierAPI.getAll(),
      ]);

      setPurchases(
        purchaseResponse?.data || []
      );

      setProducts(
        productResponse?.data || []
      );

      setSuppliers(
        supplierResponse?.data || []
      );
    } catch (error) {
      console.error(
        "Purchase data loading error:",
        error
      );

      toast.error(
        error.message ||
          "Purchase data load করা যায়নি"
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // Selected Product
  // ====================================================

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        String(product._id) ===
        String(form.productId)
    );
  }, [
    products,
    form.productId,
  ]);

  // ====================================================
  // Poultry Product
  // ====================================================

  const isPoultry =
    selectedProduct?.unit ===
    "কেজি + পিস";

  // ====================================================
  // Form Change
  // ====================================================

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

  // ====================================================
  // Product Change
  // ====================================================

  const handleProductChange = (event) => {
    const productId =
      event.target.value;

    setForm((previous) => ({
      ...previous,
      productId,
      quantity: "",
      pieces: "",
      weight: "",
      buyingPrice: "",
      paidAmount: "",
    }));
  };

  // ====================================================
  // Total Amount
  // ====================================================

  const totalAmount = useMemo(() => {
    const price =
      Number(form.buyingPrice) || 0;

    if (isPoultry) {
      const weight =
        Number(form.weight) || 0;

      return weight * price;
    }

    const quantity =
      Number(form.quantity) || 0;

    return quantity * price;
  }, [
    form.buyingPrice,
    form.weight,
    form.quantity,
    isPoultry,
  ]);

  // ====================================================
  // Paid
  // ====================================================

  const paidAmount =
    Number(form.paidAmount) || 0;

  // ====================================================
  // Due
  // ====================================================

  const dueAmount = Math.max(
    totalAmount - paidAmount,
    0
  );

  // ====================================================
  // Submit
  // ====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Permission protection
    if (!canCreatePurchase) {
      toast.error(
        "Purchase যোগ করার অনুমতি নেই"
      );

      return;
    }

    // Product
    if (!form.productId) {
      toast.error(
        "Product নির্বাচন করুন"
      );

      return;
    }

    // Poultry validation
    if (isPoultry) {
      if (
        !form.pieces ||
        Number(form.pieces) <= 0
      ) {
        toast.error(
          "Pieces দিন"
        );

        return;
      }

      if (
        !form.weight ||
        Number(form.weight) <= 0
      ) {
        toast.error(
          "Weight দিন"
        );

        return;
      }
    }

    // Normal product
    if (!isPoultry) {
      if (
        !form.quantity ||
        Number(form.quantity) <= 0
      ) {
        toast.error(
          "Quantity দিন"
        );

        return;
      }
    }

    // Buying Price
    if (
      !form.buyingPrice ||
      Number(form.buyingPrice) <= 0
    ) {
      toast.error(
        "Buying Price দিন"
      );

      return;
    }

    // Paid amount
    if (paidAmount > totalAmount) {
      toast.error(
        "Paid Amount Total Amount-এর চেয়ে বেশি হতে পারবে না"
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        purchaseDate:
          form.purchaseDate,

        invoiceNo:
          form.invoiceNo.trim(),

        supplierId:
          form.supplierId || null,

        productId:
          form.productId,

        productName:
          selectedProduct?.name || "",

        unit:
          selectedProduct?.unit || "",

        quantity: isPoultry
          ? null
          : Number(form.quantity),

        pieces: isPoultry
          ? Number(form.pieces)
          : null,

        weight: isPoultry
          ? Number(form.weight)
          : null,

        buyingPrice:
          Number(form.buyingPrice),

        totalAmount,

        paidAmount,

        dueAmount,

        paymentMethod:
          form.paymentMethod,

        notes:
          form.notes.trim(),
      };

      await purchaseAPI.create(
        payload
      );

      toast.success(
        "Purchase সফলভাবে যোগ হয়েছে"
      );

      setForm(
        createEmptyForm()
      );

      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error(
        "Purchase save error:",
        error
      );

      toast.error(
        error.message ||
          "Purchase save করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // Delete
  // ====================================================

  const handleDelete = async (id) => {
    if (!canDeletePurchase) {
      toast.error(
        "Purchase delete করার অনুমতি নেই"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "এই Purchase delete করতে চান?\n\nPurchase delete করলে Product stock-এর উপর প্রভাব পড়তে পারে।"
      );

    if (!confirmed) {
      return;
    }

    try {
      await purchaseAPI.delete(id);

      toast.success(
        "Purchase delete হয়েছে"
      );

      await loadData();
    } catch (error) {
      console.error(
        "Purchase delete error:",
        error
      );

      toast.error(
        error.message ||
          "Purchase delete করা যায়নি"
      );
    }
  };

  // ====================================================
  // Search
  // ====================================================

  const filteredPurchases = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return purchases;
    }

    return purchases.filter(
      (purchase) => {
        const productName =
          purchase.productName ||
          "";

        const supplierName =
          purchase.supplierName ||
          "";

        const invoiceNo =
          purchase.invoiceNo ||
          "";

        return (
          productName
            .toLowerCase()
            .includes(keyword) ||
          supplierName
            .toLowerCase()
            .includes(keyword) ||
          invoiceNo
            .toLowerCase()
            .includes(keyword)
        );
      }
    );
  }, [
    purchases,
    search,
  ]);

  // ====================================================
  // Date Format
  // ====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ====================================================
  // Summary
  // ====================================================

  const summary = useMemo(() => {
    return purchases.reduce(
      (result, purchase) => {
        result.total +=
          Number(
            purchase.totalAmount
          ) || 0;

        result.paid +=
          Number(
            purchase.paidAmount
          ) || 0;

        result.due +=
          Number(
            purchase.dueAmount
          ) || 0;

        return result;
      },
      {
        total: 0,
        paid: 0,
        due: 0,
      }
    );
  }, [purchases]);

  // ====================================================
  // Open Form
  // ====================================================

  const openPurchaseForm = () => {
    if (!canCreatePurchase) {
      toast.error(
        "Purchase যোগ করার অনুমতি নেই"
      );

      return;
    }

    setForm(
      createEmptyForm()
    );

    setShowForm(true);
  };

  // ====================================================
  // Close Form
  // ====================================================

  const closePurchaseForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);

    setForm(
      createEmptyForm()
    );
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="purchase-page">

      {/* ==========================================
          Header
      =========================================== */}

      <div className="purchase-header">

        <div>
          <h1>
            Purchase Management
          </h1>

          <p>
            Product কেনার সম্পূর্ণ
            হিসাব ও Purchase History
          </p>
        </div>

        {/* Create Permission */}

        {canCreatePurchase && (
          <button
            type="button"
            className="add-purchase-btn"
            onClick={
              openPurchaseForm
            }
          >
            <FaPlus />

            <span>
              নতুন Purchase
            </span>
          </button>
        )}

      </div>

      {/* ==========================================
          Summary
      =========================================== */}

      <div className="summary-grid">

        <div className="summary-card">

          <div className="summary-icon">
            <FaReceipt />
          </div>

          <div>
            <span>
              Total Purchase
            </span>

            <strong>
              ৳{" "}
              {summary.total.toLocaleString()}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>
              Total Paid
            </span>

            <strong>
              ৳{" "}
              {summary.paid.toLocaleString()}
            </strong>
          </div>

        </div>

        <div className="summary-card">

          <div className="summary-icon">
            <FaTruck />
          </div>

          <div>
            <span>
              Total Due
            </span>

            <strong>
              ৳{" "}
              {summary.due.toLocaleString()}
            </strong>
          </div>

        </div>

      </div>

      {/* ==========================================
          Search
      =========================================== */}

      <div className="purchase-toolbar">

        <div className="search-box">

          <FaSearch />

          <input
            type="text"
            value={search}
            placeholder="Product, Supplier অথবা Invoice দিয়ে search করুন..."
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

      </div>

      {/* ==========================================
          Table
      =========================================== */}

      <div className="purchase-table-wrapper">

        {loading ? (

          <div className="loading">

            <div className="loader" />

            <p>
              Purchase data loading...
            </p>

          </div>

        ) : filteredPurchases.length === 0 ? (

          <div className="empty-state">

            <FaBox />

            <h3>
              কোনো Purchase পাওয়া যায়নি
            </h3>

            <p>
              {canCreatePurchase
                ? "নতুন Purchase যোগ করতে উপরের button ব্যবহার করুন।"
                : "কোনো Purchase পাওয়া যায়নি।"}
            </p>

          </div>

        ) : (

          <table className="purchase-table">

            <thead>

              <tr>

                <th>
                  Date
                </th>

                <th>
                  Invoice
                </th>

                <th>
                  Product
                </th>

                <th>
                  Supplier
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Buying Price
                </th>

                <th>
                  Total
                </th>

                <th>
                  Paid
                </th>

                <th>
                  Due
                </th>

                {/* Delete permission থাকলে Action column */}

                {canDeletePurchase && (
                  <th>
                    Action
                  </th>
                )}

              </tr>

            </thead>

            <tbody>

              {filteredPurchases.map(
                (purchase) => {

                  const purchaseIsPoultry =
                    purchase.unit ===
                    "কেজি + পিস";

                  return (
                    <tr
                      key={
                        purchase._id
                      }
                    >

                      <td>
                        {formatDate(
                          purchase.purchaseDate
                        )}
                      </td>

                      <td>
                        {purchase.invoiceNo ||
                          "-"}
                      </td>

                      <td>

                        <strong>
                          {
                            purchase.productName
                          }
                        </strong>

                        <small>
                          {
                            purchase.unit
                          }
                        </small>

                      </td>

                      <td>
                        {
                          purchase.supplierName ||
                          "নিজস্ব"
                        }
                      </td>

                      <td>

                        {purchaseIsPoultry ? (
                          <>
                            <strong>
                              {
                                purchase.pieces
                              }{" "}
                              টি
                            </strong>

                            <small>
                              {
                                purchase.weight
                              }{" "}
                              kg
                            </small>
                          </>
                        ) : (
                          <>
                            <strong>
                              {
                                purchase.quantity
                              }
                            </strong>

                            <small>
                              {
                                purchase.unit
                              }
                            </small>
                          </>
                        )}

                      </td>

                      <td>
                        ৳{" "}
                        {Number(
                          purchase.buyingPrice
                        ).toLocaleString()}
                      </td>

                      <td>

                        <strong>
                          ৳{" "}
                          {Number(
                            purchase.totalAmount
                          ).toLocaleString()}
                        </strong>

                      </td>

                      <td>
                        ৳{" "}
                        {Number(
                          purchase.paidAmount
                        ).toLocaleString()}
                      </td>

                      <td>

                        <span
                          className={
                            Number(
                              purchase.dueAmount
                            ) > 0
                              ? "due-badge"
                              : "paid-badge"
                          }
                        >
                          ৳{" "}
                          {Number(
                            purchase.dueAmount
                          ).toLocaleString()}
                        </span>

                      </td>

                      {/* Delete Permission */}

                      {canDeletePurchase && (
                        <td>

                          <button
                            type="button"
                            className="delete-btn"
                            title="Delete Purchase"
                            onClick={() =>
                              handleDelete(
                                purchase._id
                              )
                            }
                          >
                            <FaTrash />
                          </button>

                        </td>
                      )}

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ==========================================
          Modal
      =========================================== */}

      {showForm && canCreatePurchase && (

        <div className="modal-overlay">

          <div className="purchase-modal">

            <div className="modal-header">

              <div>

                <h2>
                  নতুন Purchase
                </h2>

                <p>
                  Purchase save করলে
                  Product stock automatically
                  update হবে।
                </p>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={
                  closePurchaseForm
                }
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* Date + Invoice */}

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    <FaCalendarAlt />
                    Purchase Date *
                  </label>

                  <input
                    type="datetime-local"
                    name="purchaseDate"
                    value={
                      form.purchaseDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    <FaReceipt />
                    Invoice No
                  </label>

                  <input
                    type="text"
                    name="invoiceNo"
                    value={
                      form.invoiceNo
                    }
                    placeholder="Invoice / Challan No"
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              {/* Supplier */}

              <div className="form-group">

                <label>
                  <FaTruck />
                  Supplier
                </label>

                <select
                  name="supplierId"
                  value={
                    form.supplierId
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="">
                    Supplier নির্বাচন করুন
                  </option>

                  {suppliers.map(
                    (supplier) => (

                      <option
                        key={
                          supplier._id
                        }
                        value={
                          supplier._id
                        }
                      >
                        {
                          supplier.name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* Product */}

              <div className="form-group">

                <label>
                  <FaBox />
                  Product *
                </label>

                <select
                  name="productId"
                  value={
                    form.productId
                  }
                  onChange={
                    handleProductChange
                  }
                  required
                >

                  <option value="">
                    Product নির্বাচন করুন
                  </option>

                  {products.map(
                    (product) => (

                      <option
                        key={
                          product._id
                        }
                        value={
                          product._id
                        }
                      >
                        {product.name}
                        {" — "}
                        {product.unit}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* Selected Product Info */}

              {selectedProduct && (

                <div className="product-info">

                  <div>

                    <span>
                      Product
                    </span>

                    <strong>
                      {
                        selectedProduct.name
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Unit
                    </span>

                    <strong>
                      {
                        selectedProduct.unit
                      }
                    </strong>

                  </div>

                  {isPoultry ? (

                    <>

                      <div>

                        <span>
                          Current Pieces
                        </span>

                        <strong>
                          {
                            selectedProduct
                              .stockPieces ??
                            0
                          }{" "}
                          টি
                        </strong>

                      </div>

                      <div>

                        <span>
                          Current Weight
                        </span>

                        <strong>
                          {
                            selectedProduct
                              .totalWeight ??
                            0
                          }{" "}
                          kg
                        </strong>

                      </div>

                    </>

                  ) : (

                    <div>

                      <span>
                        Current Stock
                      </span>

                      <strong>
                        {
                          selectedProduct
                            .stockQuantity ??
                          0
                        }{" "}
                        {
                          selectedProduct.unit
                        }
                      </strong>

                    </div>

                  )}

                </div>

              )}

              {/* Poultry */}

              {isPoultry ? (

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Pieces *
                    </label>

                    <input
                      type="number"
                      name="pieces"
                      min="0"
                      step="1"
                      value={
                        form.pieces
                      }
                      placeholder="যেমন: 50"
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Weight (kg) *
                    </label>

                    <input
                      type="number"
                      name="weight"
                      min="0"
                      step="0.01"
                      value={
                        form.weight
                      }
                      placeholder="যেমন: 75.50"
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                </div>

              ) : (

                <div className="form-group">

                  <label>

                    Quantity

                    {selectedProduct?.unit
                      ? ` (${selectedProduct.unit})`
                      : ""}

                    {" *"}

                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    step="0.01"
                    value={
                      form.quantity
                    }
                    placeholder="Quantity"
                    onChange={
                      handleChange
                    }
                  />

                </div>

              )}

              {/* Buying Price */}

              <div className="form-group">

                <label>

                  Buying Price *

                  {isPoultry
                    ? " (প্রতি kg)"
                    : selectedProduct?.unit
                    ? ` (প্রতি ${selectedProduct.unit})`
                    : ""}

                </label>

                <input
                  type="number"
                  name="buyingPrice"
                  min="0"
                  step="0.01"
                  value={
                    form.buyingPrice
                  }
                  placeholder="0.00"
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              {/* Total */}

              <div className="calculation-box">

                <div>

                  <span>
                    Total Purchase
                  </span>

                  <strong>
                    ৳{" "}
                    {totalAmount.toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* Paid + Due */}

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    name="paidAmount"
                    min="0"
                    step="0.01"
                    value={
                      form.paidAmount
                    }
                    placeholder="0.00"
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Due Amount
                  </label>

                  <input
                    type="text"
                    value={
                      `৳ ${dueAmount.toLocaleString()}`
                    }
                    readOnly
                  />

                </div>

              </div>

              {/* Payment Method */}

              <div className="form-group">

                <label>
                  Payment Method
                </label>

                <select
                  name="paymentMethod"
                  value={
                    form.paymentMethod
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="ক্যাশ">
                    ক্যাশ
                  </option>

                  <option value="বিকাশ">
                    বিকাশ
                  </option>

                  <option value="নগদ">
                    নগদ
                  </option>

                  <option value="ব্যাংক">
                    ব্যাংক
                  </option>

                  <option value="বাকি">
                    বাকি
                  </option>

                </select>

              </div>

              {/* Notes */}

              <div className="form-group">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  rows="3"
                  value={
                    form.notes
                  }
                  placeholder="কোনো অতিরিক্ত তথ্য..."
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* Buttons */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closePurchaseForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={
                    saving ||
                    !canCreatePurchase
                  }
                >

                  {saving
                    ? "Saving..."
                    : "Purchase Save"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ==================================================
          Styles
      ================================================== */}

      <style>{`

  .purchase-page {
    width: 100%;
    min-height: 100vh;
    padding: 24px;
    background: var(--bg-primary, inherit);
    color: var(--text-primary, inherit);
    box-sizing: border-box;
  }

  .purchase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }

  .purchase-header h1 {
    margin: 0 0 6px;
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary, inherit);
  }

  .purchase-header p {
    margin: 0;
    color: var(--text-secondary, inherit);
    font-size: 14px;
  }

  .add-purchase-btn {
    border: 1px solid var(--primary-color, #15803d);
    background: var(--primary-color, #15803d);
    color: var(--button-text, #ffffff);
    padding: 12px 18px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    white-space: nowrap;
    transition: 0.2s;
  }

  .add-purchase-btn:hover {
    opacity: 0.9;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .summary-card {
    background: var(--card-bg, transparent);
    border: 1px solid var(--border-color, rgba(128,128,128,0.25));
    border-radius: 14px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--card-shadow, none);
  }

  .summary-icon {
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: 11px;
    background: var(
      --primary-light,
      rgba(21, 128, 61, 0.12)
    );
    color: var(--primary-color, #15803d);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .summary-card span {
    display: block;
    color: var(--text-secondary, inherit);
    font-size: 13px;
    margin-bottom: 4px;
  }

  .summary-card strong {
    font-size: 20px;
    color: var(--text-primary, inherit);
  }

  .purchase-toolbar {
    margin-bottom: 16px;
  }

  .search-box {
    width: 100%;
    max-width: 550px;
    height: 46px;
    background: var(--input-bg, transparent);
    border: 1px solid var(
      --border-color,
      rgba(128,128,128,0.25)
    );
    border-radius: 10px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary, inherit);
    box-sizing: border-box;
  }

  .search-box input {
    border: none;
    outline: none;
    width: 100%;
    height: 100%;
    font-size: 14px;
    background: transparent;
    color: var(--text-primary, inherit);
  }

  .search-box input::placeholder {
    color: var(--text-secondary, inherit);
    opacity: 0.7;
  }

  .purchase-table-wrapper {
    width: 100%;
    background: var(--card-bg, transparent);
    border: 1px solid var(
      --border-color,
      rgba(128,128,128,0.25)
    );
    border-radius: 14px;
    overflow-x: auto;
    box-shadow: var(--card-shadow, none);
  }

  .purchase-table {
    width: 100%;
    min-width: 1100px;
    border-collapse: collapse;
  }

  .purchase-table th {
    background: var(
      --table-header-bg,
      rgba(128,128,128,0.08)
    );
    text-align: left;
    padding: 14px;
    color: var(--text-secondary, inherit);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  .purchase-table td {
    padding: 14px;
    border-top: 1px solid var(
      --border-color,
      rgba(128,128,128,0.15)
    );
    color: var(--text-primary, inherit);
    font-size: 14px;
    vertical-align: middle;
  }

  .purchase-table td strong {
    display: block;
    color: var(--text-primary, inherit);
  }

  .purchase-table td small {
    display: block;
    color: var(--text-secondary, inherit);
    margin-top: 4px;
    font-size: 12px;
  }

  .due-badge,
  .paid-badge {
    display: inline-block;
    padding: 5px 9px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .due-badge {
    color: var(--danger-color, #dc2626);
    background: var(
      --danger-light,
      rgba(220, 38, 38, 0.12)
    );
  }

  .paid-badge {
    color: var(--success-color, #16a34a);
    background: var(
      --success-light,
      rgba(22, 163, 74, 0.12)
    );
  }

  .delete-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(
      --danger-light,
      rgba(220, 38, 38, 0.12)
    );
    color: var(--danger-color, #dc2626);
    cursor: pointer;
    transition: 0.2s;
  }

  .delete-btn:hover {
    opacity: 0.8;
  }

  .loading,
  .empty-state {
    color: var(--text-secondary, inherit);
    padding: 60px 20px;
    text-align: center;
  }

  .empty-state h3 {
    color: var(--text-primary, inherit);
    margin-top: 12px;
  }

  .empty-state p {
    color: var(--text-secondary, inherit);
  }

  .loader {
    width: 38px;
    height: 38px;
    margin: 0 auto 12px;
    border-radius: 50%;
    border: 4px solid rgba(128,128,128,0.2);
    border-top-color: var(--primary-color, #15803d);
    animation: purchase-spin 0.8s linear infinite;
  }

  @keyframes purchase-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    padding: 20px;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .purchase-modal {
    width: min(700px, 100%);
    max-height: 92vh;
    overflow-y: auto;
    background: var(--card-bg, #1f2937);
    color: var(--text-primary, inherit);
    border: 1px solid var(
      --border-color,
      rgba(128,128,128,0.25)
    );
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(
      --modal-shadow,
      0 20px 50px rgba(0,0,0,0.25)
    );
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 22px;
  }

  .modal-header h2 {
    margin: 0 0 5px;
    font-size: 22px;
    color: var(--text-primary, inherit);
  }

  .modal-header p {
    margin: 0;
    color: var(--text-secondary, inherit);
    font-size: 13px;
  }

  .close-modal {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border: none;
    border-radius: 50%;
    background: var(
      --hover-bg,
      rgba(128,128,128,0.12)
    );
    color: var(--text-primary, inherit);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .form-group {
    width: 100%;
    margin-bottom: 16px;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 7px;
    color: var(--text-primary, inherit);
    font-size: 13px;
    font-weight: 600;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    border: 1px solid var(
      --border-color,
      rgba(128,128,128,0.3)
    );
    border-radius: 9px;
    padding: 11px 12px;
    outline: none;
    color: var(--text-primary, inherit);
    background: var(--input-bg, transparent);
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
    transition: 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    border-color: var(
      --primary-color,
      #15803d
    );

    box-shadow:
      0 0 0 3px
      var(
        --primary-light,
        rgba(21,128,61,0.12)
      );
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: var(--text-secondary, inherit);
    opacity: 0.7;
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-group select option {
    background: var(--card-bg, #ffffff);
    color: var(--text-primary, #111827);
  }

  .product-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 18px;
    padding: 13px;
    background: var(
      --secondary-bg,
      rgba(128,128,128,0.06)
    );
    border: 1px solid var(
      --border-color,
      rgba(128,128,128,0.2)
    );
    border-radius: 10px;
  }

  .product-info div {
    padding: 5px;
  }

  .product-info span,
  .product-info strong {
    display: block;
  }

  .product-info span {
    color: var(--text-secondary, inherit);
    font-size: 11px;
    margin-bottom: 3px;
  }

  .product-info strong {
    color: var(--text-primary, inherit);
    font-size: 13px;
  }

  .calculation-box {
    margin-bottom: 16px;
    padding: 16px;
    border-radius: 10px;
    background: var(
      --primary-light,
      rgba(21,128,61,0.10)
    );
    border: 1px solid var(
      --primary-border,
      rgba(21,128,61,0.25)
    );
  }

  .calculation-box div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .calculation-box span {
    color: var(--primary-color, #15803d);
    font-size: 14px;
    font-weight: 600;
  }

  .calculation-box strong {
    color: var(--primary-color, #15803d);
    font-size: 22px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 5px;
  }

  .cancel-btn,
  .save-btn {
    min-width: 120px;
    border: none;
    padding: 11px 18px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
  }

  .cancel-btn {
    background: var(
      --secondary-bg,
      rgba(128,128,128,0.12)
    );
    color: var(--text-primary, inherit);
  }

  .save-btn {
    background: var(
      --primary-color,
      #15803d
    );
    color: var(
      --button-text,
      #ffffff
    );
  }

  .save-btn:hover {
    opacity: 0.9;
  }

  .save-btn:disabled,
  .cancel-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 900px) {

    .purchase-page {
      padding: 18px;
    }

    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .summary-card:last-child {
      grid-column: 1 / -1;
    }

  }

  @media (max-width: 700px) {

    .purchase-page {
      padding: 12px;
    }

    .purchase-header {
      flex-direction: column;
      align-items: stretch;
    }

    .purchase-header h1 {
      font-size: 23px;
    }

    .add-purchase-btn {
      width: 100%;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .summary-card:last-child {
      grid-column: auto;
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .product-info {
      grid-template-columns: 1fr;
    }

    .modal-overlay {
      padding: 8px;
    }

    .purchase-modal {
      padding: 18px;
      border-radius: 13px;
      max-height: 96vh;
    }

    .modal-actions {
      flex-direction: column-reverse;
    }

    .cancel-btn,
    .save-btn {
      width: 100%;
    }

  }

  @media (max-width: 420px) {

    .purchase-page {
      padding: 9px;
    }

    .purchase-header h1 {
      font-size: 21px;
    }

    .summary-card {
      padding: 14px;
    }

    .summary-card strong {
      font-size: 18px;
    }

    .purchase-modal {
      padding: 15px;
    }

    .modal-header h2 {
      font-size: 19px;
    }

    .calculation-box strong {
      font-size: 19px;
    }

  }

`}</style>

    </div>
  );
};

export default Purchase;