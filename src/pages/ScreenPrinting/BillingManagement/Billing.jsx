// Billing.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_BILLING = "screen_printing_billing_data";

const Billing = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [billingData, setBillingData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedBills, setExpandedBills] = useState({});

  // Load billing data
  useEffect(() => {
    loadBillingData();
  }, [location]);

  const loadBillingData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BILLING);
      const billingRecords = stored ? JSON.parse(stored) : {};
      
      // Convert the object structure to array for easier processing
      const allRecords = [];
      Object.values(billingRecords).forEach(orderBills => {
        orderBills.forEach(bill => {
          allRecords.push(bill);
        });
      });

      // Sort - Latest entries first
      const sortedRecords = allRecords.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.billingDate || 0);
        const dateB = new Date(b.createdAt || b.billingDate || 0);
        return dateB - dateA; // Latest first
      });

      setBillingData(sortedRecords);

      // Auto-expand ALL (companies, orders, and bills)
      const companies = {};
      const orders = {};
      const bills = {};
      
      sortedRecords.forEach((record) => {
        const companyKey = record.companyName || record.contact?.company;
        const orderKey = record.orderNumber;
        const billKey = record.billingId || record.id;
        
        // Expand everything by default
        if (companyKey) companies[companyKey] = true;
        if (orderKey) orders[orderKey] = true;
        if (billKey) bills[billKey] = true;
      });
      
      setExpandedCompanies(companies);
      setExpandedOrders(orders);
      setExpandedBills(bills);
    } catch (error) {
      console.error("Error loading billing data:", error);
      setBillingData([]);
    }
  };

  // Group by company and order
  const groupedData = useMemo(() => {
    const filtered = billingData.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (record.companyName?.toLowerCase().includes(searchLower) || 
         record.contact?.company?.toLowerCase().includes(searchLower)) ||
        record.orderNumber?.toLowerCase().includes(searchLower) ||
        (record.contact?.contactName?.toLowerCase().includes(searchLower)) ||
        record.products?.some(
          (p) =>
            p.product?.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower) ||
            p.imlName?.toLowerCase().includes(searchLower)
        )
      );
    });

    const grouped = {};
    filtered.forEach((record) => {
      const company = record.companyName || record.contact?.company || "Unknown Company";
      if (!grouped[company]) {
        grouped[company] = {};
      }
      const orderNum = record.orderNumber || "Unknown Order";
      if (!grouped[company][orderNum]) {
        grouped[company][orderNum] = [];
      }
      grouped[company][orderNum].push(record);
    });

    return grouped;
  }, [billingData, searchTerm]);

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

  const toggleBill = (billId) => {
    setExpandedBills((prev) => ({
      ...prev,
      [billId]: !prev[billId],
    }));
  };

  const handleViewBill = (bill) => {
    navigate("/screen-printing/billing/details", {
      state: { billingRecord: bill },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[0.8vw] shadow-sm mb-[1vw] p-[1.5vw]">
          <div className="flex justify-between items-center mb-[1vw]">
            <div>
              <h1 className="text-[1.8vw] font-bold text-gray-800">
                💰 Screen Printing Billing Management
              </h1>
              <p className="text-[0.85vw] text-gray-600 mt-[0.3vw]">
                Manage individual bills from Screen Printing Sales Payment
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.8vw] text-gray-500">Total Bills</p>
              <p className="text-[1.5vw] font-bold text-blue-600">
                {billingData.length}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by company, order, contact, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-[0.9vw] px-[1vw] py-[0.6vw] pl-[2.5vw] border-2 border-gray-300 rounded-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Billing Data */}
        <div className="space-y-[1vw] max-h-[56vh] overflow-y-auto">
          {Object.keys(groupedData).length === 0 ? (
            <div className="bg-white rounded-[0.8vw] shadow-sm p-[3vw] text-center">
              <div className="text-[3vw] mb-[1vw]">📋</div>
              <h3 className="text-[1.2vw] font-semibold text-gray-700 mb-[0.5vw]">
                No Billing Records
              </h3>
              <p className="text-[0.9vw] text-gray-500">
                Bills will appear here once orders are sent from Screen Printing Sales Payment
              </p>
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
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 p-[1vw] cursor-pointer hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-[0.8vw]">
                      <span className="text-[1.5vw]">🏢</span>
                      <div>
                        <h2 className="text-[1.2vw] font-bold text-white">
                          {company}
                        </h2>
                        <p className="text-[0.75vw] text-blue-100">
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
                          className="bg-gradient-to-r from-purple-100 to-pink-100 p-[0.8vw] cursor-pointer hover:from-purple-200 hover:to-pink-200 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-[0.6vw]">
                              <span className="text-[1.2vw]">📦</span>
                              <div>
                                <h3 className="text-[1vw] font-semibold text-purple-900">
                                  Order #{orderNum}
                                </h3>
                                <p className="text-[0.85vw] text-purple-700">
                                  {bills.length} Bill(s) • Contact: {bills[0]?.contact?.contactName || bills[0]?.contactName || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-[1vw]">
                              <div className="text-right">
                                <p className="text-[0.85vw] text-gray-600">Total Bills</p>
                                <p className="text-[0.9vw] font-bold text-blue-700">
                                  {bills.length}
                                </p>
                              </div>
                              <svg
                                className={`w-[1.2vw] h-[1.2vw] text-purple-600 transition-transform ${
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

                        {/* Bills List */}
                        {expandedOrders[orderNum] && (
                          <div className="bg-white p-[1vw] space-y-[1vw]">
                            {bills.map((bill, billIndex) => {
                              const billId = bill.billingId || bill.id;
                              const isBillExpanded = expandedBills[billId] || false;
                              const isDispatched = bill.status === "Dispatched" || bill.dispatchedAt;
                              
                              return (
                                <div
                                  key={billId}
                                  className="border-2 border-gray-300 rounded-[0.6vw] overflow-hidden"
                                >
                                  {/* Bill Header - Clickable to expand/collapse */}
                                  <div 
                                    onClick={() => toggleBill(billId)}
                                    className="bg-gradient-to-r from-gray-50 to-blue-50 p-[0.8vw] cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-all"
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
                                              Bill #{billIndex + 1} - {bill.products.length} Products
                                            </h4>
                                            <span className="text-[0.85vw] px-[0.5vw] py-[0.2vw] bg-blue-100 text-blue-700 rounded">
                                              ID: {bill.billId || bill.billingId}
                                            </span>
                                          </div>
                                          <p className="text-[0.85vw] text-gray-600">
                                            Created: {new Date(bill.createdAt || bill.billingDate).toLocaleDateString("en-IN")}
                                            {bill.updatedAt && ` • Updated: ${new Date(bill.updatedAt).toLocaleDateString("en-IN")}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[0.85vw] text-gray-600">Bill Amount</p>
                                        <p className="text-[0.9vw] font-bold text-blue-700">
                                          ₹{parseFloat(bill.estimatedValue || 0).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Bill Details - Collapsible */}
                                  {isBillExpanded && (
                                    <div className="p-[0.8vw] border-t border-gray-200">
                                      {/* Products Table */}
                                      <div className="mb-[0.8vw]">
                                        <div className="flex items-center justify-between mb-[0.5vw]">
                                          <h5 className="text-[0.85vw] font-semibold text-gray-700">
                                            Products ({bill.products.length} items)
                                          </h5>
                                          <span
                                            className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.85vw] font-semibold ${
                                              bill.status === "Paid"
                                                ? "bg-green-100 text-green-700"
                                                : bill.status === "Partial"
                                                ? "bg-blue-100 text-blue-700"
                                                : bill.status === "Dispatched"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-yellow-100 text-yellow-700"
                                            }`}
                                          >
                                            {isDispatched ? "Dispatched" : (bill.status || "Pending")}
                                          </span>
                                        </div>
                                        
                                        {/* Products Table */}
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
                                                  Quantity
                                                </th>
                                               
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {bill.products.map((product, index) => (
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
                                                  <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] font-semibold text-blue-600">
                                                    {product.quantity?.toLocaleString() || 0}
                                                  </td>
                                                 
                                                </tr>
                                              ))}
                                              
                                              {/* Total Row */}
                                              <tr className="bg-gray-100 font-bold">
                                                <td 
                                                  colSpan="4" 
                                                  className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] text-right"
                                                >
                                                  Total Quantities:
                                                </td>
                                                <td className="border border-gray-300 px-[0.8vw] py-[0.4vw] text-[0.85vw] text-blue-600">
                                                  {bill.products.reduce((sum, p) => sum + (p.quantity || 0), 0).toLocaleString()}
                                                </td>
                                                
                                                
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>
                                        
                                        {/* Summary Section */}
                                        <div className="mt-[0.8vw] grid grid-cols-3 gap-[0.5vw]">
                                          <div className="bg-blue-50 border border-blue-200 rounded-[0.4vw] p-[0.5vw]">
                                            <p className="text-[0.85vw] text-gray-600">Total Products</p>
                                            <p className="text-[0.85vw] font-bold text-blue-700">
                                              {bill.products.length}
                                            </p>
                                          </div>
                                          <div className="bg-green-50 border border-green-200 rounded-[0.4vw] p-[0.5vw]">
                                            <p className="text-[0.85vw] text-gray-600">Total Quantity</p>
                                            <p className="text-[0.85vw] font-bold text-green-700">
                                              {bill.products.reduce((sum, p) => sum + (p.quantity || 0), 0).toLocaleString()}
                                            </p>
                                          </div>
                                          <div className="bg-purple-50 border border-purple-200 rounded-[0.4vw] p-[0.5vw]">
                                            <p className="text-[0.85vw] text-gray-600">Total Bill Amount</p>
                                            <p className="text-[0.85vw] font-bold text-purple-700">
                                              ₹{parseFloat(bill.estimatedValue || 0).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Action Button - Only View Bill */}
                                      <div className="flex justify-end mt-[1vw]">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewBill(bill);
                                          }}
                                          className="px-[1.2vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.4vw] text-[0.85vw] font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md cursor-pointer flex items-center gap-[0.5vw]"
                                        >
                                          <span>📄</span> View Full Bill Details
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

export default Billing;