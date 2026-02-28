// InventoryManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";
const STORAGE_KEY_INVENTORY = "iml_inventory_data";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";
    

const InventoryManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [inventoryData, setInventoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "In Production" or "Complete"

  // Expand states
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Load inventory data from production
  const loadInventoryData = () => {
    console.log("🔄 Loading inventory data...");

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const storedProduction = localStorage.getItem(STORAGE_KEY_PRODUCTION_FOLLOWUPS);

    if (!storedOrders || !storedProduction) {
      console.warn("⚠️ No orders or production data found");
      setInventoryData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const productionData = JSON.parse(storedProduction);

      const inventoryItems = [];

      // Process each order
      allOrders.forEach((order) => {
        order.products?.forEach((product) => {
          if (product.moveToPurchase) {
            const key = `${order.id}_${product.id}`;
            const productionEntries = productionData[key];

            // Only include if production has started
            if (productionEntries && productionEntries.length > 0) {
              // Calculate total produced (accepted components)
              const totalProduced = productionEntries.reduce((sum, entry) => {
                const accepted = parseInt(entry.acceptedComponents) || 0;
                return sum + accepted;
                }, 0);

                // Get label quantity info to check remaining labels
                const storedLabelQty = localStorage.getItem(STORAGE_KEY_LABEL_QTY);
                let remainingLabels = 0;
                let isComplete = false;

                if (storedLabelQty) {
                const labelData = JSON.parse(storedLabelQty);
                const labelInfo = labelData[key];
                
                if (labelInfo) {
                    const totalLabels = labelInfo.receivedQuantity || 0;
                    // Calculate used labels from production
                    const usedLabels = productionEntries.reduce((sum, entry) => {
                    const accepted = parseInt(entry.acceptedComponents) || 0;
                    const rejected = parseInt(entry.rejectedComponents) || 0;
                    const wastage = parseInt(entry.labelWastage) || 0;
                    return sum + accepted + rejected + wastage;
                    }, 0);
                    
                    remainingLabels = Math.max(totalLabels - usedLabels, 0);
                    isComplete = remainingLabels === 0;
                }
            }

              inventoryItems.push({
                id: key,
                orderId: order.id,
                productId: product.id,
                orderNumber: order.orderNumber,
                companyName: order.contact.company,
                productCategory: product.productName,
                size: product.size,
                imlName: product.imlName,
                imlType: product.imlType,
                producedQuantity: totalProduced,
                remainingLabels: remainingLabels,  // ADD THIS LINE
                status: isComplete ? "Complete" : "In Production",
                productionEntries: productionEntries,
              });
            }
          }
        });
      });

      console.log("✅ Inventory items loaded:", inventoryItems.length);
      setInventoryData(inventoryItems);
    } catch (error) {
      console.error("❌ Error loading inventory data:", error);
      setInventoryData([]);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🚀 InventoryManagement mounted");
    loadInventoryData();
  }, []);

  // Reload when location state changes
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log("🔃 Refresh flag detected");
      loadInventoryData();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-expand companies and first order
  useEffect(() => {
    if (inventoryData.length > 0) {
      const grouped = groupByCompany();
      const newExpandedCompanies = {};
      const newExpandedOrders = {};

      Object.entries(grouped).forEach(([companyName, orders]) => {
        newExpandedCompanies[companyName] = true;
        const orderKeys = Object.keys(orders);
        if (orderKeys.length > 0) {
          newExpandedOrders[`${companyName}-${orderKeys[0]}`] = true;
        }
      });

      setExpandedCompanies(newExpandedCompanies);
      setExpandedOrders(newExpandedOrders);
    }
  }, [inventoryData]);

  // Group by company → order
  const groupByCompany = () => {
    const grouped = {};

    inventoryData.forEach((item) => {
      const companyName = item.companyName;
      const orderNumber = item.orderNumber;

      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      if (!grouped[companyName][orderNumber]) {
        grouped[companyName][orderNumber] = [];
      }

      grouped[companyName][orderNumber].push(item);
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    inventoryData.forEach((item) => {
      products.add(item.productCategory);
    });
    return Array.from(products).sort();
  }, [inventoryData]);

  // Get unique sizes
  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    inventoryData.forEach((item) => {
      if (!selectedProduct || item.productCategory === selectedProduct) {
        sizes.add(item.size);
      }
    });
    return Array.from(sizes).sort();
  }, [inventoryData, selectedProduct]);

  // Filter data
  const getFilteredGroupedData = () => {
    const allGrouped = groupByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, items]) => {
        const filteredItems = items.filter((item) => {
          // Search filter
          let matchesSearch = true;
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            matchesSearch =
              companyName.toLowerCase().includes(searchLower) ||
              item.imlName.toLowerCase().includes(searchLower) ||
              item.orderNumber.toLowerCase().includes(searchLower);
          }

          // Product filter
          let matchesProduct = true;
          if (selectedProduct) {
            matchesProduct = item.productCategory === selectedProduct;
          }

          // Size filter
          let matchesSize = true;
          if (selectedSize) {
            matchesSize = item.size === selectedSize;
          }

          // Status filter
          let matchesStatus = true;
          if (statusFilter) {
            matchesStatus = item.status === statusFilter;
          }

          return matchesSearch && matchesProduct && matchesSize && matchesStatus;
        });

        if (filteredItems.length > 0) {
          if (!filtered[companyName]) {
            filtered[companyName] = {};
          }
          filtered[companyName][orderKey] = filteredItems;
        }
      });
    });

    return filtered;
  };

  // Toggle functions
  const toggleCompany = (companyName) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyName]: !prev[companyName],
    }));
  };

  const toggleOrder = (companyName, orderKey) => {
    const key = `${companyName}-${orderKey}`;
    setExpandedOrders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Open inventory details
  const handleVerifyAndSend = (item) => {
    navigate("/iml/inventory/details", {
      state: {
        entry: {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          orderNumber: item.orderNumber,
          company: item.companyName,
          imlName: item.imlName,
          productCategory: item.productCategory,
          size: item.size,
          producedQuantity: item.producedQuantity,
          status: item.status,
        },
      },
    });
  };

  const filteredGroupedData = getFilteredGroupedData();
  const hasData = Object.keys(filteredGroupedData).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.5vw]">
          <div className="flex items-center gap-[.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">
              Inventory Management
            </h1>

            <button
              onClick={() => {
                console.log("🔄 Manual refresh clicked");
                loadInventoryData();
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
              {inventoryData.length} items loaded
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                Production Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white text-[.8vw]"
              >
                <option value="">All Status</option>
                <option value="In Production">In Production</option>
                <option value="Complete">Complete</option>
              </select>
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
                  setStatusFilter("");
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Inventory Data Found
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedProduct || selectedSize || statusFilter
              ? "No items match your filters"
              : "No production has been completed yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {Object.entries(filteredGroupedData).map(([companyName, orders]) => (
            <div
              key={companyName}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Company Header */}
              <div
                onClick={() => toggleCompany(companyName)}
                className="bg-[#3d64bb] text-white px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-[#2d54ab] transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <svg
                    className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 ${
                      expandedCompanies[companyName] ? "rotate-90" : ""
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
                    <h3 className="text-[1.15vw] font-bold">{companyName}</h3>
                    <p className="text-[.9vw] text-blue-100">
                      {Object.keys(orders).length} Order
                      {Object.keys(orders).length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Orders within Company */}
              {expandedCompanies[companyName] && (
                <div className="space-y-[1.25vw] p-[1vw]">
                  {Object.entries(orders).map(([orderKey, items]) => {
                    const isOrderExpanded =
                      expandedOrders[`${companyName}-${orderKey}`];

                    return (
                      <div
                        key={orderKey}
                        className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                      >
                        {/* Order Header */}
                        <div
                          onClick={() => toggleOrder(companyName, orderKey)}
                          className="bg-gray-200 px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-gray-300 transition-all flex justify-between items-center"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <svg
                              className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 text-gray-600 ${
                                isOrderExpanded ? "rotate-90" : ""
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
                            <div className="flex-1">
                              <h4 className="text-[1.05vw] font-semibold text-gray-800">
                                Order #{orderKey}
                              </h4>
                              <div className="flex gap-6 mt-2 text-[.9vw] text-gray-600">
                                <span>
                                  <strong>Products:</strong> {items.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Products Table */}
                        {isOrderExpanded && (
                          <div className="p-[1.5vw] bg-white">
                            <div className="overflow-x-auto rounded-lg">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-200">
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      S.No
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      IML Name
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Product Category
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Product Size
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Produced Qty
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                      Status
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, idx) => (
                                    <tr
                                      key={idx}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                        {idx + 1}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-medium">
                                          {item.imlName}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                        {item.productCategory}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                        {item.size}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-bold text-green-700">
                                        {item.producedQuantity.toLocaleString(
                                          "en-IN"
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center">
                                        {item.status === "Complete" ? (
                                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                            ✓ Complete
                                          </span>
                                        ) : (
                                          <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-semibold">
                                            🔄 In Production
                                          </span>
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center">
                                        <button
                                          onClick={() =>
                                            handleVerifyAndSend(item)
                                          }
                                          className="px-[.85vw] py-[.35vw] bg-indigo-600 text-white rounded hover:bg-indigo-700 text-[.8vw] font-medium cursor-pointer"
                                        >
                                          📦 Verify & Send
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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

export default InventoryManagement;
