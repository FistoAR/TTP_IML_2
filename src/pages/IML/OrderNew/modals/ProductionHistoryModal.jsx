// Auto-extracted from OrdersManagement.jsx


export default function ProductionHistoryModal({ productionHistoryModal, setProductionHistoryModal, calculateRemainingLabels }) {
  if (
    !productionHistoryModal.isOpen ||
    !productionHistoryModal.order ||
    !productionHistoryModal.product
  )
    return null;

  const { order, product, history } = productionHistoryModal;

  const handleClose = () => {
    setProductionHistoryModal({
      isOpen: false,
      order: null,
      product: null,
      history: [],
    });
  };

  // Calculate totals
  const totalAllocated = history.reduce(
    (sum, item) => sum + (item.allocatedQty || 0),
    0,
  );
  const currentRemaining =
    product.remainingAfterAllocation || calculateRemainingLabels(product);

  return (
    <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50000 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[80vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <h2 className="text-[1.25vw] font-semibold">
            Production Allocation History
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Summary Card */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Allocation Summary
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Total Allocated
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalAllocated}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Current Remaining
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {currentRemaining}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Product</p>
                <p className="text-lg font-semibold">{product.productName}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Company</p>
                <p className="text-lg font-semibold">
                  {order.contact.company}
                </p>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Date & Time
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Allocation ID
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Remaining Before
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Allocated Qty
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Remaining After
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                    >
                      No allocation history found
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3">
                        {new Date(item.timestamp).toLocaleString("en-IN")}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-mono text-sm">
                        {item.id}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.remainingBefore}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-600">
                        {item.allocatedQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.remainingAfter}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {item.type === "remaining_allocation"
                            ? "Remaining Allocation"
                            : "Main Order"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {history.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan="3"
                      className="border border-gray-300 px-4 py-3 text-right font-semibold"
                    >
                      Total Allocated:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-700">
                      {totalAllocated}
                    </td>
                    <td
                      colSpan="2"
                      className="border border-gray-300 px-4 py-3"
                    ></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}