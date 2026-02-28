import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const SALES_PAYMENT_STORAGE_KEY = "iml_sales_payment_data";
const BILLING_STORAGE_KEY = "iml_billing_data";
const ORDERS_STORAGE_KEY = "imlorders"; // Added to access orders data
const TRANSPORT_NAMES_STORAGE_KEY = "iml_transport_names"; // Add for transport names

// Payment Modal Component (keep as is)
const PaymentModal = ({
  showPaymentModal,
  setShowPaymentModal,
  bulkPayment,
  setBulkPayment,
  addPaymentRecord,
  calculateTotals,
}) => {
  if (!showPaymentModal) return null;

  const FileUploadBox = ({ file, onFileChange, productId, small }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileType, setFileType] = useState(null);

    const handleFileChange = (selectedFile) => {
      if (selectedFile) {
        onFileChange(selectedFile);

        const type = selectedFile.type;
        setFileType(type);

        if (type?.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewUrl(reader.result);
          };
          reader.readAsDataURL(selectedFile);
        } else if (type === "application/pdf") {
          setPreviewUrl(null);
        } else {
          setPreviewUrl(null);
        }
      }
    };

    const handleInputChange = (e) => {
      const selectedFile = e.target.files[0];
      handleFileChange(selectedFile);
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
        ];
        if (allowedTypes.includes(droppedFile.type)) {
          handleFileChange(droppedFile);
        } else {
          alert(
            "Please upload only images (JPEG, PNG, GIF, WebP) or PDF files",
          );
        }
      }
    };

    const removeFile = (e) => {
      e.stopPropagation();
      onFileChange(null);
      setPreviewUrl(null);
      setFileType(null);
    };

    return (
      <div
        className={`border-2 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-dashed border-gray-300"
        } rounded-[0.6vw] p-[1vw] bg-white ${
          small ? "min-h-[8vw]" : "min-h-[10vw]"
        } transition-all duration-200`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleInputChange}
            className="hidden"
            id={`file-upload-${productId}`}
          />

          {!file ? (
            <label
              htmlFor={`file-upload-${productId}`}
              className="cursor-pointer flex flex-col items-center w-full"
            >
              <div
                className={`w-[2.5vw] h-[2.5vw] ${
                  isDragging ? "bg-blue-200" : "bg-gray-200"
                } rounded-full flex items-center justify-center mb-[0.5vw] transition-all`}
              >
                <svg
                  className={`w-[1.5vw] h-[1.5vw] ${
                    isDragging ? "text-blue-600" : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p
                className={`text-[0.8vw] ${
                  isDragging ? "text-blue-600 font-medium" : "text-gray-500"
                } my-[0.2vw]`}
              >
                {isDragging ? "Drop file here" : "Upload Document"}
              </p>
              <p className="text-[0.7vw] text-gray-400">
                Supports: JPG, PNG, PDF
              </p>
            </label>
          ) : (
            <div className="w-full">
              {fileType && fileType?.startsWith("image/") && previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[6vw] object-contain rounded-[0.4vw] border border-gray-200"
                  />
                  <button
                    onClick={removeFile}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-all shadow-md text-[0.8vw]"
                    title="Remove file"
                  >
                    ×
                  </button>
                  <div className="mt-1 text-center">
                    <p className="text-[0.7vw] text-gray-700 font-medium truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : fileType === "application/pdf" ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-[4vw] h-[5vw] bg-red-50 rounded-[0.4vw] border-2 border-red-200 flex flex-col items-center justify-center">
                      <svg
                        className="w-[2vw] h-[2vw] text-red-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path
                          d="M14 2v6h6M10 13h4m-4 4h4"
                          stroke="white"
                          strokeWidth="1"
                        />
                      </svg>
                      <span className="text-[0.7vw] font-bold text-red-600 mt-0.5">
                        PDF
                      </span>
                    </div>
                    <button
                      onClick={removeFile}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-all shadow-md text-[0.8vw]"
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-1 text-center max-w-full">
                    <p className="text-[0.7vw] text-gray-700 font-medium truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-[4vw] h-[5vw] bg-gray-100 rounded-[0.4vw] border-2 border-gray-300 flex flex-col items-center justify-center">
                      <svg
                        className="w-[2vw] h-[2vw] text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      </svg>
                    </div>
                    <button
                      onClick={removeFile}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-all shadow-md text-[0.8vw]"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-1 text-center">
                    <p className="text-[0.7vw] text-gray-700 font-medium truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
              )}

              <label
                htmlFor={`file-upload-${productId}`}
                className="mt-2 block w-full"
              >
                <div className="cursor-pointer text-center px-2 py-1 border border-blue-500 text-blue-600 rounded-[0.4vw] text-[0.7vw] font-medium hover:bg-blue-50 transition-all">
                  Change File
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#000000ba] z-50 flex items-center justify-center p-[1vw]">
      <div className="bg-white rounded-lg overflow-hidden max-w-[60%] w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-[1.2vw] font-bold text-gray-800">
            💳 Record Payment for Bill
          </h2>
          <button
            onClick={() => {
              setShowPaymentModal(false);
              setBulkPayment({
                paymentType: null,
                method: "",
                amount: "",
                remarks: "",
                file: null,
              });
            }}
            className="text-gray-500 hover:text-gray-800 text-[1.2vw] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-[1vw]">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-[1vw]">
            <h3 className="text-[1vw] font-semibold text-green-900 mb-3">
              Record Payment
            </h3>

            <div className="flex gap-[1vw] mb-[1vw]">
              <label className="flex items-center gap-[0.5vw] cursor-pointer">
                <input
                  type="radio"
                  name="modalPaymentType"
                  value="full"
                  checked={true}
                  onChange={(e) =>
                    setBulkPayment({
                      ...bulkPayment,
                      paymentType: e.target.value,
                    })
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-[0.9vw] font-medium text-gray-700">
                  Full Payment
                </span>
              </label>
            </div>

            {1 == 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-[1.5vw]">
                  <div>
                    <label className="block text-[0.9vw] font-medium text-gray-700 mb-1">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bulkPayment.method}
                      onChange={(e) =>
                        setBulkPayment({
                          ...bulkPayment,
                          method: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[0.9vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[0.9vw] font-medium text-gray-700 mb-1">
                      Amount Received <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={bulkPayment.amount}
                      onChange={(e) =>
                        setBulkPayment({
                          ...bulkPayment,
                          amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[0.9vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.9vw] font-medium text-gray-700 mb-1">
                    Payment Reference / Remarks
                  </label>
                  <textarea
                    placeholder="Enter payment reference, transaction ID, or notes..."
                    value={bulkPayment.remarks}
                    onChange={(e) =>
                      setBulkPayment({
                        ...bulkPayment,
                        remarks: e.target.value,
                      })
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[0.9vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[0.9vw] font-medium text-gray-700 mb-1">
                    Upload Proof (Screenshot/Receipt)
                  </label>
                  <FileUploadBox
                    file={bulkPayment.file}
                    onFileChange={(file) => {
                      setBulkPayment({ ...bulkPayment, file });
                    }}
                    productId="billing-payment"
                    small
                  />
                </div>
              </div>
            )}

            <div className="bg-white rounded p-3 mt-3 border border-gray-200">
              <h4 className="text-[0.9vw] font-semibold text-gray-700 mb-2">
                Payment Summary
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between text-[0.9vw]">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">
                    {bulkPayment.paymentType === "advance"
                      ? "Advance Payment"
                      : bulkPayment.paymentType === "partial"
                        ? "Partial Payment"
                        : bulkPayment.paymentType === "full"
                          ? "Full Payment"
                          : "Select type"}
                  </span>
                </div>
                {bulkPayment.paymentType && bulkPayment.amount && (
                  <div className="flex justify-between text-[0.9vw]">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600">
                      ₹{parseFloat(bulkPayment.amount || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {/* <div className="flex justify-between text-[0.9vw] pt-2 border-t">
                  <span className="text-gray-600">Order Total Value:</span>
                  <span className="font-bold text-blue-600">
                    ₹{getOrderEstimatedValue().toLocaleString() || "0"}
                  </span>
                </div> */}
                <div className="flex justify-between text-[0.9vw] pt-2 border-t">
                  <span className="text-gray-600">Bill Amount:</span>
                  <span className="font-bold text-blue-600">
                    ₹{calculateTotals().billAmount?.toLocaleString() || "0"}
                  </span>
                </div>
                {bulkPayment.paymentType && bulkPayment.amount && (
                  <div className="flex justify-between text-[0.9vw]">
                    <span className="text-gray-600">Remaining Balance:</span>
                    <span className="font-bold text-orange-600">
                      ₹
                      {Math.max(
                        calculateTotals().billAmount -
                          parseFloat(bulkPayment.amount || 0),
                        0,
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-300 bg-gray-50">
          <button
            onClick={() => {
              setShowPaymentModal(false);
              setBulkPayment({
                paymentType: null,
                method: "",
                amount: "",
                remarks: "",
                file: null,
              });
            }}
            className="px-[0.8vw] py-[0.4vw] text-[0.9vw] cursor-pointer border-2 border-gray-300 text-gray-700 bg-white rounded font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              addPaymentRecord();
              setShowPaymentModal(false);
            }}
            className="px-[0.8vw] py-[0.4vw] text-[0.9vw] cursor-pointer bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-all shadow-md"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
};

// ... (keep all imports and constants at the top)

export default function SalesPaymentDetails() {
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);
  const [estimatedValue, setEstimatedValue] = useState(""); // Set to empty string initially
  const [remarks, setRemarks] = useState("");
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [orderPayments, setOrderPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bulkPayment, setBulkPayment] = useState({
    paymentType: "full",
    method: "",
    amount: "",
    remarks: "",
    file: null,
  });

  // NEW STATES for additional fields
  const [customerDetails, setCustomerDetails] = useState({
    customerName: "",
    phoneNo: "",
    preferredLocation: "",
    preferredTransport: "",
    deliveryMethod: "", // "doorstep" or "godown"
  });

  const [isCredit, setIsCredit] = useState(false);
  const [creditDays, setCreditDays] = useState("");

  // NEW STATE to track if data has been saved
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false); // Track if any data changed

  // Add a state to track order's estimated value separately
  const [orderEstimatedValue, setOrderEstimatedValue] = useState(0);
  const [totalBilledAmountForOrder, setTotalBilledAmountForOrder] = useState(0); // NEW: Track sum of all bills for this order

  // State for transport suggestions
  const [transportSuggestions, setTransportSuggestions] = useState([]);
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);

  // Load transport names from localStorage
  useEffect(() => {
    const storedTransports = localStorage.getItem(TRANSPORT_NAMES_STORAGE_KEY);
    if (storedTransports) {
      try {
        const transports = JSON.parse(storedTransports);
        setTransportSuggestions(transports);
      } catch (error) {
        console.error("Error loading transport names:", error);
        // Initialize with default transport names
        const defaultTransports = [
          "Indian Railways",
          "Gati Logistics",
          "Blue Dart",
          "DTDC",
          "FedEx",
          "Delhivery",
          "Amazon Transport",
          "Flipkart Logistics",
          "Ecom Express",
          "XpressBees",
        ];
        setTransportSuggestions(defaultTransports);
        localStorage.setItem(
          TRANSPORT_NAMES_STORAGE_KEY,
          JSON.stringify(defaultTransports),
        );
      }
    } else {
      // Initialize with default transport names
      const defaultTransports = [
        "Indian Railways",
        "Gati Logistics",
        "Blue Dart",
        "DTDC",
        "FedEx",
        "Delhivery",
        "Amazon Transport",
        "Flipkart Logistics",
        "Ecom Express",
        "XpressBees",
      ];
      setTransportSuggestions(defaultTransports);
      localStorage.setItem(
        TRANSPORT_NAMES_STORAGE_KEY,
        JSON.stringify(defaultTransports),
      );
    }
  }, []);

  // Track changes in form fields
  useEffect(() => {
    if (billData) {
      const hasFormChanged = () => {
        // Check if any field has changed from original bill data
        if (parseFloat(estimatedValue) !== (billData.estimatedValue || 0))
          return true;
        if (remarks !== (billData.remarks || "")) return true;
        if (
          customerDetails.customerName !==
          (billData.customerDetails?.customerName || "")
        )
          return true;
        if (
          customerDetails.phoneNo !== (billData.customerDetails?.phoneNo || "")
        )
          return true;
        if (
          customerDetails.preferredLocation !==
          (billData.customerDetails?.preferredLocation || "")
        )
          return true;
        if (
          customerDetails.preferredTransport !==
          (billData.customerDetails?.preferredTransport || "")
        )
          return true;
        if (
          customerDetails.deliveryMethod !==
          (billData.customerDetails?.deliveryMethod || "")
        )
          return true;
        if (isCredit !== (billData.isCredit || false)) return true;
        if (creditDays !== (billData.creditDays?.toString() || "")) return true;
        return false;
      };

      setHasChanges(hasFormChanged());
    }
  }, [
    estimatedValue,
    remarks,
    customerDetails,
    isCredit,
    creditDays,
    billData,
  ]);

  // Load bill data and associated order data with payments
  useEffect(() => {
    const storedBill = localStorage.getItem("editing_iml_sales_payment_bill");
    if (storedBill) {
      const parsedBill = JSON.parse(storedBill);
      setBillData(parsedBill);

      // Set estimated value to empty string initially instead of bill value
      setEstimatedValue("");

      // Load from bill data if it exists, otherwise keep empty
      if (
        parsedBill.estimatedValue !== undefined &&
        parsedBill.estimatedValue !== null
      ) {
        setEstimatedValue(parsedBill.estimatedValue.toString());
      }

      setRemarks(parsedBill.remarks || "");

      // Load customer details from order first, then from bill data
      const orderDetails = loadOrderDetails(parsedBill.orderNumber);

      if (orderDetails) {
        // Fetch customer details from order page (Contact Name & Contact Number)
        setCustomerDetails({
          customerName: orderDetails.contactName || "",
          phoneNo: orderDetails.phone || "",
          preferredLocation:
            parsedBill.customerDetails?.preferredLocation || "",
          preferredTransport:
            parsedBill.customerDetails?.preferredTransport || "",
          deliveryMethod: parsedBill.customerDetails?.deliveryMethod || "",
        });
      } else if (parsedBill.customerDetails) {
        // Fallback to existing bill data
        setCustomerDetails(parsedBill.customerDetails);
      }

      // Load credit details if they exist
      if (parsedBill.isCredit !== undefined) {
        setIsCredit(parsedBill.isCredit);
        setCreditDays(parsedBill.creditDays?.toString() || "");
      }

      // Load existing payment records from the bill (only sales payments)
      const billPaymentRecords = parsedBill.paymentRecords || [];
      setPaymentRecords(billPaymentRecords);

      // Load payments from the order and calculate total billed amount
      loadOrderPaymentsAndCalculate(parsedBill);
    } else {
      alert("No bill data found. Redirecting back...");
      navigate("/iml/sales");
    }
  }, [navigate]);

  // Function to load order details from orders storage
  const loadOrderDetails = (orderNumber) => {
    try {
      if (!orderNumber) return null;

      const ordersData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!ordersData) return null;

      const allOrders = JSON.parse(ordersData);
      let foundOrder = null;

      if (Array.isArray(allOrders)) {
        foundOrder = allOrders.find(
          (order) => order.orderNumber === orderNumber,
        );
      } else if (typeof allOrders === "object") {
        if (allOrders[orderNumber]) {
          foundOrder = allOrders[orderNumber];
        } else {
          Object.keys(allOrders).forEach((key) => {
            const order = allOrders[key];
            if (order.orderNumber === orderNumber) {
              foundOrder = order;
            }
          });
        }
      }

      if (foundOrder) {
        return {
          contactName: foundOrder.contact?.contactName || "",
          phone: foundOrder.contact?.phone || "",
          company: foundOrder.contact?.company || "",
        };
      }
    } catch (error) {
      console.error("Error loading order details:", error);
    }
    return null;
  };

  // Function to load payments from the order AND calculate total billed amount for the order
  const loadOrderPaymentsAndCalculate = (billData) => {
    try {
      const orderNumber = billData.orderNumber;
      if (!orderNumber) return;

      const ordersData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!ordersData) return;

      const allOrders = JSON.parse(ordersData);
      let foundOrder = null;

      // Find the order
      if (Array.isArray(allOrders)) {
        foundOrder = allOrders.find(
          (order) => order.orderNumber === orderNumber,
        );
      } else if (typeof allOrders === "object") {
        if (allOrders[orderNumber]) {
          foundOrder = allOrders[orderNumber];
        } else {
          Object.keys(allOrders).forEach((key) => {
            const order = allOrders[key];
            if (order.orderNumber === orderNumber) {
              foundOrder = order;
            }
          });
        }
      }

      if (foundOrder) {
        // Get the order's estimated value
        const estimatedValueFromOrder =
          foundOrder.orderEstimate?.estimatedValue ||
          foundOrder.totalEstimated ||
          foundOrder.estimatedValue ||
          foundOrder.payment?.totalEstimated ||
          foundOrder.totalBudget ||
          0;

        setOrderEstimatedValue(parseFloat(estimatedValueFromOrder) || 0);

        // Calculate total billed amount for this order from all bills
        const totalBilled = calculateTotalBilledAmountForOrder(orderNumber);
        setTotalBilledAmountForOrder(totalBilled);

        // Load order payments WITHOUT DUPLICATES
        if (foundOrder.paymentRecords) {
          // Get unique order payments (filter duplicates)
          const uniqueOrderPayments = [];
          const seenPaymentIds = new Set();

          foundOrder.paymentRecords.forEach((record) => {
            const recordId =
              record.id || `order-${record.timestamp}-${record.amount}`;

            // Check if payment is from sales page for THIS bill
            const isFromThisBill = record.billId === billData.billId;

            // Only add if not already seen
            if (!seenPaymentIds.has(recordId)) {
              seenPaymentIds.add(recordId);

              // Format the payment record
              const formattedRecord = {
                ...record,
                id: recordId,
                paymentType:
                  record.paymentType === "po"
                    ? "advance"
                    : record.paymentType || "advance",
                method: record.method || "Order Payment",
                timestamp:
                  record.timestamp ||
                  record.dateTime ||
                  new Date().toISOString(),
                dateTime:
                  record.dateTime ||
                  new Date(record.timestamp || Date.now()).toLocaleString(),
                source: isFromThisBill ? "sales" : "order",
                billId: record.billId || null,
                file: record.file || null,
              };

              uniqueOrderPayments.push(formattedRecord);
            }
          });

          setOrderPayments(uniqueOrderPayments);
        }
      }
    } catch (error) {
      console.error("Error loading order payments:", error);
    }
  };

  // NEW FUNCTION: Calculate total billed amount for this order from all bills
  const calculateTotalBilledAmountForOrder = (orderNumber) => {
    try {
      if (!orderNumber) return 0;

      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      if (!salesPaymentData) return 0;

      const allSalesPayments = JSON.parse(salesPaymentData);
      let totalBilled = 0;

      // Find all bills for this order and sum their estimated values
      Object.keys(allSalesPayments).forEach((orderId) => {
        const bills = allSalesPayments[orderId];
        if (Array.isArray(bills)) {
          bills.forEach((bill) => {
            // Check if bill belongs to the same order number (not orderId)
            // We need to find the order by orderNumber to get all bills
            if (bill.orderNumber === orderNumber) {
              totalBilled += parseFloat(bill.estimatedValue || 0);
            }
          });
        }
      });

      return totalBilled;
    } catch (error) {
      console.error("Error calculating total billed amount:", error);
      return 0;
    }
  };

  // Save billing data - FIXED to prevent duplication
  const saveBillData = () => {
    // Validation for save (less strict than submit)
    if (estimatedValue && parseFloat(estimatedValue) < 0) {
      alert("Estimated Bill Amount cannot be negative");
      return;
    }

    if (estimatedValue && parseFloat(estimatedValue) === 0) {
      if (
        !window.confirm(
          "Estimated Bill Amount is set to 0. Are you sure you want to save?",
        )
      ) {
        return;
      }
    }

    try {
      // Update sales payment data
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      const allSalesPayments = salesPaymentData
        ? JSON.parse(salesPaymentData)
        : {};

      if (allSalesPayments[billData.orderId]) {
        const billIndex = allSalesPayments[billData.orderId].findIndex(
          (b) => b.billId === billData.billId,
        );

        if (billIndex >= 0) {
          // FIX: Only save sales payments, not combined payments
          allSalesPayments[billData.orderId][billIndex] = {
            ...allSalesPayments[billData.orderId][billIndex],
            estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
            remarks: remarks,
            customerDetails: customerDetails,
            isCredit: isCredit,
            creditDays: isCredit ? parseInt(creditDays) : null,
            status: billData.status, // Keep existing status
            paymentRecords: paymentRecords, // Only sales payments
            updatedAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
          };

          localStorage.setItem(
            SALES_PAYMENT_STORAGE_KEY,
            JSON.stringify(allSalesPayments),
          );
        }
      }

      // Also update the editing bill in localStorage
      const updatedBill = {
        ...billData,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
        remarks: remarks,
        customerDetails: customerDetails,
        isCredit: isCredit,
        creditDays: isCredit ? parseInt(creditDays) : null,
        paymentRecords: paymentRecords, // Only sales payments
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "editing_iml_sales_payment_bill",
        JSON.stringify(updatedBill),
      );
      setBillData(updatedBill);

      // Recalculate total billed amount after saving
      const newTotalBilled = calculateTotalBilledAmountForOrder(
        billData.orderNumber,
      );
      setTotalBilledAmountForOrder(newTotalBilled);

      setIsSaved(true);
      setHasChanges(false);
      setSaveMessage(
        `Bill data saved successfully at ${new Date().toLocaleTimeString()}`,
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving bill data:", error);
      alert("An error occurred while saving. Please try again.");
    }
  };

  // Validate all inputs before sending to billing
  const validateBillingSubmission = () => {
    const errors = [];

    // 1. Check estimated value
    if (!estimatedValue || estimatedValue.trim() === "") {
      errors.push("Please enter Estimated Bill Amount");
    } else if (parseFloat(estimatedValue) < 0) {
      errors.push("Estimated Bill Amount cannot be negative");
    }

    // 2. Check customer name
    if (
      !customerDetails.customerName ||
      customerDetails.customerName.trim() === ""
    ) {
      errors.push("Please enter Customer Name");
    }

    // 3. Check phone number
    if (!customerDetails.phoneNo || customerDetails.phoneNo.trim() === "") {
      errors.push("Please enter Phone Number");
    } else if (
      !/^[0-9]{10}$/.test(customerDetails.phoneNo.replace(/\D/g, ""))
    ) {
      errors.push("Please enter a valid 10-digit Phone Number");
    }

    // 4. Check delivery method
    if (!customerDetails.deliveryMethod) {
      errors.push("Please select Delivery Method");
    }

    // 5. Check credit days if credit is selected
    if (isCredit) {
      if (!creditDays || creditDays.trim() === "") {
        errors.push("Please enter Credit Period (Number of Days)");
      } else if (parseInt(creditDays) <= 0) {
        errors.push("Credit Period must be a positive number");
      }
    }

    return errors;
  };

  // Handle submit to billing with validation
  const handleSubmitToBilling = () => {
    // Validate inputs
    const validationErrors = validateBillingSubmission();

    if (validationErrors.length > 0) {
      alert(
        "Please fix the following errors:\n\n" + validationErrors.join("\n"),
      );
      return;
    }

    // Confirm with user
    if (
      !window.confirm(
        `Send this bill to Billing?\n\n` +
          `Customer: ${customerDetails.customerName}\n` +
          `Bill Amount: ₹${parseFloat(estimatedValue).toLocaleString()}\n` +
          `Delivery: ${customerDetails.deliveryMethod === "doorstep" ? "Doorstep Delivery" : "Godown Pickup"}\n\n` +
          `This action cannot be undone.`,
      )
    ) {
      return;
    }

    // Auto-save if not already saved
    if (!isSaved || hasChanges) {
      try {
        // Update sales payment data first
        const salesPaymentData = localStorage.getItem(
          SALES_PAYMENT_STORAGE_KEY,
        );
        const allSalesPayments = salesPaymentData
          ? JSON.parse(salesPaymentData)
          : {};

        if (allSalesPayments[billData.orderId]) {
          const billIndex = allSalesPayments[billData.orderId].findIndex(
            (b) => b.billId === billData.billId,
          );

          if (billIndex >= 0) {
            allSalesPayments[billData.orderId][billIndex] = {
              ...allSalesPayments[billData.orderId][billIndex],
              estimatedValue: parseFloat(estimatedValue),
              remarks: remarks,
              customerDetails: customerDetails,
              isCredit: isCredit,
              creditDays: isCredit ? parseInt(creditDays) : null,
              status: "saved",
              paymentRecords: paymentRecords,
              updatedAt: new Date().toISOString(),
              lastSavedAt: new Date().toISOString(),
            };

            localStorage.setItem(
              SALES_PAYMENT_STORAGE_KEY,
              JSON.stringify(allSalesPayments),
            );
          }
        }

        console.log("Auto-saved bill data before sending to billing");
      } catch (error) {
        console.error("Error auto-saving bill data:", error);
        // Continue with billing submission even if save fails
      }
    }

    try {
      // Now proceed with billing submission
      // Update sales payment data to mark as completed
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      const allSalesPayments = salesPaymentData
        ? JSON.parse(salesPaymentData)
        : {};

      if (allSalesPayments[billData.orderId]) {
        const billIndex = allSalesPayments[billData.orderId].findIndex(
          (b) => b.billId === billData.billId,
        );

        if (billIndex >= 0) {
          allSalesPayments[billData.orderId][billIndex] = {
            ...allSalesPayments[billData.orderId][billIndex],
            estimatedValue: parseFloat(estimatedValue),
            remarks: remarks,
            customerDetails: customerDetails,
            isCredit: isCredit,
            creditDays: isCredit ? parseInt(creditDays) : null,
            status: "completed",
            paymentRecords: paymentRecords,
            updatedAt: new Date().toISOString(),
            sentToBillingAt: new Date().toISOString(),
          };

          localStorage.setItem(
            SALES_PAYMENT_STORAGE_KEY,
            JSON.stringify(allSalesPayments),
          );
        }
      }

      // CRITICAL: Sync payment records back to the main order
      syncPaymentsToOrder();

      // Add to billing storage with payment records
      const billingData = localStorage.getItem(BILLING_STORAGE_KEY);
      const allBilling = billingData ? JSON.parse(billingData) : {};

      if (!allBilling[billData.orderId]) {
        allBilling[billData.orderId] = [];
      }

      // Combine sales payments and order payments for billing record
      const allPaymentRecords = [...paymentRecords, ...orderPayments];

      const billingEntry = {
        billingId: Date.now(),
        salesBillId: billData.billId,
        orderNumber: billData.orderNumber,
        contact: billData.contact,
        products: billData.products,
        estimatedValue: parseFloat(estimatedValue),
        remarks: remarks,
        customerDetails: customerDetails,
        isCredit: isCredit,
        creditDays: isCredit ? parseInt(creditDays) : null,
        paymentRecords: allPaymentRecords,
        billingDate: new Date().toISOString(),
        status: "Pending Payment",
        companyName: billData.contact?.company || "Unknown Company",
        contactName: billData.contact?.contactName || "N/A",
        phone: billData.contact?.phone || "N/A",
        // Include customer details in billing entry
        billingCustomerName: customerDetails.customerName,
        billingPhoneNo: customerDetails.phoneNo,
        deliveryMethod: customerDetails.deliveryMethod,
        creditInfo: isCredit ? `${creditDays} days credit` : "No credit",
      };

      allBilling[billData.orderId].push(billingEntry);
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(allBilling));

      alert("Bill sent to Billing successfully!");
      navigate("/iml/sales");
    } catch (error) {
      console.error("Error submitting to billing:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Add new transport name to suggestions
  const addTransportName = (name) => {
    if (name && !transportSuggestions.includes(name)) {
      const updatedTransports = [...transportSuggestions, name];
      setTransportSuggestions(updatedTransports);
      localStorage.setItem(
        TRANSPORT_NAMES_STORAGE_KEY,
        JSON.stringify(updatedTransports),
      );
    }
  };

  // Handle transport input change
  const handleTransportChange = (value) => {
    setCustomerDetails({
      ...customerDetails,
      preferredTransport: value,
    });
    setHasChanges(true);
  };

  // Handle transport input blur
  const handleTransportBlur = () => {
    setTimeout(() => {
      setShowTransportDropdown(false);

      // Add new transport to suggestions if not empty and not already in list
      const transport = customerDetails.preferredTransport.trim();
      if (transport && !transportSuggestions.includes(transport)) {
        addTransportName(transport);
      }
    }, 200);
  };

  // Select transport from dropdown
  const selectTransport = (transport) => {
    setCustomerDetails({
      ...customerDetails,
      preferredTransport: transport,
    });
    setShowTransportDropdown(false);
    setHasChanges(true);
  };

  // Filter transport suggestions based on input
  const filteredTransportSuggestions = customerDetails.preferredTransport
    ? transportSuggestions.filter((transport) =>
        transport
          .toLowerCase()
          .includes(customerDetails.preferredTransport.toLowerCase()),
      )
    : transportSuggestions;

  // Calculate totals - UPDATED for balance due
  const calculateTotals = () => {
    if (!billData)
      return {
        totalQuantity: 0,
        totalSamples: 0,
        totalPaid: 0,
        billAmount: 0,
        orderEstimatedValue: orderEstimatedValue,
        totalBilledAmountForOrder: totalBilledAmountForOrder,
      };

    const totalQuantity = billData.products.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );

    const totalSamples = billData.products.reduce(
      (sum, product) => sum + (product.samplesTaken || 0),
      0,
    );

    // Calculate total paid from all payment records (without duplicates)
    const uniquePaymentIds = new Set();
    let totalFromBillPayments = 0;
    let totalFromOrderPayments = 0;

    // Calculate sales payments
    paymentRecords.forEach((record) => {
      const recordId =
        record.id || `sales-${record.timestamp}-${record.amount}`;
      if (!uniquePaymentIds.has(recordId)) {
        uniquePaymentIds.add(recordId);
        totalFromBillPayments += parseFloat(record.amount) || 0;
      }
    });

    // Calculate order payments
    orderPayments.forEach((record) => {
      const recordId =
        record.id || `order-${record.timestamp}-${record.amount}`;
      if (!uniquePaymentIds.has(recordId)) {
        uniquePaymentIds.add(recordId);
        totalFromOrderPayments += parseFloat(record.amount) || 0;
      }
    });

    const totalPaid = totalFromBillPayments + totalFromOrderPayments;

    // Bill amount is what sales team enters
    const billAmount = parseFloat(estimatedValue) || 0;

    // BALANCE DUE: Order Estimate - Total Received
    const balanceDue = Math.max(orderEstimatedValue - totalPaid, 0);

    // NEW: Balance Estimated Amount = Order Estimate - Total Billed Amount for Order
    const balanceEstimatedAmount = Math.max(
      orderEstimatedValue - totalBilledAmountForOrder,
      0,
    );

    return {
      totalQuantity,
      totalSamples,
      totalPaid,
      billAmount,
      orderEstimatedValue: orderEstimatedValue,
      totalFromOrderPayments,
      totalFromBillPayments,
      balanceDue,
      totalBilledAmountForOrder,
      balanceEstimatedAmount, // NEW: Add balance estimated amount
    };
  };

  // Sync payments to order (keep as is but with duplicate prevention)
  const syncPaymentsToOrder = () => {
    try {
      // Get the order from localStorage
      const ordersData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!ordersData) return;

      const allOrders = JSON.parse(ordersData);

      // Find the order that matches the current bill's order number
      let orderToUpdate = null;
      let orderKey = null;

      if (Array.isArray(allOrders)) {
        const orderIndex = allOrders.findIndex(
          (order) => order.orderNumber === billData.orderNumber,
        );
        if (orderIndex >= 0) {
          orderToUpdate = allOrders[orderIndex];
          orderKey = orderIndex;
        }
      } else if (typeof allOrders === "object") {
        // Try to find order by orderNumber in the object
        Object.keys(allOrders).forEach((key) => {
          const order = allOrders[key];
          if (order.orderNumber === billData.orderNumber) {
            orderToUpdate = order;
            orderKey = key;
          }
        });
      }

      if (orderToUpdate) {
        // Get existing payments from order
        const existingOrderPayments = orderToUpdate.paymentRecords || [];

        // Create a Set of existing payment IDs to avoid duplicates
        const existingPaymentIds = new Set();
        existingOrderPayments.forEach((payment) => {
          if (payment.id) existingPaymentIds.add(payment.id);
        });

        // Filter out payments that are already in the order (to avoid duplicates)
        const newSalesPayments = paymentRecords.filter((salesPayment) => {
          // Check if this payment already exists in order
          return !existingPaymentIds.has(salesPayment.id);
        });

        // Mark new payments as from sales page
        const markedSalesPayments = newSalesPayments.map((payment) => ({
          ...payment,
          source: "sales",
          orderNumber: billData.orderNumber,
          billId: billData.billId,
        }));

        // Combine existing order payments with new sales payments
        const updatedOrderPayments = [
          ...existingOrderPayments,
          ...markedSalesPayments,
        ];

        // Update the order
        const updatedOrder = {
          ...orderToUpdate,
          paymentRecords: updatedOrderPayments,
          updatedAt: new Date().toISOString(),
        };

        // Save back to localStorage
        if (Array.isArray(allOrders)) {
          allOrders[orderKey] = updatedOrder;
        } else {
          allOrders[orderKey] = updatedOrder;
        }

        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
        console.log(
          "Payments synced back to order:",
          newSalesPayments.length,
          "new payments added",
        );
      }
    } catch (error) {
      console.error("Error syncing payments to order:", error);
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/iml/sales");
  };

  // Get order's estimated value
  const getOrderEstimatedValue = () => {
    try {
      // Get the order from localStorage
      const ordersData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!ordersData) return parseFloat(estimatedValue) || 0;

      const allOrders = JSON.parse(ordersData);
      const orderNumber = billData.orderNumber;

      if (!orderNumber) return parseFloat(estimatedValue) || 0;

      let foundOrder = null;

      // Find the order
      if (Array.isArray(allOrders)) {
        foundOrder = allOrders.find(
          (order) => order.orderNumber === orderNumber,
        );
      } else if (typeof allOrders === "object") {
        // Check if orderNumber exists as a key
        if (allOrders[orderNumber]) {
          foundOrder = allOrders[orderNumber];
        } else {
          // Search through all orders in the object
          Object.keys(allOrders).forEach((key) => {
            const order = allOrders[key];
            if (order.orderNumber === orderNumber) {
              foundOrder = order;
            }
          });
        }
      }

      if (foundOrder) {
        // Check for estimated value in different possible locations
        const estimatedValueFromOrder =
          foundOrder.orderEstimate?.estimatedValue ||
          foundOrder.totalEstimated ||
          foundOrder.estimatedValue ||
          foundOrder.payment?.totalEstimated ||
          foundOrder.totalBudget ||
          0;

        return parseFloat(estimatedValueFromOrder) || 0;
      }

      return parseFloat(estimatedValue) || 0;
    } catch (error) {
      console.error("Error getting order estimated value:", error);
      return parseFloat(estimatedValue) || 0;
    }
  };

  // Add payment record
  const addPaymentRecord = () => {
    if (!bulkPayment.paymentType) {
      alert("Please select payment type");
      return;
    }

    if (!bulkPayment.method || !bulkPayment.amount) {
      alert("Please fill in payment method and amount");
      return;
    }

    const newRecord = {
      ...bulkPayment,
      id: Date.now(), // Unique ID
      dateTime: new Date().toLocaleString(),
      timestamp: new Date().toISOString(),
      source: "sales", // Mark as coming from sales page
      orderNumber: billData.orderNumber,
      billId: billData.billId,
    };

    // Check for duplicates before adding
    const isDuplicate = paymentRecords.some(
      (record) =>
        record.id === newRecord.id ||
        (record.timestamp === newRecord.timestamp &&
          parseFloat(record.amount) === parseFloat(newRecord.amount) &&
          record.method === newRecord.method),
    );

    if (isDuplicate) {
      alert("This payment record already exists!");
      return;
    }

    const updatedRecords = [...paymentRecords, newRecord];
    setPaymentRecords(updatedRecords);

    // Update bill data with payment records
    if (billData) {
      const updatedBill = {
        ...billData,
        paymentRecords: updatedRecords,
      };
      setBillData(updatedBill);

      // Update in localStorage immediately
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      const allSalesPayments = salesPaymentData
        ? JSON.parse(salesPaymentData)
        : {};

      if (allSalesPayments[billData.orderId]) {
        const billIndex = allSalesPayments[billData.orderId].findIndex(
          (b) => b.billId === billData.billId,
        );

        if (billIndex >= 0) {
          allSalesPayments[billData.orderId][billIndex] = {
            ...allSalesPayments[billData.orderId][billIndex],
            paymentRecords: updatedRecords,
          };

          localStorage.setItem(
            SALES_PAYMENT_STORAGE_KEY,
            JSON.stringify(allSalesPayments),
          );
        }
      }
    }

    // Reset form
    setBulkPayment({
      paymentType: null,
      method: "",
      amount: "",
      remarks: "",
      file: null,
    });

    alert("Payment recorded successfully!");
  };

  // Remove payment record - only for sales payments
  const removePaymentRecord = (recordId) => {
    if (confirm("Are you sure you want to remove this payment record?")) {
      // Find the payment record before removing
      const paymentToRemove = paymentRecords.find((r) => r.id === recordId);

      const updatedRecords = paymentRecords.filter((r) => r.id !== recordId);
      setPaymentRecords(updatedRecords);

      // Update bill data
      if (billData) {
        const updatedBill = {
          ...billData,
          paymentRecords: updatedRecords,
        };
        setBillData(updatedBill);

        // Update in localStorage
        const salesPaymentData = localStorage.getItem(
          SALES_PAYMENT_STORAGE_KEY,
        );
        const allSalesPayments = salesPaymentData
          ? JSON.parse(salesPaymentData)
          : {};

        if (allSalesPayments[billData.orderId]) {
          const billIndex = allSalesPayments[billData.orderId].findIndex(
            (b) => b.billId === billData.billId,
          );

          if (billIndex >= 0) {
            allSalesPayments[billData.orderId][billIndex] = {
              ...allSalesPayments[billData.orderId][billIndex],
              paymentRecords: updatedRecords,
            };

            localStorage.setItem(
              SALES_PAYMENT_STORAGE_KEY,
              JSON.stringify(allSalesPayments),
            );
          }
        }
      }

      // Also remove from order if it was synced
      if (paymentToRemove) {
        removePaymentFromOrder(recordId);
      }
    }
  };

  // Helper function to get payment source label
  const getPaymentSourceLabel = (record) => {
    if (record.source === "sales") return "Sales Page";
    if (record.source === "order" || record.id?.includes("order-"))
      return "Order Page";
    return "Unknown Source";
  };

  // Helper function to get payment type label
  const getPaymentTypeLabel = (record) => {
    if (record.paymentType === "po") return "PO";
    return record.paymentType === "advance"
      ? "Advance"
      : record.paymentType === "partial"
        ? "Partial"
        : record.paymentType === "full"
          ? "Full"
          : record.paymentType || "Payment";
  };

  // Combine all payments for display (with duplicate prevention)
  const allPayments = [];
  const seenPaymentIds = new Set();

  // Add order payments first
  orderPayments.forEach((record) => {
    const recordId = record.id || `order-${record.timestamp}-${record.amount}`;
    if (!seenPaymentIds.has(recordId)) {
      seenPaymentIds.add(recordId);
      allPayments.push(record);
    }
  });

  // Add sales payments
  paymentRecords.forEach((record) => {
    const recordId = record.id || `sales-${record.timestamp}-${record.amount}`;
    if (!seenPaymentIds.has(recordId)) {
      seenPaymentIds.add(recordId);
      allPayments.push(record);
    }
  });

  // Sort by timestamp (newest first)
  allPayments.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.dateTime || 0).getTime();
    const timeB = new Date(b.timestamp || b.dateTime || 0).getTime();
    return timeB - timeA;
  });

  if (!billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[1.2vw] text-gray-600">Loading...</div>
      </div>
    );
  }

  const totals = calculateTotals();
  const isCompleted = billData.status === "completed";

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
            IML Sales Payment Bill Details
          </h1>
          <div className="w-[5vw]"></div>
        </div>
      </div>

      <div className="max-h-[75vh] overflow-y-auto">
        {/* Order & Bill Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Order & Bill Information
          </h2>
          <div className="grid grid-cols-3 gap-[1vw]">
            <div>
              <p className="text-[0.8vw] text-gray-500">Company Name</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.contact?.company || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Order Number</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.orderNumber || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Contact Person</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.contact?.contactName || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Phone</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {billData.contact?.phone || "NA"}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Bill Created</p>
              <p className="text-[1vw] font-medium text-gray-900">
                {new Date(billData.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-[0.8vw] text-gray-500">Bill Status</p>
              <p className="text-[1vw] font-medium text-gray-900">
                <span
                  className={`px-[0.6vw] py-[0.2vw] rounded-full text-[0.7vw] font-semibold ${
                    billData.status === "completed"
                      ? "bg-green-200 text-green-800"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  {billData.status === "completed"
                    ? "✓ Sent to Billing"
                    : "○ Pending"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            Products in this Bill
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    S.No
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    IML Name
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Product Category
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Size
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Quantity
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Samples Taken
                  </th>
                </tr>
              </thead>
              <tbody>
                {billData.products.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-medium">
                      {product.imlName}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.productCategory}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.size}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                      {product.quantity}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.samplesTaken || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-[1vw] p-[1vw] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Total Quantity</p>
              <p className="text-[1.3vw] font-bold text-blue-600">
                {totals.totalQuantity}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[0.75vw] text-gray-600">Total Samples</p>
              <p className="text-[1.3vw] font-bold text-amber-600">
                {totals.totalSamples}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Records Section - UPDATED with 5 cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw] mb-[1.5vw]">
          <div className="flex justify-between items-center mb-[1vw]">
            <div>
              <h2 className="text-[1.2vw] font-semibold text-gray-800 border-b pb-[0.5vw]">
                Payment Records (All Sources)
              </h2>
              <p className="text-[0.7vw] text-gray-500 mt-1">
                Payments shown against Bill Amount: ₹
                {(parseFloat(estimatedValue) || 0).toLocaleString()}
                <span className="ml-2 text-purple-600">
                  (Order Estimate: ₹{orderEstimatedValue.toLocaleString()})
                </span>
              </p>
            </div>
            {!isCompleted && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-[1vw] py-[0.5vw] bg-green-600 text-white rounded-lg font-semibold text-[0.85vw] hover:bg-green-700 transition-all cursor-pointer shadow-md flex items-center gap-[0.5vw]"
              >
                <span className="text-[1vw]">+</span>
                Record Payment
              </button>
            )}
          </div>

          {allPayments.length === 0 ? (
            <div className="text-center p-[2vw] bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-[3vw] h-[3vw] bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-[0.8vw]">
                <svg
                  className="w-[1.5vw] h-[1.5vw] text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-[1vw] font-semibold text-gray-900 mb-[0.5vw]">
                No Payment Records
              </h3>
              <p className="text-gray-600 text-[0.8vw]">
                {!isCompleted
                  ? "Record payments for this bill before sending to billing"
                  : "No payment records found for this bill"}
              </p>
            </div>
          ) : (
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden max-h-[25vw] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Date & Time
                    </th>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Type
                    </th>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Source
                    </th>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Method
                    </th>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Amount
                    </th>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Remarks
                    </th>
                    <th className="text-left px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                      Proof
                    </th>
                    {!isCompleted && (
                      <th className="text-center px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((record, index) => (
                    <tr
                      key={`${record.id || index}-${record.timestamp || index}`}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-[1vw] py-[0.7vw] text-[0.8vw] text-gray-600">
                        {record.dateTime ||
                          (record.timestamp
                            ? new Date(record.timestamp).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "N/A")}
                      </td>
                      <td className="px-[1vw] py-[0.7vw]">
                        <span
                          className={`inline-block px-[0.6vw] py-[0.25vw] rounded-[0.3vw] text-[0.8vw] font-semibold ${
                            getPaymentTypeLabel(record) === "Advance" ||
                            getPaymentTypeLabel(record) === "PO"
                              ? "bg-green-100 text-green-700"
                              : getPaymentTypeLabel(record) === "Partial"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {getPaymentTypeLabel(record)}
                        </span>
                      </td>
                      <td className="px-[1vw] py-[0.7vw] text-[0.8vw] text-gray-700">
                        <span
                          className={`px-[0.4vw] py-[0.15vw] rounded-[0.2vw] text-[0.7vw] font-medium ${
                            getPaymentSourceLabel(record) === "Sales Page"
                              ? "bg-blue-100 text-blue-700"
                              : getPaymentSourceLabel(record) === "Order Page"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getPaymentSourceLabel(record)}
                        </span>
                      </td>
                      <td className="px-[1vw] py-[0.7vw] text-[0.8vw] text-gray-700">
                        {record.method || "-"}
                      </td>
                      <td className="px-[1vw] py-[0.7vw] text-[0.8vw] font-bold text-green-700">
                        ₹{parseFloat(record.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-[1vw] py-[0.7vw] text-[0.8vw] text-gray-600 max-w-[12vw]">
                        {record.remarks || "-"}
                      </td>
                      <td className="px-[1vw] py-[0.7vw]">
                        {record.file ? (
                          <button
                            onClick={() => {
                              const fileUrl = URL.createObjectURL(record.file);
                              window.open(fileUrl, "_blank");
                            }}
                            className="text-blue-600 hover:text-blue-800 text-[0.8vw] underline cursor-pointer"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[0.8vw]">
                            No file
                          </span>
                        )}
                      </td>
                      {!isCompleted && (
                        <td className="px-[1vw] py-[0.7vw] text-center">
                          {/* Only allow removal of sales payments, not order payments */}
                          {getPaymentSourceLabel(record) === "Sales Page" ? (
                            <button
                              onClick={() => removePaymentRecord(record.id)}
                              className="px-[0.75vw] py-[0.35vw] bg-red-500 text-white rounded-[0.3vw] text-[0.8vw] font-medium cursor-pointer hover:bg-red-600 transition-all"
                            >
                              Remove
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[0.7vw]">
                              From Order
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Summary - UPDATED with 5 cards */}
          <div className="grid grid-cols-5 gap-[1vw] mt-[1.5vw]">
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-lg p-[1vw]">
              <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                Order Estimate
              </p>
              <p className="text-[1.5vw] font-bold text-purple-700">
                ₹{orderEstimatedValue.toLocaleString()}
              </p>
              <p className="text-[0.6vw] text-gray-500 mt-1">From order page</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-[1vw]">
              <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                Bill Amount
              </p>
              <p className="text-[1.5vw] font-bold text-blue-700">
                ₹{(parseFloat(estimatedValue) || 0).toLocaleString()}
              </p>
              <p className="text-[0.6vw] text-gray-500 mt-1">
                Sales team entered
              </p>
            </div>

            {/* NEW CARD: Total Billed for Order */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-[1vw]">
              <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                Total Billed for Order
              </p>
              <p className="text-[1.5vw] font-bold text-indigo-700">
                ₹{totals.totalBilledAmountForOrder.toLocaleString()}
              </p>
              <p className="text-[0.6vw] text-gray-500 mt-1">
                Sum of all bills for this order
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-[1vw]">
              <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                Total Received
              </p>
              <p className="text-[1.5vw] font-bold text-green-700">
                ₹{totals.totalPaid.toLocaleString()}
              </p>
              <div className="text-[0.6vw] text-gray-600 mt-1">
                <div className="flex justify-between">
                  <span>From Order:</span>
                  <span className="font-medium text-green-600">
                    ₹
                    {orderPayments
                      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>From Sales:</span>
                  <span className="font-medium text-blue-600">
                    ₹
                    {paymentRecords
                      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* UPDATED: Balance Due now shows Order Estimate - Total Received */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-[1vw]">
              <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                Balance Due
              </p>
              <p className="text-[1.5vw] font-bold text-orange-700">
                ₹{totals.balanceDue.toLocaleString()}
              </p>
              <p className="text-[0.6vw] text-gray-500 mt-1">
                (Order Estimate - Total Received)
              </p>
              {isCredit && (
                <p className="text-[0.6vw] text-amber-600 mt-1">
                  Credit: {creditDays} days
                </p>
              )}
            </div>
          </div>

          {/* NEW ROW: Balance Estimated Amount */}
          <div className="mt-[1vw]">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-lg p-[1vw]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                    Balance Estimated Amount
                  </p>
                  <p className="text-[0.7vw] text-gray-600">
                    Order Estimate - Total Billed for Order
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[1.8vw] font-bold text-pink-700">
                    ₹
                    {Math.max(
                      orderEstimatedValue - totalBilledAmountForOrder,
                      0,
                    ).toLocaleString()}
                  </p>
                  <p className="text-[0.7vw] text-gray-600 mt-1">
                    Remaining estimated amount for future bills
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Information Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-[1.5vw]">
          <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-[1vw] border-b pb-[0.5vw]">
            {isCompleted ? "Billing Information" : "Set Billing Information"}
          </h2>

          {/* Customer Details Section */}
          <div className="mb-[1.5vw]">
            <h3 className="text-[1vw] font-semibold text-gray-700 mb-[0.75vw]">
              Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-[1.5vw]">
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerDetails.customerName}
                  onChange={(e) => {
                    setCustomerDetails({
                      ...customerDetails,
                      customerName: e.target.value,
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Enter customer name"
                  disabled={isCompleted}
                  className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
                <p className="text-[0.6vw] text-gray-500 mt-1">
                  Fetched from order page
                </p>
              </div>

              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerDetails.phoneNo}
                  onChange={(e) => {
                    setCustomerDetails({
                      ...customerDetails,
                      phoneNo: e.target.value,
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Enter phone number"
                  disabled={isCompleted}
                  className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
                <p className="text-[0.6vw] text-gray-500 mt-1">
                  Fetched from order page
                </p>
              </div>

              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={customerDetails.preferredLocation}
                  onChange={(e) => {
                    setCustomerDetails({
                      ...customerDetails,
                      preferredLocation: e.target.value,
                    });
                    setHasChanges(true);
                  }}
                  placeholder="Enter preferred location"
                  disabled={isCompleted}
                  className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>

              {/* UPDATED: Auto-complete Transport Name Input */}
              <div className="relative">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Preferred Transport Name
                </label>
                <input
                  type="text"
                  value={customerDetails.preferredTransport}
                  onChange={(e) => {
                    handleTransportChange(e.target.value);
                    setShowTransportDropdown(true);
                  }}
                  onFocus={() => setShowTransportDropdown(true)}
                  onBlur={handleTransportBlur}
                  placeholder="Type or select transport name"
                  disabled={isCompleted}
                  className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />

                {/* Transport Suggestions Dropdown */}
                {showTransportDropdown &&
                  filteredTransportSuggestions.length > 0 &&
                  !isCompleted && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-[15vw] overflow-y-auto">
                      {filteredTransportSuggestions.map((transport, index) => (
                        <div
                          key={index}
                          onClick={() => selectTransport(transport)}
                          className="px-[0.85vw] py-[0.6vw] text-[0.85vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          {transport}
                        </div>
                      ))}
                    </div>
                  )}

                <p className="text-[0.6vw] text-gray-500 mt-1">
                  Type to see suggestions
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Method Section */}
          <div className="mb-[1.5vw]">
            <h3 className="text-[1vw] font-semibold text-gray-700 mb-[0.75vw]">
              Delivery Method <span className="text-red-500">*</span>
            </h3>
            <div className="flex gap-[1.5vw]">
              <label className="flex items-center gap-[0.5vw] cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="doorstep"
                  checked={customerDetails.deliveryMethod === "doorstep"}
                  onChange={(e) => {
                    setCustomerDetails({
                      ...customerDetails,
                      deliveryMethod: e.target.value,
                    });
                    setHasChanges(true);
                  }}
                  disabled={isCompleted}
                  className="w-4 h-4 cursor-pointer"
                />
                <span
                  className={`text-[0.85vw] font-medium ${isCompleted ? "text-gray-500" : "text-gray-700"}`}
                >
                  Doorstep Delivery
                </span>
              </label>
              <label className="flex items-center gap-[0.5vw] cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="godown"
                  checked={customerDetails.deliveryMethod === "godown"}
                  onChange={(e) => {
                    setCustomerDetails({
                      ...customerDetails,
                      deliveryMethod: e.target.value,
                    });
                    setHasChanges(true);
                  }}
                  disabled={isCompleted}
                  className="w-4 h-4 cursor-pointer"
                />
                <span
                  className={`text-[0.85vw] font-medium ${isCompleted ? "text-gray-500" : "text-gray-700"}`}
                >
                  Godown Pickup
                </span>
              </label>
              <label className="flex items-center gap-[0.5vw] cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="ownPickup"
                  checked={customerDetails.deliveryMethod === "ownPickup"}
                  onChange={(e) => {
                    setCustomerDetails({
                      ...customerDetails,
                      deliveryMethod: e.target.value,
                    });
                    setHasChanges(true);
                  }}
                  disabled={isCompleted}
                  className="w-4 h-4 cursor-pointer"
                />
                <span
                  className={`text-[0.85vw] font-medium ${isCompleted ? "text-gray-500" : "text-gray-700"}`}
                >
                  Own Pickup
                </span>
              </label>
            </div>
          </div>

          {/* Credit Section */}
          <div className="mb-[1.5vw] flex items-start gap-[1vw]">
            <div className="flex items-center gap-[0.5vw] mb-[0.75vw]">
              <input
                type="checkbox"
                id="isCredit"
                checked={isCredit}
                onChange={(e) => {
                  setIsCredit(e.target.checked);
                  setHasChanges(true);
                  if (!e.target.checked) {
                    setCreditDays("");
                  }
                }}
                disabled={isCompleted}
                className="w-4 h-4 cursor-pointer"
              />
              <label
                htmlFor="isCredit"
                className={`text-[0.9vw] font-semibold cursor-pointer ${isCompleted ? "text-gray-500" : "text-gray-700"}`}
              >
                Credit
              </label>
            </div>

            {isCredit && (
              <div className="ml-[1.5vw]">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Credit Period (Number of Days){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={creditDays}
                  onChange={(e) => {
                    setCreditDays(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Enter number of days"
                  min="1"
                  disabled={isCompleted}
                  className={`w-full max-w-[300px] border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Bill Amount Section */}
          <div className="mb-[1.5vw]">
            <h3 className="text-[1vw] font-semibold text-gray-700 mb-[0.75vw]">
              Bill Amount
            </h3>
            <div className="grid grid-cols-2 gap-[1.5vw]">
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Estimated Bill Amount (₹){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => {
                    setEstimatedValue(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Enter bill amount"
                  min="0"
                  step="0.01"
                  disabled={isCompleted}
                  className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
                <p className="text-[0.7vw] text-gray-500 mt-1">
                  This is the actual bill amount to be charged (separate from
                  order estimate)
                </p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Additional Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Optional remarks about this bill"
                  rows="2"
                  disabled={isCompleted}
                  className={`w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] text-[0.85vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                    isCompleted ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isCompleted && (
            <div className="flex justify-end items-center mt-[1.5vw] gap-[1.5vw]">
              <div className="flex items-center gap-[1vw]">
                <button
                  onClick={saveBillData}
                  disabled={!hasChanges} // Only disable if no changes
                  className={`px-[1.5vw] py-[0.75vw] text-white rounded-lg font-semibold text-[0.9vw] transition-all cursor-pointer shadow-md ${
                    hasChanges
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Save Bill Data
                </button>

                {saveMessage && (
                  <div className="text-green-600 text-[0.8vw] font-medium animate-pulse">
                    {saveMessage}
                  </div>
                )}

                {isSaved && !saveMessage && !hasChanges && (
                  <div className="flex items-center gap-1 text-green-600 text-[0.8vw]">
                    <svg
                      className="w-4 h-4"
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
                    <span>Saved</span>
                  </div>
                )}

                {hasChanges && (
                  <div className="flex items-center gap-1 text-orange-600 text-[0.8vw]">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitToBilling}
                disabled={
                  parseFloat(estimatedValue || 0) < 0 ||
                  !customerDetails.customerName ||
                  !customerDetails.phoneNo ||
                  !customerDetails.deliveryMethod ||
                  (isCredit && !creditDays)
                }
                className={`px-[2vw] py-[0.75vw] text-white rounded-lg font-semibold text-[1vw] transition-all cursor-pointer shadow-md ${
                  estimatedValue !== "" &&
                  parseFloat(estimatedValue || 0) >= 0 &&
                  customerDetails.customerName &&
                  customerDetails.phoneNo &&
                  customerDetails.deliveryMethod &&
                  (!isCredit || creditDays)
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Send to Billing
              </button>
            </div>
          )}

          {/* Status Message */}
          {isCompleted && (
            <div className="mt-[1.5vw] p-[1vw] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-center gap-[0.75vw]">
                <svg
                  className="w-[1.5vw] h-[1.5vw] text-green-600"
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
                <div>
                  <p className="text-[1vw] font-semibold text-green-800">
                    ✓ Bill Already Sent to Billing
                  </p>
                  <p className="text-[0.85vw] text-green-600 mt-[0.25vw]">
                    This bill has been processed and sent to the billing
                    department. Bill Amount: ₹
                    {billData.estimatedValue?.toLocaleString() || "0"}
                  </p>
                  {billData.isCredit && (
                    <p className="text-[0.85vw] text-amber-600 mt-[0.25vw]">
                      Credit: {billData.creditDays} days
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        bulkPayment={bulkPayment}
        setBulkPayment={setBulkPayment}
        addPaymentRecord={addPaymentRecord}
        calculateTotals={calculateTotals}
      />
    </div>
  );
}
