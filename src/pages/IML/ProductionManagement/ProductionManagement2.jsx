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
  const [activeSheet, setActiveSheet] = useState("tracking");

  // Expand states
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSizes, setExpandedSizes] = useState({});
  const [expandedColors, setExpandedColors] = useState({});

  const toNumber = (value) => {
    if (!value || value == '0') return 0;
    return Number(String(value).replace(/,/g, ''));
  };


  // Load production data
  const loadProductionData = () => {
    console.log("🔄 Loading production data...");

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const storedLabelQty = localStorage.getItem(STORAGE_KEY_LABEL_QTY);

    if (!storedOrders || !storedLabelQty) {
      console.warn("⚠️ No orders or label quantities found");
      setProductionData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const labelData = JSON.parse(storedLabelQty);

      const productionItems = [];

      // Process each order
      allOrders.forEach((order) => {
        order.products?.forEach((product) => {
          if (product.moveToPurchase) {
            const key = `${order.id}_${product.id}`;
            const labelInfo = labelData[key];

            const storedProduction = localStorage.getItem(STORAGE_KEY_PRODUCTION_FOLLOWUPS);
            const allProductionData = storedProduction ? JSON.parse(storedProduction) : {};
            const followups = allProductionData[key] || [];

            const totalLabels = labelInfo ? labelInfo.noOfLabels : 0;  // Use noOfLabels as total
            console.log(`Label Info: ${JSON.stringify(labelInfo, null, 2)}`);
            // console.log("Total Labels: ", totalLabels);

            const usedLabels = followups.reduce((sum, e) => {
              const accepted = Number(e.acceptedComponents) || 0;
              return sum + accepted;
            }, 0);

            // order.forEach((o, k) => {
            //   console.log(`Order Item: ${o} - ${k}`);
            // })
            // Object.keys(order => ())
            // console.log(`Order details: ${JSON.stringify(order, null, 2)}`);
            // console.log(`Product details: ${product}`);
            
            
            // Only include if labels have been received
            if (labelInfo && labelInfo.receivedQuantity > 0) {
              const remainingLabels = Math.max((labelInfo.receivedQuantity || 0) - usedLabels, 0);

              // console.log(`Product: ${product.productName} ${product.size}`)
              // console.log(`Used labels: ${usedLabels}`)
              console.log(`Total labels: ${product.noOfLabels}`)
              console.log(`Remaining labels: ${remainingLabels}`)
              productionItems.push({
                id: key,
                orderId: order.id,
                productId: product.id,
                orderNumber: order.orderNumber,
                companyName: order.contact.company,
                productCategory: product.productName,
                size: product.size,
                imlName: product.imlName,
                imlType: product.imlType,
                labelType: labelInfo.imlType,
                lidColor: product.lidColor || "N/A",
                tubColor: product.tubColor || "N/A",
                orderQuantity: labelInfo.orderQuantity,
                receivedQuantity: labelInfo.receivedQuantity,
                allReceived: labelInfo.allReceived || false,
                remainingLabels,
              });
              
            }
            
          }
        });

      });

    

      console.log("✅ Production items loaded:", productionItems.length);
      setProductionData(productionItems);
    } catch (error) {
      console.error("❌ Error loading production data:", error);
      setProductionData([]);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🚀 ProductionManagement mounted");
    loadProductionData();
  }, []);

  // Reload when location state changes
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log("🔃 Refresh flag detected");
      loadProductionData();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-expand on load
  useEffect(() => {
    if (productionData.length > 0) {
      const grouped = groupByHierarchy();
      const newExpandedCategories = {};
      const newExpandedSizes = {};
      const newExpandedColors = {};

      Object.entries(grouped).forEach(([category, sizes]) => {
        newExpandedCategories[category] = true;
        Object.entries(sizes).forEach(([size, colors]) => {
          const sizeKey = `${category}-${size}`;
          newExpandedSizes[sizeKey] = true;
          Object.keys(colors).forEach((color) => {
            const colorKey = `${category}-${size}-${color}`;
            newExpandedColors[colorKey] = true;
          });
        });
      });

      setExpandedCategories(newExpandedCategories);
      setExpandedSizes(newExpandedSizes);
      setExpandedColors(newExpandedColors);
    }
  }, [productionData]);

  // Get production status
  const getProductionStatus = (item) => {
    const storedFollowups = localStorage.getItem(STORAGE_KEY_PRODUCTION_FOLLOWUPS);
    const followups = storedFollowups ? JSON.parse(storedFollowups)[item.id] : [];

    console.log(`Item: ${item}`);
    console.log(`Followups: ${followups}`);
    console.log(`Items Remaining Labels: ${item.remainingLabels}`);
    if (!followups || followups.length === 0) return "Pending";
    if (item.remainingLabels === 0) return "Completed";
    return "In Progress";
  };


  // Group by hierarchy: Category → Size → Color
  const groupByHierarchy = () => {
    const grouped = {};

    productionData.forEach((item) => {
      const category = item.productCategory;
      const size = item.size;
      const color = `${item.lidColor} / ${item.tubColor}`;

      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][size]) {
        grouped[category][size] = {};
      }
      if (!grouped[category][size][color]) {
        grouped[category][size][color] = [];
      }

      grouped[category][size][color].push(item);
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    productionData.forEach((item) => {
      products.add(item.productCategory);
    });
    return Array.from(products).sort();
  }, [productionData]);

  // Get unique sizes
  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    productionData.forEach((item) => {
      if (!selectedProduct || item.productCategory === selectedProduct) {
        sizes.add(item.size);
      }
    });
    return Array.from(sizes).sort();
  }, [productionData, selectedProduct]);

  // Filter data
  const getFilteredHierarchy = () => {
    const allGrouped = groupByHierarchy();
    const filtered = {};

    Object.entries(allGrouped).forEach(([category, sizes]) => {
      // Apply product filter
      if (selectedProduct && category !== selectedProduct) {
        return;
      }

      Object.entries(sizes).forEach(([size, colors]) => {
        // Apply size filter
        if (selectedSize && size !== selectedSize) {
          return;
        }

        Object.entries(colors).forEach(([color, items]) => {
          // Apply search filter
          const filteredItems = items.filter((item) => {
            if (!searchTerm) return true;

            const searchLower = searchTerm.toLowerCase();
            return (
              item.companyName.toLowerCase().includes(searchLower) ||
              item.imlName.toLowerCase().includes(searchLower) ||
              item.orderNumber.toLowerCase().includes(searchLower)
            );
          });

          if (filteredItems.length > 0) {
            if (!filtered[category]) {
              filtered[category] = {};
            }
            if (!filtered[category][size]) {
              filtered[category][size] = {};
            }
            filtered[category][size][color] = filteredItems;
          }
        });
      });
    });

    return filtered;
  };

  // Toggle functions
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleSize = (category, size) => {
    const key = `${category}-${size}`;
    setExpandedSizes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleColor = (category, size, color) => {
    const key = `${category}-${size}-${color}`;
    setExpandedColors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Open production details
  const handleViewDetails = (item) => {
    navigate("/iml/production/details", {
      state: {
        entry: {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          orderNumber: item.orderNumber,
          company: item.companyName,
          product: item.productCategory,
          size: item.size,
          imlName: item.imlName,
          imlType: item.imlType,
          containerColor: `Lid: ${item.lidColor}, Tub: ${item.tubColor}`,
          noOfLabels: item.receivedQuantity,
        },
      },
    });
  };

  const filteredHierarchy = getFilteredHierarchy();
  const hasData = Object.keys(filteredHierarchy).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.5vw]">
          <div className="flex items-center gap-[.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">
              Production Management
            </h1>

            <button
              onClick={() => {
                console.log("🔄 Manual refresh clicked");
                loadProductionData();
              }}
              className="px-[.75vw] py-[.4vw] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[.75vw] font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              <svg
                className="w-[1vw] h-[1vw]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, IML name..."
                  className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 text-[.8vw]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-[0.9vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Filter by Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setSelectedSize("");
                }}
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white text-[.8vw]"
              >
                <option value="">All Products</option>
                {getUniqueProducts.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Filter by Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                disabled={!selectedProduct}
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 text-[.8vw]"
              >
                <option value="">All Sizes</option>
                {getUniqueSizesForProduct.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedProduct("");
                  setSelectedSize("");
                }}
                className="w-full px-[.85vw] py-[0.6vw] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-[.8vw] cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {!hasData ? (
        <div className="bg-white rounded-xl shadow-sm p-[2vw] text-center border border-gray-200">
          <div className="w-[4vw] h-[4vw] bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-[0.8vw]">
            <svg
              className="w-[2vw] h-[2vw] text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Production Data Found
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedProduct || selectedSize
              ? "No items match your filters"
              : "No labels have been received yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {Object.entries(filteredHierarchy).map(([category, sizes]) => (
            <div
              key={category}
              className="bg-white rounded-lg shadow-sm border-2 border-neutral-200 overflow-hidden"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category)}
                className="bg-neutral-600 px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-neutral-700 transition-all flex items-center gap-4"
              >
                <svg
                  className={`w-[1.2vw] h-[1.2vw] text-white transition-transform duration-200 ${
                    expandedCategories[category] ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <h3 className="text-[1.15vw] font-bold text-white flex items-center gap-2">
                    <span className="text-[1.3vw]">
                      <svg
                        className="w-[1.3vw] h-[1.3vw] mr-1 text-slate-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="8" width="18" height="12" rx="2" />
                        <path d="M2 8h20" />
                        <path d="M8 4h8" />
                      </svg>
                    </span>{" "}
                    {category}
                  </h3>
                  <p className="text-[.85vw] text-purple-100">
                    {Object.keys(sizes).length} Size
                    {Object.keys(sizes).length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Sizes */}
              {expandedCategories[category] && (
                <div className="p-[1vw] space-y-[1vw]">
                  {Object.entries(sizes).map(([size, colors]) => {
                    const sizeKey = `${category}-${size}`;
                    const isSizeExpanded = expandedSizes[sizeKey];

                    return (
                      <div
                        key={size}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[0.6vw] border border-blue-200 overflow-hidden"
                      >
                        {/* Size Header */}
                        <div
                          onClick={() => toggleSize(category, size)}
                          className="px-[1vw] py-[.75vw] cursor-pointer hover:bg-blue-100 transition-all flex items-center gap-3"
                        >
                          <svg
                            className={`w-[1vw] h-[1vw] text-blue-700 transition-transform duration-200 ${
                              isSizeExpanded ? "rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <h4 className="text-[1vw] font-semibold text-blue-900 flex items-center gap-2">
                            <span className="text-[1.1vw]">📏</span> {size}
                          </h4>
                          <span className="text-[.8vw] text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                            {Object.keys(colors).length} Color Combination
                            {Object.keys(colors).length > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Colors */}
                        {isSizeExpanded && (
                          <div className="px-[1vw] pb-[1vw] space-y-[0.75vw]">
                            {Object.entries(colors).map(([color, items]) => {
                              const colorKey = `${category}-${size}-${color}`;
                              const isColorExpanded = expandedColors[colorKey];

                              return (
                                <div
                                  key={color}
                                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.5vw] border border-green-200 overflow-hidden"
                                >
                                  {/* Color Header */}
                                  <div
                                    onClick={() =>
                                      toggleColor(category, size, color)
                                    }
                                    className="px-[0.85vw] py-[.6vw] cursor-pointer hover:bg-green-100 transition-all flex items-center gap-2"
                                  >
                                    <svg
                                      className={`w-[0.9vw] h-[0.9vw] text-green-700 transition-transform duration-200 ${
                                        isColorExpanded ? "rotate-90" : ""
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                    <h5 className="text-[.9vw] font-semibold text-green-900 flex items-center gap-2">
                                      <span className="text-[1vw]">🎨</span> Lid
                                      & Tub: {color}
                                    </h5>
                                    <span className="text-[.75vw] text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                                      {items.length} Item
                                      {items.length > 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  {/* Items Table */}
                                  {isColorExpanded && (
                                    <div className="px-[0.85vw] pb-[0.85vw]">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-gray-200">
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              S.No
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Company Name
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              IML Name
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              IML Type
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Label Type
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold">
                                              Production Status
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold">
                                              Action
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {items.map((item, idx) => {
                                            const status = getProductionStatus(
                                              item.id
                                            );
                                            return (
                                              <tr
                                                key={idx}
                                                className="hover:bg-white transition-colors"
                                              >
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  {idx + 1}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold">
                                                  {item.companyName}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold">
                                                  {item.imlName}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">
                                                    {item.imlType}
                                                  </span>
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  {item.labelType}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                  {status === "Pending" ? (
                                                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[.75vw] font-semibold">
                                                      ⏳ Pending
                                                    </span>
                                                  ) : (
                                                    <span className="inline-block px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[.75vw] font-semibold">
                                                      🔄 In Progress
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                  <button
                                                    onClick={() =>
                                                      handleViewDetails(item)
                                                    }
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
