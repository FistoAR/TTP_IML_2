// Auto-extracted from OrdersManagement.jsx
import { useState } from "react";

export default function OrderDeletionModal({ deleteOrderModal, setDeleteOrderModal, setOrderInvoiceModal }) {
  const [deletionReason, setDeletionReason] = useState("");

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50007] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-red-600">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            Delete Order?
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Order: <strong>{deleteOrderModal.order?.orderNumber}</strong>
          </p>
          <p className="text-gray-600">
            This will <strong>permanently delete</strong>{" "}
            {deleteOrderModal.order?.products?.length || 0} products.
          </p>
        </div>

        {/* Reason for Deletion */}
        <div className="mb-6">
          <label className="block text-[0.9vw] font-semibold text-gray-700 mb-[0.4vw]">
            Reason for Deletion <span className="text-red-500">*</span>
          </label>
          <textarea
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            rows={3}
            placeholder="Please provide the reason for deleting this order..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() =>
              setDeleteOrderModal({
                isOpen: false,
                orderId: null,
                order: null,
              })
            }
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold transition-all"
          >
            Cancel
          </button>
          <button
            disabled={!deletionReason.trim()}
            onClick={() => {
              if (!deletionReason.trim()) return;
              // Store reason on the order object before proceeding to invoices
              const orderWithReason = {
                ...deleteOrderModal.order,
                deletionReason: deletionReason.trim(),
              };
              // ✅ PROCEED TO INVOICE CREATION
              setOrderInvoiceModal({
                isOpen: true,
                order: orderWithReason,
              });
              setDeleteOrderModal({
                isOpen: false,
                orderId: null,
                order: null,
              });
            }}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
              deletionReason.trim()
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue to Invoices
          </button>
        </div>
      </div>
    </div>
  );
}
