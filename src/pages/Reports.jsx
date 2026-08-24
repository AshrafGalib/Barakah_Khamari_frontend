import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaCalendarAlt,
  FaDrumstickBite,
  FaEgg,
  FaMortarPestle,
  FaMoneyBillWave,
  FaShoppingBag,
  FaReceipt,
  FaChartLine,
  FaSync,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { reportsAPI } from "../services/api";

// ==========================================
// Constants & Pure Helper Functions
// ==========================================

const DATE_OPTIONS = [
  { label: "আজকে (Today)", value: "today" },
  { label: "গতকাল (Yesterday)", value: "yesterday" },
  { label: "গত ২ দিন", value: "2days" },
  { label: "গত ৩ দিন", value: "3days" },
  { label: "গত ৫ দিন", value: "5days" },
  { label: "গত ৭ দিন", value: "7days" },
  { label: "গত ১৫ দিন", value: "15days" },
  { label: "গত ৩০ দিন", value: "30days" },
  { label: "কাস্টম ডেট (Custom Range)", value: "custom" },
];

const formatMoney = (amount) => {
  return Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateDateRange = (type, customStart, customEnd) => {
  const today = new Date();
  let start = new Date();
  let end = new Date();

  switch (type) {
    case "today":
      break;
    case "yesterday":
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
      break;
    case "2days":
      start.setDate(today.getDate() - 1);
      break;
    case "3days":
      start.setDate(today.getDate() - 2);
      break;
    case "5days":
      start.setDate(today.getDate() - 4);
      break;
    case "7days":
      start.setDate(today.getDate() - 6);
      break;
    case "15days":
      start.setDate(today.getDate() - 14);
      break;
    case "30days":
      start.setDate(today.getDate() - 29);
      break;
    case "custom":
      return { start: customStart, end: customEnd };
    default:
      break;
  }

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
};

// ==========================================
// Sub-Components
// ==========================================

// চিকেন ক্যাটাগরি কার্ড
const ChickenCategoryCard = React.memo(({ chickenData }) => {
  const pcs = chickenData?.pcs || chickenData?.quantity || 0;
  const kg = chickenData?.kg || chickenData?.weight || 0;
  const amount = chickenData?.totalAmount || 0;
  const profitBeforeDiscount = chickenData?.profitBeforeDiscount !== undefined 
    ? chickenData.profitBeforeDiscount 
    : (chickenData?.profit || 0);
  const discount = chickenData?.discount || 0;
  const profitAfterDiscount = chickenData?.profitAfterDiscount !== undefined 
    ? chickenData.profitAfterDiscount 
    : (profitBeforeDiscount - discount);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="font-bold text-base-content/70">মুরগি বিক্রি (Chicken)</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          <FaDrumstickBite className="text-lg" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-base-content/60">বিক্রির পরিমাণ:</span>
          <span className="font-semibold">{formatMoney(pcs)} টি ({formatMoney(kg)} কেজি)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-base-content/60">মোট বিক্রি:</span>
          <span className="font-bold text-primary">৳ {formatMoney(amount)}</span>
        </div>
        <div className="flex justify-between text-sm text-base-content/60">
          <span>লাভ (ডিসকাউন্টের আগে):</span>
          <span className="font-semibold text-info">৳ {formatMoney(profitBeforeDiscount)}</span>
        </div>
        <div className="border-t border-base-200 pt-2 flex justify-between text-sm">
          <span className="text-base-content/70 font-semibold">ডিসকাউন্টের পর মোট লাভ:</span>
          <span className={`font-bold ${profitAfterDiscount >= 0 ? "text-success" : "text-error"}`}>
            ৳ {formatMoney(profitAfterDiscount)}
          </span>
        </div>
      </div>
    </div>
  );
});

// ডিম ও মসলাসহ যেকোনো ক্যাটাগরির জন্য জেনারেল কার্ড
const CategoryCard = React.memo(({ title, icon: Icon, color, qty, amount, categoryData, unit = "টি" }) => {
  const profitBeforeDiscount = categoryData?.profitBeforeDiscount !== undefined 
    ? categoryData.profitBeforeDiscount 
    : (categoryData?.profit || 0);
  const discount = categoryData?.discount || 0;
  const profitAfterDiscount = categoryData?.profitAfterDiscount !== undefined 
    ? categoryData.profitAfterDiscount 
    : (profitBeforeDiscount - discount);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="font-bold text-base-content/70">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="text-lg" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-base-content/60">বিক্রির পরিমাণ:</span>
          <span className="font-semibold">{formatMoney(qty)} {unit}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-base-content/60">মোট বিক্রি:</span>
          <span className="font-bold text-primary">৳ {formatMoney(amount)}</span>
        </div>
        <div className="flex justify-between text-sm text-base-content/60">
          <span>লাভ (ডিসকাউন্টের আগে):</span>
          <span className="font-semibold text-info">৳ {formatMoney(profitBeforeDiscount)}</span>
        </div>
        <div className="border-t border-base-200 pt-2 flex justify-between text-sm">
          <span className="text-base-content/70 font-semibold">ডিসকাউন্টের পর মোট লাভ:</span>
          <span className={`font-bold ${profitAfterDiscount >= 0 ? "text-success" : "text-error"}`}>
            ৳ {formatMoney(profitAfterDiscount)}
          </span>
        </div>
      </div>
    </div>
  );
});

