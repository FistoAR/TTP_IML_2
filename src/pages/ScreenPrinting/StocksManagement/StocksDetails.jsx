import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const GOODS_RETURNED_STORAGE_KEY = "screen_printing_goods_returned_data";
const STOCKS_VERIFIED_STORAGE_KEY = "screen_printing_stocks_verified_data";
const SCREEN_PRINTING_ORDERS_KEY = "screen_printing_orders";
const SALES_PAYMENT_STORAGE_KEY = "screen_printing_sales_payment_data";
const STORAGE_KEY_BILLING = "screen_printing_billing_data";
const BILLING_STORAGE_KEY = "screen_printing_billing_data";


export default function StocksDetails() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [allBills, setAllBills] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedData, setVerifiedData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all"); // New
  const [filterSize, setFilterSize] = useState("all"); // New


  // Load order data
  useEffect(() => {
  const storedOrder = localStorage.getItem("editing_stock_order");
  if (storedOrder) {
    const parsedOrder = JSON.parse(storedOrder);

    // Load the full order details from screen_printing_orders
    const ordersStored = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
    const allOrders = ordersStored ? JSON.parse(ordersStored) : [];
    const fullOrder = allOrders.find((order) => order.id === parsedOrder.id);

    if (fullOrder) {
      // Merge with parsed order data
      const completeOrder = {
        ...fullOrder,
        ...parsedOrder,
        contact: fullOrder.contact || parsedOrder.contact,
        orderNumber: fullOrder.orderNumber || parsedOrder.orderNumber,
      };

      setOrderData(completeOrder);

      // Load available products (not yet verified)
      loadAvailableProducts(completeOrder);

      // Load already verified data
      loadVerifiedData(completeOrder.id);

      // Load sales payment bills for this order
      loadAllData(completeOrder.id); // Pass the orderId here
    } else {
      alert("Order not found in screen printing orders!");
      navigate("/screen-printing/stocks");
    }
  } else {
    alert("No order data found. Redirecting back...");
    navigate("/screen-printing/stocks");
  }
}, [navigate]);



  useEffect(() => {
  if (allBills.length > 0) {
    const groupedOrders = getFilteredGroupedBills();
    const newExpandedCompanies = {};
    const newExpandedOrders = {};
    const newExpandedBills = {};

    // Expand all companies
    Object.entries(groupedOrders).forEach(([companyName, orders]) => {
      newExpandedCompanies[companyName] = true;

      // Expand first order for each company
      const orderKeys = Object.keys(orders);
      if (orderKeys.length > 0) {
        const firstOrderKey = orderKeys[0];
        newExpandedOrders[`${companyName}_${firstOrderKey}`] = true;

        // Expand ALL bills in the first order
        orders[firstOrderKey].forEach((bill) => {
          newExpandedBills[`${companyName}_${firstOrderKey}_${bill.billId}`] = true;
        });
      }
    });

  }
}, [allBills.length]);

// useEffect(() => {
//     loadAllData();
//   }, []);

useEffect(() => {
  if (orderData) {
    loadAllData();
  }
}, [orderData]); // This runs when orderData is available


  const loadAllData = () => {
  try {
    // Load sales payment data
    const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
    const allSalesPayments = salesPaymentData
      ? JSON.parse(salesPaymentData)
      : {};

    // Get only the current order's bills
    const orderId = orderData?.id;
    const currentOrderBills = orderId ? allSalesPayments[orderId] || [] : [];

    // Build bills array for current order only
    const billsArray = currentOrderBills.map((bill) => ({
      orderId: orderId,
      ...bill,
      status: bill.status || "pending",
    }));

    // Sort by creation date - latest first
    const sortedBills = billsArray.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    setAllBills(sortedBills);
  } catch (error) {
    console.error("Error loading data:", error);
  }
};


 const groupBillsByCompany = () => {
    const grouped = {};

    allBills.forEach((bill) => {
      const companyName = bill.contact?.company || "Unknown Company";
      const orderNumber = bill.orderNumber || "N/A";

      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      if (!grouped[companyName][orderNumber]) {
        grouped[companyName][orderNumber] = [];
      }

      grouped[companyName][orderNumber].push(bill);
    });

    return grouped;
  };
  

 const getFilteredGroupedBills = () => {
  const filtered = {};
  
  // Filter bills to only include current order
  const currentOrderBills = allBills.filter(bill => 
    bill.orderNumber === orderData?.orderNumber || bill.orderId === orderData?.id
  );

  // Group by company and order (should be just one company/order for the current order)
  currentOrderBills.forEach((bill) => {
    const companyName = bill.contact?.company || "Unknown Company";
    const orderNumber = bill.orderNumber || "N/A";

    if (!filtered[companyName]) {
      filtered[companyName] = {};
    }

    if (!filtered[companyName][orderNumber]) {
      filtered[companyName][orderNumber] = [];
    }

    filtered[companyName][orderNumber].push(bill);
  });

  return filtered;
};

  const filteredGroupedBills = getFilteredGroupedBills();

  // Load available products that haven't been verified yet
