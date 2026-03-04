// ProductionDetails.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";

const STORAGE_KEY_REMAINING_PRODUCTION = "iml_remaining_production_followups";
const STORAGE_KEY_IML = "imlorders";

// Machine options
const MACHINE_OPTIONS = ["01", "02", "03", "04", "05"];

// Received By options

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

  const [isFromRemaining, setIsFromRemaining] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [lidQuantity, setLidQuantity] = useState(0);
  const [tubQuantity, setTubQuantity] = useState(0);

  const [allocatedQty, setAllocatedQty] = useState(0);

  const [mainLidTotal, setMainLidTotal] = useState(0);
  const [mainTubTotal, setMainTubTotal] = useState(0);
  const [allocatedLid, setAllocatedLid] = useState(0);
  const [allocatedTub, setAllocatedTub] = useState(0);

  const [receivedByOptions, setReceivedByOptions] = useState([
    "Murali",
    "Praveen",
    "Kumar",
    "Ravi",
  ]);
  const [packingInchargeOptions, setPackingInchargeOptions] = useState([
    "Murugan",
    "Praveen",
    "Ravi",
    "Kumar",
  ]);
  const [approvedByOptions, setApprovedByOptions] = useState([
    "Murugan",
    "Praveen",
    "Ravi",
    "Kumar",
  ]);

  const [lidProductionQty, setLidProductionQty] = useState(0);
  const [tubProductionQty, setTubProductionQty] = useState(0);
  const [totalProductionQty, setTotalProductionQty] = useState(0);

  const [showPersonManager, setShowPersonManager] = useState(false);
  const [newPerson, setNewPerson] = useState("");
  const [personType, setPersonType] = useState("received"); // received, packing, approved

  // ✅ TOTAL LABELS RECEIVED - NEW FEATURE
  const [totalLabelsReceived, setTotalLabelsReceived] = useState({
    lid: 0,
    tub: 0,
    single: 0,
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (entry) {
      const prodKey = `${entry.orderId}_${entry.productId}`;
      const saved = JSON.parse(
        localStorage.getItem("iml_total_labels_received") || "{}",
      );
      const savedData = saved[prodKey];

      if (savedData) {
        setTotalLabelsReceived(savedData);
      }
    }
  }, [entry]);

  const getTotalLabels = (orderId, productId, entryData) => {
    // If we have pre-calculated values from ProductionManagement, use them directly
    if (entryData && entryData.calculatedTotal !== undefined) {
      console.log(`✅ Using pre-calculated values from ProductionManagement`);
      return {
        totalQuantity: entryData.calculatedTotal || 0,
        lidQuantity: entryData.calculatedLidTotal || 0,
        tubQuantity: entryData.calculatedTubTotal || 0,
        isFromRemaining: entryData.isFromRemaining || false,
      };
    }

    // Fallback: Calculate from localStorage (original logic)
    const labelData = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}",
    );

    const exactKey = `${orderId}_${productId}`;
    const item = labelData[exactKey];

    if (!item) {
      console.log("❌ No data found for key:", exactKey);
      return {
        totalQuantity: 0,
        lidQuantity: 0,
        tubQuantity: 0,
        isFromRemaining: false,
      };
    }

    let totalQuantity = 0;
    let lidQuantity = 0;
    let tubQuantity = 0;
    let isFromRemaining = false;

    // Check for allocations from remaining orders
    const allocationData = JSON.parse(
      localStorage.getItem("iml_production_allocation") || "{}",
    );
    const allocations = allocationData[exactKey] || [];
    const allocatedQty = allocations.reduce(
      (sum, alloc) => sum + (alloc.allocatedQty || 0),
      0,
    );

    if (allocatedQty > 0) {
      // If there are allocations, this is from remaining
      isFromRemaining = true;
      totalQuantity = allocatedQty;

      // Determine how to split based on imlType
      if (item.imlType === "LID & TUB") {
        lidQuantity = Math.floor(allocatedQty / 2);
        tubQuantity = allocatedQty - lidQuantity;
      } else if (item.imlType === "LID") {
        lidQuantity = allocatedQty;
        tubQuantity = 0;
      } else if (item.imlType === "TUB") {
        lidQuantity = 0;
        tubQuantity = allocatedQty;
      } else {
        lidQuantity = allocatedQty;
        tubQuantity = 0;
      }

      console.log(
        `✅ Using Remaining Allocation: ${totalQuantity} for ${exactKey}`,
      );
    } else {
      // If no allocations, use main order history
      if (item.history && Array.isArray(item.history)) {
        item.history.forEach((h) => {
          if (h.imlType === "LID & TUB") {
            const lidQty = Number(h.lidReceivedQuantity || 0);
            const tubQty = Number(h.tubReceivedQuantity || 0);
            lidQuantity += lidQty;
            tubQuantity += tubQty;
            totalQuantity += lidQty + tubQty;
          } else {
            const qty = Number(
              h.receivedQuantity ||
                h.lidReceivedQuantity ||
                h.tubReceivedQuantity ||
                0,
            );
            if (qty > 0) {
              lidQuantity += qty;
              tubQuantity += qty;
              totalQuantity += qty;
            }
          }
        });
      }
      console.log(
        `✅ Using Main Order: LID=${lidQuantity}, TUB=${tubQuantity}, Total=${totalQuantity} for ${exactKey}`,
      );
    }

    return {
      totalQuantity,
      lidQuantity,
      tubQuantity,
      isFromRemaining,
    };
  };

  const isLidAndTub = entry?.imlType === "LID & TUB";

  // Load data from localStorage and prefill from entry
  useEffect(() => {
    if (entry) {
      console.log("📦 Entry received in ProductionDetails:", entry);

      // Use pre-calculated values if available
      const hasPreCalculated = entry.calculatedTotal !== undefined;

      let labelTotals;
      if (hasPreCalculated) {
        labelTotals = {
          totalQuantity: entry.calculatedTotal || 0,
          lidQuantity: entry.calculatedLidTotal || 0,
          tubQuantity: entry.calculatedTubTotal || 0,
          isFromRemaining: entry.isFromRemaining || false,
        };
        console.log("✅ Using pre-calculated totals:", labelTotals);
      } else {
        // Fallback to calculating
        labelTotals = getTotalLabels(entry.orderId, entry.productId, entry);
        console.log("🔄 Calculated totals:", labelTotals);
      }

      const isRemainingAllocation = entry.sourceType === "remaining";
      const storageKey = isRemainingAllocation
        ? STORAGE_KEY_REMAINING_PRODUCTION
        : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

      const storedProduction = localStorage.getItem(storageKey);
      const allProductionData = storedProduction
        ? JSON.parse(storedProduction)
        : {};
      const entriesHistory = allProductionData[entry.id] || [];

      setProductionEntries(entriesHistory);
      setIsFromRemaining(isRemainingAllocation);

      // Always use the totals we have (either pre-calculated or calculated)
      setTotalQuantity(labelTotals.totalQuantity);
      setLidQuantity(labelTotals.lidQuantity);
      setTubQuantity(labelTotals.tubQuantity);

      const prodKey = `${entry.orderId}_${entry.productId}`;
      const savedLabels = JSON.parse(localStorage.getItem('iml_total_labels_received') || '{}');
      const savedTotalLabels = savedLabels[prodKey] || { lid: 0, tub: 0, single: 0 };
      setTotalLabelsReceived(savedTotalLabels);

      // ✅ RECALCULATE REMAINING using NEW totals
      const lidUsed = entriesHistory.reduce((sum, e) => {
        if (e.componentType === "LID" || e.componentType === "SINGLE") {
          return sum + toNumber(e.acceptedComponents);
        }
        return sum;
      }, 0);

      const tubUsed = entriesHistory.reduce((sum, e) => {
        if (e.componentType === "TUB") {
          return sum + toNumber(e.acceptedComponents);
        }
        return sum;
      }, 0);

      console.log(`Math.max(savedTotalLabels.lid - lidUsed, 0): ${Math.max(savedTotalLabels.lid - lidUsed, 0)}`);
      console.log(`Math.max(savedTotalLabels.tub - tubUsed, 0): ${Math.max(savedTotalLabels.tub - tubUsed, 0)}`);

      if (isLidAndTub) {
  // ✅ If totalLabelsReceived was never set (0), fall back to production qty
  const effectiveLid = savedTotalLabels.lid > 0 ? savedTotalLabels.lid : labelTotals.lidQuantity;
  const effectiveTub = savedTotalLabels.tub > 0 ? savedTotalLabels.tub : labelTotals.tubQuantity;
  setRemainingLidLabels(Math.max(effectiveLid - lidUsed, 0));
  setRemainingTubLabels(Math.max(effectiveTub - tubUsed, 0));
  setLidProductionQty(labelTotals.lidQuantity);
  setTubProductionQty(labelTotals.tubQuantity);
} else {
  // ✅ If totalLabelsReceived was never set (0), fall back to production qty
  const effectiveSingle = savedTotalLabels.single > 0 ? savedTotalLabels.single : labelTotals.totalQuantity;
  setRemainingLidLabels(Math.max(effectiveSingle - lidUsed, 0));
  setTotalProductionQty(labelTotals.totalQuantity);
}

      // Calculate used labels from entries
      // const lidUsed = entriesHistory.reduce((sum, e) => {
      //   if (e.componentType === "LID" || e.componentType === "SINGLE") {
      //     const accepted = toNumber(e.acceptedComponents);
      //     return sum + accepted;
      //   }
      //   return sum;
      // }, 0);

      // const tubUsed = entriesHistory.reduce((sum, e) => {
      //   if (e.componentType === "TUB") {
      //     const accepted = toNumber(e.acceptedComponents);
      //     return sum + accepted;
      //   }
      //   return sum;
      // }, 0);

      // // Set remaining labels
      // if (isLidAndTub) {
      //   const remainingLid = Math.max(labelTotals.lidQuantity - lidUsed, 0);
      //   const remainingTub = Math.max(labelTotals.tubQuantity - tubUsed, 0);
      //   setRemainingLidLabels(remainingLid);
      //   setRemainingTubLabels(remainingTub);
      //   setLidProductionQty(labelTotals.lidQuantity);
      //   setTubProductionQty(labelTotals.tubQuantity);
      // } else {
      //   const remaining = Math.max(labelTotals.totalQuantity - lidUsed, 0);
      //   setRemainingLidLabels(remaining);
      //   setTotalProductionQty(labelTotals.totalQuantity);
      // }

      // Prefill customer form with the correct values
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
        // Use the correct quantities
        lidTotalLabels: isLidAndTub
          ? labelTotals.lidQuantity
          : labelTotals.lidQuantity,
        tubTotalLabels: isLidAndTub ? labelTotals.tubQuantity : 0,
        lidRemaining: isLidAndTub
          ? Math.max(labelTotals.lidQuantity - lidUsed, 0)
          : Math.max(labelTotals.lidQuantity - lidUsed, 0),
        tubRemaining: isLidAndTub
          ? Math.max(labelTotals.tubQuantity - tubUsed, 0)
          : 0,
      });
    }
  }, [entry]);

  useEffect(() => {
    const loadPersons = () => {
      setReceivedByOptions(
        JSON.parse(
          localStorage.getItem("iml_received_persons") ??
            JSON.stringify(["Murali", "Praveen", "Kumar", "Ravi"]),
        ),
      );

      setPackingInchargeOptions(
        JSON.parse(
          localStorage.getItem("iml_packing_persons") ??
            JSON.stringify(["Murugan", "Praveen", "Ravi", "Kumar"]),
        ),
      );

      setApprovedByOptions(
        JSON.parse(
          localStorage.getItem("iml_approved_persons") ??
            JSON.stringify(["Murugan", "Praveen", "Ravi", "Kumar"]),
        ),
      );
    };

    loadPersons();
  }, []);

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
      machine.toLowerCase().includes(value.toLowerCase()),
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
      machine.toLowerCase().includes(value.toLowerCase()),
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
  // ProductionDetails2.jsx - Update addLidProductionEntry function

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
        "Please fill all required fields for LID (including Machine Number and Received By)",
      );
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

    // Save followups - USE CORRECT STORAGE KEY
    const storageKey = isFromRemaining
      ? STORAGE_KEY_REMAINING_PRODUCTION
      : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

    const storedProduction = localStorage.getItem(storageKey);
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = updatedEntries;
    localStorage.setItem(storageKey, JSON.stringify(allProductionData));

    // Update remaining LID labels - Use the correct source quantity
    const lidUsed = updatedEntries.reduce((sum, e) => {
      if (e.componentType === "LID") {
        const accepted = toNumber(e.acceptedComponents);
        return sum + accepted;
      }
      return sum;
    }, 0);

    const effectiveLidTotal = totalLabelsReceived.lid > 0 ? totalLabelsReceived.lid : lidQuantity;
    const remainingLid = Math.max(effectiveLidTotal - lidUsed, 0);
    setRemainingLidLabels(remainingLid);
    checkAndUpdateOrderStatus();
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
  // Update addTubProductionEntry function
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
        "Please fill all required fields for TUB (including Machine Number and Received By)",
      );
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

    // Save followups - USE CORRECT STORAGE KEY
    const storageKey = isFromRemaining
      ? STORAGE_KEY_REMAINING_PRODUCTION
      : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

    const storedProduction = localStorage.getItem(storageKey);
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = updatedEntries;
    localStorage.setItem(storageKey, JSON.stringify(allProductionData));

    // Update remaining TUB labels - Use the correct source quantity
    const tubUsed = updatedEntries.reduce((sum, e) => {
      if (e.componentType === "TUB") {
        const accepted = toNumber(e.acceptedComponents);
        return sum + accepted;
      }
      return sum;
    }, 0);

    const effectiveTubTotal = totalLabelsReceived.tub > 0 ? totalLabelsReceived.tub : tubQuantity;
    const remainingTub = Math.max(effectiveTubTotal - tubUsed, 0);
    setRemainingTubLabels(remainingTub);
    checkAndUpdateOrderStatus();
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
        "Please fill all required fields (including Machine Number and Received By)",
      );
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

    // Save followups - USE CORRECT STORAGE KEY
    const storageKey = isFromRemaining
      ? STORAGE_KEY_REMAINING_PRODUCTION
      : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

    const storedProduction = localStorage.getItem(storageKey);
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction) // Changed from JSON.parse(storageKey)
      : {};
    allProductionData[entryId] = updatedEntries;
    localStorage.setItem(storageKey, JSON.stringify(allProductionData));
    // Update remaining labels - USE CORRECT QUANTITIES
    const usedLabels = updatedEntries.reduce((sum, e) => {
      const accepted = toNumber(e.acceptedComponents);
      return sum + accepted;
    }, 0);

    const effectiveSingleTotal = totalLabelsReceived.single > 0 ? totalLabelsReceived.single : totalQuantity;
    const remaining = Math.max(effectiveSingleTotal - usedLabels, 0); // Use totalQuantity instead of labelTotals.lidTotal
    setRemainingLidLabels(remaining);
    checkAndUpdateOrderStatus();
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

    // Save followups with submitted=true - USE CORRECT STORAGE KEY
    const storageKey = isFromRemaining
      ? STORAGE_KEY_REMAINING_PRODUCTION
      : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

    const storedProduction = localStorage.getItem(storageKey);
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = submittedEntries;
    localStorage.setItem(storageKey, JSON.stringify(allProductionData));

    setIsSubmitted(true);
    alert("✅ Production details submitted successfully!");
    handleBack();
  };

  const handleDeleteEntry = (indexToRemove) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    const entryId = entry.id;
    const updatedEntries = productionEntries.filter(
      (_e, idx) => idx !== indexToRemove,
    );
    setProductionEntries(updatedEntries);

    // Update followups storage
    const storageKey = isFromRemaining
      ? STORAGE_KEY_REMAINING_PRODUCTION
      : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

    const storedProduction = localStorage.getItem(storageKey);
    const allProductionData = storedProduction
      ? JSON.parse(storedProduction)
      : {};
    allProductionData[entryId] = updatedEntries;
    localStorage.setItem(storageKey, JSON.stringify(allProductionData));

    // Recompute remaining labels
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

      const remainingLid = Math.max(lidQuantity - lidUsed, 0);
      const remainingTub = Math.max(tubQuantity - tubUsed, 0);
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
      const remaining = Math.max(totalQuantity - usedLabels, 0);
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
  const getProductStatus = () => {
    const STORAGE_KEY_ORDERS = STORAGE_KEY_IML;
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || "[]");
    const order = orders.find((o) => o.id === entry.orderId);
    const product = order?.products?.find((p) => p.id === entry.productId);
    return product?.orderStatus;
  };

  // ✅ FIXED: Remove problematic dependencies
