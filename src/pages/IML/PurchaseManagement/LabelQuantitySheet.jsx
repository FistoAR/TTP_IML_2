// LabelQuantitySheet.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";

// Order-level key for global completion
const orderGlobalKey = (orderId) => `order_${orderId}_global`;

const LabelQuantitySheet = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // state from navigation:
  // - orderId required to show single order details
  // - companyName is optional (we derive from order if missing)
  // - productCategory & size are optional preselects (only when coming from Update button)
  const {
    orderId,
    companyName: incomingCompany,
    productCategory: preCategory,
    size: preSize,
  } = location.state || {};

  // UI state
  const [order, setOrder] = useState(null);
  const [companyName, setCompanyName] = useState(incomingCompany || "");
  const [loading, setLoading] = useState(true);

  // Dropdown selection
  const [selectedCategory, setSelectedCategory] = useState(preCategory || "");
  const [selectedSize, setSelectedSize] = useState(preSize || "");

  // Derived product (based on dropdowns)
  const [currentProduct, setCurrentProduct] = useState(null);

  // Quantity inputs
  const [lidQtyReceived, setLidQtyReceived] = useState("");
  const [tubQtyReceived, setTubQtyReceived] = useState("");
  const [singleQtyReceived, setSingleQtyReceived] = useState("");

  // Completion checkboxes
  const [productComplete, setProductComplete] = useState(false);
  const [globalComplete, setGlobalComplete] = useState(false);

  // History
  const [history, setHistory] = useState([]);

  // Load order
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const allOrders = JSON.parse(stored);
      const found = allOrders.find((o) => o.id === orderId);
      if (found) {
        setOrder(found);
        setCompanyName(
          found.contact?.company || incomingCompany || "Unknown Company"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, incomingCompany]);

  // Build dropdown options from this order’s products moved to purchase
  const purchaseProducts = useMemo(
    () => order?.products?.filter((p) => p.moveToPurchase) || [],
    [order]
  );

  const categories = useMemo(() => {
    const set = new Set();
    purchaseProducts.forEach((p) => set.add(p.productName));
    return Array.from(set).sort();
  }, [purchaseProducts]);

  const sizesForSelectedCategory = useMemo(() => {
    const set = new Set();
    purchaseProducts
      .filter((p) => !selectedCategory || p.productName === selectedCategory)
      .forEach((p) => set.add(p.size));
    return Array.from(set).sort();
  }, [purchaseProducts, selectedCategory]);

  // Resolve current product from dropdowns
  useEffect(() => {
    if (!order) return;

    if (selectedCategory && selectedSize) {
      const match = purchaseProducts.find(
        (p) => p.productName === selectedCategory && p.size === selectedSize
      );
      setCurrentProduct(match || null);
    } else {
      setCurrentProduct(null);
    }
  }, [order, purchaseProducts, selectedCategory, selectedSize]);

  // Load history (order-wide and product-specific completion)
  const loadHistoryAndCompletion = () => {
    const raw = localStorage.getItem(STORAGE_KEY_LABEL_QTY);
    const all = raw ? JSON.parse(raw) : {};

    // Order-wide global complete
    const globalKey = orderGlobalKey(orderId);
    setGlobalComplete(Boolean(all[globalKey]?.globalComplete));

    // Build full order history by flattening product histories
    const entries = [];
    Object.keys(all).forEach((key) => {
      const rec = all[key];
      if (rec?.orderId === orderId && rec?.entryType === "product") {
        if (Array.isArray(rec.history)) {
          rec.history.forEach((h) => {
            entries.push({
              ...h,
              productCategory: rec.productCategory,
              size: rec.size,
              imlType: rec.imlType,
            });
          });
        }
      }
    });

    // Sort by date desc
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistory(entries);

    // Load current product values if selected
    if (currentProduct) {
      const prodKey = `${orderId}_${currentProduct.id}`;
      const prodRec = all[prodKey] || null;
      if (prodRec) {
        if (currentProduct.imlType === "LID & TUB") {
          setLidQtyReceived(prodRec.lidReceivedQuantity ?? "");
          setTubQtyReceived(prodRec.tubReceivedQuantity ?? "");
          setProductComplete(Boolean(prodRec.productComplete));
          setSingleQtyReceived("");
        } else {
          setSingleQtyReceived(prodRec.receivedQuantity ?? "");
          setProductComplete(Boolean(prodRec.productComplete));
          setLidQtyReceived("");
          setTubQtyReceived("");
        }
      }
    } else {
      setSingleQtyReceived("");
      setLidQtyReceived("");
      setTubQtyReceived("");
      setProductComplete(false);
    }
  };

  // Initial and whenever product changes, reload persisted values
  useEffect(() => {
    if (!orderId) return;
    loadHistoryAndCompletion();
  }, [orderId, currentProduct?.id]);

  // History filtered by current product (if chosen)
  const visibleHistory = useMemo(() => {
    if (!currentProduct) return history;
    return history.filter((h) => h.productId === currentProduct.id);
  }, [history, currentProduct]);

  // Save handler
  const handleSave = (finalizeProduct = false) => {
    if (!order || !currentProduct) {
      alert("Select category and size to update quantities.");
      return;
    }

    const now = new Date().toISOString();
    const raw = localStorage.getItem(STORAGE_KEY_LABEL_QTY);
    const all = raw ? JSON.parse(raw) : {};
    const prodKey = `${orderId}_${currentProduct.id}`;

    // Validate input
    if (currentProduct.imlType === "LID & TUB") {
      const lidVal = parseInt(lidQtyReceived || "0", 10);
      const tubVal = parseInt(tubQtyReceived || "0", 10);

      if (isNaN(lidVal) || lidVal < 0 || isNaN(tubVal) || tubVal < 0) {
        alert("Please enter valid received quantities for LID and TUB.");
        return;
      }

      all[prodKey] = {
        entryType: "product",
        orderId,
        orderNumber: order.orderNumber,
        productId: currentProduct.id,
        companyName,
        productCategory: currentProduct.productName,
        size: currentProduct.size,
        imlName: currentProduct.imlName,
        imlType: currentProduct.imlType,
        lidOrderQty: currentProduct.lidLabelQty || 0,
        tubOrderQty: currentProduct.tubLabelQty || 0,
        lidReceivedQuantity: lidVal,
        tubReceivedQuantity: tubVal,
        productComplete: finalizeProduct ? true : productComplete,
        updatedAt: now,
        // append to history array inline
        history: [
          ...(all[prodKey]?.history || []),
          {
            date: now,
            productId: currentProduct.id,
            productCategory: currentProduct.productName,
            size: currentProduct.size,
            imlType: currentProduct.imlType,
            lidReceivedQuantity: lidVal,
            tubReceivedQuantity: tubVal,
            productComplete: finalizeProduct ? true : productComplete,
          },
        ],
      };
    } else {
      const qtyVal = parseInt(singleQtyReceived || "0", 10);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        alert("Please enter a valid received quantity.");
        return;
      }

      all[prodKey] = {
        entryType: "product",
        orderId,
        orderNumber: order.orderNumber,
        productId: currentProduct.id,
        companyName,
        productCategory: currentProduct.productName,
        size: currentProduct.size,
        imlName: currentProduct.imlName,
        imlType: currentProduct.imlType,
        orderQuantity: currentProduct.imlType.includes("LID")
          ? currentProduct.lidLabelQty
          : currentProduct.tubLabelQty,
        receivedQuantity: qtyVal,
        productComplete: finalizeProduct ? true : productComplete,
        updatedAt: now,
        history: [
          ...(all[prodKey]?.history || []),
          {
            date: now,
            productId: currentProduct.id,
            productCategory: currentProduct.productName,
            size: currentProduct.size,
            imlType: currentProduct.imlType,
            receivedQuantity: qtyVal,
            productComplete: finalizeProduct ? true : productComplete,
          },
        ],
      };
    }

    localStorage.setItem(STORAGE_KEY_LABEL_QTY, JSON.stringify(all));
    loadHistoryAndCompletion();

    alert(
      finalizeProduct ? "✅ Product marked complete!" : "💾 Saved successfully!"
    );
  };

  // Global completion toggle (order-wide)
  const handleGlobalCompleteToggle = (checked) => {
    const raw = localStorage.getItem(STORAGE_KEY_LABEL_QTY);
    const all = raw ? JSON.parse(raw) : {};
    const globalKey = orderGlobalKey(orderId);
    const now = new Date().toISOString();

    all[globalKey] = {
      entryType: "global",
      orderId,
      companyName,
      globalComplete: checked,
      updatedAt: now,
      history: [
        ...(all[globalKey]?.history || []),
        {
          date: now,
          globalComplete: checked,
        },
      ],
    };

    localStorage.setItem(STORAGE_KEY_LABEL_QTY, JSON.stringify(all));
    setGlobalComplete(checked);
    loadHistoryAndCompletion();
    alert(
      checked
        ? "✅ All products marked as complete for this order!"
        : "⏸️ Global completion removed."
    );
  };

  const handleBack = () => {
    navigate("/iml/purchase", {
      state: { activeSheet: "label" },
    });
  };

  // Prefill dropdowns when coming from Update button
  useEffect(() => {
    if (preCategory && categories.includes(preCategory)) {
      setSelectedCategory(preCategory);
    }
    if (preSize) {
      setSelectedSize(preSize);
    }
  }, [preCategory, preSize, categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Invalid Access
          </h2>
          <p className="text-gray-600 mb-4">
            Order not found or missing orderId
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
          >
            Back to Purchase Management
          </button>
        </div>
      </div>
    );
  }

  const contactName = order.contact?.contactName || "N/A";
  const phone = order.contact?.phone || "N/A";

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
          <button
            className="flex gap-[.5vw] items-center cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[1vw] h-[1vw]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw]">Back</span>
          </button>
          <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
            Label Quantity Sheet
          </h1>
          <div className="w-[3vw]"></div>
        </div>

        <div className="px-[1.5vw] py-[1vw] max-h-[80vh] overflow-auto">
          {/* Order Basic Details (no order selection; full view) */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mb-[1vw]">
            <h3 className="text-[1vw] font-semibold text-blue-900 mb-[.5vw]">
              Order information
            </h3>
            <div className="grid grid-cols-4 gap-[1.2vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Company name
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border border-gray-300 bg-white rounded-[0.5vw] font-semibold">
                  {companyName}
                </div>
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Contact name
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border border-gray-300 bg-white rounded-[0.5vw] font-semibold">
                  {contactName}
                </div>
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Contact number
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border border-gray-300 bg-white rounded-[0.5vw] font-semibold">
                  {phone}
                </div>
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Order number
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border border-gray-300 bg-white rounded-[0.5vw] font-semibold">
                  {order.orderNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Product selection (category + size) */}
          <div className="grid grid-cols-2 gap-[1vw]">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
              <h3 className="text-[1vw] font-semibold text-purple-900 mb-[1vw]">
                Select product
              </h3>
              <div className="grid grid-cols-2 gap-[1.2vw]">
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSize("");
                    }}
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  >
                    <option value="">Select size</option>
                    {sizesForSelectedCategory.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentProduct && (
                <>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mt-[1vw]">
                    <h3 className="text-[1vw] font-semibold text-blue-900 mb-[1vw]">
                      Product details
                    </h3>
                    <div className="grid grid-cols-3 gap-[1vw]">
                      <div>
                        <label className="block text-[.75vw] font-medium text-gray-700 mb-[0.3vw]">
                          IML name
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800">
                          {currentProduct.imlName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.75vw] font-medium text-gray-700 mb-[0.3vw]">
                          IML type
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-semibold text-blue-800">
                          {currentProduct.imlType}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.75vw] font-medium text-gray-700 mb-[0.3vw]">
                          Order quantity
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800">
                          {currentProduct.imlType === "LID & TUB"
                            ? `LID: ${currentProduct.lidLabelQty || 0} | TUB: ${
                                currentProduct.tubLabelQty || 0
                              }`
                            : currentProduct.imlType.includes("LID")
                            ? currentProduct.lidLabelQty || 0
                            : currentProduct.tubLabelQty || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              {!currentProduct ? (
                <div className="bg-gray-50 rounded-[0.6vw] border-2 border-dashed border-gray-300 p-[3vw] text-center">
                  <svg
                    className="w-[4vw] h-[4vw] mx-auto text-gray-400 mb-[1vw]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                    />
                  </svg>
                  <p className="text-[1vw] text-gray-600 font-medium">
                    Choose category and size to view details
                  </p>
                </div>
              ) : (
                <>
                  {/* Quantity Inputs */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw] h-full">
                    <h3 className="text-[1vw] font-semibold text-green-900 mb-[1vw]">
                      Label received quantity
                    </h3>

                    {currentProduct.imlType === "LID & TUB" ? (
                      <div className="grid grid-cols-2 gap-[1vw]">
                        <div>
                          <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            LID received quantity
                          </label>
                          <input
                            type="number"
                            placeholder="Enter LID received quantity"
                            value={lidQtyReceived}
                            onChange={(e) => setLidQtyReceived(e.target.value)}
                            min="0"
                            className="w-full text-[.9vw] px-[1vw] py-[0.5vw] border-2 border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            TUB received quantity
                          </label>
                          <input
                            type="number"
                            placeholder="Enter TUB received quantity"
                            value={tubQtyReceived}
                            onChange={(e) => setTubQtyReceived(e.target.value)}
                            min="0"
                            className="w-full text-[.9vw] px-[1vw] py-[0.5vw] border-2 border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                          Received quantity
                        </label>
                        <input
                          type="number"
                          placeholder="Enter received quantity"
                          value={singleQtyReceived}
                          onChange={(e) => setSingleQtyReceived(e.target.value)}
                          min="0"
                          className="w-full text-[.9vw] px-[1vw] py-[0.5vw] border-2 border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                      </div>
                    )}

                    {/* Completion checkboxes */}
                    <div className="mt-[1vw] grid grid-cols-2 gap-[1vw]">
                      <div className="flex items-center gap-[0.75vw] p-[0.75vw] bg-white rounded-[0.5vw] border border-gray-300">
                        <input
                          type="checkbox"
                          id="productComplete"
                          checked={productComplete}
                          onChange={(e) => setProductComplete(e.target.checked)}
                          className="w-[1.2vw] h-[1.2vw] cursor-pointer accent-green-600"
                        />
                        <label
                          htmlFor="productComplete"
                          className="text-[.85vw] font-medium text-gray-700 cursor-pointer"
                        >
                          All labels received for this product
                        </label>
                      </div>
                      <div className="flex items-center gap-[0.75vw] p-[0.75vw] bg-white rounded-[0.5vw] border border-gray-300">
                        <input
                          type="checkbox"
                          id="globalComplete"
                          checked={globalComplete}
                          onChange={(e) =>
                            handleGlobalCompleteToggle(e.target.checked)
                          }
                          className="w-[1.2vw] h-[1.2vw] cursor-pointer accent-green-600"
                        />
                        <label
                          htmlFor="globalComplete"
                          className="text-[.85vw] font-medium text-gray-700 cursor-pointer"
                        >
                          Mark all labels received for all products in this
                          order
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product details + quantity inputs */}
          <div className="space-y-[1vw]">
            {/* History (full by default; filters when a product is selected) */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw] mt-[1vw]">
              <h3 className="text-[1vw] font-semibold text-amber-900 mb-[1vw]">
                Received history
              </h3>
              {visibleHistory.length === 0 ? (
                <p className="text-[.85vw] text-gray-600">No history yet.</p>
              ) : (
                <div className="overflow-auto max-h-[28vh]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-amber-100">
                        <th className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-left text-[.8vw] font-semibold text-amber-900">
                          Date
                        </th>
                        <th className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-left text-[.8vw] font-semibold text-amber-900">
                          Product
                        </th>
                        <th className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-left text-[.8vw] font-semibold text-amber-900">
                          IML type
                        </th>
                        <th className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-center text-[.8vw] font-semibold text-amber-900">
                          Quantity
                        </th>
                        <th className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-center text-[.8vw] font-semibold text-amber-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleHistory.map((entry, idx) => {
                        const dateText =
                          new Date(entry.date).toLocaleDateString(
                            "en-IN"
                          ) +
                          " " +
                          new Date(entry.date).toLocaleTimeString(
                            "en-IN",
                            { hour: "2-digit", minute: "2-digit" }
                          );

                        // const dateN = entry.date;

                        const qtyCell =
                          entry.imlType === "LID & TUB"
                            ? `LID: ${entry.lidReceivedQuantity ?? 0} | TUB: ${
                                entry.tubReceivedQuantity ?? 0
                              }`
                            : `${entry.receivedQuantity ?? 0}`;

                        return (
                          <tr key={idx} className="hover:bg-amber-50">
                            <td className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-[.8vw] text-gray-700">
                              {dateText}
                            </td>
                            <td className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-[.8vw] text-gray-700">
                              {entry.productCategory} ({entry.size})
                            </td>
                            <td className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-[.8vw] text-gray-700">
                              {entry.imlType}
                            </td>
                            <td className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-[.8vw] text-gray-800 text-center font-semibold">
                              {qtyCell}
                            </td>
                            <td className="border border-amber-300 px-[0.75vw] py-[0.5vw] text-center">
                              {entry.productComplete ? (
                                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[.75vw] font-semibold">
                                  ✓ Complete
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">
                                  Partial
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-[1vw] my-[1vw]">
            {currentProduct && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedSize("");
                  setCurrentProduct(null);
                  setSingleQtyReceived("");
                  setLidQtyReceived("");
                  setTubQtyReceived("");
                  setProductComplete(false);
                }}
                className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer"
              >
                Clear selection
              </button>
            )}
            <button
              onClick={() => handleSave(false)}
              className="px-[1.5vw] py-[.6vw] bg-blue-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:bg-blue-700 transition-all shadow-md cursor-pointer"
            >
              💾 Save
            </button>
            <button
              onClick={() => handleSave(true)}
              className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer"
            >
              ✓ Submit (complete product)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelQuantitySheet;