const loadAvailableProducts = (order) => {
  try {
    // Get already verified products
    const stocksVerified = localStorage.getItem(STOCKS_VERIFIED_STORAGE_KEY);
    const allVerified = stocksVerified ? JSON.parse(stocksVerified) : {};
    const orderVerified = allVerified[order.id] || [];

    // Filter products that are not fully verified
    const products = Object.values(order.products);
    
    // Create a map of verified quantities for quick lookup
    const verifiedMap = {};
    orderVerified.forEach((item) => {
      verifiedMap[item.productId] = item.quantityVerified;
    });

    const available = products.filter((product) => {
      const productId = product.productId || product.id;
      const verifiedQty = verifiedMap[productId] || 0;
      return verifiedQty < product.totalReceived;
    });

    setAvailableProducts(available);

    // Initialize selected products with default quantities
    const initialSelection = {};
    available.forEach((product) => {
      const productId = product.productId || product.id;
      const alreadyVerified = verifiedMap[productId] || 0;
      const remaining = product.totalReceived - alreadyVerified;

      initialSelection[productId] = {
        selected: false,
        quantity: remaining > 0 ? remaining : 0,
        maxQuantity: remaining > 0 ? remaining : 0,
        alreadyVerified: alreadyVerified,
      };
    });
    setSelectedProducts(initialSelection);
  } catch (error) {
    console.error("Error loading available products:", error);
  }
};


  // Load verified data
  const loadVerifiedData = (orderId) => {
    try {
      const stocksVerified = localStorage.getItem(STOCKS_VERIFIED_STORAGE_KEY);
      const allVerified = stocksVerified ? JSON.parse(stocksVerified) : {};
      const orderVerified = allVerified[orderId] || [];

      // Group by updatedAt (acts like bill time)
      const grouped = {};

      orderVerified.forEach((item) => {
        const billKey = item.updatedAt || item.createdAt;

        if (!grouped[billKey]) {
          grouped[billKey] = [];
        }

        grouped[billKey].push(item);
      });

      // Convert to array sorted by time (latest first)
      const bills = Object.entries(grouped)
        .map(([billTime, items]) => ({
          billTime,
          items,
        }))
        .sort((a, b) => new Date(b.billTime) - new Date(a.billTime));

      setVerifiedData(bills);
    } catch (error) {
      console.error("Error loading verified data:", error);
    }
  };

  // Handle product selection
  const handleProductSelect = (productId, checked) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: checked,
      },
    }));
  };

  // Handle quantity change
  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 0;
    const maxQuantity = selectedProducts[productId].maxQuantity;

    if (quantity > maxQuantity) {
      alert(`Maximum quantity available: ${maxQuantity}`);
      return;
    }

    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: quantity,
      },
    }));
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    const updated = {};
    Object.keys(selectedProducts).forEach((productId) => {
      updated[productId] = {
        ...selectedProducts[productId],
        selected: checked,
      };
    });
    setSelectedProducts(updated);
  };

  // Check if all products are selected
  const areAllSelected = () => {
    return Object.values(selectedProducts).every((p) => p.selected);
  };

  // Get selected products count
  const getSelectedCount = () => {
    return Object.values(selectedProducts).filter((p) => p.selected).length;
  };

  // Handle Verify and Send
