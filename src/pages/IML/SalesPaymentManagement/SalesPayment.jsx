// SalesPayment.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_INVENTORY_FOLLOWUPS = "iml_inventory_followups";

const SalesPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [salesData, setSalesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Expand states
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Load sales data from inventory
  const loadSalesData = () => {
    console.log("🔄 Loading sales data...");

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const storedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY_FOLLOWUPS);

    if (!storedOrders || !storedInventory) {
      console.warn("⚠️ No orders or inventory data found");
      setSalesData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const inventoryData = JSON.parse(storedInventory);

      const salesItems = [];

      // Process each order
      allOrders.forEach((order) => {
        order.products?.forEach((product) => {
          if (product.moveToPurchase) {
            const key = `${order.id}_${product.id}`;
            const inventoryHistory = inventoryData[key];

            // Only include if inventory verification has been done
            if (inventoryHistory && inventoryHistory.length > 0) {
              // Get total final quantity sent for billing
              const totalFinalQty = inventoryHistory.reduce((sum, entry) => {
                return sum + (parseInt(entry.finalQty) || 0);
              }, 0);

              // Get latest production quantity
              const latestEntry = inventoryHistory[inventoryHistory.length - 1];
              const productionQty = latestEntry.productionQty || 0;

              salesItems.push({
                id: key,
                orderId: order.id,
                productId: product.id,
                orderNumber: order.orderNumber,
                companyName: order.contact.company,
                contactName: order.contact.contactName,
                phone: order.contact.phone,
                email: order.contact.email,
                address: order.contact.address,
                productCategory: product.productName,
                size: product.size,
                imlName: product.imlName,
                imlType: product.imlType,
                lidColor: product.lidColor || "N/A",
                tubColor: product.tubColor || "N/A",
                productionQty: productionQty,
                finalQty: totalFinalQty,
                orderQuantity: product.imlType.includes("LID") 
                  ? product.lidLabelQty 
                  : product.tubLabelQty,
                inventoryHistory: inventoryHistory,
              });
            }
          }
        });
      });

      console.log("✅ Sales items loaded:", salesItems.length);
      setSalesData(salesItems);
    } catch (error) {
      console.error("❌ Error loading sales data:", error);
      setSalesData([]);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🚀 SalesPayment mounted");
    loadSalesData();
  }, []);

  // Reload when location state changes
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log("🔃 Refresh flag detected");
      loadSalesData();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-expand companies and first order
  useEffect(() => {
    if (salesData.length > 0) {
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
  }, [salesData]);

  // Group by company → order
  const groupByCompany = () => {
    const grouped = {};

    salesData.forEach((item) => {
      const companyName = item.companyName;
      const orderNumber = item.orderNumber;

      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      if (!grouped[companyName][orderNumber]) {
        grouped[companyName][orderNumber] = {
          orderDetails: {
            orderId: item.orderId,
            orderNumber: item.orderNumber,
            contactName: item.contactName,
            phone: item.phone,
            email: item.email,
            address: item.address,
          },
          products: [],
        };
      }

      grouped[companyName][orderNumber].products.push(item);
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    salesData.forEach((item) => {
      products.add(item.productCategory);
    });
    return Array.from(products).sort();
  }, [salesData]);

  // Get unique sizes
  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    salesData.forEach((item) => {
      if (!selectedProduct || item.productCategory === selectedProduct) {
        sizes.add(item.size);
      }
    });
    return Array.from(sizes).sort();
  }, [salesData, selectedProduct]);

  // Filter data
  const getFilteredGroupedData = () => {
    const allGrouped = groupByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, orderData]) => {
        const filteredProducts = orderData.products.filter((item) => {
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

          return matchesSearch && matchesProduct && matchesSize;
        });

        if (filteredProducts.length > 0) {
          if (!filtered[companyName]) {
            filtered[companyName] = {};
          }
          filtered[companyName][orderKey] = {
            orderDetails: orderData.orderDetails,
            products: filteredProducts,
          };
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

  // Open sales payment details
  const handleSendToBill = (companyName, orderData) => {
    navigate("/iml/sales-details", {
      state: {
        orderDetails: orderData.orderDetails,
        products: orderData.products,
        companyName: companyName,
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
              Sales & Payment Management
            </h1>

            <button
              onClick={() => {
                console.log("🔄 Manual refresh clicked");
                loadSalesData();
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
              {salesData.length} items loaded
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Sales Data Found
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedProduct || selectedSize
              ? "No items match your filters"
              : "No inventory has been verified yet"}
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
                  {Object.entries(orders).map(([orderKey, orderData]) => {
                    const isOrderExpanded =
                      expandedOrders[`${companyName}-${orderKey}`];

                    return (
                      <div
                        key={orderKey}
                        className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                      >
                        {/* Order Header */}
                        <div className="bg-gray-200 px-[1.5vw] py-[.85vw] flex justify-between items-center cursor-pointer hover:bg-gray-300" onClick={() => toggleOrder(companyName, orderKey)}>
                          <div
                            
                            className="flex items-center gap-4 flex-1 transition-all rounded p-[0.5vw]"
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
                              <h4 className="text-[1.05vw] font-semibold text-gray-800">
                                Order #{orderKey}
                              </h4>
                              <div className="flex gap-6 mt-2 text-[.9vw] text-gray-600">
                                <span>
                                  <strong>Contact:</strong>{" "}
                                  {orderData.orderDetails.contactName}
                                </span>
                                <span>
                                  <strong>Phone:</strong>{" "}
                                  {orderData.orderDetails.phone}
                                </span>
                                <span>
                                  <strong>Products:</strong>{" "}
                                  {orderData.products.length}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Send to Bill Button */}
                          <button
                            onClick={() =>
                              handleSendToBill(companyName, orderData)
                            }
                            className="px-[1vw] py-[.35vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700 text-[.85vw] font-medium cursor-pointer transition-all shadow-md"
                          >
                            💰 Send to Bill
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
                                      Company Name
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      IML Name
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Product Category
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Size
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Order Qty
                                    </th>
                                    <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                      Final Qty
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderData.products.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                        {idx + 1}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {item.companyName}                                        
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {item.imlName}                                        
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                        {item.productCategory}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                        {item.size}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-semibold text-blue-700">
                                        {item.orderQuantity.toLocaleString(
                                          "en-IN"
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-bold text-green-700">
                                        {item.finalQty.toLocaleString("en-IN")}
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

export default SalesPayment;