// const handleTotalLabelsChange = useCallback((type) => (e) => {
//   const val = parseInt(e.target.value) || 0;
  
//   // Update state FIRST (immediate)
//   setTotalLabelsReceived(prev => { 
//     const newState = { ...prev, [type]: val };
    
//     // Auto-save INSIDE updater (stable)
//     const prodKey = `${entry?.orderId}_${entry?.productId}`;
//     const saved = JSON.parse(localStorage.getItem('iml_total_labels_received') || '{}');
//     saved[prodKey] = newState;
//     localStorage.setItem('iml_total_labels_received', JSON.stringify(saved));
    
//     return newState;
//   });

//   // Recalculate remaining using functional updates
//   if (isLidAndTub) {
//     if (type === 'lid') {
//       setRemainingLidLabels(prevRemaining => {
//         const lidUsed = productionEntries.reduce((sum, e) => 
//           (e.componentType === "LID" || e.componentType === "SINGLE") ? sum + toNumber(e.acceptedComponents) : sum, 0
//         );
//         return Math.max(val - lidUsed, 0);
//       });
//     } else if (type === 'tub') {
//       setRemainingTubLabels(prevRemaining => {
//         const tubUsed = productionEntries.reduce((sum, e) => 
//           e.componentType === "TUB" ? sum + toNumber(e.acceptedComponents) : sum, 0
//         );
//         return Math.max(val - tubUsed, 0);
//       });
//     }
//   } else {
//     setRemainingLidLabels(prevRemaining => {
//       const used = productionEntries.reduce((sum, e) => 
//         (e.componentType === "LID" || e.componentType === "SINGLE") ? sum + toNumber(e.acceptedComponents) : sum, 0
//       );
//       return Math.max(val - used, 0);
//     });
//   }
// }, [entry?.orderId, entry?.productId]); // ✅ ONLY stable deps


