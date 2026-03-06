// Auto-extracted from OrdersManagement.jsx
import { useState, useRef } from "react";

const STORAGE_KEY = "imlorders";

export default function RefundModal({ orders, refundModal, setOrders, setRefundModal }) {
  const [localDoc, setLocalDoc] = useState(refundModal.refundDocument || null);
  const [localDocName, setLocalDocName] = useState(refundModal.refundDocumentName || "");
  const [localDocType, setLocalDocType] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [refundDate, setRefundDate] = useState("");
  const [refundRefNo, setRefundRefNo] = useState("");
  const [viewingDoc, setViewingDoc] = useState(false);
  const fileInputRef = useRef(null);

  if (!refundModal.isOpen) return null;

  const handleDocUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLocalDoc(ev.target.result);
      setLocalDocName(file.name);
      setLocalDocType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const isImage = localDocType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(localDocName);
  const isPdf = localDocType === "application/pdf" ||
    /\.pdf$/i.test(localDocName);

  const handleSubmit = () => {
    if (!deletionReason.trim()) {
      alert("Please enter the reason for deletion.");
      return;
    }
    if (!refundDate) {
      alert("Please enter the refund date.");
      return;
    }
    if (!refundRefNo.trim()) {
      alert("Please enter the reference number.");
      return;
    }
    if (!localDoc) {
      alert("Please upload a payment/refund document.");
      return;
    }
    const updatedOrders = orders.map((o) =>
      o.id === refundModal.orderId
        ? {
            ...o,
            productDeleted: true,
            deleteRequestedAt: new Date().toISOString(),
            deletionReason: deletionReason.trim(),
            refundInfo: {
              date: refundDate,
              referenceNo: refundRefNo.trim(),
              document: localDoc,
              documentName: localDocName,
              documentType: localDocType,
              submittedAt: new Date().toISOString(),
            },
          }
        : o,
    );
    const existingRefunded = JSON.parse(localStorage.getItem("imlorders_refunded") || "[]");
    const thisOrder = refundModal.order;
    const refundedEntry = {
      ...thisOrder,
      productDeleted: true,
      deleteRequestedAt: new Date().toISOString(),
      deletionReason: deletionReason.trim(),
      refundInfo: {
        date: refundDate,
        referenceNo: refundRefNo.trim(),
        document: localDoc,
        documentName: localDocName,
        documentType: localDocType,
        submittedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem("imlorders_refunded", JSON.stringify([...existingRefunded, refundedEntry]));
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));
    setRefundModal({ isOpen: false, orderId: null, order: null, refundDocument: null, refundDocumentName: "" });
    alert("✅ Order deletion recorded with refund details. Admin will review.");
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#000000b3] z-[50008] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-[1.5vw] py-[1vw] flex items-center justify-between">
            <div>
              <h2 className="text-[1.25vw] font-bold text-white">🔴 Delete Order Request</h2>
              <p className="text-[0.85vw] text-orange-100 mt-[0.2vw]">
                Order: <strong>{refundModal.order?.orderNumber || refundModal.orderId}</strong>
              </p>
            </div>
            <button
              onClick={() => setRefundModal({ isOpen: false, orderId: null, order: null, refundDocument: null, refundDocumentName: "" })}
              className="text-white hover:text-orange-200 text-[1.8vw] font-bold cursor-pointer leading-none"
            >×</button>
          </div>

          {/* Notice */}
          <div className="bg-amber-50 border-b border-amber-200 px-[1.5vw] py-[0.75vw]">
            <p className="text-[0.85vw] text-amber-800 font-medium">
              ⚠️ This order has payment records. Please provide the deletion reason and refund details. These will be saved locally for reference.
            </p>
          </div>

          {/* Form */}
          <div className="px-[1.5vw] py-[1vw] space-y-[1vw]">

            {/* Date + Reference No */}
            <div className="grid grid-cols-2 gap-[1vw]">
              <div>
                <label className="block text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                  Refund Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                  Reference No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundRefNo}
                  onChange={(e) => setRefundRefNo(e.target.value)}
                  placeholder="Enter transaction / reference number"
                  className="w-full border border-gray-300 rounded-lg px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Reason for Deletion */}
            <div>
              <label className="block text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                Reason for Order Deletion <span className="text-red-500">*</span>
                <span className="ml-2 text-[0.75vw] text-gray-400 font-normal">(stored locally)</span>
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
                placeholder="Explain why this order is being deleted..."
                className="w-full border border-gray-300 rounded-lg px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                Payment/Refund Document <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDocUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              {localDoc ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-lg px-[1vw] py-[0.6vw]">
                  <div className="flex items-center gap-[0.5vw] min-w-0">
                    <span className="text-green-600 text-[1vw]">📎</span>
                    <span className="text-[0.85vw] text-green-800 font-medium truncate">{localDocName}</span>
                  </div>
                  <div className="flex items-center gap-[0.6vw] flex-shrink-0 ml-[0.5vw]">
                    {(isImage || isPdf) && (
                      <button
                        onClick={() => setViewingDoc(true)}
                        className="text-blue-600 hover:text-blue-800 text-[0.8vw] cursor-pointer font-medium flex items-center gap-[0.25vw]"
                      >
                        <svg className="w-[0.9vw] h-[0.9vw] inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    )}
                    <button
                      onClick={() => { setLocalDoc(null); setLocalDocName(""); setLocalDocType(""); }}
                      className="text-red-500 hover:text-red-700 text-[0.8vw] cursor-pointer font-medium"
                    >Remove</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg px-[1vw] py-[1vw] text-[0.85vw] text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer text-center"
                >
                  📤 Click to upload document (PDF, Image, Word)
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-[0.75vw] px-[1.5vw] py-[1vw] border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setRefundModal({ isOpen: false, orderId: null, order: null, refundDocument: null, refundDocumentName: "" })}
              className="px-[1.25vw] py-[0.5vw] text-[0.85vw] bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!deletionReason.trim() || !refundDate || !refundRefNo.trim() || !localDoc}
              className={`px-[1.25vw] py-[0.5vw] text-[0.85vw] rounded-lg font-bold transition-all cursor-pointer ${
                deletionReason.trim() && refundDate && refundRefNo.trim() && localDoc
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Save Deletion Record
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer Lightbox */}
      {viewingDoc && localDoc && (
        <div
          className="fixed inset-0 bg-black/80 z-[50020] flex items-center justify-center p-[2vw]"
          onClick={() => setViewingDoc(false)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[1.25vw] py-[0.75vw] border-b border-gray-200 bg-gray-50">
              <span className="text-[0.9vw] font-semibold text-gray-700 truncate">📎 {localDocName}</span>
              <button
                onClick={() => setViewingDoc(false)}
                className="text-gray-500 hover:text-gray-800 text-[1.6vw] font-bold cursor-pointer leading-none"
              >×</button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-[1vw]">
              {isImage ? (
                <img
                  src={localDoc}
                  alt={localDocName}
                  className="max-w-full max-h-[75vh] object-contain rounded"
                />
              ) : isPdf ? (
                <iframe
                  src={localDoc}
                  title={localDocName}
                  className="w-full h-[75vh] rounded border-0"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}