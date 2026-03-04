// Auto-extracted from OrdersManagement.jsx

const STORAGE_KEY = "imlorders";


export default function AllInvoicesModal({ allInvoicesModal, allInvoicesTab, orders, setAllInvoicesModal, setAllInvoicesTab, setOrders }) {
  if (!allInvoicesModal.isOpen) return null;

  // Filter orders for Delete Requests (productDeleted: true, NOT confirmed yet)
  const deleteRequestOrders = orders.filter(o => o.productDeleted && !o.orderConfirmDelete);

  // Filter orders for Delete History (orderConfirmDelete: true)
  const deleteHistoryOrders = orders.filter(o => o.orderConfirmDelete);

  // Group by company
  const groupByCompany = (ordersList) => {
    return ordersList.reduce((acc, order) => {
      const companyName = order.contact?.company || 'Unknown Company';
      if (!acc[companyName]) {
        acc[companyName] = [];
      }
      acc[companyName].push(order);
      return acc;
    }, {});
  };

  const deleteRequestsByCompany = groupByCompany(deleteRequestOrders);
  const deleteHistoryByCompany = groupByCompany(deleteHistoryOrders);

  // Accept delete request - sets orderConfirmDelete: true
  const handleAcceptDelete = (order) => {
    const invoiceNumber = prompt(`Enter Invoice Number for deleted order:\n${order.orderNumber || order.id}`);
    if (invoiceNumber && invoiceNumber.trim()) {
      const updatedOrders = orders.map(o =>
        o.id === order.id
          ? {
            ...o,
            orderConfirmDelete: true,
            deletionConfirmedAt: new Date().toISOString(),
            deletionInvoiceNumber: invoiceNumber.trim()
          }
          : o
      );
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('ordersUpdated'));
      alert('✅ Delete request accepted! Order moved to Delete History.');
    }
  };

  // Reject delete request - sets productDeleted: false
  const handleRejectDelete = (order) => {
    if (window.confirm(`Are you sure you want to reject the delete request for:\n${order.orderNumber || order.id}?`)) {
      const updatedOrders = orders.map(o =>
        o.id === order.id
          ? {
            ...o,
            productDeleted: false,
            deleteRequestedAt: undefined
          }
          : o
      );
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('ordersUpdated'));
      alert('✅ Delete request rejected! Order restored to active state.');
    }
  };

  // Product Table Component
  const ProductTable = ({ products }) => (
    <div className="overflow-x-auto mt-[1vw]">
      <table className="w-full border-collapse bg-white rounded">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">Product Name</th>
            <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">Size</th>
            <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">Quantity</th>
            <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">IML Details</th>
          </tr>
        </thead>
        <tbody>
          {products && products.length > 0 ? (
            products.map((product, idx) => {
              console.log(`Product: ${JSON.stringify(product, null, 2)}`);
              return (
                <tr key={product.id || idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-800 font-medium border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                    {product.productName || 'N/A'}
                  </td>
                  <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-700 border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                    {product.size || 'N/A'}
                  </td>
                  <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-700 border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                    {(() => {
                      const imlType = product.imlType || '';
                      const isLidAndTub = imlType.toUpperCase().includes('LID') && imlType.toUpperCase().includes('TUB');
                      const isLidOnly = imlType.toUpperCase().includes('LID') && !imlType.toUpperCase().includes('TUB');
                      const isTubOnly = imlType.toUpperCase().includes('TUB') && !imlType.toUpperCase().includes('LID');

                      if (isLidAndTub) {
                        // Show both lid and tub quantities
                        const lidQty = product.lidLabelQty || 'N/A';
                        const tubQty = product.tubLabelQty || 'N/A';
                        return (
                          <div className="flex flex-col gap-[0.2vw]">
                            <span className="text-[.85vw]"><strong>Lid:</strong> {lidQty}</span>
                            <span className="text-[.85vw]"><strong>Tub:</strong> {tubQty}</span>
                          </div>
                        );
                      } else if (isLidOnly) {
                        // Show only lid quantity
                        const lidQty = product.lidLabelQty || 'N/A';
                        return lidQty;
                      } else if (isTubOnly) {
                        // Show only tub quantity
                        const tubQty = product.tubLabelQty || 'N/A';
                        return tubQty;
                      } else {
                        // Fallback to general quantity
                        return product.tubLabelQty || 'N/A';
                      }
                    })()}
                  </td>

                  <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-700 border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                    <div className="flex flex-col gap-[0.2vw]">
                      <span className="text-[.85vw]"><strong>Name:</strong> {product.imlName || 'N/A'}</span>
                      <span className="text-[.85vw]"><strong>Type:</strong> {product.imlType || 'N/A'}</span>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" className="px-[1vw] py-[1.5vw] text-center text-[.9vw] text-gray-500">
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[50010] flex items-center justify-center p-[1.5vw]">
        <div className="bg-white rounded-[1.8vw] max-w-[92vw] w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">

          {/* TABS - Only 2 tabs */}
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white p-[1.8vw] rounded-t-[1.8vw]">
            <div className="flex gap-[1.2vw]">
              <button
                onClick={() => setAllInvoicesTab('deleteRequests')}
                className={`px-[1.25vw] py-[0.75vw] font-bold rounded-full transition-all text-[0.95vw] flex items-center gap-[0.5vw] cursor-pointer  ${allInvoicesTab === 'deleteRequests'
                  ? 'bg-white text-orange-700 shadow-[0_0.4vw_1vw_rgba(0,0,0,0.3)]'
                  : 'hover:bg-white/30 hover:scale-[1.02]'
                  }`}
              >
                Delete Requests ({deleteRequestOrders.length})
              </button>
              <button
                onClick={() => setAllInvoicesTab('deleteHistory')}
                className={`px-[1.25vw] py-[0.75vw] font-bold rounded-full transition-all text-[0.95vw] flex items-center gap-[0.5vw] cursor-pointer  ${allInvoicesTab === 'deleteHistory'
                  ? 'bg-white text-gray-700 shadow-[0_0.4vw_1vw_rgba(0,0,0,0.3)]'
                  : 'hover:bg-white/30 hover:scale-[1.02]'
                  }`}
              >
                Delete History ({deleteHistoryOrders.length})
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-[2vw] space-y-[1.5vw]">
            {allInvoicesTab === 'deleteRequests' ? (
              // DELETE REQUESTS TAB
              Object.keys(deleteRequestsByCompany).length > 0 ? (
                <div className="space-y-[1.5vw]">
                  {Object.entries(deleteRequestsByCompany).map(([companyName, companyOrders]) => (
                    <div key={companyName} className="bg-white rounded-lg shadow-md border border-orange-200 overflow-hidden">
                      {/* Company Header */}
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-[1.5vw] py-[1vw]">
                        <h3 className="text-[1.2vw] font-bold">{companyName}</h3>
                        <p className="text-[.9vw] text-orange-100">{companyOrders.length} Delete Request(s)</p>
                      </div>

                      {/* Orders */}
                      <div className="p-[1.5vw] space-y-[1.5vw]">
                        {companyOrders.map(order => (
                          <div key={order.id} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-[1.5vw]">
                            {/* Order Header */}
                            <div className="flex justify-between items-start mb-[1vw] pb-[1vw] border-b border-orange-200">
                              <div className="flex-1">
                                <h4 className="text-[1.1vw] font-bold text-gray-800 mb-[0.5vw]">
                                  📦 {order.orderNumber || order.id}
                                </h4>
                                <div className="grid grid-cols-3 gap-x-[2vw] gap-y-[0.3vw] text-[.9vw] text-gray-700">
                                  <span><strong>Contact:</strong> {order.contact?.contactName || 'N/A'}</span>
                                  <span><strong>Phone:</strong> {order.contact?.phone || 'N/A'}</span>
                                  <span><strong>Requested:</strong> {order.deleteRequestedAt ? new Date(order.deleteRequestedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                {order.orderEstimate && (
                                  <div className="mt-[0.5vw] text-[.9vw] text-gray-700 bg-white px-[1vw] py-[0.5vw] rounded border border-orange-200">
                                    <span><strong>Estimate No.:</strong> {order.orderEstimate.estimatedNumber || 'N/A'}</span>
                                    <span className="ml-[2vw]"><strong>Estimate Value:</strong> ₹{order.orderEstimate.estimatedValue || '0'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Product Table */}
                            <div className="mb-[1vw]">
                              <h5 className="text-[1vw] font-semibold text-gray-800 mb-[0.5vw]">Products:</h5>
                              <ProductTable products={order.products} />
                            </div>

                            {/* 🔥 Refund Info - shown if present */}
                            {order.refundInfo && (
                              <div className="mb-[1vw] bg-blue-50 border-2 border-blue-300 rounded-lg p-[1vw]">
                                <h5 className="text-[0.95vw] font-bold text-blue-800 mb-[0.5vw]">💰 Refund Details</h5>
                                <div className="space-y-[0.4vw]">
                                  <div>
                                    <span className="text-[0.8vw] font-semibold text-gray-600">Remarks: </span>
                                    <span className="text-[0.85vw] text-gray-800">{order.refundInfo.remarks}</span>
                                  </div>
                                  {order.refundInfo.documentName && (
                                    <div className="flex items-center gap-[0.5vw]">
                                      <span className="text-[0.8vw] font-semibold text-gray-600">Document: </span>
                                      <a
                                        href={order.refundInfo.document}
                                        download={order.refundInfo.documentName}
                                        className="text-[0.85vw] text-blue-600 hover:text-blue-800 underline flex items-center gap-[0.3vw]"
                                      >
                                        📎 {order.refundInfo.documentName}
                                      </a>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[0.8vw] font-semibold text-gray-600">Submitted: </span>
                                    <span className="text-[0.8vw] text-gray-600">{order.refundInfo.submittedAt ? new Date(order.refundInfo.submittedAt).toLocaleString() : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-[1vw] mt-[1vw] pt-[1vw] border-t border-orange-200">
                              <button
                                onClick={() => handleAcceptDelete(order)}
                                className="px-[1vw] py-[0.55vw] bg-green-600 text-white rounded-lg hover:bg-green-700 text-[.95vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                              >
                                Accept & Generate Invoice
                              </button>
                              <button
                                onClick={() => handleRejectDelete(order)}
                                className="px-[1vw] py-[0.55vw] bg-red-600 text-white rounded-lg hover:bg-red-700 text-[.95vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                              >
                                Reject Request
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-[5vw]">
                  <div className="w-[7vw] h-[7vw] mx-auto mb-[2vw] flex items-center justify-center rounded-2xl bg-orange-100 shadow-lg">
                    <svg className="w-[3.5vw] h-[3.5vw] text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[1.3vw] font-bold text-gray-900 mb-[0.5vw]">No Delete Requests</h3>
                  <p className="text-[0.9vw] text-gray-500">All delete requests have been processed.</p>
                </div>
              )
            ) : (
              // DELETE HISTORY TAB
              Object.keys(deleteHistoryByCompany).length > 0 ? (
                <div className="space-y-[1.5vw]">
                  {Object.entries(deleteHistoryByCompany).map(([companyName, companyOrders]) => (
                    <div key={companyName} className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                      {/* Company Header */}
                      <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-[1.5vw] py-[1vw]">
                        <h3 className="text-[1.2vw] font-bold">{companyName}</h3>
                        <p className="text-[.9vw] text-gray-200">{companyOrders.length} Confirmed Deletion(s)</p>
                      </div>

                      {/* Orders */}
                      <div className="p-[1.5vw] space-y-[1.5vw]">
                        {companyOrders.map(order => (
                          <div key={order.id} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-[1.5vw]">
                            {/* Order Header */}
                            <div className="flex justify-between items-start mb-[1vw] pb-[1vw] border-b border-gray-300">
                              <div className="flex-1">
                                <h4 className="text-[1.1vw] font-bold text-gray-800 mb-[0.5vw]">
                                  📦 {order.orderNumber || order.id}
                                </h4>
                                <div className="grid grid-cols-2 gap-x-[2vw] gap-y-[0.3vw] text-[.9vw] text-gray-700">
                                  <span><strong>Contact:</strong> {order.contact?.contactName || 'N/A'}</span>
                                  <span><strong>Phone:</strong> {order.contact?.phone || 'N/A'}</span>
                                  <span><strong>Email:</strong> {order.contact?.email || 'N/A'}</span>
                                  <span><strong>Confirmed:</strong> {order.deletionConfirmedAt ? new Date(order.deletionConfirmedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>

                                {/* Invoice Info */}
                                {order.deletionInvoiceNumber && (
                                  <div className="mt-[1vw] bg-green-100 border-2 border-green-400 rounded-lg p-[1vw]">
                                    <div className="flex items-center gap-[1vw]">
                                      <svg className="w-[1.5vw] h-[1.5vw] text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      <div>
                                        <p className="text-[1vw] font-bold text-green-800">
                                          Invoice Generated: {order.deletionInvoiceNumber}
                                        </p>
                                        <p className="text-[.85vw] text-green-700">
                                          Deletion confirmed and processed
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Product Table */}
                            <div>
                              <h5 className="text-[1vw] font-semibold text-gray-800 mb-[0.5vw]">Products:</h5>
                              <ProductTable products={order.products} />
                            </div>

                            {/* 🔥 Refund Info in history */}
                            {order.refundInfo && (
                              <div className="mt-[1vw] bg-blue-50 border-2 border-blue-300 rounded-lg p-[1vw]">
                                <h5 className="text-[0.95vw] font-bold text-blue-800 mb-[0.5vw]">💰 Refund Details</h5>
                                <div className="space-y-[0.4vw]">
                                  <div>
                                    <span className="text-[0.8vw] font-semibold text-gray-600">Remarks: </span>
                                    <span className="text-[0.85vw] text-gray-800">{order.refundInfo.remarks}</span>
                                  </div>
                                  {order.refundInfo.documentName && (
                                    <div className="flex items-center gap-[0.5vw]">
                                      <span className="text-[0.8vw] font-semibold text-gray-600">Document: </span>
                                      <a
                                        href={order.refundInfo.document}
                                        download={order.refundInfo.documentName}
                                        className="text-[0.85vw] text-blue-600 hover:text-blue-800 underline flex items-center gap-[0.3vw]"
                                      >
                                        📎 {order.refundInfo.documentName}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-[5vw]">
                  <div className="w-[7vw] h-[7vw] mx-auto mb-[2vw] flex items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
                    <svg className="w-[3.5vw] h-[3.5vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[1.3vw] font-bold text-gray-900 mb-[0.5vw]">No Delete History</h3>
                  <p className="text-[0.9vw] text-gray-500">No orders have been confirmed for deletion yet.</p>
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="py-[1.25vw] px-[1vw] border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-end justify-end">
            <button
              onClick={() => setAllInvoicesModal({ isOpen: false, invoices: [], deletedInvoices: [] })}
              className="px-[.8vw] py-[.35vw] bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded font-bold text-[.85vw] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}