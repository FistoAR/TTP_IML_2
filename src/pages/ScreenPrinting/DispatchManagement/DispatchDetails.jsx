import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const DISPATCH_STORAGE_KEY = "screen_printing_dispatch_data";

export default function DispatchDetails() {
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);

  // LR Details
  const [lrNumber, setLrNumber] = useState("");
  const [lrDocument, setLrDocument] = useState(null);
  const [lrDocumentName, setLrDocumentName] = useState("");

  // Customer Dispatch Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");

  // Additional Details
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Load bill data
  useEffect(() => {
    const storedBill = localStorage.getItem("editing_dispatch_bill");
    if (storedBill) {
      const parsedBill = JSON.parse(storedBill);
      setBillData(parsedBill);

      // Load existing data if available
      setLrNumber(parsedBill.lrNumber || "");
      setLrDocumentName(parsedBill.lrDocumentName || "");
      setCustomerName(parsedBill.customerName || parsedBill.contact?.contactName || "");
      setCustomerPhone(parsedBill.customerPhone || parsedBill.contact?.phone || "");
      setCustomerEmail(parsedBill.customerEmail || parsedBill.contact?.email || "");
      setCustomerAddress(parsedBill.customerAddress || parsedBill.contact?.address || "");
      setCustomerCity(parsedBill.customerCity || "");
      setCustomerState(parsedBill.customerState || "");
      setCustomerPincode(parsedBill.customerPincode || "");
      setTransporterName(parsedBill.transporterName || "");
      setVehicleNumber(parsedBill.vehicleNumber || "");
      setDriverName(parsedBill.driverName || "");
      setDriverPhone(parsedBill.driverPhone || "");
      setDispatchDate(parsedBill.dispatchDate || new Date().toISOString().split("T")[0]);
      setRemarks(parsedBill.remarks || "");
    } else {
      alert("No dispatch data found. Redirecting back...");
      navigate("/screen-printing/dispatch");
    }
  }, [navigate]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setLrDocument(reader.result);
        setLrDocumentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!lrNumber.trim()) {
      alert("Please enter LR Number");
      return false;
    }

    if (!customerName.trim()) {
      alert("Please enter Customer Name");
      return false;
    }

    if (!customerPhone.trim()) {
      alert("Please enter Customer Phone");
      return false;
    }

    if (!customerAddress.trim()) {
      alert("Please enter Customer Address");
      return false;
    }

    if (!dispatchDate) {
      alert("Please select Dispatch Date");
      return false;
    }

    return true;
  };

  // Handle Save
  const handleSave = () => {
    if (!validateForm()) return;

    if (!window.confirm("Save dispatch details?")) {
      return;
    }

    try {
      updateDispatchData(false);
      alert("Dispatch details saved successfully!");
    } catch (error) {
      console.error("Error saving dispatch details:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle Mark as Dispatched
  const handleMarkAsDispatched = () => {
    if (!validateForm()) return;

    if (!window.confirm("Mark this bill as Dispatched?\nThis action cannot be undone.")) {
      return;
    }

    try {
      updateDispatchData(true);
      alert("Bill marked as Dispatched successfully!");
      navigate("/screen-printing/dispatch");
    } catch (error) {
      console.error("Error marking as dispatched:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Update dispatch data
  const updateDispatchData = (markAsDispatched) => {
    const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
    const allDispatch = dispatchData ? JSON.parse(dispatchData) : {};

    if (allDispatch[billData.orderId]) {
      const billIndex = allDispatch[billData.orderId].findIndex(
        (b) => b.dispatchId === billData.dispatchId
      );

      if (billIndex >= 0) {
        allDispatch[billData.orderId][billIndex] = {
          ...allDispatch[billData.orderId][billIndex],
          lrNumber,
          lrDocument,
          lrDocumentName,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          customerCity,
          customerState,
          customerPincode,
          transporterName,
          vehicleNumber,
          driverName,
          driverPhone,
          dispatchDate,
          remarks,
          dispatchStatus: markAsDispatched ? "dispatched" : "pending",
          updatedAt: new Date().toISOString(),
          ...(markAsDispatched && { dispatchedAt: new Date().toISOString() }),
        };

        localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(allDispatch));

        // Update local state
        setBillData(allDispatch[billData.orderId][billIndex]);
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/screen-printing/dispatch");
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!billData) return { totalQuantity: 0 };

    const totalQuantity = billData.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    return { totalQuantity };
  };

  if (!billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[1.2vw] text-gray-600">Loading...</div>
      </div>
    );
  }

  const totals = calculateTotals();
  const isDispatched = billData.dispatchStatus === "dispatched";

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[0.5vw]">
          <button
            onClick={handleBack}
            className="flex gap-[0.5vw] items-center cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[1vw] h-[1vw]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw] font-medium">Back</span>
          </button>
          <h1 className="text-[1.6vw] font-bold text-gray-900">
            Dispatch Details
          </h1>
          <div className="w-[5vw]"></div>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
        {/* Dispatch Status Warning */}
        {isDispatched && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-[1.5vw] mb-[1.5vw]">
            <div className="flex items-center gap-[0.75vw]">
              <svg
                className="w-[1.5vw] h-[1.5vw] text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="text-[1vw] font-semibold text-green-800">
                  ✓ Bill Already Dispatched
                </p>
                <p className="text-[0.85vw] text-green-600 mt-[0.25vw]">
                  This bill was dispatched on{" "}
                  {billData.dispatchedAt &&
                    new Date(billData.dispatchedAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order & Bill Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Order & Bill Information
          </h2>
          <div className="grid grid-cols-3 gap-[1vw]">
            <div>
              <p className="text-[0.8vw] text-gray-500">Company Name</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.contact?.company || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Order Number</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.orderNumber || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Payment Status</p>
              <p
                className={`text-[1vw] font-medium ${
                  billData.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {billData.paymentStatus === "paid" ? "✓ Paid" : "○ Pending"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Bill Created</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {new Date(billData.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Estimated Value</p>
              <p className="text-[1vw] font-medium text-green-600">
                ₹{billData.estimatedValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Total Products</p>
              <p className="text-[1vw] font-medium text-blue-600">
                {billData.products.length}
              </p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Products to Dispatch
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    S.No
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Product Name
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Size
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Printing Name
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {billData.products.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                      {product.productName}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.size}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.printingName}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                      {product.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="mt-[1vw] p-[1vw] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Total Quantity</p>
              <p className="text-[1.3vw] font-bold text-blue-600">
                {totals.totalQuantity}
              </p>
            </div>
          </div>
        </div>

        {/* LR Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            LR (Lorry Receipt) Details
          </h2>
          <div className="grid grid-cols-2 gap-[1.5vw]">
            {/* LR Number */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                LR Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                placeholder="Enter LR number"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* LR Document Upload */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                LR Document
              </label>
              {!isDispatched ? (
                <div className="flex gap-[0.5vw]">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="lr-document-upload"
                  />
                  <label
                    htmlFor="lr-document-upload"
                    className="flex-1 border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-white cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-[0.5vw]"
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {lrDocumentName || "Choose File"}
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-gray-100">
                  {lrDocumentName || "No document uploaded"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Dispatch Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Customer Dispatch Details
          </h2>
          <div className="grid grid-cols-2 gap-[1.5vw]">
            {/* Customer Name */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter customer email"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Customer City */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                City
              </label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="Enter city"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Customer State */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                State
              </label>
              <input
                type="text"
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                placeholder="Enter state"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Customer Pincode */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Pincode
              </label>
              <input
                type="text"
                value={customerPincode}
                onChange={(e) => setCustomerPincode(e.target.value)}
                placeholder="Enter pincode"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Customer Address - Full Width */}
            <div className="col-span-2">
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Customer Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter complete address"
                rows="3"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Transport Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Transport Details
          </h2>
          <div className="grid grid-cols-2 gap-[1.5vw]">
            {/* Transporter Name */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Transporter Name
              </label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="Enter transporter name"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Vehicle Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="Enter vehicle number"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Driver Name */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Driver Phone */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Driver Phone
              </label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="Enter driver phone"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Dispatch Date */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Dispatch Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks"
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {!isDispatched && (
            <div className="flex gap-[1vw] justify-end mt-[1.5vw]">
              <button
                onClick={handleSave}
                className="px-[2vw] py-[0.75vw] bg-blue-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-blue-700 transition-all cursor-pointer shadow-md"
              >
                Save Details
              </button>
              <button
                onClick={handleMarkAsDispatched}
                className="px-[2vw] py-[0.75vw] bg-green-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-green-700 transition-all cursor-pointer shadow-md"
              >
                Mark as Dispatched
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
