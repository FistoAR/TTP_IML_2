import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const ORDERS_STORAGE_KEY = "screen_printing_orders";

export default function ScreenPrintingJobWork() {
  const [view, setView] = useState("dashboard"); // dashboard or form
  const [screenPrintingOrders, setScreenPrintingOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewMode, setViewMode] = useState("jobwork"); // jobwork or goodsreturned
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  
  const navigate = useNavigate();

  // Load orders from ScreenPrintingOrders localStorage
  useEffect(() => {
    const loadOrdersFromStorage = () => {
      try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (stored) {
          const allOrders = JSON.parse(stored);
          
          // Filter orders that have at least one product with moveToScreenPrinting = true
          const filteredOrders = allOrders
            .map((order) => {
              // Filter products that are moved to screen printing
              const movedProducts = order.products?.filter(
                (product) => product.moveToScreenPrinting === true
              );
              
              if (movedProducts && movedProducts.length > 0) {
                return {
                  ...order,
                  products: movedProducts,
                };
              }
              return null;
            })
            .filter((order) => order !== null);

          setScreenPrintingOrders(filteredOrders);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      }
    };

    loadOrdersFromStorage();
    
    // Reload on storage change (for cross-tab sync)
    const handleStorageChange = () => {
      loadOrdersFromStorage();
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Auto-expand companies and first order on load
  useEffect(() => {
    if (screenPrintingOrders.length > 0) {
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
  }, [screenPrintingOrders.length]);

  // Auto-expand when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const newExpandedCompanies = {};
      const newExpandedOrders = {};
      const groupedOrders = getFilteredGroupedOrders();

      Object.entries(groupedOrders).forEach(([companyName, orders]) => {
        const companyMatchesSearch = companyName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (companyMatchesSearch) {
          newExpandedCompanies[companyName] = true;
          // Expand all orders for matching company
          Object.keys(orders).forEach((orderKey) => {
            newExpandedOrders[`${companyName}_${orderKey}`] = true;
          });
        }
      });

      setExpandedCompanies(newExpandedCompanies);
      setExpandedOrders(newExpandedOrders);
    }
  }, [searchTerm, screenPrintingOrders]);

  // Group orders by Company & Order Number
  const groupOrdersByCompany = () => {
    const grouped = {};

    // Sort orders by createdAt (latest first)
    const sortedOrders = [...screenPrintingOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    sortedOrders.forEach((order) => {
      const companyName = order.contact?.company || "Unknown Company";
      const orderNumber = order.orderNumber || "NA";

      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      grouped[companyName][orderNumber] = order;
    });

    // Sort companies by latest order date
    const sortedGrouped = {};
    const companiesWithLatestDate = Object.entries(grouped).map(
      ([companyName, orders]) => {
        const latestDate = Math.max(
          ...Object.values(orders).map((order) =>
            new Date(order.createdAt || 0).getTime()
          )
        );
        return { companyName, orders, latestDate };
      }
    );

    companiesWithLatestDate
      .sort((a, b) => b.latestDate - a.latestDate)
      .forEach(({ companyName, orders }) => {
        sortedGrouped[companyName] = orders;
      });

    return sortedGrouped;
  };

  // Get unique product names from all orders
  const getUniqueProducts = () => {
    const products = new Set();
    screenPrintingOrders.forEach((order) => {
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          products.add(product.productName || "Uncategorized");
        });
      }
    });
    return Array.from(products).sort();
  };

  // Get unique sizes for a specific product
  const getUniqueSizesForProduct = (productName) => {
    const sizes = new Set();
    screenPrintingOrders.forEach((order) => {
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          if (product.productName === productName) {
            sizes.add(product.size || "No Size");
          }
        });
      }
    });
    return Array.from(sizes).sort();
  };

  // Filter orders with search and filters
  const getFilteredGroupedOrders = () => {
    const allGrouped = groupOrdersByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, order]) => {
        // 1. SEARCH FILTER
        let matchesSearch = true;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          matchesSearch =
            companyName.toLowerCase().includes(searchLower) ||
            order.contact.contactName?.toLowerCase().includes(searchLower) ||
            order.contact.phone?.toLowerCase().includes(searchLower) ||
            order.products?.some((product) =>
              product.printingName?.toLowerCase().includes(searchLower)
            );
        }

        // 2. PRODUCT FILTER
        let matchesProduct = true;
        if (selectedProduct) {
          matchesProduct = order.products?.some(
            (product) => product.productName === selectedProduct
          );
        }

        // 3. SIZE FILTER
        let matchesSize = true;
        if (selectedSize && selectedProduct) {
          matchesSize = order.products?.some(
            (product) =>
              product.productName === selectedProduct &&
              product.size === selectedSize
          );
        }

        // Apply all filters
        if (matchesSearch && matchesProduct && matchesSize) {
          if (!filtered[companyName]) {
            filtered[companyName] = {};
          }
          filtered[companyName][orderKey] = order;
        }
      });
    });

    return filtered;
  };

  // Reset size filter when product changes
  useEffect(() => {
    setSelectedSize("");
  }, [selectedProduct]);

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

  // ✅ UPDATED: Handle edit with dynamic routing based on viewMode
  const handleEditOrder = (order) => {
    // Store order data in localStorage for the details page
    localStorage.setItem("editing_jobwork_order", JSON.stringify(order));
    
    // Navigate based on active view mode
    if (viewMode === "jobwork") {
      navigate("/screen-printing/jobwork-details");
    } else if (viewMode === "goodsreturned") {
      navigate("/screen-printing/goods-returned");
    }
  };

  // Handle back from form
  const handleBack = () => {
    setView("dashboard");
    setEditingOrder(null);
  };

  // Handle form submission
  const handleOrderSubmit = (orderData) => {
    console.log("Job work data submitted:", orderData);
    // You can add logic here to save job work data
    setView("dashboard");
    setEditingOrder(null);
  };

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const hasOrders = Object.keys(filteredGroupedOrders).length > 0;

  // ✅ Get dynamic title based on view mode
  const getPageTitle = () => {
    if (viewMode === "jobwork") {
      return "Screen Printing Job Work (Job Work)";
    } else if (viewMode === "goodsreturned") {
      return "Screen Printing Job Work (Goods Returned)";
    }
    return "Screen Printing Job Work";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[0.25vw]">
          {/* ✅ UPDATED: Dynamic title */}
          <h1 className="text-[1.6vw] font-bold text-gray-900">
            {getPageTitle()}
          </h1>

          {/* View Mode Toggle Buttons */}
          <div className="flex gap-[1vw]">
            <button
              onClick={() => setViewMode("jobwork")}
              className={`px-[1.5vw] py-[0.65vw] rounded-lg font-semibold text-[0.9vw] transition-all duration-200 cursor-pointer border-2 ${
                viewMode === "jobwork"
                  ? "bg-blue-600 text-white border-blue-700 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Job Work
            </button>
            <button
              onClick={() => setViewMode("goodsreturned")}
              className={`px-[1.5vw] py-[0.65vw] rounded-lg font-semibold text-[0.9vw] transition-all duration-200 cursor-pointer border-2 ${
                viewMode === "goodsreturned"
                  ? "bg-green-600 text-white border-green-700 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Goods Returned
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company name, printing name or contact"
                  className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[0.8vw]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-[0.9vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
                Filter by Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[0.8vw]"
              >
                <option value="">All Products</option>
                {getUniqueProducts().map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
                Filter by Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                disabled={!selectedProduct}
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-[0.8vw]"
                style={{ maxWidth: "100%" }}
              >
                <option value="">All Sizes</option>
                {selectedProduct &&
                  getUniqueSizesForProduct(selectedProduct).map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
              </select>
            </div>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-[1.05vw] font-semibold text-gray-900 mb-2">
            No Job Work Orders Found
          </h3>
          <p className="text-gray-600 text-[0.9vw]">
            {searchTerm || selectedProduct || selectedSize
              ? "No orders found matching your filters"
              : "No products have been moved to Screen Printing yet. Move products from Screen Printing Orders to see them here."}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[60vh] overflow-y-auto">
          {/* Company Level */}
          {Object.entries(filteredGroupedOrders).map(([companyName, orders]) => (
            <div
              key={companyName}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* LEVEL 1: Company Header */}
              <div
                onClick={() => toggleCompany(companyName)}
                className="bg-[#3d64bb] text-white px-[1.5vw] py-[0.85vw] cursor-pointer hover:bg-[#2f4d99] transition-all flex justify-between items-center"
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
                    <p className="text-[0.9vw] text-blue-100">
                      {Object.keys(orders).length} Orders
                    </p>
                  </div>
                </div>
                <div className="text-[0.85vw] bg-white/20 px-4 py-2 rounded-full">
                  Total Orders: {Object.keys(orders).length}
                </div>
              </div>

              {/* LEVEL 2: Orders within Company */}
              {expandedCompanies[companyName] && (
                <div className="space-y-[1.25vw] p-[1vw]">
                  {Object.entries(orders).map(([orderKey, order]) => {
                    const isOrderExpanded = expandedOrders[`${companyName}_${orderKey}`];

                    return (
                      <div
                        key={orderKey}
                        className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                      >
                        {/* Order Header */}
                        <div className="bg-gray-200 px-[1.5vw] py-[0.85vw] transition-all flex justify-between items-center">
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
                              <div className="flex items-center gap-4 flex-wrap">
                                <h4 className="text-[1.05vw] font-semibold text-gray-800">
                                  {orderKey}
                                </h4>
                              </div>
                              <div className="flex gap-6 mt-2 text-[0.9vw] text-gray-600">
                                <span>
                                  <strong>Contact:</strong> {order.contact.contactName}
                                </span>
                                <span>
                                  <strong>Phone:</strong> {order.contact.phone}
                                </span>
                                <span>
                                  <strong>Products:</strong> {order.products?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ✅ UPDATED: Edit Button with dynamic routing */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
                            }}
                            className="px-[1vw] py-[0.35vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[0.85vw] font-medium transition-all"
                          >
                            Edit
                          </button>
                        </div>

                        {/* LEVEL 3: Products Table */}
                        {isOrderExpanded && (
                          <div className="p-[1.5vw] bg-white">
                            {order.products && order.products.length > 0 ? (
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
                                        Printing Color Type
                                      </th>
                                      <th className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-left text-[0.85vw] font-semibold">
                                        Order Quantity
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.products.map((product, idx) => (
                                      <tr
                                        key={product.id || idx}
                                        className="hover:bg-gray-50"
                                      >
                                        <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                          {idx + 1}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw] font-medium">
                                          {product.productName || "NA"}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                          {product.size || "NA"}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                          {product.printingName || "NA"}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                          {product.printType || "NA"}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[0.75vw] text-[0.85vw]">
                                          {product.quantity || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-8">
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
          ))}
        </div>
      )}

      {/* Search Results Info */}
      {searchTerm && !hasOrders && (
        <div className="mt-6 text-center text-[0.9vw]">
          <p className="text-gray-600">
            No result found matching <span className="font-semibold">{searchTerm}</span>
          </p>
        </div>
      )}
    </div>
  );
}
