// PODetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_PO = "iml_purchase_po_details";

const LABEL_TYPE_OPTIONS = [
  "Paper Label", "Vinyl Label", "Polyester Label", "Thermal Transfer",
  "Direct Thermal", "IML Label", "Shrink Sleeve", "Wrap Around Label",
];

const SUPPLIER_OPTIONS = [
  "Global Suppliers Inc.", "Prime Materials Ltd.", "Quality Distributors",
  "Elite Label Solutions", "Premium Print Co.", "Advanced Packaging",
  "Reliable Labels", "Express Suppliers",
];

// ─── Toast Component ───────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-[1.5vw] right-[1.5vw] z-[99999] flex flex-col gap-[0.6vw] max-w-[28vw]">
      {toasts.map((toast) => {
        const styles = {
          error:   { bar: "bg-red-500",    bg: "bg-red-50 border-red-300",    icon: "❌", title: "text-red-800",   msg: "text-red-700"   },
          success: { bar: "bg-green-500",  bg: "bg-green-50 border-green-300", icon: "✅", title: "text-green-800", msg: "text-green-700" },
          warning: { bar: "bg-amber-500",  bg: "bg-amber-50 border-amber-300", icon: "⚠️", title: "text-amber-800", msg: "text-amber-700" },
          info:    { bar: "bg-blue-500",   bg: "bg-blue-50 border-blue-300",   icon: "ℹ️", title: "text-blue-800",  msg: "text-blue-700"  },
        };
        const s = styles[toast.type] || styles.info;

        return (
          <div
            key={toast.id}
            className={`flex overflow-hidden rounded-[0.5vw] border shadow-lg animate-slide-in ${s.bg}`}
          >
            {/* Left colour bar */}
            <div className={`w-[0.35vw] flex-shrink-0 ${s.bar}`} />

            <div className="flex flex-1 items-start gap-[0.6vw] px-[0.9vw] py-[0.7vw]">
              <span className="text-[1.1vw] mt-[0.05vw] flex-shrink-0">{s.icon}</span>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className={`text-[0.82vw] font-bold mb-[0.15vw] ${s.title}`}>
                    {toast.title}
                  </p>
                )}
                {/* Support multi-line messages */}
                {Array.isArray(toast.message) ? (
                  <ul className={`text-[0.78vw] list-disc list-inside space-y-[0.15vw] ${s.msg}`}>
                    {toast.message.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-[0.78vw] ${s.msg}`}>{toast.message}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-[1vw] leading-none cursor-pointer ml-[0.3vw]"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── useToast hook ─────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", title = "", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};

// ─── Main Component ────────────────────────────────────────────────────────────
const PODetails = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { toasts, addToast, removeToast } = useToast();

  const {
    orderId,
    fromOrdersManagement = false,
    returnSheet,
    movedProductId = null,
    mode = "",
  } = location.state || {};

  const [order,           setOrder]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [globalPONumber,  setGlobalPONumber]  = useState("");
  const [globalLabelType, setGlobalLabelType] = useState("");
  const [globalSupplier,  setGlobalSupplier]  = useState("");
  const [productPODetails, setProductPODetails] = useState({});
  const [viewingProduct,  setViewingProduct]  = useState(null);
  const [filteredGlobalLabels,    setFilteredGlobalLabels]    = useState([]);
  const [filteredGlobalSuppliers, setFilteredGlobalSuppliers] = useState([]);
  const [showGlobalLabelSuggestions,    setShowGlobalLabelSuggestions]    = useState(false);
  const [showGlobalSupplierSuggestions, setShowGlobalSupplierSuggestions] = useState(false);
  const [activeAutocomplete, setActiveAutocomplete] = useState(null);
  const [syncTubWithLid,     setSyncTubWithLid]     = useState({});
  const [showLeaveModal,     setShowLeaveModal]      = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction]  = useState(null);
  const [sameAsOrderQty,     setSameAsOrderQty]      = useState({});
  const [poSelectionModal,   setPOSelectionModal]    = useState(null);

  // Validation highlight state – tracks which product+part+field combos are invalid
  const [invalidFields, setInvalidFields] = useState({});

  const globalLabelRef   = useRef(null);
  const globalSupplierRef = useRef(null);
  const hasPromptedRef   = useRef(false);

  const isDirty = useRef(false);


  // ── Load order ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!storedOrders) { setLoading(false); return; }

    try {
      const allOrders = JSON.parse(storedOrders);
      const foundOrder = allOrders.find((o) => o.id === orderId);

      if (foundOrder) {
        setOrder(foundOrder);
        const initialDetails = {};
        foundOrder.products?.filter((p) => p.moveToPurchase).forEach((product) => {
          initialDetails[product.id] =
            product.imlType === "LID & TUB"
              ? { lid: { poNumber: "", labelType: "", supplier: "", poQty: "" },
                  tub: { poNumber: "", labelType: "", supplier: "", poQty: "" } }
              : { poNumber: "", labelType: "", supplier: "", poQty: "" };
        });
        setProductPODetails(initialDetails);
      }
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // ── Load existing PO details ────────────────────────────────────────────────
  useEffect(() => {
    if (!order) return;
    const isFirstRun = !hasPromptedRef.current;
    hasPromptedRef.current = true;

    try {
      const storedPO = localStorage.getItem(STORAGE_KEY_PO);
      if (!storedPO) return;

      const allPODetails  = JSON.parse(storedPO);
      const existingPO    = allPODetails[order.id];

      if (existingPO?.products) {
        setProductPODetails((prev) => ({ ...prev, ...existingPO.products }));
      }

      if (!isFirstRun || !fromOrdersManagement || !existingPO?.products) return;

      const sourceProducts = [];
      let sourcePO = null;

      for (const pid of Object.keys(existingPO.products)) {
        const p = existingPO.products[pid];
        if (!p) continue;
        let poNumber = null, supplier = null;
        if      (p.poNumber   && p.supplier)          { poNumber = p.poNumber;       supplier = p.supplier;       }
        else if (p.lid?.poNumber && p.lid?.supplier)  { poNumber = p.lid.poNumber;   supplier = p.lid.supplier;   }
        else if (p.tub?.poNumber && p.tub?.supplier)  { poNumber = p.tub.poNumber;   supplier = p.tub.supplier;   }

        if (poNumber && supplier) {
          const found = order.products?.find((x) => String(x.id) === String(pid));
          sourceProducts.push({ id: pid, name: found?.productName || `#${pid}`, poNumber, supplier });
          if (!sourcePO) sourcePO = { poNumber, supplier };
        }
      }

      if (!sourcePO || sourceProducts.length === 0) return;

      const confirmMsg =
        `PO details already exists:\n\n` +
        `Do you want to copy this PO number and supplier to all other products in this order?\n\n` +
        `Note: Label type will NOT be copied.`;

      if (!window.confirm(confirmMsg)) return;

      const uniqueCombos = [];
      const seenKeys = new Set();
      for (const sp of sourceProducts) {
        const key = `${sp.poNumber}|||${sp.supplier}`;
        if (!seenKeys.has(key)) { seenKeys.add(key); uniqueCombos.push(sp); }
      }

      if (uniqueCombos.length > 1) {
        setPOSelectionModal({ sourceOptions: uniqueCombos, orderRef: order });
        return;
      }

      applySourcePOToAll(sourcePO, order);
    } catch (err) {
      console.error("Error loading existing PO details:", err);
    }
  }, [order, fromOrdersManagement]);

  const applySourcePOToAll = (sourcePO, orderRef) => {
    setProductPODetails((prev) => {
      const updated = { ...prev };
      (orderRef.products || []).filter((prod) => prod.moveToPurchase).forEach((prod) => {
        const pid = prod.id;
        if (!updated[pid]) {
          updated[pid] = prod.imlType === "LID & TUB"
            ? { lid: { poNumber: "", labelType: "", supplier: "", poQty: "" },
                tub: { poNumber: "", labelType: "", supplier: "", poQty: "" } }
            : { poNumber: "", labelType: "", supplier: "", poQty: "" };
        }
        if (prod.imlType === "LID & TUB") {
          if (!updated[pid].lid?.poNumber && !updated[pid].lid?.supplier) {
            updated[pid].lid = { ...updated[pid].lid, poNumber: sourcePO.poNumber, supplier: sourcePO.supplier };
          }
          if (!updated[pid].tub?.poNumber && !updated[pid].tub?.supplier) {
            updated[pid].tub = { ...updated[pid].tub, poNumber: sourcePO.poNumber, supplier: sourcePO.supplier };
          }
        } else {
          if (!updated[pid]?.poNumber && !updated[pid]?.supplier) {
            updated[pid] = { ...updated[pid], poNumber: sourcePO.poNumber, supplier: sourcePO.supplier };
          }
        }
      });
      return updated;
    });
  };

  // ── Click-outside to close suggestions ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (globalLabelRef.current   && !globalLabelRef.current.contains(e.target))   setShowGlobalLabelSuggestions(false);
      if (globalSupplierRef.current && !globalSupplierRef.current.contains(e.target)) setShowGlobalSupplierSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Global apply handlers ───────────────────────────────────────────────────
  const handleGlobalLabelInput = (value) => {
    setGlobalLabelType(value);
    if (!value.trim()) { setFilteredGlobalLabels([]); setShowGlobalLabelSuggestions(false); return; }
    const filtered = LABEL_TYPE_OPTIONS.filter((t) => t.toLowerCase().includes(value.toLowerCase()));
    setFilteredGlobalLabels(filtered);
    setShowGlobalLabelSuggestions(filtered.length > 0);
  };

  const handleGlobalSupplierInput = (value) => {
    setGlobalSupplier(value);
    if (!value.trim()) { setFilteredGlobalSuppliers([]); setShowGlobalSupplierSuggestions(false); return; }
    const filtered = SUPPLIER_OPTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
    setFilteredGlobalSuppliers(filtered);
    setShowGlobalSupplierSuggestions(filtered.length > 0);
  };

  const handleApplyToAll = () => {
    if (!globalPONumber && !globalLabelType && !globalSupplier) {
      addToast("Please enter at least one value to apply to all products.", "warning", "Nothing to Apply");
      return;
    }

    const isSingleProductFlow = mode === "single-product" && movedProductId;
    const targetProducts = isSingleProductFlow
      ? order.products.filter((p) => p.id === movedProductId)
      : order.products.filter((p) => p.moveToPurchase);

    setProductPODetails((prev) => {
      const updated = { ...prev };
      targetProducts.forEach((product) => {
        const pid = product.id;
        if (!updated[pid]) {
          updated[pid] = product.imlType === "LID & TUB"
            ? { lid: { poNumber: "", labelType: "", supplier: "", poQty: "" },
                tub: { poNumber: "", labelType: "", supplier: "", poQty: "" } }
            : { poNumber: "", labelType: "", supplier: "", poQty: "" };
        }
        if (product.imlType === "LID & TUB") {
          updated[pid] = {
            ...updated[pid],
            lid: { ...updated[pid].lid, poNumber: globalPONumber || updated[pid].lid?.poNumber || "", labelType: globalLabelType || updated[pid].lid?.labelType || "", supplier: globalSupplier || updated[pid].lid?.supplier || "", poQty: updated[pid].lid?.poQty || "" },
            tub: { ...updated[pid].tub, poNumber: globalPONumber || updated[pid].tub?.poNumber || "", labelType: globalLabelType || updated[pid].tub?.labelType || "", supplier: globalSupplier || updated[pid].tub?.supplier || "", poQty: updated[pid].tub?.poQty || "" },
          };
        } else {
          updated[pid] = { ...updated[pid], poNumber: globalPONumber || updated[pid].poNumber || "", labelType: globalLabelType || updated[pid].labelType || "", supplier: globalSupplier || updated[pid].supplier || "", poQty: updated[pid]?.poQty || "" };
        }
      });
      return updated;
    });

    addToast("Values applied to all applicable products!", "success", "Applied Successfully");
  };

  const handleSyncTubToggle = (productId, checked) => {
    setSyncTubWithLid((prev) => ({ ...prev, [productId]: checked }));
    if (checked) {
      setProductPODetails((prev) => {
        const lid = prev[productId]?.lid || {};
        return { ...prev, [productId]: { ...prev[productId], tub: { poNumber: lid.poNumber || "", labelType: lid.labelType || "", supplier: lid.supplier || "", poQty: lid.poQty || "" } } };
      });
    }
  };

  const updateProductField = (productId, field, value, part = null) => {

    isDirty.current = true;
    // Clear invalid flag as user types
    setInvalidFields((prev) => {
      const key = part ? `${productId}_${part}_${field}` : `${productId}_${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setProductPODetails((prev) => {
      const productDetails = prev[productId] || {};
      if (part) {
        const updated = {
          ...prev,
          [productId]: { ...productDetails, [part]: { ...productDetails[part], [field]: value } },
        };
        if (part === "lid" && syncTubWithLid[productId]) {
          updated[productId] = { ...updated[productId], tub: { ...updated[productId].tub, [field]: value } };
        }
        return updated;
      }
      return { ...prev, [productId]: { ...productDetails, [field]: value } };
    });
  };

  const handleProductAutocomplete = (productId, field, value, part = null) => {
    updateProductField(productId, field, value, part);
    if (!value.trim()) { setActiveAutocomplete(null); return; }
    const options = field === "labelType" ? LABEL_TYPE_OPTIONS : SUPPLIER_OPTIONS;
    const filtered = options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase()));
    if (filtered.length > 0) {
      setActiveAutocomplete({ productId, field: part ? `${field}-${part}` : field, options: filtered });
    } else {
      setActiveAutocomplete(null);
    }
  };

  const selectProductAutocomplete = (productId, field, value, part = null) => {
    updateProductField(productId, field, value, part);
    setActiveAutocomplete(null);
  };

  const handleViewProduct = (product) => setViewingProduct(product);
  const closeViewModal    = ()         => setViewingProduct(null);

  // ── Validation helper ───────────────────────────────────────────────────────
  /**
   * Returns { isValid, newInvalidFields, missingMessages }
   * Required fields (marked *): poQty, poNumber, labelType, supplier
   */
  const validatePODetails = (activeProducts) => {
    const newInvalidFields = {};
    const missingMessages  = [];

    activeProducts.forEach((product) => {
      const details     = productPODetails[product.id] || {};
      const productName = product.productName || `Product #${product.id}`;

      if (product.imlType === "LID & TUB") {
        const lid = details.lid || {};
        const tub = details.tub || {};
        const lidMissing = [];
        const tubMissing = [];

        // LID
        if (!lid.poQty)    { newInvalidFields[`${product.id}_lid_poQty`]    = true; lidMissing.push("PO Qty");     }
        if (!lid.poNumber) { newInvalidFields[`${product.id}_lid_poNumber`]  = true; lidMissing.push("PO Number"); }
        if (!lid.labelType){ newInvalidFields[`${product.id}_lid_labelType`] = true; lidMissing.push("Label Type");}
        if (!lid.supplier) { newInvalidFields[`${product.id}_lid_supplier`]  = true; lidMissing.push("Supplier");  }

        // TUB
        if (!tub.poQty)    { newInvalidFields[`${product.id}_tub_poQty`]    = true; tubMissing.push("PO Qty");     }
        if (!tub.poNumber) { newInvalidFields[`${product.id}_tub_poNumber`]  = true; tubMissing.push("PO Number"); }
        if (!tub.labelType){ newInvalidFields[`${product.id}_tub_labelType`] = true; tubMissing.push("Label Type");}
        if (!tub.supplier) { newInvalidFields[`${product.id}_tub_supplier`]  = true; tubMissing.push("Supplier");  }

        if (lidMissing.length) missingMessages.push(`${productName} (LID) → ${lidMissing.join(", ")}`);
        if (tubMissing.length) missingMessages.push(`${productName} (TUB) → ${tubMissing.join(", ")}`);
      } else {
        const missing = [];
        if (!details.poQty)    { newInvalidFields[`${product.id}_poQty`]    = true; missing.push("PO Qty");     }
        if (!details.poNumber) { newInvalidFields[`${product.id}_poNumber`]  = true; missing.push("PO Number"); }
        if (!details.labelType){ newInvalidFields[`${product.id}_labelType`] = true; missing.push("Label Type");}
        if (!details.supplier) { newInvalidFields[`${product.id}_supplier`]  = true; missing.push("Supplier");  }
        if (missing.length)    missingMessages.push(`${productName} → ${missing.join(", ")}`);
      }
    });

    return {
      isValid:          missingMessages.length === 0,
      newInvalidFields,
      missingMessages,
    };
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const isSingleProductFlow = mode === "single-product" && movedProductId;
    const activeProducts      = isSingleProductFlow
      ? order.products.filter((p) => p.id === movedProductId)
      : order.products.filter((p) => p.moveToPurchase);

    // ── Validate ──
    const { isValid, newInvalidFields, missingMessages } = validatePODetails(activeProducts);

    if (!isValid) {
      setInvalidFields(newInvalidFields);
      addToast(
        missingMessages,
        "error",
        "Required Fields Missing — Please fill in all details marked with * to save.",
        0   // 0 = stays until user dismisses
      );
      return;
    }

    // ── Save ──
    try {
      const storedPO    = localStorage.getItem(STORAGE_KEY_PO);
      const allPODetails = storedPO ? JSON.parse(storedPO) : {};

      allPODetails[order.id] = {
        orderId:     order.id,
        orderNumber: order.orderNumber,
        company:     order.contact.company,
        products:    productPODetails,
        updatedAt:   new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY_PO, JSON.stringify(allPODetails));

      // Update order status
      const storedOrdersStr = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (storedOrdersStr) {
        const allOrders     = JSON.parse(storedOrdersStr);
        const updatedOrders = allOrders.map((o) => {
          if (o.id !== order.id) return o;
          return {
            ...o,
            products: o.products.map((prod) => {
              if (isSingleProductFlow) return prod.id === movedProductId ? { ...prod, orderStatus: "PO Raised & Labels in Process" } : prod;
              return prod.moveToPurchase ? { ...prod, orderStatus: "PO Raised & Labels in Process" } : prod;
            }),
          };
        });
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders));
        isDirty.current = false;
        window.dispatchEvent(new Event("ordersUpdated"));
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            products: prev.products.map((prod) => {
              if (isSingleProductFlow) return prod.id === movedProductId ? { ...prod, orderStatus: "PO Raised & Labels in Process" } : prod;
              return prod.moveToPurchase ? { ...prod, orderStatus: "PO Raised & Labels in Process" } : prod;
            }),
          };
        });
      }

      setInvalidFields({});
      addToast("PO Details saved successfully!", "success", "Saved!", 3000);
      setTimeout(() => navigate("/iml/purchase", { state: { refreshOrders: true } }), 1200);
    } catch (err) {
      console.error("Error saving PO details:", err);
      addToast("Something went wrong while saving. Please try again.", "error", "Save Failed");
    }
  };

  // ── Leave guard helpers ─────────────────────────────────────────────────────
  const isPOEntered = () => {
    if (!order) return false;
    const isSingleProductFlow = mode === "single-product" && movedProductId;
    const activeProducts = isSingleProductFlow
      ? order.products.filter((p) => p.id === movedProductId)
      : order.products.filter((p) => p.moveToPurchase);
    return activeProducts.some((product) => {
      const d = productPODetails[product.id];
      if (!d) return false;
      if (product.imlType === "LID & TUB") return !!(d.lid?.poNumber || d.lid?.supplier || d.tub?.poNumber || d.tub?.supplier);
      return !!(d.poNumber || d.supplier);
    });
  };

  const hasSavedPO = () => {
    if (!order) return false;
    const isSingleProductFlow = mode === "single-product" && movedProductId;
    const activeProducts = isSingleProductFlow
      ? order.products.filter((p) => p.id === movedProductId)
      : order.products.filter((p) => p.moveToPurchase);
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PO);
      if (!raw) return false;
      const all      = JSON.parse(raw);
      const orderPO  = all[order.id];
      if (!orderPO?.products) return false;
      return activeProducts.some((p) => {
        const pd = orderPO.products[p.id];
        if (!pd) return false;
        if (p.imlType === "LID & TUB") return !!(pd.lid?.poNumber && pd.lid?.supplier);
        return !!(pd.poNumber && pd.supplier);
      });
    } catch { return false; }
  };

  // const handleBack = () => {
  //   if (!hasSavedPO() && isPOEntered() === true && order) {
  //     const isSingleProductFlow = mode === "single-product" && movedProductId;
  //     const activeProducts = isSingleProductFlow
  //       ? order.products.filter((p) => p.id === movedProductId)
  //       : order.products.filter((p) => p.moveToPurchase);
  //     if (activeProducts.length > 0) {
  //       setPendingLeaveAction("back");
  //       setShowLeaveModal(true);
  //       return;
  //     }
  //   }
  //   navigate("/iml/purchase", { state: { refreshOrders: true } });
  // };
  const handleBack = () => {
  if (isDirty.current) {
    setShowLeaveModal(true);
    return;
  }
  navigate("/iml/purchase", { state: { refreshOrders: true } });
};

  // ── Helper: field border class ──────────────────────────────────────────────
  const fieldClass = (baseClass, isInvalid) =>
    `${baseClass} ${isInvalid ? "border-red-500 bg-red-50 ring-1 ring-red-400" : ""}`;

  // ── Loading / no-order states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Order Data Found</h2>
          <button onClick={() => navigate("/iml/purchase")} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700">
            Back to Purchase Management
          </button>
        </div>
      </div>
    );
  }

  const purchaseProducts = order.products?.filter((p) => p.moveToPurchase) || [];

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* ── Toast stack ── */}
      <Toast toasts={toasts} removeToast={removeToast} />

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(2vw); }
          to   { opacity: 1; transform: translateX(0);   }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out both; }
      `}</style>

      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm pb-[.75vw]">

        {/* Header */}
        <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
          <button className="flex gap-[.5vw] items-center cursor-pointer hover:text-blue-600 transition-colors" onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[1vw] h-[1vw]">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw]">Back</span>
          </button>
          <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">Purchase Order Details</h1>
          <div className="w-[3vw]" />
        </div>

        <div className="px-[1.5vw] py-[1vw] max-h-[75vh] overflow-auto">

          {/* Order Information */}
          <div className="bg-white rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mb-[1vw]">
            <h3 className="text-[1vw] font-semibold text-blue-900 mb-[1vw]">Order Information</h3>
            <div className="grid grid-cols-4 gap-[1.5vw]">
              {[
                ["Order Number",   order.orderNumber],
                ["Company Name",   order.contact?.company],
                ["Contact Name",   order.contact?.contactName],
                ["Contact Number", order.contact?.phone],
              ].map(([label, val]) => (
                <div key={label}>
                  <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">{label}</label>
                  <div className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-gray-50 rounded-[0.5vw]">{val || "N/A"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product PO Details Table */}
          <div className="bg-white rounded-[0.6vw] border-2 border-purple-200 p-[1vw] mb-[1vw]">
            <h3 className="text-[1vw] font-semibold text-purple-900 mb-[1vw]">Product PO Details</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    {["S.No","Product","Size","IML Name","Type","Lid Order Qty","Tub Order Qty"].map((h) => (
                      <th key={h} className="border border-gray-300 px-[.85vw] py-[.75vw] text-left text-[.85vw] font-semibold">{h}</th>
                    ))}
                    <th className="border border-gray-300 px-[.85vw] py-[.75vw] text-left text-[.85vw] font-semibold min-w-[8vw]">PO Qty <span className="text-red-500">*</span></th>
                    <th className="border border-gray-300 px-[1.2vw] py-[.75vw] text-left text-[.85vw] font-semibold">PO Number <span className="text-red-500">*</span></th>
                    <th className="border border-gray-300 px-[1.2vw] py-[.75vw] text-left text-[.85vw] font-semibold">Label Type <span className="text-red-500">*</span></th>
                    <th className="border border-gray-300 px-[1.2vw] py-[.75vw] text-left text-[.85vw] font-semibold">Supplier <span className="text-red-500">*</span></th>
                    <th className="border border-gray-300 px-[.85vw] py-[.75vw] text-center text-[.85vw] font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseProducts.map((product, idx) => {
                    const details     = productPODetails[product.id] || {};
                    const quantityLid = product.imlType.includes("LID") ? product.lidLabelQty : "-";
                    const quantityTub = product.imlType.includes("TUB") ? product.tubLabelQty : "-";
                    const isLidTub    = product.imlType === "LID & TUB";

                    // Shorthand to get invalid flag
                    const inv = (part, field) =>
                      part
                        ? !!invalidFields[`${product.id}_${part}_${field}`]
                        : !!invalidFields[`${product.id}_${field}`];

                    return (
                      <tr key={product.id || idx} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw]">{idx + 1}</td>
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-medium">{product.productName}</td>
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw]">{product.size}</td>
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw]">{product.imlName}</td>
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw]">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">{product.imlType}</span>
                        </td>
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-semibold">{quantityLid}</td>
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-semibold">{quantityTub}</td>

                        {/* ── PO Qty ── */}
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-semibold">
                          {isLidTub ? (
                            <div className="flex flex-col gap-1">
                              {/* LID */}
                              <div className="flex flex-col gap-[0.2vw]">
                                <div className="flex gap-[0.5vw] items-center">
                                  <p className="text-[.8vw] font-semibold text-blue-700 min-w-[2.5vw]">LID:</p>
                                  <input
                                    type="number" placeholder="Qty" min="0"
                                    value={details.lid?.poQty || ""}
                                    disabled={sameAsOrderQty[`${product.id}_lid`]}
                                    onChange={(e) => updateProductField(product.id, "poQty", e.target.value, "lid")}
                                    className={fieldClass("border px-2 py-1 rounded text-sm w-[6vw] disabled:bg-gray-100", inv("lid","poQty"))}
                                  />
                                </div>
                                <label className="flex items-center gap-[0.3vw] cursor-pointer">
                                  <input type="checkbox" checked={sameAsOrderQty[`${product.id}_lid`] || false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSameAsOrderQty((prev) => ({ ...prev, [`${product.id}_lid`]: checked }));
                                      if (checked) updateProductField(product.id, "poQty", String(product.lidLabelQty || ""), "lid");
                                    }}
                                    className="accent-blue-600 cursor-pointer"
                                  />
                                  <span className="text-[.7vw] text-gray-500">Same as order qty</span>
                                </label>
                              </div>
                              {/* TUB */}
                              <div className="flex flex-col gap-[0.2vw]">
                                <div className="flex gap-[0.5vw] items-center">
                                  <p className="text-[.8vw] font-semibold text-orange-600 min-w-[2.5vw]">TUB:</p>
                                  <input
                                    type="number" placeholder="Qty" min="0"
                                    value={details.tub?.poQty || ""}
                                    disabled={sameAsOrderQty[`${product.id}_tub`]}
                                    onChange={(e) => updateProductField(product.id, "poQty", e.target.value, "tub")}
                                    className={fieldClass("border px-2 py-1 rounded text-sm w-[6vw] disabled:bg-gray-100", inv("tub","poQty"))}
                                  />
                                </div>
                                <label className="flex items-center gap-[0.3vw] cursor-pointer">
                                  <input type="checkbox" checked={sameAsOrderQty[`${product.id}_tub`] || false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSameAsOrderQty((prev) => ({ ...prev, [`${product.id}_tub`]: checked }));
                                      if (checked) updateProductField(product.id, "poQty", String(product.tubLabelQty || ""), "tub");
                                    }}
                                    className="accent-orange-500 cursor-pointer"
                                  />
                                  <span className="text-[.7vw] text-gray-500">Same as order qty</span>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-[0.2vw]">
                              <div className="flex gap-[0.5vw] items-center">
                                <p className="text-[.8vw] font-semibold text-gray-600 min-w-[2.5vw]">
                                  {product.imlType.includes("LID") ? "LID:" : "TUB:"}
                                </p>
                                <input
                                  type="number" placeholder="Qty" min="0"
                                  value={details.poQty || ""}
                                  disabled={sameAsOrderQty[`${product.id}_single`]}
                                  onChange={(e) => updateProductField(product.id, "poQty", e.target.value)}
                                  className={fieldClass("border px-2 py-1 rounded text-sm w-[6vw] disabled:bg-gray-100", inv(null,"poQty"))}
                                />
                              </div>
                              <label className="flex items-center gap-[0.3vw] cursor-pointer">
                                <input type="checkbox" checked={sameAsOrderQty[`${product.id}_single`] || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSameAsOrderQty((prev) => ({ ...prev, [`${product.id}_single`]: checked }));
                                    if (checked) {
                                      const qty = product.imlType.includes("LID") ? product.lidLabelQty : product.tubLabelQty;
                                      updateProductField(product.id, "poQty", String(qty || ""));
                                    }
                                  }}
                                  className="accent-blue-600 cursor-pointer"
                                />
                                <span className="text-[.7vw] text-gray-500">Same as order qty</span>
                              </label>
                            </div>
                          )}
                        </td>

                        {/* ── PO Number ── */}
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-semibold">
                          {isLidTub ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-[1vw] items-center">
                                <p className="min-w-[2.5vw] text-[.8vw]">LID:</p>
                                <input type="text" placeholder="PO # (Lid)"
                                  value={details.lid?.poNumber || ""}
                                  onChange={(e) => updateProductField(product.id, "poNumber", e.target.value, "lid")}
                                  className={fieldClass("border px-2 py-1 rounded text-sm", inv("lid","poNumber"))}
                                />
                              </div>
                              <div className="flex gap-[.7vw] items-center">
                                <p className="min-w-[2.5vw] text-[.8vw]">TUB:</p>
                                <input type="text" placeholder="PO # (Tub)"
                                  value={details.tub?.poNumber || ""}
                                  onChange={(e) => updateProductField(product.id, "poNumber", e.target.value, "tub")}
                                  className={fieldClass("border px-2 py-1 rounded text-sm", inv("tub","poNumber"))}
                                />
                              </div>
                              <label className="flex items-center gap-[0.4vw] mt-1 cursor-pointer">
                                <input type="checkbox" checked={syncTubWithLid[product.id] || false}
                                  onChange={(e) => handleSyncTubToggle(product.id, e.target.checked)}
                                  className="accent-blue-600 cursor-pointer"
                                />
                                <span className="text-[.75vw] text-gray-600 font-normal">Apply the same for TUB</span>
                              </label>
                            </div>
                          ) : (
                            <input type="text" placeholder="PO #"
                              value={details.poNumber || ""}
                              onChange={(e) => updateProductField(product.id, "poNumber", e.target.value)}
                              className={fieldClass("border px-2 py-1 rounded text-sm", inv(null,"poNumber"))}
                            />
                          )}
                        </td>

                        {/* ── Label Type ── */}
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-semibold">
                          {isLidTub ? (
                            <div className="flex flex-col gap-1 relative">
                              <div className="flex gap-[1vw] items-center">
                                <p className="min-w-[2.5vw] text-[.8vw]">LID:</p>
                                <input type="text" placeholder="Label Type (Lid)"
                                  value={details.lid?.labelType || ""}
                                  onChange={(e) => handleProductAutocomplete(product.id, "labelType", e.target.value, "lid")}
                                  className={fieldClass("border px-2 py-1 rounded text-sm", inv("lid","labelType"))}
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id && activeAutocomplete?.field === "labelType-lid" && (
                                <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto w-full top-[2.5vw]">
                                  {activeAutocomplete.options.map((opt, i) => (
                                    <div key={i} onClick={() => selectProductAutocomplete(product.id, "labelType", opt, "lid")} className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-sm">{opt}</div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-[.7vw] items-center">
                                <p className="min-w-[2.5vw] text-[.8vw]">TUB:</p>
                                <input type="text" placeholder="Label Type (Tub)"
                                  value={details.tub?.labelType || ""}
                                  onChange={(e) => handleProductAutocomplete(product.id, "labelType", e.target.value, "tub")}
                                  className={fieldClass("border px-2 py-1 rounded text-sm", inv("tub","labelType"))}
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id && activeAutocomplete?.field === "labelType-tub" && (
                                <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto w-full">
                                  {activeAutocomplete.options.map((opt, i) => (
                                    <div key={i} onClick={() => selectProductAutocomplete(product.id, "labelType", opt, "tub")} className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-sm">{opt}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input type="text" placeholder="Label Type"
                                value={details.labelType || ""}
                                onChange={(e) => handleProductAutocomplete(product.id, "labelType", e.target.value)}
                                className={fieldClass("border px-2 py-1 rounded text-sm", inv(null,"labelType"))}
                              />
                              {activeAutocomplete?.productId === product.id && activeAutocomplete?.field === "labelType" && (
                                <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto w-full">
                                  {activeAutocomplete.options.map((opt, i) => (
                                    <div key={i} onClick={() => selectProductAutocomplete(product.id, "labelType", opt)} className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-sm">{opt}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ── Supplier ── */}
                        <td className="border border-gray-300 px-[.85vw] py-[.75vw] text-[.85vw] font-semibold">
                          {isLidTub ? (
                            <div className="flex flex-col gap-1 relative">
                              <div className="flex gap-[1vw] items-center">
                                <p className="min-w-[2.5vw] text-[.8vw]">LID:</p>
                                <input type="text" placeholder="Supplier (Lid)"
                                  value={details.lid?.supplier || ""}
                                  onChange={(e) => handleProductAutocomplete(product.id, "supplier", e.target.value, "lid")}
                                  className={fieldClass("border px-2 py-1 rounded text-sm", inv("lid","supplier"))}
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id && activeAutocomplete?.field === "supplier-lid" && (
                                <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto w-full top-[2.5vw]">
                                  {activeAutocomplete.options.map((opt, i) => (
                                    <div key={i} onClick={() => selectProductAutocomplete(product.id, "supplier", opt, "lid")} className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-sm">{opt}</div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-[.7vw] items-center">
                                <p className="min-w-[2.5vw] text-[.8vw]">TUB:</p>
                                <input type="text" placeholder="Supplier (Tub)"
                                  value={details.tub?.supplier || ""}
                                  onChange={(e) => handleProductAutocomplete(product.id, "supplier", e.target.value, "tub")}
                                  className={fieldClass("border px-2 py-1 rounded text-sm", inv("tub","supplier"))}
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id && activeAutocomplete?.field === "supplier-tub" && (
                                <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto w-full">
                                  {activeAutocomplete.options.map((opt, i) => (
                                    <div key={i} onClick={() => selectProductAutocomplete(product.id, "supplier", opt, "tub")} className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-sm">{opt}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input type="text" placeholder="Supplier"
                                value={details.supplier || ""}
                                onChange={(e) => handleProductAutocomplete(product.id, "supplier", e.target.value)}
                                className={fieldClass("border px-2 py-1 rounded text-sm", inv(null,"supplier"))}
                              />
                              {activeAutocomplete?.productId === product.id && activeAutocomplete?.field === "supplier" && (
                                <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto w-full">
                                  {activeAutocomplete.options.map((opt, i) => (
                                    <div key={i} onClick={() => selectProductAutocomplete(product.id, "supplier", opt)} className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-sm">{opt}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="border border-gray-300 px-[.5vw] py-[.5vw] text-center">
                          <button onClick={() => handleViewProduct(product)} className="px-[0.75vw] py-[0.35vw] bg-indigo-600 text-white rounded hover:bg-indigo-700 text-[.8vw] font-medium cursor-pointer transition-all">
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Apply to All */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-300 p-[1vw] mb-[1vw]">
            <div className="flex justify-between items-center mb-[1vw]">
              <h3 className="text-[1vw] font-semibold text-amber-900">🎯 Apply to All Products</h3>
              <button onClick={handleApplyToAll} className="px-[1.2vw] py-[.5vw] bg-amber-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:bg-amber-700 transition-all shadow-md cursor-pointer">
                Apply to All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[1.5vw]">
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">PO Number</label>
                <input type="text" placeholder="Enter PO Number" value={globalPONumber} onChange={(e) => setGlobalPONumber(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="relative" ref={globalLabelRef}>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">Label Type</label>
                <input type="text" placeholder="Enter or Select" value={globalLabelType} onChange={(e) => handleGlobalLabelInput(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showGlobalLabelSuggestions && filteredGlobalLabels.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                    {filteredGlobalLabels.map((type, i) => (
                      <div key={i} onClick={() => { setGlobalLabelType(type); setShowGlobalLabelSuggestions(false); }} className="px-[1vw] py-[0.6vw] hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                        <p className="text-[.85vw] font-medium text-gray-800">{type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={globalSupplierRef}>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">Supplier Name</label>
                <input type="text" placeholder="Enter or Select" value={globalSupplier} onChange={(e) => handleGlobalSupplierInput(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showGlobalSupplierSuggestions && filteredGlobalSuppliers.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                    {filteredGlobalSuppliers.map((s, i) => (
                      <div key={i} onClick={() => { setGlobalSupplier(s); setShowGlobalSupplierSuggestions(false); }} className="px-[1vw] py-[0.6vw] hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                        <p className="text-[.85vw] font-medium text-gray-800">{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex justify-end gap-[1vw] mt-[1.25vw]">
            <button onClick={handleBack} className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSubmit} className="px-[1.5vw] py-[.6vw] bg-green-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:bg-green-700 transition-all shadow-md cursor-pointer">
              Save PO Details
            </button>
          </div>
        </div>
      </div>

      {/* ── View Product Modal ── */}
      {viewingProduct && (() => {
        const hasLidQty = viewingProduct.lidLabelQty && viewingProduct.lidLabelQty > 0;
        const hasTubQty = viewingProduct.tubLabelQty && viewingProduct.tubLabelQty > 0;
        const showBoth  = hasLidQty && hasTubQty;
        return (
          <div className="fixed inset-0 bg-[#00000096] flex items-center justify-center z-50 p-[2vw]">
            <div className="bg-white rounded-[0.8vw] shadow-2xl max-w-[50vw] w-full max-h-[85vh] overflow-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-[1.5vw] py-[1vw] rounded-t-[0.8vw] flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-[1.3vw] font-bold">Product Full Details</h2>
                <button onClick={closeViewModal} className="text-white hover:text-gray-200 text-[1.5vw] font-bold cursor-pointer w-[2vw] h-[2vw] flex items-center justify-center rounded-full hover:bg-white/20 transition-all">×</button>
              </div>
              <div className="p-[1.5vw]">
                {/* Product Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mb-[1vw]">
                  <h3 className="text-[1vw] font-semibold text-blue-900 mb-[1vw]">📦 Product Information</h3>
                  <div className="grid grid-cols-2 gap-[1vw]">
                    {[["Product Category", viewingProduct.productName], ["Size", viewingProduct.size]].map(([l, v]) => (
                      <div key={l}><label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">{l}</label><div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">{v}</div></div>
                    ))}
                    <div><label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">IML Name</label><div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800">{viewingProduct.imlName}</div></div>
                    <div><label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">IML Type</label><div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-semibold text-blue-800">{viewingProduct.imlType}</div></div>
                  </div>
                </div>
                {/* Qty */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw] mb-[1vw]">
                  <h3 className="text-[1vw] font-semibold text-green-900 mb-[1vw]">📊 Quantity Information</h3>
                  {showBoth ? (
                    <div className="space-y-[1vw]">
                      {[["LID","lid","bg-green-600",viewingProduct.lidLabelQty,viewingProduct.lidProductionQty,viewingProduct.lidStock,productPODetails[viewingProduct.id]?.lid?.poQty],
                        ["TUB","tub","bg-blue-600",viewingProduct.tubLabelQty,viewingProduct.tubProductionQty,viewingProduct.tubStock,productPODetails[viewingProduct.id]?.tub?.poQty]].map(([label,_,bg,lq,pq,st,poq]) => (
                        <div key={label}>
                          <h4 className="text-[.9vw] font-semibold text-green-800 mb-[0.5vw]"><span className={`${bg} text-white px-2 py-0.5 rounded text-[.75vw]`}>{label}</span></h4>
                          <div className="grid grid-cols-4 gap-[1vw]">
                            {[["Label Order Qty",lq,"text-green-700"],["PO Qty",poq,"text-indigo-700"],["Production Qty",pq,"text-blue-700"],["Remaining Stock",st,"text-orange-700"]].map(([l,v,c]) => (
                              <div key={l}><label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">{l}</label><div className={`text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold ${c}`}>{v || "0"}</div></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-[1vw]">
                      {[[hasLidQty ? "LID Label Order Qty" : "TUB Label Order Qty", hasLidQty ? viewingProduct.lidLabelQty : viewingProduct.tubLabelQty,"text-green-700"],
                        ["PO Qty", productPODetails[viewingProduct.id]?.poQty,"text-indigo-700"],
                        [hasLidQty ? "LID Production Qty" : "TUB Production Qty", hasLidQty ? viewingProduct.lidProductionQty : viewingProduct.tubProductionQty,"text-blue-700"],
                        [hasLidQty ? "LID Remaining Stock" : "TUB Remaining Stock", hasLidQty ? viewingProduct.lidStock : viewingProduct.tubStock,"text-orange-700"]].map(([l,v,c]) => (
                        <div key={l}><label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">{l}</label><div className={`text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold ${c}`}>{v || "0"}</div></div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Colors */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[0.6vw] border-2 border-pink-200 p-[1vw] mb-[1vw]">
                  <h3 className="text-[1vw] font-semibold text-pink-900 mb-[1vw]">🎨 Color Information</h3>
                  <div className="grid grid-cols-2 gap-[1vw]">
                    {[["LID Color", viewingProduct.lidColor], ["TUB Color", viewingProduct.tubColor]].map(([l, v]) => (
                      <div key={l}><label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">{l}</label><span className="text-[.85vw] font-semibold capitalize bg-white px-[1vw] py-[.25vw] border border-gray-200 rounded">{v || "N/A"}</span></div>
                    ))}
                  </div>
                </div>
                {/* PO Details */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
                  <h3 className="text-[1vw] font-semibold text-amber-900 mb-[1vw]">📋 Purchase Order Details</h3>
                  {viewingProduct.imlType === "LID & TUB" ? (
                    <div className="space-y-[1vw]">
                      {["lid","tub"].map((part) => (
                        <div key={part}>
                          <h4 className="text-[.9vw] font-semibold text-amber-800 mb-[0.5vw]">{part.toUpperCase()}</h4>
                          <div className="grid grid-cols-4 gap-[1vw]">
                            {[["PO Number","poNumber"],["PO Qty","poQty"],["Label Type","labelType"],["Supplier","supplier"]].map(([l, k]) => (
                              <div key={l}><label className="block text-[.75vw] text-gray-500 mb-[0.2vw]">{l}</label><div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">{productPODetails[viewingProduct.id]?.[part]?.[k] || "Not Set"}</div></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-[1vw]">
                      {[["PO Number","poNumber"],["PO Qty","poQty"],["Label Type","labelType"],["Supplier","supplier"]].map(([l, k]) => (
                        <div key={l}><label className="block text-[.75vw] text-gray-500 mb-[0.2vw]">{l}</label><div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">{productPODetails[viewingProduct.id]?.[k] || "Not Set"}</div></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-[1.5vw] py-[1vw] bg-gray-50 rounded-b-[0.8vw] flex justify-end border-t border-gray-200">
                <button onClick={closeViewModal} className="px-[1.5vw] py-[.6vw] bg-gray-600 text-white rounded-[0.5vw] font-semibold text-[.9vw] hover:bg-gray-700 transition-all cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Leave Modal ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-[#00000096] flex items-center justify-center z-[9999] p-[2vw]">
          <div className="bg-white rounded-[0.8vw] shadow-2xl w-full max-w-[40vw] overflow-hidden">
            <div className="bg-orange-500 text-white px-[1.5vw] py-[1vw] rounded-t-[0.8vw]">
              <h2 className="text-[1.1vw] font-bold">⚠️ PO Details Not Entered</h2>
            </div>
            <div className="px-[1.5vw] py-[1.2vw]">
              <p className="text-[.95vw] text-gray-900 font-semibold mb-[0.5vw]">PO details have not been entered for this product.</p>
              <p className="text-[.85vw] text-gray-700">The product has been moved to Purchase Management, but the Purchase Order information has not been saved yet. Do you still want to go back?</p>
            </div>
            <div className="px-[1.5vw] py-[1vw] bg-gray-50 border-t border-gray-200 flex gap-[1vw] justify-end">
              <button onClick={() => setShowLeaveModal(false)} className="px-[1.5vw] py-[.6vw] bg-gray-300 hover:bg-gray-500 text-gray-700 hover:text-white rounded-[0.5vw] font-semibold text-[.9vw] cursor-pointer transition-all">Stay & Enter PO Details</button>
              <button onClick={() => { setShowLeaveModal(false); navigate("/iml/purchase", { state: { refreshOrders: true } }); }} className="px-[1.5vw] py-[.6vw] bg-amber-600 hover:bg-amber-700 text-white rounded-[0.5vw] font-semibold text-[.9vw] cursor-pointer transition-all">Go Back Without Saving</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PO Selection Modal ── */}
      {poSelectionModal && (
        <div className="fixed inset-0 bg-[#00000096] flex items-center justify-center z-50 p-[2vw]">
          <div className="bg-white rounded-[0.8vw] shadow-2xl w-full max-w-[55vw] max-h-[85vh] overflow-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-[1.5vw] py-[1vw] rounded-t-[0.8vw] flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-[1.2vw] font-bold">📋 Multiple PO Details Found</h2>
              <button onClick={() => setPOSelectionModal(null)} className="text-white hover:text-gray-200 text-[1.5vw] font-bold cursor-pointer w-[2vw] h-[2vw] flex items-center justify-center rounded-full hover:bg-white/20 transition-all">×</button>
            </div>
            <div className="px-[1.5vw] py-[1.2vw]">
              <p className="text-[.9vw] text-gray-700 mb-[0.4vw]">Multiple products already have different PO details. Select which PO Number &amp; Supplier you want to apply.</p>
              <p className="text-[.8vw] text-gray-500 mb-[1.2vw]">Note: Label type will <span className="font-semibold text-red-500">NOT</span> be copied.</p>
              <div className="space-y-[0.8vw]">
                {poSelectionModal.sourceOptions.map((option, i) => (
                  <div key={i} className="border-2 border-gray-200 rounded-[0.6vw] p-[1vw] hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                    onClick={() => { applySourcePOToAll({ poNumber: option.poNumber, supplier: option.supplier }, poSelectionModal.orderRef); setPOSelectionModal(null); }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[1.5vw]">
                        <div className="w-[2vw] h-[2vw] rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-[.85vw]">{i + 1}</div>
                        <div><p className="text-[.75vw] text-gray-500">From product</p><p className="text-[.9vw] font-semibold text-gray-800">{option.name}</p></div>
                        <div className="w-px h-[2.5vw] bg-gray-200" />
                        <div><p className="text-[.75vw] text-gray-500">PO Number</p><p className="text-[.9vw] font-bold text-blue-700">{option.poNumber}</p></div>
                        <div className="w-px h-[2.5vw] bg-gray-200" />
                        <div><p className="text-[.75vw] text-gray-500">Supplier</p><p className="text-[.9vw] font-bold text-indigo-700">{option.supplier}</p></div>
                      </div>
                      <div className="px-[1vw] py-[0.4vw] bg-blue-600 text-white rounded-[0.4vw] text-[.8vw] font-semibold group-hover:bg-blue-700 transition-all">Apply This</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-[1.5vw] py-[1vw] bg-gray-50 rounded-b-[0.8vw] flex justify-end border-t border-gray-200">
              <button onClick={() => setPOSelectionModal(null)} className="px-[1.5vw] py-[.6vw] bg-gray-500 text-white rounded-[0.5vw] font-semibold text-[.9vw] hover:bg-gray-600 transition-all cursor-pointer">Skip / Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PODetails;