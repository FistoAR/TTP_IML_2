// BillingManagement.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_SALES_BILLING = "iml_sales_billing";
const STORAGE_KEY_ORDERS = "imlorders";

const BillingManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [billingData, setBillingData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  // Load billing data
  useEffect(() => {
    loadBillingData();
  }, [location]);

  const loadBillingData = () => {
    const stored = localStorage.getItem(STORAGE_KEY_SALES_BILLING);
    const billingRecords = stored ? JSON.parse(stored) : [];
    setBillingData(billingRecords);

    // Auto-expand all
    const companies = {};
    const orders = {};
    billingRecords.forEach((record) => {
      companies[record.companyName] = true;
      orders[record.orderNumber] = true;
    });
    setExpandedCompanies(companies);
    setExpandedOrders(orders);
  };

  // Group by company and order
  const groupedData = useMemo(() => {
    const filtered = billingData.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.companyName?.toLowerCase().includes(searchLower) ||
        record.orderNumber?.toLowerCase().includes(searchLower) ||
        record.products?.some(
          (p) =>
            p.imlName?.toLowerCase().includes(searchLower) ||
            p.productCategory?.toLowerCase().includes(searchLower)
        )
      );
    });

    const grouped = {};
    filtered.forEach((record) => {
      const company = record.companyName || "Unknown Company";
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

  const handleViewBill = (record) => {
    navigate("/iml/billing-details", {
      state: { billingRecord: record },
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
                💰 Billing Management
              </h1>
              <p className="text-[0.85vw] text-gray-600 mt-[0.3vw]">
                Manage invoices and payment status
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
              placeholder="Search by company, order, or IML name..."
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
        <div className="space-y-[1vw]">
          {Object.keys(groupedData).length === 0 ? (
            <div className="bg-white rounded-[0.8vw] shadow-sm p-[3vw] text-center">
              <div className="text-[3vw] mb-[1vw]">📋</div>
              <h3 className="text-[1.2vw] font-semibold text-gray-700 mb-[0.5vw]">
                No Billing Records
              </h3>
              <p className="text-[0.9vw] text-gray-500">
                Bills will appear here once orders are sent to billing
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
                    {Object.entries(orders).map(([orderNum, records]) => (
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
                                <p className="text-[0.7vw] text-purple-700">
                                  {records.length} Bill(s)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-[1vw]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewBill(records[0]);
                                }}
                                className="px-[1vw] py-[0.4vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.5vw] text-[0.85vw] font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer"
                              >
                                📄 View Bill
                              </button>
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

                        {/* Product Details */}
                        {expandedOrders[orderNum] && (
                          <div className="bg-white to-orange-50 p-[1vw]">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-amber-100">
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    S.No
                                  </th>
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    IML Name
                                  </th>
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    Product
                                  </th>
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    Size
                                  </th>
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    Quantity
                                  </th>
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    Billing Date
                                  </th>
                                  <th className="px-[0.75vw] py-[0.6vw] text-left text-[0.8vw] font-semibold text-amber-900 border border-amber-200">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {records[0].products.map((product, idx) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-gray-50 bg-white transition-colors"
                                  >
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] border border-amber-200">
                                      {idx + 1}
                                    </td>
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] font-semibold text-purple-700 border border-amber-200">
                                      {product.imlName}
                                    </td>
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] border border-amber-200">
                                      {product.productCategory}
                                    </td>
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] border border-amber-200">
                                      {product.size}
                                    </td>
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] font-semibold text-green-700 border border-amber-200">
                                      {product.finalQty?.toLocaleString("en-IN") || 0}
                                    </td>
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] border border-amber-200">
                                      {new Date(
                                        records[0].billingDate
                                      ).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-[0.75vw] py-[0.5vw] text-[0.8vw] border border-amber-200">
                                      <span
                                        className={`inline-block px-[0.5vw] py-[0.2vw] rounded-[0.3vw] text-[0.7vw] font-semibold ${
                                          records[0].status === "Pending Payment"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {records[0].status || "Pending Payment"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

export default BillingManagement;