const handleVerifyAndSend = () => {
  const selected = Object.entries(selectedProducts).filter(
    ([_, data]) => data.selected,
  );

  if (selected.length === 0) {
    alert("Please select at least one product to verify and send");
    return;
  }

  // Validate quantities
  for (const [productId, data] of selected) {
    if (data.quantity <= 0) {
      alert("Please enter valid quantities for all selected products");
      return;
    }
  }

  if (
    !window.confirm(
      `Verify and send ${selected.length} product(s) to Sales Payment?`,
    )
  ) {
    return;
  }

  try {
    // Save verified stock data
    const stocksVerified = localStorage.getItem(STOCKS_VERIFIED_STORAGE_KEY);
    const allVerified = stocksVerified ? JSON.parse(stocksVerified) : {};

    if (!allVerified[orderData.id]) {
      allVerified[orderData.id] = [];
    }

    // First, get current verified state to calculate correctly
    const currentVerifiedMap = {};
    (allVerified[orderData.id] || []).forEach((item) => {
      currentVerifiedMap[item.productId] = item;
    });

    // Update or add verified entries
    selected.forEach(([productId, data]) => {
      const product = availableProducts.find(
        (p) => (p.productId === productId || p.id === productId),
      );

      if (!product) {
        console.error(`Product not found: productId=${productId}`);
        throw new Error(`Product with ID ${productId} not found`);
      }

      const actualProductId = product.productId || product.id;
      const currentVerified = currentVerifiedMap[actualProductId];
      const newVerifiedQty = (currentVerified?.quantityVerified || 0) + data.quantity;

      const verifiedEntry = {
        productId: actualProductId,
        productName: product.productName,
        size: product.size,
        printingName: product.printingName,
        quantityVerified: newVerifiedQty,
        totalReceived: product.totalReceived,
        createdAt: currentVerified?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (currentVerified) {
        const index = allVerified[orderData.id].findIndex(
          (v) => v.productId === actualProductId,
        );
        if (index >= 0) {
          allVerified[orderData.id][index] = verifiedEntry;
        } else {
          allVerified[orderData.id].push(verifiedEntry);
        }
      } else {
        allVerified[orderData.id].push(verifiedEntry);
      }
    });

    localStorage.setItem(
      STOCKS_VERIFIED_STORAGE_KEY,
      JSON.stringify(allVerified),
    );

    // Prepare data for Sales Payment
    const salesPaymentData = {
      billId: `bill-${Date.now()}`,
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      contact: orderData.contact,
      products: selected.map(([productId, data]) => {
        const product = availableProducts.find(
          (p) => p.productId === productId || p.id === productId,
        );

        if (!product) {
          console.error(`Product not found for sales payment: productId=${productId}`);
          throw new Error(`Product with ID ${productId} not found`);
        }

        return {
          productId: product.productId || product.id,
          productName: product.productName,
          size: product.size,
          printingName: product.printingName,
          quantity: data.quantity,
          rate: 0,
          amount: 0,
        };
      }),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Save to Sales Payment storage
    const salesPaymentStored = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
    const allSalesPayments = salesPaymentStored ? JSON.parse(salesPaymentStored) : {};
    
    if (!allSalesPayments[orderData.id]) {
      allSalesPayments[orderData.id] = [];
    }
    
    allSalesPayments[orderData.id].push(salesPaymentData);
    
    localStorage.setItem(
      SALES_PAYMENT_STORAGE_KEY,
      JSON.stringify(allSalesPayments),
    );

    alert("Products verified and sent to Sales Payment successfully!");
    
    // Reload all data
    loadAvailableProducts(orderData);
    loadVerifiedData(orderData.id);
    loadAllData();
    
    // Clear selections - but don't reset to empty object
    // Instead, let loadAvailableProducts rebuild it
    
  } catch (error) {
    console.error("Error verifying and sending:", error);
    alert(`An error occurred: ${error.message}. Please try again.`);
  }
};

  // Handle back
  const handleBack = () => {
    navigate("/screen-printing/stocks");
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[1.2vw] text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[0.5vw]">
          <button
            onClick={handleBack}
            className="flex gap-[0.5vw] items-center cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[1vw] h-[1vw]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw] font-medium">Back</span>
          </button>
          <h1 className="text-[1.6vw] font-bold text-gray-900">
            Verify & Send to Sales
          </h1>
          <div className="w-[5vw]"></div>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
        {/* Order Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Order Information
          </h2>
          <div className="grid grid-cols-3 gap-[1vw]">
            <div>
              <p className="text-[0.8vw] text-gray-500">Company Name</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {orderData.contact?.company || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Order Number</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {orderData.orderNumber || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Contact Person</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {orderData.contact?.contactName || "NA"}
              </p>
            </div>
          </div>
        </div>

        {/* Already Verified Products */}
{allBills.length > 0 && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-[1.5vw] mb-[1.5vw]">
    <h2 className="text-[1.2vw] font-semibold text-green-800 mb-[1vw]">
      ✓ History of Products Sent to Sales Payment
    </h2>

    <div className="space-y-[1.5vw]">
      {allBills.map((bill, billIndex) => (
        <div
          key={bill.billId || billIndex}
          className={`border-2 rounded-lg overflow-hidden border-gray-400
          }`}
        >
          {/* Bill Header */}
          <div className="px-[1.5vw] py-[0.75vw] bg-white border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-[0.95vw] font-semibold text-gray-800">
                  Bill #{billIndex + 1}
                </h5>
                <div className="flex gap-[1.5vw] mt-[0.25vw] text-[0.8vw] text-gray-600">
                  <span>
                    <strong>Sent to Sales:</strong>{" "}
                    {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>
                    <strong>Products:</strong> {bill.products.length}
                  </span>
                  <span
                    className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.7vw] font-semibold ${
                      bill.status === "completed"
                        ? "bg-green-200 text-green-800"
                        : "bg-orange-200 text-orange-800"
                    }`}
                  >
                    {bill.status === "completed"
                      ? "✓ Sent to Billing"
                      : "○ Pending in Sales"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Products Table */}
          <div className="px-[1.5vw] pb-[1vw] pt-[1vw] bg-white">
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                      S.No
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                      Product Name
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                      Size
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                      Printing Name
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.5vw] text-left text-[0.8vw] font-semibold">
                      Quantity Sent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bill.products.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw]">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw] font-medium">
                        {product.productName}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw]">
                        {product.size}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw]">
                        {product.printingName}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw] font-semibold text-blue-600">
                        {product.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {bill.products.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td
                        colSpan="4"
                        className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw] font-semibold text-right"
                      >
                        Total Quantity Sent in this batch:
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.5vw] text-[0.8vw] font-bold text-green-600">
                        {bill.products.reduce(
                          (sum, product) => sum + (product.quantity || 0),
                          0
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* Product Selection */}
        {availableProducts.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
            <div className="flex justify-between items-center mb-[1vw] border-b pb-[0.5vw]">
              <h2 className="text-[1.2vw] font-semibold text-gray-800">
                Select Products to Verify & Send
              </h2>
              <div className="flex items-center gap-[1vw]">
                <span className="text-[0.9vw] text-gray-600">
                  Selected: {getSelectedCount()} / {availableProducts.length}
                </span>
                <label className="flex items-center gap-[0.5vw] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={areAllSelected()}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-[1.1vw] h-[1.1vw] cursor-pointer"
                  />
                  <span className="text-[0.9vw] font-medium text-gray-700">
                    Select All
                  </span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-center text-[0.85vw] font-semibold">
                      Select
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      S.No
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Product Name
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Size
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Printing Name
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Total Received
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Already Verified
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Quantity to Verify
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableProducts.map((product, idx) => {
                    const selection = selectedProducts[product.productId];
                    return (
                      <tr
                        key={product.productId}
                        className={`hover:bg-gray-50 ${
                          selection?.selected ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-center">
                          <input
                            type="checkbox"
                            checked={selection?.selected || false}
                            onChange={(e) =>
                              handleProductSelect(
                                product.productId,
                                e.target.checked,
                              )
                            }
                            className="w-[1.1vw] h-[1.1vw] cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                          {product.productName}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                          {product.size}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                          {product.printingName}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                          {product.totalReceived}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-green-600">
                          {selection?.maxQuantity || 0}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[0.6vw]">
                          <input
                            type="number"
                            value={selection?.quantity || 0}
                            onChange={(e) =>
                              handleQuantityChange(
                                product.productId,
                                e.target.value,
                              )
                            }
                            min="1"
                            max={selection?.maxQuantity || 0}
                            disabled={!selection?.selected}
                            className="w-full border border-gray-300 rounded px-[0.5vw] py-[0.3vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <p className="text-[0.7vw] text-gray-500 mt-[0.25vw]">
                            Max: {selection?.maxQuantity || 0}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Button */}
            <div className="flex justify-end mt-[1.5vw]">
              <button
                onClick={handleVerifyAndSend}
                disabled={getSelectedCount() === 0}
                className="px-[2vw] py-[0.75vw] bg-green-600 text-white rounded-lg font-semibold text-[1vw] hover:bg-green-700 transition-all cursor-pointer shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Verify & Send to Sales Payment ({getSelectedCount()})
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[3vw] text-center">
            <div className="w-[4vw] h-[4vw] bg-green-100 rounded-full flex items-center justify-center mx-auto mb-[1vw]">
              <svg
                className="w-[2vw] h-[2vw] text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-[1.2vw] font-semibold text-gray-900 mb-[0.5vw]">
              All Products Verified!
            </h3>
            <p className="text-gray-600 text-[0.9vw]">
              All products for this order have been verified and sent to sales
              payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
