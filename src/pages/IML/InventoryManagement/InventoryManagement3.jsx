// InventoryManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";
const STORAGE_KEY_INVENTORY = "iml_inventory_data";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";
const STORAGE_KEY_INVENTORY_FOLLOWUPS = "iml_inventory_followups";

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
  const loadAllProductionData = () => {
    console.log("🔄 Loading ALL production data for inventory...");

    // Load from both sources
    const mainProductionData = localStorage.getItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS,
    );
    const remainingProductionData = localStorage.getItem(
      "iml_remaining_production_followups",
    );

    const allProductionEntries = {};

    // Process main production followups
    if (mainProductionData) {
      try {
        const mainData = JSON.parse(mainProductionData);
        Object.entries(mainData).forEach(([key, entries]) => {
          if (!allProductionEntries[key]) {
            allProductionEntries[key] = [];
          }
          // Filter only submitted entries
          const submittedEntries = entries.filter(
            (entry) => entry.submitted === true,
          );
          allProductionEntries[key].push(...submittedEntries);
        });
      } catch (error) {
        console.error("Error parsing main production data:", error);
      }
    }

    // Process remaining production followups
    if (remainingProductionData) {
      try {
        const remainingData = JSON.parse(remainingProductionData);
        Object.entries(remainingData).forEach(([key, entries]) => {
          if (!allProductionEntries[key]) {
            allProductionEntries[key] = [];
          }
          // Filter only submitted entries
          const submittedEntries = entries.filter(
            (entry) => entry.submitted === true,
          );
          allProductionEntries[key].push(...submittedEntries);
        });
      } catch (error) {
        console.error("Error parsing remaining production data:", error);
      }
    }

    console.log(
      "Total production entries loaded:",
      Object.keys(allProductionEntries).length,
    );
    return allProductionEntries;
  };

  // Then update the loadInventoryData function:
  const loadInventoryData = () => {
    console.log("🔄 Loading inventory data...");

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const allVerified = JSON.parse(
      localStorage.getItem(STORAGE_KEY_INVENTORY_FOLLOWUPS) || "{}",
    );

    if (!storedOrders) {
      console.warn("⚠️ No orders found");
      setInventoryData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const allProductionEntries = loadAllProductionData(); // Get ALL production entries

      const inventoryItems = [];

      // Process each order
      allOrders.forEach((order) => {
        const orderProducts =
          order.products?.filter((product) => product.moveToPurchase) || [];

        if (orderProducts.length > 0) {
          let hasProductionData = false;
          let totalOrderProduced = 0;
          const orderProductionEntries = {};

          orderProducts.forEach((product) => {
            const key = `${order.id}_${product.id}`;
            const productionEntries = allProductionEntries[key] || [];

            if (productionEntries.length > 0) {
              hasProductionData = true;

              // Calculate total produced (sum of all accepted components from ALL sources)
              let totalProduced = 0;
              let lidProduced = 0;
              let tubProduced = 0;

              productionEntries.forEach((entry) => {
                const accepted = parseInt(entry.acceptedComponents) || 0;
                const componentType = entry.componentType;

                // For LID & TUB types, track separately
                if (product.imlType === "LID & TUB") {
                  if (componentType === "LID") {
                    lidProduced += accepted;
                  } else if (componentType === "TUB") {
                    tubProduced += accepted;
                  }
                }
                totalProduced += accepted;
              });

              // For LID & TUB, combine both components
              if (product.imlType === "LID & TUB") {
                totalProduced = lidProduced + tubProduced;
              }

              totalOrderProduced += totalProduced;

              // Get verification data
              const verifiedForOrder = allVerified[order.id] || [];
              const verifiedForProduct = verifiedForOrder.filter(
                (v) => v.productId === product.id,
              );

              // Calculate total verified quantity
              const verifiedQty = verifiedForProduct.reduce(
                (sum, v) => sum + (parseInt(v.finalQty) || 0),
                0,
              );

              // Calculate remaining quantity (Produced - Verified)
              const remainingQty = Math.max(totalProduced - verifiedQty, 0);

              orderProductionEntries[key] = {
                id: key,
                productId: product.id,
                productCategory: product.productName,
                size: product.size,
                imlName: product.imlName,
                imlType: product.imlType,
                producedQuantity: totalProduced, // This is cumulative from ALL sources
                verifiedQuantity: verifiedQty,
                remainingQuantity: remainingQty,
                status: remainingQty === 0 ? "Complete" : "In Production",
                productionSources: productionEntries.length, // Track how many production entries
                isFromRemaining: productionEntries.some(
                  (entry) => entry.isFromRemaining,
                ),
              };
            }
          });

          if (hasProductionData) {
            inventoryItems.push({
              id: order.id,
              orderNumber: order.orderNumber,
              companyName: order.contact.company,
              contact: order.contact,
              totalProduced: totalOrderProduced,
              products: orderProductionEntries,
              status: Object.values(orderProductionEntries).some(
                (p) => p.status === "In Production",
              )
                ? "In Production"
                : "Complete",
            });
          }
        }
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
        grouped[companyName][orderNumber] = item;
      }
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    inventoryData.forEach((order) => {
      Object.values(order.products).forEach((product) => {
        products.add(product.productCategory);
      });
    });
    return Array.from(products).sort();
  }, [inventoryData]);

  // Get unique sizes
  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    inventoryData.forEach((order) => {
      Object.values(order.products).forEach((product) => {
        if (!selectedProduct || product.productCategory === selectedProduct) {
          sizes.add(product.size);
        }
      });
    });
    return Array.from(sizes).sort();
  }, [inventoryData, selectedProduct]);

  // Filter data
  const getFilteredGroupedData = () => {
    const allGrouped = groupByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, order]) => {
        // Check if order matches filters
        let matchesSearch = true;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          matchesSearch =
            companyName.toLowerCase().includes(searchLower) ||
            orderKey.toLowerCase().includes(searchLower) ||
            order.contact?.contactName?.toLowerCase().includes(searchLower);
        }

        // Product filter
        let matchesProduct = true;
        if (selectedProduct) {
          matchesProduct = Object.values(order.products).some(
            (product) => product.productCategory === selectedProduct,
          );
        }

        // Size filter
        let matchesSize = true;
        if (selectedSize) {
          matchesSize = Object.values(order.products).some(
            (product) => product.size === selectedSize,
          );
        }

        // Status filter
        let matchesStatus = true;
        if (statusFilter) {
          matchesStatus = order.status === statusFilter;
        }

        if (matchesSearch && matchesProduct && matchesSize && matchesStatus) {
          if (!filtered[companyName]) {
            filtered[companyName] = {};
          }
          filtered[companyName][orderKey] = order;
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
  const handleVerifyAndSend = (order) => {
    navigate("/iml/inventory/details", {
      state: {
        order: order,
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
              {inventoryData.length} orders loaded
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
          <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, order number..."
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
          <h3 className="text-[2vw] font-semibold text-gray-900 mb-2">
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
                  {Object.entries(orders).map(([orderKey, order]) => {
                    const isOrderExpanded =
                      expandedOrders[`${companyName}-${orderKey}`];

                    return (
                      <div
                        key={orderKey}
                        className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                      >
                        {/* Order Header */}
                        <div className="bg-gray-200 px-[1.5vw] py-[.85vw] transition-all flex justify-between items-center">
                          <div
                            onClick={() => toggleOrder(companyName, orderKey)}
                            className="flex items-center gap-4 flex-1 cursor-pointer"
                          >
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
                              <div className="flex items-center gap-[1vw] flex-wrap">
                                <h4 className="text-[1.05vw] font-semibold text-gray-800">
                                  Order #{orderKey}
                                </h4>
                                <span
                                  className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.75vw] font-semibold ${
                                    order.status === "Complete"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-cyan-100 text-cyan-700"
                                  }`}
                                >
                                  {order.status === "Complete"
                                    ? "✓ Complete"
                                    : "🔄 In Production"}
                                </span>
                              </div>
                              <div className="flex gap-6 mt-2 text-[.9vw] text-gray-600">
                                <span>
                                  <strong>Products:</strong>{" "}
                                  {Object.keys(order.products).length}
                                </span>
                                <span>
                                  <strong>Total Produced:</strong>{" "}
                                  <span className="font-bold text-green-700">
                                    {order.totalProduced.toLocaleString(
                                      "en-IN",
                                    )}
                                  </span>
                                </span>
                                <span>
                                  <strong>Contact:</strong>{" "}
                                  {order.contact?.contactName || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Verify & Send Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyAndSend(order);
                            }}
                            className="px-[1.25vw] py-[0.5vw] bg-indigo-600 text-white rounded hover:bg-indigo-700 text-[.85vw] font-medium cursor-pointer shadow-md ml-[1vw]"
                          >
                            📦 Verify & Send
                          </button>
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
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Qty In-Stock
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.values(order.products).map(
                                    (product, idx) => (
                                      <tr
                                        key={product.id}
                                        className="hover:bg-gray-50"
                                      >
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {idx + 1}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-medium">
                                          {product.imlName}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {product.productCategory}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {product.size}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] ">
                                          {product.producedQuantity.toLocaleString(
                                            "en-IN",
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-bold text-green-700">
                                          {product.remainingQuantity.toLocaleString(
                                            "en-IN",
                                          )}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center">
                                          {product.status === "Complete" ? (
                                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                              ✓ Complete
                                            </span>
                                          ) : (
                                            <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-semibold">
                                              🔄 In Production
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ),
                                  )}
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
