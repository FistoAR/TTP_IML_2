// BillingDetails.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_BILLING = "screen_printing_billing_data";
const STORAGE_KEY_DISPATCH = "screen_printing_dispatch";

const BillingDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { billingRecord } = location.state || {};

  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [allProducts, setAllProducts] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);

  useEffect(() => {
    if (billingRecord) {
      // Set initial payment status
      setPaymentStatus(
        billingRecord.status === "Paid" ? "Paid" :
          billingRecord.status === "Partial" ? "Partial" : "Pending"
      );

      // Set payment records
      setPaymentRecords(billingRecord.paymentRecords || []);

      // Set all products from the bill
      setAllProducts(billingRecord.products.map(product => ({
        ...product,
        isBilled: true,
        orderQuantity: product.quantity || 0,
        finalQty: product.quantity || 0
      })));
    }
  }, [billingRecord]);

  const handlePaymentStatusChange = (e) => {
    setPaymentStatus(e.target.value);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!billingRecord) return { totalPaid: 0, billAmount: 0, balanceDue: 0 };

    const billAmount = parseFloat(billingRecord.estimatedValue) || 0;
    const totalPaid = paymentRecords.reduce(
      (sum, record) => sum + (parseFloat(record.amount) || 0),
      0
    );
    const balanceDue = Math.max(billAmount - totalPaid, 0);

    return { totalPaid, billAmount, balanceDue };
  };

  // Save payment status without moving to dispatch
  const handleSavePaymentStatus = () => {
    const stored = localStorage.getItem(STORAGE_KEY_BILLING);
    if (stored) {
      const allBilling = JSON.parse(stored);

      // Find the bill by billingId in the entire data structure
      let billUpdated = false;

      Object.keys(allBilling).forEach(orderId => {
        const bills = allBilling[orderId];
        const billIndex = bills.findIndex(
          (b) => b.billingId === billingRecord.billingId
        );

        if (billIndex >= 0) {
          allBilling[orderId][billIndex] = {
            ...allBilling[orderId][billIndex],
            status: paymentStatus === "Paid" ? "Paid" :
              paymentStatus === "Partial" ? "Partial" : "Pending Payment",
          };
          billUpdated = true;
        }
      });

      if (billUpdated) {
        localStorage.setItem(
          STORAGE_KEY_BILLING,
          JSON.stringify(allBilling)
        );
        alert("✅ Payment status saved successfully!");
      } else {
        alert("❌ Could not find the bill to update.");
      }
    } else {
      alert("❌ No billing data found in storage.");
    }
  };

  // Move single bill to dispatch
  const handleMoveToDispatch = () => {
    const totals = calculateTotals();

    // Check if payment is completed
    if (totals.balanceDue > 0 && paymentStatus !== "Partial") {
      if (!confirm("There is still balance due. Are you sure you want to move to dispatch?")) {
        return;
      }
    }

    const dispatchData = {
      id: `DISPATCH_${billingRecord.billingId}_${Date.now()}`,
      billingId: billingRecord.billingId,
      salesBillId: billingRecord.salesBillId,
      orderId: billingRecord.orderId,
      orderNumber: billingRecord.orderNumber,
      companyName: billingRecord.companyName || billingRecord.contact?.company,
      contactName: billingRecord.contactName || billingRecord.contact?.contactName,
      phone: billingRecord.phone || billingRecord.contact?.phone,
      products: billingRecord.products,
      totalQuantity: billingRecord.products.reduce((sum, p) => sum + (p.quantity || 0), 0),
      estimatedAmount: billingRecord.estimatedValue,
      estimatedNo: billingRecord.estimatedNumber || "N/A",
      dispatchDate: new Date().toISOString(),
      lrNumber: "",
      status: "Ready for Dispatch",
      paymentStatus: paymentStatus,
      paymentRecords: paymentRecords,
      billNumber: `BILL-${billingRecord.billingId}`,
    };

    // Save to dispatch localStorage
    const stored = localStorage.getItem(STORAGE_KEY_DISPATCH);
    const allDispatch = stored ? JSON.parse(stored) : [];
    allDispatch.push(dispatchData);
    localStorage.setItem(STORAGE_KEY_DISPATCH, JSON.stringify(allDispatch));

    // Update billing status to avoid duplicate dispatch
    const billingStored = localStorage.getItem(STORAGE_KEY_BILLING);
    if (billingStored) {
      const allBilling = JSON.parse(billingStored);

      if (allBilling[billingRecord.orderId]) {
        const billIndex = allBilling[billingRecord.orderId].findIndex(
          (b) => b.billingId === billingRecord.billingId
        );

        if (billIndex >= 0) {
          allBilling[billingRecord.orderId][billIndex] = {
            ...allBilling[billingRecord.orderId][billIndex],
            status: "Dispatched",
            dispatchedAt: new Date().toISOString(),
          };

          localStorage.setItem(
            STORAGE_KEY_BILLING,
            JSON.stringify(allBilling)
          );
        }
      }
    }

    alert("✅ Bill moved to dispatch successfully!");
    navigate("/screen-printing/billing");
  };

  const handleBack = () => {
    navigate("/screen-printing/billing");
  };

  if (!billingRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Invalid Access
          </h2>
          <p className="text-gray-600 mb-4">No billing record provided</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
          >
            Back to Billing Management
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const isDispatched = billingRecord.status === "Dispatched" || billingRecord.dispatchedAt;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
          <button
            className="flex gap-[.5vw] items-center cursor-pointer hover:text-blue-600 transition-colors"
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
          <div className="text-center">
            <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
              💰 Screen Printing Bill Details
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              Bill ID: {billingRecord.billId || billingRecord.billingId} • Order: #{billingRecord.orderNumber}
            </p>
          </div>
          <div className="w-[3vw]"></div>
        </div>

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[75vh] overflow-y-auto">
          {/* Bill Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <div className="flex justify-between items-center mb-[1vw]">
              <h3 className="text-[1.1vw] font-semibold text-blue-900 flex items-center gap-2">
                <span className="text-[1.3vw]">📋</span> Bill Summary
              </h3>
              <div className="flex items-center gap-[0.5vw]">
                <span className="text-[0.8vw] text-gray-600">Bill Status:</span>
                <span className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.7vw] font-semibold ${isDispatched
                    ? "bg-purple-100 text-purple-700"
                    : billingRecord.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : billingRecord.status === "Partial"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}>
                  {isDispatched ? "Dispatched" : (billingRecord.status || "Pending")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Order Number
                </label>
                <input
                  type="text"
                  value={billingRecord.orderNumber}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] bg-white cursor-not-allowed font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Company Name
                </label>
                <input
                  type="text"
                  value={billingRecord.companyName || billingRecord.contact?.company}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] bg-white cursor-not-allowed font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={billingRecord.contactName || billingRecord.contact?.contactName}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] bg-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Phone
                </label>
                <input
                  type="text"
                  value={billingRecord.phone || billingRecord.contact?.phone}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] bg-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Bill Created
                </label>
                <input
                  type="text"
                  value={new Date(billingRecord.createdAt || billingRecord.billingDate).toLocaleDateString("en-IN")}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] bg-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Products in Bill
                </label>
                <input
                  type="text"
                  value={`${billingRecord.products.length} products`}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] bg-white cursor-not-allowed font-semibold text-blue-800"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
            <div className="flex justify-between items-center mb-[1vw]">
              <h3 className="text-[1.1vw] font-semibold text-purple-900 flex items-center gap-2">
                <span className="text-[1.3vw]">💳</span> Payment Information
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Bill Amount (₹)
                </label>
                <input
                  type="text"
                  value={totals.billAmount.toLocaleString("en-IN")}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentStatus}
                  onChange={handlePaymentStatusChange}
                  disabled={isDispatched}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-purple-300 rounded-[0.4vw] cursor-pointer font-semibold focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-green-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">💰</span> Payment History ({paymentRecords.length} records)
            </h3>

            {paymentRecords.length === 0 ? (
              <div className="text-center p-[2vw] bg-white rounded-lg border border-gray-200">
                <div className="w-[3vw] h-[3vw] bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-[0.8vw]">
                  <svg
                    className="w-[1.5vw] h-[1.5vw] text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-[1vw] font-semibold text-gray-900 mb-[0.5vw]">
                  No Payment Records
                </h3>
                <p className="text-gray-600 text-[0.8vw]">
                  No payment records for this bill
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[20vw]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-100 sticky top-0">
                      <th className="border border-green-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-green-900">
                        Date & Time
                      </th>
                      <th className="border border-green-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-green-900">
                        Type
                      </th>
                      <th className="border border-green-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-green-900">
                        Method
                      </th>
                      <th className="border border-green-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-green-900">
                        Amount
                      </th>
                      <th className="border border-green-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-green-900">
                        Remarks
                      </th>
                      <th className="border border-green-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-green-900">
                        Proof
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-green-50 transition-colors">
                        <td className="border border-green-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {new Date(record.timestamp).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="border border-green-300 px-[0.75vw] py-[.6vw]">
                          <span
                            className={`inline-block px-[0.5vw] py-[0.2vw] rounded-[0.3vw] text-[.7vw] font-semibold ${record.paymentType === "full"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {record.paymentType === "full" ? "Full" : "Partial"}
                          </span>
                        </td>
                        <td className="border border-green-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {record.method}
                        </td>
                        <td className="border border-green-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-bold text-green-700">
                          ₹{parseFloat(record.amount || 0).toLocaleString()}
                        </td>
                        <td className="border border-green-300 px-[0.75vw] py-[.6vw] text-[.8vw] text-gray-600 max-w-[10vw] truncate">
                          {record.remarks || "-"}
                        </td>
                        <td className="border border-green-300 px-[0.75vw] py-[.6vw]">
                          {record.file ? (
                            <button
                              onClick={() => {
                                const fileUrl = URL.createObjectURL(record.file);
                                window.open(fileUrl, '_blank');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-[0.8vw] underline cursor-pointer"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[0.8vw]">No file</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Products in Bill */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📦</span> Products in This Bill ({allProducts.length})
            </h3>
            <div className="overflow-auto max-h-[20vw]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100 sticky top-0">
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      S.No
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Product Name
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Size
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Printing Name
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Quantity
                    </th>
                    
                  </tr>
                </thead>
                <tbody>
                  {allProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="border border-amber-300 px-[0.75vw] py-[2vw] text-center text-[.85vw] text-gray-500"
                      >
                        No products found in this bill
                      </td>
                    </tr>
                  ) : (
                    allProducts.map((product, idx) => (
                      <tr
                        key={idx}
                        className="bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {idx + 1}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-purple-700">
                          {product.productName}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.size || "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.printingName || "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-blue-700">
                          {product.quantity?.toLocaleString("en-IN") || 0}
                        </td>
                       
                      </tr>
                    ))
                  )}
                  
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
              Back
            </button>
            <button
              onClick={handleSavePaymentStatus}
              disabled={isDispatched}
              className={`px-[1.5vw] py-[.6vw] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-purple-700 hover:to-pink-700 transition-all shadow-md cursor-pointer ${isDispatched ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              💾 Save Status
            </button>
            {!isDispatched && (
              <button
                onClick={handleMoveToDispatch}
                disabled={totals.balanceDue > 0 && paymentStatus === "Pending"}
                className={`px-[1.5vw] py-[.6vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md cursor-pointer ${totals.balanceDue > 0 && paymentStatus === "Pending"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
              >
                🚚 Dispatch This Bill
              </button>
            )}
            {isDispatched && (
              <button
                disabled
                className="px-[1.5vw] py-[.6vw] bg-gray-300 text-gray-600 rounded-[0.6vw] font-semibold text-[0.9vw] cursor-not-allowed"
              >
                ✓ Bill Dispatched
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetails;