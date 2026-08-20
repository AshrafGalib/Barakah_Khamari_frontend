import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaMoneyBillWave,
  FaReceipt,
  FaTrash,
  FaPlus,
  FaTimes,
  FaWallet,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { expenseAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

// ======================================================
// Pure Utility Helpers & Constants
// ======================================================

const EXPENSE_CATEGORIES = [
  "দোকান ভাড়া",
  "বিদ্যুৎ বিল",
  "গ্যাস বিল",
  "পানি বিল",
  "কর্মচারী বেতন",
  "পরিবহন",
  "খাবার",
  "রক্ষণাবেক্ষণ",
  "ইন্টারনেট",
  "অন্যান্য",
];

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseExpenseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseExpenseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  const date = parseExpenseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ======================================================
// Memoized Sub-Components
// ======================================================

const ExpenseForm = React.memo(
  ({ formData, handleInputChange, handleSubmit, closeExpenseForm, saving, canCreate }) => (
    <div className="expense-form-card">
      <div className="expense-form-title">
        <div className="expense-form-icon">
          <FaFileInvoiceDollar />
        </div>
        <div>
          <h2>Add New Expense</h2>
          <p>নতুন একটি দোকানের খরচ যোগ করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="expense-form-group">
          <label>
            <FaCalendarAlt /> Expense Date
          </label>
          <input
            type="date"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="expense-form-group">
          <label>
            <FaReceipt /> Expense Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="যেমন: আগস্ট মাসের দোকান ভাড়া"
          />
        </div>

        <div className="expense-form-group">
          <label>
            <FaWallet /> Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">Category নির্বাচন করুন</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="expense-form-group">
          <label>
            <FaMoneyBillWave /> Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="যেমন: 5000"
            min="0"
            step="0.01"
          />
        </div>

        <div className="expense-form-group full-width">
          <label>
            <FaReceipt /> Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="অতিরিক্ত কোনো তথ্য..."
            rows="3"
          />
        </div>

        <div className="expense-form-actions">
          <button
            type="button"
            className="expense-cancel-btn"
            onClick={closeExpenseForm}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="expense-save-btn"
            disabled={saving || !canCreate}
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </form>
    </div>
  )
);

const FilterCard = React.memo(
  ({ fromDate, toDate, categoryFilter, setFromDate, setToDate, setCategoryFilter, resetFilter }) => (
    <div className="expense-filter-card">
      <div className="filter-title">
        <FaFilter />
        <span>Expense Filter</span>
      </div>

      <div className="expense-filters">
        <div className="expense-filter-group">
          <label>
            <FaCalendarAlt /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="expense-filter-group">
          <label>
            <FaCalendarAlt /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="expense-filter-group">
          <label>
            <FaWallet /> Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">সব Category</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
  <div className="expense-summary-card">
    <div className="expense-summary-icon">
      <Icon />
    </div>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  </div>
));

const ExpenseTable = React.memo(({ filteredExpenses, canDelete, handleDelete }) => (
  <div className="expense-table-wrapper">
    {filteredExpenses.length === 0 ? (
      <div className="expense-empty">
        <FaReceipt />
        <h3>কোনো Expense পাওয়া যায়নি</h3>
        <p>আপনার selected filter অনুযায়ী কোনো expense পাওয়া যায়নি।</p>
      </div>
    ) : (
      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Title</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Notes</th>
            {canDelete && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((expense) => (
            <tr key={expense._id}>
              <td>
                <div className="date-cell">
                  <FaCalendarAlt />
                  <span>{formatDate(expense.expenseDate)}</span>
                </div>
              </td>
              <td>
                <span className="time-cell">
                  {formatTime(expense.expenseDate)}
                </span>
              </td>
              <td>
                <strong>{expense.title || "-"}</strong>
              </td>
              <td>
                <span className="expense-category-badge">
                  {expense.category || "-"}
                </span>
              </td>
              <td>
                <strong className="expense-amount">
                  ৳ {formatCurrency(expense.amount)}
                </strong>
              </td>
              <td>
                <span className="expense-notes">{expense.notes || "-"}</span>
              </td>
              {canDelete && (
                <td>
                  <button
                    type="button"
                    className="expense-delete-btn"
                    title="Delete Expense"
                    onClick={() => handleDelete(expense._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
));

// ======================================================
// Main Expense Component
// ======================================================

const Expense = () => {
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.EXPENSES_CREATE);
  const canDelete = can(PERMISSIONS.EXPENSES_DELETE);

  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    expenseDate: getLocalDateString(),
    title: "",
    category: "",
    amount: "",
    notes: "",
  });

  // Load Expenses
  useEffect(() => {
    let isCancelled = false;

    const loadExpenses = async () => {
      try {
        setLoading(true);
        const response = await expenseAPI.getAll();

        if (!isCancelled) {
          setExpenses(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Load Expense Error:", error);
          toast.error(error?.message || "Expense data load করা যায়নি");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadExpenses();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      expenseDate: getLocalDateString(),
      title: "",
      category: "",
      amount: "",
      notes: "",
    });
  }, []);

  const openExpenseForm = useCallback(() => {
    if (!canCreate) {
      toast.error("Expense যোগ করার permission নেই");
      return;
    }
    resetForm();
    setShowForm(true);
  }, [canCreate, resetForm]);

  const closeExpenseForm = useCallback(() => {
    if (saving) return;
    resetForm();
    setShowForm(false);
  }, [saving, resetForm]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!canCreate) {
        toast.error("Expense যোগ করার permission নেই");
        return;
      }

      if (!formData.expenseDate) {
        toast.error("Expense Date দিন");
        return;
      }

      if (!formData.title.trim()) {
        toast.error("Expense Title দিন");
        return;
      }

      if (!formData.category.trim()) {
        toast.error("Expense Category নির্বাচন করুন");
        return;
      }

      const amount = Number(formData.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("সঠিক Expense Amount দিন");
        return;
      }

      try {
        setSaving(true);
        const now = new Date();
        const [year, month, day] = formData.expenseDate.split("-").map(Number);

        const localExpenseDate = new Date(
          year,
          month - 1,
          day,
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );

        const payload = {
          title: formData.title.trim(),
          category: formData.category.trim(),
          amount: Number(amount.toFixed(2)),
          expenseDate: localExpenseDate.toISOString(),
          notes: formData.notes.trim(),
        };

        const response = await expenseAPI.create(payload);
        const createdExpense = response?.data;

        if (createdExpense) {
          setExpenses((prev) => [createdExpense, ...prev]);
        } else {
          const freshData = await expenseAPI.getAll();
          setExpenses(Array.isArray(freshData?.data) ? freshData.data : []);
        }

        toast.success(response?.message || "Expense সফলভাবে যোগ হয়েছে");
        resetForm();
        setShowForm(false);
      } catch (error) {
        console.error("Create Expense Error:", error);
        toast.error(error?.message || "Expense যোগ করা যায়নি");
      } finally {
        setSaving(false);
      }
    },
    [canCreate, formData, resetForm]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = parseExpenseDate(expense.expenseDate);
      if (!expenseDate) return false;

      const expenseLocalDate = getLocalDateString(expenseDate);

      if (fromDate && expenseLocalDate < fromDate) return false;
      if (toDate && expenseLocalDate > toDate) return false;
      if (categoryFilter && String(expense.category || "") !== String(categoryFilter)) return false;

      return true;
    });
  }, [expenses, fromDate, toDate, categoryFilter]);

  const summary = useMemo(() => {
    return filteredExpenses.reduce(
      (result, expense) => {
        result.totalExpense += Number(expense.amount) || 0;
        result.transactions += 1;
        return result;
      },
      { totalExpense: 0, transactions: 0 }
    );
  }, [filteredExpenses]);

  const resetFilter = useCallback(() => {
    setFromDate("");
    setToDate("");
    setCategoryFilter("");
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (!canDelete) {
        toast.error("Expense delete করার permission নেই");
        return;
      }

      if (!id) {
        toast.error("Invalid Expense ID");
        return;
      }

      if (!window.confirm("এই Expense delete করতে চান?")) return;

      try {
        await expenseAPI.delete(id);
        setExpenses((prev) => prev.filter((expense) => String(expense._id) !== String(id)));
        toast.success("Expense delete হয়েছে");
      } catch (error) {
        console.error("Delete Expense Error:", error);
        toast.error(error?.message || "Expense delete করা যায়নি");
      }
    },
    [canDelete]
  );

  if (loading) {
    return (
      <div className="expense-page">
        <div className="expense-loading">
          <div className="expense-loader" />
          <p>Expense data loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-page">
      <div className="expense-header">
        <div>
          <h1>Expense Management</h1>
          <p>দোকানের সকল খরচের সম্পূর্ণ হিসাব</p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="add-expense-btn"
            onClick={showForm ? closeExpenseForm : openExpenseForm}
          >
            {showForm ? (
              <>
                <FaTimes /> Close
              </>
            ) : (
              <>
                <FaPlus /> Add Expense
              </>
            )}
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <ExpenseForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          closeExpenseForm={closeExpenseForm}
          saving={saving}
          canCreate={canCreate}
        />
      )}

      <FilterCard
        fromDate={fromDate}
        toDate={toDate}
        categoryFilter={categoryFilter}
        setFromDate={setFromDate}
        setToDate={setToDate}
        setCategoryFilter={setCategoryFilter}
        resetFilter={resetFilter}
      />

      <div className="expense-summary">
        <SummaryCard
          icon={FaMoneyBillWave}
          title="Total Expense"
          value={`৳ ${formatCurrency(summary.totalExpense)}`}
        />
        <SummaryCard
          icon={FaReceipt}
          title="Transactions"
          value={summary.transactions}
        />
      </div>

      <div className="expense-result-info">
        <span>
          Showing <strong>{filteredExpenses.length}</strong> expense(s)
        </span>
        {(fromDate || toDate || categoryFilter) && (
          <span className="filter-active">Filter Active</span>
        )}
      </div>

      <ExpenseTable
        filteredExpenses={filteredExpenses}
        canDelete={canDelete}
        handleDelete={handleDelete}
      />

      <style>{`
        .expense-page { width: 100%; min-height: 100vh; padding: 24px; box-sizing: border-box; background: var(--bg-primary, inherit); color: var(--text-primary, inherit); }
        .expense-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
        .expense-header h1 { margin: 0 0 6px; font-size: 28px; font-weight: 700; color: var(--text-primary, inherit); }
        .expense-header p { margin: 0; font-size: 14px; color: var(--text-secondary, inherit); }
        .add-expense-btn { height: 44px; padding: 0 17px; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 9px; cursor: pointer; background: var(--primary-color, #15803d); color: #ffffff; font-family: inherit; font-size: 13px; font-weight: 600; transition: 0.2s; }
        .add-expense-btn:hover { opacity: 0.88; }
        .expense-form-card, .expense-filter-card, .expense-summary-card { background: var(--card-bg, transparent); border: 1px solid var(--border-color, rgba(128,128,128,0.25)); box-shadow: var(--card-shadow, none); }
        .expense-form-card { margin-bottom: 20px; padding: 20px; border-radius: 14px; }
        .expense-form-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .expense-form-icon { width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 11px; background: var(--primary-light, rgba(21,128,61,0.12)); color: var(--primary-color, #15803d); font-size: 18px; }
        .expense-form-title h2 { margin: 0 0 3px; font-size: 18px; }
        .expense-form-title p { margin: 0; font-size: 12px; color: var(--text-secondary, inherit); }
        .expense-form { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .expense-form-group { width: 100%; }
        .expense-form-group.full-width { grid-column: span 2; }
        .expense-form-group label, .expense-filter-group label { display: flex; align-items: center; gap: 6px; margin-bottom: 7px; font-size: 13px; font-weight: 600; }
        .expense-form-group label svg, .expense-filter-group label svg, .filter-title svg { color: var(--primary-color, #15803d); }
        .expense-form-group input, .expense-form-group select, .expense-form-group textarea, .expense-filter-group input, .expense-filter-group select { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color, rgba(128,128,128,0.3)); border-radius: 9px; outline: none; background: var(--input-bg, transparent); color: var(--text-primary, inherit); font-family: inherit; font-size: 14px; }
        .expense-form-group input, .expense-form-group select, .expense-filter-group input, .expense-filter-group select { height: 44px; padding: 0 12px; }
        .expense-form-group textarea { padding: 11px 12px; resize: vertical; }
        .expense-form-group input:focus, .expense-form-group select:focus, .expense-form-group textarea:focus, .expense-filter-group input:focus, .expense-filter-group select:focus { border-color: var(--primary-color, #15803d); box-shadow: 0 0 0 3px var(--primary-light, rgba(21,128,61,0.12)); }
        .expense-form-group select option { background: var(--card-bg, #ffffff); color: var(--text-primary, #111827); }
        .expense-form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
        .expense-cancel-btn, .expense-save-btn { height: 42px; padding: 0 18px; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; transition: 0.2s; }
        .expense-cancel-btn { background: var(--secondary-bg, rgba(128,128,128,0.12)); color: var(--text-primary, inherit); }
        .expense-save-btn { background: var(--primary-color, #15803d); color: #ffffff; }
        .expense-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .expense-filter-card { margin-bottom: 20px; padding: 18px; border-radius: 14px; }
        .filter-title { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; font-size: 15px; font-weight: 700; }
        .expense-filters { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 14px; align-items: end; }
        .expense-filter-group { width: 100%; }
        .reset-filter-btn { height: 44px; padding: 0 18px; border: none; border-radius: 9px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; background: var(--secondary-bg, rgba(128,128,128,0.12)); color: var(--text-primary, inherit); white-space: nowrap; transition: 0.2s; }
        .reset-filter-btn:hover { opacity: 0.8; }
        .expense-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 18px; }
        .expense-summary-card { display: flex; align-items: center; gap: 13px; padding: 18px; border-radius: 14px; }
        .expense-summary-icon { width: 46px; height: 46px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 11px; background: var(--danger-light, rgba(220,38,38,0.12)); color: var(--danger-color, #dc2626); font-size: 18px; }
        .expense-summary-card span { display: block; margin-bottom: 4px; font-size: 12px; color: var(--text-secondary, inherit); }
        .expense-summary-card strong { display: block; font-size: 19px; color: var(--text-primary, inherit); }
        .expense-result-info { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; font-size: 13px; color: var(--text-secondary, inherit); }
        .filter-active { padding: 5px 9px; border-radius: 7px; background: var(--primary-light, rgba(21,128,61,0.12)); color: var(--primary-color, #15803d); font-weight: 600; }
        .expense-table-wrapper { width: 100%; overflow-x: auto; border-radius: 14px; border: 1px solid var(--border-color, rgba(128,128,128,0.25)); background: var(--card-bg, transparent); box-shadow: var(--card-shadow, none); }
        .expense-table { width: 100%; min-width: 950px; border-collapse: collapse; }
        .expense-table th { padding: 14px; text-align: left; white-space: nowrap; font-size: 12px; font-weight: 700; color: var(--text-secondary, inherit); background: var(--table-header-bg, rgba(128,128,128,0.08)); }
        .expense-table td { padding: 14px; border-top: 1px solid var(--border-color, rgba(128,128,128,0.15)); font-size: 13px; color: var(--text-primary, inherit); vertical-align: middle; white-space: nowrap; }
        .expense-table tbody tr:hover { background: var(--hover-bg, rgba(128,128,128,0.04)); }
        .date-cell { display: flex; align-items: center; gap: 7px; }
        .date-cell svg { color: var(--primary-color, #15803d); }
        .time-cell { color: var(--text-secondary, inherit); }
        .expense-category-badge { display: inline-block; padding: 6px 9px; border-radius: 7px; background: var(--secondary-bg, rgba(128,128,128,0.1)); color: var(--text-primary, inherit); font-size: 11px; font-weight: 600; }
        .expense-amount { color: var(--danger-color, #dc2626) !important; }
        .expense-notes { display: block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary, inherit); }
        .expense-delete-btn { width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 8px; cursor: pointer; background: var(--danger-light, rgba(220,38,38,0.12)); color: var(--danger-color, #dc2626); transition: 0.2s; }
        .expense-delete-btn:hover { opacity: 0.75; }
        .expense-loading { min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-secondary, inherit); }
        .expense-loader { width: 30px; height: 30px; border: 3px solid var(--border-color, rgba(128,128,128,0.2)); border-top-color: var(--primary-color, #15803d); border-radius: 50%; animation: expense-spin 0.8s linear infinite; }
        @keyframes expense-spin { to { transform: rotate(360deg); } }
        .expense-empty { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; color: var(--text-secondary, inherit); }
        .expense-empty > svg { font-size: 38px; margin-bottom: 12px; color: var(--primary-color, #15803d); }
        .expense-empty h3 { margin: 0 0 6px; color: var(--text-primary, inherit); }
        .expense-empty p { margin: 0; font-size: 13px; }

        @media (max-width: 1100px) {
          .expense-form { grid-template-columns: repeat(2, 1fr); }
          .expense-form-group.full-width { grid-column: span 2; }
          .expense-filters { grid-template-columns: repeat(2, 1fr); }
          .reset-filter-btn { width: 100%; }
        }
        @media (max-width: 700px) {
          .expense-page { padding: 14px; }
          .expense-header { align-items: flex-start; flex-direction: column; }
          .expense-header h1 { font-size: 23px; }
          .add-expense-btn { width: 100%; }
          .expense-form { grid-template-columns: 1fr; }
          .expense-form-group.full-width { grid-column: span 1; }
          .expense-filters { grid-template-columns: 1fr; }
          .expense-summary { grid-template-columns: 1fr; }
          .expense-result-info { align-items: flex-start; flex-direction: column; }
        }
        @media (max-width: 420px) {
          .expense-page { padding: 9px; }
          .expense-header h1 { font-size: 21px; }
          .expense-summary-card { padding: 14px; }
          .expense-summary-card strong { font-size: 17px; }
        }
      `}</style>
    </div>
  );
};

export default Expense;