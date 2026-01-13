// DispatchDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_DISPATCH = "iml_dispatch";

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

  const [lrNumber, setLrNumber] = useState("");
  const [lrDropdownOpen, setLrDropdownOpen] = useState(false);
  const [filteredLRNumbers, setFilteredLRNumbers] = useState(LR_NUMBER_OPTIONS);
  const lrInputRef = useRef(null);

  useEffect(() => {
    if (dispatchRecord) {
      setLrNumber(dispatchRecord.lrNumber || "");
    }
  }, [dispatchRecord]);

  // Handle LR input change with autocomplete
  const handleLrInputChange = (e) => {
    const value = e.target.value;
    setLrNumber(value);

    // Filter LR options
    const filtered = LR_NUMBER_OPTIONS.filter((lr) =>
      lr.toLowerCase().includes(value.toLowerCase())
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

  const handleSaveLrNumber = () => {
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
              status: "Dispatched",
            }
          : dispatch
      );
      localStorage.setItem(STORAGE_KEY_DISPATCH, JSON.stringify(updatedDispatch));
      alert("✅ LR Number saved successfully!");
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

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
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
          <div className="text-center">
            <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
              🚚 Dispatch Details
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              Order #{dispatchRecord.orderNumber} - {dispatchRecord.companyName}
            </p>
          </div>
          <div className="w-[3vw]"></div>
        </div>

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[75vh] overflow-y-auto">
          {/* Order Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-green-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📋</span> Order Information
            </h3>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Order Number
                </label>
                <input
                  type="text"
                  value={dispatchRecord.orderNumber}
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
                  value={dispatchRecord.companyName}
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
                  value={dispatchRecord.contactName}
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
                  value={dispatchRecord.phone}
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
                  value={dispatchRecord.estimatedNo}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Total Amount (₹)
                </label>
                <input
                  type="text"
                  value={parseFloat(
                    dispatchRecord.estimatedAmount || 0
                  ).toLocaleString("en-IN")}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Dispatch Date
                </label>
                <input
                  type="text"
                  value={new Date(
                    dispatchRecord.dispatchDate
                  ).toLocaleDateString("en-IN")}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Total Quantity
                </label>
                <input
                  type="text"
                  value={dispatchRecord.totalFinalQty?.toLocaleString("en-IN") || 0}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-bold text-blue-800"
                />
              </div>
            </div>
          </div>

          {/* LR Number Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">🚛</span> Logistics Information
            </h3>
            <div className="grid grid-cols-2 gap-[1vw]">
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
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Dispatch Status
                </label>
                <input
                  type="text"
                  value={dispatchRecord.status}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-semibold text-green-800"
                />
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📦</span> Product Details
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
                  {dispatchRecord.products.map((product, idx) => (
                    <tr key={idx} className="hover:bg-amber-100 transition-colors">
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                        {idx + 1}
                      </td>
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-purple-700">
                        {product.imlName}
                      </td>
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                        {product.productCategory}
                      </td>
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                        {product.size}
                      </td>
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                        {product.imlType}
                      </td>
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                        {product.lidColor} / {product.tubColor}
                      </td>
                      <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-bold text-green-700">
                        {product.finalQty?.toLocaleString("en-IN") || 0}
                      </td>
                    </tr>
                  ))}
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
              onClick={handleSaveLrNumber}
              className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer"
            >
              💾 Save & Complete Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchDetails;
