// Auto-extracted from OrdersManagement.jsx


export default function OrderInvoiceModalView({ deletedOrderInvoicesModal, orders, setDeletedOrderInvoicesModal }) {
  // ✅ GROUP INVOICES BY ORDER
  const groupedInvoices = deletedOrderInvoicesModal.invoices.reduce(
    (acc, invoice) => {
      const orderNum =
        invoice.orderNumber ||
        deletedOrderInvoicesModal.orderNumber ||
        "Unknown Order";
      if (!acc[orderNum]) {
        acc[orderNum] = [];
      }
      acc[orderNum].push(invoice);
      return acc;
    },
    {},
  );

  const ordersList = Object.entries(groupedInvoices)
    .map(([orderNumber, invoices]) => ({
      orderNumber,
      invoices,
      total: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    }))
    .sort(
      (a, b) =>
        new Date(b.invoices[0].invoiceDate) -
        new Date(a.invoices[0].invoiceDate),
    );

  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50009] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black">Deleted Order Invoices</h2>
              <p className="opacity-90 text-lg">
                {ordersList.length} Orders •{" "}
                {deletedOrderInvoicesModal.invoices.length} Invoices
              </p>
            </div>
            <button
              onClick={() =>
                setDeletedOrderInvoicesModal({
                  isOpen: false,
                  orderId: null,
                  orderNumber: null,
                  invoices: [],
                })
              }
              className="text-white rounded-2xl flex items-center justify-center text-[2vw] cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* ORDERS ACCORDION */}
          <div className="space-y-3">
            {ordersList.map((orderGroup, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* ORDER HEADER */}
                <div
                  className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:shadow-md transition-all flex justify-between items-center"
                  onClick={() => {
                    /* Add toggle state if needed */
                  }}
                >
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      {orderGroup.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {orderGroup.invoices.length} Invoices
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-700">
                      ₹{orderGroup.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* INVOICES TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-4 text-left font-bold">
                          Invoice No
                        </th>
                        <th className="p-4 text-left font-bold">Product</th>
                        <th className="p-4 text-center font-bold">Date</th>
                        <th className="p-4 text-right font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderGroup.invoices.map((invoice, idx) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-gray-50 border-t"
                        >
                          <td className="p-4 font-semibold text-blue-600">
                            {invoice.invoiceNo}
                          </td>
                          <td className="p-4">
                            <div className="font-medium">
                              {invoice.productName}
                            </div>
                            {invoice.size && (
                              <div className="text-sm text-gray-600">
                                {invoice.size}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {new Date(invoice.invoiceDate).toLocaleDateString(
                              "en-IN",
                            )}
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-600">
                            ₹{invoice.amount?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* GRAND TOTAL */}
          {ordersList.length > 0 && (
            <div className="p-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl border-4 border-emerald-200 shadow-2xl">
              <div className="flex justify-between items-center text-center">
                <span className="text-3xl font-black text-gray-900">
                  GRAND TOTAL
                </span>
                <span className="text-4xl font-black text-emerald-700 bg-emerald-100 px-6 py-3 rounded-2xl shadow-lg">
                  ₹
                  {deletedOrderInvoicesModal.invoices
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {ordersList.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-gray-400">📄</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Deleted Order Invoices
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Invoices from deleted orders will appear here. Generate
                invoices before deleting orders.
              </p>
            </div>
          )}

          {/* CLOSE BUTTON */}
          <div className="flex justify-end mt-12 pt-8 border-t-4 border-gray-200">
            <button
              onClick={() =>
                setDeletedOrderInvoicesModal({
                  isOpen: false,
                  orderId: null,
                  orderNumber: null,
                  invoices: [],
                })
              }
              className="px-16 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-3xl hover:shadow-2xl font-black text-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
