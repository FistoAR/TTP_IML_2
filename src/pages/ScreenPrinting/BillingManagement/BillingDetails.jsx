import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const BILLING_STORAGE_KEY = "screen_printing_billing_data";
const DISPATCH_STORAGE_KEY = "screen_printing_dispatch_data";

export default function BillingDetails() {
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [remarks, setRemarks] = useState("");

  // Load bill data
  useEffect(() => {
    const storedBill = localStorage.getItem("editing_billing_bill");
    if (storedBill) {
      const parsedBill = JSON.parse(storedBill);
      setBillData(parsedBill);
      setPaymentStatus(parsedBill.paymentStatus || "pending");
      setRemarks(parsedBill.remarks || "");
    } else {
      alert("No bill data found. Redirecting back...");
      navigate("/screen-printing/billing");
    }
  }, [navigate]);

  // Handle Save
  const handleSave = () => {
    if (!window.confirm("Save the payment status?")) {
      return;
    }

    try {
      // Update billing data
      const billingData = localStorage.getItem(BILLING_STORAGE_KEY);
      const allBilling = billingData ? JSON.parse(billingData) : {};

      if (allBilling[billData.orderId]) {
        const billIndex = allBilling[billData.orderId].findIndex(
          (b) => b.billingId === billData.billingId
        );

        if (billIndex >= 0) {
          allBilling[billData.orderId][billIndex] = {
            ...allBilling[billData.orderId][billIndex],
            paymentStatus: paymentStatus,
            remarks: remarks,
            updatedAt: new Date().toISOString(),
          };

          localStorage.setItem(
            BILLING_STORAGE_KEY,
            JSON.stringify(allBilling)
          );

          alert("Payment status saved successfully!");
          
          // Update local state
          setBillData({
            ...billData,
            paymentStatus: paymentStatus,
            remarks: remarks,
          });
        }
      }
    } catch (error) {
      console.error("Error saving payment status:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle Send to Dispatch
  const handleSendToDispatch = () => {
    if (paymentStatus === "pending") {
      if (
        !window.confirm(
          "Payment is still pending. Are you sure you want to send to dispatch?"
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm(
          "Send this bill to Dispatch?\nThis action cannot be undone."
        )
      ) {
        return;
      }
    }

    try {
      // Update billing data
      const billingData = localStorage.getItem(BILLING_STORAGE_KEY);
      const allBilling = billingData ? JSON.parse(billingData) : {};

      if (allBilling[billData.orderId]) {
        const billIndex = allBilling[billData.orderId].findIndex(
          (b) => b.billingId === billData.billingId
        );

        if (billIndex >= 0) {
          allBilling[billData.orderId][billIndex] = {
            ...allBilling[billData.orderId][billIndex],
            paymentStatus: paymentStatus,
            remarks: remarks,
            updatedAt: new Date().toISOString(),
          };

          localStorage.setItem(
            BILLING_STORAGE_KEY,
            JSON.stringify(allBilling)
          );
        }
      }

      // Add to dispatch storage
      const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
      const allDispatch = dispatchData ? JSON.parse(dispatchData) : {};

      if (!allDispatch[billData.orderId]) {
        allDispatch[billData.orderId] = [];
      }

      const dispatchEntry = {
        dispatchId: Date.now(),
        billingId: billData.billingId,
        salesBillId: billData.salesBillId,
        orderNumber: billData.orderNumber,
        contact: billData.contact,
        products: billData.products,
        estimatedValue: billData.estimatedValue,
        paymentStatus: paymentStatus,
        remarks: remarks,
        dispatchStatus: "pending", // pending, dispatched
        createdAt: new Date().toISOString(),
      };

      allDispatch[billData.orderId].push(dispatchEntry);
      localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(allDispatch));

      alert("Bill sent to Dispatch successfully!");
      navigate("/screen-printing/billing");
    } catch (error) {
      console.error("Error sending to dispatch:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/screen-printing/billing");
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
  const isDispatched = billData.isDispatched;

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
            Billing Details
          </h1>
          <div className="w-[5vw]"></div>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
        {/* Dispatch Status Warning */}
        {isDispatched && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-[1.5vw] mb-[1.5vw]">
            <div className="flex items-center gap-[0.75vw]">
              <svg
                className="w-[1.5vw] h-[1.5vw] text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-[1vw] font-semibold text-purple-800">
                  ✓ Bill Already Dispatched
                </p>
                <p className="text-[0.85vw] text-purple-600 mt-[0.25vw]">
                  This bill has been sent to dispatch. Changes cannot be made.
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
              <p className="text-[0.8vw] text-gray-500">Contact Person</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.contact?.contactName || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Phone</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.contact?.phone || "NA"}
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
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Products in this Bill
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

        {/* Payment Status Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Payment Status
          </h2>

          <div className="grid grid-cols-2 gap-[1.5vw] mb-[1.5vw]">
            {/* Payment Status */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                disabled={isDispatched}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isDispatched ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
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
            <div className="flex gap-[1vw] justify-end">
              <button
                onClick={handleSave}
                className="px-[2vw] py-[0.75vw] bg-blue-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-blue-700 transition-all cursor-pointer shadow-md"
              >
                Save Status
              </button>
              <button
                onClick={handleSendToDispatch}
                className="px-[2vw] py-[0.75vw] bg-green-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-green-700 transition-all cursor-pointer shadow-md"
              >
                Send to Dispatch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
