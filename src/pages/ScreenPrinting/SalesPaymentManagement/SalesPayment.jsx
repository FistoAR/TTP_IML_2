import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const SALES_PAYMENT_STORAGE_KEY = "screen_printing_sales_payment_data";
const BILLING_STORAGE_KEY = "screen_printing_billing_data";
const SCREEN_PRINTING_ORDERS_KEY = "screen_printing_orders";

export default function SalesPayment() {
  const navigate = useNavigate();
  const [allBills, setAllBills] = useState([]);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedBills, setExpandedBills] = useState({});

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all"); // New
  const [filterSize, setFilterSize] = useState("all"); // New

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  // Check for pending sales payment from stocks
  useEffect(() => {
    const pendingSales = localStorage.getItem("pending_sales_payment");
    if (pendingSales) {
      const data = JSON.parse(pendingSales);

      // Add to sales payment storage
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      const allSalesPayments = salesPaymentData
        ? JSON.parse(salesPaymentData)
        : {};

      if (!allSalesPayments[data.orderId]) {
        allSalesPayments[data.orderId] = [];
      }

      // Add as new bill
      const newBill = {
        billId: Date.now(),
        orderNumber: data.orderNumber,
        contact: data.contact,
        products: data.products,
        estimatedValue: 0,
        createdAt: data.createdAt,
        status: "pending", // pending, completed
      };

      allSalesPayments[data.orderId].push(newBill);
      localStorage.setItem(
        SALES_PAYMENT_STORAGE_KEY,
        JSON.stringify(allSalesPayments)
      );

      // Clear pending
      localStorage.removeItem("pending_sales_payment");

      // Reload data
      loadAllData();
    }
  }, []);

  useEffect(() => {
    if (allBills.length > 0) {
      const groupedOrders = getFilteredGroupedBills();
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
  }, [allBills.length]);

  const loadAllData = () => {
    try {
      // Load sales payment data
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      const allSalesPayments = salesPaymentData
        ? JSON.parse(salesPaymentData)
        : {};

      // Load billing data to check status
      const billingData = localStorage.getItem(BILLING_STORAGE_KEY);
      const allBilling = billingData ? JSON.parse(billingData) : {};

      // Load screen printing orders for reference
      const ordersStored = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
      const allOrders = ordersStored ? JSON.parse(ordersStored) : [];

      // Build bills array
      const billsArray = [];
      Object.entries(allSalesPayments).forEach(([orderId, bills]) => {
        const order = allOrders.find((o) => o.id === orderId);

        bills.forEach((bill) => {
          // Check if bill is completed (sent to billing)
          const isBilled = allBilling[orderId]?.some(
            (b) => b.salesBillId === bill.billId
          );

          billsArray.push({
            orderId,
            ...bill,
            status: isBilled ? "completed" : "pending",
            orderEstimate: order?.orderEstimate?.estimatedValue || 0,
          });
        });
      });

      setAllBills(billsArray);
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

  // Toggle bill expansion
  const toggleBill = (companyName, orderKey, billId) => {
    const key = `${companyName}_${orderKey}_${billId}`;
    setExpandedBills((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group bills by company name and order number
  const groupBillsByCompany = () => {
    const grouped = {};

    allBills.forEach((bill) => {
      const companyName = bill.contact?.company || "Unknown Company";
      const orderNumber = bill.orderNumber || "N/A";

      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      if (!grouped[companyName][orderNumber]) {
        grouped[companyName][orderNumber] = [];
      }

      grouped[companyName][orderNumber].push(bill);
    });

    return grouped;
  };
  

  // Get all unique product categories from bills
  const getUniqueCategories = () => {
    const categories = new Set();
    allBills.forEach((bill) => {
      bill.products.forEach((product) => {
        if (product.productName) {
          categories.add(product.productName);
        }
      });
    });
    return Array.from(categories).sort();
  };

  // Get all unique sizes from bills
  const getUniqueSizes = () => {
    const sizes = new Set();
    allBills.forEach((bill) => {
      bill.products.forEach((product) => {
        if (product.size) {
          sizes.add(product.size);
        }
      });
    });
    return Array.from(sizes).sort();
  };

  // Handle Send to Billing
  const handleSendToBilling = (bill) => {
    localStorage.setItem("editing_sales_payment_bill", JSON.stringify(bill));
    navigate("/screen-printing/sales-payment/details");
  };

  // Filter bills
  const getFilteredGroupedBills = () => {
    const allGrouped = groupBillsByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, bills]) => {
        bills.forEach((bill) => {
          // Search filter
          let matchesSearch = true;
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            matchesSearch =
              companyName.toLowerCase().includes(searchLower) ||
              bill.contact?.contactName?.toLowerCase().includes(searchLower) ||
              bill.contact?.phone?.toLowerCase().includes(searchLower) ||
              orderKey.toLowerCase().includes(searchLower);
          }

          // Status filter
          let matchesStatus = true;
          if (filterStatus !== "all") {
            matchesStatus = bill.status === filterStatus;
          }

          // Category filter - check if bill has products matching the category
          let matchesCategory = true;
          if (filterCategory !== "all") {
            matchesCategory = bill.products.some(
              (product) => product.productName === filterCategory
            );
          }

          // Size filter - check if bill has products matching the size
          let matchesSize = true;
          if (filterSize !== "all") {
            matchesSize = bill.products.some(
              (product) => product.size === filterSize
            );
          }

          if (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesSize
          ) {
            if (!filtered[companyName]) {
              filtered[companyName] = {};
            }
            if (!filtered[companyName][orderKey]) {
              filtered[companyName][orderKey] = [];
            }
            filtered[companyName][orderKey].push(bill);
          }
        });
      });
    });

    return filtered;
  };

  const filteredGroupedBills = getFilteredGroupedBills();
  const hasBills = Object.keys(filteredGroupedBills).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[0.5vw]">
          <h1 className="text-[1.6vw] font-bold text-gray-900">
            Sales Payment Management
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1vw]">
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
                placeholder="Search by company, order, contact..."
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
              <option value="pending">Pending</option>
              <option value="completed">Sent to Billing</option>
            </select>
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
              Size
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
        </div>
      </div>

      {/* Bills Display */}
      {!hasBills ? (
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
          <h3 className="text-[1.05vw] font-semibold text-gray-900 mb-[0.5vw]">
            No Bills Found
          </h3>
          <p className="text-gray-600 text-[0.9vw]">
            {searchTerm || filterStatus !== "all"
              ? "No bills found matching your filters"
              : "No sales payment bills available yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[60vh] overflow-y-auto">
          {Object.entries(filteredGroupedBills).map(([companyName, orders]) => (
            <div
              key={companyName}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Company Header */}
              <div
                onClick={() => toggleCompany(companyName)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-[1.5vw] py-[0.85vw] cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all flex justify-between items-center"
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
                    <p className="text-[0.9vw] text-purple-100">
                      {Object.keys(orders).length} Orders
                    </p>
                  </div>
                </div>
                <div className="text-[0.85vw] bg-white/20 px-[1vw] py-[0.4vw] rounded-full">
                  Total Bills:{" "}
                  {Object.values(orders).reduce(
                    (sum, bills) => sum + bills.length,
                    0
                  )}
                </div>
              </div>

              {/* Orders within Company */}
              {expandedCompanies[companyName] && (
                <div className="space-y-[1.25vw] p-[1vw]">
                  {Object.entries(orders).map(([orderKey, bills]) => {
                    const isOrderExpanded =
                      expandedOrders[`${companyName}_${orderKey}`];

                    return (
                      <div
                        key={orderKey}
                        className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                      >
                        {/* Order Header */}
                        <div
                          onClick={() => toggleOrder(companyName, orderKey)}
                          className="bg-gray-200 px-[1.5vw] py-[0.85vw] cursor-pointer transition-all flex justify-between items-center hover:bg-gray-300"
                        >
                          <div className="flex items-center gap-[0.75vw] flex-1">
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
                                <span className="px-[0.75vw] py-[0.25vw] bg-purple-100 text-purple-700 rounded-full text-[0.75vw] font-semibold">
                                  {bills.length} Bill(s)
                                </span>
                              </div>
                              <div className="flex gap-[1.5vw] mt-[0.5vw] text-[0.9vw] text-gray-600">
                                <span>
                                  <strong>Contact:</strong>{" "}
                                  {bills[0].contact?.contactName || "N/A"}
                                </span>
                                <span>
                                  <strong>Phone:</strong>{" "}
                                  {bills[0].contact?.phone || "N/A"}
                                </span>
                                {bills[0].orderEstimate > 0 && (
                                  <span>
                                    <strong>Order Estimate:</strong>{" "}
                                    <span className="text-blue-600 font-semibold">
                                      ₹{bills[0].orderEstimate.toLocaleString()}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bills within Order */}
                        {isOrderExpanded && (
                          <div className="p-[1vw] space-y-[1vw]">
                            {bills.map((bill, billIndex) => {
                              const isBillExpanded =
                                expandedBills[
                                  `${companyName}_${orderKey}_${bill.billId}`
                                ];

                              return (
                                <div
                                  key={bill.billId}
                                  className={`border-2 rounded-lg overflow-hidden ${
                                    bill.status === "completed"
                                      ? "border-green-300 bg-green-50"
                                      : "border-orange-300 bg-orange-50"
                                  }`}
                                >
                                  {/* Bill Header */}
                                  <div className="px-[1.5vw] py-[0.75vw] transition-all flex justify-between items-center">
                                    <div
                                      onClick={() =>
                                        toggleBill(
                                          companyName,
                                          orderKey,
                                          bill.billId
                                        )
                                      }
                                      className="flex items-center gap-[0.75vw] flex-1 cursor-pointer"
                                    >
                                      <svg
                                        className={`w-[1vw] h-[1vw] transition-transform duration-200 text-gray-700 ${
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
                                      <div className="flex-1">
                                        <div className="flex items-center gap-[1vw]">
                                          <h5 className="text-[0.95vw] font-semibold text-gray-800">
                                            Bill #{billIndex + 1}
                                          </h5>
                                          <span
                                            className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.7vw] font-semibold ${
                                              bill.status === "completed"
                                                ? "bg-green-200 text-green-800"
                                                : "bg-orange-200 text-orange-800"
                                            }`}
                                          >
                                            {bill.status === "completed"
                                              ? "✓ Sent to Billing"
                                              : "○ Pending"}
                                          </span>
                                        </div>
                                        <div className="flex gap-[1.5vw] mt-[0.25vw] text-[0.8vw] text-gray-600">
                                          <span>
                                            <strong>Products:</strong>{" "}
                                            {bill.products.length}
                                          </span>
                                          <span>
                                            <strong>Created:</strong>{" "}
                                            {new Date(
                                              bill.createdAt
                                            ).toLocaleDateString("en-IN", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                          {bill.estimatedValue > 0 && (
                                            <span>
                                              <strong>Estimated:</strong>{" "}
                                              <span className="text-green-600 font-semibold">
                                                ₹
                                                {bill.estimatedValue.toLocaleString()}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    {bill.status === "pending" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendToBilling(bill);
                                        }}
                                        className="px-[1.25vw] py-[0.5vw] bg-blue-600 text-white rounded-lg font-semibold text-[0.85vw] hover:bg-blue-700 transition-all cursor-pointer shadow-md ml-[1vw]"
                                      >
                                        Process Bill
                                      </button>
                                    )}
                                    {bill.status === "completed" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendToBilling(bill);
                                        }}
                                        className="px-[1.25vw] py-[0.5vw] bg-green-600 text-white rounded-lg font-medium text-[0.85vw] hover:bg-green-700 transition-all cursor-pointer ml-[1vw]"
                                      >
                                        View Details
                                      </button>
                                    )}
                                  </div>

                                  {/* Bill Products */}
                                  {isBillExpanded && (
                                    <div className="px-[1.5vw] pb-[1vw] pt-[1vw] bg-white">
                                      <div className="overflow-x-auto rounded-lg border border-gray-300 ">
                                        <table className="w-full border-collapse">
                                          <thead>
                                            <tr className="bg-gray-100">
                                              <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                                                S.No
                                              </th>
                                              <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                                                Product Name
                                              </th>
                                              <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                                                Size
                                              </th>
                                              <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                                                Printing Name
                                              </th>
                                              <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                                                Quantity
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {bill.products.map(
                                              (product, idx) => (
                                                <tr
                                                  key={idx}
                                                  className="hover:bg-gray-50"
                                                >
                                                  <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw]">
                                                    {idx + 1}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw] font-medium">
                                                    {product.productName}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw]">
                                                    {product.size}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw]">
                                                    {product.printingName}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw] font-semibold text-blue-600">
                                                    {product.quantity}
                                                  </td>
                                                </tr>
                                              )
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
}
