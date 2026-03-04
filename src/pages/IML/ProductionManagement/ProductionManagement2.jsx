// ProductionManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";
const STORAGE_KEY_PRODUCTION = "iml_production_data";
const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";

const ProductionManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [productionData, setProductionData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");

  const [activeSheet, setActiveSheet] = useState("tracking");

  // Expand states
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSizes, setExpandedSizes] = useState({});
  const [expandedColors, setExpandedColors] = useState({});

  const toNumber = (value) => {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === "number") return value;
    const numStr = String(value).replace(/,/g, "");
    const num = Number(numStr);
    return isNaN(num) ? 0 : num;
  };

  const getAllocationData = (orderId, productId) => {
    try {
      const allocationKey = `${orderId}_${productId}`;
      const existingAllocations = JSON.parse(
        localStorage.getItem("iml_production_allocation") || "{}",
      );
      const allocations = existingAllocations[allocationKey] || [];
      const totalAllocated = allocations.reduce(
        (sum, alloc) => sum + (Number(alloc.allocatedQty) || 0),
        0,
      );
      return {
        allocations,
        totalAllocated,
        origin: allocations.length > 0 ? "Remaining Allocation" : "Main Order",
      };
    } catch (error) {
      console.error("Error getting allocation data:", error);
      return { allocations: [], totalAllocated: 0, origin: "Main Order" };
    }
  };

  const getTotalLabels = (orderId, productId, imlType) => {
    const labelData = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}",
    );
    const exactKey = `${orderId}_${productId}`;
    const item = labelData[exactKey];

    if (!item) return { lidTotal: 0, tubTotal: 0, total: 0 };

    let lidTotal = 0;
    let tubTotal = 0;

    if (item.history && Array.isArray(item.history)) {
      item.history.forEach((h) => {
        const receivedQty = Number(h.receivedQuantity || 0);
        const lidQty = Number(h.lidReceivedQuantity || 0);
        const tubQty = Number(h.tubReceivedQuantity || 0);

        if (h.imlType === "LID & TUB") {
          if (lidQty > 0 || tubQty > 0) {
            lidTotal += lidQty;
            tubTotal += tubQty;
          } else {
            lidTotal += Math.floor(receivedQty / 2);
            tubTotal += receivedQty - Math.floor(receivedQty / 2);
          }
        } else if (h.imlType === "LID" || imlType === "LID") {
          const qty = lidQty > 0 ? lidQty : receivedQty;
          lidTotal += qty;
        } else if (h.imlType === "TUB" || imlType === "TUB") {
          const qty = tubQty > 0 ? tubQty : receivedQty;
          tubTotal += qty;
        } else {
          const qty = receivedQty;
          lidTotal += qty;
          tubTotal += qty;
        }
      });
    } else {
      const qty = Number(item.receivedQuantity || 0);
      if (imlType === "LID") lidTotal = qty;
      else if (imlType === "TUB") tubTotal = qty;
      else if (imlType === "LID & TUB") {
        lidTotal = Math.floor(qty / 2);
        tubTotal = qty - lidTotal;
      } else {
        lidTotal = qty;
        tubTotal = qty;
      }
    }

    return { lidTotal, tubTotal, total: lidTotal + tubTotal };
  };

  // ── NEW: Get label order qty (lidLabelQty / tubLabelQty) from imlorders ──
  const getLabelOrderQty = (orderId, productId) => {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || "[]");
      const order = orders.find((o) => o.id === orderId);
      const product = order?.products?.find((p) => p.id === productId);
      if (!product) return { lidOrdered: 0, tubOrdered: 0 };
      return {
        lidOrdered: toNumber(product.lidLabelQty || 0),
        tubOrdered: toNumber(product.tubLabelQty || 0),
      };
    } catch {
      return { lidOrdered: 0, tubOrdered: 0 };
    }
  };

  // ── NEW: Get production status directly from the product's orderStatus ──
  const getProductionStatusFromOrder = (orderId, productId) => {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || "[]");
      const order = orders.find((o) => o.id === orderId);
      const product = order?.products?.find((p) => p.id === productId);
      const status = product?.orderStatus || "";

      if (status === "Production Completed") return "Production Completed";
      if (status === "In Production") return "In Production";
      if (status === "Dispatch Pending") return "Production Completed";
      // Default: not yet started
      return "Production Pending";
    } catch {
      return "Production Pending";
    }
  };

  // Load production data
  const loadProductionData = () => {
    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const storedLabelQty = localStorage.getItem(STORAGE_KEY_LABEL_QTY);

    if (!storedOrders || !storedLabelQty) {
      setProductionData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const labelData = JSON.parse(storedLabelQty);
      const productionItems = [];

      allOrders.forEach((order) => {
        order.products?.forEach((product) => {
          const key = `${order.id}_${product.id}`;
          const labelInfo = labelData[key];

          const allocationData = getAllocationData(order.id, product.id);
          const hasAllocations = allocationData.totalAllocated > 0;

          if (!labelInfo && !hasAllocations) return;

          if (labelInfo) {
            const mainStoredProduction = localStorage.getItem(STORAGE_KEY_PRODUCTION_FOLLOWUPS);
            const mainProductionData = mainStoredProduction ? JSON.parse(mainStoredProduction) : {};
            const mainFollowups = Array.isArray(mainProductionData[key]) ? mainProductionData[key] : [];

            const labelTotals = getTotalLabels(order.id, product.id, product.imlType);
            const mainLidTotal = labelTotals.lidTotal;
            const mainTubTotal = labelTotals.tubTotal;
            const mainTotal = labelTotals.total;

            let mainLidUsed = 0;
            let mainTubUsed = 0;
            let totalUsed = 0;

            if (product.imlType === "LID & TUB") {
              mainFollowups.forEach((e) => {
                const accepted = toNumber(e.acceptedComponents || 0);
                if (e.componentType === "LID") mainLidUsed += accepted;
                else if (e.componentType === "TUB") mainTubUsed += accepted;
                else { mainLidUsed += accepted; mainTubUsed += accepted; }
              });
              totalUsed = mainLidUsed + mainTubUsed;
            } else {
              totalUsed = mainFollowups.reduce((sum, e) => sum + toNumber(e.acceptedComponents || 0), 0);
              mainLidUsed = totalUsed;
              mainTubUsed = totalUsed;
            }

            const mainLidRemaining = Math.max(mainLidTotal - mainLidUsed, 0);
            const mainTubRemaining = Math.max(mainTubTotal - mainTubUsed, 0);
            const mainRemainingTotal = Math.max(mainTotal - totalUsed, 0);

            if (mainTotal > 0) {
              productionItems.push({
                id: `${key}_main`,
                originalId: key,
                orderId: order.id,
                productId: product.id,
                orderNumber: order.orderNumber,
                companyName: order.contact.company,
                productCategory: product.productName,
                size: product.size,
                imlName: product.imlName,
                imlType: product.imlType,
                lidColor: product.lidColor || "N/A",
                tubColor: product.tubColor || "N/A",
                labelType: labelInfo.imlType || product.imlType,
                orderQuantity: labelInfo.orderQuantity || 0,
                receivedQuantity: mainTotal,
                allReceived: labelInfo.allReceived || false,
                lidTotal: mainLidTotal,
                tubTotal: mainTubTotal,
                lidRemaining: mainLidRemaining,
                tubRemaining: mainTubRemaining,
                remainingLabels: mainRemainingTotal,
                // Label order qtys from product
                lidLabelQty: toNumber(product.lidLabelQty || 0),
                tubLabelQty: toNumber(product.tubLabelQty || 0),
                origin: "Main Order",
                isFromRemaining: false,
                followups: mainFollowups.length,
                historyCount: labelInfo.history ? labelInfo.history.length : 0,
              });
            }
          }

          if (hasAllocations) {
            const remainingStoredProduction = localStorage.getItem("iml_remaining_production_followups");
            const remainingProductionData = remainingStoredProduction ? JSON.parse(remainingStoredProduction) : {};
            const remainingFollowups = Array.isArray(remainingProductionData[key]) ? remainingProductionData[key] : [];

            const allocatedTotal = allocationData.totalAllocated;
            let allocLidTotal = 0;
            let allocTubTotal = 0;

            if (product.imlType === "LID & TUB") {
              allocLidTotal = Math.floor(allocatedTotal / 2);
              allocTubTotal = allocatedTotal - allocLidTotal;
            } else if (product.imlType === "LID") {
              allocLidTotal = allocatedTotal;
            } else if (product.imlType === "TUB") {
              allocTubTotal = allocatedTotal;
            } else {
              allocLidTotal = allocatedTotal;
              allocTubTotal = allocatedTotal;
            }

            let allocLidUsed = 0;
            let allocTubUsed = 0;

            if (product.imlType === "LID & TUB") {
              remainingFollowups.forEach((e) => {
                const accepted = toNumber(e.acceptedComponents || 0);
                if (e.componentType === "LID") allocLidUsed += accepted;
                else if (e.componentType === "TUB") allocTubUsed += accepted;
              });
            } else {
              allocLidUsed = remainingFollowups.reduce((sum, e) => sum + toNumber(e.acceptedComponents || 0), 0);
              allocTubUsed = allocLidUsed;
            }

            const allocLidRemaining = Math.max(allocLidTotal - allocLidUsed, 0);
            const allocTubRemaining = Math.max(allocTubTotal - allocTubUsed, 0);
            const allocRemainingTotal = Math.max(allocatedTotal - (allocLidUsed + allocTubUsed), 0);

            productionItems.push({
              id: `${key}_remaining`,
              originalId: key,
              orderId: order.id,
              productId: product.id,
              orderNumber: order.orderNumber,
              companyName: order.contact.company,
              productCategory: product.productName,
              size: product.size,
              imlName: `${product.imlName}`,
              imlType: product.imlType,
              lidColor: product.lidColor || "N/A",
              tubColor: product.tubColor || "N/A",
              labelType: product.imlType,
              orderQuantity: 0,
              receivedQuantity: allocatedTotal,
              allReceived: true,
              lidTotal: allocLidTotal,
              tubTotal: allocTubTotal,
              lidRemaining: allocLidRemaining,
              tubRemaining: allocTubRemaining,
              remainingLabels: allocRemainingTotal,
              lidLabelQty: toNumber(product.lidLabelQty || 0),
              tubLabelQty: toNumber(product.tubLabelQty || 0),
              origin: "Remaining Allocation",
              isFromRemaining: true,
              followups: remainingFollowups.length,
            });
          }
        });
      });

      setProductionData(productionItems);
    } catch (error) {
      console.error("Error loading production data:", error);
      setProductionData([]);
    }
  };

  useEffect(() => {
    loadProductionData();
  }, []);

  useEffect(() => {
    if (location.state?.refreshData) {
      loadProductionData();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (productionData.length > 0) {
      const grouped = groupByHierarchy();
      const newExpandedCategories = {};
      const newExpandedSizes = {};
      const newExpandedColors = {};

      Object.entries(grouped).forEach(([category, sizes]) => {
        newExpandedCategories[category] = true;
        Object.entries(sizes).forEach(([size, colors]) => {
          newExpandedSizes[`${category}-${size}`] = true;
          Object.keys(colors).forEach((color) => {
            newExpandedColors[`${category}-${size}-${color}`] = true;
          });
        });
      });

      setExpandedCategories(newExpandedCategories);
      setExpandedSizes(newExpandedSizes);
      setExpandedColors(newExpandedColors);
    }
  }, [productionData]);

  const groupByHierarchy = () => {
    const grouped = {};
    productionData.forEach((item) => {
      const category = item.productCategory;
      const size = item.size;
      const color = item.isFromRemaining
        ? `Lid: ${item.lidColor} / Tub: ${item.tubColor} `
        : `Lid: ${item.lidColor} / Tub: ${item.tubColor}`;

      if (!grouped[category]) grouped[category] = {};
      if (!grouped[category][size]) grouped[category][size] = {};
      if (!grouped[category][size][color]) grouped[category][size][color] = [];
      grouped[category][size][color].push(item);
    });
    return grouped;
  };

  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    productionData.forEach((item) => products.add(item.productCategory));
    return Array.from(products).sort();
  }, [productionData]);

  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    productionData.forEach((item) => {
      if (!selectedProduct || item.productCategory === selectedProduct) sizes.add(item.size);
    });
    return Array.from(sizes).sort();
  }, [productionData, selectedProduct]);

  const getFilteredHierarchy = () => {
    const allGrouped = groupByHierarchy();
    const filtered = {};

    Object.entries(allGrouped).forEach(([category, sizes]) => {
      if (selectedProduct && category !== selectedProduct) return;
      Object.entries(sizes).forEach(([size, colors]) => {
        if (selectedSize && size !== selectedSize) return;
        Object.entries(colors).forEach(([color, items]) => {
          const filteredItems = items.filter((item) => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
              item.companyName.toLowerCase().includes(searchLower) ||
              item.imlName.toLowerCase().includes(searchLower) ||
              item.orderNumber.toLowerCase().includes(searchLower)
            );
          });

          const originFilteredItems = filteredItems.filter((item) => {
            if (!selectedOrigin) return true;
            return item.origin === selectedOrigin;
          });

          if (originFilteredItems.length > 0) {
            if (!filtered[category]) filtered[category] = {};
            if (!filtered[category][size]) filtered[category][size] = {};

            const mainItems = originFilteredItems.filter((item) => !item.isFromRemaining);
            const remainingItems = originFilteredItems.filter((item) => item.isFromRemaining);

            if (mainItems.length > 0) filtered[category][size][color] = mainItems;
            if (remainingItems.length > 0) filtered[category][size][`${color} (Remaining)`] = remainingItems;
          }
        });
      });
    });

    return filtered;
  };

  const toggleCategory = (category) => setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  const toggleSize = (category, size) => {
    const key = `${category}-${size}`;
    setExpandedSizes((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleColor = (category, size, color) => {
    const key = `${category}-${size}-${color}`;
    setExpandedColors((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Navigate to production details — pass componentType for LID & TUB split
  const handleViewDetails = (item, componentType = null) => {
    navigate("/iml/production/details", {
      state: {
        entry: {
          id: item.originalId,
          orderId: item.orderId,
          productId: item.productId,
          orderNumber: item.orderNumber,
          company: item.companyName,
          product: item.productCategory,
          size: item.size,
          imlName: item.imlName.replace(" (Remaining)", ""),
          imlType: item.imlType,
          containerColor: `Lid: ${item.lidColor}, Tub: ${item.tubColor}`,
          lidRemaining: item.lidRemaining,
          tubRemaining: item.tubRemaining,
          lidTotalLabels: item.lidTotal,
          tubTotalLabels: item.tubTotal,
          noOfLabels: item.receivedQuantity,
          sourceType: item.isFromRemaining ? "remaining" : "main",
          calculatedLidTotal: item.lidTotal,
          calculatedTubTotal: item.tubTotal,
          calculatedTotal: item.receivedQuantity,
          calculatedLidRemaining: item.lidRemaining,
          calculatedTubRemaining: item.tubRemaining,
          isFromRemaining: item.isFromRemaining,
          // ── KEY: tells ProductionDetails which component to show ──
          activeComponentType: componentType, // "LID", "TUB", or null (both / single)
        },
      },
    });
  };

  const filteredHierarchy = getFilteredHierarchy();
  const hasData = Object.keys(filteredHierarchy).length > 0;

  // ── Render helper: production status badge ──
  const renderProductionStatusBadge = (orderId, productId) => {
    const status = getProductionStatusFromOrder(orderId, productId);
    if (status === "Production Completed") {
      return (
        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[.75vw] font-semibold">
          ✅ Production Completed
        </span>
      );
    }
    if (status === "In Production") {
      return (
        <span className="inline-block px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[.75vw] font-semibold">
          🔄 In Production
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[.75vw] font-semibold">
        ⏳ Production Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.5vw]">
          <div className="flex items-center gap-[.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">Production Management</h1>
            <button
              onClick={() => { loadProductionData(); }}
              className="px-[.75vw] py-[.4vw] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[.75vw] font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <span className="text-[.75vw] bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {productionData.length} items loaded
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, IML name..."
                  className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 text-[.8vw]"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-[0.9vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">Filter by Product</label>
              <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setSelectedSize(""); }} className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white text-[.8vw]">
                <option value="">All Products</option>
                {getUniqueProducts.map((product) => <option key={product} value={product}>{product}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">Filter by Size</label>
              <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} disabled={!selectedProduct} className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 text-[.8vw]">
                <option value="">All Sizes</option>
                {getUniqueSizesForProduct.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">Filter by Origin</label>
              <select value={selectedOrigin} onChange={(e) => setSelectedOrigin(e.target.value)} className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white text-[.8vw]">
                <option value="">All Origins</option>
                <option value="Main Order">Main Order</option>
                <option value="Remaining Allocation">Remaining Allocation</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSearchTerm(""); setSelectedProduct(""); setSelectedSize(""); setSelectedOrigin(""); }}
                className="w-full px-[.85vw] py-[0.6vw] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-[.8vw] cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="bg-white rounded-xl shadow-sm p-[2vw] text-center border border-gray-200">
          <div className="w-[4vw] h-[4vw] bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-[0.8vw]">
            <svg className="w-[2vw] h-[2vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-[2vw] font-semibold text-gray-900 mb-2">No Production Data Found</h3>
          <p className="text-gray-600">{searchTerm || selectedProduct || selectedSize ? "No items match your filters" : "No labels have been received yet"}</p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {Object.entries(filteredHierarchy).map(([category, sizes]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border-2 border-neutral-200 overflow-hidden">
              {/* Category Header */}
              <div onClick={() => toggleCategory(category)} className="bg-neutral-600 px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-neutral-700 transition-all flex items-center gap-4">
                <svg className={`w-[1.2vw] h-[1.2vw] text-white transition-transform duration-200 ${expandedCategories[category] ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div>
                  <h3 className="text-[1.15vw] font-bold text-white flex items-center gap-2">
                    <svg className="w-[1.3vw] h-[1.3vw] mr-1" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="8" width="18" height="12" rx="2" /><path d="M2 8h20" /><path d="M8 4h8" />
                    </svg>
                    {category}
                  </h3>
                  <p className="text-[.85vw] text-purple-100">{Object.keys(sizes).length} Size{Object.keys(sizes).length > 1 ? "s" : ""}</p>
                </div>
              </div>

              {expandedCategories[category] && (
                <div className="p-[1vw] space-y-[1vw]">
                  {Object.entries(sizes).map(([size, colors]) => {
                    const sizeKey = `${category}-${size}`;
                    const isSizeExpanded = expandedSizes[sizeKey];
                    return (
                      <div key={size} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[0.6vw] border border-blue-200 overflow-hidden">
                        <div onClick={() => toggleSize(category, size)} className="px-[1vw] py-[.75vw] cursor-pointer hover:bg-blue-100 transition-all flex items-center gap-3">
                          <svg className={`w-[1vw] h-[1vw] text-blue-700 transition-transform duration-200 ${isSizeExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h4 className="text-[1vw] font-semibold text-blue-900 flex items-center gap-2"><span>📏</span> {size}</h4>
                          <span className="text-[.8vw] text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">{Object.keys(colors).length} Color Combination{Object.keys(colors).length > 1 ? "s" : ""}</span>
                        </div>

                        {isSizeExpanded && (
                          <div className="px-[1vw] pb-[1vw] space-y-[0.75vw]">
                            {Object.entries(colors).map(([color, items]) => {
                              const colorKey = `${category}-${size}-${color}`;
                              const isColorExpanded = expandedColors[colorKey];
                              return (
                                <div key={color} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.5vw] border border-green-200 overflow-hidden">
                                  <div onClick={() => toggleColor(category, size, color)} className="px-[0.85vw] py-[.6vw] cursor-pointer hover:bg-green-100 transition-all flex items-center gap-2">
                                    <svg className={`w-[0.9vw] h-[0.9vw] text-green-700 transition-transform duration-200 ${isColorExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <h5 className="text-[.9vw] font-semibold text-green-900 flex items-center gap-2"><span>🎨</span> Lid & Tub: {color}</h5>
                                    <span className="text-[.75vw] text-green-700 bg-green-200 px-2 py-0.5 rounded-full">{items.length} Item{items.length > 1 ? "s" : ""}</span>
                                  </div>

                                  {isColorExpanded && (
                                    <div className="px-[0.85vw] pb-[0.85vw]">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-gray-200">
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">S.No</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Order No</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Company Name</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">IML Name</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">IML Type</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Label Type</th>
                                            {/* ── NEW: 3 label columns ── */}
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Labels Ordered</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Labels Received</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Available Labels</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">Origin</th>
                                            {/* ── NEW: Production Status ── */}
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold">Production Status</th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {items.map((item, idx) => {
                                            const isLidTub = item.imlType === "LID & TUB";

                                            if (isLidTub) {
                                              // ── LID & TUB: render 2 sub-rows inside one logical row ──
                                              return (
                                                <React.Fragment key={idx}>
                                                  {/* ── LID sub-row ── */}
                                                  <tr className="bg-white hover:bg-green-50 transition-colors">
                                                    {/* S.No spans 2 rows */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold" rowSpan={2}>
                                                      {idx + 1}
                                                    </td>
                                                    {/* Order No spans 2 rows */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium" rowSpan={2}>
                                                      {item.orderNumber}
                                                    </td>
                                                    {/* Company spans 2 rows */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold" rowSpan={2}>
                                                      {item.companyName}
                                                    </td>
                                                    {/* IML Name spans 2 rows */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold" rowSpan={2}>
                                                      {item.imlName}
                                                    </td>
                                                    {/* IML Type spans 2 rows */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]" rowSpan={2}>
                                                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">{item.imlType}</span>
                                                    </td>
                                                    {/* LID label for Label Type */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[.75vw] font-semibold">LID</span>
                                                    </td>
                                                    {/* Labels Ordered – LID */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-gray-700">
                                                      {item.lidLabelQty > 0 ? item.lidLabelQty : "—"}
                                                    </td>
                                                    {/* Labels Received – LID */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-green-700">
                                                      {item.lidTotal}
                                                    </td>
                                                    {/* Available – LID */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-blue-700">
                                                      {item.lidRemaining}
                                                    </td>
                                                    {/* Origin spans 2 rows */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]" rowSpan={2}>
                                                      <span className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${item.isFromRemaining ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>{item.origin}</span>
                                                    </td>
                                                    {/* Production Status – LID row (its own cell, no rowspan) */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                      {renderProductionStatusBadge(item.orderId, item.productId)}
                                                    </td>
                                                    {/* LID View button */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                      <button
                                                        onClick={() => handleViewDetails(item, "LID")}
                                                        className="px-[0.85vw] py-[.3vw] bg-green-600 text-white rounded-[0.4vw] text-[.75vw] font-medium hover:bg-green-700 cursor-pointer transition-all inline-flex items-center gap-[0.3vw]"
                                                      >
                                                        <span>👁️</span> LID
                                                      </button>
                                                    </td>
                                                  </tr>

                                                  {/* ── TUB sub-row ── */}
                                                  <tr className="bg-blue-50 hover:bg-blue-100 transition-colors">
                                                    {/* Label Type – TUB */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">TUB</span>
                                                    </td>
                                                    {/* Labels Ordered – TUB */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-gray-700">
                                                      {item.tubLabelQty > 0 ? item.tubLabelQty : "—"}
                                                    </td>
                                                    {/* Labels Received – TUB */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-green-700">
                                                      {item.tubTotal}
                                                    </td>
                                                    {/* Available – TUB */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-blue-700">
                                                      {item.tubRemaining}
                                                    </td>
                                                    {/* Production Status – TUB row (separate cell) */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                      {renderProductionStatusBadge(item.orderId, item.productId)}
                                                    </td>
                                                    {/* TUB View button */}
                                                    <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                      <button
                                                        onClick={() => handleViewDetails(item, "TUB")}
                                                        className="px-[0.85vw] py-[.3vw] bg-blue-600 text-white rounded-[0.4vw] text-[.75vw] font-medium hover:bg-blue-700 cursor-pointer transition-all inline-flex items-center gap-[0.3vw]"
                                                      >
                                                        <span>👁️</span> TUB
                                                      </button>
                                                    </td>
                                                  </tr>
                                                </React.Fragment>
                                              );
                                            }

                                            // ── Single type (LID or TUB only) ──
                                            const isLidOnly = item.imlType === "LID";
                                            const labelOrdered = isLidOnly ? item.lidLabelQty : item.tubLabelQty;
                                            const labelReceived = isLidOnly ? item.lidTotal : item.tubTotal;
                                            const labelAvailable = isLidOnly ? item.lidRemaining : item.tubRemaining;

                                            return (
                                              <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">{idx + 1}</td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium">{item.orderNumber}</td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold">{item.companyName}</td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold">{item.imlName}</td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">{item.imlType}</span>
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">{item.labelType}</td>
                                                {/* Labels Ordered */}
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-gray-700">
                                                  {labelOrdered > 0 ? labelOrdered : "—"}
                                                </td>
                                                {/* Labels Received */}
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-green-700">
                                                  {labelReceived}
                                                </td>
                                                {/* Available Labels */}
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-blue-700">
                                                  {labelAvailable}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  <span className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${item.isFromRemaining ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>{item.origin}</span>
                                                </td>
                                                {/* Production Status */}
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                  {renderProductionStatusBadge(item.orderId, item.productId)}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                  <button
                                                    onClick={() => handleViewDetails(item, null)}
                                                    className="px-[1vw] py-[.35vw] bg-indigo-600 text-white rounded-[0.4vw] text-[.8vw] font-medium hover:bg-indigo-700 cursor-pointer transition-all inline-flex items-center gap-[0.4vw]"
                                                  >
                                                    <span>👁️</span> View
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionManagement;