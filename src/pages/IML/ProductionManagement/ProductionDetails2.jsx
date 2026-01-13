// ProductionDetails.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";

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
    lidMachineNumber: "",
    tubMachineNumber: "",
    lidReceivedBy: "",
    tubReceivedBy: "",
    lidTotalLabels: "",
    tubTotalLabels: "",
    lidRemaining: 0,
    tubRemaining: 0,
  });

  // Add Entry Form - For LID
  const [lidEntryForm, setLidEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "Day",
    packingIncharge: "",
    acceptedComponents: "",
    rejectedComponents: "",
    labelWastage: "0",
    approvedBy: "",
    componentType: "LID",
  });

  // Add Entry Form - For TUB
  const [tubEntryForm, setTubEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "Day",
    packingIncharge: "",
    acceptedComponents: "",
    rejectedComponents: "",
    labelWastage: "0",
    approvedBy: "",
    componentType: "TUB",
  });

  // Production entries history
  const [productionEntries, setProductionEntries] = useState([]);
  const [remainingLidLabels, setRemainingLidLabels] = useState(0);
  const [remainingTubLabels, setRemainingTubLabels] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [lidMachineDropdownOpen, setLidMachineDropdownOpen] = useState(false);
  const [tubMachineDropdownOpen, setTubMachineDropdownOpen] = useState(false);
  const [filteredMachines, setFilteredMachines] = useState(MACHINE_OPTIONS);
  const lidMachineInputRef = useRef(null);
  const tubMachineInputRef = useRef(null);

  const getTotalLabels = (orderId, productId) => {
    const labelData = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}"
    );

    // ONLY look at EXACT key for this order+product
    const exactKey = `${orderId}_${productId}`;
    const item = labelData[exactKey];

    if (!item) {
      console.log("❌ No data found for key:", exactKey);
      return { lidTotal: 0, tubTotal: 0 };
    }

    let lidTotal = 0;
    let tubTotal = 0;

    // **ONLY** sum HISTORY entries - NO outer item quantity
    if (item.history && Array.isArray(item.history)) {
      item.history.forEach((h, idx) => {
        if (h.imlType === "LID & TUB") {
          // LID & TUB: Separate counts
          lidTotal += Number(h.lidReceivedQuantity || 0);
          tubTotal += Number(h.tubReceivedQuantity || 0);
        } else {
          // Single type: add to both (for backward compatibility)
          const qty = Number(
            h.receivedQuantity ||
              h.lidReceivedQuantity ||
              h.tubReceivedQuantity ||
              0
          );
          if (qty > 0) {
            lidTotal += qty;
            tubTotal += qty;
          }
        }
      });
    }

    console.log(`✅ LID TOTAL for ${exactKey}: ${lidTotal}`);
    console.log(`✅ TUB TOTAL for ${exactKey}: ${tubTotal}`);
    return { lidTotal, tubTotal };
  };

  // Check if entry is LID & TUB type
  const isLidAndTub = entry?.imlType === "LID & TUB";

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

      const labelTotals = getTotalLabels(entry.orderId, entry.productId);

      // Prefill customer form
      setCustomerForm({
        customerName: entry.company || "",
        size: entry.size || "",
        product: entry.product || "",
        containerColor: entry.containerColor || "",
        imlName: entry.imlName || "",
        lidMachineNumber: entry.lidMachineNumber || entry.machineNumber || "",
        tubMachineNumber: entry.tubMachineNumber || entry.machineNumber || "",
        lidReceivedBy: entry.lidReceivedBy || entry.receivedBy || "",
        tubReceivedBy: entry.tubReceivedBy || entry.receivedBy || "",
        lidTotalLabels: labelTotals.lidTotal || entry.lidRemaining || 0,
        tubTotalLabels: labelTotals.tubTotal || entry.tubRemaining || 0,
        lidRemaining: entry.lidRemaining || labelTotals.lidTotal || 0,
        tubRemaining: entry.tubRemaining || labelTotals.tubTotal || 0,
      });

      // Compute remaining labels for LID & TUB separately
      if (isLidAndTub) {
        const lidUsed = entriesHistory.reduce((sum, e) => {
          if (e.componentType === "LID") {
            const accepted = toNumber(e.acceptedComponents);
            return sum + accepted;
          }
          return sum;
        }, 0);

        const tubUsed = entriesHistory.reduce((sum, e) => {
          if (e.componentType === "TUB") {
            const accepted = toNumber(e.acceptedComponents);
            return sum + accepted;
          }
          return sum;
        }, 0);

        setRemainingLidLabels(Math.max(labelTotals.lidTotal - lidUsed, 0));
        setRemainingTubLabels(Math.max(labelTotals.tubTotal - tubUsed, 0));
      } else {
        // For single type
        const usedLabels = entriesHistory.reduce((sum, e) => {
          const accepted = toNumber(e.acceptedComponents);
          return sum + accepted;
        }, 0);
        setRemainingLidLabels(Math.max(labelTotals.lidTotal - usedLabels, 0));
      }
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

  // Handle LID entry form changes
  const handleLidEntryChange = (e) => {
    const { name, value } = e.target;
    setLidEntryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle TUB entry form changes
  const handleTubEntryChange = (e) => {
    const { name, value } = e.target;
    setTubEntryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle shift radio button change for LID
  const handleLidShiftChange = (shift) => {
    setLidEntryForm((prev) => ({
      ...prev,
      shift: shift,
    }));
  };

  // Handle shift radio button change for TUB
  const handleTubShiftChange = (shift) => {
    setTubEntryForm((prev) => ({
      ...prev,
      shift: shift,
    }));
  };

  // Handle LID machine input change with autocomplete
  const handleLidMachineInputChange = (e) => {
    const value = e.target.value;
    setCustomerForm((prev) => ({
      ...prev,
      lidMachineNumber: value,
    }));

    // Filter machine options
    const filtered = MACHINE_OPTIONS.filter((machine) =>
      machine.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMachines(filtered);
    setLidMachineDropdownOpen(true);
  };

  // Handle TUB machine input change with autocomplete
  const handleTubMachineInputChange = (e) => {
    const value = e.target.value;
    setCustomerForm((prev) => ({
      ...prev,
      tubMachineNumber: value,
    }));

    // Filter machine options
    const filtered = MACHINE_OPTIONS.filter((machine) =>
      machine.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMachines(filtered);
    setTubMachineDropdownOpen(true);
  };

  // Handle LID machine selection from dropdown
  const handleLidMachineSelect = (machine) => {
    setCustomerForm((prev) => ({
      ...prev,
      lidMachineNumber: machine,
    }));
    setLidMachineDropdownOpen(false);
    setFilteredMachines(MACHINE_OPTIONS);
  };

  // Handle TUB machine selection from dropdown
  const handleTubMachineSelect = (machine) => {
    setCustomerForm((prev) => ({
      ...prev,
      tubMachineNumber: machine,
    }));
    setTubMachineDropdownOpen(false);
    setFilteredMachines(MACHINE_OPTIONS);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check LID machine dropdown
      if (
        lidMachineInputRef.current &&
        !lidMachineInputRef.current.contains(event.target)
      ) {
        setLidMachineDropdownOpen(false);
      }

      // Check TUB machine dropdown (only for LID & TUB)
      if (
        tubMachineInputRef.current &&
        !tubMachineInputRef.current.contains(event.target)
      ) {
        setTubMachineDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add LID production entry
  const addLidProductionEntry = () => {
    if (
      !lidEntryForm.acceptedComponents ||
      !lidEntryForm.rejectedComponents ||
      !lidEntryForm.packingIncharge ||
      !lidEntryForm.approvedBy ||
      !customerForm.lidMachineNumber ||
      !customerForm.lidReceivedBy
    ) {
      alert(
        "Please fill all required fields for LID (including Machine Number and Received By)"
      );
      return;
    }

    const accepted = toNumber(lidEntryForm.acceptedComponents);
    if (accepted > remainingLidLabels) {
      alert(`Cannot accept more than ${remainingLidLabels} LID labels`);
      return;
    }

    const newEntry = {
      date: new Date().toLocaleDateString("en-IN"),
      shift: lidEntryForm.shift,
      acceptedComponents: lidEntryForm.acceptedComponents,
      rejectedComponents: lidEntryForm.rejectedComponents,
      labelWastage: lidEntryForm.labelWastage || "0",
      packingIncharge: lidEntryForm.packingIncharge,
      approvedBy: lidEntryForm.approvedBy,
      componentType: "LID",
      machineNumber: customerForm.lidMachineNumber,
      receivedBy: customerForm.lidReceivedBy,
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

    // Update remaining LID labels
    const labelTotals = getTotalLabels(entry.orderId, entry.productId);
    const lidUsed = updatedEntries.reduce((sum, e) => {
      if (e.componentType === "LID") {
        const accepted = toNumber(e.acceptedComponents);
        return sum + accepted;
      }
      return sum;
    }, 0);

    const remainingLid = Math.max(labelTotals.lidTotal - lidUsed, 0);
    setRemainingLidLabels(remainingLid);
    setCustomerForm((prev) => ({ ...prev, lidRemaining: remainingLid }));

    // Clear LID entry form
    setLidEntryForm({
      date: new Date().toISOString().split("T")[0],
      shift: "Day",
      packingIncharge: "",
      acceptedComponents: "",
      rejectedComponents: "",
      labelWastage: "0",
      approvedBy: "",
      componentType: "LID",
    });
  };

  // Add TUB production entry
  const addTubProductionEntry = () => {
    if (
      !tubEntryForm.acceptedComponents ||
      !tubEntryForm.rejectedComponents ||
      !tubEntryForm.packingIncharge ||
      !tubEntryForm.approvedBy ||
      !customerForm.tubMachineNumber ||
      !customerForm.tubReceivedBy
    ) {
      alert(
        "Please fill all required fields for TUB (including Machine Number and Received By)"
      );
      return;
    }

    const accepted = toNumber(tubEntryForm.acceptedComponents);
    if (accepted > remainingTubLabels) {
      alert(`Cannot accept more than ${remainingTubLabels} TUB labels`);
      return;
    }

    const newEntry = {
      date: new Date().toLocaleDateString("en-IN"),
      shift: tubEntryForm.shift,
      acceptedComponents: tubEntryForm.acceptedComponents,
      rejectedComponents: tubEntryForm.rejectedComponents,
      labelWastage: tubEntryForm.labelWastage || "0",
      packingIncharge: tubEntryForm.packingIncharge,
      approvedBy: tubEntryForm.approvedBy,
      componentType: "TUB",
      machineNumber: customerForm.tubMachineNumber,
      receivedBy: customerForm.tubReceivedBy,
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

    // Update remaining TUB labels
    const labelTotals = getTotalLabels(entry.orderId, entry.productId);
    const tubUsed = updatedEntries.reduce((sum, e) => {
      if (e.componentType === "TUB") {
        const accepted = toNumber(e.acceptedComponents);
        return sum + accepted;
      }
      return sum;
    }, 0);

    const remainingTub = Math.max(labelTotals.tubTotal - tubUsed, 0);
    setRemainingTubLabels(remainingTub);
    setCustomerForm((prev) => ({ ...prev, tubRemaining: remainingTub }));

    // Clear TUB entry form
    setTubEntryForm({
      date: new Date().toISOString().split("T")[0],
      shift: "Day",
      packingIncharge: "",
      acceptedComponents: "",
      rejectedComponents: "",
      labelWastage: "0",
      approvedBy: "",
      componentType: "TUB",
    });
  };

  // Add production entry for non-LID&TUB
  const addProductionEntry = () => {
    if (
      !lidEntryForm.acceptedComponents ||
      !lidEntryForm.rejectedComponents ||
      !lidEntryForm.packingIncharge ||
      !lidEntryForm.approvedBy ||
      !customerForm.lidMachineNumber ||
      !customerForm.lidReceivedBy
    ) {
      alert(
        "Please fill all required fields (including Machine Number and Received By)"
      );
      return;
    }

    const accepted = toNumber(lidEntryForm.acceptedComponents);
    if (accepted > remainingLidLabels) {
      alert(`Cannot accept more than ${remainingLidLabels} labels`);
      return;
    }

    const newEntry = {
      date: new Date().toLocaleDateString("en-IN"),
      shift: lidEntryForm.shift,
      acceptedComponents: lidEntryForm.acceptedComponents,
      rejectedComponents: lidEntryForm.rejectedComponents,
      labelWastage: lidEntryForm.labelWastage || "0",
      packingIncharge: lidEntryForm.packingIncharge,
      approvedBy: lidEntryForm.approvedBy,
      componentType: "SINGLE",
      machineNumber: customerForm.lidMachineNumber,
      receivedBy: customerForm.lidReceivedBy,
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

    // Update remaining labels
    const labelTotals = getTotalLabels(entry.orderId, entry.productId);
    const usedLabels = updatedEntries.reduce((sum, e) => {
      const accepted = toNumber(e.acceptedComponents);
      return sum + accepted;
    }, 0);

    const remaining = Math.max(labelTotals.lidTotal - usedLabels, 0);
    setRemainingLidLabels(remaining);
    setCustomerForm((prev) => ({ ...prev, lidRemaining: remaining }));

    // Clear entry form
    setLidEntryForm({
      date: new Date().toISOString().split("T")[0],
      shift: "Day",
      packingIncharge: "",
      acceptedComponents: "",
      rejectedComponents: "",
      labelWastage: "0",
      approvedBy: "",
      componentType: "SINGLE",
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
    const deletedEntry = productionEntries[indexToRemove];
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
    const labelTotals = getTotalLabels(entry.orderId, entry.productId);

    if (isLidAndTub) {
      const lidUsed = updatedEntries.reduce((sum, e) => {
        if (e.componentType === "LID") {
          const accepted = toNumber(e.acceptedComponents);
          return sum + accepted;
        }
        return sum;
      }, 0);

      const tubUsed = updatedEntries.reduce((sum, e) => {
        if (e.componentType === "TUB") {
          const accepted = toNumber(e.acceptedComponents);
          return sum + accepted;
        }
        return sum;
      }, 0);

      const remainingLid = Math.max(labelTotals.lidTotal - lidUsed, 0);
      const remainingTub = Math.max(labelTotals.tubTotal - tubUsed, 0);
      setRemainingLidLabels(remainingLid);
      setRemainingTubLabels(remainingTub);
      setCustomerForm((prev) => ({
        ...prev,
        lidRemaining: remainingLid,
        tubRemaining: remainingTub,
      }));
    } else {
      const usedLabels = updatedEntries.reduce((sum, e) => {
        const accepted = toNumber(e.acceptedComponents);
        return sum + accepted;
      }, 0);
      const remaining = Math.max(labelTotals.lidTotal - usedLabels, 0);
      setRemainingLidLabels(remaining);
      setCustomerForm((prev) => ({ ...prev, lidRemaining: remaining }));
    }
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
              {isLidAndTub && " (LID & TUB)"}
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

              {/* Production Quantity based on IML Type */}
              {isLidAndTub ? (
                <>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                      LID Production Quantity
                    </label>
                    <input
                      type="text"
                      name="lidTotalLabels"
                      value={formatNumber(customerForm.lidTotalLabels)}
                      onChange={handleCustomerChange}
                      disabled
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                      TUB Production Quantity
                    </label>
                    <input
                      type="text"
                      name="tubTotalLabels"
                      value={formatNumber(customerForm.tubTotalLabels)}
                      onChange={handleCustomerChange}
                      disabled
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-bold text-blue-800"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Production Quantity
                  </label>
                  <input
                    type="text"
                    name="lidTotalLabels"
                    value={formatNumber(customerForm.lidTotalLabels)}
                    onChange={handleCustomerChange}
                    disabled
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                  />
                </div>
              )}
            </div>

            {/* Machine Number and Received By - Conditional Rendering */}
            {isLidAndTub ? (
              <div className="grid grid-cols-4 gap-[1vw] mt-[1vw]">
                {/* LID Machine Number */}
                <div className="relative" ref={lidMachineInputRef}>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    LID Machine Number
                  </label>
                  <input
                    type="text"
                    name="lidMachineNumber"
                    value={customerForm.lidMachineNumber}
                    onChange={handleLidMachineInputChange}
                    onFocus={() => setLidMachineDropdownOpen(true)}
                    placeholder="Type or select machine..."
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-green-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {/* Autocomplete Dropdown for LID */}
                  {lidMachineDropdownOpen && filteredMachines.length > 0 && (
                    <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredMachines.map((machine) => (
                        <div
                          key={`lid-${machine}`}
                          onClick={() => handleLidMachineSelect(machine)}
                          className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-green-100 cursor-pointer transition-colors"
                        >
                          {machine}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* LID Received By */}
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    LID Received By
                  </label>
                  <select
                    name="lidReceivedBy"
                    value={customerForm.lidReceivedBy}
                    onChange={handleCustomerChange}
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-green-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Person</option>
                    {RECEIVED_BY_OPTIONS.map((person) => (
                      <option key={`lid-${person}`} value={person}>
                        {person}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TUB Machine Number */}
                <div className="relative" ref={tubMachineInputRef}>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    TUB Machine Number
                  </label>
                  <input
                    type="text"
                    name="tubMachineNumber"
                    value={customerForm.tubMachineNumber}
                    onChange={handleTubMachineInputChange}
                    onFocus={() => setTubMachineDropdownOpen(true)}
                    placeholder="Type or select machine..."
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Autocomplete Dropdown for TUB */}
                  {tubMachineDropdownOpen && filteredMachines.length > 0 && (
                    <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredMachines.map((machine) => (
                        <div
                          key={`tub-${machine}`}
                          onClick={() => handleTubMachineSelect(machine)}
                          className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          {machine}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TUB Received By */}
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    TUB Received By
                  </label>
                  <select
                    name="tubReceivedBy"
                    value={customerForm.tubReceivedBy}
                    onChange={handleCustomerChange}
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-blue-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Person</option>
                    {RECEIVED_BY_OPTIONS.map((person) => (
                      <option key={`tub-${person}`} value={person}>
                        {person}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[1vw] mt-[1vw]">
                {/* Single Machine Number */}
                <div className="relative" ref={lidMachineInputRef}>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Machine Number
                  </label>
                  <input
                    type="text"
                    name="lidMachineNumber"
                    value={customerForm.lidMachineNumber}
                    onChange={handleLidMachineInputChange}
                    onFocus={() => setLidMachineDropdownOpen(true)}
                    placeholder="Type or select machine..."
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Autocomplete Dropdown */}
                  {lidMachineDropdownOpen && filteredMachines.length > 0 && (
                    <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredMachines.map((machine) => (
                        <div
                          key={machine}
                          onClick={() => handleLidMachineSelect(machine)}
                          className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          {machine}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Single Received By */}
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Received By
                  </label>
                  <select
                    name="lidReceivedBy"
                    value={customerForm.lidReceivedBy}
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
            )}
          </div>

          {/* Add Entry Form */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">➕</span>
              {isLidAndTub
                ? "Add Production Entry (LID & TUB)"
                : "Add Production Entry"}
            </h3>

            {isLidAndTub ? (
              // LID & TUB Entry Forms
              <>
                {/* LID Entry Form */}
                <div className="mb-[1.5vw] p-[0.8vw] bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.5vw] border-2 border-green-200">
                  <h4 className="text-[1vw] font-semibold text-green-800 mb-[0.8vw] flex items-center gap-2">
                    <span className="text-[1.1vw]">🟢</span> LID Entry
                    <span className="text-[.8vw] text-green-600 ml-2">
                      Machine: {customerForm.lidMachineNumber || "Not set"} |
                      Received By: {customerForm.lidReceivedBy || "Not set"}
                    </span>
                  </h4>
                  <div className="grid grid-cols-4 gap-[1vw] mb-[1vw]">
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={lidEntryForm.date}
                        onChange={handleLidEntryChange}
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
                            name="lidShift"
                            checked={lidEntryForm.shift === "Day"}
                            onChange={() => handleLidShiftChange("Day")}
                            className="w-[1vw] h-[1vw] accent-green-600 cursor-pointer"
                          />
                          <span className="text-[.8vw]">Day</span>
                        </label>
                        <label className="flex items-center gap-[0.4vw] cursor-pointer">
                          <input
                            type="radio"
                            name="lidShift"
                            checked={lidEntryForm.shift === "Night"}
                            onChange={() => handleLidShiftChange("Night")}
                            className="w-[1vw] h-[1vw] accent-green-600 cursor-pointer"
                          />
                          <span className="text-[.8vw]">Night</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        Accepted LID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="acceptedComponents"
                        value={lidEntryForm.acceptedComponents}
                        onChange={handleLidEntryChange}
                        placeholder="Enter accepted qty"
                        min="0"
                        max={formatNumber(remainingLidLabels)}
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-green-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        Rejected LID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="rejectedComponents"
                        value={lidEntryForm.rejectedComponents}
                        onChange={handleLidEntryChange}
                        placeholder="Enter rejected qty"
                        min="0"
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-green-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        LID Wastage
                      </label>
                      <input
                        type="number"
                        name="labelWastage"
                        value={lidEntryForm.labelWastage}
                        onChange={handleLidEntryChange}
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
                        value={lidEntryForm.packingIncharge}
                        onChange={handleLidEntryChange}
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Incharge</option>
                        {PACKING_INCHARGE_OPTIONS.map((person) => (
                          <option key={`lid-packing-${person}`} value={person}>
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
                        value={lidEntryForm.approvedBy}
                        onChange={handleLidEntryChange}
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Approver</option>
                        {APPROVED_BY_OPTIONS.map((person) => (
                          <option key={`lid-approved-${person}`} value={person}>
                            {person}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addLidProductionEntry}
                        className="w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:from-green-700 hover:to-emerald-700 transition-all cursor-pointer shadow-md"
                      >
                        ➕ Add LID Entry
                      </button>
                    </div>
                  </div>
                </div>

                {/* TUB Entry Form */}
                <div className="p-[0.8vw] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.5vw] border-2 border-blue-200">
                  <h4 className="text-[1vw] font-semibold text-blue-800 mb-[0.8vw] flex items-center gap-2">
                    <span className="text-[1.1vw]">🔵</span> TUB Entry
                    <span className="text-[.8vw] text-blue-600 ml-2">
                      Machine: {customerForm.tubMachineNumber || "Not set"} |
                      Received By: {customerForm.tubReceivedBy || "Not set"}
                    </span>
                  </h4>
                  <div className="grid grid-cols-4 gap-[1vw]">
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={tubEntryForm.date}
                        onChange={handleTubEntryChange}
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
                            checked={tubEntryForm.shift === "Day"}
                            onChange={() => handleTubShiftChange("Day")}
                            className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer"
                          />
                          <span className="text-[.8vw]">Day</span>
                        </label>
                        <label className="flex items-center gap-[0.4vw] cursor-pointer">
                          <input
                            type="radio"
                            name="shift"
                            checked={tubEntryForm.shift === "Night"}
                            onChange={() => handleTubShiftChange("Night")}
                            className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer"
                          />
                          <span className="text-[.8vw]">Night</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        Accepted TUB <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="acceptedComponents"
                        value={tubEntryForm.acceptedComponents}
                        onChange={handleTubEntryChange}
                        placeholder="Enter accepted qty"
                        min="0"
                        max={formatNumber(remainingTubLabels)}
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        Rejected TUB <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="rejectedComponents"
                        value={tubEntryForm.rejectedComponents}
                        onChange={handleTubEntryChange}
                        placeholder="Enter rejected qty"
                        min="0"
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                        TUB Wastage
                      </label>
                      <input
                        type="number"
                        name="labelWastage"
                        value={tubEntryForm.labelWastage}
                        onChange={handleTubEntryChange}
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
                        value={tubEntryForm.packingIncharge}
                        onChange={handleTubEntryChange}
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Incharge</option>
                        {PACKING_INCHARGE_OPTIONS.map((person) => (
                          <option key={`tub-packing-${person}`} value={person}>
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
                        value={tubEntryForm.approvedBy}
                        onChange={handleTubEntryChange}
                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Approver</option>
                        {APPROVED_BY_OPTIONS.map((person) => (
                          <option key={`tub-approved-${person}`} value={person}>
                            {person}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addTubProductionEntry}
                        className="w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:from-blue-700 hover:to-cyan-700 transition-all cursor-pointer shadow-md"
                      >
                        ➕ Add TUB Entry
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Single Type Entry Form
              <div className="grid grid-cols-4 gap-[1vw] mb-[1vw]">
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={lidEntryForm.date}
                    onChange={handleLidEntryChange}
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
                        checked={lidEntryForm.shift === "Day"}
                        onChange={() => handleLidShiftChange("Day")}
                        className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer"
                      />
                      <span className="text-[.8vw]">Day</span>
                    </label>
                    <label className="flex items-center gap-[0.4vw] cursor-pointer">
                      <input
                        type="radio"
                        name="shift"
                        checked={lidEntryForm.shift === "Night"}
                        onChange={() => handleLidShiftChange("Night")}
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
                    value={lidEntryForm.acceptedComponents}
                    onChange={handleLidEntryChange}
                    placeholder="Enter accepted qty"
                    min="0"
                    max={formatNumber(remainingLidLabels)}
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
                    value={lidEntryForm.rejectedComponents}
                    onChange={handleLidEntryChange}
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
                    value={lidEntryForm.labelWastage}
                    onChange={handleLidEntryChange}
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
                    value={lidEntryForm.packingIncharge}
                    onChange={handleLidEntryChange}
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Incharge</option>
                    {PACKING_INCHARGE_OPTIONS.map((person) => (
                      <option key={`single-packing-${person}`} value={person}>
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
                    value={lidEntryForm.approvedBy}
                    onChange={handleLidEntryChange}
                    className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Approver</option>
                    {APPROVED_BY_OPTIONS.map((person) => (
                      <option key={`single-approved-${person}`} value={person}>
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
            )}

            {/* Remaining Labels Display */}
            <div className="mt-[1vw]">
              {isLidAndTub ? (
                <div className="grid grid-cols-2 gap-[1vw]">
                  <div className="p-[0.75vw] bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-[0.5vw]">
                    <div className="flex justify-between items-center">
                      <span className="text-[.9vw] font-semibold text-green-900">
                        Remaining LID Labels:
                      </span>
                      <span className="text-[1.1vw] font-bold text-green-700">
                        {formatNumber(remainingLidLabels)}
                      </span>
                    </div>
                  </div>
                  <div className="p-[0.75vw] bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 rounded-[0.5vw]">
                    <div className="flex justify-between items-center">
                      <span className="text-[.9vw] font-semibold text-blue-900">
                        Remaining TUB Labels:
                      </span>
                      <span className="text-[1.1vw] font-bold text-blue-700">
                        {formatNumber(remainingTubLabels)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-[0.75vw] bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-[0.5vw]">
                  <div className="flex justify-between items-center">
                    <span className="text-[.9vw] font-semibold text-green-900">
                      Remaining Labels:
                    </span>
                    <span className="text-[1.1vw] font-bold text-green-700">
                      {formatNumber(remainingLidLabels)}
                    </span>
                  </div>
                </div>
              )}
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
                    {isLidAndTub && (
                      <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                        Component
                      </th>
                    )}
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
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Machine No
                    </th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                      Received By
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
                        colSpan={isLidAndTub ? "12" : "11"}
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
                        {isLidAndTub && (
                          <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${
                                entry.componentType === "LID"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {entry.componentType}
                            </span>
                          </td>
                        )}
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
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium">
                          {entry.machineNumber || "-"}
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium">
                          {entry.receivedBy || "-"}
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
              {isLidAndTub
                ? remainingLidLabels === 0 && remainingTubLabels === 0
                  ? "✓ Submit Production"
                  : "Save"
                : remainingLidLabels === 0
                ? "✓ Submit Production"
                : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDetails;
