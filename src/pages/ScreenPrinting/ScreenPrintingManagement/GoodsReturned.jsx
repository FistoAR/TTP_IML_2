import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const JOBWORK_STORAGE_KEY = "screen_printing_jobwork_data";
const GOODS_RETURNED_STORAGE_KEY = "screen_printing_goods_returned_data";

export default function GoodsReturned() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [jobWorkEntries, setJobWorkEntries] = useState([]);
  const [goodsReturnedEntries, setGoodsReturnedEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Form state for new/edit entry
  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    size: "",
    printingName: "",
    jobWorkEntryId: "",
    printerName: "",
    quantitySent: 0,
    quantityReceived: "",
    remarks: "",
  });

  // Load order data from localStorage
  useEffect(() => {
    const storedOrder = localStorage.getItem("editing_jobwork_order");
    if (storedOrder) {
      const parsedOrder = JSON.parse(storedOrder);
      setOrderData(parsedOrder);

      // Load existing job work entries for this order
      loadJobWorkEntries(parsedOrder.id);
      // Load existing goods returned entries
      loadGoodsReturnedEntries(parsedOrder.id);
    } else {
      alert("No order data found. Redirecting back...");
      navigate("/screen-printing/jobwork");
    }
  }, [navigate]);

  // Load job work entries from localStorage
  const loadJobWorkEntries = (orderId) => {
    try {
      const stored = localStorage.getItem(JOBWORK_STORAGE_KEY);
      if (stored) {
        const allEntries = JSON.parse(stored);
        const orderEntries = allEntries[orderId] || [];
        setJobWorkEntries(orderEntries);
      }
    } catch (error) {
      console.error("Error loading job work entries:", error);
    }
  };

  // Load goods returned entries from localStorage
  const loadGoodsReturnedEntries = (orderId) => {
    try {
      const stored = localStorage.getItem(GOODS_RETURNED_STORAGE_KEY);
      if (stored) {
        const allEntries = JSON.parse(stored);
        const orderEntries = allEntries[orderId] || [];
        setGoodsReturnedEntries(orderEntries);
      }
    } catch (error) {
      console.error("Error loading goods returned entries:", error);
    }
  };

  // Save goods returned entries to localStorage
  const saveGoodsReturnedEntries = (entries) => {
    try {
      const stored = localStorage.getItem(GOODS_RETURNED_STORAGE_KEY);
      const allEntries = stored ? JSON.parse(stored) : {};
      allEntries[orderData.id] = entries;
      localStorage.setItem(
        GOODS_RETURNED_STORAGE_KEY,
        JSON.stringify(allEntries)
      );
    } catch (error) {
      console.error("Error saving goods returned entries:", error);
    }
  };

  // Get job work entries for a specific product
  const getJobWorkEntriesForProduct = (productId) => {
    return jobWorkEntries.filter((entry) => entry.productId === productId);
  };

  // Handle product selection
  const handleProductSelect = (e) => {
    const productId = parseInt(e.target.value);
    if (!productId) {
      setFormData({
        productId: "",
        productName: "",
        size: "",
        printingName: "",
        jobWorkEntryId: "",
        printerName: "",
        quantitySent: 0,
        quantityReceived: "",
        remarks: "",
      });
      return;
    }

    const selectedProduct = orderData.products.find((p) => p.id === productId);

    if (selectedProduct) {
      setFormData({
        productId: selectedProduct.id,
        productName: selectedProduct.productName || "",
        size: selectedProduct.size || "",
        printingName: selectedProduct.printingName || "",
        jobWorkEntryId: "",
        printerName: "",
        quantitySent: 0,
        quantityReceived: "",
        remarks: "",
      });
    }
  };

  // Handle job work entry selection
  const handleJobWorkEntrySelect = (e) => {
    const entryId = parseInt(e.target.value);
    if (!entryId) {
      setFormData({
        ...formData,
        jobWorkEntryId: "",
        printerName: "",
        quantitySent: 0,
      });
      return;
    }

    const selectedEntry = jobWorkEntries.find((entry) => entry.id === entryId);
    if (selectedEntry) {
      setFormData({
        ...formData,
        jobWorkEntryId: selectedEntry.id,
        printerName: selectedEntry.printerName,
        quantitySent: selectedEntry.quantitySent,
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.productId) {
      alert("Please select a Product");
      return false;
    }
    if (!formData.jobWorkEntryId) {
      alert("Please select a Job Work Entry");
      return false;
    }
    if (
      !formData.quantityReceived ||
      parseInt(formData.quantityReceived) <= 0
    ) {
      alert("Please enter valid Quantity Received");
      return false;
    }

    // Check if quantity exceeds sent quantity
    const alreadyReceived = calculateJobWorkEntryReturns(
      formData.jobWorkEntryId
    ).totalReceived;
    const newQuantity = parseInt(formData.quantityReceived);
    const sentQuantity = formData.quantitySent;

    // If editing, subtract the current entry's quantity from already received
    let adjustedAlreadyReceived = alreadyReceived;
    if (editingEntryId) {
      const editingEntry = goodsReturnedEntries.find(
        (e) => e.id === editingEntryId
      );
      if (
        editingEntry &&
        editingEntry.jobWorkEntryId === formData.jobWorkEntryId
      ) {
        adjustedAlreadyReceived -= editingEntry.quantityReceived;
      }
    }

    if (adjustedAlreadyReceived + newQuantity > sentQuantity) {
      alert(
        `Quantity exceeds sent limit!\nQuantity Sent: ${sentQuantity}\nAlready Received: ${adjustedAlreadyReceived}\nRemaining: ${
          sentQuantity - adjustedAlreadyReceived
        }`
      );
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingEntryId !== null) {
      // Update existing entry
      const updatedEntries = goodsReturnedEntries.map((entry) =>
        entry.id === editingEntryId
          ? {
              ...entry,
              quantityReceived: parseInt(formData.quantityReceived),
              remarks: formData.remarks,
              updatedAt: new Date().toISOString(),
            }
          : entry
      );
      setGoodsReturnedEntries(updatedEntries);
      saveGoodsReturnedEntries(updatedEntries);
      alert("Goods returned entry updated successfully!");
      setEditingEntryId(null);
    } else {
      // Add new entry
      const newEntry = {
        id: Date.now(),
        productId: formData.productId,
        productName: formData.productName,
        size: formData.size,
        printingName: formData.printingName,
        jobWorkEntryId: formData.jobWorkEntryId,
        printerName: formData.printerName,
        quantitySent: formData.quantitySent,
        quantityReceived: parseInt(formData.quantityReceived),
        remarks: formData.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedEntries = [...goodsReturnedEntries, newEntry];
      setGoodsReturnedEntries(updatedEntries);
      saveGoodsReturnedEntries(updatedEntries);
      alert("Goods returned recorded successfully!");
    }

    // Reset form
    setFormData({
      productId: "",
      productName: "",
      size: "",
      printingName: "",
      jobWorkEntryId: "",
      printerName: "",
      quantitySent: 0,
      quantityReceived: "",
      remarks: "",
    });
  };

  // Handle edit entry
  const handleEditEntry = (entry) => {
    setFormData({
      productId: entry.productId,
      productName: entry.productName,
      size: entry.size,
      printingName: entry.printingName,
      jobWorkEntryId: entry.jobWorkEntryId,
      printerName: entry.printerName,
      quantitySent: entry.quantitySent,
      quantityReceived: entry.quantityReceived.toString(),
      remarks: entry.remarks,
    });
    setEditingEntryId(entry.id);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  // Handle delete entry
  const handleDeleteEntry = (entryId) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const updatedEntries = goodsReturnedEntries.filter(
        (entry) => entry.id !== entryId
      );
      setGoodsReturnedEntries(updatedEntries);
      saveGoodsReturnedEntries(updatedEntries);
      alert("Entry deleted successfully!");
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setFormData({
      productId: "",
      productName: "",
      size: "",
      printingName: "",
      jobWorkEntryId: "",
      printerName: "",
      quantitySent: 0,
      quantityReceived: "",
      remarks: "",
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/screen-printing/jobwork");
  };

  // Calculate totals for a specific product (from job work)
  const calculateProductTotals = (productId) => {
    const productEntries = jobWorkEntries.filter(
      (entry) => entry.productId === productId
    );
    const totalSent = productEntries.reduce(
      (sum, entry) => sum + entry.quantitySent,
      0
    );
    return { totalSent };
  };

  // Calculate returns for a specific job work entry
  const calculateJobWorkEntryReturns = (jobWorkEntryId) => {
    const returns = goodsReturnedEntries.filter(
      (entry) => entry.jobWorkEntryId === jobWorkEntryId
    );
    const totalReceived = returns.reduce(
      (sum, entry) => sum + entry.quantityReceived,
      0
    );
    return { totalReceived };
  };

  // Calculate product level returns
  const calculateProductReturns = (productId) => {
    const returns = goodsReturnedEntries.filter(
      (entry) => entry.productId === productId
    );
    const totalReceived = returns.reduce(
      (sum, entry) => sum + entry.quantityReceived,
      0
    );
    return { totalReceived };
  };

  // Calculate overall totals
  const calculateTotals = () => {
    const totalSent = jobWorkEntries.reduce(
      (sum, entry) => sum + entry.quantitySent,
      0
    );
    const totalReceived = goodsReturnedEntries.reduce(
      (sum, entry) => sum + entry.quantityReceived,
      0
    );
    const totalOrdered =
      orderData?.products?.reduce(
        (sum, product) => sum + (parseInt(product.quantity) || 0),
        0
      ) || 0;
    const pending = totalSent - totalReceived;

    return { totalOrdered, totalSent, totalReceived, pending };
  };

  // Get remaining quantity for selected job work entry
  const getRemainingQuantity = () => {
    if (!formData.jobWorkEntryId) return 0;
    const { totalReceived } = calculateJobWorkEntryReturns(
      formData.jobWorkEntryId
    );

    // If editing, add back the current entry's quantity
    let adjustedTotalReceived = totalReceived;
    if (editingEntryId) {
      const editingEntry = goodsReturnedEntries.find(
        (e) => e.id === editingEntryId
      );
      if (
        editingEntry &&
        editingEntry.jobWorkEntryId === formData.jobWorkEntryId
      ) {
        adjustedTotalReceived -= editingEntry.quantityReceived;
      }
    }

    return formData.quantitySent - adjustedTotalReceived;
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[1.2vw] text-gray-600">Loading...</div>
      </div>
    );
  }

  const totals = calculateTotals();

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
            Goods Returned
          </h1>
          <div className="w-[5vw]"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
        {/* Order Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Order Information
          </h2>
          <div className="grid grid-cols-2 gap-[1vw] mb-[1vw]">
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
            <div>
              <p className="text-[0.8vw] text-gray-500">Phone</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {orderData.contact?.phone || "NA"}
              </p>
            </div>
          </div>

          {/* Products Table */}
          <h3 className="text-[1vw] font-semibold text-gray-800 mb-[0.75vw] mt-[1.5vw]">
            Products
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
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
                    Order Quantity
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Sent
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Received
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderData.products?.map((product, idx) => {
                  const { totalSent } = calculateProductTotals(product.id);
                  const { totalReceived } = calculateProductReturns(
                    product.id
                  );
                  const orderQty = parseInt(product.quantity) || 0;
                  const pending = totalSent - totalReceived;

                  return (
                    <tr key={product.id || idx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                        {product.productName || "NA"}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {product.size || "NA"}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {product.printingName || "NA"}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold">
                        {product.quantity || "-"}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                        {totalSent}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-green-600">
                        {totalReceived}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-orange-600">
                        {pending}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-4 gap-[1vw] mt-[1vw] p-[1vw] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Total Ordered</p>
              <p className="text-[1.3vw] font-bold text-blue-600">
                {totals.totalOrdered}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Total Sent</p>
              <p className="text-[1.3vw] font-bold text-indigo-600">
                {totals.totalSent}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Total Received</p>
              <p className="text-[1.3vw] font-bold text-green-600">
                {totals.totalReceived}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Pending</p>
              <p className="text-[1.3vw] font-bold text-orange-600">
                {totals.pending}
              </p>
            </div>
          </div>
        </div>

        {/* Goods Returned History */}
        {goodsReturnedEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
            <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
              Goods Returned History
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
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
                      Printer Name
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Qty Sent
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Qty Received
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Remarks
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Date
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-center text-[0.85vw] font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {goodsReturnedEntries.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                        {entry.productName}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {entry.size}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {entry.printingName}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                        {entry.printerName}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                        {entry.quantitySent}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-green-600">
                        {entry.quantityReceived}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {entry.remarks || "-"}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                        {new Date(entry.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-center">
                        <div className="flex gap-[0.5vw] justify-center">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="px-[0.75vw] py-[0.3vw] bg-blue-600 text-white rounded hover:bg-blue-700 text-[0.8vw] font-medium transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="px-[0.75vw] py-[0.3vw] bg-red-600 text-white rounded hover:bg-red-700 text-[0.8vw] font-medium transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Record Goods Returned Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            {editingEntryId
              ? "Edit Goods Returned Entry"
              : "Record Goods Returned"}
          </h2>

          <div className="grid grid-cols-2 gap-[1.5vw] mb-[1.5vw]">
            {/* Product Selection */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Select Product <span className="text-red-500">*</span>
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleProductSelect}
                disabled={editingEntryId !== null}
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Product --</option>
                {orderData.products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productName} - {product.size} -{" "}
                    {product.printingName}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Work Entry Selection */}
            {formData.productId && (
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Select Job Work Entry <span className="text-red-500">*</span>
                </label>
                <select
                  name="jobWorkEntryId"
                  value={formData.jobWorkEntryId}
                  onChange={handleJobWorkEntrySelect}
                  disabled={editingEntryId !== null}
                  className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Job Work Entry --</option>
                  {getJobWorkEntriesForProduct(formData.productId).map(
                    (entry) => {
                      const { totalReceived } = calculateJobWorkEntryReturns(
                        entry.id
                      );
                      const remaining = entry.quantitySent - totalReceived;
                      return (
                        <option key={entry.id} value={entry.id}>
                          {entry.printerName} - Sent: {entry.quantitySent},
                          Received: {totalReceived}, Pending: {remaining}
                        </option>
                      );
                    }
                  )}
                </select>
              </div>
            )}

            {/* Show selected job work details */}
            {formData.jobWorkEntryId && (
              <>
                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                    Printer Name
                  </label>
                  <input
                    type="text"
                    value={formData.printerName}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                    Quantity Sent
                  </label>
                  <input
                    type="text"
                    value={formData.quantitySent}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-blue-50 font-semibold text-blue-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                    Already Received
                  </label>
                  <input
                    type="text"
                    value={
                      calculateJobWorkEntryReturns(formData.jobWorkEntryId)
                        .totalReceived
                    }
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-green-50 font-semibold text-green-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                    Remaining to Receive
                  </label>
                  <input
                    type="text"
                    value={getRemainingQuantity()}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-orange-50 font-semibold text-orange-600 cursor-not-allowed"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-[1.5vw]">
            {/* Quantity Received */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Quantity Received Now <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantityReceived"
                value={formData.quantityReceived}
                onChange={handleInputChange}
                placeholder="Enter quantity received"
                min="1"
                max={getRemainingQuantity()}
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                Remarks
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Optional remarks"
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-[1vw] mt-[1.5vw] justify-end">
            {editingEntryId && (
              <button
                onClick={handleCancelEdit}
                className="px-[1.5vw] py-[0.6vw] bg-gray-300 text-gray-700 rounded-lg font-medium text-[0.9vw] hover:bg-gray-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="px-[1.5vw] py-[0.6vw] bg-green-600 text-white rounded-lg font-semibold text-[0.9vw] hover:bg-green-700 transition-all cursor-pointer shadow-md"
            >
              {editingEntryId ? "Update" : "Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
