import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaReceipt,
  FaMoneyBillWave,
  FaClock,
  FaTrash,
  FaShoppingCart,
  FaEye,
  FaTimes,
  FaUser,
  FaTag,
  FaBoxOpen,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { salesAPI, categoryAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

// ======================================================
// Pure Utility Helpers (Pure functions outside component scope)
// ======================================================

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatTime = (date) => {
  if (!date) return "-";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(parsedDate);
};

// ======================================================
// Memoized Sub-Components for UI Performance
// ======================================================

const FilterCard = React.memo(
  ({
    fromDate,
    toDate,
    categoryId,
    paymentStatus,
    categories,
    setFromDate,
    setToDate,
    setCategoryId,
    setPaymentStatus,
    resetFilter,
  }) => (
    <div className="sales-filter-card">
      <div className="filter-title">
        <FaFilter />
        <span>Sales Filter</span>
      </div>
      <div className="sales-filters">
        <div className="sales-filter-group">
          <label>
            <FaCalendarAlt /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="sales-filter-group">
          <label>
            <FaCalendarAlt /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="sales-filter-group">
          <label>
            <FaShoppingCart /> Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">সব Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sales-filter-group">
          <label>
            <FaMoneyBillWave /> Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="">All Sales</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
          </select>
        </div>
        <button
          type="button"
          className="reset-filter-btn"
          onClick={resetFilter}
        >
          Reset Filter
        </button>
      </div>
    </div>
  )
);

const SummaryCard = React.memo(({ icon: Icon, title, value }) => (
  <div className="sales-summary-card">
    <div className="sales-summary-icon">
      <Icon />
    </div>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  </div>
));

const InvoiceModal = React.memo(({ selectedSale, closeDetails }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeDetails();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDetails]);

  if (!selectedSale) return null;

  const items = Array.isArray(selectedSale.items) ? selectedSale.items : [];

  return (
    <div className="invoice-modal-overlay" onClick={closeDetails}>
      <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-modal-header">
          <div>
            <div className="invoice-modal-title">
              <FaReceipt />
              <h2>Invoice Summary</h2>
            </div>
            <span className="invoice-modal-number">
              Invoice: <strong>{selectedSale.invoiceNo || "-"}</strong>
            </span>
          </div>
          <button
            type="button"
            className="invoice-close-btn"
            onClick={closeDetails}
          >
            <FaTimes />
          </button>
        </div>

        <div className="invoice-info-grid">
          <div className="invoice-info-item">
            <span>
              <FaUser /> Customer
            </span>
            <strong>
              {selectedSale.customerName?.trim() || "Walk-in Customer"}
            </strong>
          </div>
          <div className="invoice-info-item">
            <span>
              <FaCalendarAlt /> Date
            </span>
            <strong>{formatDate(selectedSale.saleDate)}</strong>
          </div>
          <div className="invoice-info-item">
            <span>
              <FaClock /> Time
            </span>
            <strong>{formatTime(selectedSale.saleDate)}</strong>
          </div>
          <div className="invoice-info-item">
            <span>
              <FaMoneyBillWave /> Payment
            </span>
            <strong>{selectedSale.paymentMethod || "-"}</strong>
          </div>
        </div>

        <div className="invoice-products-section">
          <div className="invoice-section-title">
            <FaShoppingCart />
            <span>Invoice Products</span>
          </div>
          <div className="invoice-products-table-wrapper">
            <table className="invoice-products-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Selling Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const isPoultry = item.unit === "কেজি + পিস";
                  return (
                    <tr key={item.productId || index}>
                      <td>
                        <span className="product-number">{index + 1}</span>
                      </td>
                      <td>
                        <strong className="invoice-product-name">
                          {item.productName || "-"}
                        </strong>
                      </td>
                      <td>{item.categoryName || "-"}</td>
                      <td>
                        {isPoultry ? (
                          <div className="invoice-quantity">
                            <strong>{item.pieces ?? 0} pcs</strong>
                            <small>{item.weight ?? 0} kg</small>
                          </div>
                        ) : (
                          <div className="invoice-quantity">
                            <strong>{item.quantity ?? 0}</strong>
                            <small>{item.unit || ""}</small>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>৳ {formatMoney(item.sellingPrice)}</strong>
                        {isPoultry && (
                          <small className="price-unit">/ kg</small>
                        )}
                      </td>
                      <td>
                        <strong className="product-total">
                          ৳ {formatMoney(item.totalAmount)}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="invoice-bottom-section">
          {selectedSale.notes && (
            <div className="invoice-notes">
              <strong>Notes</strong>
              <p>{selectedSale.notes}</p>
            </div>
          )}

          <div className="invoice-amount-summary">
            <div className="amount-row">
              <span>Subtotal</span>
              <strong>৳ {formatMoney(selectedSale.subtotal)}</strong>
            </div>
            <div className="amount-row discount-row">
              <span>
                <FaTag /> Discount
              </span>
              <strong>- ৳ {formatMoney(selectedSale.discount)}</strong>
            </div>
            <div className="amount-row total-row">
              <span>Net Total</span>
              <strong>৳ {formatMoney(selectedSale.totalAmount)}</strong>
            </div>
            <div className="amount-row paid-row">
              <span>Paid</span>
              <strong>৳ {formatMoney(selectedSale.paidAmount)}</strong>
            </div>
            <div
              className={`amount-row due-row ${
                Number(selectedSale.dueAmount || 0) > 0 ? "has-due" : "no-due"
              }`}
            >
              <span>Due</span>
              <strong>৳ {formatMoney(selectedSale.dueAmount)}</strong>
            </div>
          </div>
        </div>

        <div className="invoice-modal-footer">
          <span>Thank you for your purchase</span>
          <button type="button" onClick={closeDetails}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

// ======================================================
// Main Sales Component
// ======================================================

const Sales = () => {
  const { can } = usePermission();
  const canDeleteSale = can(PERMISSIONS.SALES_DELETE);

  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  // Fetch initial data
  useEffect(() => {
    let isCancelled = false;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [salesResponse, categoryResponse] = await Promise.all([
          salesAPI.getAll(),
          categoryAPI.getAll(),
        ]);

        if (!isCancelled) {
          setSales(salesResponse?.data || []);
          setCategories(categoryResponse?.data || []);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Load Sales Page Error:", error);
          toast.error(error.message || "Sales data load করা যায়নি");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchInitialData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter Sales calculation
  const filteredSales = useMemo(() => {
    const startDate = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const endDate = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return sales.filter((sale) => {
      if (!sale.saleDate) return false;
      const saleTime = new Date(sale.saleDate).getTime();
      if (Number.isNaN(saleTime)) return false;

      if (startDate && saleTime < startDate) return false;
      if (endDate && saleTime > endDate) return false;

      if (categoryId) {
        const saleItems = Array.isArray(sale.items) ? sale.items : [];
        const hasCategory = saleItems.some((item) => {
          const itemCatId = item.categoryId?._id || item.categoryId;
          return String(itemCatId) === String(categoryId);
        });
        if (!hasCategory) return false;
      }

      const dueAmount = Number(sale.dueAmount) || 0;
      if (paymentStatus === "paid" && dueAmount > 0) return false;
      if (paymentStatus === "due" && dueAmount <= 0) return false;

      return true;
    });
  }, [sales, fromDate, toDate, categoryId, paymentStatus]);

  // Summary aggregation
  const summary = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        acc.totalSales += Number(sale.totalAmount) || 0;
        acc.totalPaid += Number(sale.paidAmount) || 0;
        acc.totalDue += Number(sale.dueAmount) || 0;
        acc.transactions += 1;
        return acc;
      },
      { totalSales: 0, totalPaid: 0, totalDue: 0, transactions: 0 }
    );
  }, [filteredSales]);

  // Handlers
  const resetFilter = useCallback(() => {
    setFromDate("");
    setToDate("");
    setCategoryId("");
    setPaymentStatus("");
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (!canDeleteSale) {
        toast.error("আপনার Sale delete করার permission নেই");
        return;
      }

      if (!window.confirm("এই Sale delete করতে চান?")) return;

      try {
        await salesAPI.delete(id);
        setSales((prevSales) => prevSales.filter((sale) => sale._id !== id));
        setSelectedSale((prev) => (prev?._id === id ? null : prev));
        toast.success("Sale delete হয়েছে");
      } catch (error) {
        console.error("Delete Sale Error:", error);
        toast.error(error.message || "Sale delete করা যায়নি");
      }
    },
    [canDeleteSale]
  );

  const handleDetails = useCallback((sale) => setSelectedSale(sale), []);
  const closeDetails = useCallback(() => setSelectedSale(null), []);

  if (loading) {
    return (
      <div className="sales-page">
        <div className="sales-loading">
          <div className="sales-loader" />
          <p>Sales data loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div>
          <h1>Sales Management</h1>
          <p>সকল বিক্রয়ের সম্পূর্ণ হিসাব ও Sales History</p>
        </div>
      </div>

      <FilterCard
        fromDate={fromDate}
        toDate={toDate}
        categoryId={categoryId}
        paymentStatus={paymentStatus}
        categories={categories}
        setFromDate={setFromDate}
        setToDate={setToDate}
        setCategoryId={setCategoryId}
        setPaymentStatus={setPaymentStatus}
        resetFilter={resetFilter}
      />

      <div className="sales-summary">
        <SummaryCard
          icon={FaReceipt}
          title="Total Sales"
          value={`৳ ${formatMoney(summary.totalSales)}`}
        />
        <SummaryCard
          icon={FaMoneyBillWave}
          title="Total Paid"
          value={`৳ ${formatMoney(summary.totalPaid)}`}
        />
        <SummaryCard
          icon={FaMoneyBillWave}
          title="Total Due"
          value={`৳ ${formatMoney(summary.totalDue)}`}
        />
        <SummaryCard
          icon={FaShoppingCart}
          title="Transactions"
          value={summary.transactions}
        />
      </div>

      <div className="sales-result-info">
        <span>
          Showing <strong>{filteredSales.length}</strong> sale(s)
        </span>
        {(fromDate || toDate || categoryId || paymentStatus) && (
          <span className="filter-active">Filter Active</span>
        )}
      </div>

      <div className="sales-table-wrapper">
        {filteredSales.length === 0 ? (
          <div className="sales-empty">
            <FaReceipt />
            <h3>কোনো Sale পাওয়া যায়নি</h3>
            <p>আপনার selected filter অনুযায়ী কোনো বিক্রয় পাওয়া যায়নি।</p>
          </div>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const items = Array.isArray(sale.items) ? sale.items : [];
                return (
                  <tr key={sale._id}>
                    <td>
                      <div className="date-cell">
                        <FaCalendarAlt />
                        <span>{formatDate(sale.saleDate)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="time-cell">
                        <FaClock />
                        <span>{formatTime(sale.saleDate)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="invoice-badge">
                        <FaReceipt />
                        {sale.invoiceNo || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <FaUser />
                        <strong>
                          {sale.customerName?.trim() || "Walk-in Customer"}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <div className="products-count-cell">
                        <FaBoxOpen />
                        <strong>{items.length}</strong>
                        <span>Product{items.length !== 1 ? "s" : ""}</span>
                      </div>
                    </td>
                    <td>
                      <strong>৳ {formatMoney(sale.totalAmount)}</strong>
                    </td>
                    <td>৳ {formatMoney(sale.paidAmount)}</td>
                    <td>
                      <span
                        className={
                          Number(sale.dueAmount || 0) > 0
                            ? "sale-due-badge"
                            : "sale-paid-badge"
                        }
                      >
                        ৳ {formatMoney(sale.dueAmount)}
                      </span>
                    </td>
                    <td>
                      <span className="payment-badge">
                        {sale.paymentMethod || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="sale-action-buttons">
                        <button
                          type="button"
                          className="sale-details-btn"
                          title="Invoice Details"
                          onClick={() => handleDetails(sale)}
                        >
                          <FaEye />
                          <span>Details</span>
                        </button>
                        {canDeleteSale && (
                          <button
                            type="button"
                            className="sale-delete-btn"
                            title="Delete Sale"
                            onClick={() => handleDelete(sale._id)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="sales-table-total">
        <span>Total Sale Amount</span>
        <strong>৳ {formatMoney(summary.totalSales)}</strong>
      </div>

      <InvoiceModal selectedSale={selectedSale} closeDetails={closeDetails} />

      <style>{`
        .sales-page { width: 100%; min-height: 100vh; padding: 24px; box-sizing: border-box; background: var(--bg-primary, inherit); color: var(--text-primary, inherit); }
        .sales-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .sales-header h1 { margin: 0 0 6px; font-size: 28px; font-weight: 700; color: var(--text-primary, inherit); }
        .sales-header p { margin: 0; font-size: 14px; color: var(--text-secondary, inherit); }
        .sales-filter-card { margin-bottom: 20px; padding: 18px; border-radius: 14px; background: var(--card-bg, transparent); border: 1px solid var(--border-color, rgba(128,128,128,0.25)); box-shadow: var(--card-shadow, none); }
        .filter-title { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; font-size: 15px; font-weight: 700; color: var(--text-primary, inherit); }
        .filter-title svg { color: var(--primary-color, #15803d); }
        .sales-filters { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 14px; align-items: end; }
        .sales-filter-group { width: 100%; }
        .sales-filter-group label { display: flex; align-items: center; gap: 6px; margin-bottom: 7px; font-size: 13px; font-weight: 600; color: var(--text-primary, inherit); }
        .sales-filter-group label svg { color: var(--primary-color, #15803d); }
        .sales-filter-group input, .sales-filter-group select { width: 100%; height: 44px; padding: 0 12px; box-sizing: border-box; border-radius: 9px; border: 1px solid var(--border-color, rgba(128,128,128,0.3)); outline: none; background: var(--input-bg, transparent); color: var(--text-primary, inherit); font-family: inherit; font-size: 14px; }
        .sales-filter-group input:focus, .sales-filter-group select:focus { border-color: var(--primary-color, #15803d); box-shadow: 0 0 0 3px var(--primary-light, rgba(21,128,61,0.12)); }
        .sales-filter-group select option { background: var(--card-bg, #ffffff); color: var(--text-primary, #111827); }
        .reset-filter-btn { height: 44px; padding: 0 18px; border: none; border-radius: 9px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; background: var(--secondary-bg, rgba(128,128,128,0.12)); color: var(--text-primary, inherit); white-space: nowrap; transition: 0.2s; }
        .reset-filter-btn:hover { opacity: 0.8; }
        .sales-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 18px; }
        .sales-summary-card { display: flex; align-items: center; gap: 13px; padding: 18px; border-radius: 14px; background: var(--card-bg, transparent); border: 1px solid var(--border-color, rgba(128,128,128,0.25)); box-shadow: var(--card-shadow, none); }
        .sales-summary-icon { width: 46px; height: 46px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 11px; background: var(--primary-light, rgba(21,128,61,0.12)); color: var(--primary-color, #15803d); font-size: 18px; }
        .sales-summary-card span { display: block; margin-bottom: 4px; font-size: 12px; color: var(--text-secondary, inherit); }
        .sales-summary-card strong { display: block; font-size: 19px; color: var(--text-primary, inherit); }
        .sales-result-info { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; font-size: 13px; color: var(--text-secondary, inherit); }
        .filter-active { padding: 5px 9px; border-radius: 7px; background: var(--primary-light, rgba(21,128,61,0.12)); color: var(--primary-color, #15803d); font-weight: 600; }
        .sales-table-wrapper { width: 100%; overflow-x: auto; border-radius: 14px; border: 1px solid var(--border-color, rgba(128,128,128,0.25)); background: var(--card-bg, transparent); box-shadow: var(--card-shadow, none); }
        .sales-table { width: 100%; min-width: 1150px; border-collapse: collapse; }
        .sales-table th { padding: 14px; text-align: left; white-space: nowrap; font-size: 12px; font-weight: 700; color: var(--text-secondary, inherit); background: var(--table-header-bg, rgba(128,128,128,0.08)); }
        .sales-table td { padding: 14px; border-top: 1px solid var(--border-color, rgba(128,128,128,0.15)); font-size: 13px; color: var(--text-primary, inherit); vertical-align: middle; white-space: nowrap; }
        .sales-table tbody tr { transition: 0.15s; }
        .sales-table tbody tr:hover { background: var(--hover-bg, rgba(128,128,128,0.04)); }
        .sales-table td strong { display: block; color: var(--text-primary, inherit); }
        .sales-table td small { display: block; margin-top: 3px; font-size: 11px; color: var(--text-secondary, inherit); }
        .date-cell, .time-cell, .customer-cell { display: flex; align-items: center; gap: 7px; }
        .date-cell svg, .customer-cell svg { color: var(--primary-color, #15803d); flex-shrink: 0; }
        .time-cell svg { color: var(--text-secondary, #6b7280); }
        .products-count-cell { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 8px; background: var(--primary-light, rgba(21,128,61,0.1)); color: var(--primary-color, #15803d); font-size: 12px; }
        .products-count-cell span { color: var(--text-secondary, inherit); }
        .invoice-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 7px; background: var(--secondary-bg, rgba(128,128,128,0.1)); color: var(--text-primary, inherit); font-size: 12px; font-weight: 600; }
        .payment-badge { display: inline-block; padding: 6px 9px; border-radius: 7px; background: var(--primary-light, rgba(21,128,61,0.1)); color: var(--primary-color, #15803d); font-size: 11px; font-weight: 600; }
        .sale-due-badge, .sale-paid-badge { display: inline-block; padding: 6px 9px; border-radius: 7px; font-size: 12px; font-weight: 700; }
        .sale-due-badge { color: var(--danger-color, #dc2626); background: var(--danger-light, rgba(220,38,38,0.12)); }
        .sale-paid-badge { color: var(--success-color, #16a34a); background: var(--success-light, rgba(22,163,74,0.12)); }
        .sale-action-buttons { display: flex; align-items: center; gap: 7px; }
        .sale-details-btn { height: 35px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 11px; border: none; border-radius: 8px; cursor: pointer; background: var(--primary-light, rgba(21,128,61,0.12)); color: var(--primary-color, #15803d); font-family: inherit; font-size: 12px; font-weight: 700; transition: 0.2s; }
        .sale-details-btn:hover { opacity: 0.75; }
        .sale-delete-btn { width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 8px; cursor: pointer; background: var(--danger-light, rgba(220,38,38,0.12)); color: var(--danger-color, #dc2626); transition: 0.2s; }
        .sale-delete-btn:hover { opacity: 0.75; }
        .sales-loading { min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-secondary, inherit); }
        .sales-loader { width: 30px; height: 30px; border: 3px solid var(--border-color, rgba(128,128,128,0.2)); border-top-color: var(--primary-color, #15803d); border-radius: 50%; animation: sales-spin 0.8s linear infinite; }
        @keyframes sales-spin { to { transform: rotate(360deg); } }
        .sales-empty { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; color: var(--text-secondary, inherit); }
        .sales-empty > svg { font-size: 38px; margin-bottom: 12px; color: var(--primary-color, #15803d); }
        .sales-empty h3 { margin: 0 0 6px; color: var(--text-primary, inherit); }
        .sales-empty p { margin: 0; font-size: 13px; }
        .invoice-modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; background: rgba(0, 0, 0, 0.58); backdrop-filter: blur(3px); }
        .invoice-modal { width: min(100%, 950px); max-height: 92vh; overflow-y: auto; border-radius: 18px; background: var(--card-bg, #ffffff); color: var(--text-primary, #111827); box-shadow: 0 25px 70px rgba(0,0,0,0.25); }
        .invoice-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; padding: 22px 24px; border-bottom: 1px solid var(--border-color, rgba(128,128,128,0.2)); }
        .invoice-modal-title { display: flex; align-items: center; gap: 10px; }
        .invoice-modal-title svg { font-size: 21px; color: var(--primary-color, #15803d); }
        .invoice-modal-title h2 { margin: 0; font-size: 21px; }
        .invoice-modal-number { display: block; margin-top: 6px; font-size: 12px; color: var(--text-secondary, #6b7280); }
        .invoice-modal-number strong { color: var(--text-primary, #111827); }
        .invoice-close-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 9px; cursor: pointer; background: var(--secondary-bg, rgba(128,128,128,0.1)); color: var(--text-secondary, #6b7280); font-size: 16px; transition: 0.2s; }
        .invoice-close-btn:hover { background: var(--danger-light, rgba(220,38,38,0.12)); color: var(--danger-color, #dc2626); }
        .invoice-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 24px; }
        .invoice-info-item { padding: 12px; border-radius: 10px; background: var(--secondary-bg, rgba(128,128,128,0.06)); }
        .invoice-info-item span { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 11px; color: var(--text-secondary, #6b7280); }
        .invoice-info-item span svg { color: var(--primary-color, #15803d); }
        .invoice-info-item strong { display: block; font-size: 13px; }
        .invoice-products-section { padding: 0 24px 18px; }
        .invoice-section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 14px; font-weight: 700; }
        .invoice-section-title svg { color: var(--primary-color, #15803d); }
        .invoice-products-table-wrapper { width: 100%; overflow-x: auto; border-radius: 10px; border: 1px solid var(--border-color, rgba(128,128,128,0.2)); }
        .invoice-products-table { width: 100%; min-width: 700px; border-collapse: collapse; }
        .invoice-products-table th { padding: 11px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary, #6b7280); background: var(--table-header-bg, rgba(128,128,128,0.07)); white-space: nowrap; }
        .invoice-products-table td { padding: 11px; border-top: 1px solid var(--border-color, rgba(128,128,128,0.13)); font-size: 12px; vertical-align: middle; white-space: nowrap; }
        .product-number { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; background: var(--primary-light, rgba(21,128,61,0.1)); color: var(--primary-color, #15803d); font-size: 11px; font-weight: 700; }
        .invoice-product-name { font-size: 13px; }
        .invoice-quantity strong { display: block; font-size: 12px; }
        .invoice-quantity small { display: block; margin-top: 2px; color: var(--text-secondary, #6b7280); font-size: 10px; }
        .price-unit { margin-left: 3px; color: var(--text-secondary, #6b7280); font-size: 10px; }
        .product-total { color: var(--primary-color, #15803d); }
        .invoice-bottom-section { display: grid; grid-template-columns: 1fr 360px; gap: 30px; padding: 18px 24px; border-top: 1px solid var(--border-color, rgba(128,128,128,0.18)); }
        .invoice-notes { padding: 13px; border-radius: 10px; background: var(--secondary-bg, rgba(128,128,128,0.06)); align-self: start; }
        .invoice-notes strong { display: block; margin-bottom: 6px; font-size: 12px; }
        .invoice-notes p { margin: 0; font-size: 12px; line-height: 1.5; color: var(--text-secondary, #6b7280); }
        .invoice-amount-summary { width: 100%; }
        .amount-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 8px 0; font-size: 13px; }
        .amount-row span { color: var(--text-secondary, #6b7280); }
        .amount-row strong { color: var(--text-primary, #111827); }
        .discount-row span { display: flex; align-items: center; gap: 6px; }
        .discount-row span svg { color: var(--danger-color, #dc2626); }
        .discount-row strong { color: var(--danger-color, #dc2626); }
        .total-row { margin-top: 5px; padding: 13px 0; border-top: 1px solid var(--border-color, rgba(128,128,128,0.18)); border-bottom: 1px solid var(--border-color, rgba(128,128,128,0.18)); font-size: 15px; }
        .total-row span, .total-row strong { color: var(--primary-color, #15803d); font-weight: 800; }
        .paid-row strong { color: var(--success-color, #16a34a); }
        .due-row { margin-top: 3px; padding: 10px; border-radius: 8px; font-weight: 700; }
        .due-row.has-due { background: var(--danger-light, rgba(220,38,38,0.1)); }
        .due-row.has-due span, .due-row.has-due strong { color: var(--danger-color, #dc2626); }
        .due-row.no-due { background: var(--success-light, rgba(22,163,74,0.1)); }
        .due-row.no-due span, .due-row.no-due strong { color: var(--success-color, #16a34a); }
        .invoice-modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 15px 24px; border-top: 1px solid var(--border-color, rgba(128,128,128,0.18)); font-size: 11px; color: var(--text-secondary, #6b7280); }
        .invoice-modal-footer button { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; background: var(--primary-color, #15803d); color: #ffffff; font-family: inherit; font-size: 12px; font-weight: 600; }
        .sales-table-total { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 12px; padding: 16px 20px; border: 1px solid var(--border-color, rgba(128,128,128,0.18)); border-radius: 12px; background: var(--card-background, rgba(21,128,61,0.06)); font-size: 15px; font-weight: 700; }
        .sales-table-total strong { color: var(--primary-color, #15803d); font-size: 18px; font-weight: 800; }

        @media (max-width: 1100px) {
          .sales-summary { grid-template-columns: repeat(2, 1fr); }
          .sales-filters { grid-template-columns: repeat(2, 1fr); }
          .reset-filter-btn { width: 100%; }
          .invoice-info-grid { grid-template-columns: repeat(2, 1fr); }
          .invoice-bottom-section { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .sales-page { padding: 14px; }
          .sales-header h1 { font-size: 23px; }
          .sales-summary, .sales-filters { grid-template-columns: 1fr; }
          .sales-result-info { align-items: flex-start; flex-direction: column; }
          .invoice-modal-overlay { padding: 8px; }
          .invoice-modal-header, .invoice-bottom-section, .invoice-modal-footer { padding: 17px; }
          .invoice-info-grid { grid-template-columns: 1fr; padding: 14px 17px; }
          .invoice-products-section { padding: 0 17px 17px; }
        }
        @media (max-width: 420px) {
          .sales-page { padding: 9px; }
          .sales-header h1 { font-size: 21px; }
          .sales-summary-card { padding: 14px; }
          .sales-summary-card strong { font-size: 17px; }
          .sale-details-btn span { display: none; }
          .sale-details-btn { width: 35px; padding: 0; }
        }
      `}</style>
    </div>
  );
};

export default Sales;