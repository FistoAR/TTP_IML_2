// Auto-extracted from OrdersManagement.jsx
import { useState } from "react";

const STORAGE_KEY = "imlorders";

export default function OrderDeleteInvoiceModal({ orderInvoiceModal, orders, setDeleteOrderModal, setOrderInvoiceModal, setOrders }) {
  // ✅ ADD LOCAL STATE FOR FORM
  const [bulkInvoicePrefix, setBulkInvoicePrefix] = useState("INV-ORD-");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // ✅ Track custom amounts per product
  const [productAmounts, setProductAmounts] = useState({});

  const updateProductAmount = (productId, amount) => {
    setProductAmounts((prev) => ({
      ...prev,
      [productId]: parseFloat(amount) || 0,
    }));
  };

  const handleConfirmDelete = () => {
    const order = orderInvoiceModal.order;

    // ✅ USE CUSTOM AMOUNTS OR FALLBACK TO BUDGET
    const invoices = order.products.map((product, index) => ({
      id: `INV-ORD-${order.id}-${Date.now()}-${index}`,
      productId: product.id,
      productName: product.productName,
      size: product.size,
      invoiceNo: `${bulkInvoicePrefix}${order.orderNumber}-${String(index + 1).padStart(3, "0")}`,
      invoiceDate: invoiceDate,
      amount: productAmounts[product.id] || product.budget || 0,
      reason: "Order Deleted",
      remarks: `Bulk deletion of Order ${order.orderNumber}`,
      status: "Generated",
    }));

    // ✅ ADD INVOICES TO LAST REMAINING ORDER (or create dummy order for invoices)
    const updatedOrders = orders
      .filter((o) => o.id !== order.id)
      .map((o) => ({
        ...o,
        invoices: [...(o.invoices || []), ...invoices],
      }));

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));

    setOrderInvoiceModal({ isOpen: false, order: null });
    alert("Order Deleted!!");
  };

  if (!orderInvoiceModal.isOpen || !orderInvoiceModal.order) return null;

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50008] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black">Bulk Invoice Creation</h2>
              <p className="opacity-90">
                Order: <strong>{orderInvoiceModal.order?.orderNumber}</strong>{" "}
                -{orderInvoiceModal.order?.products?.length} products
              </p>
            </div>
            <button
              onClick={() =>
                setOrderInvoiceModal({ isOpen: false, order: null })
              }
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-2xl w-14 h-14 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* ✅ FIXED BULK INVOICE FIELDS */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Invoice No Prefix
              </label>
              <input
                type="text"
                value={bulkInvoicePrefix}
                onChange={(e) => setBulkInvoicePrefix(e.target.value)}
                placeholder="INV-ORD-"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* PRODUCTS TABLE */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              Products to Invoice
            </h3>
            {orderInvoiceModal.order?.products?.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">
                      {product.productName} {product.size}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {product.imlName} | {product.imlType} | LID:{" "}
                      {product.lidColor} | TUB: {product.tubColor}
                    </p>
                  </div>
                  <div className="text-right">
                    <input
                      type="number"
                      value={
                        productAmounts[product.id] || product.budget || ""
                      }
                      onChange={(e) =>
                        updateProductAmount(product.id, e.target.value)
                      }
                      placeholder="Amount"
                      className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-right font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL & BUTTONS */}
          <div className="pt-6 border-t-4 border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl">
            <div>
              <p className="text-2xl font-black text-gray-900">
                Total:{" "}
                <span className="text-emerald-600">
                  ₹
                  {orderInvoiceModal.order?.products
                    ?.reduce((sum, p) => {
                      return sum + (productAmounts[p.id] || p.budget || 0);
                    }, 0)
                    .toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteOrderModal({
                    isOpen: true,
                    orderId: orderInvoiceModal.order.id,
                    order: orderInvoiceModal.order,
                  });
                  setOrderInvoiceModal({ isOpen: false, order: null });
                }}
                className="px-8 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold"
              >
                Back
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-12 py-4 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-2xl hover:shadow-2xl font-black text-lg transition-all"
              >
                ✅ Delete Order & Generate Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}