const handleTotalLabelsChange = useCallback((type) => (e) => {
  const val = parseInt(e.target.value) || 0;
  
  setTotalLabelsReceived(prev => { 
    const newState = { ...prev, [type]: val };
    const prodKey = `${entry?.orderId}_${entry?.productId}`;
    const saved = JSON.parse(localStorage.getItem('iml_total_labels_received') || '{}');
    saved[prodKey] = newState;
    localStorage.setItem('iml_total_labels_received', JSON.stringify(saved));
    return newState;
  });

  if (isLidAndTub) {
    if (type === 'lid') {
      setRemainingLidLabels(() => {
        const effectiveVal = val === 0 ? formatNumber(lidProductionQty) : val; // ← fallback
        const lidUsed = productionEntries.reduce((sum, e) => 
          (e.componentType === "LID" || e.componentType === "SINGLE") ? sum + toNumber(e.acceptedComponents) : sum, 0
        );
        return Math.max(effectiveVal - lidUsed, 0);
      });
    } else if (type === 'tub') {
      setRemainingTubLabels(() => {
        const effectiveVal = val === 0 ? formatNumber(tubProductionQty) : val; // ← fallback
        const tubUsed = productionEntries.reduce((sum, e) => 
          e.componentType === "TUB" ? sum + toNumber(e.acceptedComponents) : sum, 0
        );
        return Math.max(effectiveVal - tubUsed, 0);
      });
    }
  } else {
    setRemainingLidLabels(() => {
      const effectiveVal = val === 0 ? formatNumber(totalProductionQty) : val; // ← fallback
      const used = productionEntries.reduce((sum, e) => 
        (e.componentType === "LID" || e.componentType === "SINGLE") ? sum + toNumber(e.acceptedComponents) : sum, 0
      );
      return Math.max(effectiveVal - used, 0);
    });
  }
}, [entry?.orderId, entry?.productId, isLidAndTub, lidProductionQty, tubProductionQty, totalProductionQty, productionEntries]);


