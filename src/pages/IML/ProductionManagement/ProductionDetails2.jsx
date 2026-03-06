// ProductionDetails.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";
const STORAGE_KEY_REMAINING_PRODUCTION = "iml_remaining_production_followups";
const STORAGE_KEY_IML = "imlorders";

const MACHINE_OPTIONS = ["01", "02", "03", "04", "05"];

const toNumber = (value) => {
  if (!value && value !== 0) return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
};

const formatNumber = (value) => {
  const num = toNumber(value);
  return num.toLocaleString("en-IN");
};

const ProductionDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { entry } = location.state || {};

  const activeComponentType = entry?.activeComponentType || null;

  const isLidAndTub = entry?.imlType === "LID & TUB";
  const showLid = isLidAndTub
    ? activeComponentType === "LID"
    : entry?.imlType === "LID";
  const showTub = isLidAndTub
    ? activeComponentType === "TUB"
    : entry?.imlType === "TUB";
  const showSingle = !isLidAndTub && entry?.imlType !== "LID" && entry?.imlType !== "TUB";

  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    product: "",
    size: "",
    containerColor: "",
    lidColor: "",
    tubColor: "",
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

  const [productionEntries, setProductionEntries] = useState([]);
  const [remainingLidLabels, setRemainingLidLabels] = useState(0);
  const [remainingTubLabels, setRemainingTubLabels] = useState(0);
  const [lidMachineDropdownOpen, setLidMachineDropdownOpen] = useState(false);
  const [tubMachineDropdownOpen, setTubMachineDropdownOpen] = useState(false);
  const [filteredMachines, setFilteredMachines] = useState(MACHINE_OPTIONS);
  const lidMachineInputRef = useRef(null);
  const tubMachineInputRef = useRef(null);

  const [isFromRemaining, setIsFromRemaining] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [lidQuantity, setLidQuantity] = useState(0);
  const [tubQuantity, setTubQuantity] = useState(0);

  const [receivedByOptions, setReceivedByOptions] = useState(["Murali", "Praveen", "Kumar", "Ravi"]);
  const [packingInchargeOptions, setPackingInchargeOptions] = useState(["Murugan", "Praveen", "Ravi", "Kumar"]);
  const [approvedByOptions, setApprovedByOptions] = useState(["Murugan", "Praveen", "Ravi", "Kumar"]);

  const [lidProductionQty, setLidProductionQty] = useState(0);
  const [tubProductionQty, setTubProductionQty] = useState(0);
  const [totalProductionQty, setTotalProductionQty] = useState(0);

  const [orderQtyDisplay, setOrderQtyDisplay] = useState({ lidOrderQty: 0, tubOrderQty: 0, lidProdQty: 0, tubProdQty: 0, singleOrderQty: 0, singleProdQty: 0 });

  const [showPersonManager, setShowPersonManager] = useState(false);
  const [newPerson, setNewPerson] = useState("");
  const [personType, setPersonType] = useState("received");

  const [totalLabelsReceived, setTotalLabelsReceived] = useState({ lid: 0, tub: 0, single: 0 });

  const [isLidProductionCompleted, setIsLidProductionCompleted] = useState(false);
  const [isTubProductionCompleted, setIsTubProductionCompleted] = useState(false);
  const [isProductionCompleted, setIsProductionCompleted] = useState(false);

  const [markLidComplete, setMarkLidComplete] = useState(false);
  const [markTubComplete, setMarkTubComplete] = useState(false);
  const [markSingleComplete, setMarkSingleComplete] = useState(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
  const [pendingCompleteTarget, setPendingCompleteTarget] = useState(null);

  const isCurrentComponentCompleted = () => {
    if (isLidAndTub) {
      if (activeComponentType === "LID") return isLidProductionCompleted;
      if (activeComponentType === "TUB") return isTubProductionCompleted;
      return isLidProductionCompleted && isTubProductionCompleted;
    }
    return isProductionCompleted;
  };

  const canAddEntry = (componentType) => {
    if (isLidAndTub) {
      if (componentType === "LID") return !isLidProductionCompleted;
      if (componentType === "TUB") return !isTubProductionCompleted;
    }
    return !isProductionCompleted;
  };

  const getTotalLabels = (orderId, productId, entryData) => {
    if (entryData && entryData.calculatedTotal !== undefined) {
      return {
        totalQuantity: entryData.calculatedTotal || 0,
        lidQuantity: entryData.calculatedLidTotal || 0,
        tubQuantity: entryData.calculatedTubTotal || 0,
        isFromRemaining: entryData.isFromRemaining || false,
      };
    }

    const labelData = JSON.parse(localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}");
    const exactKey = `${orderId}_${productId}`;
    const item = labelData[exactKey];

    if (!item) return { totalQuantity: 0, lidQuantity: 0, tubQuantity: 0, isFromRemaining: false };

    let totalQuantity = 0;
    let lidQuantity = 0;
    let tubQuantity = 0;
    let isFromRemainingFlag = false;

    const allocationData = JSON.parse(localStorage.getItem("iml_production_allocation") || "{}");
    const allocations = allocationData[exactKey] || [];
    const allocatedQty = allocations.reduce((sum, alloc) => sum + (alloc.allocatedQty || 0), 0);

    if (allocatedQty > 0) {
      isFromRemainingFlag = true;
      totalQuantity = allocatedQty;
      if (item.imlType === "LID & TUB") {
        lidQuantity = Math.floor(allocatedQty / 2);
        tubQuantity = allocatedQty - lidQuantity;
      } else if (item.imlType === "LID") {
        lidQuantity = allocatedQty;
      } else if (item.imlType === "TUB") {
        tubQuantity = allocatedQty;
      } else {
        lidQuantity = allocatedQty;
      }
    } else {
      if (item.history && Array.isArray(item.history)) {
        item.history.forEach((h) => {
          if (h.imlType === "LID & TUB") {
            const lq = Number(h.lidReceivedQuantity || 0);
            const tq = Number(h.tubReceivedQuantity || 0);
            lidQuantity += lq; tubQuantity += tq; totalQuantity += lq + tq;
          } else {
            const qty = Number(h.receivedQuantity || h.lidReceivedQuantity || h.tubReceivedQuantity || 0);
            if (qty > 0) { lidQuantity += qty; tubQuantity += qty; totalQuantity += qty; }
          }
        });
      }
    }

    return { totalQuantity, lidQuantity, tubQuantity, isFromRemaining: isFromRemainingFlag };
  };

  const loadOrderQtyDisplay = (orderId, productId) => {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_IML) || "[]");
      const order = orders.find((o) => o.id === orderId);
      const product = order?.products?.find((p) => p.id === productId);
      if (!product) return;

      setOrderQtyDisplay({
        lidOrderQty: toNumber(product.lidLabelQty || 0),
        tubOrderQty: toNumber(product.tubLabelQty || 0),
        lidProdQty: toNumber(product.lidProductionQty || 0),
        tubProdQty: toNumber(product.tubProductionQty || 0),
        singleOrderQty: toNumber(product.lidLabelQty || product.tubLabelQty || 0),
        singleProdQty: toNumber(product.lidProductionQty || product.tubProductionQty || 0),
      });
    } catch (e) {
      console.error("Error loading order qty display", e);
    }
  };

  // ── UPDATED: recomputeRemaining now uses the passed labels as the base ──
  // When entries is empty, remaining = base labels (not 0)
  const recomputeRemaining = useCallback((entries, savedTotalLabels) => {
    const lidUsed = entries.reduce((sum, e) => {
      if (e.componentType === "LID" || e.componentType === "SINGLE") return sum + toNumber(e.acceptedComponents);
      return sum;
    }, 0);
    const tubUsed = entries.reduce((sum, e) => {
      if (e.componentType === "TUB") return sum + toNumber(e.acceptedComponents);
      return sum;
    }, 0);

    if (isLidAndTub) {
      const baseLid = toNumber(savedTotalLabels.lid);
      const baseTub = toNumber(savedTotalLabels.tub);
      return {
        lid: Math.max(baseLid - lidUsed, 0),
        tub: Math.max(baseTub - tubUsed, 0),
      };
    } else {
      const baseSingle = toNumber(savedTotalLabels.single);
      return { lid: Math.max(baseSingle - lidUsed, 0), tub: 0 };
    }
  }, [isLidAndTub]);

  // ── UPDATED: Helper to apply remaining to all state at once ──
  const applyRemaining = useCallback((remaining) => {
    setRemainingLidLabels(remaining.lid);
    setRemainingTubLabels(remaining.tub);
    setCustomerForm((prev) => ({
      ...prev,
      lidRemaining: remaining.lid,
      tubRemaining: remaining.tub,
    }));
  }, []);

  // Load data from localStorage and prefill
  useEffect(() => {
    if (entry) {
      const hasPreCalculated = entry.calculatedTotal !== undefined;
      let labelTotals;
      if (hasPreCalculated) {
        labelTotals = {
          totalQuantity: entry.calculatedTotal || 0,
          lidQuantity: entry.calculatedLidTotal || 0,
          tubQuantity: entry.calculatedTubTotal || 0,
          isFromRemaining: entry.isFromRemaining || false,
        };
      } else {
        labelTotals = getTotalLabels(entry.orderId, entry.productId, entry);
      }

      const isRemainingAllocation = entry.sourceType === "remaining";
      const storageKey = isRemainingAllocation ? STORAGE_KEY_REMAINING_PRODUCTION : STORAGE_KEY_PRODUCTION_FOLLOWUPS;
      const storedProduction = localStorage.getItem(storageKey);
      const allProductionData = storedProduction ? JSON.parse(storedProduction) : {};
      const entriesHistory = allProductionData[entry.id] || [];

      setProductionEntries(entriesHistory);
      setIsFromRemaining(isRemainingAllocation);
      setTotalQuantity(labelTotals.totalQuantity);
      setLidQuantity(labelTotals.lidQuantity);
      setTubQuantity(labelTotals.tubQuantity);

      const prodKey = `${entry.orderId}_${entry.productId}`;
      const savedOverrides = JSON.parse(localStorage.getItem("iml_total_labels_received") || "{}");
      const savedOverride = savedOverrides[prodKey] || {};

      const fallbackLid = (entry.calculatedLidTotal > 0 ? entry.calculatedLidTotal : labelTotals.lidQuantity) || 0;
      const fallbackTub = (entry.calculatedTubTotal > 0 ? entry.calculatedTubTotal : labelTotals.tubQuantity) || 0;
      const fallbackSingle = (() => {
        if (entry.calculatedTotal > 0) return entry.calculatedTotal;
        if (entry.imlType === "TUB") return labelTotals.tubQuantity || 0;
        return labelTotals.lidQuantity || labelTotals.totalQuantity || 0;
      })();
      const effectiveLid = (savedOverride.lid > 0 ? savedOverride.lid : fallbackLid);
      const effectiveTub = (savedOverride.tub > 0 ? savedOverride.tub : fallbackTub);
      const effectiveSingle = (savedOverride.single > 0 ? savedOverride.single : fallbackSingle);

      const resolvedTotalLabels = {
        lid: effectiveLid,
        tub: effectiveTub,
        single: effectiveSingle,
      };
      setTotalLabelsReceived(resolvedTotalLabels);

      // ── UPDATED: Compute remaining using resolved labels ──
      // This ensures that when no entries exist, remaining = total labels received
      const lidUsed = entriesHistory.reduce((sum, e) => {
        if (e.componentType === "LID" || e.componentType === "SINGLE") return sum + toNumber(e.acceptedComponents);
        return sum;
      }, 0);
      const tubUsed = entriesHistory.reduce((sum, e) => {
        if (e.componentType === "TUB") return sum + toNumber(e.acceptedComponents);
        return sum;
      }, 0);

      let computedLidRemaining, computedTubRemaining;

      if (isLidAndTub) {
        computedLidRemaining = Math.max(toNumber(effectiveLid) - lidUsed, 0);
        computedTubRemaining = Math.max(toNumber(effectiveTub) - tubUsed, 0);
        setRemainingLidLabels(computedLidRemaining);
        setRemainingTubLabels(computedTubRemaining);
        setLidProductionQty(labelTotals.lidQuantity);
        setTubProductionQty(labelTotals.tubQuantity);
      } else {
        computedLidRemaining = Math.max(toNumber(effectiveSingle) - lidUsed, 0);
        computedTubRemaining = Math.max(toNumber(effectiveSingle) - lidUsed, 0);
        setRemainingLidLabels(computedLidRemaining);
        setRemainingTubLabels(computedTubRemaining);
        setTotalProductionQty(labelTotals.totalQuantity);
      }

      const parsedLidColor = entry.lidColor || (() => {
        const match = (entry.containerColor || "").match(/Lid:\s*([^,]+)/i);
        return match ? match[1].trim() : "";
      })();
      const parsedTubColor = entry.tubColor || (() => {
        const match = (entry.containerColor || "").match(/Tub:\s*([^,]+)/i);
        return match ? match[1].trim() : "";
      })();

      setCustomerForm({
        customerName: entry.company || "",
        size: entry.size || "",
        product: entry.product || "",
        containerColor: entry.containerColor || "",
        lidColor: parsedLidColor,
        tubColor: parsedTubColor,
        imlName: entry.imlName || "",
        lidMachineNumber: entry.lidMachineNumber || entry.machineNumber || "",
        tubMachineNumber: entry.tubMachineNumber || entry.machineNumber || "",
        lidReceivedBy: entry.lidReceivedBy || entry.receivedBy || "",
        tubReceivedBy: entry.tubReceivedBy || entry.receivedBy || "",
        lidTotalLabels: isLidAndTub ? fallbackLid : fallbackSingle,
        tubTotalLabels: isLidAndTub ? fallbackTub : 0,
        lidRemaining: computedLidRemaining,
        tubRemaining: computedTubRemaining,
      });

      loadOrderQtyDisplay(entry.orderId, entry.productId);

      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_IML) || "[]");
      const order = orders.find((o) => o.id === entry.orderId);
      const product = order?.products?.find((p) => p.id === entry.productId);

      if (isLidAndTub) {
        const lidStatus = product?.lidOrderStatus || "";
        const tubStatus = product?.tubOrderStatus || "";
        setIsLidProductionCompleted(lidStatus === "Production Completed" || lidStatus === "Dispatch Pending");
        setIsTubProductionCompleted(tubStatus === "Production Completed" || tubStatus === "Dispatch Pending");
      } else {
        const status = product?.orderStatus || "";
        setIsProductionCompleted(status === "Production Completed" || status === "Dispatch Pending");
      }
    }
  }, [entry]);

  useEffect(() => {
    const loadPersons = () => {
      setReceivedByOptions(JSON.parse(localStorage.getItem("iml_received_persons") ?? JSON.stringify(["Murali", "Praveen", "Kumar", "Ravi"])));
      setPackingInchargeOptions(JSON.parse(localStorage.getItem("iml_packing_persons") ?? JSON.stringify(["Murugan", "Praveen", "Ravi", "Kumar"])));
      setApprovedByOptions(JSON.parse(localStorage.getItem("iml_approved_persons") ?? JSON.stringify(["Murugan", "Praveen", "Ravi", "Kumar"])));
    };
    loadPersons();
  }, []);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLidEntryChange = (e) => {
    const { name, value } = e.target;
    setLidEntryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTubEntryChange = (e) => {
    const { name, value } = e.target;
    setTubEntryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLidShiftChange = (shift) => setLidEntryForm((prev) => ({ ...prev, shift }));
  const handleTubShiftChange = (shift) => setTubEntryForm((prev) => ({ ...prev, shift }));

  const handleLidMachineInputChange = (e) => {
    const value = e.target.value;
    setCustomerForm((prev) => ({ ...prev, lidMachineNumber: value }));
    setFilteredMachines(MACHINE_OPTIONS.filter((m) => m.toLowerCase().includes(value.toLowerCase())));
    setLidMachineDropdownOpen(true);
  };

  const handleTubMachineInputChange = (e) => {
    const value = e.target.value;
    setCustomerForm((prev) => ({ ...prev, tubMachineNumber: value }));
    setFilteredMachines(MACHINE_OPTIONS.filter((m) => m.toLowerCase().includes(value.toLowerCase())));
    setTubMachineDropdownOpen(true);
  };

  const handleLidMachineSelect = (machine) => {
    setCustomerForm((prev) => ({ ...prev, lidMachineNumber: machine }));
    setLidMachineDropdownOpen(false);
    setFilteredMachines(MACHINE_OPTIONS);
  };

  const handleTubMachineSelect = (machine) => {
    setCustomerForm((prev) => ({ ...prev, tubMachineNumber: machine }));
    setTubMachineDropdownOpen(false);
    setFilteredMachines(MACHINE_OPTIONS);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (lidMachineInputRef.current && !lidMachineInputRef.current.contains(event.target)) setLidMachineDropdownOpen(false);
      if (tubMachineInputRef.current && !tubMachineInputRef.current.contains(event.target)) setTubMachineDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getComponentStatus = (componentType) => {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY_IML) || "[]");
    const order = orders.find((o) => o.id === entry?.orderId);
    const product = order?.products?.find((p) => p.id === entry?.productId);
    if (!product) return null;
    if (isLidAndTub) {
      const field = componentType === "LID" ? "lidOrderStatus" : "tubOrderStatus";
      return product[field] || null;
    }
    return product.orderStatus || null;
  };

  const isLidInProduction = isLidAndTub ? (getComponentStatus("LID") === "In Production") : false;
  const isTubInProduction = isLidAndTub ? (getComponentStatus("TUB") === "In Production") : false;
  const isSingleInProduction = !isLidAndTub ? (getComponentStatus(null) === "In Production") : false;

  const checkCanAddEntry = (componentType) => {
    if (isLidAndTub) {
      const inProd = componentType === "LID" ? isLidInProduction : isTubInProduction;
      const completed = componentType === "LID" ? isLidProductionCompleted : isTubProductionCompleted;
      if (completed) {
        alert(`⛔ ${componentType} Production is already marked as complete. No more entries can be added.`);
        return false;
      }
      if (!inProd) {
        alert(`⚠️ Please mark ${componentType} as "In Production" first before adding entries.`);
        return false;
      }
      return true;
    }
    if (isProductionCompleted) {
      alert("⛔ Production is already marked as complete. No more entries can be added.");
      return false;
    }
    if (!isSingleInProduction) {
      alert('⚠️ Please click "Mark as In Production" first before adding entries.');
      return false;
    }
    return true;
  };

  const saveEntries = (updatedEntries) => {
    const storageKey = isFromRemaining ? STORAGE_KEY_REMAINING_PRODUCTION : STORAGE_KEY_PRODUCTION_FOLLOWUPS;
    const storedProduction = localStorage.getItem(storageKey);
    const allProductionData = storedProduction ? JSON.parse(storedProduction) : {};
    allProductionData[entry.id] = updatedEntries;
    localStorage.setItem(storageKey, JSON.stringify(allProductionData));
  };

  const addLidProductionEntry = () => {
    if (!checkCanAddEntry("LID")) return;

    // if (!lidEntryForm.acceptedComponents || !lidEntryForm.rejectedComponents || !lidEntryForm.packingIncharge || !lidEntryForm.approvedBy || !customerForm.lidMachineNumber || !customerForm.lidReceivedBy) {
    //   alert("Please fill all required fields for LID (including Machine Number and Received By)");
    //   return;
    // }
    let missingFields = [];

    if (!customerForm.lidMachineNumber) missingFields.push("Machine No");
    if (!customerForm.lidReceivedBy) missingFields.push("Received By");
    if (!lidEntryForm.acceptedComponents) missingFields.push("Accepted Component");
    if (!lidEntryForm.rejectedComponents) missingFields.push("Rejected Component");
    if (!lidEntryForm.labelWastage) missingFields.push("Label Wastage");
    if (!lidEntryForm.packingIncharge) missingFields.push("Packing Incharge");
    if (!lidEntryForm.approvedBy) missingFields.push("Approved By");

    if (missingFields.length > 0) {
      alert("Please fill the following required fields for LID:\n\n" + missingFields.join("\n"));
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
    saveEntries(updatedEntries);

    const remaining = recomputeRemaining(updatedEntries, totalLabelsReceived);
    applyRemaining(remaining);

    setLidEntryForm({ date: new Date().toISOString().split("T")[0], shift: "Day", packingIncharge: "", acceptedComponents: "", rejectedComponents: "", labelWastage: "0", approvedBy: "", componentType: "LID" });
  };

  const addTubProductionEntry = () => {
    if (!checkCanAddEntry("TUB")) return;

    // if (!tubEntryForm.acceptedComponents || !tubEntryForm.rejectedComponents || !tubEntryForm.packingIncharge || !tubEntryForm.approvedBy || !customerForm.tubMachineNumber || !customerForm.tubReceivedBy) {
    //   alert("Please fill all required fields for TUB (including Machine Number and Received By)");
    //   return;
    // }

    let missingTubFields = [];

    if (!customerForm.tubMachineNumber) missingTubFields.push("Machine No");
    if (!customerForm.tubReceivedBy) missingTubFields.push("Received By");
    if (!tubEntryForm.acceptedComponents) missingTubFields.push("Accepted Component");
    if (!tubEntryForm.rejectedComponents) missingTubFields.push("Rejected Component");
    if (!tubEntryForm.packingIncharge) missingTubFields.push("Packing Incharge");
    if (!tubEntryForm.approvedBy) missingTubFields.push("Approved By");

    if (missingTubFields.length > 0) {
      alert("Please fill the following required fields for TUB:\n\n" + missingTubFields.join("\n"));
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
    saveEntries(updatedEntries);

    const remaining = recomputeRemaining(updatedEntries, totalLabelsReceived);
    applyRemaining(remaining);

    setTubEntryForm({ date: new Date().toISOString().split("T")[0], shift: "Day", packingIncharge: "", acceptedComponents: "", rejectedComponents: "", labelWastage: "0", approvedBy: "", componentType: "TUB" });
  };

  const addProductionEntry = () => {
    if (!checkCanAddEntry(null)) return;

    if (!lidEntryForm.acceptedComponents || !lidEntryForm.rejectedComponents || !lidEntryForm.packingIncharge || !lidEntryForm.approvedBy || !customerForm.lidMachineNumber || !customerForm.lidReceivedBy) {
      alert("Please fill all required fields (including Machine Number and Received By)");
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
    saveEntries(updatedEntries);

    const remaining = recomputeRemaining(updatedEntries, totalLabelsReceived);
    applyRemaining(remaining);

    setLidEntryForm({ date: new Date().toISOString().split("T")[0], shift: "Day", packingIncharge: "", acceptedComponents: "", rejectedComponents: "", labelWastage: "0", approvedBy: "", componentType: "SINGLE" });
  };

  const handleBack = () => navigate("/iml/production", { state: { refreshData: true } });

  const computeCombinedOrderStatus = (lidStatus, tubStatus, product) => {
    const lidDone = lidStatus === "Production Completed";
    const tubDone = tubStatus === "Production Completed";
    if (lidDone && tubDone) return "Production Completed";

    const lidInProd = lidStatus === "In Production";
    const tubInProd = tubStatus === "In Production";
    if (lidInProd || tubInProd || lidDone || tubDone) return "In Production";

    const labelData = JSON.parse(localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}");
    const key = `${entry?.orderId}_${product?.id || entry?.productId}`;
    const hasLabels = labelData[key] != null;

    if (!hasLabels) return "PO Raised & Awaiting for Labels";
    return "Production Pending";
  };

  const handleMarkInProduction = (componentType) => {
    const orderData = JSON.parse(localStorage.getItem(STORAGE_KEY_IML) || "[]");
    const updatedOrders = orderData.map((order) => {
      if (order.id !== entry.orderId) return order;
      return {
        ...order,
        products: order.products.map((product) => {
          if (product.id !== entry.productId) return product;
          if (isLidAndTub) {
            const field = componentType === "LID" ? "lidOrderStatus" : "tubOrderStatus";
            const newProduct = { ...product, [field]: "In Production" };
            const newLidStatus = componentType === "LID" ? "In Production" : (product.lidOrderStatus || "");
            const newTubStatus = componentType === "TUB" ? "In Production" : (product.tubOrderStatus || "");
            newProduct.orderStatus = computeCombinedOrderStatus(newLidStatus, newTubStatus, product);
            return newProduct;
          }
          return { ...product, orderStatus: "In Production" };
        }),
      };
    });
    localStorage.setItem(STORAGE_KEY_IML, JSON.stringify(updatedOrders));
    if (window.opener && window.opener.location.href.includes("orders")) window.opener.location.reload();
    else window.opener?.dispatchEvent?.(new CustomEvent("ordersUpdated"));
    alert(`✅ ${componentType || "Product"} marked as In Production!`);
    window.location.reload();
  };

  const handleSubmit = () => {
    if (productionEntries.length === 0) {
      alert("Please add at least one production entry before submitting");
      return;
    }

    const wantLidComplete = isLidAndTub ? markLidComplete : false;
    const wantTubComplete = isLidAndTub ? markTubComplete : false;
    const wantSingleComplete = !isLidAndTub && markSingleComplete;

    if ((wantLidComplete && activeComponentType === "LID") ||
      (wantTubComplete && activeComponentType === "TUB") ||
      wantSingleComplete) {
      const target = isLidAndTub ? activeComponentType : "SINGLE";
      setPendingCompleteTarget(target);
      setShowCompleteConfirmModal(true);
      return;
    }

    performSave(null);
  };

  const performSave = (completeTarget) => {
    const submittedEntries = productionEntries.map((e) => ({ ...e, submitted: true }));
    setProductionEntries(submittedEntries);
    saveEntries(submittedEntries);

    if (completeTarget) {
      const orderData = JSON.parse(localStorage.getItem(STORAGE_KEY_IML) || "[]");
      const updatedOrders = orderData.map((order) => {
        if (order.id !== entry.orderId) return order;
        return {
          ...order,
          products: order.products.map((product) => {
            if (product.id !== entry.productId) return product;
            if (isLidAndTub) {
              const field = completeTarget === "LID" ? "lidOrderStatus" : "tubOrderStatus";
              const newProduct = { ...product, [field]: "Production Completed" };
              const newLidStatus = completeTarget === "LID" ? "Production Completed" : (product.lidOrderStatus || "");
              const newTubStatus = completeTarget === "TUB" ? "Production Completed" : (product.tubOrderStatus || "");
              newProduct.orderStatus = computeCombinedOrderStatus(newLidStatus, newTubStatus, newProduct);
              return newProduct;
            }
            return { ...product, orderStatus: "Production Completed" };
          }),
        };
      });
      localStorage.setItem(STORAGE_KEY_IML, JSON.stringify(updatedOrders));

      if (window.opener && window.opener.location.href.includes("orders")) window.opener.location.reload();
      else window.opener?.dispatchEvent?.(new CustomEvent("ordersUpdated"));

      if (isLidAndTub) {
        if (completeTarget === "LID") setIsLidProductionCompleted(true);
        else setIsTubProductionCompleted(true);
      } else {
        setIsProductionCompleted(true);
      }
      alert(`✅ ${completeTarget === "SINGLE" ? "Production" : completeTarget + " Production"} marked as complete!`);
    } else {
      alert("✅ Production details submitted successfully!");
    }

    handleBack();
  };

  const handleDeleteEntry = (indexToRemove) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    const updatedEntries = productionEntries.filter((_, idx) => idx !== indexToRemove);
    setProductionEntries(updatedEntries);
    saveEntries(updatedEntries);

    const remaining = recomputeRemaining(updatedEntries, totalLabelsReceived);
    applyRemaining(remaining);
  };

  // ── UPDATED: handleTotalLabelsChange - recomputes remaining immediately ──
  const handleTotalLabelsChange = useCallback((type) => (e) => {
    const val = parseInt(e.target.value) || 0;
    setTotalLabelsReceived((prev) => {
      const newState = { ...prev, [type]: val };

      // Persist user override
      const prodKey = `${entry?.orderId}_${entry?.productId}`;
      const saved = JSON.parse(localStorage.getItem("iml_total_labels_received") || "{}");
      saved[prodKey] = newState;
      localStorage.setItem("iml_total_labels_received", JSON.stringify(saved));

      // Recompute remaining with updated totalLabelsReceived
      const remaining = recomputeRemaining(productionEntries, newState);
      setRemainingLidLabels(remaining.lid);
      setRemainingTubLabels(remaining.tub);
      setCustomerForm((prevForm) => ({
        ...prevForm,
        lidRemaining: remaining.lid,
        tubRemaining: remaining.tub,
      }));

      return newState;
    });
  }, [entry?.orderId, entry?.productId, productionEntries, recomputeRemaining]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Access</h2>
          <p className="text-gray-600 mb-4">No entry information provided</p>
          <button onClick={handleBack} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700">Back to Production Management</button>
        </div>
      </div>
    );
  }

  const componentLabel = activeComponentType ? ` — ${activeComponentType}` : (isLidAndTub ? " (LID & TUB)" : "");

  const visibleEntries = productionEntries.filter((e) => {
    if (!activeComponentType) return true;
    if (activeComponentType === "LID") return e.componentType === "LID" || e.componentType === "SINGLE";
    if (activeComponentType === "TUB") return e.componentType === "TUB";
    return true;
  });

  const currentIsInProduction = isLidAndTub
    ? (activeComponentType === "LID" ? isLidInProduction : isTubInProduction)
    : isSingleInProduction;
  const currentIsCompleted = isLidAndTub
    ? (activeComponentType === "LID" ? isLidProductionCompleted : isTubProductionCompleted)
    : isProductionCompleted;

  const currentMarkComplete = isLidAndTub
    ? (activeComponentType === "LID" ? markLidComplete : markTubComplete)
    : markSingleComplete;
  const setCurrentMarkComplete = isLidAndTub
    ? (activeComponentType === "LID" ? setMarkLidComplete : setMarkTubComplete)
    : setMarkSingleComplete;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
          <button className="flex gap-[.5vw] items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[1vw] h-[1vw]">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw]">Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">Production Details - Job Card</h1>
            <p className="text-[.85vw] text-gray-600 mt-1">{customerForm.customerName} - {customerForm.imlName}{componentLabel}</p>
          </div>
          <div className="w-[3vw]"></div>
        </div>

        {/* Production Completed Banner */}
        {currentIsCompleted && (
          <div className="mx-[1.5vw] mt-[1vw] p-[0.75vw] bg-green-50 border-2 border-green-400 rounded-[0.6vw] flex items-center gap-[0.75vw]">
            <span className="text-[1.3vw]">✅</span>
            <div>
              <p className="text-[.95vw] font-bold text-green-800">
                {isLidAndTub ? `${activeComponentType} Production Completed` : "Production Completed"}
              </p>
              <p className="text-[.8vw] text-green-600">
                {isLidAndTub
                  ? `${activeComponentType} production has been marked as complete. No new ${activeComponentType} entries can be added.`
                  : "This production has been marked as complete. No new entries can be added."}
              </p>
            </div>
          </div>
        )}

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[70vh] overflow-y-auto">
          {/* Customer Details */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2 relative">
              <span className="text-[1.3vw]">📋</span> Customer Details
              <div className="flex justify-end absolute right-0 gap-[1vw]">
                <button
                  onClick={() => { setPersonType("received"); setNewPerson(""); setShowPersonManager(true); }}
                  className="flex items-center gap-[0.5vw] px-[.85vw] py-[0.35vw] bg-amber-500 text-white rounded-[0.6vw] font-semibold text-[0.9vw] transition-all cursor-pointer"
                >
                  <span className="text-[1.1vw]">+</span> Add Person
                </button>

                {isLidAndTub ? (
                  <button
                    className={`px-[.85vw] py-[.35vw] text-[.85vw] rounded-[0.6vw] transition-all ${currentIsInProduction || currentIsCompleted
                      ? "bg-green-600 text-white opacity-75 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      }`}
                    onClick={() => {
                      if (currentIsInProduction || currentIsCompleted) return;
                      handleMarkInProduction(activeComponentType);
                    }}
                  >
                    {currentIsInProduction || currentIsCompleted
                      ? `✔ ${activeComponentType} In Production`
                      : `Mark ${activeComponentType} as In Production`}
                  </button>
                ) : (
                  <button
                    className={`px-[.85vw] py-[.35vw] text-[.85vw] rounded-[0.6vw] transition-all ${isSingleInProduction || isProductionCompleted
                      ? "bg-green-600 text-white opacity-75 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      }`}
                    onClick={() => {
                      if (isSingleInProduction || isProductionCompleted) return;
                      handleMarkInProduction(null);
                    }}
                  >
                    {isSingleInProduction || isProductionCompleted ? "✔ Marked as In Production" : "Mark as In Production"}
                  </button>
                )}
              </div>
            </h3>

            {!currentIsInProduction && !currentIsCompleted && (
              <div className="mb-[0.75vw] p-[0.6vw] bg-amber-50 border border-amber-300 rounded-[0.5vw] flex items-center gap-[0.5vw]">
                <span>⚠️</span>
                <p className="text-[.8vw] text-amber-800 font-medium">
                  You must click <strong>"{isLidAndTub ? `Mark ${activeComponentType} as In Production` : "Mark as In Production"}"</strong> before adding any entries.
                </p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-[1vw]">

              {/* Row 1 */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Customer Name</label>
                <input type="text" name="customerName" value={customerForm.customerName} onChange={handleCustomerChange} disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold" />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">IML Name</label>
                <input type="text" name="imlName" value={customerForm.imlName} onChange={handleCustomerChange} disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800" />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Product</label>
                <input type="text" name="product" value={customerForm.product} onChange={handleCustomerChange} disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]" />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Size</label>
                <input type="text" name="size" value={customerForm.size} onChange={handleCustomerChange} disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]" />
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">LID Color</label>
                <input type="text" value={customerForm.lidColor || "—"} disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-50 border border-green-300 rounded-[0.4vw] font-semibold text-green-800" />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">TUB Color</label>
                <input type="text" value={customerForm.tubColor || "—"} disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-50 border border-blue-300 rounded-[0.4vw] font-semibold text-blue-800" />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-600 mb-[0.3vw]">
                  {isLidAndTub ? (activeComponentType === "LID" ? "LID Order Qty" : "TUB Order Qty") : `Order Qty (${entry?.imlType})`}
                </label>
                <input type="text"
                  value={formatNumber(isLidAndTub ? (activeComponentType === "LID" ? orderQtyDisplay.lidOrderQty : orderQtyDisplay.tubOrderQty) : orderQtyDisplay.singleOrderQty)}
                  disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold text-gray-700"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-600 mb-[0.3vw]">
                  {isLidAndTub ? (activeComponentType === "LID" ? "LID Production Qty" : "TUB Production Qty") : `Production Qty (${entry?.imlType})`}
                </label>
                <input type="text"
                  value={formatNumber(isLidAndTub ? (activeComponentType === "LID" ? orderQtyDisplay.lidProdQty : orderQtyDisplay.tubProdQty) : orderQtyDisplay.singleProdQty)}
                  disabled className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>

              {/* Row 3 */}
              <div>
                {isLidAndTub ? (
                  <>
                    <label className="block text-[.8vw] font-semibold mb-[0.3vw] text-blue-700">
                      Total {activeComponentType} Labels Received
                    </label>
                    <input
                      type="number"
                      value={activeComponentType === "LID" ? (totalLabelsReceived.lid || "") : (totalLabelsReceived.tub || "")}
                      onChange={activeComponentType === "LID" ? handleTotalLabelsChange("lid") : handleTotalLabelsChange("tub")}
                      min="0"
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-50 border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 font-semibold text-blue-800"
                      placeholder="Labels received"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-[.8vw] font-semibold text-blue-700 mb-[0.3vw]">Total Labels Received <span className="text-blue-500">*</span></label>
                    <input
                      type="number"
                      value={totalLabelsReceived.single || ""}
                      onChange={handleTotalLabelsChange("single")}
                      min="0"
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-50 border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 font-semibold text-blue-800"
                      placeholder="Enter total received"
                    />
                  </>
                )}
              </div>

              {/* Machine Number */}
              {(showLid || (isLidAndTub && activeComponentType === "LID")) ? (
                <div className="relative" ref={lidMachineInputRef}>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">LID Machine Number</label>
                  <input type="text" name="lidMachineNumber" value={customerForm.lidMachineNumber} onChange={handleLidMachineInputChange} onFocus={() => setLidMachineDropdownOpen(true)} placeholder="Type or select..." className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-green-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500" />
                  {lidMachineDropdownOpen && filteredMachines.length > 0 && (
                    <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredMachines.map((machine) => <div key={`lid-${machine}`} onClick={() => handleLidMachineSelect(machine)} className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-green-100 cursor-pointer">{machine}</div>)}
                    </div>
                  )}
                </div>
              ) : (showTub || (isLidAndTub && activeComponentType === "TUB")) ? (
                <div className="relative" ref={tubMachineInputRef}>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">TUB Machine Number</label>
                  <input type="text" name="tubMachineNumber" value={customerForm.tubMachineNumber} onChange={handleTubMachineInputChange} onFocus={() => setTubMachineDropdownOpen(true)} placeholder="Type or select..." className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500" />
                  {tubMachineDropdownOpen && filteredMachines.length > 0 && (
                    <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredMachines.map((machine) => <div key={`tub-${machine}`} onClick={() => handleTubMachineSelect(machine)} className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-blue-100 cursor-pointer">{machine}</div>)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={lidMachineInputRef}>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Machine Number</label>
                  <input type="text" name="lidMachineNumber" value={customerForm.lidMachineNumber} onChange={handleLidMachineInputChange} onFocus={() => setLidMachineDropdownOpen(true)} placeholder="Type or select..." className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500" />
                  {lidMachineDropdownOpen && filteredMachines.length > 0 && (
                    <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredMachines.map((machine) => <div key={machine} onClick={() => handleLidMachineSelect(machine)} className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-blue-100 cursor-pointer">{machine}</div>)}
                    </div>
                  )}
                </div>
              )}

              {/* Received By */}
              {(showLid || (isLidAndTub && activeComponentType === "LID")) ? (
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">LID Received By</label>
                  <select name="lidReceivedBy" value={customerForm.lidReceivedBy} onChange={handleCustomerChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-green-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-green-500">
                    <option value="">Select Person</option>
                    {receivedByOptions.map((person) => <option key={`lid-${person}`} value={person}>{person}</option>)}
                  </select>
                </div>
              ) : (showTub || (isLidAndTub && activeComponentType === "TUB")) ? (
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">TUB Received By</label>
                  <select name="tubReceivedBy" value={customerForm.tubReceivedBy} onChange={handleCustomerChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-blue-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Person</option>
                    {receivedByOptions.map((person) => <option key={`tub-${person}`} value={person}>{person}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Received By</label>
                  <select name="lidReceivedBy" value={customerForm.lidReceivedBy} onChange={handleCustomerChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] cursor-pointer">
                    <option value="">Select Person</option>
                    {receivedByOptions.map((person) => <option key={person} value={person}>{person}</option>)}
                  </select>
                </div>
              )}

            </div>
          </div>

          {/* Add Entry Form */}
          {!currentIsCompleted && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
              <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
                <span className="text-[1.3vw]">➕</span>
                {isLidAndTub && activeComponentType ? `Add Production Entry (${activeComponentType})` : isLidAndTub ? "Add Production Entry (LID & TUB)" : "Add Production Entry"}
              </h3>

              {/* LID Entry Form */}
              {(showLid || (isLidAndTub && activeComponentType === "LID")) && (
                <div className="mb-[1.5vw] p-[0.8vw] bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.5vw] border-2 border-green-200">
                  <h4 className="text-[1vw] font-semibold text-green-800 mb-[0.8vw] flex items-center gap-2">
                    LID Entry
                    <span className="text-[.8vw] text-green-600 ml-2">Machine: {customerForm.lidMachineNumber || "Not set"} | Received By: {customerForm.lidReceivedBy || "Not set"}</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-[1vw] mb-[1vw]">
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Date</label>
                      <input type="date" name="date" value={lidEntryForm.date} onChange={handleLidEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Shift</label>
                      <div className="flex gap-[1vw] mt-[0.3vw]">
                        <label className="flex items-center gap-[0.4vw] cursor-pointer"><input type="radio" name="lidShift" checked={lidEntryForm.shift === "Day"} onChange={() => handleLidShiftChange("Day")} className="w-[1vw] h-[1vw] accent-green-600 cursor-pointer" /><span className="text-[.8vw]">Day</span></label>
                        <label className="flex items-center gap-[0.4vw] cursor-pointer"><input type="radio" name="lidShift" checked={lidEntryForm.shift === "Night"} onChange={() => handleLidShiftChange("Night")} className="w-[1vw] h-[1vw] accent-green-600 cursor-pointer" /><span className="text-[.8vw]">Night</span></label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Accepted LID Component <span className="text-red-500">*</span></label>
                      <input type="number" name="acceptedComponents" value={lidEntryForm.acceptedComponents} onChange={handleLidEntryChange} placeholder="Enter accepted qty" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-green-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Rejected LID Component <span className="text-red-500">*</span></label>
                      <input type="number" name="rejectedComponents" value={lidEntryForm.rejectedComponents} onChange={handleLidEntryChange} placeholder="Enter rejected qty" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-green-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">LID Label Wastage</label>
                      <input type="number" name="labelWastage" value={lidEntryForm.labelWastage} onChange={handleLidEntryChange} placeholder="Enter wastage" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Packing Incharge <span className="text-red-500">*</span></label>
                      <select name="packingIncharge" value={lidEntryForm.packingIncharge} onChange={handleLidEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-green-500">
                        <option value="">Select Incharge</option>
                        {packingInchargeOptions.map((p) => <option key={`lid-packing-${p}`} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Approved By <span className="text-red-500">*</span></label>
                      <select name="approvedBy" value={lidEntryForm.approvedBy} onChange={handleLidEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-green-500">
                        <option value="">Select Approver</option>
                        {approvedByOptions.map((p) => <option key={`lid-approved-${p}`} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addLidProductionEntry}
                        disabled={isLidProductionCompleted || !(isLidAndTub ? isLidInProduction : isSingleInProduction)}
                        className={`w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md ${isLidProductionCompleted || !(isLidAndTub ? isLidInProduction : isSingleInProduction)
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                          }`}
                      >
                        Add LID Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TUB Entry Form */}
              {(showTub || (isLidAndTub && activeComponentType === "TUB")) && (
                <div className="p-[0.8vw] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.5vw] border-2 border-blue-200">
                  <h4 className="text-[1vw] font-semibold text-blue-800 mb-[0.8vw] flex items-center gap-2">
                    TUB Entry
                    <span className="text-[.8vw] text-blue-600 ml-2">Machine: {customerForm.tubMachineNumber || "Not set"} | Received By: {customerForm.tubReceivedBy || "Not set"}</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-[1vw]">
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Date</label>
                      <input type="date" name="date" value={tubEntryForm.date} onChange={handleTubEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Shift</label>
                      <div className="flex gap-[1vw] mt-[0.3vw]">
                        <label className="flex items-center gap-[0.4vw] cursor-pointer"><input type="radio" name="tubShift" checked={tubEntryForm.shift === "Day"} onChange={() => handleTubShiftChange("Day")} className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer" /><span className="text-[.8vw]">Day</span></label>
                        <label className="flex items-center gap-[0.4vw] cursor-pointer"><input type="radio" name="tubShift" checked={tubEntryForm.shift === "Night"} onChange={() => handleTubShiftChange("Night")} className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer" /><span className="text-[.8vw]">Night</span></label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Accepted TUB Component <span className="text-red-500">*</span></label>
                      <input type="number" name="acceptedComponents" value={tubEntryForm.acceptedComponents} onChange={handleTubEntryChange} placeholder="Enter accepted qty" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Rejected TUB Component <span className="text-red-500">*</span></label>
                      <input type="number" name="rejectedComponents" value={tubEntryForm.rejectedComponents} onChange={handleTubEntryChange} placeholder="Enter rejected qty" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">TUB Label Wastage</label>
                      <input type="number" name="labelWastage" value={tubEntryForm.labelWastage} onChange={handleTubEntryChange} placeholder="Enter wastage" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]" />
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Packing Incharge <span className="text-red-500">*</span></label>
                      <select name="packingIncharge" value={tubEntryForm.packingIncharge} onChange={handleTubEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Incharge</option>
                        {packingInchargeOptions.map((p) => <option key={`tub-packing-${p}`} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Approved By <span className="text-red-500">*</span></label>
                      <select name="approvedBy" value={tubEntryForm.approvedBy} onChange={handleTubEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Approver</option>
                        {approvedByOptions.map((p) => <option key={`tub-approved-${p}`} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addTubProductionEntry}
                        disabled={isTubProductionCompleted || !(isLidAndTub ? isTubInProduction : isSingleInProduction)}
                        className={`w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md ${isTubProductionCompleted || !(isLidAndTub ? isTubInProduction : isSingleInProduction)
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                          }`}
                      >
                        Add TUB Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Single */}
              {showSingle && (
                <div className="grid grid-cols-4 gap-[1vw] mb-[1vw]">
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Date</label>
                    <input type="date" name="date" value={lidEntryForm.date} onChange={handleLidEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]" />
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Shift</label>
                    <div className="flex gap-[1vw] mt-[0.3vw]">
                      <label className="flex items-center gap-[0.4vw] cursor-pointer"><input type="radio" name="shift" checked={lidEntryForm.shift === "Day"} onChange={() => handleLidShiftChange("Day")} className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer" /><span className="text-[.8vw]">Day</span></label>
                      <label className="flex items-center gap-[0.4vw] cursor-pointer"><input type="radio" name="shift" checked={lidEntryForm.shift === "Night"} onChange={() => handleLidShiftChange("Night")} className="w-[1vw] h-[1vw] accent-blue-600 cursor-pointer" /><span className="text-[.8vw]">Night</span></label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Accepted Components <span className="text-red-500">*</span></label>
                    <input type="number" name="acceptedComponents" value={lidEntryForm.acceptedComponents} onChange={handleLidEntryChange} placeholder="Enter accepted qty" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Rejected Components <span className="text-red-500">*</span></label>
                    <input type="number" name="rejectedComponents" value={lidEntryForm.rejectedComponents} onChange={handleLidEntryChange} placeholder="Enter rejected qty" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Label Wastage</label>
                    <input type="number" name="labelWastage" value={lidEntryForm.labelWastage} onChange={handleLidEntryChange} placeholder="Enter wastage" min="0" className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]" />
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Packing Incharge <span className="text-red-500">*</span></label>
                    <select name="packingIncharge" value={lidEntryForm.packingIncharge} onChange={handleLidEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Incharge</option>
                      {packingInchargeOptions.map((p) => <option key={`single-packing-${p}`} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">Approved By <span className="text-red-500">*</span></label>
                    <select name="approvedBy" value={lidEntryForm.approvedBy} onChange={handleLidEntryChange} className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] cursor-pointer focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Approver</option>
                      {approvedByOptions.map((p) => <option key={`single-approved-${p}`} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addProductionEntry}
                      disabled={isProductionCompleted || !isSingleInProduction}
                      className={`w-full px-[1vw] py-[0.5vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md ${isProductionCompleted || !isSingleInProduction
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                        }`}
                    >
                      Add Entry
                    </button>
                  </div>
                </div>
              )}

              {/* Remaining Labels Display */}
              <div className="mt-[1vw]">
                {(showLid || (isLidAndTub && activeComponentType === "LID")) && (
                  <div className="p-[0.75vw] bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-[0.5vw]">
                    <div className="flex justify-between items-center">
                      <span className="text-[.9vw] font-semibold text-green-900">Remaining LID Labels:</span>
                      <span className="text-[1.1vw] font-bold text-green-700">{formatNumber(remainingLidLabels)}</span>
                    </div>
                  </div>
                )}
                {(showTub || (isLidAndTub && activeComponentType === "TUB")) && (
                  <div className="p-[0.75vw] bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 rounded-[0.5vw] mt-[0.5vw]">
                    <div className="flex justify-between items-center">
                      <span className="text-[.9vw] font-semibold text-blue-900">Remaining TUB Labels:</span>
                      <span className="text-[1.1vw] font-bold text-blue-700">{formatNumber(remainingTubLabels)}</span>
                    </div>
                  </div>
                )}
                {showSingle && (
                  <div className="p-[0.75vw] bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-[0.5vw]">
                    <div className="flex justify-between items-center">
                      <span className="text-[.9vw] font-semibold text-green-900">Remaining Labels:</span>
                      <span className="text-[1.1vw] font-bold text-green-700">{formatNumber(remainingLidLabels)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Production Entries Table */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📊</span> Production History
              {activeComponentType && (
                <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-[.75vw] font-semibold">Showing: {activeComponentType} entries</span>
              )}
            </h3>
            <div className="overflow-auto max-h-[35vh]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100 sticky top-0">
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">S.No</th>
                    {(isLidAndTub) && <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Component</th>}
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Date</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Shift</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Accepted</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Rejected</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Wastage</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Packing Incharge</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Approved By</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Machine No</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">Received By</th>
                    <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold text-amber-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.length === 0 ? (
                    <tr>
                      <td colSpan={isLidAndTub ? "12" : "11"} className="border border-amber-300 px-[0.75vw] py-[2vw] text-center text-[.85vw] text-gray-500">
                        No entries added yet. Add your first entry above.
                      </td>
                    </tr>
                  ) : (
                    visibleEntries.map((e, idx) => (
                      <tr key={idx} className="hover:bg-amber-50">
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">{idx + 1}</td>
                        {isLidAndTub && (
                          <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                            <span className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${e.componentType === "LID" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{e.componentType}</span>
                          </td>
                        )}
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">{e.date}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                          <span className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${e.shift === "Day" ? "bg-yellow-100 text-yellow-700" : "bg-indigo-100 text-indigo-700"}`}>{e.shift}</span>
                        </td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-green-700">{formatNumber(e.acceptedComponents)}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-red-700">{formatNumber(e.rejectedComponents)}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] text-gray-700">{formatNumber(e.labelWastage) || "—"}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">{e.packingIncharge}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">{e.approvedBy}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium">{e.machineNumber || "—"}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium">{e.receivedBy || "—"}</td>
                        <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-center">
                          {e.submitted ? (
                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[.75vw] font-semibold">✓ Submitted</span>
                          ) : (
                            <button onClick={() => handleDeleteEntry(productionEntries.indexOf(e))} className="px-[0.75vw] py-[.3vw] bg-red-600 text-white rounded-[0.4vw] text-[.75vw] font-medium hover:bg-red-700 cursor-pointer transition-all">
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

          {/* Submit / Save area */}
          {!currentIsCompleted && (
            <div className="flex justify-between items-center gap-[1vw]">
              <label className="flex items-center gap-[0.75vw] p-[0.75vw] bg-orange-50 border-2 border-orange-300 rounded-[0.5vw] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={currentMarkComplete}
                  onChange={(e) => setCurrentMarkComplete(e.target.checked)}
                  className="w-[1.2vw] h-[1.2vw] accent-orange-600 cursor-pointer"
                  id="markComplete"
                />
                <span className="text-[.9vw] font-semibold text-orange-800">
                  {isLidAndTub ? `Mark ${activeComponentType} Production as Complete` : "Mark Production as Complete"}
                </span>
                {currentMarkComplete && (
                  <span className="text-[.75vw] text-orange-600 ml-1">(You will be asked to confirm before saving)</span>
                )}
              </label>

              <div className="flex gap-[1vw]">
                <button onClick={handleBack} className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={productionEntries.length === 0}
                  className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentMarkComplete ? "✅ Save & Complete Production" : "💾 Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Complete Confirmation Modal */}
      {showCompleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[999] flex items-center justify-center p-[2vw]">
          <div className="bg-white rounded-[1vw] shadow-2xl max-w-[40vw] w-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-[1.25vw]">
              <h3 className="text-[1.2vw] font-black text-white flex items-center gap-[0.5vw]">
                <span className="text-[1.4vw]">⚠️</span> Confirm Production Complete
              </h3>
            </div>
            <div className="p-[1.5vw] space-y-[1vw]">
              <div className="p-[1vw] bg-orange-50 border-2 border-orange-200 rounded-[0.6vw]">
                <p className="text-[.95vw] font-semibold text-orange-900 mb-[0.5vw]">
                  Are you sure you want to mark {isLidAndTub ? pendingCompleteTarget : "this production"} as complete?
                </p>
                <p className="text-[.85vw] text-orange-700">
                  ⚠️ <strong>Once marked as complete, you cannot add any more {isLidAndTub ? pendingCompleteTarget : ""} entries</strong> to this production job. This action cannot be undone.
                </p>
              </div>
              <div className="p-[0.75vw] bg-gray-50 border border-gray-200 rounded-[0.5vw]">
                <p className="text-[.8vw] text-gray-600 font-medium">Production details:</p>
                <p className="text-[.85vw] text-gray-800 font-semibold mt-[0.25vw]">{customerForm.customerName} — {customerForm.imlName}</p>
                <p className="text-[.8vw] text-gray-600">{customerForm.product} | {customerForm.size}{pendingCompleteTarget && pendingCompleteTarget !== "SINGLE" ? ` | ${pendingCompleteTarget}` : ""}</p>
                <p className="text-[.8vw] text-gray-600 mt-[0.25vw]">Total entries: {productionEntries.length}</p>
              </div>
            </div>
            <div className="flex gap-[1vw] p-[1.25vw] bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowCompleteConfirmModal(false)}
                className="flex-1 px-[1vw] py-[0.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.5vw] font-semibold text-[0.9vw] hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel — Keep Adding Entries
              </button>
              <button
                onClick={() => {
                  setShowCompleteConfirmModal(false);
                  performSave(pendingCompleteTarget);
                }}
                className="flex-1 px-[1vw] py-[0.6vw] bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-[0.5vw] font-bold text-[0.9vw] hover:from-orange-600 hover:to-red-600 transition-all shadow-md cursor-pointer"
              >
                ✅ Yes, Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Manager Modal */}
      {showPersonManager && (
        <div className="fixed inset-0 bg-[#000000cc] z-[999] flex items-center justify-center p-[clamp(12px,2vw,24px)]">
          <div className="bg-white shadow-2xl overflow-y-auto w-[90vw] max-w-[clamp(420px,38vw,560px)] max-h-[85vh] rounded-[clamp(14px,1.2vw,22px)]">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-[clamp(16px,1.5vw,24px)] rounded-t-[clamp(14px,1.2vw,22px)]">
              <h3 className="flex items-center gap-[clamp(8px,0.8vw,12px)] font-black text-[clamp(18px,1.6vw,24px)]">Manage Persons</h3>
            </div>
            <div className="p-[clamp(16px,1.5vw,24px)] space-y-[clamp(16px,1.5vw,24px)]">
              <div className="grid grid-cols-3 gap-[clamp(6px,0.6vw,10px)] text-center">
                {[{ key: "received", label: "Received By", active: "bg-green-500" }, { key: "packing", label: "Packing", active: "bg-orange-500" }, { key: "approved", label: "Approved", active: "bg-red-500" }].map(({ key, label, active }) => (
                  <button key={key} onClick={() => setPersonType(key)} className={`px-[clamp(12px,1vw,18px)] py-[clamp(8px,0.8vw,14px)] rounded-[clamp(10px,1vw,16px)] font-semibold transition-all text-[clamp(13px,0.9vw,16px)] ${personType === key ? `${active} text-white shadow-lg` : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>{label}</button>
                ))}
              </div>
              <div className="space-y-[clamp(8px,0.8vw,12px)]">
                <label className="block font-bold text-gray-800 capitalize text-[clamp(14px,1vw,18px)]">Current {personType.replace("_", " ")} Persons:</label>
                <div className="max-h-[20vh] overflow-y-auto bg-gray-50 p-[clamp(10px,0.9vw,16px)] rounded-[clamp(10px,1vw,16px)] border border-gray-200">
                  {(personType === "received" ? receivedByOptions : personType === "packing" ? packingInchargeOptions : approvedByOptions).map((person, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white shadow-sm p-[clamp(10px,0.8vw,14px)] rounded-[clamp(10px,0.8vw,14px)] mb-[clamp(6px,0.6vw,10px)]">
                      <span className="font-medium text-[clamp(14px,0.9vw,16px)]">{person}</span>
                      <button onClick={() => {
                        const list = personType === "received" ? receivedByOptions : personType === "packing" ? packingInchargeOptions : approvedByOptions;
                        const updated = list.filter((_, i) => i !== idx);
                        if (personType === "received") { setReceivedByOptions(updated); localStorage.setItem("iml_received_persons", JSON.stringify(updated)); }
                        else if (personType === "packing") { setPackingInchargeOptions(updated); localStorage.setItem("iml_packing_persons", JSON.stringify(updated)); }
                        else { setApprovedByOptions(updated); localStorage.setItem("iml_approved_persons", JSON.stringify(updated)); }
                      }} className="text-red-500 hover:text-red-700 font-bold text-[clamp(16px,1.2vw,20px)]" title="Remove">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-800 mb-[clamp(8px,0.8vw,12px)] text-[clamp(14px,1vw,18px)]">Add New Person</label>
                <input type="text" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={`Enter ${personType.replace("_", " ")} name...`} className="w-full border border-gray-300 px-[clamp(12px,1vw,18px)] py-[clamp(10px,0.9vw,16px)] rounded-[clamp(10px,1vw,16px)] font-semibold text-[clamp(14px,0.9vw,16px)] focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all" />
              </div>
              <div className="flex gap-[clamp(10px,1vw,16px)] pt-[clamp(12px,1vw,20px)]">
                <button onClick={() => {
                  if (!newPerson.trim()) return;
                  const list = personType === "received" ? receivedByOptions : personType === "packing" ? packingInchargeOptions : approvedByOptions;
                  const updated = [...list, newPerson.trim()];
                  if (personType === "received") { setReceivedByOptions(updated); localStorage.setItem("iml_received_persons", JSON.stringify(updated)); }
                  else if (personType === "packing") { setPackingInchargeOptions(updated); localStorage.setItem("iml_packing_persons", JSON.stringify(updated)); }
                  else { setApprovedByOptions(updated); localStorage.setItem("iml_approved_persons", JSON.stringify(updated)); }
                  setNewPerson("");
                }} className="flex-1 font-bold text-white shadow-md transition-all bg-purple-600 hover:bg-purple-700 px-[clamp(14px,1.1vw,20px)] py-[clamp(8px,0.7vw,12px)] rounded-[clamp(10px,0.9vw,16px)] text-[clamp(13px,0.9vw,16px)] cursor-pointer">Add Person</button>
                <button onClick={() => { setShowPersonManager(false); setNewPerson(""); }} className="bg-gray-500 hover:bg-gray-600 text-white font-bold transition-all px-[clamp(14px,1.1vw,20px)] py-[clamp(8px,0.7vw,12px)] rounded-[clamp(10px,0.9vw,16px)] text-[clamp(13px,0.9vw,16px)] cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionDetails;