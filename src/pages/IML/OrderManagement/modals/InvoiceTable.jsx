const InvoiceTable = ({ invoices }) => {
  if (!invoices?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-green-600">✅</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Active Invoices</h3>
        <p className="text-gray-500">All invoices are cleared or deleted.</p>
      </div>
    );
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 🔥 SUMMARY CARD */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-green-600">{invoices.length}</div>
            <div className="text-sm text-green-700 font-medium">Total Invoices</div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-600">₹{totalAmount.toLocaleString()}</div>
            <div className="text-sm text-indigo-700 font-medium">Total Amount</div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-600">{invoices.filter(i => i.status === 'Paid').length}</div>
            <div className="text-sm text-blue-700 font-medium">Paid</div>
          </div>
        </div>
      </div>

      {/* 🔥 DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Invoice No</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Order No</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice, idx) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-semibold text-indigo-900">
                    {invoice.invoiceNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{invoice.productName}</div>
                    {invoice.size && <div className="text-xs text-gray-500">{invoice.size}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ₹{(invoice.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'Draft' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {invoice.status}
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
export default InvoiceTable;