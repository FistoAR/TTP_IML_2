// Auto-extracted from OrdersManagement.jsx
import { Select, Input, DesignPreview } from "./OrderFormUtils";
import { useState, useEffect } from "react";

const STORAGE_KEY = "imlorders";

export default function EstimateRevisionModal({ estimateRevisionModal, orders,
  setConfirmState, setEstimateRevisionModal, setOrders, tempChangeRequest,
  navigate, handleDirectSave, handleSendAsRequest, hasMovedToPurchase }) {
  if (!estimateRevisionModal.isOpen || !estimateRevisionModal.revision)
    return null;

  const { revision } = estimateRevisionModal;
  const isEditMode = revision?.isEditMode || false;

  // 🔥 FIX 1: Get order from PARENT scope (not local)
  const order = orders.find((o) => o.id === revision.orderId);

  // 🔥 FIX 2: Proper local state initialization
  const [localRevisedEstimate, setLocalRevisedEstimate] = useState({
    estimatedNumber: "",
    estimatedValue: "",
  });

  // 🔥 FIX 3: CORRECT useEffect - populate from original estimate, or blank if forced
  useEffect(() => {
    if (revision?.originalEstimate) {
      // 🔥 CHANGE 2: If qty changed or delete, force blank so user must enter new values
      if (revision.forceBlankEstimate) {
        setLocalRevisedEstimate({
          estimatedNumber: "",
          estimatedValue: "",
        });
      } else {
        setLocalRevisedEstimate({
          estimatedNumber: revision.originalEstimate.estimatedNumber || "",
          estimatedValue: revision.originalEstimate.estimatedValue || "",
        });
      }
    }
  }, [revision]);

  // 🔥 FIX 4: NO DOM queries - use controlled inputs
  const handleSaveRevisedEstimate = () => {
    const { estimatedNumber, estimatedValue } = localRevisedEstimate;

    if (
      !estimatedNumber?.trim() ||
      !estimatedValue ||
      parseFloat(estimatedValue) <= 0
    ) {
      alert("Please enter both valid Revised Estimate No & Value");
      return;
    }

    // 🔥 Handle edit-mode delete: directly remove product and update estimate
    if (isEditMode && revision.triggerType === "delete") {
      const revisedEstimateNo = estimatedNumber.trim();
      const revisedEstimateValue = parseFloat(estimatedValue);
      const nowDel = new Date().toISOString();
      const updatedOrders = orders.map((o) =>
        o.id === revision.orderId
          ? {
              ...o,
              updatedAt: nowDel,
              orderEstimate: {
                ...o.orderEstimate,
                estimatedNumber: revisedEstimateNo,
                estimatedValue: revisedEstimateValue,
              },
              products: o.products.filter(
                (p) => p.id !== revision.productId
              ),
              invoices: [...(o.invoices || [])],
            }
          : o
      );
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));
      setEstimateRevisionModal({ isOpen: false, revision: null });
      sessionStorage.removeItem("isEditMode");
      alert(`✅ Product deleted!\nEstimate: ${revisedEstimateNo}\nValue: ₹${revisedEstimateValue}`);
      return;
    }

    // 🔥 FIX 5: Access tempChangeRequest from parent scope
    if (isEditMode && tempChangeRequest?.localProductChanges) {
      // 🚀 EDIT MODE: DIRECT SAVE
      handleDirectSave(
        tempChangeRequest.localProductChanges,
        estimatedNumber,
        parseFloat(estimatedValue),
      );
    } else if (tempChangeRequest) {
      // 📤 REQUEST MODE
      handleSendAsRequest(
        tempChangeRequest,
        estimatedNumber,
        parseFloat(estimatedValue),
      );
    } else {
      alert("Error: Missing change data");
    }

    console.log(`Tempchangeresquest plain: ${tempChangeRequest}`);
    console.log(`Tempchangeresquest JSON: ${JSON.stringify(tempChangeRequest, null, 2)}`);

    if (hasMovedToPurchase(order)) {
      setConfirmState({
          isOpen: true,
          message: "Do you want to update the PO details associated with this order?",
          onYes: () => {
            // navigate to po details page with the order details sent
            navigate("/iml/purchase/po-details", {
            state: { orderId: order.id, fromOrdersManagement: false },
          });
        },
        onNo: () => setConfirmState({isOpen: false})
      });
    }

 
  };

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50001] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode
              ? "💾 Save Revised Estimate"
              : "📤 Send Change Request"}
          </h2>
          <button
            onClick={() =>
              setEstimateRevisionModal({ isOpen: false, revision: null })
            }
            className="text-2xl font-bold cursor-pointer hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Info - Read Only */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <Input
              label="Company Name"
              value={order?.contact.company || ""}
              disabled
            />
            <Input
              label="Contact Name"
              value={order?.contact.contactName || ""}
              disabled
            />
            <Input
              label="Contact Number"
              value={order?.contact.phone || ""}
              disabled
            />
            <Input
              label="Order Number"
              value={order?.orderNumber || ""}
              disabled
            />
            <Input
              label="Original Estimate No"
              value={order?.orderEstimate?.estimatedNumber || ""}
              disabled
            />
            <Input
              label="Original Estimate Value"
              value={(
                order?.orderEstimate?.estimatedValue || 0
              ).toLocaleString()}
              disabled
            />
          </div>

          {/* 🔥 REVISED FIELDS - Editable */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-[1vw] font-semibold text-blue-800 mb-4">
              Revised Estimate
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-2">
                  Revised Estimate Number{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="revisedEstimateNo"
                  type="text"
                  value={localRevisedEstimate.estimatedNumber}
                  onChange={(e) =>
                    setLocalRevisedEstimate({
                      ...localRevisedEstimate,
                      estimatedNumber: e.target.value,
                    })
                  }
                  placeholder="EST-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[.85vw]"
                  required
                />
              </div>

              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-2">
                  Revised Estimate Value{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="revisedEstimateValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={localRevisedEstimate.estimatedValue}
                  onChange={(e) =>
                    setLocalRevisedEstimate({
                      ...localRevisedEstimate,
                      estimatedValue: e.target.value,
                    })
                  }
                  placeholder="45000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[.85vw]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Changes Summary */}
          {revision.requestedChanges && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                Changes Requested:
              </h4>
              <pre className="text-xs bg-white p-3 rounded text-gray-800 max-h-32 overflow-y-auto">
                {JSON.stringify(revision.requestedChanges, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() =>
              setEstimateRevisionModal({ isOpen: false, revision: null })
            }
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-600 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveRevisedEstimate}
            disabled={
              !localRevisedEstimate.estimatedNumber?.trim() ||
              !localRevisedEstimate.estimatedValue ||
              parseFloat(localRevisedEstimate.estimatedValue) <= 0
            }
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-all disabled:opacity-50 cursor-pointer"
          >
            {isEditMode ? "Save Directly" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}