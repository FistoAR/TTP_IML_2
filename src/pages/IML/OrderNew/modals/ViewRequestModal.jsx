// Auto-extracted from OrdersManagement.jsx
import { useState, useEffect } from "react";

const STORAGE_KEY = "imlorders";

export default function ViewRequestModal({ orders, setOrders, setViewRequestModal, viewRequestModal }) {
  // ✅ ADD LOCAL STATE for immediate updates
  const [localOrders, setLocalOrders] = useState(orders);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    // Sync with parent orders
    setLocalOrders(orders);
  }, [orders]);

  if (
    !viewRequestModal.isOpen ||
    !viewRequestModal.order
  ) {
    return null;
  }

  const { order, product: modalProduct } = viewRequestModal;
  const isOrderLevel = !modalProduct; // true when opened from order card

  // ✅ SAFER LOOKUP with fallback
  const currentOrder = localOrders.find((o) => o.id === order.id);

  // For order-level: collect all products with change requests
  // For product-level: single product as before
  const productsWithRequests = isOrderLevel
    ? (currentOrder?.products || []).filter(p => p.changeRequests && p.changeRequests.length > 0)
    : [];

  const currentProduct = isOrderLevel
    ? null
    : (currentOrder?.products?.find((p) => p.id === modalProduct.id) || modalProduct);

  // ✅ EARLY GUARD
  if (!isOrderLevel && !currentProduct) {
    return null;
  }

  const changeRequests = isOrderLevel
    ? [] // not used in order-level mode
    : (currentProduct.changeRequests || []).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

  // ✅ Remarks modal state
  const [remarksModal, setRemarksModal] = useState({
    isOpen: false,
    requestIndex: -1,
    action: "",
  });
  // Accordion: all products open by default
  const [expandedProducts, setExpandedProducts] = useState(() =>
    Object.fromEntries((productsWithRequests || []).map(p => [p.id, true]))
  );
  const toggleProduct = (prodId) =>
    setExpandedProducts(prev => ({ ...prev, [prodId]: !prev[prodId] }));
  const [remarks, setRemarks] = useState("");
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    requestIndex: -1,
  });

  console.log(`Current Product: ${JSON.stringify(currentProduct, null, 2)}`);

  console.log(
    `Revised estimate : ${JSON.stringify(currentProduct?.revisedEstimate, null, 2)}`,
  );
  console.log(
    `Estimated number: ${currentProduct?.revisedEstimate?.estimatedNumber}`,
  );
  console.log(
    `Estimated value: ${currentProduct?.revisedEstimate?.estimatedValue}`,
  );

  // ✅ Compute targetProduct at component level so it's available in JSX render too
  const targetProductId = remarksModal.productId || currentProduct?.id;
  const targetProduct = isOrderLevel
    ? (currentOrder?.products?.find(p => p.id === targetProductId) || currentProduct)
    : currentProduct;

  // ✅ UPDATED handleAction - uses local state
  const handleAction = (requestIndex, action) => {
    setRemarksModal({
      isOpen: true,
      requestIndex,
      action,
    });
    setRemarks("");
  };

  const submitRemarks = () => {
    const requestIndex = remarksModal.requestIndex;
    const action = remarksModal.action;
    const targetChangeRequests = targetProduct?.changeRequests || [];
    const request = targetChangeRequests[requestIndex];

    // ✅ EARLY GUARDS
    if (!request) {
      alert("Invalid request");
      return;
    }

    let updatedOrders = localOrders.map((o) =>
      o.id === order.id
        ? {
          ...o,
          products: o.products.map((p) =>
            p.id === targetProduct.id
              ? {
                ...p,
                changeRequests: p.changeRequests.map((req, idx) =>
                  idx === requestIndex
                    ? {
                      ...req,
                      status: action.toUpperCase(),
                      remarks: remarks,
                      processedAt: new Date().toISOString(),
                    }
                    : req,
                ),
              }
              : p,
          ),
        }
        : o,
    );

    // ✅ SPECIAL HANDLING FOR ACTIONS
    if (action === "accept") {
      if (request.type === "delete") {
        // ✅ DELETE PRODUCT FROM ORDER + CREATE DRAFT INVOICE
        updatedOrders = localOrders.map((o) =>
          o.id === order.id
            ? {
              ...o,
              orderEstimate: {
                ...o.orderEstimate,
                estimatedNumber:
                  request.revisedEstimate?.estimatedNumber ||
                  o.orderEstimate.estimatedNumber,
                estimatedValue: parseInt(
                  request.revisedEstimate?.estimatedValue ||
                  o.orderEstimate.estimatedValue,
                ),
              },
              products: o.products.filter(
                (p) => p.id !== targetProduct.id,
              ),
              invoices: [
                ...(o.invoices || []),
                {
                  id: `INV-${Date.now()}`,
                  productId: targetProduct.id,
                  productName:
                    targetProduct.productName ||
                    targetProduct.productName,
                  size: targetProduct.size || targetProduct.size,
                  invoiceNo: invoiceNumber,
                  invoiceDate: new Date().toISOString(),
                  amount:
                    currentProduct.budget || currentProduct.budget || 0,
                  imlName: targetProduct.imlName || targetProduct.imlName,
                  imlType: targetProduct.imlType || targetProduct.imlType,
                  lidColor: targetProduct.lidColor || targetProduct.lidColor,
                  reason: "Product Deleted",
                  remarks: remarks,
                  status: "Draft",
                },
              ],
            }
            : o,
        );
      } else {
        // ✅ APPLY CHANGE REQUEST TO PRODUCT (USE CURRENT PRODUCT)
        const changes = request.requestedChanges || {};
        updatedOrders = localOrders.map((o) =>
          o.id === order.id
            ? {
              ...o,
              orderEstimate: {
                ...o.orderEstimate,
                estimatedNumber:
                  request.revisedEstimate?.estimatedNumber ||
                  o.orderEstimate.estimatedNumber,
                estimatedValue: parseInt(
                  request.revisedEstimate?.estimatedValue ||
                  o.orderEstimate.estimatedValue,
                ),
              },
              products: o.products.map((p) =>
                p.id === targetProduct.id
                  ? {
                    ...p,
                    orderStatus: "PO Raised & Labels in Process",
                    productName: changes.productName || p.productName,
                    size: changes.size || p.size,
                    imlName: changes.imlName || p.imlName,
                    imlType: changes.imlType || p.imlType,
                    lidColor: changes.lidColor || p.lidColor,
                    tubColor: changes.tubColor || p.tubColor,
                    lidLabelQty:
                      changes.lidLabelQty !== undefined
                        ? changes.lidLabelQty
                        : p.lidLabelQty,
                    lidProductionQty:
                      changes.lidProductionQty !== undefined
                        ? changes.lidProductionQty
                        : p.lidProductionQty,
                    tubLabelQty:
                      changes.tubLabelQty !== undefined
                        ? changes.tubLabelQty
                        : p.tubLabelQty,
                    tubProductionQty:
                      changes.tubProductionQty !== undefined
                        ? changes.tubProductionQty
                        : p.tubProductionQty,
                    changeRequests: p.changeRequests.map((req, idx) =>
                      idx === requestIndex
                        ? {
                          ...req,
                          status: "ACCEPTED",
                          remarks: remarks,
                          processedAt: new Date().toISOString(),
                        }
                        : req,
                    ),
                  }
                  : p,
              ),
            }
            : o,
        );
      }

      // ✅ UPDATE LOCAL STATE IMMEDIATELY
      setLocalOrders(updatedOrders);

      // ✅ Save to parent + localStorage
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));

      if (action === "accept") {
        if (request.type === "delete") {
          alert("Product deleted!!");
          setViewRequestModal({ isOpen: false, order: null, product: null });
        }
      }
    } else {
      // ✅ DECLINE - Update request status AND set orderStatus to PO Raised
      updatedOrders = localOrders.map((o) =>
        o.id === order.id
          ? {
            ...o,
            products: o.products.map((p) =>
              p.id === targetProduct.id
                ? {
                  ...p,
                  orderStatus: "PO Raised & Labels in Process",
                  changeRequests: p.changeRequests.map((req, idx) =>
                    idx === requestIndex
                      ? {
                        ...req,
                        status: "DECLINED",
                        remarks: remarks,
                        processedAt: new Date().toISOString(),
                      }
                      : req,
                  ),
                }
                : p,
            ),
          }
          : o,
      );
      setLocalOrders(updatedOrders);
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));
    }

    // Close remarks
    setRemarksModal({ isOpen: false, requestIndex: -1, action: "" });

    setRemarks("");
  };

  // ✅ Helper to get changed fields
  const getChangedFields = (request) => {
    const changes = request.requestedChanges || {};
    const fields = [];

    // ✅ EXISTING FIELDS (keep all)
    if (changes.productName)
      fields.push(`Product Name: ${changes.productName}`);
    if (changes.size) fields.push(`Size: ${changes.size}`);
    if (changes.imlName) fields.push(`IML Name: ${changes.imlName}`);
    if (changes.imlType) fields.push(`IML Type: ${changes.imlType}`);
    if (changes.lidColor) fields.push(`LID Color: ${changes.lidColor}`);
    if (changes.tubColor) fields.push(`TUB Color: ${changes.tubColor}`);
    if (changes.lidLabelQty !== undefined)
      fields.push(`LID Label Qty: ${changes.lidLabelQty}`);
    if (changes.lidProductionQty !== undefined)
      fields.push(`LID Prod Qty: ${changes.lidProductionQty}`);
    if (changes.tubLabelQty !== undefined)
      fields.push(`TUB Label Qty: ${changes.tubLabelQty}`);
    if (changes.tubProductionQty !== undefined)
      fields.push(`TUB Prod Qty: ${changes.tubProductionQty}`);

    // 🔥 NEW: DESIGN FILE CHANGES
    if (changes.lidDesignFile) {
      fields.push(
        `LID Design: ${changes.lidDesignFile.name} (${Math.round(changes.lidDesignFile.size / 1024)}KB)`,
      );
    }
    if (changes.tubDesignFile) {
      fields.push(
        `TUB Design: ${changes.tubDesignFile.name} (${Math.round(changes.tubDesignFile.size / 1024)}KB)`,
      );
    }
    if (changes.lidSelectedOldDesign)
      fields.push(`LID Old Design: ${changes.lidSelectedOldDesign}`);
    if (changes.tubSelectedOldDesign)
      fields.push(`TUB Old Design: ${changes.tubSelectedOldDesign}`);

    return fields.length > 0 ? fields : ["No specific changes recorded"];
  };

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50001] flex items-center justify-center p-[1.5vw]">
      <div className="bg-white rounded-[1vw] max-w-[60vw] w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-300 bg-gray-50">
          <h2 className="text-[1.25vw] font-semibold text-gray-800">
            {isOrderLevel
              ? `Change Requests - Order ${currentOrder?.orderNumber || order.id}`
              : `Change Request History - ${currentProduct.productName} ${currentProduct.size}`}
          </h2>
          <button
            onClick={() =>
              setViewRequestModal({
                isOpen: false,
                order: null,
                product: null,
              })
            }
            className="text-gray-500 hover:text-gray-800 text-[2vw] font-bold cursor-pointer"
          >
            ×
            
          </button>
        </div>

        <div className="p-[1.5vw] space-y-[1vw]">
          {/* ✅ Company Details Header */}
          <div className="bg-blue-50 p-[1vw] rounded-[0.5vw] border border-blue-200 mb-[0.5vw]">
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <span className="text-[0.7vw] text-gray-500 block font-medium uppercase tracking-wider mb-[0.2vw]">
                  Company
                </span>
                <span className="text-[1vw] font-bold text-blue-900 border-l-2 border-blue-300 pl-[0.5vw] block leading-tight">
                  {currentOrder?.contact?.company || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[0.7vw] text-gray-500 block font-medium uppercase tracking-wider mb-[0.2vw]">
                  Contact Person
                </span>
                <span className="text-[1vw] font-semibold text-gray-800 border-l-2 border-gray-300 pl-[0.5vw] block leading-tight">
                  {currentOrder?.contact?.contactName || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[0.7vw] text-gray-500 block font-medium uppercase tracking-wider mb-[0.2vw]">
                  Phone
                </span>
                <span className="text-[1vw] font-semibold text-gray-800 border-l-2 border-gray-300 pl-[0.5vw] block leading-tight">
                  {currentOrder?.contact?.phone || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* ORDER-LEVEL: Show all products with their requests */}
          {isOrderLevel ? (
            productsWithRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-[2vw] text-[1vw]">
                No change requests found for this order.
              </p>
            ) : (
              <div className="space-y-[1.5vw] max-h-[70vh] overflow-y-auto pt-[1vw] pb-[3.25vw]">
                {productsWithRequests.map((prod) => {
                  const prodRequests = (prod.changeRequests || []).sort(
                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
                  );
                  const pendingProdCount = prodRequests.filter(r => !r.status || (r.status !== "ACCEPTED" && r.status !== "DECLINED")).length;
                  return (
                    <div key={prod.id} className="border-2 border-purple-200 rounded-[0.75vw] overflow-hidden">
                      {/* ── Accordion header ── */}
                      <div
                        className="bg-purple-50 px-[1.25vw] py-[0.75vw] border-b border-purple-200 flex items-center justify-between cursor-pointer select-none hover:bg-purple-100 transition-colors"
                        onClick={() => toggleProduct(prod.id)}
                      >
                        <div className="flex items-center gap-[0.6vw]">
                          <svg
                            className={`w-[0.9vw] h-[0.9vw] text-purple-500 flex-shrink-0 transition-transform duration-200 ${expandedProducts[prod.id] ? "rotate-180" : "rotate-0"}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className="text-[1vw] font-bold text-purple-900">{prod.productName} — {prod.size}</span>
                          <span className="text-[0.8vw] text-gray-500">{prod.imlType}</span>
                        </div>
                        <div className="flex items-center gap-[0.6vw]">
                          {pendingProdCount > 0 && (
                            <span className="bg-red-500 text-white text-[0.75vw] font-bold px-[0.6vw] py-[0.2vw] rounded-full">
                              {pendingProdCount} Pending
                            </span>
                          )}
                          <span className="text-[0.72vw] text-purple-400">
                            {prodRequests.length} request{prodRequests.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {/* ── Accordion body ── */}
                      <div className={`overflow-hidden transition-all duration-200 ${expandedProducts[prod.id] ? "max-h-[9999px]" : "max-h-0"}`}>
                      <div className="p-[1vw] space-y-[1vw] bg-white">
                        {prodRequests.map((request, index) => {
                          const realIndex = prod.changeRequests.indexOf(request);
                          const orig = request.originalDetails || {};
                          const changes = request.requestedChanges || {};
                          // Build changed fields list (text-only, skip file objects)
                          const changedFields = Object.entries(changes)
                            .filter(([k, v]) => v !== null && v !== undefined && typeof v !== "object")
                            .map(([k, v]) => {
                              const labels = {
                                productName: "Product Name",
                                size: "Size",
                                imlName: "IML Name",
                                imlType: "IML Type",
                                lidColor: "LID Color",
                                tubColor: "TUB Color",
                                lidLabelQty: "LID Label Qty",
                                lidProductionQty: "LID Prod Qty",
                                tubLabelQty: "TUB Label Qty",
                                tubProductionQty: "TUB Prod Qty",
                              };
                              return { label: labels[k] || k, value: v };
                            });
                          return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-[0.5vw] p-[1.25vw] bg-gray-50 hover:shadow-md transition-all"
                          >
                            {/* Header row: badge + timestamp */}
                            <div className="flex justify-between items-start mb-[1vw]">
                              <span className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.85vw] font-bold ${
                                request.status === "ACCEPTED" ? "bg-green-100 text-green-800"
                                : request.status === "DECLINED" ? "bg-red-100 text-red-800"
                                : request.type === "delete" ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                              }`}>
                                {request.type === "delete" ? "DELETE REQUEST" : "CHANGE REQUEST"}
                                {request.status && ` — ${request.status}`}
                              </span>
                              <span className="text-[0.8vw] text-gray-400">
                                {request.timestamp ? new Date(request.timestamp).toLocaleString() : ""}
                              </span>
                            </div>

                            {/* Original Details + Requested Changes - side by side */}
                            {request.type !== "delete" && (
                              <div className="grid grid-cols-2 gap-[1vw] mb-[1vw]">
                                {/* Original Details */}
                                <div className="bg-white border border-gray-200 rounded-[0.5vw] p-[1vw]">
                                  <h4 className="text-[0.85vw] font-bold text-gray-700 mb-[0.6vw] border-b pb-[0.3vw]">Original Details</h4>
                                  <div className="space-y-[0.3vw] text-[0.82vw] text-gray-700">
                                    {(orig.imlName || prod.imlName) && <p><strong>IML Name:</strong> {orig.imlName || prod.imlName}</p>}
                                    {(orig.lidColor || prod.lidColor) && <p><strong>LID Color:</strong> {orig.lidColor || prod.lidColor}</p>}
                                    {(orig.tubColor || prod.tubColor) && <p><strong>TUB Color:</strong> {orig.tubColor || prod.tubColor}</p>}
                                    {(orig.imlType || prod.imlType) && <p><strong>IML Type:</strong> {orig.imlType || prod.imlType}</p>}
                                    {(orig.lidLabelQty || prod.lidLabelQty) && <p><strong>LID Label Qty:</strong> {orig.lidLabelQty ?? prod.lidLabelQty}</p>}
                                    {(orig.tubLabelQty || prod.tubLabelQty) && <p><strong>TUB Label Qty:</strong> {orig.tubLabelQty ?? prod.tubLabelQty}</p>}
                                    {(orig.lidProductionQty || prod.lidProductionQty) && <p><strong>LID Prod Qty:</strong> {orig.lidProductionQty ?? prod.lidProductionQty}</p>}
                                    {(orig.tubProductionQty || prod.tubProductionQty) && <p><strong>TUB Prod Qty:</strong> {orig.tubProductionQty ?? prod.tubProductionQty}</p>}
                                  </div>
                                </div>

                                {/* Requested Changes */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-[0.5vw] p-[1vw]">
                                  <h4 className="text-[0.85vw] font-bold text-indigo-700 mb-[0.6vw] border-b border-indigo-200 pb-[0.3vw]">Requested Changes</h4>
                                  <div className="space-y-[0.3vw] text-[0.82vw]">
                                    {changedFields.map((f, i) => (
                                      <p key={i} className="bg-indigo-100 px-[0.5vw] py-[0.25vw] rounded text-indigo-900 font-medium">
                                        {f.label}: {f.value}
                                      </p>
                                    ))}
                                    {(changes.lidDesignFile || changes.tubDesignFile) && (
                                      <p className="bg-indigo-100 px-[0.5vw] py-[0.25vw] rounded text-indigo-900 font-medium">
                                        📎 Design file(s) attached
                                      </p>
                                    )}
                                    {request.revisedEstimate && (
                                      <div className="mt-[0.5vw] pt-[0.5vw] border-t border-indigo-200 text-[0.82vw] font-medium text-gray-800 space-y-[0.2vw]">
                                        <p>Revised Estimated No: {request.revisedEstimate.estimatedNumber}</p>
                                        <p>Revised Estimated Value: {request.revisedEstimate.estimatedValue}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* DELETE REQUEST details */}
                            {request.type === "delete" && (
                              <div className="bg-red-50 border border-red-200 p-[1vw] rounded-[0.5vw] mb-[0.75vw]">
                                <h4 className="font-semibold text-red-800 mb-[0.5vw] text-[0.9vw]">Product to Delete:</h4>
                                <div className="grid grid-cols-2 gap-[0.5vw] text-[0.82vw] text-gray-700">
                                  <p><strong>Product:</strong> {prod.productName} {prod.size}</p>
                                  <p><strong>IML Name:</strong> {prod.imlName}</p>
                                  <p><strong>IML Type:</strong> {prod.imlType}</p>
                                  <p><strong>LID Color:</strong> {prod.lidColor}</p>
                                  <p><strong>TUB Color:</strong> {prod.tubColor}</p>
                                  {request.revisedEstimate && (
                                    <>
                                      <p><strong>Revised Est. No:</strong> {request.revisedEstimate.estimatedNumber}</p>
                                      <p><strong>Revised Est. Value:</strong> {request.revisedEstimate.estimatedValue}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Remarks (if processed) */}
                            {request.remarks && (
                              <div className="text-[0.82vw] text-gray-600 bg-yellow-50 px-[0.75vw] py-[0.4vw] rounded border border-yellow-200 mb-[0.5vw]">
                                <strong>Remarks:</strong> {request.remarks}
                              </div>
                            )}

                            {/* Accept / Decline buttons */}
                            {(!request.status || (request.status !== "ACCEPTED" && request.status !== "DECLINED")) && (
                              <div className="flex gap-[0.75vw] mt-[0.75vw] pt-[0.75vw] border-t border-gray-200">
                                <button
                                  onClick={() => {
                                    setRemarksModal({ isOpen: true, requestIndex: realIndex, action: "accept", productId: prod.id });
                                    setRemarks("");
                                  }}
                                  className="flex-1 px-[1vw] py-[0.5vw] bg-green-600 text-white rounded-[0.4vw] text-[0.82vw] font-bold hover:bg-green-700 cursor-pointer transition-all shadow-sm"
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => {
                                    setRemarksModal({ isOpen: true, requestIndex: realIndex, action: "decline", productId: prod.id });
                                    setRemarks("");
                                  }}
                                  className="flex-1 px-[1vw] py-[0.5vw] bg-red-600 text-white rounded-[0.4vw] text-[0.82vw] font-bold hover:bg-red-700 cursor-pointer transition-all shadow-sm"
                                >
                                  ❌ Decline
                                </button>
                              </div>
                            )}

                            {/* Status badge (if processed) */}
                            {request.status && (
                              <div className={`mt-[0.75vw] px-[1vw] py-[0.5vw] rounded-[0.4vw] text-[0.82vw] border ${
                                request.status === "ACCEPTED" ? "bg-green-50 border-green-300 text-green-800"
                                : "bg-red-50 border-red-300 text-red-800"
                              }`}>
                                <strong>Status:</strong> {request.status}
                                {request.remarks && <span className="ml-[0.75vw] text-gray-600">— {request.remarks}</span>}
                                {request.processedAt && <span className="ml-[0.75vw] text-gray-400 text-[0.75vw]">{new Date(request.processedAt).toLocaleString()}</span>}
                              </div>
                            )}
                          </div>
                        )})}
                      </div>
                      </div>{/* end accordion body */}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
          /* PRODUCT-LEVEL: original single-product render */
          changeRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-[2vw] text-[1vw]">
              No change requests found.
            </p>
          ) : (
            <div className="space-y-[1vw] max-h-[70vh] overflow-y-auto">
              {changeRequests.map((request, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-[0.5vw] p-[1.5vw] bg-gray-50 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-[1vw]">
                    <div>
                      <span
                        className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.85vw] font-bold ${request.status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : request.status === "DECLINED"
                            ? "bg-red-100 text-red-800"
                            : request.type === "delete"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {request.type === "delete"
                          ? "DELETE REQUEST"
                          : "CHANGE REQUEST"}
                        {request.status && ` - ${request.status}`}
                      </span>
                      {request.status && (
                        <span className="ml-[0.5vw] text-[0.75vw] text-gray-500">
                          {new Date(request.processedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-[0.85vw] text-gray-500">
                      {new Date(request.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* ✅ DELETE REQUEST - FIXED: Use current product data */}
                  {request.type === "delete" ? (
                    <div className="space-y-[0.75vw]">
                      <div className="bg-red-50 border border-red-200 p-[1vw] rounded-[0.5vw]">
                        <h4 className="font-semibold text-red-800 mb-[0.75vw] text-[0.9vw]">
                          Product Details to Delete:
                        </h4>
                        <div className="grid grid-cols-2 gap-[1vw] text-[.8vw]">
                          <div>
                            <p>
                              <strong>Product:</strong>{" "}
                              {currentProduct.productName}{" "}
                              {currentProduct.size}
                            </p>
                            <p>
                              <strong>IML Name:</strong>{" "}
                              {currentProduct.imlName ||
                                currentProduct?.changeRequests?.productDetails
                                  ?.imlName}
                            </p>
                            <p>
                              <strong>IML Type:</strong>{" "}
                              {currentProduct.imlType ||
                                currentProduct?.changeRequests?.productDetails
                                  ?.imlType}
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>LID Color:</strong>{" "}
                              {currentProduct.lidColor ||
                                currentProduct?.changeRequests?.productDetails
                                  ?.lidColor}
                            </p>
                            <p>
                              <strong>TUB Color:</strong>{" "}
                              {currentProduct.tubColor ||
                                currentProduct?.changeRequests?.productDetails
                                  ?.tubColor}
                            </p>

                            {currentProduct.imlType === "LID" && (
                              <p>
                                <strong>LID Label Qty:</strong>{" "}
                                {currentProduct.lidLabelQty ||
                                  currentProduct?.changeRequests
                                    ?.productDetails?.lidLabelQty ||
                                  "N/A"}
                              </p>
                            )}
                            {currentProduct.imlType === "TUB" && (
                              <p>
                                <strong>TUB Label Qty:</strong>{" "}
                                {currentProduct.tubLabelQty ||
                                  currentProduct?.changeRequests
                                    ?.productDetails?.tubLabelQty ||
                                  "N/A"}
                              </p>
                            )}
                            {currentProduct.imlType === "LID & TUB" && (
                              <>
                                <p>
                                  <strong>LID Label Qty:</strong>{" "}
                                  {currentProduct.lidLabelQty ||
                                    currentProduct?.changeRequests
                                      ?.productDetails?.lidLabelQty ||
                                    "N/A"}
                                </p>
                                <p>
                                  <strong>TUB Label Qty:</strong>{" "}
                                  {currentProduct.tubLabelQty ||
                                    currentProduct?.changeRequests
                                      ?.productDetails?.tubLabelQty ||
                                    "N/A"}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* {request.remarks && (
                        <div className="bg-orange-50 p-[0.75vw] rounded border border-orange-200 text-[.8vw]">
                          <strong>Previous Remarks:</strong> {request.remarks}
                        </div>
                      )} */}
                    </div>
                  ) : (
                    /* ✅ CHANGE REQUEST - Original vs Requested */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.5vw]">
                      <div className="bg-white p-[1vw] rounded-[0.5vw] border text-[.8vw]">
                        <h4 className="font-semibold text-gray-800 mb-[0.75vw] text-[0.9vw]">
                          Original Details
                        </h4>
                        <div className="space-y-[0.25vw] text-[0.85vw]">
                          <p>
                            <strong>IML Name:</strong>{" "}
                            {request.originalDetails?.imlName ||
                              currentProduct?.imlName}
                          </p>
                          <p>
                            <strong>LID Color:</strong>{" "}
                            {request.originalDetails?.lidColor ||
                              currentProduct?.lidColor}
                          </p>
                          <p>
                            <strong>TUB Color:</strong>{" "}
                            {request.originalDetails?.tubColor ||
                              currentProduct?.tubColor}
                          </p>
                          <p>
                            <strong>IML Type:</strong>{" "}
                            {request.originalDetails?.imlType ||
                              currentProduct?.imlType}
                          </p>
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-[1vw] rounded-[0.5vw] border border-indigo-200">
                        <h4 className="font-semibold text-indigo-800 mb-[0.75vw] text-[0.9vw]">
                          Requested Changes
                        </h4>
                        {/* 🔥 DESIGN FILES - With ACTUAL IMAGE PREVIEW */}
                        {/* 🔥 SAFE DESIGN FILES PREVIEW */}
                        {(request.requestedChanges?.lidDesignFile || request.requestedChanges?.tubDesignFile) && (
                          <div className="mb-[1.5vw] space-y-[1vw]">
                            <h5 className="font-medium text-indigo-900 mb-[0.75vw] flex items-center gap-[0.5vw] text-[0.9vw]">
                              📄 Design Files
                            </h5>

                            <div className="grid">
                              {/* 🔥 LID DESIGN */}
                              {request.requestedChanges?.lidDesignFile && (
                                <div className="bg-white border border-indigo-200 rounded-[0.75vw] p-[1vw] hover:shadow-lg transition-all">
                                  <div className="flex items-start gap-[0.75vw] mb-[0.75vw]">
                                    <div className={`w-[2.5vw] h-[2.5vw] rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium flex-shrink-0 ${request.requestedChanges.lidDesignFile.type?.includes('pdf')
                                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                      : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                      }`}>
                                      {request.requestedChanges.lidDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-indigo-900 truncate pr-[0.5vw] text-[0.9vw]">
                                        {request.requestedChanges.lidDesignFile.name}
                                      </div>
                                      <div className="text-[0.75vw] text-gray-500">
                                        {Math.round(request.requestedChanges.lidDesignFile.size / 1024)} KB
                                      </div>
                                    </div>
                                  </div>

                                  {/* 🔥 SAFE IMAGE PREVIEW */}
                                  <div className="w-full h-[12vw] bg-gradient-to-br from-gray-50 to-gray-100 rounded-[0.5vw] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
                                    {(() => {
                                      // 🔥 SAFE VALIDATION
                                      const isValidImageFile = currentProduct.lidDesignFile &&
                                        (currentProduct.lidDesignFile instanceof File ||
                                          currentProduct.lidDesignFile instanceof Blob) &&
                                        currentProduct.lidDesignFile.type?.startsWith('image/');

                                      if (isValidImageFile) {
                                        return (
                                          <img
                                            src={URL.createObjectURL(currentProduct.lidDesignFile)}
                                            alt="LID Design Preview"
                                            className="w-full h-full object-contain bg-white"
                                          />
                                        );
                                      } else {
                                        return (
                                          <div className="text-center p-[1.5vw] text-gray-400">
                                            <div className="w-[5vw] h-[5vw] mx-auto mb-[0.75vw] bg-gradient-to-br from-gray-300 to-gray-400 rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium">
                                              {request.requestedChanges.lidDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                            </div>
                                            <div className="text-[0.85vw] font-medium">Preview Unavailable</div>
                                            <div className="text-[0.75vw] mt-[0.25vw]">File not loaded</div>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* 🔥 TUB DESIGN - SAME PATTERN */}
                              {request.requestedChanges?.tubDesignFile && (
                                <div className="bg-white border border-indigo-200 rounded-[0.75vw] p-[1vw] hover:shadow-lg transition-all mt-[0.5vw]">
                                  <div className="flex items-start gap-[0.75vw] mb-[0.75vw]">
                                    <div className={`w-[2.5vw] h-[2.5vw] rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium flex-shrink-0 ${request.requestedChanges.tubDesignFile.type?.includes('pdf')
                                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                      : 'bg-gradient-to-br from-orange-500 to-red-600'
                                      }`}>
                                      {request.requestedChanges.tubDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-indigo-900 truncate pr-[0.5vw] text-[0.9vw]">
                                        {request.requestedChanges.tubDesignFile.name}
                                      </div>
                                      <div className="text-[0.75vw] text-gray-500">
                                        {Math.round(request.requestedChanges.tubDesignFile.size / 1024)} KB
                                      </div>
                                    </div>
                                  </div>

                                  <div className="w-full h-[12vw]  bg-gradient-to-br from-gray-50 to-gray-100 rounded-[0.5vw] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
                                    {(() => {
                                      const isValidImageFile = currentProduct.tubDesignFile &&
                                        (currentProduct.tubDesignFile instanceof File ||
                                          currentProduct.tubDesignFile instanceof Blob) &&
                                        currentProduct.tubDesignFile.type?.startsWith('image/');

                                      if (isValidImageFile) {
                                        return (
                                          <img
                                            src={URL.createObjectURL(currentProduct.tubDesignFile)}
                                            alt="TUB Design Preview"
                                            className="w-full h-full object-contain bg-white"
                                          />
                                        );
                                      } else {
                                        return (
                                          <div className="text-center p-[1.5vw] text-gray-400">
                                            <div className="w-[4vw] h-[4vw] mx-auto mb-[0.75vw] bg-gradient-to-br from-gray-300 to-gray-400 rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium">
                                              {request.requestedChanges.tubDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                            </div>
                                            <div className="text-[0.85vw] font-medium">Preview Unavailable</div>
                                            <div className="text-[0.75vw] mt-[0.25vw]">File not loaded</div>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}


                        <div className="space-y-[0.25vw] text-[0.85vw]">
                          {getChangedFields(request).map((field, idx) => (
                            <>
                              <p
                                key={idx}
                                className="bg-indigo-100 px-[0.5vw] py-[0.25vw] rounded text-indigo-900 font-medium"
                              >
                                {field}
                              </p>
                            </>
                          ))}
                          <div className="space-y-[.25vw] text-[.8vw] text-black font-medium mt-[1vw]">
                            <p>
                              Revised Estimated No:{" "}
                              {request.revisedEstimate?.estimatedNumber}
                            </p>
                            <p>
                              Revised Estimated Value:{" "}
                              {request.revisedEstimate?.estimatedValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ✅ INVOICE BUTTON - If exists */}
                  {request.status === "ACCEPTED" &&
                    request.type === "delete" &&
                    currentOrder.invoices?.some(
                      (inv) => inv.productId === targetProduct?.id,
                    ) && (
                      <div className="mt-[0.75vw] p-[0.75vw] bg-blue-50 border rounded-[0.5vw]">
                        <button
                          onClick={() =>
                            setInvoiceModal({
                              isOpen: true,
                              requestIndex: index,
                            })
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium text-[0.85vw] flex items-center gap-[0.25vw]"
                        >
                          📄 View Generated Invoice
                        </button>
                      </div>
                    )}

                  {/* ✅ ACTION BUTTONS - Only for unprocessed */}
                  {!request.status && (
                    <div className="flex gap-[0.75vw] mt-[1.5vw] pt-[1vw] border-t border-gray-200">
                      <button
                        onClick={() => handleAction(index, "accept")}
                        className="flex-1 px-[1.5vw] py-[0.75vw] bg-green-600 text-white rounded-[0.5vw] hover:bg-green-700 font-semibold transition-all shadow-md text-[0.9vw]"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => handleAction(index, "decline")}
                        className="flex-1 px-[1.5vw] py-[0.75vw] bg-red-600 text-white rounded-[0.5vw] hover:bg-red-700 font-semibold transition-all shadow-md text-[0.9vw]"
                      >
                        ❌ Decline
                      </button>
                    </div>
                  )}

                  {request.status && (
                    <div className="mt-[1vw] p-[1vw] bg-gray-100 rounded-[0.5vw] text-[0.85vw] border">
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>Status:</strong> {request.status}
                        </span>
                        {request.remarks && (
                          <span className="text-[.7vw] bg-yellow-200 px-[0.5vw] py-[0.25vw] rounded-[0.25vw]">
                            Remarks Added
                          </span>
                        )}
                      </div>
                      {request.remarks && (
                        <p className="mt-[0.25vw] text-[.8vw] text-gray-900 bg-white p-[0.5vw] rounded-[0.25vw] mt-[0.5vw]">
                          {request.remarks}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
          )/* end product-level */}
        </div>
      </div>

      {/* ✅ REMARKS MODAL */}
      {remarksModal.isOpen && (
        <div className="fixed inset-0 bg-[#000000b3] z-[50002] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {(remarksModal.action === "accept")
                  ? "Accept Request"
                  : "Decline Request"}
              </h3>
              <button
                onClick={() =>
                  setRemarksModal({
                    isOpen: false,
                    requestIndex: -1,
                    action: "",
                  })
                }
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            {/* remarks field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {((targetProduct || currentProduct)?.changeRequests?.[remarksModal.requestIndex]
                  ?.type === "delete" && remarksModal.action === "accept")
                  ? "Enter Invoice Details"
                  : "Remarks"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
               placeholder={
                  remarksModal.action === "accept" &&
                  (targetProduct || currentProduct)?.changeRequests?.[remarksModal.requestIndex]?.type === "delete"
                    ? "Enter Invoice Details"
                    : "Enter Remarks"
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              />
            </div>

            {/* ✅ INVOICE NUMBER - ONLY FOR DELETE + ACCEPT */}


            <div className="flex gap-3">
              <button
                onClick={() =>
                  setRemarksModal({
                    isOpen: false,
                    requestIndex: -1,
                    action: "",
                  })
                }
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={submitRemarks}
                disabled={!remarks.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {remarksModal.action.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ INVOICE MODAL */}
      {invoiceModal.isOpen && (
        <div className="fixed inset-0 bg-[#000000b3] z-[50003] flex items-center justify-center p-[1vw]">
          <div className="bg-white rounded-[1vw] max-w-[40vw] w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-[1vw] border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-[1vw]">
              <h3 className="text-[1.1vw] font-semibold">Invoice Details</h3>
              <button
                onClick={() =>
                  setInvoiceModal({ isOpen: false, requestIndex: -1 })
                }
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-[2vw] h-[2vw] flex items-center justify-center text-[1.2vw]"
              >
                ×
              </button>
            </div>
            <div className="p-[1.5vw]">
              {currentOrder.invoices?.map(
                (invoice) =>
                  invoice.productId === modalProduct.id && (
                    <div
                      key={invoice.id}
                      className="border rounded-[0.5vw] p-[1.5vw] bg-gradient-to-br from-blue-50 to-indigo-50"
                    >
                      <div className="grid grid-cols-2 gap-[1.5vw] mb-[1vw]">
                        <div>
                          <p className="text-[0.85vw] text-gray-600">Invoice ID</p>
                          <p className="font-bold text-[1.1vw] text-blue-900">
                            {invoice.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.85vw] text-gray-600">Date</p>
                          <p className="font-bold text-[1.1vw]">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-[0.5vw] mb-[1vw] text-[0.9vw]">
                        <p>
                          <strong>Product:</strong> {invoice.productName}{" "}
                          {invoice.size}
                        </p>
                        <p>
                          <strong>Reason:</strong> {invoice.reason}
                        </p>
                        <p>
                          <strong>Amount:</strong> ₹
                          {invoice.amount?.toLocaleString()}
                        </p>
                        <p className="text-[0.85vw] text-gray-600">
                          Remarks: {invoice.remarks}
                        </p>
                      </div>
                      <div className="text-center pt-[1vw] border-t">
                        <span className="bg-green-100 text-green-800 px-[1vw] py-[0.5vw] rounded-full font-medium text-[0.85vw]">
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}