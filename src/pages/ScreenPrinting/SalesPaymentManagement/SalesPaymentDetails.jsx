import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Storage keys
const SALES_PAYMENT_STORAGE_KEY = "screen_printing_sales_payment_data";
const BILLING_STORAGE_KEY = "screen_printing_billing_data";
const SCREEN_PRINTING_ORDERS_KEY = "screen_printing_orders";
const TRANSPORT_NAMES_STORAGE_KEY = "screen_printing_transport_names";

// Payment Modal Component
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
                    Payment Reference / Remarks <span className="text-red-500">*</span>
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
                    Upload Proof (Screenshot/Receipt) <span className="text-red-500">*</span>
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

export default function SalesPaymentDetails() {
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);
  const [estimatedValue, setEstimatedValue] = useState("");
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

  // Customer Details
  const [customerDetails, setCustomerDetails] = useState({
    customerName: "",
    phoneNo: "",
    preferredLocation: "",
    preferredTransport: "",
    deliveryMethod: "",
  });

  const [isCredit, setIsCredit] = useState(false);
  const [creditDays, setCreditDays] = useState("");

  // Save states
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Order values
  const [orderEstimatedValue, setOrderEstimatedValue] = useState(0);
  const [totalBilledAmountForOrder, setTotalBilledAmountForOrder] = useState(0);

  // Transport suggestions
  const [transportSuggestions, setTransportSuggestions] = useState([]);
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);

  // restock popup
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [billingSubmissionData, setBillingSubmissionData] = useState(null);


  // Load transport names
  useEffect(() => {
    const storedTransports = localStorage.getItem(TRANSPORT_NAMES_STORAGE_KEY);
    if (storedTransports) {
      try {
        const transports = JSON.parse(storedTransports);
        setTransportSuggestions(transports);
      } catch (error) {
        console.error("Error loading transport names:", error);
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

  // Track form changes
  useEffect(() => {
    if (billData) {
      const hasFormChanged = () => {
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

  // Load bill data
  useEffect(() => {
    const storedBill = localStorage.getItem("editing_sales_payment_bill");
    if (storedBill) {
      const parsedBill = JSON.parse(storedBill);
      setBillData(parsedBill);

      // Set estimated value
      setEstimatedValue(parsedBill.estimatedValue?.toString() || "");

      setRemarks(parsedBill.remarks || "");

      // Load customer details from order
      const orderDetails = loadOrderDetails(parsedBill.orderNumber);

      if (orderDetails) {
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
        setCustomerDetails(parsedBill.customerDetails);
      }

      // Load credit details
      if (parsedBill.isCredit !== undefined) {
        setIsCredit(parsedBill.isCredit);
        setCreditDays(parsedBill.creditDays?.toString() || "");
      }

      // Load payment records
      const billPaymentRecords = parsedBill.paymentRecords || [];
      setPaymentRecords(billPaymentRecords);

      // Load payments from order
      loadOrderPaymentsAndCalculate(parsedBill);
    } else {
      alert("No bill data found. Redirecting back...");
      navigate("/screen-printing/sales-payment");
    }
  }, [navigate]);

  // Load order details
  const loadOrderDetails = (orderNumber) => {
    try {
      if (!orderNumber) return null;

      const ordersData = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
      if (!ordersData) return null;

      const allOrders = JSON.parse(ordersData);
      
      // Screen printing orders are stored as an array
      if (Array.isArray(allOrders)) {
        const foundOrder = allOrders.find(
          (order) => order.orderNumber === orderNumber,
        );
        
        if (foundOrder) {
          return {
            contactName: foundOrder.contact?.contactName || "",
            phone: foundOrder.contact?.phone || "",
            company: foundOrder.contact?.company || "",
          };
        }
      }
    } catch (error) {
      console.error("Error loading order details:", error);
    }
    return null;
  };

  // Load payments from order
  const loadOrderPaymentsAndCalculate = (billData) => {
    try {
      const orderNumber = billData.orderNumber;
      if (!orderNumber) return;

      const ordersData = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
      if (!ordersData) return;

      const allOrders = JSON.parse(ordersData);
      
      if (Array.isArray(allOrders)) {
        const foundOrder = allOrders.find(
          (order) => order.orderNumber === orderNumber,
        );

        if (foundOrder) {
          // Get order's estimated value
          const estimatedValueFromOrder =
            foundOrder.orderEstimate?.estimatedValue ||
            foundOrder.totalEstimated ||
            foundOrder.estimatedValue ||
            foundOrder.payment?.totalEstimated ||
            foundOrder.totalBudget ||
            0;

          setOrderEstimatedValue(parseFloat(estimatedValueFromOrder) || 0);

          // Calculate total billed amount
          const totalBilled = calculateTotalBilledAmountForOrder(orderNumber);
          setTotalBilledAmountForOrder(totalBilled);

          // Load order payments
          if (foundOrder.paymentRecords) {
            const uniqueOrderPayments = [];
            const seenPaymentIds = new Set();

            foundOrder.paymentRecords.forEach((record) => {
              const recordId =
                record.id || `order-${record.timestamp}-${record.amount}`;

              const isFromThisBill = record.billId === billData.billId;

              if (!seenPaymentIds.has(recordId)) {
                seenPaymentIds.add(recordId);

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
      }
    } catch (error) {
      console.error("Error loading order payments:", error);
    }
  };

  // Calculate total billed amount for order
  const calculateTotalBilledAmountForOrder = (orderNumber) => {
    try {
      if (!orderNumber) return 0;

      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      if (!salesPaymentData) return 0;

      const allSalesPayments = JSON.parse(salesPaymentData);
      let totalBilled = 0;

      Object.keys(allSalesPayments).forEach((orderId) => {
        const bills = allSalesPayments[orderId];
        if (Array.isArray(bills)) {
          bills.forEach((bill) => {
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

  // Save bill data
  const saveBillData = () => {
    // Validation
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
          allSalesPayments[billData.orderId][billIndex] = {
            ...allSalesPayments[billData.orderId][billIndex],
            estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
            remarks: remarks,
            customerDetails: customerDetails,
            isCredit: isCredit,
            creditDays: isCredit ? parseInt(creditDays) : null,
            status: billData.status,
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

      // Update editing bill
      const updatedBill = {
        ...billData,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : 0,
        remarks: remarks,
        customerDetails: customerDetails,
        isCredit: isCredit,
        creditDays: isCredit ? parseInt(creditDays) : null,
        paymentRecords: paymentRecords,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "editing_sales_payment_bill",
        JSON.stringify(updatedBill),
      );
      setBillData(updatedBill);

      // Recalculate total billed amount
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

  // Validate before submitting to billing
  const validateBillingSubmission = () => {
    const errors = [];

    if (!estimatedValue || estimatedValue.trim() === "") {
      errors.push("Please enter Estimated Bill Amount");
    } else if (parseFloat(estimatedValue) < 0) {
      errors.push("Estimated Bill Amount cannot be negative");
    }

    if (
      !customerDetails.customerName ||
      customerDetails.customerName.trim() === ""
    ) {
      errors.push("Please enter Customer Name");
    }

    if (!customerDetails.phoneNo || customerDetails.phoneNo.trim() === "") {
      errors.push("Please enter Phone Number");
    } else if (
      !/^[0-9]{10}$/.test(customerDetails.phoneNo.replace(/\D/g, ""))
    ) {
      errors.push("Please enter a valid 10-digit Phone Number");
    }

    if (!customerDetails.deliveryMethod) {
      errors.push("Please select Delivery Method");
    }

    if (isCredit) {
      if (!creditDays || creditDays.trim() === "") {
        errors.push("Please enter Credit Period (Number of Days)");
      } else if (parseInt(creditDays) <= 0) {
        errors.push("Credit Period must be a positive number");
      }
    }

    return errors;
  };

  // Handle submit to billing
  const handleSubmitToBilling = () => {
    const validationErrors = validateBillingSubmission();

    if (validationErrors.length > 0) {
      alert(
        "Please fix the following errors:\n\n" + validationErrors.join("\n"),
      );
      return;
    }

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

    // Auto-save if not saved
    if (!isSaved || hasChanges) {
      try {
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
      }
    }

    try {
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

      // Sync payments to order
      syncPaymentsToOrder();

      // Add to billing storage
      const billingData = localStorage.getItem(BILLING_STORAGE_KEY);
      const allBilling = billingData ? JSON.parse(billingData) : {};

      if (!allBilling[billData.orderId]) {
        allBilling[billData.orderId] = [];
      }

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
        billingCustomerName: customerDetails.customerName,
        billingPhoneNo: customerDetails.phoneNo,
        deliveryMethod: customerDetails.deliveryMethod,
        creditInfo: isCredit ? `${creditDays} days credit` : "No credit",
      };

      allBilling[billData.orderId].push(billingEntry);
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(allBilling));

      // NEW: Store the order details and show restock modal
      setBillingSubmissionData({
        orderNumber: billData.orderNumber,
        companyName: billData.contact?.company || "Unknown Company",
      });
      
      setShowRestockModal(true);
      
      // Remove old alert
      // alert("Bill sent to Billing successfully!");
      
    } catch (error) {
      console.error("Error submitting to billing:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // NEW: Handle restock decision
  const handleRestockDecision = (shouldRestock) => {
    setShowRestockModal(false);
    
    if (shouldRestock && billingSubmissionData) {
      // Navigate to order details with orderNumber
      navigate(`/screen-printing/order-details?orderNumber=${billingSubmissionData.orderNumber}&fromRestock=true`);

    } else {
      // Just navigate back to sales payment page
      navigate("/screen-printing/sales-payment");
    }
    
    // Clear the stored data
    setBillingSubmissionData(null);
  };

  // NEW: Restock Modal Component
  const RestockModal = () => {
    if (!showRestockModal || !billingSubmissionData) return null;

    return (
      <div className="fixed inset-0 bg-[#000000ba] z-50 flex items-center justify-center p-[1vw]">
        <div className="bg-white rounded-lg overflow-hidden max-w-[40%] w-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-[1.2vw] font-bold text-gray-800">
              📦 Restock Order
            </h2>
            <button
              onClick={() => handleRestockDecision(false)}
              className="text-gray-500 hover:text-gray-800 text-[1.2vw] font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-[1.5vw]">
            <div className="mb-[1.5vw]">
              <div className="w-[3vw] h-[3vw] bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-[1vw]">
                <svg
                  className="w-[1.5vw] h-[1.5vw] text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              
              <h3 className="text-[1.1vw] font-semibold text-gray-800 text-center mb-[0.5vw]">
                Bill Sent to Billing Successfully!
              </h3>
              
              <p className="text-[0.9vw] text-gray-600 text-center mb-[1.5vw]">
                <strong>Order:</strong> {billingSubmissionData.orderNumber}<br/>
                <strong>Company:</strong> {billingSubmissionData.companyName}
              </p>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-[1vw] mb-[1.5vw]">
                <p className="text-[0.9vw] font-medium text-blue-800 text-center">
                  Do you want to restock this order now?
                </p>
                <p className="text-[0.75vw] text-blue-600 text-center mt-1">
                  This will redirect you to the order details page where you can manage stock
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 p-4 border-t border-gray-300 bg-gray-50">
            <button
              onClick={() => handleRestockDecision(false)}
              className="px-[1.5vw] py-[0.6vw] text-[0.9vw] cursor-pointer border-2 border-gray-300 text-gray-700 bg-white rounded font-medium hover:bg-gray-50 transition-all"
            >
              No, Go Back
            </button>
            <button
              onClick={() => handleRestockDecision(true)}
              className="px-[1.5vw] py-[0.6vw] text-[0.9vw] cursor-pointer bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center gap-[0.5vw]"
            >
              <svg
                className="w-[1vw] h-[1vw]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Yes, Restock Order
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Transport functions
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

  const handleTransportChange = (value) => {
    setCustomerDetails({
      ...customerDetails,
      preferredTransport: value,
    });
    setHasChanges(true);
  };

  const handleTransportBlur = () => {
    setTimeout(() => {
      setShowTransportDropdown(false);

      const transport = customerDetails.preferredTransport.trim();
      if (transport && !transportSuggestions.includes(transport)) {
        addTransportName(transport);
      }
    }, 200);
  };

  const selectTransport = (transport) => {
    setCustomerDetails({
      ...customerDetails,
      preferredTransport: transport,
    });
    setShowTransportDropdown(false);
    setHasChanges(true);
  };

  const filteredTransportSuggestions = customerDetails.preferredTransport
    ? transportSuggestions.filter((transport) =>
        transport
          .toLowerCase()
          .includes(customerDetails.preferredTransport.toLowerCase()),
      )
    : transportSuggestions;

  // Calculate totals
  const calculateTotals = () => {
    if (!billData)
      return {
        totalQuantity: 0,
        totalPaid: 0,
        billAmount: 0,
        orderEstimatedValue: orderEstimatedValue,
        totalBilledAmountForOrder: totalBilledAmountForOrder,
      };

    const totalQuantity = billData.products.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );

    // Calculate total paid
    const uniquePaymentIds = new Set();
    let totalFromBillPayments = 0;
    let totalFromOrderPayments = 0;

    paymentRecords.forEach((record) => {
      const recordId =
        record.id || `sales-${record.timestamp}-${record.amount}`;
      if (!uniquePaymentIds.has(recordId)) {
        uniquePaymentIds.add(recordId);
        totalFromBillPayments += parseFloat(record.amount) || 0;
      }
    });

    orderPayments.forEach((record) => {
      const recordId =
        record.id || `order-${record.timestamp}-${record.amount}`;
      if (!uniquePaymentIds.has(recordId)) {
        uniquePaymentIds.add(recordId);
        totalFromOrderPayments += parseFloat(record.amount) || 0;
      }
    });

    const totalPaid = totalFromBillPayments + totalFromOrderPayments;
    const billAmount = parseFloat(estimatedValue) || 0;
    const balanceDue = Math.max(orderEstimatedValue - totalPaid, 0);
    const balanceEstimatedAmount = Math.max(
      orderEstimatedValue - totalBilledAmountForOrder,
      0,
    );

    return {
      totalQuantity,
      totalPaid,
      billAmount,
      orderEstimatedValue: orderEstimatedValue,
      totalFromOrderPayments,
      totalFromBillPayments,
      balanceDue,
      totalBilledAmountForOrder,
      balanceEstimatedAmount,
    };
  };

  // Sync payments to order
  const syncPaymentsToOrder = () => {
    try {
      const ordersData = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
      if (!ordersData) return;

      const allOrders = JSON.parse(ordersData);
      
      if (Array.isArray(allOrders)) {
        const orderIndex = allOrders.findIndex(
          (order) => order.orderNumber === billData.orderNumber,
        );
        
        if (orderIndex >= 0) {
          const orderToUpdate = allOrders[orderIndex];
          const existingOrderPayments = orderToUpdate.paymentRecords || [];
          const existingPaymentIds = new Set();
          
          existingOrderPayments.forEach((payment) => {
            if (payment.id) existingPaymentIds.add(payment.id);
          });

          const newSalesPayments = paymentRecords.filter((salesPayment) => {
            return !existingPaymentIds.has(salesPayment.id);
          });

          const markedSalesPayments = newSalesPayments.map((payment) => ({
            ...payment,
            source: "sales",
            orderNumber: billData.orderNumber,
            billId: billData.billId,
          }));

          const updatedOrderPayments = [
            ...existingOrderPayments,
            ...markedSalesPayments,
          ];

          const updatedOrder = {
            ...orderToUpdate,
            paymentRecords: updatedOrderPayments,
            updatedAt: new Date().toISOString(),
          };

          allOrders[orderIndex] = updatedOrder;
          localStorage.setItem(SCREEN_PRINTING_ORDERS_KEY, JSON.stringify(allOrders));
          
          console.log(
            "Payments synced back to order:",
            newSalesPayments.length,
            "new payments added",
          );
        }
      }
    } catch (error) {
      console.error("Error syncing payments to order:", error);
    }
  };

  // Handle back
  const handleBack = () => {
    navigate("/screen-printing/sales-payment");
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

    if (bulkPayment.remarks.trim() === '' || !bulkPayment.remarks){
      alert("Please enter remarks");
      return;
    }
    
    if (!bulkPayment.file) {
      alert("Please upload payment proof");
      return;
    }

    const newRecord = {
      ...bulkPayment,
      id: Date.now(),
      dateTime: new Date().toLocaleString(),
      timestamp: new Date().toISOString(),
      source: "sales",
      orderNumber: billData.orderNumber,
      billId: billData.billId,
    };

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

    if (billData) {
      const updatedBill = {
        ...billData,
        paymentRecords: updatedRecords,
      };
      setBillData(updatedBill);

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

    setBulkPayment({
      paymentType: null,
      method: "",
      amount: "",
      remarks: "",
      file: null,
    });

    alert("Payment recorded successfully!");
  };

  // Remove payment record
  const removePaymentRecord = (recordId) => {
    if (confirm("Are you sure you want to remove this payment record?")) {
      const paymentToRemove = paymentRecords.find((r) => r.id === recordId);

      const updatedRecords = paymentRecords.filter((r) => r.id !== recordId);
      setPaymentRecords(updatedRecords);

      if (billData) {
        const updatedBill = {
          ...billData,
          paymentRecords: updatedRecords,
        };
        setBillData(updatedBill);

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

      if (paymentToRemove) {
        removePaymentFromOrder(recordId);
      }
    }
  };

  // Helper function to remove payment from order
  const removePaymentFromOrder = (recordId) => {
    try {
      const ordersData = localStorage.getItem(SCREEN_PRINTING_ORDERS_KEY);
      if (!ordersData) return;

      const allOrders = JSON.parse(ordersData);
      
      if (Array.isArray(allOrders)) {
        const orderIndex = allOrders.findIndex(
          (order) => order.orderNumber === billData.orderNumber,
        );
        
        if (orderIndex >= 0) {
          const orderToUpdate = allOrders[orderIndex];
          if (orderToUpdate.paymentRecords) {
            const updatedOrderPayments = orderToUpdate.paymentRecords.filter(
              (payment) => payment.id !== recordId,
            );

            const updatedOrder = {
              ...orderToUpdate,
              paymentRecords: updatedOrderPayments,
            };

            allOrders[orderIndex] = updatedOrder;
            localStorage.setItem(SCREEN_PRINTING_ORDERS_KEY, JSON.stringify(allOrders));
          }
        }
      }
    } catch (error) {
      console.error("Error removing payment from order:", error);
    }
  };

  // Helper functions for display
  const getPaymentSourceLabel = (record) => {
    if (record.source === "sales") return "Sales Page";
    if (record.source === "order" || record.id?.includes("order-"))
      return "Order Page";
    return "Unknown Source";
  };

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

  // Combine all payments for display
  const allPayments = [];
  const seenPaymentIds = new Set();

  orderPayments.forEach((record) => {
    const recordId = record.id || `order-${record.timestamp}-${record.amount}`;
    if (!seenPaymentIds.has(recordId)) {
      seenPaymentIds.add(recordId);
      allPayments.push(record);
    }
  });

  paymentRecords.forEach((record) => {
    const recordId = record.id || `sales-${record.timestamp}-${record.amount}`;
    if (!seenPaymentIds.has(recordId)) {
      seenPaymentIds.add(recordId);
      allPayments.push(record);
    }
  });

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
            Sales Payment Bill Details
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
                    Product Name
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Size
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Printing Name
                  </th>
                  <th className="border border-gray-300 px-[1vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                    Quantity
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
                      {product.productName}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.size}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw]">
                      {product.printingName}
                    </td>
                    <td className="border border-gray-300 px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-blue-600">
                      {product.quantity}
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
          </div>
        </div>

        {/* Payment Records Section */}
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
                      <td className="px-[1vw] py-[0.7vw] text-[0.8vw] text-gray-600 max-w-[12vw] truncate">
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

          {/* Payment Summary */}
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

          {/* Balance Estimated Amount */}
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
                  value="ownpickup"
                  checked={customerDetails.deliveryMethod === "ownpickup"}
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
                  disabled={!hasChanges}
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

      {/* restock modal */}
      <RestockModal />
    </div>
  );
}