import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const SALES_PAYMENT_STORAGE_KEY = "screen_printing_sales_payment_data";
const BILLING_STORAGE_KEY = "screen_printing_billing_data";

export default function SalesPaymentDetails() {
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [remarks, setRemarks] = useState("");

  // Load bill data
  useEffect(() => {
    const storedBill = localStorage.getItem("editing_sales_payment_bill");
    if (storedBill) {
      const parsedBill = JSON.parse(storedBill);
      setBillData(parsedBill);
      setEstimatedValue(parsedBill.estimatedValue.toString() || "");
      setRemarks(parsedBill.remarks || "");
    } else {
      alert("No bill data found. Redirecting back...");
      navigate("/screen-printing/sales-payment");
    }
  }, [navigate]);

  // Handle submit to billing
  const handleSubmitToBilling = () => {
    if (!estimatedValue || parseFloat(estimatedValue) <= 0) {
      alert("Please enter a valid Estimated Value");
      return;
    }

    if (
      !window.confirm(
        "Send this bill to Billing?\nThis action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Update sales payment data
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      const allSalesPayments = salesPaymentData
        ? JSON.parse(salesPaymentData)
        : {};

      if (allSalesPayments[billData.orderId]) {
        const billIndex = allSalesPayments[billData.orderId].findIndex(
          (b) => b.billId === billData.billId
        );

        if (billIndex >= 0) {
          allSalesPayments[billData.orderId][billIndex] = {
            ...allSalesPayments[billData.orderId][billIndex],
            estimatedValue: parseFloat(estimatedValue),
            remarks: remarks,
            status: "completed",
            updatedAt: new Date().toISOString(),
          };

          localStorage.setItem(
            SALES_PAYMENT_STORAGE_KEY,
            JSON.stringify(allSalesPayments)
          );
        }
      }

      // Add to billing storage
      const billingData = localStorage.getItem(BILLING_STORAGE_KEY);
      const allBilling = billingData ? JSON.parse(billingData) : {};

      if (!allBilling[billData.orderId]) {
        allBilling[billData.orderId] = [];
      }

      const billingEntry = {
        billingId: Date.now(),
        salesBillId: billData.billId,
        orderNumber: billData.orderNumber,
        contact: billData.contact,
        products: billData.products,
        estimatedValue: parseFloat(estimatedValue),
        remarks: remarks,
        createdAt: new Date().toISOString(),
      };

      allBilling[billData.orderId].push(billingEntry);
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(allBilling));

      alert("Bill sent to Billing successfully!");
      navigate("/screen-printing/sales-payment");
    } catch (error) {
      console.error("Error submitting to billing:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/screen-printing/sales-payment");
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
  const isCompleted = billData.status === "completed";

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
            Sales Payment Bill Details
          </h1>
          <div className="w-[5vw]"></div>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
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
            {billData.orderEstimate > 0 && (
              <div>
                <p className="text-[0.8vw] text-gray-500">
                  Order Estimate (Reference)
                </p>
                <p className="text-[1vw] font-medium text-blue-600">
                  ₹{billData.orderEstimate.toLocaleString()}
                </p>
              </div>
            )}
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

        {/* Billing Information Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            {isCompleted ? "Billing Information" : "Set Billing Information"}
          </h2>

          <div className="grid grid-cols-2 gap-[1.5vw]">
            {/* Estimated Value */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Estimated Value for this Bill (₹){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="Enter estimated value"
                min="0"
                step="0.01"
                disabled={isCompleted}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isCompleted
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
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
                disabled={isCompleted}
                className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  isCompleted
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Action Button */}
          {!isCompleted && (
            <div className="flex justify-end mt-[1.5vw]">
              <button
                onClick={handleSubmitToBilling}
                className="px-[2vw] py-[0.75vw] bg-green-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-green-700 transition-all cursor-pointer shadow-md"
              >
                Send to Billing
              </button>
            </div>
          )}

          {/* Status Message */}
          {isCompleted && (
            <div className="mt-[1.5vw] p-[1vw] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
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
                    ✓ Bill Already Sent to Billing
                  </p>
                  <p className="text-[0.85vw] text-green-600 mt-[0.25vw]">
                    This bill has been processed and sent to the billing
                    department.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
