// Auto-extracted from OrdersManagement.jsx
import { useState, useEffect } from "react";

const STORAGE_KEY = "imlorders";

export default function InvoiceModal({ invoiceCreateModal, orders, setInvoiceCreateModal, setInvoiceViewerModal, setOrders, setViewRequestModal }) {
  // ✅ LOCAL FORM STATE - FIXES FOCUS LOSS
  const [formData, setFormData] = useState({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    amount: invoiceCreateModal.product?.budget || 0,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (invoiceCreateModal.isOpen && invoiceCreateModal.product) {
      setFormData({
        invoiceNo: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        amount: invoiceCreateModal.product.budget || 0,
      });
    }
  }, [invoiceCreateModal]);

  const handleSubmit = () => {
    // ✅ PROPER VALIDATION
    if (!formData.invoiceNo.trim()) {
      alert("Invoice No is required");
      return;
    }
    if (!formData.invoiceDate) {
      alert("Invoice Date is required");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      alert("Valid amount is required");
      return;
    }

    // ✅ UPDATE INVOICES - Find the draft invoice by productId
    const draftInvoice = orders
      .find((o) => o.id === invoiceCreateModal.orderId)
      ?.invoices?.find(
        (inv) => inv.productId === invoiceCreateModal.product.id,
      );

    if (!draftInvoice) {
      alert("Draft invoice not found");
      return;
    }

    const updatedOrders = orders.map((o) =>
      o.id === invoiceCreateModal.orderId
        ? {
          ...o,
          invoices: o.invoices.map((inv) =>
            inv.id === draftInvoice.id
              ? {
                ...inv,
                invoiceNo: formData.invoiceNo,
                invoiceDate: formData.invoiceDate,
                amount: parseFloat(formData.amount),
                status: "Generated",
              }
              : inv,
          ),
        }
        : o,
    );

    // ✅ SAVE
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));

    // ✅ OPEN VIEWER + CLOSE CREATE
    setInvoiceViewerModal({
      isOpen: true,
      orderId: invoiceCreateModal.orderId,
    });
    setInvoiceCreateModal({ isOpen: false, product: null, orderId: null });
    alert(`Invoice created!!`);
    setViewRequestModal({ isOpen: false, order: null, product: null });
  };

  if (!invoiceCreateModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50006] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-blue-200">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Create Invoice
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              For deleted product:{" "}
              <strong>
                {invoiceCreateModal.product?.productName}{" "}
                {invoiceCreateModal.product?.size}
              </strong>
            </p>
          </div>
          <button
            onClick={() =>
              setInvoiceCreateModal({
                isOpen: false,
                product: null,
                orderId: null,
              })
            }
            className="text-gray-500 hover:text-gray-800 text-3xl font-bold cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-6">
          {/* Invoice No */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Invoice No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.invoiceNo}
              onChange={(e) =>
                setFormData({ ...formData, invoiceNo: e.target.value })
              }
              placeholder="INV-2026-001"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg font-semibold"
            />
          </div>

          {/* Invoice Date & Amount */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="25000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 text-lg font-semibold text-right"
              />
            </div>
          </div>

          {/* Product Summary */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <h4 className="font-bold text-xl text-blue-900 mb-4">
              Product Details
            </h4>
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div>
                <strong>IML Name:</strong>{" "}
                {invoiceCreateModal.product?.imlName}
              </div>
              <div>
                <strong>LID Color:</strong>{" "}
                {invoiceCreateModal.product?.lidColor}
              </div>
              <div>
                <strong>TUB Color:</strong>{" "}
                {invoiceCreateModal.product?.tubColor}
              </div>
              <div>
                <strong>Type:</strong> {invoiceCreateModal.product?.imlType}
              </div>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4 mt-12 pt-8 border-t-4 border-gray-200">
          <button
            onClick={() =>
              setInvoiceCreateModal({
                isOpen: false,
                product: null,
                orderId: null,
              })
            }
            className="flex-1 px-8 py-4 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold text-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-2xl hover:scale-[1.02] font-bold text-lg transition-all"
          >
            ✅ Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}