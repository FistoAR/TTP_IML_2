// DispatchManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_DISPATCH = "iml_dispatch";
const STORAGE_KEY_BILLING = "iml_billing_data";
const ORDERS_STORAGE_KEY = "imlorders";

const DispatchManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [dispatchData, setDispatchData] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedBills, setExpandedBills] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Load dispatch and billing data
  useEffect(() => {
    loadDispatchData();
    loadBillingData();
  }, [location]);

  // Extract unique categories and sizes when dispatch data changes
  useEffect(() => {
    if (dispatchData.length > 0) {
      const categories = new Set();
      const sizes = new Set();
      
      dispatchData.forEach(record => {
        record.products?.forEach(product => {
          if (product.productCategory) {
            categories.add(product.productCategory);
          }
          if (product.size) {
            sizes.add(product.size);
          }
        });
      });
      
      setAvailableCategories(Array.from(categories).sort());
      setAvailableSizes(Array.from(sizes).sort());
    }
  }, [dispatchData]);

  const loadDispatchData = () => {
    const stored = localStorage.getItem(STORAGE_KEY_DISPATCH);
    const dispatchRecords = stored ? JSON.parse(stored) : [];
    setDispatchData(dispatchRecords);

    // Auto-expand all
    const companies = {};
    const orders = {};
    const bills = {};
    
    dispatchRecords.forEach((record) => {
      const companyKey = record.companyName || "Unknown Company";
      const orderKey = record.orderNumber || "Unknown Order";
      const billKey = record.billNumber || record.billingId || record.id;
      
      if (companyKey) companies[companyKey] = true;
      if (orderKey) orders[orderKey] = true;
      if (billKey) bills[billKey] = true;
    });
    
    setExpandedCompanies(companies);
    setExpandedOrders(orders);
    setExpandedBills(bills);
  };

  const loadBillingData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BILLING);
      const billingRecords = stored ? JSON.parse(stored) : {};
      
      const allRecords = [];
      Object.values(billingRecords).forEach(orderBills => {
        orderBills.forEach(bill => {
          allRecords.push(bill);
        });
      });
      
      setBillingData(allRecords);
    } catch (error) {
      console.error("Error loading billing data:", error);
      setBillingData([]);
    }
  };

  // Get unique products for a dispatch record (avoid duplicates)
  const getUniqueProducts = (dispatchRecords) => {
    const productMap = new Map();
    
    dispatchRecords.forEach(record => {
      record.products?.forEach(product => {
        const key = `${product.imlName}_${product.productCategory}_${product.size}_${product.productId}`;
        if (!productMap.has(key)) {
          productMap.set(key, {
            ...product,
            totalQuantity: product.quantity || product.finalQty || 0
          });
        } else {
          // If same product exists, sum the quantities
          const existing = productMap.get(key);
          existing.totalQuantity += (product.quantity || product.finalQty || 0);
        }
      });
    });
    
    return Array.from(productMap.values());
  };

  // Group dispatch data by company, order, and bill
  const groupedData = useMemo(() => {
    // First filter by search term
    const searchFiltered = dispatchData.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.companyName?.toLowerCase().includes(searchLower) ||
        record.orderNumber?.toLowerCase().includes(searchLower) ||
        record.billNumber?.toLowerCase().includes(searchLower) ||
        record.lrNumber?.toLowerCase().includes(searchLower) ||
        record.driverName?.toLowerCase().includes(searchLower) ||
        record.vehicleNumber?.toLowerCase().includes(searchLower) ||
        record.products?.some(
          (p) =>
            p.imlName?.toLowerCase().includes(searchLower) ||
            p.productCategory?.toLowerCase().includes(searchLower),
        )
      );
    });

    // Then filter by status
    const statusFiltered = filterStatus === "all"
      ? searchFiltered
      : searchFiltered.filter((record) => record.status === filterStatus);

    // Then filter by product category
    const categoryFiltered = filterCategory === "all"
      ? statusFiltered
      : statusFiltered.filter((record) => 
          record.products?.some((p) => p.productCategory === filterCategory)
        );

    // Then filter by size
    const sizeFiltered = filterSize === "all"
      ? categoryFiltered
      : categoryFiltered.filter((record) => 
          record.products?.some((p) => p.size === filterSize)
        );

    // Group by company → order → bill
    const grouped = {};
    
    sizeFiltered.forEach((record) => {
      const company = record.companyName || "Unknown Company";
      if (!grouped[company]) {
        grouped[company] = {};
      }
      
      const orderNum = record.orderNumber || "Unknown Order";
      if (!grouped[company][orderNum]) {
        grouped[company][orderNum] = {};
      }
      
      // Group by bill number
      const billKey = record.billNumber || "Bill-" + (record.billingId || record.id);
      if (!grouped[company][orderNum][billKey]) {
        grouped[company][orderNum][billKey] = [];
      }
      
      grouped[company][orderNum][billKey].push(record);
    });

    return grouped;
  }, [dispatchData, searchTerm, filterStatus, filterCategory, filterSize]);

  const toggleCompany = (company) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [company]: !prev[company],
    }));
  };

  const toggleOrder = (orderNum) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderNum]: !prev[orderNum],
    }));
  };

  const toggleBill = (billKey) => {
    setExpandedBills((prev) => ({
      ...prev,
      [billKey]: !prev[billKey],
    }));
  };

  const handleViewDispatch = (record) => {
    navigate("/iml/dispatch-details", {
      state: { dispatchRecord: record },
    });
  };

  // Get billing details for a specific bill
  const getBillDetails = (orderNumber, billNumber) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BILLING);
      const billingRecords = stored ? JSON.parse(stored) : {};
      
      for (const orderBills of Object.values(billingRecords)) {
        const bill = orderBills.find(b => 
          b.orderNumber === orderNumber && 
          (b.billNumber === billNumber || b.billingId === billNumber)
        );
        if (bill) return bill;
      }
      return null;
    } catch (error) {
      console.error("Error getting bill details:", error);
      return null;
    }
  };

  // Get original product details
  const getOriginalProductDetails = (orderNumber, productId) => {
    try {
      const orders = JSON.parse(
        localStorage.getItem(ORDERS_STORAGE_KEY) || "[]"
      );

      const order = orders.find(
        o => o.orderNumber === orderNumber || o.id === orderNumber
      );

      if (!order || !order.products) return {};

      return (
        order.products.find(p => p.id == productId) || {}
      );
    } catch (error) {
      console.error("Error fetching original product details:", error);
      return {};
    }
  };

  // Get status count
  const getStatusCount = (status) => {
    return dispatchData.filter((record) => record.status === status).length;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterSize("all");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[0.8vw] shadow-sm mb-[1vw] p-[1.5vw]">
          <div className="flex justify-between items-center mb-[1vw]">
            <div>
              <h1 className="text-[1.8vw] font-bold text-gray-800">
                🚚 Dispatch Management
              </h1>
              <p className="text-[0.85vw] text-gray-600 mt-[0.3vw]">
                Manage order dispatch and logistics - Grouped by Bill
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.8vw] text-gray-500">Total Dispatches</p>
              <p className="text-[1.5vw] font-bold text-green-600">
                {dispatchData.length}
              </p>
            </div>
          </div>


          {/* Search and Filter Row */}
          <div className="space-y-[1vw]">

            {/* Filter Controls */}
            <div className="grid grid-cols-5 gap-[1vw]">
              {/* Search */}
              <div className="block">
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by company, order, bill, LR number, driver, or IML name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-[0.9vw] px-[0.8vw] py-[0.5vw] pl-[2.25vw] border-2 border-gray-300 rounded-[0.6vw] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <svg
                    className="absolute left-[0.8vw] top-1/2 transform -translate-y-1/2 w-[1.2vw] h-[1.2vw] text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              {/* Status Filter */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-[0.9vw] px-[0.8vw] py-[0.5vw] border-2 border-gray-300 rounded-[0.6vw] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Product Category Filter */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Product Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full text-[0.9vw] px-[0.8vw] py-[0.5vw] border-2 border-gray-300 rounded-[0.6vw] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Size
                </label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full text-[0.9vw] px-[0.8vw] py-[0.5vw] border-2 border-gray-300 rounded-[0.6vw] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Sizes</option>
                  {availableSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-gray-700 hover:to-gray-800 transition-all shadow-md cursor-pointer flex items-center justify-center gap-[0.5vw]"
                >
                  <span>🔄</span> Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Data - Hierarchical: Company → Order → Bill */}
        <div className="space-y-[1vw] max-h-[55vh] overflow-y-auto">
          {Object.keys(groupedData).length === 0 ? (
            <div className="bg-white rounded-[0.8vw] shadow-sm p-[3vw] text-center">
              <div className="text-[3vw] mb-[1vw]">📦</div>
              <h3 className="text-[1.2vw] font-semibold text-gray-700 mb-[0.5vw]">
                No Dispatch Records
              </h3>
              <p className="text-[0.9vw] text-gray-500">
                {dispatchData.length === 0 
                  ? "Orders will appear here once moved to dispatch" 
                  : "No records match your current filters"}
              </p>
              {dispatchData.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-[1vw] px-[1.5vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.6vw] text-[0.9vw] font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupedData).map(([company, orders]) => (
              <div
                key={company}
                className="bg-white rounded-[0.8vw] shadow-sm overflow-hidden"
              >
                {/* Company Header */}
                <div
                  onClick={() => toggleCompany(company)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 p-[1vw] cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-[0.8vw]">
                      <span className="text-[1.5vw]">🏢</span>
                      <div>
                        <h2 className="text-[1.2vw] font-bold text-white">
                          {company}
                        </h2>
                        <p className="text-[0.75vw] text-green-100">
                          {Object.keys(orders).length} Order(s)
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-[1.5vw] h-[1.5vw] text-white transition-transform ${
                        expandedCompanies[company] ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Orders */}
                {expandedCompanies[company] && (
                  <div className="p-[1vw]">
                    {Object.entries(orders).map(([orderNum, bills]) => (
                      <div
                        key={orderNum}
                        className="mb-[1vw] last:mb-0 border-2 border-gray-200 rounded-[0.6vw] overflow-hidden"
                      >
                        {/* Order Header */}
                        <div
                          onClick={() => toggleOrder(orderNum)}
                          className="bg-gradient-to-r from-cyan-100 to-blue-100 p-[0.8vw] cursor-pointer hover:from-cyan-200 hover:to-blue-200 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-[0.6vw]">
                              <span className="text-[1.2vw]">📦</span>
                              <div>
                                <h3 className="text-[1vw] font-semibold text-cyan-900">
                                  Order #{orderNum}
                                </h3>
                                <p className="text-[0.85vw] text-cyan-700">
                                  {Object.keys(bills).length} Bill(s)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-[1vw]">
                              <svg
                                className={`w-[1.2vw] h-[1.2vw] text-cyan-600 transition-transform ${
                                  expandedOrders[orderNum] ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Bills for this order */}
                        {expandedOrders[orderNum] && (
                          <div className="bg-white p-[1vw] space-y-[1vw]">
                            {Object.entries(bills).map(([billKey, dispatchRecords]) => {
                              const isBillExpanded = expandedBills[billKey] || false;
                              const billDetails = getBillDetails(orderNum, billKey);
                              const uniqueProducts = getUniqueProducts(dispatchRecords);
                              
                              return (
                                <div
                                  key={billKey}
                                  className="border-2 border-gray-300 rounded-[0.6vw] overflow-hidden"
                                >
                                  {/* Bill Header - Clickable to expand/collapse */}
                                  <div 
                                    onClick={() => toggleBill(billKey)}
                                    className="bg-gradient-to-r from-gray-50 to-green-50 p-[0.8vw] cursor-pointer hover:from-gray-100 hover:to-green-100 transition-all"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-[0.5vw]">
                                        <svg
                                          className={`w-[0.8vw] h-[0.8vw] text-gray-600 transition-transform ${
                                            isBillExpanded ? "rotate-90" : ""
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
                                          <div className="flex items-center gap-[0.5vw] mb-[0.3vw]">
                                            <h4 className="text-[0.95vw] font-semibold text-gray-800">
                                              Bill: {billKey}
                                            </h4>
                                            <span className="text-[0.85vw] px-[0.5vw] py-[0.2vw] bg-green-100 text-green-700 rounded">
                                              {uniqueProducts.length} Product(s)
                                            </span>
                                          </div>
                                          <p className="text-[0.85vw] text-gray-600">
                                            Contact: {dispatchRecords[0]?.contactName || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[0.85vw] text-gray-600">Bill Amount</p>
                                        <p className="text-[0.9vw] font-bold text-green-700">
                                          ₹{parseFloat(billDetails?.estimatedValue || dispatchRecords[0]?.estimatedAmount || 0).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Bill Details - Collapsible */}
                                  {isBillExpanded && (
                                    <div className="p-[0.8vw] border-t border-gray-200">
                                      {/* Status and Dispatch Info */}
                                      <div className="grid grid-cols-4 gap-[0.5vw] mb-[0.8vw]">
                                        <div className="bg-blue-50 border border-blue-200 rounded-[0.4vw] p-[0.5vw]">
                                          <p className="text-[0.85vw] text-gray-600">Status</p>
                                          <p className={`text-[0.85vw] font-bold ${
                                            dispatchRecords[0]?.status === "Dispatched" ? "text-green-700" :
                                            dispatchRecords[0]?.status === "In Transit" ? "text-blue-700" :
                                            dispatchRecords[0]?.status === "Delivered" ? "text-purple-700" :
                                            "text-yellow-700"
                                          }`}>
                                            {dispatchRecords[0]?.status || "Pending"}
                                          </p>
                                        </div>
                                        <div className="bg-green-50 border border-green-200 rounded-[0.4vw] p-[0.5vw]">
                                          <p className="text-[0.85vw] text-gray-600">Dispatch Date</p>
                                          <p className="text-[0.85vw] font-bold text-green-700">
                                            {dispatchRecords[0]?.dispatchDate ? 
                                              new Date(dispatchRecords[0].dispatchDate).toLocaleDateString("en-IN") : 
                                              "Not set"}
                                          </p>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-200 rounded-[0.4vw] p-[0.5vw]">
                                          <p className="text-[0.85vw] text-gray-600">LR Number</p>
                                          <p className="text-[0.85vw] font-bold text-purple-700">
                                            {dispatchRecords[0]?.lrNumber || "Not assigned"}
                                          </p>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-[0.4vw] p-[0.5vw]">
                                          <p className="text-[0.85vw] text-gray-600">Vehicle</p>
                                          <p className="text-[0.85vw] font-bold text-amber-700">
                                            {dispatchRecords[0]?.vehicleNumber || "Not assigned"}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Products Table - Using unique products */}
                                      <div className="mb-[0.8vw]">
                                        <h5 className="text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                                          Products in Dispatch ({uniqueProducts.length} unique items)
                                        </h5>
                                        
                                        <div className="overflow-x-auto rounded-lg border border-gray-300 max-h-[20vh]">
                                          <table className="w-full border-collapse">
                                            <thead>
                                              <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  S.No
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  IML Name
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  Product Category
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  Size
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  IML Type
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  Total Dispatch Qty
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {uniqueProducts.map((product, index) => {
                                                const originalProduct = getOriginalProductDetails(
                                                  dispatchRecords[0]?.orderNumber,
                                                  product.productId
                                                );
                                                
                                                return (
                                                  <tr 
                                                    key={index}
                                                    className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                  >
                                                    <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                      {index + 1}
                                                    </td>
                                                    <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] font-medium">
                                                      {product.imlName || "N/A"}
                                                    </td>
                                                    <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                      {product.productCategory || "N/A"}
                                                    </td>
                                                    <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                      {product.size || "N/A"}
                                                    </td>
                                                    <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                      {originalProduct.imlType || product.imlType || "N/A"}
                                                    </td>
                                                    <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] font-semibold text-green-600">
                                                      {product.totalQuantity?.toLocaleString() || 0}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                      
                                      {/* Action Button */}
                                      <div className="flex justify-end mt-[1vw]">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDispatch(dispatchRecords[0]);
                                          }}
                                          className="px-[1.2vw] py-[0.5vw] bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-[0.4vw] text-[0.85vw] font-semibold hover:from-orange-700 hover:to-red-700 transition-all shadow-md cursor-pointer flex items-center gap-[0.5vw]"
                                        >
                                          <span>📋</span> View Dispatch Details
                                        </button>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatchManagement;