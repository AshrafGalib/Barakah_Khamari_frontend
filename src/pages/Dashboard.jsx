import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaWallet,
  FaShoppingCart,
  FaUsers,
  FaDrumstickBite,
  FaCashRegister,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaCheck,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { toast } from "react-toastify";

import { dashboardAPI, cashBalanceAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

const Dashboard = () => {
  // ======================================================
  // Permissions & States
  // ======================================================
  const { can } = usePermission();
  const canViewDashboard = can(PERMISSIONS.DASHBOARD_VIEW);

  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Opening Balance States
  const [openingBalanceChecked, setOpeningBalanceChecked] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingBalanceSubmitting, setOpeningBalanceSubmitting] = useState(false);

  // ======================================================
  // Load Opening Balance Status
  // ======================================================
  useEffect(() => {
    let cancelled = false;

    const checkOpeningBalance = async () => {
      try {
        const response = await cashBalanceAPI.checkOpeningBalance();
        if (cancelled) return;

        const statusData = response?.data || {};
        const needsOpeningBalance = Boolean(statusData.needsOpeningBalance);

        setOpeningBalanceChecked(true);
        setShowOpeningBalanceModal(needsOpeningBalance);
      } catch (err) {
        if (cancelled) return;
        console.error("Opening Balance Status Error:", err);
        setOpeningBalanceChecked(true);
        setShowOpeningBalanceModal(false);
        toast.error(err?.message || "Opening Balance status check করা যায়নি");
      }
    };

    checkOpeningBalance();
    return () => {
      cancelled = true;
    };
  }, []);

  // ======================================================
  // Dashboard Loader (setState moved inside Async Execution)
  // ======================================================
  const loadDashboard = useCallback(async (selectedFilter, cancelledRef) => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getDashboard(selectedFilter);
      if (cancelledRef.current) return;

      setDashboard(response?.data || null);
      setError("");
    } catch (err) {
      if (cancelledRef.current) return;
      console.error("Dashboard Load Error:", err);
      const message = err?.message || "ড্যাশবোর্ডের তথ্য লোড করা যায়নি";
      setError(message);
      toast.error(message);
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Pure Effect (No Synchronous setState inside effect body)
  useEffect(() => {
    if (!canViewDashboard) return;

    const cancelledRef = { current: false };
    loadDashboard(filter, cancelledRef);

    return () => {
      cancelledRef.current = true;
    };
  }, [filter, canViewDashboard, loadDashboard]);

  // ======================================================
  // Submit Opening Balance
  // ======================================================
  const handleOpeningBalanceSubmit = async (event) => {
    event.preventDefault();
    if (openingBalanceSubmitting) return;

    const amount = Number(openingBalance);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("সঠিক Opening Balance লিখুন");
      return;
    }

    try {
      setOpeningBalanceSubmitting(true);
      const response = await cashBalanceAPI.setOpeningBalance(amount);

      if (response && response.success === false) {
        throw new Error(response.message || "Opening Balance save করা যায়নি");
      }

      toast.success("আজকের Opening Balance সফলভাবে সেট হয়েছে");
      setShowOpeningBalanceModal(false);
      setOpeningBalanceChecked(true);
      setOpeningBalance("");

      const cancelledRef = { current: false };
      await loadDashboard(filter, cancelledRef);
    } catch (err) {
      console.error("Set Opening Balance Error:", err);
      toast.error(err?.message || "Opening Balance সেট করা যায়নি");
    } finally {
      setOpeningBalanceSubmitting(false);
    }
  };

  // ======================================================
  // Helper Functions
  // ======================================================
  const formatCurrency = useCallback((value) => {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const number = useCallback((value) => {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }, []);

  const formatDate = useCallback((value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString("bn-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }, []);

  const filterLabel = useMemo(
    () => ({
      today: "আজ",
      yesterday: "গতকাল",
      previous2: "গত ২ দিন",
      previous7: "গত ৭ দিন",
      previous30: "গত ৩০ দিন",
    }),
    []
  );

  // ======================================================
  // Computed Data
  // ======================================================
  const data = dashboard || {};
  const totalSales = number(data.totalSales);
  const totalCashSales = number(data.totalCashSales ?? data.totalPaid);
  const totalInvoiceDue = number(data.totalInvoiceDue);
  const totalPurchase = number(data.totalPurchase);
  const totalPurchasePaid = number(data.totalPurchasePaid);
  const totalExpense = number(data.totalExpense);
  const openingBalanceValue = number(data.openingBalance);

  const cashIn = number(data.cashIn ?? totalCashSales);
  const cashOut = number(data.cashOut ?? totalPurchasePaid + totalExpense);
  const netCashFlow = number(data.netCashFlow ?? cashIn - cashOut);
  const closingCash = number(data.closingCash ?? openingBalanceValue + netCashFlow);
  const currentCashBalance = number(data.currentCashBalance ?? closingCash);

  const totalChickenPieces = number(data.totalChickenPieces);
  const totalChickenWeight = number(data.totalChickenWeight);
  const totalCustomers = number(data.totalCustomers);
  const totalCustomerDue = number(data.totalCustomerDue);

  const chickenStock = Array.isArray(data.chickenStock) ? data.chickenStock : [];
  const recentSales = Array.isArray(data.recentSales) ? data.recentSales : [];
  const recentPurchases = Array.isArray(data.recentPurchases) ? data.recentPurchases : [];
  const recentExpenses = Array.isArray(data.recentExpenses) ? data.recentExpenses : [];

  const chartData = useMemo(() => {
    const salesLast30Days = Array.isArray(data.salesLast30Days) ? data.salesLast30Days : [];
    return salesLast30Days.map((item) => ({
      date: item.date || item._id || "",
      sales: number(item.sales ?? item.totalSales ?? item.amount),
    }));
  }, [data.salesLast30Days, number]);

  // ======================================================
  // Conditional UI Elements (Error / Loading)
  // ======================================================
  if (!canViewDashboard) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <FaExclamationTriangle />
          <h2>Access Denied</h2>
          <p>আপনার Dashboard দেখার permission নেই।</p>
        </div>
        <DashboardStyles />
      </div>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />
          <p>ড্যাশবোর্ডের তথ্য লোড হচ্ছে...</p>
        </div>
        <DashboardStyles />
      </div>
    );
  }

  if (!dashboard && error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <FaExclamationTriangle />
          <h2>ড্যাশবোর্ড লোড করা যায়নি</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>আবার চেষ্টা করুন</button>
        </div>
        <DashboardStyles />
      </div>
    );
  }

  // ======================================================
  // Main Render UI
  // ======================================================
  return (
    <>
      <div className="dashboard-page">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>ড্যাশবোর্ড</h1>
            <p>আপনার দোকানের বর্তমান হিসাব ও সারাংশ</p>
          </div>

          <div className="dashboard-date-filter">
            <FaCalendarAlt />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="today">আজ</option>
              <option value="yesterday">গতকাল</option>
              <option value="previous2">গত ২ দিন</option>
              <option value="previous7">গত ৭ দিন</option>
              <option value="previous30">গত ৩০ দিন</option>
            </select>
          </div>
        </div>

        {/* Refresh Banner */}
        {loading && dashboard && (
          <div className="dashboard-refreshing">তথ্য আপডেট হচ্ছে...</div>
        )}

        {/* Period Info */}
        <div className="dashboard-period">
          <div>
            <strong>{filterLabel[filter] || "আজ"}</strong>
            {data.fromDate && (
              <span>
                {formatDate(data.fromDate)}
                {data.toDate && data.toDate !== data.fromDate && ` — ${formatDate(data.toDate)}`}
              </span>
            )}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="dashboard-card-icon sales-icon">
              <FaShoppingCart />
            </div>
            <div className="dashboard-card-content">
              <span>মোট বিক্রি</span>
              <strong>৳ {formatCurrency(totalSales)}</strong>
              <small>নগদ: ৳ {formatCurrency(totalCashSales)}</small>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon due-icon">
              <FaReceipt />
            </div>
            <div className="dashboard-card-content">
              <span>ইনভয়েস বাকি</span>
              <strong>৳ {formatCurrency(totalInvoiceDue)}</strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon expense-icon">
              <FaMoneyBillWave />
            </div>
            <div className="dashboard-card-content">
              <span>মোট খরচ</span>
              <strong>৳ {formatCurrency(totalExpense)}</strong>
              <small>Purchase paid: ৳ {formatCurrency(totalPurchasePaid)}</small>
            </div>
          </div>

          <div className="dashboard-card current-cash-card">
            <div className="dashboard-card-icon cash-icon">
              <FaWallet />
            </div>
            <div className="dashboard-card-content">
              <span>বর্তমান নগদ</span>
              <strong>৳ {formatCurrency(currentCashBalance)}</strong>
              <small>Closing cash</small>
            </div>
          </div>
        </div>

        {/* Daily Cash Register Section */}
        <div className="dashboard-section cash-summary-section">
          <div className="dashboard-section-header">
            <div>
              <h2>দৈনিক নগদ হিসাব</h2>
              <p>Opening → Cash In → Cash Out → Closing</p>
            </div>
            <FaCashRegister />
          </div>

          <div className="cash-summary-grid">
            <div className="cash-summary-card">
              <div className="cash-summary-icon opening-icon">
                <FaWallet />
              </div>
              <div>
                <span>Opening Balance</span>
                <strong>৳ {formatCurrency(openingBalanceValue)}</strong>
                <small>দিনের শুরু</small>
              </div>
            </div>

            <div className="cash-summary-card">
              <div className="cash-summary-icon income-icon">
                <FaArrowUp />
              </div>
              <div>
                <span>Cash In</span>
                <strong>৳ {formatCurrency(cashIn)}</strong>
                <small>নগদ বিক্রি + Due Payment</small>
              </div>
            </div>

            <div className="cash-summary-card">
              <div className="cash-summary-icon expense-small-icon">
                <FaArrowDown />
              </div>
              <div>
                <span>Cash Out</span>
                <strong>৳ {formatCurrency(cashOut)}</strong>
                <small>Purchase + Expense</small>
              </div>
            </div>

            <div className="cash-summary-card closing-card">
              <div className="cash-summary-icon closing-icon">
                <FaCashRegister />
              </div>
              <div>
                <span>Closing Balance</span>
                <strong>৳ {formatCurrency(closingCash)}</strong>
                <small>বর্তমান দিনের নগদ</small>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Analytics Section */}
        <div className="dashboard-section sales-chart-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Sales Last 30 Days</h2>
              <p>গত ৩০ দিনের দৈনিক বিক্রির হিসাব</p>
            </div>
            <div className="chart-header-icon">
              <FaChartLine />
            </div>
          </div>

          <div className="sales-chart">
            {chartData.length > 0 ? (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.18)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => (val ? String(val).slice(5) : "")}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `৳${val}`} />
                    <Tooltip
                      formatter={(val) => [`৳ ${formatCurrency(val)}`, "বিক্রি"]}
                      labelFormatter={(lbl) => `তারিখ: ${lbl}`}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border-color, rgba(128,128,128,.2))",
                        background: "var(--card-bg, #fff)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#15803d"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="dashboard-empty chart-empty">গত ৩০ দিনের কোনো বিক্রির তথ্য নেই</div>
            )}
          </div>
        </div>

        {/* Secondary Metric Cards */}
        <div className="dashboard-secondary">
          <div className="dashboard-secondary-card">
            <div className="dashboard-secondary-icon chicken-icon">
              <FaDrumstickBite />
            </div>
            <div>
              <span>মুরগি বিক্রি</span>
              <strong>{totalChickenPieces} পিস</strong>
              <small>{totalChickenWeight.toFixed(2)} কেজি</small>
            </div>
          </div>

          <div className="dashboard-secondary-card">
            <div className="dashboard-secondary-icon customer-icon">
              <FaUsers />
            </div>
            <div>
              <span>মোট ক্রেতা</span>
              <strong>{totalCustomers}</strong>
            </div>
          </div>

          <div className="dashboard-secondary-card">
            <div className="dashboard-secondary-icon due-secondary-icon">
              <FaReceipt />
            </div>
            <div>
              <span>ক্রেতার মোট বাকি</span>
              <strong>৳ {formatCurrency(totalCustomerDue)}</strong>
            </div>
          </div>

          <div className="dashboard-secondary-card">
            <div className="dashboard-secondary-icon purchase-icon">
              <FaMoneyBillWave />
            </div>
            <div>
              <span>মোট ক্রয়</span>
              <strong>৳ {formatCurrency(totalPurchase)}</strong>
              <small>Paid: ৳ {formatCurrency(totalPurchasePaid)}</small>
            </div>
          </div>
        </div>

        {/* Chicken Stock */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>মুরগির মজুদ</h2>
              <p>বর্তমানে দোকানে থাকা মুরগির stock</p>
            </div>
            <FaDrumstickBite />
          </div>

          {chickenStock.length > 0 ? (
            <div className="chicken-stock-grid">
              {chickenStock.map((product) => (
                <div className="chicken-stock-card" key={product._id || product.name}>
                  <div className="chicken-stock-icon">
                    <FaDrumstickBite />
                  </div>
                  <div>
                    <h3>{product.name || "মুরগি"}</h3>
                    <p>
                      সংখ্যা: <strong>{number(product.stockPieces)}</strong> পিস
                    </p>
                    <p>
                      ওজন: <strong>{number(product.totalWeight).toFixed(2)} কেজি</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">কোনো মুরগির stock নেই</div>
          )}
        </div>

        {/* Recent Lists Grid */}
        <div className="dashboard-recent-grid">
          {/* Sales */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>সাম্প্রতিক বিক্রি</h2>
                <p>সর্বশেষ বিক্রির তালিকা</p>
              </div>
              <FaShoppingCart />
            </div>
            <div className="dashboard-list">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div className="dashboard-list-item" key={sale._id}>
                    <div>
                      <strong>{sale.invoiceNo || "চালান"}</strong>
                      <span>{sale.customerName || "নগদ ক্রেতা"}</span>
                      {sale.saleDate && <small>{formatDate(sale.saleDate)}</small>}
                    </div>
                    <strong>৳ {formatCurrency(sale.totalAmount)}</strong>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">কোনো বিক্রির তথ্য নেই</div>
              )}
            </div>
          </div>

          {/* Purchases */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>সাম্প্রতিক ক্রয়</h2>
                <p>সর্বশেষ ক্রয়ের তালিকা</p>
              </div>
              <FaMoneyBillWave />
            </div>
            <div className="dashboard-list">
              {recentPurchases.length > 0 ? (
                recentPurchases.map((purchase) => (
                  <div className="dashboard-list-item" key={purchase._id}>
                    <div>
                      <strong>{purchase.invoiceNo || "ক্রয়"}</strong>
                      <span>{purchase.supplierName || "সরবরাহকারী"}</span>
                      {purchase.purchaseDate && <small>{formatDate(purchase.purchaseDate)}</small>}
                    </div>
                    <strong>৳ {formatCurrency(purchase.totalAmount)}</strong>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">কোনো ক্রয়ের তথ্য নেই</div>
              )}
            </div>
          </div>

          {/* Expenses */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>সাম্প্রতিক খরচ</h2>
                <p>সর্বশেষ expense-এর তালিকা</p>
              </div>
              <FaMoneyBillWave />
            </div>
            <div className="dashboard-list">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <div className="dashboard-list-item" key={expense._id}>
                    <div>
                      <strong>{expense.title || expense.category || "খরচ"}</strong>
                      <span>{expense.description || expense.category || "Expense"}</span>
                      {expense.expenseDate && <small>{formatDate(expense.expenseDate)}</small>}
                    </div>
                    <strong>৳ {formatCurrency(expense.amount)}</strong>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">কোনো খরচের তথ্য নেই</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Set Opening Balance */}
      {openingBalanceChecked && showOpeningBalanceModal && (
        <div className="opening-balance-overlay">
          <div className="opening-balance-modal">
            <div className="opening-balance-modal-header">
              <div className="opening-balance-modal-title">
                <div className="opening-balance-modal-icon">
                  <FaWallet />
                </div>
                <div>
                  <h2>Opening Balance সেট করুন</h2>
                  <p>আজকের দিনের শুরুতে দোকানের হাতে থাকা নগদ টাকা কত ছিল?</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleOpeningBalanceSubmit}>
              <div className="opening-balance-info">
                <FaCashRegister />
                <div>
                  <strong>আজকের Opening Balance</strong>
                  <span>এই টাকা থেকেই আজকের Cash Flow হিসাব শুরু হবে।</span>
                </div>
              </div>

              <label className="opening-balance-label">
                Opening Balance <span>৳</span>
              </label>

              <div className="opening-balance-input-wrapper">
                <span>৳</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  disabled={openingBalanceSubmitting}
                />
              </div>

              <p className="opening-balance-hint">
                উদাহরণ: আজ দোকান খোলার সময় হাতে ৳ ৫,০০০ থাকলে এখানে <strong> 5000 </strong> লিখুন।
              </p>

              <div className="opening-balance-actions">
                <button
                  type="submit"
                  className="opening-balance-submit"
                  disabled={openingBalanceSubmitting}
                >
                  {openingBalanceSubmitting ? (
                    <>
                      <span className="opening-balance-button-loader" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Opening Balance Save করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DashboardStyles />
    </>
  );
};

// CSS Styles
const DashboardStyles = () => (
  <style>{`
    .dashboard-page {
      width: 100%;
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
      background: var(--bg-primary, inherit);
      color: var(--text-primary, inherit);
    }
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 16px;
    }
    .dashboard-header h1 {
      margin: 0 0 5px;
      font-size: 28px;
      font-weight: 700;
    }
    .dashboard-header p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary, inherit);
    }
    .dashboard-date-filter {
      height: 44px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      border-radius: 9px;
      border: 1px solid var(--border-color, rgba(128,128,128,.25));
      background: var(--card-bg, #ffffff);
      color: var(--text-primary, #111827);
      box-sizing: border-box;
    }
    .dashboard-date-filter svg {
      color: var(--primary-color, #15803d);
      flex-shrink: 0;
    }
    .dashboard-date-filter select {
      height: 100%;
      min-width: 125px;
      border: none;
      outline: none;
      background-color: var(--card-bg, #ffffff);
      color: var(--text-primary, #111827);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .dashboard-period {
      margin-bottom: 18px;
      font-size: 12px;
      color: var(--text-secondary, inherit);
    }
    .dashboard-period strong {
      color: var(--primary-color, #15803d);
      margin-right: 8px;
    }
    .dashboard-period span {
      font-size: 11px;
    }
    .dashboard-refreshing {
      margin-bottom: 14px;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 12px;
      background: var(--primary-light, rgba(21,128,61,.08));
      color: var(--primary-color, #15803d);
      text-align: center;
    }
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 18px;
    }
    .dashboard-card {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 18px;
      border-radius: 14px;
      border: 1px solid var(--border-color, rgba(128,128,128,.25));
      background: var(--card-bg, transparent);
    }
    .dashboard-card-icon {
      width: 46px;
      height: 46px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 11px;
      font-size: 18px;
    }
    .sales-icon { background: rgba(21,128,61,.12); color: #15803d; }
    .due-icon { background: rgba(234,88,12,.12); color: #ea580c; }
    .expense-icon { background: rgba(220,38,38,.12); color: #dc2626; }
    .cash-icon { background: rgba(37,99,235,.12); color: #2563eb; }
    .dashboard-card-content { min-width: 0; }
    .dashboard-card span, .dashboard-secondary-card span, .cash-summary-card span {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: var(--text-secondary, inherit);
    }
    .dashboard-card strong { display: block; font-size: 19px; white-space: nowrap; }
    .dashboard-card small { display: block; margin-top: 4px; font-size: 10px; color: var(--text-secondary, inherit); }
    .current-cash-card { border-color: rgba(37,99,235,.25); }

    .dashboard-section {
      padding: 18px;
      margin-bottom: 18px;
      border-radius: 14px;
      border: 1px solid var(--border-color, rgba(128,128,128,.25));
      background: var(--card-bg, transparent);
      box-sizing: border-box;
    }
    .dashboard-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 16px;
    }
    .dashboard-section-header h2 { margin: 0 0 4px; font-size: 17px; }
    .dashboard-section-header p { margin: 0; font-size: 12px; color: var(--text-secondary, inherit); }
    .dashboard-section-header > svg { font-size: 22px; color: var(--primary-color, #15803d); }

    .cash-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 13px;
    }
    .cash-summary-card {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 15px;
      border-radius: 11px;
      background: var(--secondary-bg, rgba(128,128,128,.06));
    }
    .cash-summary-icon {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      font-size: 14px;
    }
    .opening-icon { background: rgba(37,99,235,.12); color: #2563eb; }
    .income-icon { background: rgba(21,128,61,.12); color: #15803d; }
    .expense-small-icon { background: rgba(220,38,38,.12); color: #dc2626; }
    .closing-icon { background: rgba(124,58,237,.12); color: #7c3aed; }
    .cash-summary-card strong { display: block; font-size: 17px; }
    .cash-summary-card small { display: block; margin-top: 4px; font-size: 11px; color: var(--text-secondary, inherit); }
    .closing-card { border: 1px solid rgba(21,128,61,.25); }

    .chart-header-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(21,128,61,.1);
      color: var(--primary-color, #15803d);
    }
    .sales-chart { width: 100%; min-height: 320px; }

    .dashboard-secondary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 18px;
    }
    .dashboard-secondary-card {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 13px;
      border: 1px solid var(--border-color, rgba(128,128,128,.25));
      background: var(--card-bg, transparent);
    }
    .dashboard-secondary-icon {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    }
    .chicken-icon { background: rgba(220,38,38,.12); color: #dc2626; }
    .customer-icon { background: rgba(37,99,235,.12); color: #2563eb; }
    .due-secondary-icon { background: rgba(234,88,12,.12); color: #ea580c; }
    .purchase-icon { background: rgba(124,58,237,.12); color: #7c3aed; }
    .dashboard-secondary-card strong { display: block; font-size: 16px; white-space: nowrap; }
    .dashboard-secondary-card small { display: block; margin-top: 3px; font-size: 11px; color: var(--text-secondary, inherit); }

    .chicken-stock-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 13px;
    }
    .chicken-stock-card {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 14px;
      border-radius: 11px;
      background: var(--secondary-bg, rgba(128,128,128,.06));
    }
    .chicken-stock-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      background: rgba(220,38,38,.12);
      color: #dc2626;
    }
    .chicken-stock-card h3 { margin: 0 0 5px; font-size: 14px; }
    .chicken-stock-card p { margin: 2px 0; font-size: 12px; color: var(--text-secondary, inherit); }

    .dashboard-recent-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .dashboard-recent-grid .dashboard-section { margin-bottom: 0; }
    .dashboard-list { display: flex; flex-direction: column; }
    .dashboard-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      padding: 13px 0;
      border-top: 1px solid var(--border-color, rgba(128,128,128,.15));
    }
    .dashboard-list-item:first-child { border-top: none; }
    .dashboard-list-item strong { display: block; font-size: 13px; }
    .dashboard-list-item span { display: block; margin-top: 3px; font-size: 11px; color: var(--text-secondary, inherit); }
    .dashboard-list-item small { display: block; margin-top: 2px; font-size: 10px; color: var(--text-secondary, inherit); }

    .dashboard-empty { padding: 35px 10px; text-align: center; font-size: 13px; color: var(--text-secondary, inherit); }
    .chart-empty { min-height: 250px; display: flex; align-items: center; justify-content: center; }

    .dashboard-loading, .dashboard-error {
      min-height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 10px;
    }
    .dashboard-loader {
      width: 34px;
      height: 34px;
      border: 3px solid rgba(128,128,128,.2);
      border-top-color: var(--primary-color,#15803d);
      border-radius: 50%;
      animation: dashboard-spin .8s linear infinite;
    }
    @keyframes dashboard-spin { to { transform: rotate(360deg); } }
    .dashboard-error svg { font-size: 35px; color: #dc2626; }
    .dashboard-error button {
      margin-top: 10px;
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      background: var(--primary-color,#15803d);
      color: white;
      cursor: pointer;
      font-weight: 600;
    }

    /* Modal Overlay */
    .opening-balance-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0,0,0,.58);
      backdrop-filter: blur(4px);
    }
    .opening-balance-modal {
      width: 100%;
      max-width: 500px;
      border-radius: 18px;
      background: var(--card-bg,#ffffff);
      color: var(--text-primary,#111827);
      border: 1px solid var(--border-color,rgba(128,128,128,.2));
      box-shadow: 0 25px 70px rgba(0,0,0,.25);
      overflow: hidden;
    }
    .opening-balance-modal-header { padding: 22px 22px 18px; border-bottom: 1px solid var(--border-color,rgba(128,128,128,.15)); }
    .opening-balance-modal-title { display: flex; align-items: center; gap: 14px; }
    .opening-balance-modal-icon {
      width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
      border-radius: 13px; background: rgba(21,128,61,.12); color: #15803d; font-size: 20px;
    }
    .opening-balance-modal form { padding: 20px 22px 22px; }
    .opening-balance-info {
      display: flex; align-items: flex-start; gap: 11px; padding: 13px; margin-bottom: 20px;
      border-radius: 10px; background: var(--secondary-bg,rgba(128,128,128,.06));
    }
    .opening-balance-input-wrapper {
      display: flex; align-items: center; height: 52px; border: 1px solid var(--border-color,rgba(128,128,128,.28));
      border-radius: 10px; background: var(--input-bg,var(--card-bg,#fff));
    }
    .opening-balance-input-wrapper > span {
      width: 48px; height: 100%; display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; color: var(--primary-color,#15803d);
      background: rgba(21,128,61,.06); border-right: 1px solid var(--border-color,rgba(128,128,128,.18));
    }
    .opening-balance-input-wrapper input {
      width: 100%; height: 100%; border: none; outline: none; padding: 0 14px;
      font-size: 18px; font-weight: 600; background: transparent; color: var(--text-primary,#111827);
    }
    .opening-balance-hint { margin: 8px 0 0; font-size: 11px; color: var(--text-secondary,#6b7280); }
    .opening-balance-actions { display: flex; justify-content: flex-end; margin-top: 22px; }
    .opening-balance-submit {
      min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 0 17px; border: none; border-radius: 9px; background: var(--primary-color,#15803d);
      color: #ffffff; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .opening-balance-button-loader {
      width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.4); border-top-color: #ffffff;
      border-radius: 50%; animation: dashboard-spin .7s linear infinite;
    }

    @media (max-width: 1200px) {
      .dashboard-cards, .dashboard-secondary, .cash-summary-grid { grid-template-columns: repeat(2,1fr); }
      .chicken-stock-grid { grid-template-columns: repeat(2,1fr); }
      .dashboard-recent-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 700px) {
      .dashboard-page { padding: 14px; }
      .dashboard-header { flex-direction: column; align-items: flex-start; }
      .dashboard-date-filter { width: 100%; }
      .dashboard-cards, .dashboard-secondary, .cash-summary-grid, .chicken-stock-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);

export default Dashboard;