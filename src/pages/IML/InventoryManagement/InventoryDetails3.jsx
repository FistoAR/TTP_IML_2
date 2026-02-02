// InventoryDetails.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_INVENTORY_FOLLOWUPS = "iml_inventory_followups";
const STORAGE_KEY_SALES_PAYMENT = "iml_sales_payment_data";

const InventoryDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { order } = location.state || {};

  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [verifiedData, setVerifiedData] = useState([]);

  // Load order data and verified history
  useEffect(() => {
    if (!order) {
      alert("No order data found. Redirecting back...");
      navigate("/iml/inventory");
      return;
    }

    loadAvailableProducts(order);
    loadVerifiedData(order.id);
  }, [order, navigate]);

  // Load available products that haven't been verified yet
  const loadAvailableProducts = (order) => {
    try {
      // Get already verified products
      const storedVerified = localStorage.getItem(
        STORAGE_KEY_INVENTORY_FOLLOWUPS,
      );
      const allVerified = storedVerified ? JSON.parse(storedVerified) : {};
      const orderVerified = allVerified[order.id] || [];

      // Convert products object to array
      const productsArray = Object.values(order.products).map(
        (product, idx) => ({
          ...product,
          index: idx + 1,
        }),
      );

      // Filter products that are not fully verified
      const available = productsArray.filter((product) => {
        const verified = orderVerified.find(
          (v) => v.productId === product.productId,
        );
        // Include if not verified or partially verified
        if (!verified) return true;
        return verified.finalQty < product.producedQuantity;
      });

      setAvailableProducts(available);

      // Initialize selected products with default quantities
      const initialSelection = {};
      available.forEach((product) => {
        const verified = orderVerified.find(
          (v) => v.productId === product.productId,
        );
        const alreadyVerified = verified ? parseInt(verified.finalQty) || 0 : 0;
        const remaining = product.producedQuantity - alreadyVerified;

        initialSelection[product.productId] = {
          selected: false,
          quantity: remaining,
          maxQuantity: remaining,
          alreadyVerified: alreadyVerified,
        };
      });
      setSelectedProducts(initialSelection);
    } catch (error) {
      console.error("Error loading available products:", error);
    }
  };

  // Load verified data
  const loadVerifiedData = (orderId) => {
    try {
      const storedVerified = localStorage.getItem(
        STORAGE_KEY_INVENTORY_FOLLOWUPS,
      );
      const allVerified = storedVerified ? JSON.parse(storedVerified) : {};
      const orderVerified = allVerified[orderId] || [];

      // Sort by date/time (newest first)
      const sortedVerified = orderVerified.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setVerifiedData(sortedVerified);
    } catch (error) {
      console.error("Error loading verified data:", error);
    }
  };

  // Handle product selection
  const handleProductSelect = (productId, checked) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: checked,
      },
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 0;
    const maxQuantity = selectedProducts[productId].maxQuantity;

    if (quantity > maxQuantity) {
      alert(`Maximum quantity available: ${maxQuantity}`);
      return;
    }

    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: quantity,
      },
    }));
  };

  // Handle samples change
  const handleSamplesChange = (productId, value) => {
    const samples = parseInt(value) || 0;
    const maxQuantity = selectedProducts[productId].maxQuantity;

    if (samples > maxQuantity) {
      alert(`Cannot take more samples than available quantity: ${maxQuantity}`);
      return;
    }

    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        samples: samples,
      },
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (productId, value) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        remarks: value,
      },
    }));
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    const updated = {};
    Object.keys(selectedProducts).forEach((productId) => {
      updated[productId] = {
        ...selectedProducts[productId],
        selected: checked,
      };
    });
    setSelectedProducts(updated);
  };

  // Check if all products are selected
  const areAllSelected = () => {
    return Object.values(selectedProducts).every((p) => p.selected);
  };

  // Get selected products count
  const getSelectedCount = () => {
    return Object.values(selectedProducts).filter((p) => p.selected).length;
  };

  const generateVerificationId = () => {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  };

  // Handle Verify and Send
  const handleVerifyAndSend = () => {
    const selected = Object.entries(selectedProducts).filter(
      ([_, data]) => data.selected,
    );

    if (selected.length === 0) {
      alert("Please select at least one product to verify and send");
      return;
    }

    // Validate quantities and remarks
    for (const [productId, data] of selected) {
      if (data.quantity <= 0) {
        alert("Please enter valid quantities for all selected products");
        return;
      }
      if (!data.remarks || data.remarks.trim() === "") {
        alert("Please enter remarks for all selected products");
        return;
      }
    }

    if (
      !window.confirm(
        `Verify and send ${selected.length} product(s) to Sales Payment?`,
      )
    ) {
      return;
    }

    try {
      // Generate a unique batch ID for this verification session
      const batchId = generateVerificationId();
      const currentDate = new Date().toLocaleDateString("en-IN");
      const currentTime = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const timestamp = new Date().toISOString();

      // Save verified inventory data as new entries
      const storedVerified = localStorage.getItem(
        STORAGE_KEY_INVENTORY_FOLLOWUPS,
      );
      const allVerified = storedVerified ? JSON.parse(storedVerified) : {};

      if (!allVerified[order.id]) {
        allVerified[order.id] = [];
      }

      // Create new entries for each selected product
      const newVerifiedEntries = selected.map(([productId, data]) => {
        const product = availableProducts.find(
          (p) => p.productId === parseInt(productId),
        );

        return {
          verificationId: batchId, // Same ID for all products in this batch
          productId: parseInt(productId),
          imlName: product.imlName,
          productCategory: product.productCategory,
          size: product.size,
          productionQty: product.producedQuantity,
          finalQty: data.quantity, // This is only what's verified NOW
          samplesTaken: data.samples || 0,
          remarks: data.remarks,
          date: currentDate,
          time: currentTime,
          createdAt: timestamp,
          updatedAt: timestamp,
          batchNumber: `BATCH-${Date.now().toString().slice(-6)}`, // Optional: human-readable batch ID
          verificationSession: new Date().toLocaleString("en-IN"), // For grouping display
        };
      });

      // Add new entries to the history
      allVerified[order.id] = [...allVerified[order.id], ...newVerifiedEntries];

      localStorage.setItem(
        STORAGE_KEY_INVENTORY_FOLLOWUPS,
        JSON.stringify(allVerified),
      );

      // Prepare data for Sales Payment
      const salesPaymentData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        contact: order.contact,
        products: selected.map(([productId, data]) => {
          const product = availableProducts.find(
            (p) => p.productId === parseInt(productId),
          );
          return {
            productId: parseInt(productId),
            imlName: product.imlName,
            productCategory: product.productCategory,
            size: product.size,
            quantity: data.quantity,
            samplesTaken: data.samples || 0,
            remarks: data.remarks,
            rate: 0,
            amount: 0,
            verificationId: batchId, // Link to verification entry
          };
        }),
        batchId: batchId,
        createdAt: timestamp,
        verificationDate: currentDate,
        verificationTime: currentTime,
      };

      // Get existing sales payment data or initialize
      const existingSalesData = localStorage.getItem(STORAGE_KEY_SALES_PAYMENT);
      let allSalesData = existingSalesData ? JSON.parse(existingSalesData) : {};

      // Initialize array for this order if not exists
      if (!allSalesData[order.id]) {
        allSalesData[order.id] = [];
      }

      // Add new sales payment entry
      allSalesData[order.id].push(salesPaymentData);

      // Save to Sales Payment storage
      localStorage.setItem(
        STORAGE_KEY_SALES_PAYMENT,
        JSON.stringify(allSalesData),
      );

      // Also save to pending for immediate use (optional)
      localStorage.setItem(
        "pending_iml_sales_payment",
        JSON.stringify(salesPaymentData),
      );

      alert("Products verified and sent to Sales Payment successfully!");

      // Reload the page to show updated data
      loadAvailableProducts(order);
      loadVerifiedData(order.id);

      // Reset selections
      const resetSelection = {};
      Object.keys(selectedProducts).forEach((productId) => {
        const product = availableProducts.find(
          (p) => p.productId === parseInt(productId),
        );
        if (product) {
          const verified = allVerified[order.id].filter(
            (v) => v.productId === parseInt(productId),
          );
          const totalVerified = verified.reduce(
            (sum, v) => sum + parseInt(v.finalQty),
            0,
          );
          const remaining = product.producedQuantity - totalVerified;

          resetSelection[productId] = {
            selected: false,
            quantity: remaining > 0 ? remaining : 0,
            maxQuantity: remaining > 0 ? remaining : 0,
            alreadyVerified: totalVerified,
          };
        }
      });
      setSelectedProducts(resetSelection);
    } catch (error) {
      console.error("Error verifying and sending:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/iml/inventory");
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Invalid Access
          </h2>
          <p className="text-gray-600 mb-4">No order information provided</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
          >
            Back to Inventory Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[90vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
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
              Inventory Verification & Billing
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              {order.companyName} - Order #{order.orderNumber}
            </p>
          </div>
          <div className="w-[3vw]"></div>
        </div>

        <div className="p-[1.5vw]">
          <div className="space-y-[1.5vw] max-h-[65vh] overflow-y-auto">
            {/* Order Information */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
              <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2">
                <span className="text-[1.3vw]">📦</span> Order Information
              </h3>
              <div className="grid grid-cols-4 gap-[1vw]">
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Company Name
                  </label>
                  <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                    {order.companyName}
                  </div>
                </div>
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Order Number
                  </label>
                  <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800">
                    {order.orderNumber}
                  </div>
                </div>
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Contact Person
                  </label>
                  <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-semibold text-blue-800">
                    {order.contact?.contactName || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Total Produced Quantity
                  </label>
                  <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800">
                    {order.totalProduced.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Already Verified Products */}
            {verifiedData.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-[1.5vw]">
                <h2 className="text-[1.2vw] font-semibold text-green-800 mb-[1vw]">
                  ✓ Verification History 
                </h2>
                <div className="mb-[1vw]">
                  <p className="text-[0.85vw] text-gray-600">
                    Total Verification Sessions:{" "}
                    {
                      [...new Set(verifiedData.map((v) => v.verificationId))]
                        .length
                    }
                  </p>
                </div>
                <div className="overflow-x-auto rounded-lg border border-green-300 max-h-[35vh]">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-green-100 sticky top-0">
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Session
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Date & Time
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          IML Name
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Product
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Size
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Production Qty
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Verified Now
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Samples
                        </th>
                        <th className="border border-green-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedData.map((entry, idx) => {
                        // Add a visual separator for different verification sessions
                        const isNewSession =
                          idx === 0 ||
                          verifiedData[idx - 1].verificationId !==
                            entry.verificationId;

                        return (
                          <React.Fragment
                            key={entry.verificationId + "-" + idx}
                          >
                            {isNewSession && (
                              <tr className="bg-blue-50">
                                <td
                                  colSpan="9"
                                  className="border border-green-300 px-[1vw] py-[0.3vw] text-[0.75vw] font-semibold text-blue-700"
                                >
                                  🗓️ Verification Session: {entry.date}{" "}
                                  {entry.time}
                                  
                                </td>
                              </tr>
                            )}
                            <tr className="hover:bg-green-50">
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw] text-center">
                                {idx + 1}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                                {entry.date} {entry.time}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                                {entry.imlName}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                                {entry.productCategory}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                                {entry.size}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700">
                                {parseInt(entry.productionQty).toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-bold text-green-700">
                                {parseInt(entry.finalQty).toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                                {parseInt(entry.samplesTaken).toLocaleString(
                                  "en-IN",
                                )}
                              </td>
                              <td className="border border-green-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                                {entry.remarks}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Selection */}
            {availableProducts.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw]">
                <div className="flex justify-between items-center mb-[1vw] border-b pb-[0.5vw]">
                  <h2 className="text-[1.2vw] font-semibold text-gray-800">
                    Select Products to Verify & Send
                  </h2>
                  <div className="flex items-center gap-[1vw]">
                    <span className="text-[0.9vw] text-gray-600">
                      Selected: {getSelectedCount()} /{" "}
                      {availableProducts.length}
                    </span>
                    <label className="flex items-center gap-[0.5vw] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={areAllSelected()}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-[1.1vw] h-[1.1vw] cursor-pointer"
                      />
                      <span className="text-[0.9vw] font-medium text-gray-700">
                        Select All
                      </span>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-300">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-center text-[0.85vw] font-semibold">
                          Select
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          S.No
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          IML Name
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Product
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Size
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Produced Qty
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Already Verified
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Final Qty
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Samples
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                          Remarks <span className="text-red-600">*</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableProducts.map((product) => {
                        const selection = selectedProducts[product.productId];
                        return (
                          <tr
                            key={product.productId}
                            className={`hover:bg-gray-50 ${
                              selection?.selected ? "bg-blue-50" : ""
                            }`}
                          >
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-center">
                              <input
                                type="checkbox"
                                checked={selection?.selected || false}
                                onChange={(e) =>
                                  handleProductSelect(
                                    product.productId,
                                    e.target.checked,
                                  )
                                }
                                className="w-[1.1vw] h-[1.1vw] cursor-pointer"
                              />
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                              {product.index}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                              {product.imlName}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                              {product.productCategory}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                              {product.size}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                              {product.producedQuantity.toLocaleString("en-IN")}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-green-600">
                              {selection?.alreadyVerified || 0}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw]">
                              <input
                                type="number"
                                value={selection?.quantity || 0}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product.productId,
                                    e.target.value,
                                  )
                                }
                                min="1"
                                max={selection?.maxQuantity || 0}
                                disabled={!selection?.selected}
                                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                              <p className="text-[0.7vw] text-gray-500 mt-[0.25vw]">
                                Max: {selection?.maxQuantity || 0}
                              </p>
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw]">
                              <input
                                type="number"
                                value={selection?.samples || 0}
                                onChange={(e) =>
                                  handleSamplesChange(
                                    product.productId,
                                    e.target.value,
                                  )
                                }
                                min="0"
                                max={selection?.maxQuantity || 0}
                                disabled={!selection?.selected}
                                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw]">
                              <input
                                type="text"
                                value={selection?.remarks || ""}
                                onChange={(e) =>
                                  handleRemarksChange(
                                    product.productId,
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter remarks"
                                disabled={!selection?.selected}
                                className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Action Button */}
                <div className="flex justify-end mt-[1.5vw]">
                  <button
                    onClick={handleVerifyAndSend}
                    disabled={getSelectedCount() === 0}
                    className="px-[2vw] py-[0.75vw] bg-green-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-green-700 transition-all cursor-pointer shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Verify & Send to Sales Payment ({getSelectedCount()})
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[3vw] text-center">
                <div className="w-[4vw] h-[4vw] bg-green-100 rounded-full flex items-center justify-center mx-auto mb-[1vw]">
                  <svg
                    className="w-[2vw] h-[2vw] text-green-600"
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
                </div>
                <h3 className="text-[1.2vw] font-semibold text-gray-900 mb-[0.5vw]">
                  All Products Verified!
                </h3>
                <p className="text-gray-600 text-[0.9vw]">
                  All products for this order have been verified and sent to
                  sales payment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetails;
