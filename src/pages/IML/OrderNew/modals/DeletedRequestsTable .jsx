const DeletedRequestsTable = ({ invoices }) => {
  if (!invoices?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-red-600">🗑️</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Deleted Requests</h3>
        <p className="text-gray-500">No products have been soft deleted yet.</p>
      </div>
    );
  }

  const totalRefunded = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 🔥 DELETED SUMMARY */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-red-600">{invoices.length}</div>
            <div className="text-sm text-red-700 font-medium">Deleted Products</div>
          </div>
          <div>
            <div className="text-3xl font-black text-orange-600">₹{totalRefunded.toLocaleString()}</div>
            <div className="text-sm text-orange-700 font-medium">Refunded Amount</div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-600">{invoices.filter(i => i.status === 'Refunded').length}</div>
            <div className="text-sm text-gray-700 font-medium">Processed</div>
          </div>
        </div>
      </div>

      {/* 🔥 DELETED TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500 to-orange-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Invoice No</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Deleted Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Refund Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Delete Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice, idx) => (
                <tr key={invoice.id} className="hover:bg-red-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-semibold text-red-900">
                    {invoice.invoiceNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-semibold">{invoice.productName}</div>
                    {invoice.size && <div className="text-xs text-gray-500">{invoice.size}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                    ₹{(invoice.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
                      {invoice.reason || 'Product Deleted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default DeletedRequestsTable;