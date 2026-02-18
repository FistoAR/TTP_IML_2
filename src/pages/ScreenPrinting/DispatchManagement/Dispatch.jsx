// Dispatch.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_DISPATCH_NEW = "screen_printing_dispatch_data";

const Dispatch = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [dispatchData, setDispatchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedBills, setExpandedBills] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Load dispatch data
  useEffect(() => {
    loadDispatchData();
  }, [location]);

  // Extract unique categories and sizes when dispatch data changes
  useEffect(() => {
    if (dispatchData.length > 0) {
      const categories = new Set();
      const sizes = new Set();
      
      dispatchData.forEach(record => {
        record.products?.forEach(product => {
          if (product.productName) {
            categories.add(product.productName);
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
  try {
    let dispatchRecords = [];
    
    // Check both storage keys
    const dispatchDataKey = "screen_printing_dispatch_data"; // From DispatchDetails.jsx
    const billingDispatchKey = "screen_printing_dispatch"; // From billing section
    
    const dispatchData = localStorage.getItem(dispatchDataKey);
    const billingDispatchData = localStorage.getItem(billingDispatchKey);
    
    console.log("Checking storage keys:", {
      dispatchDataKey: dispatchData ? "Has data" : "No data",
      billingDispatchKey: billingDispatchData ? "Has data" : "No data"
    });
    
    // 1. First, load data from DispatchDetails storage
    if (dispatchData) {
      const allDispatch = JSON.parse(dispatchData);
      console.log("Data from dispatch details:", allDispatch);
      
      if (Array.isArray(allDispatch)) {
        // Format 1: Direct array of records
        dispatchRecords = [...dispatchRecords, ...allDispatch];
        console.log("Added array format data:", allDispatch.length, "records");
      } else if (typeof allDispatch === 'object') {
        // Format 2: Object with order keys
        Object.entries(allDispatch).forEach(([orderKey, bills]) => {
          if (Array.isArray(bills)) {
            bills.forEach((bill) => {
              const formattedBill = {
                ...bill,
                orderNumber: bill.orderNumber || orderKey || "Unknown Order",
                companyName: bill.companyName || bill.contact?.company || "Unknown Company",
                contactName: bill.customerName || bill.contact?.contactName || "Unknown Contact",
                phone: bill.customerPhone || bill.contact?.phone || "N/A",
                dispatchStatus: bill.dispatchStatus || bill.status || "pending",
                dispatchId: bill.dispatchId || bill.id || `bill-${Date.now()}`,
                estimatedValue: bill.estimatedValue || bill.estimatedAmount || 0,
                products: bill.products || [],
                lrNumber: bill.lrNumber || "",
                transporterName: bill.transporterName || "",
                vehicleNumber: bill.vehicleNumber || "",
                driverName: bill.driverName || "",
                driverPhone: bill.driverPhone || "",
                dispatchDate: bill.dispatchDate || "",
                remarks: bill.remarks || ""
              };
              dispatchRecords.push(formattedBill);
            });
          }
        });
      }
    }
    
    // 2. Then, load data from billing section dispatch storage
    if (billingDispatchData) {
      try {
        const billingDispatch = JSON.parse(billingDispatchData);
        console.log("Data from billing dispatch:", billingDispatch);
        
        if (Array.isArray(billingDispatch)) {
          billingDispatch.forEach((bill) => {
            // Format billing dispatch records to match expected structure
            const formattedBill = {
              ...bill,
              orderNumber: bill.orderNumber || bill.orderId || "Unknown Order",
              companyName: bill.companyName || bill.contact?.company || "Unknown Company",
              contactName: bill.contactName || bill.contact?.contactName || "Unknown Contact",
              phone: bill.phone || bill.contact?.phone || "N/A",
              dispatchStatus: bill.status || "pending", // billing uses "status"
              dispatchId: bill.id || `dispatch-${Date.now()}`,
              estimatedValue: bill.estimatedAmount || bill.estimatedValue || 0,
              products: bill.products || [],
              lrNumber: bill.lrNumber || "",
              transporterName: bill.transporterName || "",
              vehicleNumber: bill.vehicleNumber || "",
              driverName: bill.driverName || "",
              driverPhone: bill.driverPhone || "",
              dispatchDate: bill.dispatchDate || "",
              remarks: bill.remarks || "",
              // Mark as from billing section (not yet processed in dispatch details)
              isFromBilling: true
            };
            
            // Check if this bill already exists in dispatchRecords
            const exists = dispatchRecords.some(existing => 
              existing.billingId === bill.billingId || 
              existing.dispatchId === bill.id
            );
            
            if (!exists) {
              dispatchRecords.push(formattedBill);
              console.log("Added billing dispatch record:", formattedBill.orderNumber);
            }
          });
        }
      } catch (error) {
        console.error("Error parsing billing dispatch data:", error);
      }
    }
    
    // Add debugging
    console.log("Total dispatch records found:", dispatchRecords.length);
    console.log("All dispatch records:", dispatchRecords);
    
    // Sort by creation date - latest first
    const sortedRecords = dispatchRecords.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.dispatchDate || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.dispatchDate || b.updatedAt || 0);
      return dateB - dateA;
    });

    setDispatchData(sortedRecords);

    // Auto-expand all
    const companies = {};
    const orders = {};
    const bills = {};
    
    sortedRecords.forEach((record) => {
      const companyKey = record.companyName;
      const orderKey = record.orderNumber;
      const billKey = record.dispatchId || record.id;
      
      if (companyKey) companies[companyKey] = true;
      if (orderKey) orders[orderKey] = true;
      if (billKey) bills[billKey] = true;
    });
    
    setExpandedCompanies(companies);
    setExpandedOrders(orders);
    setExpandedBills(bills);
    
    console.log("Final sorted dispatch data:", sortedRecords);
  } catch (error) {
    console.error("Error loading dispatch data:", error);
    setDispatchData([]);
  }
};

// Add this function inside the component
const migrateAndSyncData = () => {
  try {
    const oldKey = "screen_printing_dispatch";
    const dispatchDetailsKey = "screen_printing_dispatch_data";
    
    const oldData = localStorage.getItem(oldKey);
    const dispatchDetailsData = localStorage.getItem(dispatchDetailsKey);
    
    // If we have old data but no dispatch details data, migrate it
    if (oldData && !dispatchDetailsData) {
      try {
        const parsedOldData = JSON.parse(oldData);
        
        // Convert to array format if needed
        if (Array.isArray(parsedOldData)) {
          localStorage.setItem(dispatchDetailsKey, oldData);
          console.log("Migrated array data from old key to dispatch details key");
        } else if (typeof parsedOldData === 'object') {
          // Convert object to array
          const dispatchArray = [];
          Object.values(parsedOldData).forEach(billArray => {
            if (Array.isArray(billArray)) {
              dispatchArray.push(...billArray);
            }
          });
          localStorage.setItem(dispatchDetailsKey, JSON.stringify(dispatchArray));
          console.log("Converted object data to array and migrated to dispatch details key");
        }
      } catch (error) {
        console.error("Error migrating data:", error);
      }
    }
    
    // Also ensure billing dispatch data gets copied to dispatch details key
    if (oldData && dispatchDetailsData) {
      try {
        // Merge both datasets
        const parsedOldData = JSON.parse(oldData);
        const parsedDetailsData = JSON.parse(dispatchDetailsData);
        
        if (Array.isArray(parsedOldData) && Array.isArray(parsedDetailsData)) {
          // Merge arrays, removing duplicates
          const mergedData = [...parsedDetailsData];
          parsedOldData.forEach(bill => {
            const exists = mergedData.some(existing => 
              existing.billingId === bill.billingId || 
              existing.id === bill.id
            );
            if (!exists) {
              mergedData.push(bill);
            }
          });
          
          localStorage.setItem(dispatchDetailsKey, JSON.stringify(mergedData));
          console.log("Merged billing dispatch data with dispatch details data");
        }
      } catch (error) {
        console.error("Error merging data:", error);
      }
    }
  } catch (error) {
    console.error("Error in migrateAndSyncData:", error);
  }
};

// Update the useEffect to include migration and storage listener
useEffect(() => {
  // Migrate data on first load
  migrateAndSyncData();
  
  // Load data
  loadDispatchData();
  
  // Listen for storage changes (when DispatchDetails saves data)
  const handleStorageChange = (e) => {
    if (e.key === "screen_printing_dispatch_data" || e.key === "editing_dispatch_bill") {
      console.log("Storage changed, reloading dispatch data");
      loadDispatchData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Also listen for custom event that can be triggered from DispatchDetails
  const handleCustomEvent = () => {
    loadDispatchData();
  };
  
  window.addEventListener('dispatchDataUpdated', handleCustomEvent);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('dispatchDataUpdated', handleCustomEvent);
  };
}, [location]);

  // Get unique products for a dispatch record
  const getUniqueProducts = (dispatchRecords) => {
    const productMap = new Map();
    
    dispatchRecords.forEach(record => {
      record.products?.forEach(product => {
        const key = `${product.productName}_${product.size}_${product.printingName}`;
        if (!productMap.has(key)) {
          productMap.set(key, {
            ...product,
            totalQuantity: product.quantity || 0
          });
        } else {
          // If same product exists, sum the quantities
          const existing = productMap.get(key);
          existing.totalQuantity += (product.quantity || 0);
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
        record.contactName?.toLowerCase().includes(searchLower) ||
        record.phone?.toLowerCase().includes(searchLower) ||
        record.lrNumber?.toLowerCase().includes(searchLower) ||
        record.driverName?.toLowerCase().includes(searchLower) ||
        record.vehicleNumber?.toLowerCase().includes(searchLower) ||
        record.products?.some(
          (p) =>
            p.productName?.toLowerCase().includes(searchLower) ||
            p.printingName?.toLowerCase().includes(searchLower)
        )
      );
    });

    // Then filter by status
    const statusFiltered = filterStatus === "all"
      ? searchFiltered
      : searchFiltered.filter((record) => record.dispatchStatus === filterStatus);

    // Then filter by product category
    const categoryFiltered = filterCategory === "all"
      ? statusFiltered
      : statusFiltered.filter((record) => 
          record.products?.some((p) => p.productName === filterCategory)
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
      const billKey = record.dispatchId || `Bill-${Date.now()}`;
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
  // Ensure the record has all necessary fields
  const enhancedRecord = {
    ...record,
    // If it's from billing and doesn't have customerName, use contactName
    customerName: record.customerName || record.contactName || "",
    customerPhone: record.customerPhone || record.phone || ""
  };
  
  localStorage.setItem("editing_dispatch_bill", JSON.stringify(enhancedRecord));
  navigate("/screen-printing/dispatch/details");
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
                🚚 Screen Printing Dispatch Management
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
                    placeholder="Search by company, order, contact, LR number..."
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
                  <option value="pending">Pending</option>
                  <option value="dispatched">Dispatched</option>
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
                  ? "Bills will appear here once moved from billing" 
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
                                            Contact: {dispatchRecords[0]?.contactName || "N/A"} • 
                                            Phone: {dispatchRecords[0]?.phone || "N/A"}
                                          </p>
                                        </div>
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
                                            dispatchRecords[0]?.dispatchStatus === "dispatched" ? "text-green-700" : 
                                            "text-yellow-700"
                                          }`}>
                                            {dispatchRecords[0]?.dispatchStatus === "dispatched" ? "✓ Dispatched" : "○ Pending"}
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
                                                  Product Name
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  Size
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  Printing Name
                                                </th>
                                                <th className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-left text-[0.85vw] font-semibold">
                                                  Total Dispatch Qty
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {uniqueProducts.map((product, index) => (                                                
                                                <tr 
                                                  key={index}
                                                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                >
                                                  <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                    {index + 1}
                                                  </td>
                                                  <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] font-medium">
                                                    {product.productName || "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                    {product.size || "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw]">
                                                    {product.printingName || "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] font-semibold text-green-600">
                                                    {product.totalQuantity?.toLocaleString() || 0}
                                                  </td>
                                                </tr>
                                              ))}
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
                                          className={`px-[1.2vw] py-[0.5vw] rounded-[0.4vw] text-[0.85vw] font-semibold hover:from-orange-700 hover:to-red-700 transition-all shadow-md cursor-pointer flex items-center gap-[0.5vw] ${
                                            dispatchRecords[0]?.dispatchStatus === "dispatched"
                                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                                              : "bg-gradient-to-r from-orange-600 to-red-600 text-white"
                                          }`}
                                        >
                                          <span>📋</span>
                                          {dispatchRecords[0]?.dispatchStatus === "dispatched" ? "View Dispatch Details" : "Process Dispatch"}
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

export default Dispatch;