const FinancialCard = React.memo(({ title, amount, icon: Icon, colorClass, subtitle }) => (
  <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}>
        <Icon className="text-xl" />
      </div>
      <div>
        <p className="text-xs text-base-content/50">{title}</p>
        <h3 className="text-2xl font-bold mt-0.5">৳ {formatMoney(amount)}</h3>
        {subtitle && <p className="text-xs text-base-content/60 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
));

// ==========================================
// Main Component
// ==========================================

function Reports() {
  const [filterType, setFilterType] = useState("today");
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date()));

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      const { start, end } = calculateDateRange(filterType, startDate, endDate);

      try {
        const response = await reportsAPI.getSummary({ startDate: start, endDate: end });
        if (isMounted) {
          setReportData(response?.data || response);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Fetch Report Error:", error);
          toast.error(error?.message || "রিপোর্ট লোড করতে সমস্যা হয়েছে");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filterType, startDate, endDate]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const { start, end } = calculateDateRange(filterType, startDate, endDate);

    try {
      const response = await reportsAPI.getSummary({ startDate: start, endDate: end });
      setReportData(response?.data || response);
      toast.success("রিপোর্ট আপডেট করা হয়েছে");
    } catch (error) {
      console.error("Fetch Report Error:", error);
      toast.error(error?.message || "রিপোর্ট লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, [filterType, startDate, endDate]);

  // Data Extractors
  const sales = useMemo(() => reportData?.sales || {}, [reportData]);
  const purchases = useMemo(() => reportData?.purchases || { totalAmount: 0, items: [] }, [reportData]);
  const duePayments = useMemo(() => reportData?.duePaymentsCollected || 0, [reportData]);
  const totalExpense = useMemo(() => reportData?.totalExpense || 0, [reportData]);
  const totalDiscount = useMemo(() => reportData?.totalDiscount || 0, [reportData]);
  const invoicesList = useMemo(() => reportData?.invoices || [], [reportData]);

  // সর্বমোট নিট লাভ (মোট লাভ - সকল ডিসকাউন্ট - সকল খরচ)
  const totalOverallProfit = useMemo(() => {
    if (reportData?.netProfit !== undefined) {
      return reportData.netProfit;
    }
    const chickenProfit = sales?.chicken?.profitBeforeDiscount || sales?.chicken?.profit || 0;
    const eggProfit = sales?.egg?.profitBeforeDiscount || sales?.egg?.profit || 0;
    const spiceProfit = sales?.spice?.profitBeforeDiscount || sales?.spice?.profit || 0;

    const totalGrossProfit = chickenProfit + eggProfit + spiceProfit;
    return totalGrossProfit - totalDiscount - totalExpense;
  }, [sales, totalExpense, totalDiscount, reportData]);

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content sm:text-3xl">ব্যবসার রিপোর্ট</h1>
          <p className="mt-1 text-sm text-base-content/60">
            বিক্রি, লাভ-ক্ষতি, কেনাকাটা এবং ইনভয়েস ভিত্তিক বিস্তারিত হিসাব
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-outline btn-primary btn-sm gap-2 self-start sm:self-auto"
          disabled={loading}
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          <span>রিফ্রেশ করুন</span>
        </button>
      </div>

      {/* Date Filter Section */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <FaCalendarAlt />
            <span>সময়সীমা নির্বাচন করুন:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select select-bordered w-full sm:w-auto"
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {filterType === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input input-bordered input-sm"
                />
                <span className="text-sm text-base-content/50">থেকে</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input input-bordered input-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-4 text-sm text-base-content/60">রিপোর্ট ডাটা প্রস্তুত করা হচ্ছে...</p>
        </div>
      ) : (
        <>
          {/* Category Sales & Profit Section */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-base-content/80 flex items-center gap-2">
              <FaChartLine className="text-primary" /> ক্যাটাগরি অনুযায়ী বিক্রি ও লাভ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* চিকেন কার্ড */}
              <ChickenCategoryCard chickenData={sales?.chicken} />

              {/* ডিম কার্ড */}
              <CategoryCard
                title="ডিম বিক্রি (Egg)"
                icon={FaEgg}
                color="bg-yellow-500/10 text-yellow-600"
                qty={sales?.egg?.quantity || 0}
                amount={sales?.egg?.totalAmount || 0}
                categoryData={sales?.egg}
                unit="টি"
              />

              {/* মসলা কার্ড */}
              <CategoryCard
                title="মসলা বিক্রি (Spice)"
                icon={FaMortarPestle}
                color="bg-rose-500/10 text-rose-600"
                qty={sales?.spice?.quantity || 0}
                amount={sales?.spice?.totalAmount || 0}
                categoryData={sales?.spice}
                unit="কেজি / প্যাক"
              />
            </div>
          </div>

          {/* Financial Overview */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-base-content/80 flex items-center gap-2">
              <FaMoneyBillWave className="text-success" /> আর্থিক লেনদেন ও নিট হিসাব
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FinancialCard
                title="বকেয়া আদায় (Due Payment Collected)"
                amount={duePayments}
                icon={FaReceipt}
                colorClass="bg-info/10 text-info"
                subtitle="পূর্বের বাকি পরিশোধ হিসেবে প্রাপ্ত টাকা"
              />
              <FinancialCard
                title="মোট খরচ (Total Expenses)"
                amount={totalExpense}
                icon={FaMoneyBillWave}
                colorClass="bg-error/10 text-error"
                subtitle="দোকান ও অন্যান্য আনুমানিক খরচ"
              />
              <FinancialCard
                title="সর্বমোট নিট লাভ (Net Profit)"
                amount={totalOverallProfit}
                icon={FaChartLine}
                colorClass={totalOverallProfit >= 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}
                subtitle="সকল খরচ ও ডিসকাউন্ট বাদ দিয়ে নিট লাভ"
              />
            </div>
          </div>

          {/* Purchase Breakdown */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                  <FaShoppingBag />
                </div>
                <div>
                  <h3 className="font-bold text-lg">ক্রয় হিসাব (Purchase Summary)</h3>
                  <p className="text-xs text-base-content/50">নির্ধারিত সময়ে কেনা মালামালের তালিকা</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/50">মোট কেনাকাটা</p>
                <p className="text-xl font-bold text-purple-600">৳ {formatMoney(purchases.totalAmount)}</p>
              </div>
            </div>

            {purchases.items && purchases.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-sm">
                  <thead>
                    <tr>
                      <th>পণ্য/আইটেমের নাম</th>
                      <th>পরিমাণ</th>
                      <th>মোট খরচ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold">{item.name}</td>
                        <td>{formatMoney(item.quantity)} {item.unit || "টি"}</td>
                        <td className="font-bold">৳ {formatMoney(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-base-content/50">
                এই সময়সীমায় কোনো কেনাকাটার তথ্য নেই।
              </p>
            )}
          </div>

          {/* Invoice-wise Breakdown Table */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-base-200 pb-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FaFileInvoiceDollar className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg">ইনভয়েস ভিত্তিক সেলস ও প্রফিট বিবরণী</h3>
                <p className="text-xs text-base-content/50">
                  প্রতিটি ইনভয়েসের সেল অ্যামাউন্ট, ডিসকাউন্ট এবং নিট প্রফিটের বিস্তারিত তালিকা
                </p>
              </div>
            </div>

            {invoicesList && invoicesList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-sm">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th>ইনভয়েস নং</th>
                      <th>কাস্টমারের নাম</th>
                      <th>সেল অ্যামাউন্ট (প্রকৃত)</th>
                      <th>ডিসকাউন্ট</th>
                      <th>ডিসকাউন্টের পর সেল</th>
                      <th className="text-right">ইনভয়েস প্রফিট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesList.map((inv, idx) => {
                      const grossSale = inv.grossSaleAmount || inv.totalAmount || 0;
                      const discount = inv.discountAmount || inv.discount || 0;
                      const netSale = inv.netSaleAmount || (grossSale - discount);
                      const profit = inv.profit !== undefined ? inv.profit : (netSale - (inv.costAmount || 0));

                      return (
                        <tr key={idx} className="hover">
                          <td className="font-semibold text-primary">
                            #{inv.invoiceNo || inv._id?.slice(-6)}
                          </td>
                          <td className="font-medium">
                            {inv.customerName || "সাধারণ কাস্টমার"}
                          </td>
                          <td>৳ {formatMoney(grossSale)}</td>
                          <td className="text-error font-medium">
                            {discount > 0 ? `- ৳ ${formatMoney(discount)}` : "৳ 0"}
                          </td>
                          <td className="font-semibold text-base-content">
                            ৳ {formatMoney(netSale)}
                          </td>
                          <td className={`text-right font-bold ${profit >= 0 ? "text-success" : "text-error"}`}>
                            ৳ {formatMoney(profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-base-content/50">
                এই সময়সীমায় কোনো বিক্রির ইনভয়েস ডাটা পাওয়া যায়নি।
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;