import { useEffect, useMemo, useState } from "react";
import {
  FaCalculator,
  FaCashRegister,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { productAPI, salesAPI } from "../services/api";

const EMPTY_ITEM = {
  productId: "",
  quantity: "",
  pieces: "",
  weight: "",
  sellingPrice: "",
};

const PAYMENT_METHODS = [
  "ক্যাশ",
  "Nagad",
  "bKash",
  "অন্যান্য",
];

const POS = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [itemForm, setItemForm] =
    useState({
      ...EMPTY_ITEM,
    });

  const [customerName, setCustomerName] =
    useState("");

  const [discount, setDiscount] =
    useState("");

  const [paidAmount, setPaidAmount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("ক্যাশ");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  // ==========================================
  // Load Products
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response =
          await productAPI.getAll();

        if (!cancelled) {
          setProducts(
            response.data || []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Load Products Error:",
            error
          );

          toast.error(
            error.message ||
              "Product-এর তালিকা লোড করা যায়নি"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // Search
  // ==========================================

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter(
      (product) => {
        const name =
          product.name?.toLowerCase() ||
          "";

        const brand =
          product.brand?.toLowerCase() ||
          "";

        const category =
          product.categoryName
            ?.toLowerCase() || "";

        return (
          name.includes(keyword) ||
          brand.includes(keyword) ||
          category.includes(keyword)
        );
      }
    );
  }, [products, search]);

  // ==========================================
  // Select Product
  // ==========================================

  const selectProduct = (product) => {
    setSelectedProduct(product);

    setItemForm({
      productId: product._id,
      quantity: "",
      pieces: "",
      weight: "",
      sellingPrice:
        product.sellingPrice ??
        product.salePrice ??
        "",
    });

    setSearch("");
  };

  // ==========================================
  // Clear Product
  // ==========================================

  const clearSelectedProduct = () => {
    setSelectedProduct(null);

    setItemForm({
      ...EMPTY_ITEM,
    });
  };

  const isPoultry =
    selectedProduct?.unit ===
    "কেজি + পিস";

  // ==========================================
  // Available Stock
  // ==========================================

  const availableStock = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    if (isPoultry) {
      return {
        pieces:
          Number(
            selectedProduct.stockPieces
          ) || 0,

        weight:
          Number(
            selectedProduct.totalWeight
          ) || 0,
      };
    }

    return {
      quantity:
        Number(
          selectedProduct.stockQuantity
        ) || 0,
    };
  }, [
    selectedProduct,
    isPoultry,
  ]);

  // ==========================================
  // Item Change
  // ==========================================

  const handleItemChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setItemForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // Add Product
  // ==========================================

  const addProductToCart = () => {
    if (!selectedProduct) {
      toast.error(
        "প্রথমে Product নির্বাচন করুন"
      );
      return;
    }

    const price =
      Number(
        itemForm.sellingPrice
      ) || 0;

    if (price <= 0) {
      toast.error(
        "Selling Price দিন"
      );
      return;
    }

    // ========================================
    // Poultry
    // ========================================

    if (isPoultry) {
      const pieces =
        Number(itemForm.pieces) || 0;

      const weight =
        Number(itemForm.weight) || 0;

      if (pieces <= 0) {
        toast.error("Pieces দিন");
        return;
      }

      if (weight <= 0) {
        toast.error("Weight দিন");
        return;
      }

      if (
        pieces >
        availableStock.pieces
      ) {
        toast.error(
          `পর্যাপ্ত Pieces stock নেই। Available: ${availableStock.pieces}`
        );
        return;
      }

      if (
        weight >
        availableStock.weight
      ) {
        toast.error(
          `পর্যাপ্ত Weight stock নেই। Available: ${availableStock.weight} KG`
        );
        return;
      }

      const existingIndex =
        cart.findIndex(
          (item) =>
            item.productId ===
            selectedProduct._id
        );

      if (existingIndex !== -1) {
        const existingItem =
          cart[existingIndex];

        const newPieces =
          Number(
            existingItem.pieces
          ) + pieces;

        const newWeight =
          Number(
            existingItem.weight
          ) + weight;

        if (
          newPieces >
          availableStock.pieces
        ) {
          toast.error(
            "এই Product-এর মোট Pieces stock-এর বেশি হয়ে যাচ্ছে"
          );
          return;
        }

        if (
          newWeight >
          availableStock.weight
        ) {
          toast.error(
            "এই Product-এর মোট Weight stock-এর বেশি হয়ে যাচ্ছে"
          );
          return;
        }

        const updatedCart = [
          ...cart,
        ];

        updatedCart[
          existingIndex
        ] = {
          ...existingItem,
          pieces: newPieces,
          weight: newWeight,
          sellingPrice: price,
          totalAmount: Number(
            (
              newWeight * price
            ).toFixed(2)
          ),
        };

        setCart(updatedCart);
      } else {
        setCart((previous) => [
          ...previous,
          {
            productId:
              selectedProduct._id,

            productName:
              selectedProduct.name,

            categoryId:
              selectedProduct.categoryId ||
              null,

            categoryName:
              selectedProduct.categoryName ||
              "",

            unit:
              selectedProduct.unit,

            quantity: null,

            pieces,
            weight,

            sellingPrice: price,

            totalAmount: Number(
              (
                weight * price
              ).toFixed(2)
            ),
          },
        ]);
      }
    }

    // ========================================
    // Normal Product
    // ========================================

    else {
      const quantity =
        Number(itemForm.quantity) || 0;

      if (quantity <= 0) {
        toast.error("Quantity দিন");
        return;
      }

      if (
        quantity >
        availableStock.quantity
      ) {
        toast.error(
          `পর্যাপ্ত stock নেই। Available: ${availableStock.quantity}`
        );
        return;
      }

      const existingIndex =
        cart.findIndex(
          (item) =>
            item.productId ===
            selectedProduct._id
        );

      if (existingIndex !== -1) {
        const existingItem =
          cart[existingIndex];

        const newQuantity =
          Number(
            existingItem.quantity
          ) + quantity;

        if (
          newQuantity >
          availableStock.quantity
        ) {
          toast.error(
            "এই Product-এর মোট Quantity stock-এর বেশি হয়ে যাচ্ছে"
          );
          return;
        }

        const updatedCart = [
          ...cart,
        ];

        updatedCart[
          existingIndex
        ] = {
          ...existingItem,
          quantity:
            newQuantity,
          sellingPrice: price,
          totalAmount: Number(
            (
              newQuantity * price
            ).toFixed(2)
          ),
        };

        setCart(updatedCart);
      } else {
        setCart((previous) => [
          ...previous,
          {
            productId:
              selectedProduct._id,

            productName:
              selectedProduct.name,

            categoryId:
              selectedProduct.categoryId ||
              null,

            categoryName:
              selectedProduct.categoryName ||
              "",

            unit:
              selectedProduct.unit,

            quantity,

            pieces: null,
            weight: null,

            sellingPrice: price,

            totalAmount: Number(
              (
                quantity * price
              ).toFixed(2)
            ),
          },
        ]);
      }
    }

    clearSelectedProduct();
  };

  // ==========================================
  // Remove
  // ==========================================

  const removeCartItem = (
    productId
  ) => {
    setCart((previous) =>
      previous.filter(
        (item) =>
          item.productId !==
          productId
      )
    );
  };

  // ==========================================
  // Subtotal
  // ==========================================

  const subtotal = useMemo(() => {
    return Number(
      cart
        .reduce(
          (sum, item) =>
            sum +
            (
              Number(
                item.totalAmount
              ) || 0
            ),
          0
        )
        .toFixed(2)
    );
  }, [cart]);

  // ==========================================
  // Discount
  // ==========================================

  const discountAmount =
    Math.max(
      0,
      Number(discount) || 0
    );

  // ==========================================
  // Net Total
  // ==========================================

  const netTotal = Math.max(
    0,
    Number(
      (
        subtotal -
        discountAmount
      ).toFixed(2)
    )
  );

  // ==========================================
  // Paid
  // ==========================================

  const paid = Math.max(
    0,
    Number(paidAmount) || 0
  );

  // ==========================================
  // Due
  // ==========================================

  const due = Math.max(
    0,
    Number(
      (
        netTotal -
        paid
      ).toFixed(2)
    )
  );

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (cart.length === 0) {
      toast.error(
        "কমপক্ষে একটি Product যোগ করুন"
      );
      return;
    }

    if (
      discountAmount >
      subtotal
    ) {
      toast.error(
        "Discount Subtotal-এর চেয়ে বেশি হতে পারবে না"
      );
      return;
    }

    if (paid > netTotal) {
      toast.error(
        "Paid Amount Net Total-এর চেয়ে বেশি হতে পারবে না"
      );
      return;
    }

    // ========================================
    // Customer only required for Due
    // ========================================

    if (
      due > 0 &&
      !customerName.trim()
    ) {
      toast.error(
        "Due থাকলে Customer Name দিতে হবে"
      );
      return;
    }

    const items = cart.map(
      (item) => ({
        productId:
          item.productId,

        quantity:
          item.quantity ?? 0,

        pieces:
          item.pieces ?? 0,

        weight:
          item.weight ?? 0,

        sellingPrice:
          Number(
            item.sellingPrice
          ) || 0,
      })
    );

    const saleData = {
      customerName:
        customerName.trim(),

      items,

      discount:
        discountAmount,

      paidAmount:
        paid,

      paymentMethod,

      notes:
        notes.trim(),
    };

    try {
      setSaving(true);

      await salesAPI.create(
        saleData
      );

      toast.success(
        "বিক্রয় সফলভাবে সম্পন্ন হয়েছে"
      );

      // ======================================
      // Refresh Products
      // ======================================

      try {
        const response =
          await productAPI.getAll();

        setProducts(
          response.data || []
        );
      } catch (refreshError) {
        console.error(
          "Refresh Products Error:",
          refreshError
        );
      }

      resetPOS();
    } catch (error) {
      console.error(
        "Create Sale Error:",
        error
      );

      toast.error(
        error.message ||
          "বিক্রয় সম্পন্ন করা যায়নি"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Reset
  // ==========================================

  const resetPOS = () => {
    setCart([]);
    setSelectedProduct(null);

    setItemForm({
      ...EMPTY_ITEM,
    });

    setCustomerName("");
    setDiscount("");
    setPaidAmount("");
    setPaymentMethod("ক্যাশ");
    setNotes("");
    setSearch("");
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
          POS
        </h1>

        <p className="mt-1 text-sm text-base-content/60">
          এক Customer-এর জন্য একাধিক Product একসাথে বিক্রয় করুন
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ====================================
            LEFT
        ==================================== */}

        <div className="space-y-5 lg:col-span-2">

          {/* Product Selection */}

          <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">

            <div className="mb-4 flex items-center gap-2">
              <FaShoppingCart className="text-primary" />

              <h2 className="text-lg font-bold">
                Product নির্বাচন
              </h2>
            </div>

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
                placeholder="Product-এর নাম, Brand বা Category দিয়ে খুঁজুন..."
                className="input input-bordered w-full pl-11"
              />

            </div>

            {search &&
              !selectedProduct && (
                <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-base-300">

                  {loadingProducts ? (
                    <div className="p-6 text-center">
                      <span className="loading loading-spinner" />
                    </div>
                  ) : filteredProducts.length ===
                    0 ? (
                    <div className="p-6 text-center text-sm text-base-content/50">
                      কোনো Product পাওয়া যায়নি
                    </div>
                  ) : (
                    filteredProducts.map(
                      (product) => (
                        <button
                          key={
                            product._id
                          }
                          type="button"
                          onClick={() =>
                            selectProduct(
                              product
                            )
                          }
                          className="flex w-full items-center justify-between border-b border-base-200 p-4 text-left last:border-b-0 hover:bg-base-200"
                        >
                          <div>
                            <p className="font-semibold">
                              {
                                product.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-base-content/50">
                              {
                                product.categoryName ||
                                "Category নেই"
                              }
                            </p>
                          </div>

                          <div className="text-right">

                            {product.unit ===
                            "কেজি + পিস" ? (
                              <>
                                <p className="text-sm font-semibold">
                                  {
                                    Number(
                                      product.stockPieces
                                    ) || 0
                                  }{" "}
                                  pcs
                                </p>

                                <p className="text-xs text-base-content/50">
                                  {
                                    Number(
                                      product.totalWeight
                                    ) || 0
                                  }{" "}
                                  KG
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold">
                                {
                                  Number(
                                    product.stockQuantity
                                  ) || 0
                                }{" "}
                                {
                                  product.unit
                                }
                              </p>
                            )}

                          </div>
                        </button>
                      )
                    )
                  )}

                </div>
              )}

            {/* Selected Product */}

            {selectedProduct && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-lg font-bold">
                      {
                        selectedProduct.name
                      }
                    </p>

                    <p className="mt-1 text-sm text-base-content/60">
                      {
                        selectedProduct.categoryName
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      clearSelectedProduct
                    }
                    className="btn btn-sm btn-circle btn-ghost"
                  >
                    <FaTimes />
                  </button>

                </div>

                {/* Stock */}

                <div className="mt-4 grid grid-cols-2 gap-3">

                  {isPoultry ? (
                    <>
                      <div className="rounded-xl bg-base-100 p-3">
                        <p className="text-xs text-base-content/50">
                          Available Pieces
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {
                            availableStock.pieces
                          }
                        </p>
                      </div>

                      <div className="rounded-xl bg-base-100 p-3">
                        <p className="text-xs text-base-content/50">
                          Available Weight
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {
                            availableStock.weight
                          }{" "}
                          KG
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 rounded-xl bg-base-100 p-3">
                      <p className="text-xs text-base-content/50">
                        Available Stock
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {
                          availableStock.quantity
                        }{" "}
                        {
                          selectedProduct.unit
                        }
                      </p>
                    </div>
                  )}

                </div>

                {/* Item Form */}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  {!isPoultry && (
                    <div className="form-control">

                      <label className="label">
                        <span className="label-text font-semibold">
                          Quantity *
                        </span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        name="quantity"
                        value={
                          itemForm.quantity
                        }
                        onChange={
                          handleItemChange
                        }
                        className="input input-bordered"
                        placeholder="যেমন: 2"
                      />

                    </div>
                  )}

                  {isPoultry && (
                    <>
                      <div className="form-control">

                        <label className="label">
                          <span className="label-text font-semibold">
                            Pieces *
                          </span>
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          name="pieces"
                          value={
                            itemForm.pieces
                          }
                          onChange={
                            handleItemChange
                          }
                          className="input input-bordered"
                        />

                      </div>

                      <div className="form-control">

                        <label className="label">
                          <span className="label-text font-semibold">
                            Weight (KG) *
                          </span>
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="weight"
                          value={
                            itemForm.weight
                          }
                          onChange={
                            handleItemChange
                          }
                          className="input input-bordered"
                        />

                      </div>
                    </>
                  )}

                  <div className="form-control">

                    <label className="label">
                      <span className="label-text font-semibold">
                        Selling Price *
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="sellingPrice"
                      value={
                        itemForm.sellingPrice
                      }
                      onChange={
                        handleItemChange
                      }
                      className="input input-bordered"
                    />

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    addProductToCart
                  }
                  className="btn btn-primary mt-4 w-full gap-2"
                >
                  <FaPlus />
                  Invoice-এ Product যোগ করুন
                </button>

              </div>
            )}

          </div>

          {/* Customer / Payment */}

          <form
            onSubmit={
              handleSubmit
            }
            className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
          >

            <div className="mb-5 flex items-center gap-2">
              <FaCalculator className="text-primary" />

              <h2 className="text-lg font-bold">
                Customer & Payment
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Customer */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-semibold">
                    Customer Name
                    {due > 0 && (
                      <span className="text-error">
                        {" "}*
                      </span>
                    )}
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(event) =>
                    setCustomerName(
                      event.target.value
                    )
                  }
                  placeholder={
                    due > 0
                      ? "Due-এর Customer Name দিন"
                      : "Cash customer হলে optional"
                  }
                  className="input input-bordered"
                />

                {due > 0 && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      Due থাকায় Customer Name required
                    </span>
                  </label>
                )}

              </div>

              {/* Payment Method */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-semibold">
                    Payment Method
                  </span>
                </label>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  className="select select-bordered"
                >
                  {PAYMENT_METHODS.map(
                    (method) => (
                      <option
                        key={method}
                        value={method}
                      >
                        {method}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* Discount */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-semibold">
                    Discount (৳)
                  </span>
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    discount
                  }
                  onChange={(event) =>
                    setDiscount(
                      event.target.value
                    )
                  }
                  placeholder="যেমন: 50"
                  className="input input-bordered"
                />

              </div>

              {/* Paid */}

              <div className="form-control">

                <label className="label">
                  <span className="label-text font-semibold">
                    Paid Amount
                  </span>
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    paidAmount
                  }
                  onChange={(event) =>
                    setPaidAmount(
                      event.target.value
                    )
                  }
                  placeholder="যত টাকা দিয়েছে"
                  className="input input-bordered"
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
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="অতিরিক্ত তথ্য..."
                  className="textarea textarea-bordered min-h-20"
                />

              </div>

            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-base-300 pt-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  resetPOS
                }
                disabled={saving}
                className="btn btn-ghost"
              >
                বাতিল
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  cart.length === 0
                }
                className="btn btn-primary gap-2"
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    বিক্রয় হচ্ছে...
                  </>
                ) : (
                  <>
                    <FaCashRegister />
                    বিক্রয় সম্পন্ন করুন
                  </>
                )}
              </button>

            </div>

          </form>

        </div>

        {/* ====================================
            RIGHT - Invoice Summary
        ==================================== */}

        <div className="lg:col-span-1">

          <div className="sticky top-5 rounded-2xl border border-base-300 bg-base-100 shadow-sm">

            <div className="border-b border-base-300 p-5">

              <div className="flex items-center gap-2">
                <FaCashRegister className="text-primary" />

                <h2 className="text-lg font-bold">
                  Invoice Summary
                </h2>
              </div>

            </div>

            <div className="space-y-4 p-5">

              {/* ==================================
                  Invoice Products
              ================================== */}

              {cart.length === 0 ? (
                <div className="rounded-xl bg-base-200 p-5 text-center">

                  <FaShoppingCart className="mx-auto mb-2 text-2xl text-base-content/30" />

                  <p className="text-sm text-base-content/50">
                    কোনো Product যোগ করা হয়নি
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  <div className="flex items-center justify-between">

                    <span className="font-semibold">
                      Products
                    </span>

                    <span className="badge badge-primary">
                      {cart.length}
                    </span>

                  </div>

                  <div className="space-y-2">

                    {cart.map(
                      (item, index) => (
                        <div
                          key={
                            item.productId
                          }
                          className="rounded-xl border border-base-300 p-3"
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <p className="font-bold">
                                {index + 1}.{" "}
                                {
                                  item.productName
                                }
                              </p>

                              <p className="text-xs text-base-content/50">
                                {
                                  item.categoryName ||
                                  "Category নেই"
                                }
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeCartItem(
                                  item.productId
                                )
                              }
                              className="btn btn-xs btn-circle btn-ghost text-error"
                            >
                              <FaTrash />
                            </button>

                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2 text-sm">

                            <span className="text-base-content/60">

                              {item.unit ===
                              "কেজি + পিস"
                                ? `${item.pieces} pcs × ${Number(
                                    item.sellingPrice
                                  ).toFixed(
                                    2
                                  )}/KG`
                                : `${item.quantity} ${item.unit || ""} × ${Number(
                                    item.sellingPrice
                                  ).toFixed(
                                    2
                                  )}`}

                            </span>

                            <span className="font-bold">
                              ৳{" "}
                              {Number(
                                item.totalAmount
                              ).toFixed(2)}
                            </span>

                          </div>

                          {item.unit ===
                            "কেজি + পিস" && (
                            <p className="mt-1 text-xs text-base-content/50">
                              Weight:{" "}
                              {
                                item.weight
                              }{" "}
                              KG
                            </p>
                          )}

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* ==================================
                  Subtotal
              ================================== */}

              <div className="flex justify-between border-t border-base-300 pt-4 text-sm">

                <span className="text-base-content/60">
                  Subtotal
                </span>

                <span className="font-semibold">
                  ৳{" "}
                  {subtotal.toFixed(2)}
                </span>

              </div>

              {/* Discount */}

              <div className="flex justify-between text-sm">

                <span className="text-base-content/60">
                  Discount
                </span>

                <span className="font-semibold text-warning">
                  − ৳{" "}
                  {discountAmount.toFixed(
                    2
                  )}
                </span>

              </div>

              {/* Net Total */}

              <div className="rounded-xl bg-primary/10 p-4">

                <div className="flex items-center justify-between">

                  <span className="font-semibold">
                    Net Total
                  </span>

                  <span className="text-2xl font-bold text-primary">
                    ৳{" "}
                    {netTotal.toFixed(
                      2
                    )}
                  </span>

                </div>

              </div>

              {/* Paid */}

              <div className="flex justify-between text-sm">

                <span className="text-base-content/60">
                  Paid
                </span>

                <span className="font-semibold text-success">
                  ৳{" "}
                  {paid.toFixed(2)}
                </span>

              </div>

              {/* Due */}

              <div
                className={`rounded-xl p-4 ${
                  due > 0
                    ? "bg-error/10"
                    : "bg-success/10"
                }`}
              >

                <div className="flex justify-between">

                  <span className="font-semibold">
                    Due
                  </span>

                  <span
                    className={`font-bold ${
                      due > 0
                        ? "text-error"
                        : "text-success"
                    }`}
                  >
                    ৳{" "}
                    {due.toFixed(2)}
                  </span>

                </div>

                {due > 0 ? (
                  <p className="mt-2 text-xs text-error">
                    Customer Name required
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-success">
                    সম্পূর্ণ Payment হয়েছে
                  </p>
                )}

              </div>

              {/* Customer */}

              <div className="rounded-xl bg-base-200 p-4">

                <p className="text-xs text-base-content/50">
                  Customer
                </p>

                <p className="mt-1 font-semibold">
                  {customerName.trim()
                    ? customerName
                    : "Walk-in Customer"}
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

