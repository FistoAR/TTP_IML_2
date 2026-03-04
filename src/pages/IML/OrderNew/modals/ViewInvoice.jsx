// Auto-extracted from OrdersManagement.jsx


export default function ViewInvoice({ invoiceModal, orders, setInvoiceModal }) {
  return (
    <div className="fixed inset-0 bg-[#000000b3] z-[50005] flex items-center justify-center p-4">
      <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] rounded-lg overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-[1vw]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[1.35vw] font-medium">
                Deleted Products
              </h2>

            </div>
            <button
              onClick={() =>
                setInvoiceModal({ isOpen: false, orderId: null })
              }
              className="text-white cursor-pointer rounded w-14 h-14 flex items-center justify-center text-[1.5vw] font-bold transition-all"
            >
              ×
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8  overflow-y-auto max-h-[50vh]">
          {orders.find((o) => o.id === invoiceModal.orderId)?.invoices
            ?.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-400 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm font-semibold border-b border-gray-200">
                    <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">S. No.</th>
                    <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">Product Name</th>
                    <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">Product Size</th>
                    <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">IML Name</th>
                    <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">Invoice Details</th>

                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600 divide-y divide-gray-100">
                  {orders
                    .find((o) => o.id === invoiceModal.orderId)
                    ?.invoices?.slice() // make a copy
                    .reverse() // reverse order
                    .map((invoice, i) => {
                      console.log(invoice);
                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-4 font-medium text-gray-900 border-r border-b border-gray-400">
                          <div className="text-[.85vw] text-gray-500 mt-1">
                            {i + 1}
                          </div>
                        </td>
                        <td className="p-4 border-r border-b border-gray-400">
                          <div className="font-semibold text-gray-800">
                            {invoice.productName}
                          </div>
                        </td>
                        <td className="p-4 border-r border-b border-gray-400">
                          <div className="text-[.85vw]">{invoice.size}</div>
                        </td>
                        <td className="p-4 border-r border-b border-gray-400">
                          {invoice.imlName}
                        </td>

                        <td className="p-4 max-w-[.85vw] truncate border-r border-b border-gray-400" title={invoice.remarks}>
                          {invoice.remarks || "-"}
                        </td>

                      </tr>
                    )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Invoices Found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Invoices are generated when products are deleted via change
                requests.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
