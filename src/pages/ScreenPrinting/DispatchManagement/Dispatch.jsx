import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const DISPATCH_STORAGE_KEY = "screen_printing_dispatch_data";

export default function Dispatch() {
  const navigate = useNavigate();
  const [allDispatchBills, setAllDispatchBills] = useState([]);
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

  useEffect(() => {
    if (allDispatchBills.length > 0) {
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
  }, [allDispatchBills.length]);

  const loadAllData = () => {
    try {
      // Load dispatch data
      const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
      const allDispatch = dispatchData ? JSON.parse(dispatchData) : {};

      // Build bills array
      const billsArray = [];
      Object.entries(allDispatch).forEach(([orderId, bills]) => {
        bills.forEach((bill) => {
          billsArray.push({
            orderId,
            ...bill,
          });
        });
      });

      setAllDispatchBills(billsArray);
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
  const toggleBill = (companyName, orderKey, dispatchId) => {
    const key = `${companyName}_${orderKey}_${dispatchId}`;
    setExpandedBills((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group bills by company name and order number
  const groupBillsByCompany = () => {
    const grouped = {};

    allDispatchBills.forEach((bill) => {
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

  // Handle View/Edit Dispatch
  const handleViewEditDispatch = (bill) => {
    localStorage.setItem("editing_dispatch_bill", JSON.stringify(bill));
    navigate("/screen-printing/dispatch/details");
  };

  const getUniqueCategories = () => {
    const categories = new Set();
    allDispatchBills.forEach((bill) => {
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
    allDispatchBills.forEach((bill) => {
      bill.products.forEach((product) => {
        if (product.size) {
          sizes.add(product.size);
        }
      });
    });
    return Array.from(sizes).sort();
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
              orderKey.toLowerCase().includes(searchLower) ||
              bill.lrNumber?.toLowerCase().includes(searchLower);
          }

          // Status filter
          let matchesStatus = true;
          if (filterStatus !== "all") {
            matchesStatus = bill.dispatchStatus === filterStatus;
          }

          let matchesCategory = true;
          if (filterCategory !== "all") {
            matchesCategory = bill.products.some(
              (product) => product.productName === filterCategory
            );
          }

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
            Dispatch Management
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
              <option value="dispatched">Dispatched</option>
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <h3 className="text-[1.05vw] font-semibold text-gray-900 mb-[0.5vw]">
            No Dispatch Records Found
          </h3>
          <p className="text-gray-600 text-[0.9vw]">
            {searchTerm || filterStatus !== "all"
              ? "No dispatch records found matching your filters"
              : "No dispatch records available yet"}
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
                    <p className="text-[0.9vw] text-indigo-100">
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
                                <span className="px-[0.75vw] py-[0.25vw] bg-indigo-100 text-indigo-700 rounded-full text-[0.75vw] font-semibold">
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
                                  `${companyName}_${orderKey}_${bill.dispatchId}`
                                ];

                              const getStatusColor = () => {
                                if (bill.dispatchStatus === "dispatched")
                                  return "border-green-300 bg-green-50";
                                return "border-orange-300 bg-orange-50";
                              };

                              const getStatusText = () => {
                                if (bill.dispatchStatus === "dispatched")
                                  return {
                                    text: "✓ Dispatched",
                                    color: "bg-green-200 text-green-800",
                                  };
                                return {
                                  text: "○ Pending Dispatch",
                                  color: "bg-orange-200 text-orange-800",
                                };
                              };

                              const status = getStatusText();

                              return (
                                <div
                                  key={bill.dispatchId}
                                  className={`border-2 rounded-lg overflow-hidden ${getStatusColor()}`}
                                >
                                  {/* Bill Header */}
                                  <div className="px-[1.5vw] py-[0.75vw] transition-all flex justify-between items-center">
                                    <div
                                      onClick={() =>
                                        toggleBill(
                                          companyName,
                                          orderKey,
                                          bill.dispatchId
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
                                            className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.7vw] font-semibold ${status.color}`}
                                          >
                                            {status.text}
                                          </span>
                                          {bill.paymentStatus === "paid" && (
                                            <span className="px-[0.6vw] py-[0.2vw] bg-blue-200 text-blue-800 rounded-full text-[0.7vw] font-semibold">
                                              ✓ Paid
                                            </span>
                                          )}
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
                                          {bill.lrNumber && (
                                            <span>
                                              <strong>LR No:</strong>{" "}
                                              <span className="text-purple-600 font-semibold">
                                                {bill.lrNumber}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewEditDispatch(bill);
                                      }}
                                      className={`px-[1.25vw] py-[0.5vw] rounded-lg font-semibold text-[0.85vw] transition-all cursor-pointer shadow-md ml-[1vw] ${
                                        bill.dispatchStatus === "dispatched"
                                          ? "bg-green-600 text-white hover:bg-green-700"
                                          : "bg-blue-600 text-white hover:bg-blue-700"
                                      }`}
                                    >
                                      {bill.dispatchStatus === "dispatched"
                                        ? "View Details"
                                        : "Process Dispatch"}
                                    </button>
                                  </div>

                                  {/* Bill Products */}
                                  {isBillExpanded && (
                                    <div className="px-[1.5vw] py-[1vw] bg-white">
                                      <div className="overflow-x-auto rounded-lg border border-gray-300">
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
