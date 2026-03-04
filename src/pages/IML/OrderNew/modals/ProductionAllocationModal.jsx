// Auto-extracted from OrdersManagement.jsx

const STORAGE_KEY = "imlorders";
const STORAGE_KEY_PRODUCTION_ALLOCATION = "iml_production_allocation";


export default function ProductionAllocationModal({ orders, productionModal, setOrders, setProductionModal }) {
  if (
    !productionModal.isOpen ||
    !productionModal.order ||
    !productionModal.product
  )
    return null;

  const { order, product, remainingQty, sendToProductionQty } =
    productionModal;

  // FIXED: Calculate current remaining after previous allocations
  const calculateCurrentRemaining = () => {
    const orderKey = `${order.id}_${product.id}`;
    const existingAllocations = JSON.parse(
      localStorage.getItem(STORAGE_KEY_PRODUCTION_ALLOCATION) || "{}",
    );

    const allocations = existingAllocations[orderKey] || [];
    const totalAlreadyAllocated = allocations.reduce(
      (sum, alloc) => sum + (alloc.allocatedQty || 0),
      0,
    );

    // Current remaining = original remaining - already allocated
    return Math.max(remainingQty - totalAlreadyAllocated, 0);
  };

  const currentRemainingQty = calculateCurrentRemaining();

  const handleSendToProduction = () => {
    const qty = parseInt(sendToProductionQty) || 0;

    if (qty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (qty > currentRemainingQty) {
      alert(`Cannot send more than ${currentRemainingQty} labels`);
      return;
    }

    // Generate unique ID for this allocation
    const allocationId = `alloc_${Date.now()}`;

    // Load existing allocations
    const existingAllocations = JSON.parse(
      localStorage.getItem(STORAGE_KEY_PRODUCTION_ALLOCATION) || "{}",
    );

    const orderKey = `${order.id}_${product.id}`;

    if (!existingAllocations[orderKey]) {
      existingAllocations[orderKey] = [];
    }

    // Calculate remaining after this allocation
    const remainingAfter = currentRemainingQty - qty;

    // Add new allocation
    const allocation = {
      id: allocationId,
      timestamp: new Date().toISOString(),
      orderId: order.id,
      productId: product.id,
      orderNumber: order.orderNumber,
      company: order.contact.company,
      imlName: product.imlName,
      productName: product.productName,
      size: product.size,
      imlType: product.imlType,
      currentRemaining: currentRemainingQty, // NEW: Store current remaining
      allocatedQty: qty,
      remainingAfter: remainingAfter,
      type: "remaining_allocation",
    };

    existingAllocations[orderKey].push(allocation);

    // Save to localStorage
    localStorage.setItem(
      STORAGE_KEY_PRODUCTION_ALLOCATION,
      JSON.stringify(existingAllocations),
    );

    // Update order's remaining quantity in production records
    const updatedOrders = orders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          products: o.products.map((p) => {
            if (p.id === product.id) {
              // Store production allocation info
              const prodAllocations = p.productionAllocations || [];
              return {
                ...p,
                productionAllocations: [...prodAllocations, allocation],
                remainingAfterAllocation: remainingAfter,
              };
            }
            return p;
          }),
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

    // Close modal and refresh
    setProductionModal({
      isOpen: false,
      order: null,
      product: null,
      remainingQty: 0,
      sendToProductionQty: "",
      finalRemainingQty: 0,
    });

    alert(`${qty} labels allocated to production successfully!`);
  };

  const handleClose = () => {
    setProductionModal({
      isOpen: false,
      order: null,
      product: null,
      remainingQty: 0,
      sendToProductionQty: "",
      finalRemainingQty: 0,
    });
  };

  // FIXED: Updated handleQtyChange
  const handleQtyChange = (e) => {
    const inputValue = e.target.value;

    // Allow empty input
    if (inputValue === "") {
      setProductionModal((prev) => ({
        ...prev,
        sendToProductionQty: "",
        finalRemainingQty: currentRemainingQty, // Use currentRemainingQty
      }));
      return;
    }

    // Only allow numbers
    const numericValue = inputValue.replace(/[^0-9]/g, "");

    if (numericValue === "") {
      setProductionModal((prev) => ({
        ...prev,
        sendToProductionQty: "",
        finalRemainingQty: currentRemainingQty,
      }));
      return;
    }

    const value = parseInt(numericValue, 10);

    if (isNaN(value)) {
      setProductionModal((prev) => ({
        ...prev,
        sendToProductionQty: "",
        finalRemainingQty: currentRemainingQty,
      }));
      return;
    }

    // Calculate final remaining
    const finalRemaining = Math.max(currentRemainingQty - value, 0);

    // If value exceeds remaining, cap it at currentRemainingQty
    const displayValue =
      value > currentRemainingQty ? currentRemainingQty : value;
    const displayRemaining = value > currentRemainingQty ? 0 : finalRemaining;

    setProductionModal((prev) => ({
      ...prev,
      sendToProductionQty: displayValue.toString(),
      finalRemainingQty: displayRemaining,
    }));
  };

  // FIXED: Calculate order and produced quantities correctly
  const calculateOrderQuantity = () => {
    let orderQty = 0;
    if (product.imlType === "LID" || product.imlType === "LID & TUB") {
      orderQty += parseInt(product.lidLabelQty) || 0;
    }
    if (product.imlType === "TUB" || product.imlType === "LID & TUB") {
      orderQty += parseInt(product.tubLabelQty) || 0;
    }
    return orderQty;
  };

  const calculateProducedQuantity = () => {
    let producedQty = 0;
    if (product.imlType === "LID" || product.imlType === "LID & TUB") {
      producedQty += parseInt(product.lidProductionQty) || 0;
    }
    if (product.imlType === "TUB" || product.imlType === "LID & TUB") {
      producedQty += parseInt(product.tubProductionQty) || 0;
    }
    return producedQty;
  };

  return (
    <div
      className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50000 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-[1.25vw] font-semibold">
            Allocate to Production
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-all cursor-pointer"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Order Details */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Order Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Company Name
                </label>
                <p className="text-base font-semibold">
                  {order.contact.company}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Order Number
                </label>
                <p className="text-base font-semibold">{order.orderNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Product Name
                </label>
                <p className="text-base font-semibold">
                  {product.productName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Size
                </label>
                <p className="text-base font-semibold">{product.size}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  IML Name
                </label>
                <p className="text-base font-semibold">{product.imlName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  IML Type
                </label>
                <p className="text-base font-semibold">{product.imlType}</p>
              </div>
            </div>
          </div>

          {/* Quantity Information - UPDATED with 4 columns */}
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Quantity Information
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Order Quantity
                </label>
                <p className="text-xl font-bold text-blue-600">
                  {calculateOrderQuantity().toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Produced Quantity
                </label>
                <p className="text-xl font-bold text-orange-600">
                  {calculateProducedQuantity().toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Current Remaining
                </label>
                <p className="text-xl font-bold text-purple-600">
                  {currentRemainingQty.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (After previous allocations)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Original Remaining
                </label>
                <p className="text-xl font-bold text-red-600">
                  {remainingQty.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Allocation Form */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Allocation Details
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Send to Production Quantity *
                </label>
                <input
                  type="text"
                  value={sendToProductionQty}
                  onChange={handleQtyChange}
                  onKeyDown={(e) => {
                    // Allow only numbers and control keys
                    if (
                      !/[\d\b\t\n]|Arrow|Delete|Backspace|Enter/.test(
                        e.key,
                      ) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Final Remaining After Allocation
                </label>
                <input
                  type="text"
                  value={currentRemainingQty.toLocaleString()}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  = Current Remaining ({currentRemainingQty.toLocaleString()})
                  - Allocated
                </p>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleSendToProduction}
                  disabled={
                    !sendToProductionQty || parseInt(sendToProductionQty) <= 0
                  }
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                  type="button"
                >
                  Allocate to Production
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              * Maximum: {currentRemainingQty.toLocaleString()} labels
              available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}