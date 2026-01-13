import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const GOODS_RETURNED_STORAGE_KEY = "screen_printing_goods_returned_data";
const STOCKS_VERIFIED_STORAGE_KEY = "screen_printing_stocks_verified_data";
const SCREEN_PRINTING_ORDERS_KEY = "screen_printing_orders";

export default function Stocks() {
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState([]);
  const [goodsReturnedData, setGoodsReturnedData] = useState({});
  const [stocksVerifiedData, setStocksVerifiedData] = useState({});
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Filters

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all"); // New
  const [filterSize, setFilterSize] = useState("all"); // New

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (allOrders.length > 0) {
      const groupedOrders = getFilteredGroupedOrders();
      const newExpandedCompanies = {};
      const newExpandedOrders = {};

      // Expand all companies
      Object.entries(groupedOrders).forEach(([companyName, orders]) => {
        newExpandedCompanies[companyName] = true;

        // Expand first order for each company
        const orderKeys = Object.keys(orders);
        if (orderKeys.length > 0) {
          const firstOrderKey = orderKeys[0];
          newExpandedOrders[`${companyName}_${firstOrderKey}`] = true;
        }
      });

      setExpandedCompanies(newExpandedCompanies);
      setExpandedOrders(newExpandedOrders);
    }
  }, [allOrders.length]);

  const loadAllData = () => {
    try {
      // Load screen printing orders
      const ordersStored = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
      const allScreenPrintingOrders = ordersStored
        ? JSON.parse(ordersStored)
        : [];

      // Load goods returned data
      const goodsReturned = localStorage.getItem(GOODS_RETURNED_STORAGE_KEY);
      const parsedGoodsReturned = goodsReturned
        ? JSON.parse(goodsReturned)
        : {};
      setGoodsReturnedData(parsedGoodsReturned);

      // Load stocks verified data
      const stocksVerified = localStorage.getItem(STOCKS_VERIFIED_STORAGE_KEY);
      const parsedStocksVerified = stocksVerified
        ? JSON.parse(stocksVerified)
        : {};
      setStocksVerifiedData(parsedStocksVerified);

      // Build orders with goods returned data
      const ordersWithGoods = [];

      Object.entries(parsedGoodsReturned).forEach(([orderId, entries]) => {
        if (entries && entries.length > 0) {
          // Find the matching order from screen_printing_orders
          const matchingOrder = allScreenPrintingOrders.find(
            (order) => order.id === orderId
          );

          if (matchingOrder) {
            // Group goods returned entries by product
            const productsMap = {};
            entries.forEach((entry) => {
              const productKey = `${entry.productId}`;
              if (!productsMap[productKey]) {
                productsMap[productKey] = {
                  productId: entry.productId,
                  productName: entry.productName,
                  size: entry.size,
                  printingName: entry.printingName,
                  totalReceived: 0,
                  entries: [],
                };
              }
              productsMap[productKey].totalReceived += entry.quantityReceived;
              productsMap[productKey].entries.push(entry);
            });

            // Create order object with proper details
            ordersWithGoods.push({
              id: matchingOrder.id,
              contact: matchingOrder.contact,
              orderNumber: matchingOrder.orderNumber,
              products: productsMap,
            });
          }
        }
      });

      setAllOrders(ordersWithGoods);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Toggle company expansion
  const toggleCompany = (companyName) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyName]: !prev[companyName],
    }));
  };

  // Toggle order expansion
  const toggleOrder = (companyName, orderKey) => {
    const key = `${companyName}_${orderKey}`;
    setExpandedOrders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group orders by company name and order number
  const groupOrdersByCompany = () => {
    const grouped = {};

    allOrders.forEach((order) => {
      const companyName = order.contact?.company || "Unknown Company";
      const orderNumber = order.orderNumber || "N/A";

      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      const orderKey = orderNumber;
      grouped[companyName][orderKey] = order;
    });

    return grouped;
  };

  const getUniqueCategories = () => {
    const categories = new Set();
    allOrders.forEach((order) => {
      Object.values(order.products).forEach((product) => {
        if (product.productName) {
          categories.add(product.productName);
        }
      });
    });
    return Array.from(categories).sort();
  };

  // Get all unique sizes
  const getUniqueSizes = () => {
    const sizes = new Set();
    allOrders.forEach((order) => {
      Object.values(order.products).forEach((product) => {
        if (product.size) {
          sizes.add(product.size);
        }
      });
    });
    return Array.from(sizes).sort();
  };

  // Check if entire order is fully verified
  const isOrderFullyVerified = (order) => {
    const products = Object.values(order.products);
    const verifiedData = stocksVerifiedData[order.id] || [];

    // Check if all products are verified
    return products.every((product) =>
      verifiedData.some(
        (verified) =>
          verified.productId === product.productId &&
          verified.quantityVerified === product.totalReceived
      )
    );
  };

  // Get order verification status
  const getOrderVerificationStatus = (order) => {
    const products = Object.values(order.products);
    const verifiedData = stocksVerifiedData[order.id] || [];

    const verifiedCount = products.filter((product) =>
      verifiedData.some((verified) => verified.productId === product.productId)
    ).length;

    if (verifiedCount === 0) return "pending";
    if (verifiedCount === products.length) return "completed";
    return "partial";
  };

  // Handle Verify and Send
  const handleVerifyAndSend = (order) => {
    // Store order info for StocksDetails page
    localStorage.setItem("editing_stock_order", JSON.stringify(order));
    navigate("/screen-printing/stocks/details");
  };

  // Filter orders
  const getFilteredGroupedOrders = () => {
    const allGrouped = groupOrdersByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, order]) => {
        // Search filter
        let matchesSearch = true;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          matchesSearch =
            companyName.toLowerCase().includes(searchLower) ||
            order.contact?.contactName?.toLowerCase().includes(searchLower) ||
            order.contact?.phone?.toLowerCase().includes(searchLower) ||
            orderKey.toLowerCase().includes(searchLower);
        }

        // Status filter
        let matchesStatus = true;
        if (filterStatus !== "all") {
          const status = getOrderVerificationStatus(order);
          if (filterStatus === "verified") {
            matchesStatus = status === "completed";
          } else if (filterStatus === "pending") {
            matchesStatus = status === "pending" || status === "partial";
          }
        }

        // Category filter - check if order has products matching the category
        let matchesCategory = true;
        if (filterCategory !== "all") {
          matchesCategory = Object.values(order.products).some(
            (product) => product.productName === filterCategory
          );
        }

        // Size filter - check if order has products matching the size
        let matchesSize = true;
        if (filterSize !== "all") {
          matchesSize = Object.values(order.products).some(
            (product) => product.size === filterSize
          );
        }

        if (matchesSearch && matchesStatus && matchesCategory && matchesSize) {
          if (!filtered[companyName]) {
            filtered[companyName] = {};
          }
          filtered[companyName][orderKey] = order;
        }
      });
    });

    return filtered;
  };

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const hasOrders = Object.keys(filteredGroupedOrders).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[0.5vw]">
          <h1 className="text-[1.6vw] font-bold text-gray-900">
            Stocks Management
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[1vw]">
          {/* Search */}
          <div>
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-[0.5vw]">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name, order number, or contact"
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[0.8vw]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-[0.9vw] top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-[0.5vw]">
              Product Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[0.8vw]"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-[0.5vw]">
              Product Size
            </label>
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[0.8vw]"
            >
              <option value="all">All Sizes</option>
              {getUniqueSizes().map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

           {/* Status Filter */}
          <div>
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-[0.5vw]">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[0.8vw]"
            >
              <option value="all">All Status</option>
              <option value="verified">Fully Verified</option>
              <option value="pending">Pending / Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Display */}
      {!hasOrders ? (
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
          <h3 className="text-[1.05vw] font-semibold text-gray-900 mb-[0.5vw]">
            No Stocks Found
          </h3>
          <p className="text-gray-600 text-[0.9vw]">
            {searchTerm || filterStatus !== "all"
              ? "No stocks found matching your filters"
              : "No goods have been returned yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[60vh] overflow-y-auto">
          {Object.entries(filteredGroupedOrders).map(
            ([companyName, orders]) => (
              <div
                key={companyName}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Company Header */}
                <div
                  onClick={() => toggleCompany(companyName)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-[1.5vw] py-[0.85vw] cursor-pointer hover:from-indigo-700 hover:to-indigo-800 transition-all flex justify-between items-center"
                >
                  <div className="flex items-center gap-[0.75vw]">
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
                      <p className="text-[0.9vw] text-blue-100">
                        {Object.keys(orders).length} Orders
                      </p>
                    </div>
                  </div>
                  <div className="text-[0.85vw] bg-white/20 px-[1vw] py-[0.4vw] rounded-full">
                    Total Orders: {Object.keys(orders).length}
                  </div>
                </div>

                {/* Orders within Company */}
                {expandedCompanies[companyName] && (
                  <div className="space-y-[1.25vw] p-[1vw]">
                    {Object.entries(orders).map(([orderKey, order]) => {
                      const isOrderExpanded =
                        expandedOrders[`${companyName}_${orderKey}`];
                      const products = Object.values(order.products);
                      const verificationStatus =
                        getOrderVerificationStatus(order);

                      return (
                        <div
                          key={orderKey}
                          className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                        >
                          {/* Order Header */}
                          <div className="bg-gray-200 px-[1.5vw] py-[0.85vw] transition-all flex justify-between items-center">
                            <div
                              onClick={() => toggleOrder(companyName, orderKey)}
                              className="flex items-center gap-[0.75vw] flex-1 cursor-pointer"
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
                                    {orderKey}
                                  </h4>
                                  <span
                                    className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.75vw] font-semibold ${
                                      verificationStatus === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : verificationStatus === "partial"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    {verificationStatus === "completed"
                                      ? "✓ Fully Verified"
                                      : verificationStatus === "partial"
                                      ? "◐ Partially Verified"
                                      : "○ Pending"}
                                  </span>
                                </div>
                                <div className="flex gap-[1.5vw] mt-[0.5vw] text-[0.9vw] text-gray-600">
                                  <span>
                                    <strong>Contact:</strong>{" "}
                                    {order.contact?.contactName || "N/A"}
                                  </span>
                                  <span>
                                    <strong>Phone:</strong>{" "}
                                    {order.contact?.phone || "N/A"}
                                  </span>
                                  <span>
                                    <strong>Products:</strong> {products.length}
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
                              className={`px-[1.25vw] py-[0.5vw] rounded-lg font-semibold text-[0.85vw] transition-all cursor-pointer shadow-md ml-[1vw] ${
                                verificationStatus === "completed"
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {verificationStatus === "completed"
                                ? "View Details"
                                : "Verify & Send"}
                            </button>
                          </div>

                          {/* Products Table */}
                          {isOrderExpanded && (
                            <div className="p-[1.5vw] bg-white">
                              {products.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-200">
                                        <th className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-left text-[0.85vw] font-semibold">
                                          S.No
                                        </th>
                                        <th className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-left text-[0.85vw] font-semibold">
                                          Product Name
                                        </th>
                                        <th className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-left text-[0.85vw] font-semibold">
                                          Size
                                        </th>
                                        <th className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-left text-[0.85vw] font-semibold">
                                          Printing Name
                                        </th>
                                        <th className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-left text-[0.85vw] font-semibold">
                                          Total Received
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {products.map((product, idx) => (
                                        <tr
                                          key={product.productId}
                                          className="hover:bg-gray-50"
                                        >
                                          <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                            {idx + 1}
                                          </td>
                                          <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw] font-medium">
                                            {product.productName}
                                          </td>
                                          <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                            {product.size}
                                          </td>
                                          <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                            {product.printingName}
                                          </td>
                                          <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw] font-semibold text-blue-600">
                                            {product.totalReceived}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-[2vw]">
                                  No products in this order
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
