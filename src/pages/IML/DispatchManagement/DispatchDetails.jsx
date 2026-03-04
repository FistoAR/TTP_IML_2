// DispatchDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const STORAGE_KEY_DISPATCH = "iml_dispatch";
const ORDERS_STORAGE_KEY = "imlorders"; // Added to access orders data
const SALES_STORAGE_KEY = "iml_sales_payment_data";

// LR Number options for autocomplete
const LR_NUMBER_OPTIONS = [
  "LR001",
  "LR002",
  "LR003",
  "LR004",
  "LR005",
  "LR006",
  "LR007",
  "LR008",
  "LR009",
  "LR010",
];

const DispatchDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { dispatchRecord } = location.state || {};

  // Add state for customer details
  const [customerDetails, setCustomerDetails] = useState({
    customerName: "",
    phoneNo: "",
    preferredLocation: "",
    preferredTransport: "",
    deliveryMethod: "",
  });

  const [lrNumber, setLrNumber] = useState("");
  const [lrDropdownOpen, setLrDropdownOpen] = useState(false);
  const [filteredLRNumbers, setFilteredLRNumbers] = useState(LR_NUMBER_OPTIONS);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState("Ready for Dispatch");
  
  const [lrDocument, setLrDocument] = useState(null);
  const [lrDocumentPreview, setLrDocumentPreview] = useState(null);

  const lrInputRef = useRef(null);

  useEffect(() => {
    if (dispatchRecord) {
      setLrNumber(dispatchRecord.lrNumber || "");
      setDriverName(dispatchRecord.driverName || "");
      setDriverPhone(dispatchRecord.driverPhone || "");
      setVehicleNumber(dispatchRecord.vehicleNumber || "");
      setDispatchStatus(dispatchRecord.status || "Ready for Dispatch");
      

      // Load customer details from sales payment data
      loadCustomerDetails(dispatchRecord);
    }
  }, [dispatchRecord]);

  // Add this function to load customer details
  const loadCustomerDetails = (dispatchRecord) => {
    try {
      // Get sales payment data
      const salesPaymentData = localStorage.getItem(SALES_STORAGE_KEY);
      if (!salesPaymentData) return;

      const allSalesPayments = JSON.parse(salesPaymentData);

      // Find the bill that matches this dispatch record
      Object.keys(allSalesPayments).forEach((orderId) => {
        const bills = allSalesPayments[orderId];
        if (Array.isArray(bills)) {
          bills.forEach((bill) => {
            // Check if this bill matches the dispatch record
            if (
              bill.billId === dispatchRecord.salesBillId ||
              bill.orderNumber === dispatchRecord.orderNumber
            ) {
              if (bill.customerDetails) {
                setCustomerDetails({
                  customerName: bill.customerDetails.customerName || "",
                  phoneNo: bill.customerDetails.phoneNo || "",
                  preferredLocation:
                    bill.customerDetails.preferredLocation || "",
                  preferredTransport:
                    bill.customerDetails.preferredTransport || "",
                  deliveryMethod: bill.customerDetails.deliveryMethod || "",
                });
              }
            }
          });
        }
      });
    } catch (error) {
      console.error("Error loading customer details:", error);
    }
  };

  // Handle LR input change with autocomplete
  const handleLrInputChange = (e) => {
    const value = e.target.value;
    setLrNumber(value);

    const filtered = LR_NUMBER_OPTIONS.filter((lr) =>
      lr.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredLRNumbers(filtered);
    setLrDropdownOpen(true);
  };

  // Handle LR selection from dropdown
  const handleLrSelect = (lr) => {
    setLrNumber(lr);
    setLrDropdownOpen(false);
    setFilteredLRNumbers(LR_NUMBER_OPTIONS);
  };

  // Handle LR document upload
  const handleLrDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLrDocument(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLrDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setLrDocumentPreview("pdf");
      }
    }
  };

  // Remove LR document
  const removeLrDocument = () => {
    setLrDocument(null);
    setLrDocumentPreview(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (lrInputRef.current && !lrInputRef.current.contains(event.target)) {
        setLrDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveDispatchDetails = () => {
    if (!lrNumber.trim()) {
      alert("⚠️ Please enter LR Number!");
      return;
    }

    // Update in localStorage
    const stored = localStorage.getItem(STORAGE_KEY_DISPATCH);
    if (stored) {
      const allDispatch = JSON.parse(stored);
      const updatedDispatch = allDispatch.map((dispatch) =>
        dispatch.id === dispatchRecord.id
          ? {
              ...dispatch,
              lrNumber: lrNumber,
              driverName: driverName,
              driverPhone: driverPhone,
              vehicleNumber: vehicleNumber,
              status: dispatchStatus,
              lrDocument: lrDocument
                ? {
                    name: lrDocument.name,
                    type: lrDocument.type,
                    size: lrDocument.size,
                    uploadedAt: new Date().toISOString(),
                  }
                : null,
              updatedAt: new Date().toISOString(),
            }
          : dispatch,
      );
      localStorage.setItem(
        STORAGE_KEY_DISPATCH,
        JSON.stringify(updatedDispatch),
      );
      alert("✅ Dispatch details saved successfully!");
      navigate("/iml/dispatchManagement", { state: { refreshData: true } });
    }
  };

  const handleBack = () => {
    navigate("/iml/dispatchManagement");
  };

  if (!dispatchRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Invalid Access
          </h2>
          <p className="text-gray-600 mb-4">No dispatch record provided</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium cursor-pointer hover:bg-green-700"
          >
            Back to Dispatch Management
          </button>
        </div>
      </div>
    );
  }

  // Calculate payment summary
  const calculatePaymentSummary = () => {
    const billAmount = parseFloat(
      dispatchRecord.estimatedAmount || dispatchRecord.estimatedValue || 0,
    );
    const totalPaid =
      dispatchRecord.paymentRecords?.reduce(
        (sum, record) => sum + (parseFloat(record.amount) || 0),
        0,
      ) || 0;
    const balanceDue = Math.max(billAmount - totalPaid, 0);

    return { billAmount, totalPaid, balanceDue };
  };

  const paymentSummary = calculatePaymentSummary();

  const getOriginalProductDetails = (orderNumber, productId) => {
    try {
      const orders = JSON.parse(
        localStorage.getItem(ORDERS_STORAGE_KEY) || "[]",
      );

      const order = orders.find(
        (o) => o.orderNumber === orderNumber || o.id === orderNumber,
      );

      if (!order || !order.products) return {};

      return order.products.find((p) => p.id == productId) || {};
    } catch (error) {
      console.error("Error fetching original product details:", error);
      return {};
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
        {/* Header */}
        <div className="flex  items-center p-[1vw] px-[1.5vw] border-b border-gray-200 relative">
          <button
            className="flex gap-[.5vw] items-center cursor-pointer hover:text-green-600 transition-colors"
            onClick={handleBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[1vw] h-[1vw]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw]">Back</span>
          </button>
          <div className="text-center w-full">
            <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
              🚚 Dispatch Bill Details
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              Bill: {dispatchRecord.billNumber || dispatchRecord.billingId} •
              Order: #{dispatchRecord.orderNumber}
            </p>
          </div>
        </div>

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[75vh] overflow-y-auto">
          {/* Bill Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-green-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📋</span> Bill Information
            </h3>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Bill Number
                </label>
                <input
                  type="text"
                  value={
                    dispatchRecord.billNumber ||
                    dispatchRecord.billingId ||
                    "N/A"
                  }
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Order Number
                </label>
                <input
                  type="text"
                  value={dispatchRecord.orderNumber}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Company Name
                </label>
                <input
                  type="text"
                  value={dispatchRecord.companyName}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={dispatchRecord.contactName}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Phone
                </label>
                <input
                  type="text"
                  value={dispatchRecord.phone}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Bill Amount (₹)
                </label>
                <input
                  type="text"
                  value={paymentSummary.billAmount.toLocaleString("en-IN")}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>

              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Payment Status
                </label>
                <input
                  type="text"
                  value={dispatchRecord.paymentStatus || "Pending"}
                  disabled
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border rounded-[0.4vw] font-bold ${
                    dispatchRecord.paymentStatus === "Paid"
                      ? "bg-green-100 border-green-300 text-green-800"
                      : dispatchRecord.paymentStatus === "Partial"
                        ? "bg-blue-100 border-blue-300 text-blue-800"
                        : "bg-yellow-100 border-yellow-300 text-yellow-800"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Delivery Information Section - UPDATED */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[.7vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📍</span> Delivery Information
            </h3>

            <div className="grid grid-cols-3 gap-[1vw] mb-[1vw]">
              {/* Customer Name */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerDetails.customerName}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw] font-semibold text-gray-800"
                  placeholder="Will be fetched from sales payment"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={customerDetails.phoneNo}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw] font-semibold text-gray-800"
                />
              </div>

              {/* Preferred Location */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={customerDetails.preferredLocation}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw] text-black"
                />
              </div>

              {/* Preferred Transport Name */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Preferred Transport Name
                </label>
                <input
                  type="text"
                  value={customerDetails.preferredTransport}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 bg-white rounded-[0.4vw] text-black"
                />
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Delivery Method
                </label>
                <input
                  type="text"
                  value={
                    customerDetails.deliveryMethod === "doorstep"
                      ? "Doorstep Delivery"
                      : customerDetails.deliveryMethod === "godown"
                        ? "Godown Pickup"
                        : customerDetails.deliveryMethod || "Not specified"
                  }
                  disabled
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border rounded-[0.4vw] font-bold ${
                    customerDetails.deliveryMethod === "doorstep"
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : customerDetails.deliveryMethod === "godown"
                        ? "bg-green-100 border-green-300 text-green-800"
                        : "bg-gray-100 border-gray-300 text-gray-800"
                  }`}
                />
              </div>
            </div>

          
          </div>

          {/* Logistics Information */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">🚛</span> Logistics Information
            </h3>
            <div className="grid grid-cols-3 gap-[1vw]">
              {/* LR Number Section */}
              <div className="relative" ref={lrInputRef}>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  LR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={handleLrInputChange}
                  onFocus={() => setLrDropdownOpen(true)}
                  placeholder="Type or select LR number..."
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Autocomplete Dropdown */}
                {lrDropdownOpen && filteredLRNumbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                    {filteredLRNumbers.map((lr) => (
                      <div
                        key={lr}
                        onClick={() => handleLrSelect(lr)}
                        className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        {lr}
                      </div>
                    ))}
                  </div>
                )}

                {/* No matches message */}
                {lrDropdownOpen && filteredLRNumbers.length === 0 && (
                  <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg">
                    <div className="px-[0.75vw] py-[0.5vw] text-[.85vw] text-gray-500">
                      No LR numbers found
                    </div>
                  </div>
                )}
              </div>

              {/* LR Document Upload */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  LR Document
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleLrDocumentUpload}
                    className="hidden"
                    id="lr-document-upload"
                  />
                  <label
                    htmlFor="lr-document-upload"
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-gray-600">
                      {lrDocument ? lrDocument.name : "Upload LR document..."}
                    </span>
                    <span className="text-blue-600">📎</span>
                  </label>

                  {lrDocument && (
                    <button
                      onClick={removeLrDocument}
                      className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.7vw] hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>

                {lrDocumentPreview && (
                  <div className="mt-[0.5vw]">
                    {lrDocumentPreview === "pdf" ? (
                      <div className="flex items-center gap-[0.5vw] text-green-600 text-[0.7vw]">
                        <span>📄</span>
                        <span>PDF document uploaded</span>
                      </div>
                    ) : (
                      <div className="w-full h-32 border border-gray-300 rounded-[0.4vw] overflow-hidden">
                        <img
                          src={lrDocumentPreview}
                          alt="LR Document Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Driver Details */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name..."
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Driver Phone
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Enter driver phone..."
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number..."
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Dispatch Status
                </label>
                <select
                  value={dispatchStatus}
                  onChange={(e) => setDispatchStatus(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📦</span> Product Details (
              {dispatchRecord.products?.length || 0} products)
            </h3>
            <div className="overflow-auto max-h-[40vh]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100 sticky top-0">
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      S.No
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      IML Name
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Product Category
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Size
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      IML Type
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Lid/Tub Color
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Dispatch Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchRecord.products?.map((product, idx) => {
                    const originalProduct = getOriginalProductDetails(
                      dispatchRecord.orderNumber,
                      product.productId,
                    );
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-amber-100 transition-colors"
                      >
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {idx + 1}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-purple-700">
                          {product.imlName}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.productCategory || "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.size || "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {originalProduct.imlType || product.imlType || "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {originalProduct.lidColor ||
                            product.lidColor ||
                            "N/A"}{" "}
                          /{" "}
                          {originalProduct.tubColor ||
                            product.tubColor ||
                            "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-bold text-green-700">
                          {product.finalQty || product.quantity || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-[1vw]">
            <button
              onClick={handleBack}
              className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveDispatchDetails}
              className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer"
            >
              💾 Save & Update Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchDetails;
