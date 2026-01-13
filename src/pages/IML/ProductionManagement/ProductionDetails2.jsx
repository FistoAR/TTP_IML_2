// ProductionDetails.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";

// Machine options
const MACHINE_OPTIONS = ["01", "02", "03", "04", "05"];

// Received By options
const RECEIVED_BY_OPTIONS = ["Murali", "Praveen", "Kumar", "Ravi"];

// Packing Incharge options
const PACKING_INCHARGE_OPTIONS = ["Murugan", "Praveen", "Ravi", "Kumar"];

// Approved By options
const APPROVED_BY_OPTIONS = ["Murugan", "Praveen", "Ravi", "Kumar"];

// Helper: parse number safely
const toNumber = (value) => {
  if (!value && value !== 0) return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
};

// Helper: format number with commas
const formatNumber = (value) => {
  const num = toNumber(value);
  return num.toLocaleString("en-IN");
};

const ProductionDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { entry } = location.state || {};

  // Customer Details Form
  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    product: "",
    size: "",
    containerColor: "",
    imlName: "",
    machineNumber: "",
    noOfLabels: "",
    receivedBy: "",
  });

  // Add Entry Form
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "Day",
    packingIncharge: "",
    acceptedComponents: "",
    rejectedComponents: "",
    labelWastage: "0",
    approvedBy: "",
  });

  // Production entries history
  const [productionEntries, setProductionEntries] = useState([]);
  const [remainingLabels, setRemainingLabels] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const [filteredMachines, setFilteredMachines] = useState(MACHINE_OPTIONS);
  const machineInputRef = useRef(null);

  // Load data from localStorage and prefill from entry
  useEffect(() => {
    if (entry) {
      const entryId = entry.id;

      // Load production entries from localStorage
      const storedProduction = localStorage.getItem(
        STORAGE_KEY_PRODUCTION_FOLLOWUPS
      );
      const allProductionData = storedProduction
        ? JSON.parse(storedProduction)
        : {};
      const entriesHistory = allProductionData[entryId] || [];

      setProductionEntries(entriesHistory);

      // Prefill customer form
      setCustomerForm({
        customerName: entry.company || "",
        size: entry.size || "",
        product: entry.product || "",
        containerColor: entry.containerColor || "",
        imlName: entry.imlName || "",
        machineNumber: entry.machineNumber || "",
        noOfLabels: entry.noOfLabels || "",
        receivedBy: entry.receivedBy || "",
      });

      // Compute remaining labels
      const totalLabels = toNumber(entry.noOfLabels);
      const usedLabels = entriesHistory.reduce((sum, e) => {
        const accepted = toNumber(e.acceptedComponents);
        const rejected = toNumber(e.rejectedComponents);
        const wastage = toNumber(e.labelWastage);
        return sum + accepted + rejected + wastage;
      }, 0);
      setRemainingLabels(Math.max(totalLabels - usedLabels, 0));
    }
  }, [entry]);

  // Handle customer form changes
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle entry form changes
  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setEntryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle shift radio button change
  const handleShiftChange = (shift) => {
    setEntryForm((prev) => ({
      ...prev,
      shift: shift,
    }));
  };

  // Handle machine input change with autocomplete
  const handleMachineInputChange = (e) => {
    const value = e.target.value;
    setCustomerForm((prev) => ({
      ...prev,
      machineNumber: value,
    }));

    // Filter machine options
    const filtered = MACHINE_OPTIONS.filter((machine) =>
      machine.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMachines(filtered);
    setMachineDropdownOpen(true);
  };

  // Handle machine selection from dropdown
  const handleMachineSelect = (machine) => {
    setCustomerForm((prev) => ({
      ...prev,
      machineNumber: machine,
    }));
    setMachineDropdownOpen(false);
    setFilteredMachines(MACHINE_OPTIONS);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        machineInputRef.current &&
        !machineInputRef.current.contains(event.target)
      ) {
        setMachineDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add production entry
  const addProductionEntry = () => {
    if (
      !entryForm.acceptedComponents ||
      !entryForm.rejectedComponents ||
      !entryForm.packingIncharge ||
      !entryForm.approvedBy
    ) {
      alert("Please fill all required fields");
      return;
    }

    const newEntry = {
      date: new Date().toLocaleDateString("en-IN"),
      shift: entryForm.shift,
      acceptedComponents: entryForm.acceptedComponents,
      rejectedComponents: entryForm.rejectedComponents,
      labelWastage: entryForm.labelWastage || "0",
      packingIncharge: entryForm.packingIncharge,
      approvedBy: entryForm.approvedBy,
      submitted: false,
    };

    const updatedEntries = [...productionEntries, newEntry];
    setProductionEntries(updatedEntries);

    const entryId = entry.id;

    // Save followups
    const storedProduction = localStorage.getItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS
    );
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = updatedEntries;
    localStorage.setItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS,
      JSON.stringify(allProductionData)
    );

    // Recompute remaining labels
    const totalLabels = toNumber(customerForm.noOfLabels || entry.noOfLabels);
    const usedLabels = updatedEntries.reduce((sum, e) => {
      const accepted = toNumber(e.acceptedComponents);
      const rejected = toNumber(e.rejectedComponents);
      const wastage = toNumber(e.labelWastage);
      return sum + accepted + rejected + wastage;
    }, 0);
    const remaining = Math.max(totalLabels - usedLabels, 0);
    setRemainingLabels(remaining);

    // Clear entry form fields
    setEntryForm({
      date: new Date().toISOString().split("T")[0],
      shift: "Day",
      packingIncharge: "",
      acceptedComponents: "",
      rejectedComponents: "",
      labelWastage: "0",
      approvedBy: "",
    });
  };

  // Go back to production management
  const handleBack = () => {
    navigate("/iml/production", {
      state: { refreshData: true },
    });
  };

  // Handle Submit button
  const handleSubmit = () => {
    if (productionEntries.length === 0) {
      alert("Please add at least one production entry before submitting");
      return;
    }

    const entryId = entry.id;

    // Mark all current rows as submitted
    const submittedEntries = productionEntries.map((e) => ({
      ...e,
      submitted: true,
    }));
    setProductionEntries(submittedEntries);

    // Save followups with submitted=true
    const storedProduction = localStorage.getItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS
    );
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = submittedEntries;
    localStorage.setItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS,
      JSON.stringify(allProductionData)
    );

    setIsSubmitted(true);
    alert("✅ Production details submitted successfully!");
    handleBack();
  };

  const handleDeleteEntry = (indexToRemove) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    const entryId = entry.id;
    const updatedEntries = productionEntries.filter(
      (_e, idx) => idx !== indexToRemove
    );
    setProductionEntries(updatedEntries);

    // Update followups storage
    const storedProduction = localStorage.getItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS
    );
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = updatedEntries;
    localStorage.setItem(
      STORAGE_KEY_PRODUCTION_FOLLOWUPS,
      JSON.stringify(allProductionData)
    );

    // Recompute remaining labels
    const totalLabels = toNumber(customerForm.noOfLabels || entry.noOfLabels);
    const usedLabels = updatedEntries.reduce((sum, e) => {
      const accepted = toNumber(e.acceptedComponents);
      const rejected = toNumber(e.rejectedComponents);
      const wastage = toNumber(e.labelWastage);
      return sum + accepted + rejected + wastage;
    }, 0);
    const remaining = Math.max(totalLabels - usedLabels, 0);
    setRemainingLabels(remaining);
  };

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Invalid Access
          </h2>
          <p className="text-gray-600 mb-4">No entry information provided</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
          >
            Back to Production Management
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
              Production Details - Job Card
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              {customerForm.customerName} - {customerForm.imlName}
            </p>
          </div>
          <div className="w-[3vw]"></div>
        </div>

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[70vh] overflow-y-auto">
          {/* Customer Details */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📋</span> Customer Details
            </h3>
            <div className="grid grid-cols-4 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={customerForm.customerName}
                  onChange={handleCustomerChange}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  IML Name
                </label>
                <input
                  type="text"
                  name="imlName"
                  value={customerForm.imlName}
                  onChange={handleCustomerChange}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Product
                </label>
                <input
                  type="text"
                  name="product"
                  value={customerForm.product}
                  onChange={handleCustomerChange}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Size
                </label>
                <input
                  type="text"
                  name="size"
                  value={customerForm.size}
                  onChange={handleCustomerChange}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Container Color
                </label>
                <input
                  type="text"
                  name="containerColor"
                  value={customerForm.containerColor}
                  onChange={handleCustomerChange}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Production Quantity
                </label>
                <input
                  type="text"
                  name="noOfLabels"
                  value={formatNumber(customerForm.noOfLabels)}
                  onChange={handleCustomerChange}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>
              <div className="relative" ref={machineInputRef}>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Machine Number
                </label>
                <input
                  type="text"
                  name="machineNumber"
                  value={customerForm.machineNumber}
                  onChange={handleMachineInputChange}
                  onFocus={() => setMachineDropdownOpen(true)}
                  placeholder="Type or select machine..."
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />

                {/* Autocomplete Dropdown */}
                {machineDropdownOpen && filteredMachines.length > 0 && (
                  <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                    {filteredMachines.map((machine) => (
                      <div
                        key={machine}
                        onClick={() => handleMachineSelect(machine)}
                        className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-purple-100 cursor-pointer transition-colors"
                      >
                        {machine}
                      </div>
                    ))}
                  </div>
                )}

                
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Received By
                </label>
                <select
                  name="receivedBy"
                  value={customerForm.receivedBy}
                  onChange={handleCustomerChange}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] cursor-pointer"
                >
                  <option value="">Select Person</option>
                  {RECEIVED_BY_OPTIONS.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Add Entry Form */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">➕</span> Add Production Entry
            </h3>
            <div className="grid grid-cols-4 gap-[1vw] mb-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={entryForm.date}
                  onChange={handleEntryChange}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Shift
                </label>
                <div className="flex gap-[1vw] mt-[0.3vw]">
                  <label className="flex items-center gap-[0.4vw] cursor-pointer">
                    <input
                      type="radio"
                      name="shift"
                      checked={entryForm.shift === "Day"}
                      onChange={() => handleShiftChange("Day")}
                      className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[.8vw]">Day</span>
                  </label>
                  <label className="flex items-center gap-[0.4vw] cursor-pointer">
                    <input
                      type="radio"
                      name="shift"
                      checked={entryForm.shift === "Night"}
                      onChange={() => handleShiftChange("Night")}
                      className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[.8vw]">Night</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Accepted Components <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="acceptedComponents"
                  value={entryForm.acceptedComponents}
                  onChange={handleEntryChange}
                  placeholder="Enter accepted qty"
                  min="0"
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Rejected Components <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="rejectedComponents"
                  value={entryForm.rejectedComponents}
                  onChange={handleEntryChange}
                  placeholder="Enter rejected qty"
                  min="0"
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Label Wastage
                </label>
                <input
                  type="number"
                  name="labelWastage"
                  value={entryForm.labelWastage}
                  onChange={handleEntryChange}
                  placeholder="Enter wastage"
                  min="0"
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Packing Incharge <span className="text-red-500">*</span>
                </label>
                <select
                  name="packingIncharge"
                  value={entryForm.packingIncharge}
                  onChange={handleEntryChange}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Incharge</option>
                  {PACKING_INCHARGE_OPTIONS.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Approved By <span className="text-red-500">*</span>
                </label>
                <select
                  name="approvedBy"
                  value={entryForm.approvedBy}
                  onChange={handleEntryChange}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Approver</option>
                  {APPROVED_BY_OPTIONS.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addProductionEntry}
                  className="w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:from-blue-700 hover:to-cyan-700 transition-all cursor-pointer shadow-md"
                >
                  ➕ Add Entry
                </button>
              </div>
            </div>

            {/* Remaining Labels Display */}
            <div className="mt-[1vw] p-[0.75vw] bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-[0.5vw]">
              <div className="flex justify-between items-center">
                <span className="text-[.9vw] font-semibold text-green-900">
                  Remaining Labels:
                </span>
                <span className="text-[1.1vw] font-bold text-green-700">
                  {formatNumber(remainingLabels)}
                </span>
              </div>
            </div>
          </div>

          {/* Production Entries Table */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📊</span> Production History
            </h3>
            <div className="overflow-auto max-h-[35vh]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100 sticky top-0">
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      S.No
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Date
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Shift
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Accepted
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Rejected
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Wastage
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Packing Incharge
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Approved By
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold text-amber-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productionEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="border border-amber-300 px-[0.75vw] py-[2vw] text-center text-[.85vw] text-gray-500"
                      >
                        No entries added yet. Add your first entry above.
                      </td>
                    </tr>
                  ) : (
                    productionEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-amber-50">
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {idx + 1}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {entry.date}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${
                              entry.shift === "Day"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {entry.shift}
                          </span>
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-green-700">
                          {formatNumber(entry.acceptedComponents)}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-red-700">
                          {formatNumber(entry.rejectedComponents)}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] text-gray-700">
                          {formatNumber(entry.labelWastage) || "-"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {entry.packingIncharge}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          {entry.approvedBy}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-center">
                          {entry.submitted ? (
                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[.75vw] font-semibold">
                              ✓ Submitted
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteEntry(idx)}
                              className="px-[0.75vw] py-[.3vw] bg-red-600 text-white rounded-[0.4vw] text-[.75vw] font-medium hover:bg-red-700 cursor-pointer transition-all"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-[1vw]">
            <button
              onClick={handleBack}
              className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={productionEntries.length === 0}
              className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formatNumber(remainingLabels) !== "0" ? "Save" : "✓ Submit Production"}
              
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDetails;
