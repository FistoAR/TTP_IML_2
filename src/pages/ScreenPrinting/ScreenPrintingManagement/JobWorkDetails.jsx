import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const JOBWORK_STORAGE_KEY = "screen_printing_jobwork_data";

export default function JobWorkDetails() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [jobWorkEntries, setJobWorkEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Form state for new/edit entry
  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    size: "",
    printingName: "",
    printerName: "",
    quantitySent: "",
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

  // Save job work entries to localStorage
  const saveJobWorkEntries = (entries) => {
    try {
      const stored = localStorage.getItem(JOBWORK_STORAGE_KEY);
      const allEntries = stored ? JSON.parse(stored) : {};
      allEntries[orderData.id] = entries;
      localStorage.setItem(JOBWORK_STORAGE_KEY, JSON.stringify(allEntries));
    } catch (error) {
      console.error("Error saving job work entries:", error);
    }
  };

  // Handle product selection
  const handleProductSelect = (e) => {
    const productId = e.target.value;
    if (!productId) {
      setFormData({
        productId: "",
        productName: "",
        size: "",
        printingName: "",
        printerName: "",
        quantitySent: "",
        remarks: "",
      });
      return;
    }

    const selectedProduct = orderData.products.find(
      (p) => p.id.toString() === productId
    );

    if (selectedProduct) {
      setFormData({
        ...formData,
        productId: selectedProduct.id,
        productName: selectedProduct.productName || "",
        size: selectedProduct.size || "",
        printingName: selectedProduct.printingName || "",
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
    if (!formData.printerName.trim()) {
      alert("Please enter Printer Name");
      return false;
    }
    if (!formData.quantitySent || parseInt(formData.quantitySent) <= 0) {
      alert("Please enter valid Quantity Sent");
      return false;
    }

    // Check if quantity exceeds order quantity
    const selectedProduct = orderData.products.find(
      (p) => p.id === formData.productId
    );
    const orderQuantity = parseInt(selectedProduct?.quantity || 0);
    const alreadySent = calculateProductTotals(formData.productId).totalSent;
    const newQuantity = parseInt(formData.quantitySent);

    // If editing, subtract the current entry's quantity from already sent
    let adjustedAlreadySent = alreadySent;
    if (editingEntryId) {
      const editingEntry = jobWorkEntries.find((e) => e.id === editingEntryId);
      if (editingEntry && editingEntry.productId === formData.productId) {
        adjustedAlreadySent -= editingEntry.quantitySent;
      }
    }

    if (adjustedAlreadySent + newQuantity > orderQuantity) {
      alert(
        `Quantity exceeds order limit!\nOrder Quantity: ${orderQuantity}\nAlready Sent: ${adjustedAlreadySent}\nRemaining: ${
          orderQuantity - adjustedAlreadySent
        }`
      );
      return false;
    }

    return true;
  };

  // Handle send/submit
  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingEntryId !== null) {
      // Update existing entry
      const updatedEntries = jobWorkEntries.map((entry) =>
        entry.id === editingEntryId
          ? {
              ...entry,
              printerName: formData.printerName,
              quantitySent: parseInt(formData.quantitySent),
              remarks: formData.remarks,
              updatedAt: new Date().toISOString(),
            }
          : entry
      );
      setJobWorkEntries(updatedEntries);
      saveJobWorkEntries(updatedEntries);
      alert("Job Work entry updated successfully!");
      setEditingEntryId(null);
    } else {
      // Add new entry
      const newEntry = {
        id: Date.now(),
        productId: formData.productId,
        productName: formData.productName,
        size: formData.size,
        printingName: formData.printingName,
        printerName: formData.printerName,
        quantitySent: parseInt(formData.quantitySent),
        remarks: formData.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedEntries = [...jobWorkEntries, newEntry];
      setJobWorkEntries(updatedEntries);
      saveJobWorkEntries(updatedEntries);
      alert("Job Work sent successfully!");
    }

    // Reset form
    setFormData({
      productId: "",
      productName: "",
      size: "",
      printingName: "",
      printerName: "",
      quantitySent: "",
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
      printerName: entry.printerName,
      quantitySent: entry.quantitySent.toString(),
      remarks: entry.remarks,
    });
    setEditingEntryId(entry.id);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  // Handle delete entry
  const handleDeleteEntry = (entryId) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const updatedEntries = jobWorkEntries.filter(
        (entry) => entry.id !== entryId
      );
      setJobWorkEntries(updatedEntries);
      saveJobWorkEntries(updatedEntries);
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
      printerName: "",
      quantitySent: "",
      remarks: "",
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/screen-printing/jobwork");
  };

  // Calculate totals for a specific product
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

  // Calculate overall totals
  const calculateTotals = () => {
    const totalSent = jobWorkEntries.reduce(
      (sum, entry) => sum + entry.quantitySent,
      0
    );
    const totalOrdered =
      orderData?.products?.reduce(
        (sum, product) => sum + (parseInt(product.quantity) || 0),
        0
      ) || 0;
    const remaining = totalOrdered - totalSent;

    return { totalOrdered, totalSent, remaining };
  };

  // Get remaining quantity for selected product
  const getRemainingQuantity = () => {
    if (!formData.productId) return 0;
    const selectedProduct = orderData.products.find(
      (p) => p.id === formData.productId
    );
    const orderQuantity = parseInt(selectedProduct?.quantity || 0);
    const { totalSent } = calculateProductTotals(formData.productId);

    // If editing, add back the current entry's quantity
    let adjustedTotalSent = totalSent;
    if (editingEntryId) {
      const editingEntry = jobWorkEntries.find((e) => e.id === editingEntryId);
      if (editingEntry && editingEntry.productId === formData.productId) {
        adjustedTotalSent -= editingEntry.quantitySent;
      }
    }

    return orderQuantity - adjustedTotalSent;
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
            Job Work Details
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
                        Printing Color Type
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                        Order Quantity
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                        Sent
                        </th>
                        <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                        Remaining
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {orderData.products?.map((product, idx) => {
                        const { totalSent } = calculateProductTotals(product.id);
                        const orderQty = parseInt(product.quantity) || 0;
                        const remaining = orderQty - totalSent;

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
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                            {product.printType || "NA"}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold">
                            {product.quantity || "-"}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-green-600">
                            {totalSent}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-orange-600">
                            {remaining}
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>

                {/* Totals Summary */}
                <div className="grid grid-cols-3 gap-[1vw] mt-[1vw] p-[1vw] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-center">
                    <p className="text-[0.75vw] text-gray-600">Total Ordered</p>
                    <p className="text-[1.3vw] font-bold text-blue-600">
                    {totals.totalOrdered}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[0.75vw] text-gray-600">Total Sent</p>
                    <p className="text-[1.3vw] font-bold text-green-600">
                    {totals.totalSent}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[0.75vw] text-gray-600">Remaining</p>
                    <p className="text-[1.3vw] font-bold text-orange-600">
                    {totals.remaining}
                    </p>
                </div>
                </div>
            </div>

            {/* Job Work Entries History */}
            {jobWorkEntries.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
                <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
                    Job Work History
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
                            Quantity Sent
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
                        {jobWorkEntries.map((entry, idx) => (
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
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-green-600">
                            {entry.quantitySent}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                            {entry.remarks || "-"}
                            </td>
                            <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
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

            {/* Add/Edit Job Work Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw]">
                <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
                {editingEntryId ? "Edit Job Work Entry" : "Send to Job Work"}
                </h2>

                <div className="grid grid-cols-2 gap-[1.5vw] mb-[1.5vw]">
                {/* Product Selection */}
                <div className="col-span-2">
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
                        {product.productName} - {product.size} - {product.printingName}
                        </option>
                    ))}
                    </select>
                </div>

                {/* Show selected product details */}
                {formData.productId && (
                    <>
                    <div>
                        <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                        Product Name
                        </label>
                        <input
                        type="text"
                        value={formData.productName}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                        Size
                        </label>
                        <input
                        type="text"
                        value={formData.size}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                        Printing Name
                        </label>
                        <input
                        type="text"
                        value={formData.printingName}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                        Remaining Quantity
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

                <div className="grid grid-cols-3 gap-[1.5vw]">
                {/* Printer Name */}
                <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                    Printer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="text"
                    name="printerName"
                    value={formData.printerName}
                    onChange={handleInputChange}
                    placeholder="Enter printer name"
                    className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Quantity Sent */}
                <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                    Quantity Sent <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="number"
                    name="quantitySent"
                    value={formData.quantitySent}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
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
                    {editingEntryId ? "Update" : "Send"}
                </button>
                </div>
            </div>
        </div>
    </div>
  );
}
