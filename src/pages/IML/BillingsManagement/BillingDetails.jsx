// BillingDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_SALES_BILLING = "iml_sales_billing";
const STORAGE_KEY_DISPATCH = "iml_dispatch";
const STORAGE_KEY_ORDERS = "imlorders";

const BillingDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { billingRecord } = location.state || {};

  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [orderData, setOrderData] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
  if (billingRecord) {
    // Set initial payment status
    setPaymentStatus(
      billingRecord.status === "Pending Payment" ? "Pending" : "Paid"
    );

    // Fetch complete order data
    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (storedOrders) {
      const allOrders = JSON.parse(storedOrders);
      const order = allOrders.find(
        (o) => o.orderNumber === billingRecord.orderNumber
      );
      if (order) {
        setOrderData(order);

        // Create a map of billed products by ID
        const billedProductsMap = {};
        billingRecord.products.forEach((billedProduct) => {
          billedProductsMap[billedProduct.id] = billedProduct;
        });

        // First: Add all billed products from sales billing (keep their data intact)
        const markedBilledProducts = billingRecord.products.map((billedProduct) => ({
          ...billedProduct,
          isBilled: true,
        }));

        // Second: Add unbilled products from order with their ORIGINAL data
        const unbilledProducts = order.products
          .filter((orderProduct) => !billedProductsMap[orderProduct.id])
          .map((orderProduct) => ({
            id: orderProduct.id,
            imlName: orderProduct.imlName,
            productCategory: orderProduct.productName || orderProduct.product,
            size: orderProduct.size,
            imlType: orderProduct.imlType,
            orderQuantity: orderProduct.lidLabelQty || orderProduct.tubLabelQty || 0,
            finalQty: 0, // Not billed yet, so billed qty is 0
            isBilled: false,
          }));

        setAllProducts([...markedBilledProducts, ...unbilledProducts]);
      }
    }
  }
}, [billingRecord]);


  const handlePaymentStatusChange = (e) => {
    setPaymentStatus(e.target.value);
  };

  // Save payment status without moving to dispatch
  const handleSavePaymentStatus = () => {
    // Update in localStorage
    const stored = localStorage.getItem(STORAGE_KEY_SALES_BILLING);
    if (stored) {
      const allBilling = JSON.parse(stored);
      const updatedBilling = allBilling.map((bill) =>
        bill.id === billingRecord.id
          ? {
              ...bill,
              status: paymentStatus === "Paid" ? "Paid" : "Pending Payment",
            }
          : bill
      );
      localStorage.setItem(
        STORAGE_KEY_SALES_BILLING,
        JSON.stringify(updatedBilling)
      );
      alert("✅ Payment status saved successfully!");
    }
  };

  const handleMoveToDispatch = () => {
  

    const dispatchData = {
      id: `DISPATCH_${billingRecord.id}_${Date.now()}`,
      billingId: billingRecord.id,
      orderId: billingRecord.orderId,
      orderNumber: billingRecord.orderNumber,
      companyName: billingRecord.companyName,
      contactName: billingRecord.contactName,
      phone: billingRecord.phone,
      products: billingRecord.products,
      totalFinalQty: billingRecord.totalFinalQty,
      estimatedAmount: billingRecord.estimatedAmount,
      estimatedNo: orderData?.orderEstimate?.estimatedNumber || "N/A",
      dispatchDate: new Date().toISOString(),
      lrNumber: "",
      status: "Ready for Dispatch",
    };

    // Save to dispatch localStorage
    const stored = localStorage.getItem(STORAGE_KEY_DISPATCH);
    const allDispatch = stored ? JSON.parse(stored) : [];
    allDispatch.push(dispatchData);
    localStorage.setItem(STORAGE_KEY_DISPATCH, JSON.stringify(allDispatch));

    // Update billing status to avoid duplicate dispatch
    const billingStored = localStorage.getItem(STORAGE_KEY_SALES_BILLING);
    if (billingStored) {
      const allBilling = JSON.parse(billingStored);
      const updatedBilling = allBilling.map((bill) =>
        bill.id === billingRecord.id
          ? {
              ...bill,
              status: "Dispatched",
              dispatchedAt: new Date().toISOString(),
            }
          : bill
      );
      localStorage.setItem(
        STORAGE_KEY_SALES_BILLING,
        JSON.stringify(updatedBilling)
      );
    }

    alert("✅ Order moved to dispatch successfully!");
    navigate("/iml/dispatchManagement");
  };

  const handleBack = () => {
    navigate("/iml/billingManagement");
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
              💰 Billing Details
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              Order #{billingRecord.orderNumber} - {billingRecord.companyName}
            </p>
          </div>
          <div className="w-[3vw]"></div>
        </div>

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[75vh] overflow-y-auto">
          {/* Order Details */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📋</span> Order Information
            </h3>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Order Number
                </label>
                <input
                  type="text"
                  value={billingRecord.orderNumber}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Company Name
                </label>
                <input
                  type="text"
                  value={billingRecord.companyName}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={billingRecord.contactName}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Phone
                </label>
                <input
                  type="text"
                  value={billingRecord.phone}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Estimated No.
                </label>
                <input
                  type="text"
                  value={orderData?.orderEstimate?.estimatedNumber || "N/A"}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Estimated Amount (₹)
                </label>
                <input
                  type="text"
                  value={
                    orderData?.orderEstimate?.estimatedAmount
                      ? parseFloat(
                          orderData.orderEstimate.estimatedAmount
                        ).toLocaleString("en-IN")
                      : "0"
                  }
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">💳</span> Payment Information
            </h3>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentStatus}
                  onChange={handlePaymentStatusChange}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-purple-300 rounded-[0.4vw] cursor-pointer font-semibold focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Billing Date
                </label>
                <input
                  type="text"
                  value={new Date(billingRecord.billingDate).toLocaleDateString(
                    "en-IN"
                  )}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Final Amount (₹)
                </label>
                <input
                  type="text"
                  value={parseFloat(
                    billingRecord.estimatedAmount || 0
                  ).toLocaleString("en-IN")}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>
            </div>
          </div>

          {/* All Products Table */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📦</span> Product Details (All)
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
                      Product
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Size
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      IML Type
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Order Qty
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Billed Qty
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold text-amber-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="border border-amber-300 px-[0.75vw] py-[2vw] text-center text-[.85vw] text-gray-500"
                      >
                        No products found
                      </td>
                    </tr>
                  ) : (
                    allProducts.map((product, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          product.isBilled
                            ? "bg-green-50 hover:bg-green-100"
                            : "bg-yellow-50 hover:bg-yellow-100"
                        } transition-colors`}
                      >
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {idx + 1}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-purple-700">
                          {product.imlName}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.productCategory || product.product || "N/A"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.size}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {product.imlType}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-blue-700">
                          {product.orderQuantity?.toLocaleString("en-IN") || 0}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-green-700">
                          {product.isBilled
                            ? product.finalQty?.toLocaleString("en-IN") || 0
                            : "-"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-center">
                          <span
                            className={`inline-block px-[0.5vw] py-[0.2vw] rounded-[0.3vw] text-[.7vw] font-semibold ${
                              product.isBilled
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {product.isBilled ? "✓ Billed" : "Pending"}
                          </span>
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
              Cancel
            </button>
            <button
              onClick={handleSavePaymentStatus}
              className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-purple-700 hover:to-pink-700 transition-all shadow-md cursor-pointer"
            >
              💾 Save
            </button>
            <button
              onClick={handleMoveToDispatch}
              className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚚 Move to Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDetails;
