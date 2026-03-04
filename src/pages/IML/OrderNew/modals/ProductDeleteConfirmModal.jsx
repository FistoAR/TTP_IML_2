// Auto-extracted from OrdersManagement.jsx

const STORAGE_KEY = "imlorders";


export default function ProductDeleteConfirmModal({ orders, productDeleteConfirm, setOrders, setProductDeleteConfirm }) {
  if (!productDeleteConfirm.isOpen) return null;

  const { orderId, productId, productName } = productDeleteConfirm;
  const order = orders.find(o => o.id === orderId);
  const product = order?.products?.find(p => p.id === productId);

  const handleSoftDelete = () => {
    // 🔥 STEP 1: Set productDeleted flag (NO removal)
    const updatedOrders = orders.map(o =>
      o.id === orderId
        ? {
          ...o,
          products: o.products.map(p =>
            p.id === productId
              ? { ...p, productDeleted: true }  // 🔥 SOFT FLAG
              : p
          )
        }
        : o
    );

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

    // 🔥 STEP 2: Invoice number prompt
    const invoiceNumber = prompt(`Enter Invoice Number for deleted product:\n${productName}`);
    if (invoiceNumber) {
      const finalOrders = updatedOrders.map(o =>
        o.id === orderId
          ? {
            ...o,
            invoices: [
              ...o.invoices,
              {
                id: `INV-DEL-${Date.now()}`,
                productId,
                productName,
                invoiceNo: invoiceNumber,
                amount: product.budget || 0,
                reason: "Product Soft Deleted",
                status: "Generated",
                createdAt: new Date().toISOString()
              }
            ]
          }
          : o
      );
      setOrders(finalOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrders));
    }

    // 🔥 CLOSE MODAL
    setProductDeleteConfirm({ isOpen: false, orderId: null, productId: null, productName: "" });
    window.dispatchEvent(new Event('ordersUpdated'));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[50005] flex items-center justify-center p-[1.5vw]">
      <div className="bg-white rounded-[1.8vw] p-[2vw] max-w-[30vw] w-full shadow-2xl">
        <div className="text-center mb-[2vw]">
          <div className="w-[5vw] h-[5vw] bg-red-100 rounded-[1.5vw] flex items-center justify-center mx-auto mb-[1.5vw]">
            <span className="text-[2.5vw] text-red-600">🗑️</span>
          </div>
          <h2 className="text-[1.6vw] font-black text-gray-900 mb-[1vw]">
            Soft Delete Product?
          </h2>
          <p className="text-[1.1vw] text-gray-700 mb-[0.5vw]">
            <strong>{productName}</strong> will be <span className="text-red-600 font-bold">hidden</span> from dashboard
          </p>
          <p className="text-[0.85vw] text-gray-500">Invoice will be generated for admin review</p>
        </div>

        <div className="flex gap-[1vw]">
          <button
            onClick={() => setProductDeleteConfirm({ isOpen: false, orderId: null, productId: null, productName: "" })}
            className="flex-1 px-[1.5vw] py-[0.75vw] bg-gray-300 text-gray-800 rounded-[0.8vw] hover:bg-gray-400 text-[1vw] font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSoftDelete}
            className="flex-1 px-[1.5vw] py-[0.75vw] bg-gradient-to-r from-red-500 to-red-600 text-white rounded-[0.8vw] hover:shadow-xl text-[1vw] font-bold transition-all"
          >
            Confirm Soft Delete
          </button>
        </div>
      </div>
    </div>
  );
}