const checkAndUpdateOrderStatus = useCallback(() => {
  if (!entry?.orderId || !entry?.productId) return;
  
  const lidRemaining = remainingLidLabels;
  const tubRemaining = remainingTubLabels || 0;
  
  // For LID&TUB: Both must be 0
  // For SINGLE: lidRemaining must be 0
  const allRemainingZero = isLidAndTub 
    ? (lidRemaining === 0 && tubRemaining === 0)
    : (lidRemaining === 0);

  if (allRemainingZero) {
    // ✅ UPDATE ORDER STATUS TO "Dispatch Pending"
    const STORAGE_KEY_ORDERS = 'imlorders';
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
    
    const updatedOrders = orders.map(order => {
      if (order.id === entry.orderId) {
        return {
          ...order,
          products: order.products.map(product => {
            if (product.id === entry.productId) {
              return {
                ...product,
                orderStatus: 'Dispatch Pending'
              };
            }
            return product;
          })
        };
      }
      return order;
    });
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders));
    
    console.log(`✅ Product ${entry.productId} updated to "Dispatch Pending" - All labels completed!`);
    
    // Refresh parent window if exists
    if (window.opener && window.opener.location.href.includes('orders')) {
      window.opener.location.reload();
    }
  }
}, [entry?.orderId, entry?.productId, remainingLidLabels, remainingTubLabels, isLidAndTub]);



  const productStatus = getProductStatus();
  const isInProduction = productStatus === "In Production";

  console.log(`Entry: ${JSON.stringify(entry, null, 2)}`);

  console.log(`Is in production: ${isInProduction}`);

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
            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2 relative">
              <span className="text-[1.3vw]">📋</span> Customer Details
              {/* 🚀 SINGLE ADD PERSON BUTTON - TOP RIGHT */}
              <div className="flex justify-end absolute right-0 gap-[1vw]">
                <button
                  onClick={() => {
                    setPersonType("received"); // Show all categories
                    setNewPerson("");
                    setShowPersonManager(true);
                  }}
                  className="flex items-center gap-[0.5vw] px-[.85vw] py-[0.35vw] bg-amber-500 text-white rounded-[0.6vw] font-semibold text-[0.9vw] transition-all cursor-pointer"
                >
                  <span className="text-[1.1vw]">+</span>
                  Add Person
                </button>

                <button
                  className={` px-[.85vw] py-[.35vw] text-[.85vw] rounded-[0.6vw]  transition-all ${
                    isInProduction
                      ? "bg-green-600 text-white" // ✅ DISABLED STYLE
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } ${isInProduction ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (isInProduction) return null;
                    // ✅ UPDATE PRODUCT STATUS TO "In Production"
                    const STORAGE_KEY_ORDERS = "imlorders";
                    const orderData = JSON.parse(
                      localStorage.getItem(STORAGE_KEY_ORDERS) || "[]",
                    );

                    const updatedOrders = orderData.map((order) =>
                      order.id === entry.orderId
                        ? {
                            ...order,
                            products: order.products.map((product) =>
                              product.id === entry.productId
                                ? { ...product, orderStatus: "In Production" }
                                : product,
                            ),
                          }
                        : order,
                    );

                    // ✅ SAVE TO LOCALSTORAGE
                    localStorage.setItem(
                      STORAGE_KEY_ORDERS,
                      JSON.stringify(updatedOrders),
                    );

                    // ✅ REFRESH PARENT WINDOW (OrdersManagement)
                    if (
                      window.opener &&
                      window.opener.location.href.includes("orders")
                    ) {
                      window.opener.location.reload();
                    } else {
                      window.opener?.dispatchEvent?.(
                        new CustomEvent("ordersUpdated"),
                      );
                    }

                    alert("✅ Product marked as In Production!");
                    navigate("/iml/production", {
                      state: { refreshData: true },
                    });
                  }}
                >
                  {isInProduction
                    ? "Marked as In Production"
                    : "Mark as In Production"}
                </button>
              </div>
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
                // LID & TUB - 4 inputs in 2 rows
                <>
                <div className="grid grid-cols-2 gap-[.85vw]">
                  {/* Row 1: LID */}
                  <div>
                    <label className="block text-[.745vw] font-medium text-gray-700 mb-[0.3vw]">
                      LID Production Qty
                    </label>
                    <input
                      type="text"
                      value={formatNumber(lidProductionQty)}
                      disabled
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[.745vw] font-semibold text-blue-700 mb-[0.3vw] flex items-center gap-1">
                      Total LID Labels Received                      
                    </label>
                    <input
                      type="text"
                      value={totalLabelsReceived.lid === 0 ? formatNumber(lidProductionQty) : totalLabelsReceived.lid}
                      onChange={handleTotalLabelsChange("lid")}
                      min="0"
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-50 border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-blue-800"
                      placeholder="Enter total LID received"
                    />
                  </div>

                </div>
                <div className="grid grid-cols-2 gap-[.85vw]">
                  {/* Row 2: TUB */}
                  <div>
                    <label className="block text-[.745vw] font-medium text-gray-700 mb-[0.3vw]">
                      TUB Production Qty
                    </label>
                    <input
                      type="text"
                      value={formatNumber(tubProductionQty)}
                      disabled
                      className="w-full text-[.745vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-bold text-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[.745vw] font-semibold text-purple-700 mb-[0.3vw] flex items-center gap-1">
                      Total TUB Labels Received
                      
                    </label>
                    <input
                      type="text"
                      value={totalLabelsReceived.tub === 0 ? formatNumber(tubProductionQty) : totalLabelsReceived.tub}
                      onChange={handleTotalLabelsChange("tub")}
                      min="0"
                      className="w-full text-[.745vw] px-[0.75vw] py-[0.4vw] bg-purple-50 border-2 border-purple-300 rounded-[0.4vw] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-purple-800"
                      placeholder="Enter total TUB received"
                    />
                  </div>
                  </div>
                </>
              ) : (
                // SINGLE TYPE - 2 inputs
                <div className="grid grid-cols-2 gap-[.85vw]">
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                      Production Qty {entry?.imlType}
                    </label>
                    <input
                      type="text"
                      value={formatNumber(totalProductionQty)}
                      disabled
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-semibold text-blue-700 mb-[0.3vw] flex items-center gap-1">
                      Total Labels Received{" "}
                      <span className="text-blue-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(totalLabelsReceived.single === 0 ? formatNumber(totalProductionQty) : totalLabelsReceived.single)}
                      onChange={handleTotalLabelsChange("single")}
                      min="0"
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-50 border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-blue-800"
                      placeholder="Enter total received"
                    />
                  </div>
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
                    {receivedByOptions.map((person) => (
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
                    {receivedByOptions.map((person) => (
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
                    {receivedByOptions.map((person) => (
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
                    LID Entry
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
                        Accepted LID Component <span className="text-red-500">*</span>
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
                        Rejected LID Component<span className="text-red-500">*</span>
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
                        LID Label Wastage
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
                        {packingInchargeOptions.map((person) => (
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
                        {approvedByOptions.map((person) => (
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
                         Add LID Entry
                      </button>
                    </div>
                  </div>
                </div>

                {/* TUB Entry Form */}
                <div className="p-[0.8vw] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.5vw] border-2 border-blue-200">
                  <h4 className="text-[1vw] font-semibold text-blue-800 mb-[0.8vw] flex items-center gap-2">
                    TUB Entry
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
                        Accepted TUB Component <span className="text-red-500">*</span>
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
                        Rejected TUB Component <span className="text-red-500">*</span>
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
                        TUB Label Wastage
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
                        {packingInchargeOptions.map((person) => (
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
                        {approvedByOptions.map((person) => (
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
                         Add TUB Entry
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
                    {packingInchargeOptions.map((person) => (
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
                    {approvedByOptions.map((person) => (
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
                     Add Entry
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

      {/* 🚀 ENHANCED PERSON MANAGER */}
      {showPersonManager && (
        <div className="fixed inset-0 bg-[#000000cc] z-[999] flex items-center justify-center p-[clamp(12px,2vw,24px)]">
          <div
            className="
        bg-white shadow-2xl overflow-y-auto
        w-[90vw] max-w-[clamp(420px,38vw,560px)]
        max-h-[85vh]
        rounded-[clamp(14px,1.2vw,22px)]
      "
          >
            {/* HEADER */}
            <div
              className="
          bg-gradient-to-r from-purple-600 to-pink-600 text-white
          p-[clamp(16px,1.5vw,24px)]
          rounded-t-[clamp(14px,1.2vw,22px)]
        "
            >
              <h3
                className="
            flex items-center gap-[clamp(8px,0.8vw,12px)]
            font-black
            text-[clamp(18px,1.6vw,24px)]
          "
              >
                Manage Persons
              </h3>
            </div>

            <div className="p-[clamp(16px,1.5vw,24px)] space-y-[clamp(16px,1.5vw,24px)]">
              {/* CATEGORY TABS */}
              <div className="grid grid-cols-3 gap-[clamp(6px,0.6vw,10px)] text-center">
                {[
                  {
                    key: "received",
                    label: "Received By",
                    active: "bg-green-500",
                  },
                  {
                    key: "packing",
                    label: "Packing",
                    active: "bg-orange-500",
                  },
                  {
                    key: "approved",
                    label: "Approved",
                    active: "bg-red-500",
                  },
                ].map(({ key, label, active }) => (
                  <button
                    key={key}
                    onClick={() => setPersonType(key)}
                    className={`
                px-[clamp(12px,1vw,18px)]
                py-[clamp(8px,0.8vw,14px)]
                rounded-[clamp(10px,1vw,16px)]
                font-semibold transition-all
                text-[clamp(13px,0.9vw,16px)]
                ${
                  personType === key
                    ? `${active} text-white shadow-lg`
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }
              `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* CURRENT LIST */}
              <div className="space-y-[clamp(8px,0.8vw,12px)]">
                <label className="block font-bold text-gray-800 capitalize text-[clamp(14px,1vw,18px)]">
                  Current {personType.replace("_", " ")} Persons:
                </label>

                <div
                  className="
              max-h-[20vh] overflow-y-auto bg-gray-50
              p-[clamp(10px,0.9vw,16px)]
              rounded-[clamp(10px,1vw,16px)]
              border border-gray-200
            "
                >
                  {(personType === "received"
                    ? receivedByOptions
                    : personType === "packing"
                      ? packingInchargeOptions
                      : approvedByOptions
                  ).map((person, idx) => (
                    <div
                      key={idx}
                      className="
                  flex items-center justify-between bg-white shadow-sm
                  p-[clamp(10px,0.8vw,14px)]
                  rounded-[clamp(10px,0.8vw,14px)]
                  mb-[clamp(6px,0.6vw,10px)]
                "
                    >
                      <span className="font-medium text-[clamp(14px,0.9vw,16px)]">
                        {person}
                      </span>
                      <button
                        onClick={() => {
                          const list =
                            personType === "received"
                              ? receivedByOptions
                              : personType === "packing"
                                ? packingInchargeOptions
                                : approvedByOptions;

                          const updated = list.filter((_, i) => i !== idx);

                          if (personType === "received") {
                            setReceivedByOptions(updated);
                            localStorage.setItem(
                              "iml_received_persons",
                              JSON.stringify(updated),
                            );
                          } else if (personType === "packing") {
                            setPackingInchargeOptions(updated);
                            localStorage.setItem(
                              "iml_packing_persons",
                              JSON.stringify(updated),
                            );
                          } else {
                            setApprovedByOptions(updated);
                            localStorage.setItem(
                              "iml_approved_persons",
                              JSON.stringify(updated),
                            );
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-bold text-[clamp(16px,1.2vw,20px)]"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD NEW */}
              <div>
                <label className="block font-bold text-gray-800 mb-[clamp(8px,0.8vw,12px)] text-[clamp(14px,1vw,18px)]">
                  Add New Person
                </label>
                <input
                  type="text"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  placeholder={`Enter ${personType.replace("_", " ")} name...`}
                  className="
              w-full border border-gray-300
              px-[clamp(12px,1vw,18px)]
              py-[clamp(10px,0.9vw,16px)]
              rounded-[clamp(10px,1vw,16px)]
              font-semibold
              text-[clamp(14px,0.9vw,16px)]
              focus:ring-2 focus:ring-purple-200 focus:border-purple-500
              transition-all
            "
                />
              </div>

              {/* ACTIONS */}
              <div className="flex gap-[clamp(10px,1vw,16px)] pt-[clamp(12px,1vw,20px)]">
                <button
                  onClick={() => {
                    if (!newPerson.trim()) return;

                    const list =
                      personType === "received"
                        ? receivedByOptions
                        : personType === "packing"
                          ? packingInchargeOptions
                          : approvedByOptions;

                    const updated = [...list, newPerson.trim()];

                    if (personType === "received") {
                      setReceivedByOptions(updated);
                      localStorage.setItem(
                        "iml_received_persons",
                        JSON.stringify(updated),
                      );
                    } else if (personType === "packing") {
                      setPackingInchargeOptions(updated);
                      localStorage.setItem(
                        "iml_packing_persons",
                        JSON.stringify(updated),
                      );
                    } else {
                      setApprovedByOptions(updated);
                      localStorage.setItem(
                        "iml_approved_persons",
                        JSON.stringify(updated),
                      );
                    }

                    setNewPerson("");
                  }}
                  className="
              flex-1 font-bold text-white shadow-md transition-all
              bg-purple-600 hover:bg-purple-700
              px-[clamp(14px,1.1vw,20px)]
              py-[clamp(8px,0.7vw,12px)]
              rounded-[clamp(10px,0.9vw,16px)]
              text-[clamp(13px,0.9vw,16px)]
              hover:shadow-lg
              cursor-pointer
            "
                >
                  Add Person
                </button>

                <button
                  onClick={() => {
                    setShowPersonManager(false);
                    setNewPerson("");
                  }}
                  className="
              bg-gray-500 hover:bg-gray-600
              text-white font-bold transition-all
              px-[clamp(14px,1.1vw,20px)]
              py-[clamp(8px,0.7vw,12px)]
              rounded-[clamp(10px,0.9vw,16px)]
              text-[clamp(13px,0.9vw,16px)]
              cursor-pointer
            "
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionDetails;