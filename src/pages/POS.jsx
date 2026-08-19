import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCalculator,
  FaCashRegister,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaTrash,
  FaPlus,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { productAPI, salesAPI } from "../services/api";
import usePermission from "../hooks/usePermission";
import { PERMISSIONS } from "../constants/permissions";

const EMPTY_ITEM = {
  productId: "",
  quantity: "",
  pieces: "",
  weight: "",
  sellingPrice: "",
};

const PAYMENT_METHODS = ["ক্যাশ", "Nagad", "bKash", "অন্যান্য"];

const POS = () => {
  // ====================================================
  // Permission Check
  // ====================================================
  const { can } = usePermission();
  const canAccessPOS = can(PERMISSIONS.POS_ACCESS);

  // ====================================================
  // Refs (অটো স্ক্রলের জন্য Ref)
  // ====================================================
  const invoiceSummaryRef = useRef(null);

  // ====================================================
  // States
  // ====================================================
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  // Selected Product & Form State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemForm, setItemForm] = useState({ ...EMPTY_ITEM });

  // Customer / Payment State
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ক্যাশ");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ====================================================
  // Auto Scroll Helper Function
  // ====================================================
  const scrollToInvoiceSummary = () => {
    if (invoiceSummaryRef.current) {
      invoiceSummaryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ====================================================
  // Fetch / Refresh Products
  // ====================================================
  const fetchProductsData = useCallback(
    async (isMounted = true, isManualRefresh = false) => {
      if (!canAccessPOS) return;

      setLoadingProducts(true);
      try {
        const response = await productAPI.getAll();
        if (isMounted) {
          setProducts(response?.data || []);
          if (isManualRefresh) {
            toast.info("স্টক তথ্য আপডেট করা হয়েছে");
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Load Products Error:", error);
          toast.error(error?.message || "Product-এর তালিকা লোড করা যায়নি");
        }
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    },
    [canAccessPOS]
  );

  // Initial Load Effect (Cascading Render Prevented via Microtask)
  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        fetchProductsData(isMounted, false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchProductsData]);

  // Manual Refresh Handler
  const handleRefresh = () => {
    fetchProductsData(true, true);
  };

  // ====================================================
  // Search & Filter
  // ====================================================
  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) => {
      const name = product?.name?.toLowerCase() || "";
      const brand = product?.brand?.toLowerCase() || "";
      const category = product?.categoryName?.toLowerCase() || "";

      return name.includes(keyword) || brand.includes(keyword) || category.includes(keyword);
    });
  }, [products, search]);

  // ====================================================
  // Select / Clear Product
  // ====================================================
  const selectProduct = (product) => {
    setSelectedProduct(product);
    setItemForm({
      productId: product?._id || "",
      quantity: "",
      pieces: "",
      weight: "",
      sellingPrice: product?.sellingPrice ?? product?.salePrice ?? "",
    });
    setSearch("");
    toast.info(`"${product.name}" নির্বাচন করা হয়েছে`);
  };

  const clearSelectedProduct = () => {
    setSelectedProduct(null);
    setItemForm({ ...EMPTY_ITEM });
  };

  const isPoultry = selectedProduct?.unit === "কেজি + পিস";

  // ====================================================
  // Available Stock Calculation
  // ====================================================
  const availableStock = useMemo(() => {
    if (!selectedProduct) return null;

    if (isPoultry) {
      return {
        pieces: Number(selectedProduct.stockPieces) || 0,
        weight: Number(selectedProduct.totalWeight) || 0,
      };
    }

    return {
      quantity: Number(selectedProduct.stockQuantity) || 0,
    };
  }, [selectedProduct, isPoultry]);

  // ====================================================
  // Form Change Handler
  // ====================================================
  const handleItemChange = (event) => {
    const { name, value } = event.target;
    setItemForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ====================================================
  // Add Product To Cart (অটো স্ক্রল ও টোস্ট সহ)
  // ====================================================
  const addProductToCart = () => {
    if (!selectedProduct) {
      toast.error("প্রথমে Product নির্বাচন করুন");
      return;
    }

    const productId = selectedProduct._id;
    const price = Number(itemForm.sellingPrice) || 0;

    if (price <= 0) {
      toast.error("সঠিক Selling Price দিন");
      return;
    }

    // --- Poultry Logic ---
    if (isPoultry) {
      const pieces = Number(itemForm.pieces) || 0;
      const weight = Number(itemForm.weight) || 0;

      if (pieces <= 0) {
        toast.error("Pieces-এর সংখ্যা দিন");
        return;
      }

      if (weight <= 0) {
        toast.error("Weight (কেজি) দিন");
        return;
      }

      if (pieces > availableStock.pieces) {
        toast.error(`পর্যাপ্ত Pieces স্টক নেই। Available: ${availableStock.pieces}`);
        return;
      }

      if (weight > availableStock.weight) {
        toast.error(`পর্যাপ্ত Weight স্টক নেই। Available: ${availableStock.weight} KG`);
        return;
      }

      const existingIndex = cart.findIndex((item) => item.productId === productId);

      if (existingIndex !== -1) {
        const existingItem = cart[existingIndex];
        const newPieces = Number(existingItem.pieces || 0) + pieces;
        const newWeight = Number(existingItem.weight || 0) + weight;

        if (newPieces > availableStock.pieces) {
          toast.error("এই Product-এর মোট Pieces স্টকের চেয়ে বেশি হয়ে যাচ্ছে");
          return;
        }

        if (newWeight > availableStock.weight) {
          toast.error("এই Product-এর মোট Weight স্টকের চেয়ে বেশি হয়ে যাচ্ছে");
          return;
        }

        const updatedCart = [...cart];
        updatedCart[existingIndex] = {
          ...existingItem,
          pieces: newPieces,
          weight: newWeight,
          sellingPrice: price,
          totalAmount: Number((newWeight * price).toFixed(2)),
        };
        setCart(updatedCart);
        toast.success(`"${selectedProduct.name}" এর পরিমাণ আপডেট করা হয়েছে`);
      } else {
        setCart((previous) => [
          ...previous,
          {
            productId,
            productName: selectedProduct.name,
            categoryId: selectedProduct.categoryId || null,
            categoryName: selectedProduct.categoryName || "",
            unit: selectedProduct.unit,
            quantity: null,
            pieces,
            weight,
            sellingPrice: price,
            totalAmount: Number((weight * price).toFixed(2)),
          },
        ]);
        toast.success(`"${selectedProduct.name}" কার্টে যোগ করা হয়েছে`);
      }
    } 
    // --- Normal Product Logic ---
    else {
      const quantity = Number(itemForm.quantity) || 0;

      if (quantity <= 0) {
        toast.error("Quantity দিন");
        return;
      }

      if (quantity > availableStock.quantity) {
        toast.error(`পর্যাপ্ত স্টক নেই। Available: ${availableStock.quantity}`);
        return;
      }

      const existingIndex = cart.findIndex((item) => item.productId === productId);

      if (existingIndex !== -1) {
        const existingItem = cart[existingIndex];
        const newQuantity = Number(existingItem.quantity || 0) + quantity;

        if (newQuantity > availableStock.quantity) {
          toast.error("এই Product-এর মোট Quantity স্টকের চেয়ে বেশি হয়ে যাচ্ছে");
          return;
        }

        const updatedCart = [...cart];
        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          sellingPrice: price,
          totalAmount: Number((newQuantity * price).toFixed(2)),
        };
        setCart(updatedCart);
        toast.success(`"${selectedProduct.name}" এর পরিমাণ আপডেট করা হয়েছে`);
      } else {
        setCart((previous) => [
          ...previous,
          {
            productId,
            productName: selectedProduct.name,
            categoryId: selectedProduct.categoryId || null,
            categoryName: selectedProduct.categoryName || "",
            unit: selectedProduct.unit,
            quantity,
            pieces: null,
            weight: null,
            sellingPrice: price,
            totalAmount: Number((quantity * price).toFixed(2)),
          },
        ]);
        toast.success(`"${selectedProduct.name}" কার্টে যোগ করা হয়েছে`);
      }
    }

    clearSelectedProduct();

    // কার্টে বা ইনভয়েসে যোগ করার পর অটো স্ক্রল হয়ে ইনভয়েস সামারিতে চলে যাবে
    setTimeout(() => {
      scrollToInvoiceSummary();
    }, 100);
  };

  // ====================================================
  // Remove Cart Item
  // ====================================================
  const removeCartItem = (productId) => {
    const itemToRemove = cart.find((item) => item.productId === productId);
    setCart((previous) => previous.filter((item) => item.productId !== productId));
    if (itemToRemove) {
      toast.warn(`"${itemToRemove.productName}" কার্ট থেকে সরাতে হয়েছে`);
    }
  };

  // ====================================================
  // Totals Calculations
  // ====================================================
  const subtotal = useMemo(() => {
    return Number(
      cart.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0).toFixed(2)
    );
  }, [cart]);

  const discountAmount = Math.max(0, Number(discount) || 0);
  const netTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const paid = Math.max(0, Number(paidAmount) || 0);
  const due = Math.max(0, Number((netTotal - paid).toFixed(2)));

  // ====================================================
  // Reset Form
  // ====================================================
  const resetPOS = (showNotification = false) => {
    setCart([]);
    setSelectedProduct(null);
    setItemForm({ ...EMPTY_ITEM });
    setCustomerName("");
    setDiscount("");
    setPaidAmount("");
    setPaymentMethod("ক্যাশ");
    setNotes("");
    setSearch("");
    
    if (showNotification) {
      toast.info("ফর্ম রিসেট করা হয়েছে");
    }
  };

  // ====================================================
  // Submit Sale (ডিউ থাকলে Toast সহ কাস্টমার নাম চেক)
  // ====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canAccessPOS) {
      toast.error("POS ব্যবহার করার permission নেই");
      return;
    }

    if (cart.length === 0) {
      toast.error("কমপক্ষে একটি Product যোগ করুন");
      return;
    }

    if (discountAmount > subtotal) {
      toast.error("Discount Subtotal-এর চেয়ে বেশি হতে পারবে না");
      return;
    }

    if (paid > netTotal) {
      toast.error("Paid Amount Net Total-এর চেয়ে বেশি হতে পারবে না");
      return;
    }

    if (due > 0 && !customerName.trim()) {
      toast.error("Due থাকলে অবশ্যই Customer Name দিতে হবে");
      return;
    }

    const items = cart.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 0,
      pieces: Number(item.pieces) || 0,
      weight: Number(item.weight) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
    }));

    const saleData = {
      customerName: customerName.trim(),
      items,
      discount: discountAmount,
      paidAmount: paid,
      paymentMethod,
      notes: notes.trim(),
    };

    try {
      setSaving(true);
      await salesAPI.create(saleData);

      toast.success("বিক্রি সফলভাবে সম্পন্ন হয়েছে!");
      await fetchProductsData(true, false); // Refresh stock data
      resetPOS(false);
    } catch (error) {
      console.error("Create Sale Error:", error);
      toast.error(error?.message || "বিক্রি সম্পন্ন করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // Permission Guard
  // ====================================================
  if (!canAccessPOS) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-error/20 bg-base-100 p-8 text-center shadow-sm">
          <FaExclamationTriangle className="mx-auto mb-4 text-5xl text-error" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-base-content/60">POS ব্যবহার করার জন্য আপনার অনুমতি নেই।</p>
        </div>
      </div>
    );
  }

  // ====================================================
  // Render
  // ====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content sm:text-3xl">POS (Point of Sale)</h1>
          <p className="mt-1 text-sm text-base-content/60">
            সহজেই ক্রেতার ইনভয়েস তৈরি করুন ও সেল সম্পন্ন করুন
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-outline btn-sm gap-2"
          title="প্রোডাক্ট স্টক রিফ্রেশ করুন"
        >
          <FaSyncAlt className={loadingProducts ? "animate-spin" : ""} />
          স্টক রিফ্রেশ
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-5 lg:col-span-2">
          {/* Product Selection */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FaShoppingCart className="text-primary" />
              <h2 className="text-lg font-bold">Product নির্বাচন</h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Product-এর নাম, Brand বা Category দিয়ে খুঁজুন..."
                className="input input-bordered w-full pl-11"
              />
            </div>

            {/* Search Results Dropdown */}
            {search && !selectedProduct && (
              <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-base-300 bg-base-100 shadow-md">
                {loadingProducts ? (
                  <div className="p-6 text-center">
                    <span className="loading loading-spinner" />
                    <p className="mt-2 text-sm text-base-content/50">প্রোডাক্ট লোড হচ্ছে...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-base-content/50">
                    কোনো Product পাওয়া যায়নি
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => selectProduct(product)}
                      className="flex w-full items-center justify-between border-b border-base-200 p-4 text-left last:border-b-0 hover:bg-base-200"
                    >
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="mt-1 text-xs text-base-content/50">
                          {product.categoryName || "Category নেই"}
                        </p>
                        {product.brand && (
                          <p className="mt-1 text-xs text-base-content/40">Brand: {product.brand}</p>
                        )}
                      </div>

                      <div className="text-right">
                        {product.unit === "কেজি + পিস" ? (
                          <>
                            <p className="text-sm font-semibold">
                              {Number(product.stockPieces) || 0} পিস
                            </p>
                            <p className="text-xs text-base-content/50">
                              {Number(product.totalWeight) || 0} KG
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold">
                            {Number(product.stockQuantity) || 0} {product.unit}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Product Form */}
            {selectedProduct && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">{selectedProduct.name}</p>
                    <p className="mt-1 text-sm text-base-content/60">
                      {selectedProduct.categoryName || "Category নেই"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedProduct}
                    className="btn btn-sm btn-circle btn-ghost"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Available Stock */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {isPoultry ? (
                    <>
                      <div className="rounded-xl bg-base-100 p-3">
                        <p className="text-xs text-base-content/50">Available Pieces</p>
                        <p className="mt-1 text-xl font-bold">{availableStock.pieces}</p>
                      </div>
                      <div className="rounded-xl bg-base-100 p-3">
                        <p className="text-xs text-base-content/50">Available Weight</p>
                        <p className="mt-1 text-xl font-bold">{availableStock.weight} KG</p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 rounded-xl bg-base-100 p-3">
                      <p className="text-xs text-base-content/50">Available Stock</p>
                      <p className="mt-1 text-xl font-bold">
                        {availableStock.quantity} {selectedProduct.unit}
                      </p>
                    </div>
                  )}
                </div>

                {/* Input Fields */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {!isPoultry && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Quantity *</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        name="quantity"
                        value={itemForm.quantity}
                        onChange={handleItemChange}
                        className="input input-bordered"
                        placeholder="যেমন: 2"
                      />
                    </div>
                  )}

                  {isPoultry && (
                    <>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Pieces *</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          name="pieces"
                          value={itemForm.pieces}
                          onChange={handleItemChange}
                          className="input input-bordered"
                          placeholder="পিস"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Weight (KG) *</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="weight"
                          value={itemForm.weight}
                          onChange={handleItemChange}
                          className="input input-bordered"
                          placeholder="ওজন (কেজি)"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Selling Price *</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="sellingPrice"
                      value={itemForm.sellingPrice}
                      onChange={handleItemChange}
                      className="input input-bordered"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addProductToCart}
                  className="btn btn-primary mt-4 w-full gap-2"
                >
                  <FaPlus />
                  Invoice-এ যোগ করুন
                </button>
              </div>
            )}
          </div>

          {/* Customer & Payment */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <FaCalculator className="text-primary" />
              <h2 className="text-lg font-bold">Customer & Payment</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Customer Name
                    {due > 0 && <span className="text-error"> *</span>}
                  </span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={due > 0 ? "Customer Name বাধ্যতামূলক" : "Cash Customer (Optional)"}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Payment Method</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="select select-bordered"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Discount (৳)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Paid Amount</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className="input input-bordered"
                />
              </div>

              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">নোট</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="অন্যান্য তথ্য..."
                  className="textarea textarea-bordered min-h-20"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-base-300 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => resetPOS(true)}
                disabled={saving}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={saving || cart.length === 0}
                className="btn btn-primary gap-2"
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    বিক্রি হচ্ছে...
                  </>
                ) : (
                  <>
                    <FaCashRegister />
                    বিক্রি সম্পন্ন করুন
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN - Invoice Summary (এখানে ref যুক্ত করা হয়েছে) */}
        <div className="lg:col-span-1" ref={invoiceSummaryRef}>
          <div className="sticky top-5 rounded-2xl border border-base-300 bg-base-100 shadow-sm">
            <div className="border-b border-base-300 p-5">
              <div className="flex items-center gap-2">
                <FaCashRegister className="text-primary" />
                <h2 className="text-lg font-bold">Invoice Summary</h2>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {cart.length === 0 ? (
                <div className="rounded-xl bg-base-200 p-5 text-center">
                  <FaShoppingCart className="mx-auto mb-2 text-2xl text-base-content/30" />
                  <p className="text-sm text-base-content/50">কোনো Product যোগ করা হয়নি</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Products</span>
                    <span className="badge badge-primary">{cart.length}</span>
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={item.productId} className="rounded-xl border border-base-300 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold">
                              {index + 1}. {item.productName}
                            </p>
                            <p className="text-xs text-base-content/50">
                              {item.categoryName || "Category নেই"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="btn btn-xs btn-circle btn-ghost text-error"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                          <span className="text-base-content/60">
                            {item.unit === "কেজি + পিস"
                              ? `${item.pieces} পিস × ৳${Number(item.sellingPrice).toFixed(2)}/KG`
                              : `${item.quantity} ${item.unit || ""} × ৳${Number(
                                  item.sellingPrice
                                ).toFixed(2)}`}
                          </span>

                          <span className="font-bold">৳ {Number(item.totalAmount).toFixed(2)}</span>
                        </div>

                        {item.unit === "কেজি + পিস" && (
                          <p className="mt-1 text-xs text-base-content/50">
                            ওজন: {item.weight} KG
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calculations */}
              <div className="flex justify-between border-t border-base-300 pt-4 text-sm">
                <span className="text-base-content/60">Subtotal</span>
                <span className="font-semibold">৳ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Discount</span>
                <span className="font-semibold text-warning">− ৳ {discountAmount.toFixed(2)}</span>
              </div>

              <div className="rounded-xl bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Total</span>
                  <span className="text-2xl font-bold text-primary">৳ {netTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Paid</span>
                <span className="font-semibold text-success">৳ {paid.toFixed(2)}</span>
              </div>

              <div className={`rounded-xl p-4 ${due > 0 ? "bg-error/10" : "bg-success/10"}`}>
                <div className="flex justify-between">
                  <span className="font-semibold">Due</span>
                  <span className={`font-bold ${due > 0 ? "text-error" : "text-success"}`}>
                    ৳ {due.toFixed(2)}
                  </span>
                </div>
                {due > 0 ? (
                  <p className="mt-2 text-xs text-error">Customer Name আবশ্যক</p>
                ) : (
                  <p className="mt-2 text-xs text-success">সম্পূর্ণ পরিশোধিত</p>
                )}
              </div>

              <div className="rounded-xl bg-base-200 p-4">
                <p className="text-xs text-base-content/50">Customer</p>
                <p className="mt-1 font-semibold">
                  {customerName.trim() ? customerName : "Walk-in Customer"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;