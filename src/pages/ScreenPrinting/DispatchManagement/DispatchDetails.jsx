// DispatchDetails.jsx - Updated version
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const DISPATCH_STORAGE_KEY = "screen_printing_dispatch_data";
const SALES_PAYMENT_STORAGE_KEY = "screen_printing_sales_payment_data";

// LR Number options for autocomplete
const LR_NUMBER_OPTIONS = [
  "LR001", "LR002", "LR003", "LR004", "LR005",
  "LR006", "LR007", "LR008", "LR009", "LR010",
  "LR011", "LR012", "LR013", "LR014", "LR015"
];

export default function DispatchDetails() {
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);
  const [salesPaymentData, setSalesPaymentData] = useState(null);

  // LR Details
  const [lrNumber, setLrNumber] = useState("");
  const [lrDocument, setLrDocument] = useState(null);
  const [lrDocumentPreview, setLrDocumentPreview] = useState(null);
  const [lrDocumentName, setLrDocumentName] = useState("");
  const [lrDropdownOpen, setLrDropdownOpen] = useState(false);
  const [filteredLRNumbers, setFilteredLRNumbers] = useState(LR_NUMBER_OPTIONS);

  // Customer Dispatch Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Transport Details
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Customer Details from Sales Payment
  const [customerDetails, setCustomerDetails] = useState({
    preferredLocation: "",
    preferredTransport: "",
    deliveryMethod: "",
  });

  const lrInputRef = useRef(null);

  // Load bill data
 useEffect(() => {
  const storedBill = localStorage.getItem("editing_dispatch_bill");
  if (storedBill) {
    try {
      const parsedBill = JSON.parse(storedBill);
      console.log("Initial load - Loaded bill data:", parsedBill);
      console.log("Bill ID:", parsedBill.id);
      console.log("Sales Bill ID:", parsedBill.salesBillId);
      console.log("Order Number:", parsedBill.orderNumber);
      
      setBillData(parsedBill);

      // Load sales payment data for customer details
      loadSalesPaymentData(parsedBill);

      // Set form fields from the bill
      setLrNumber(parsedBill.lrNumber || "");
      setLrDocumentName(parsedBill.lrDocumentName || "");
      
      // Handle lrDocument preview
      if (parsedBill.lrDocument) {
        if (parsedBill.lrDocument.data) {
          setLrDocumentPreview(parsedBill.lrDocument.data);
        } else if (parsedBill.lrDocument.isPdf) {
          setLrDocumentPreview("pdf");
        }
      }
      
      setTransporterName(parsedBill.transporterName || "");
      setVehicleNumber(parsedBill.vehicleNumber || "");
      setDriverName(parsedBill.driverName || "");
      setDriverPhone(parsedBill.driverPhone || "");
      
      // Set dispatch date - prioritize saved date, then today
      const today = getTodayDate();
      const storedDispatchDate = parsedBill.dispatchDate;
      const isValidDate = storedDispatchDate && !isNaN(new Date(storedDispatchDate).getTime());
      setDispatchDate(isValidDate ? storedDispatchDate : today);
      
      setRemarks(parsedBill.remarks || "");
      
      // Set customer details
      if (parsedBill.customerName) setCustomerName(parsedBill.customerName);
      if (parsedBill.customerPhone) setCustomerPhone(parsedBill.customerPhone);
      
      // Also check if bill exists in main storage and load that data if available
      const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
      if (dispatchData) {
        const allDispatch = JSON.parse(dispatchData);
        if (Array.isArray(allDispatch)) {
          const mainBill = allDispatch.find(
            b => b.id === parsedBill.id || 
            b.salesBillId === parsedBill.salesBillId ||
            b.orderNumber === parsedBill.orderNumber
          );
          if (mainBill) {
            console.log("Found more recent data in main storage:", mainBill);
            // Optionally update from main storage
          }
        }
      }
      
    } catch (error) {
      console.error("Error parsing bill data:", error);
      alert("Error loading dispatch data. Redirecting back...");
      navigate("/screen-printing/dispatch");
    }
  } else {
    alert("No dispatch data found. Redirecting back...");
    navigate("/screen-printing/dispatch");
  }
}, [navigate]);


// Update the getTodayDate function to be more reliable
const getTodayDate = () => {
  const today = new Date();
  // Ensure we're using local time, not UTC
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initialize dispatch date to today if not set
useEffect(() => {
  if (!dispatchDate) {
    setDispatchDate(getTodayDate());
  }
}, [dispatchDate]);


  // Load sales payment data to get customer details
  const loadSalesPaymentData = (dispatchBill) => {
    try {
      const salesPaymentData = localStorage.getItem(SALES_PAYMENT_STORAGE_KEY);
      if (!salesPaymentData) {
        console.warn("No sales payment data found");
        return;
      }

      const allSalesPayments = JSON.parse(salesPaymentData);

      let salesBillKey = null;
      let salesBill = null;

      // Look through all keys in the sales payment data
      for (const key in allSalesPayments) {
        if (Array.isArray(allSalesPayments[key])) {
          // Look for the bill in this array
          const foundBill = allSalesPayments[key].find(
            (bill) => bill.billId === dispatchBill.salesBillId
          );

          if (foundBill) {
            salesBillKey = key;
            salesBill = foundBill;
            break;
          }
        }
      }

      if (salesBill) {
        setSalesPaymentData(salesBill);

        // Set customer details from sales payment data
        if (salesBill.customerDetails) {
          setCustomerName(salesBill.customerDetails.customerName || "");
          setCustomerPhone(salesBill.customerDetails.phoneNo || "");

          setCustomerDetails({
            preferredLocation: salesBill.customerDetails.preferredLocation || "",
            preferredTransport: salesBill.customerDetails.preferredTransport || "",
            deliveryMethod: salesBill.customerDetails.deliveryMethod || "",
          });

        } else {
          // Fallback to contact details if customerDetails doesn't exist
          setCustomerName(salesBill.contact?.contactName || "");
          setCustomerPhone(salesBill.contact?.phone || "");
        }

        console.log(`Customer details loaded: ${salesBill.customerDetails?.customerName || salesBill.contact?.contactName}`);
      } else {
        console.warn("No matching sales payment bill found for salesBillId:", dispatchBill.salesBillId);
        // Fallback to dispatch bill data
        setCustomerName(dispatchBill.contactName || dispatchBill.contact?.contactName || "");
        setCustomerPhone(dispatchBill.phone || dispatchBill.contact?.phone || "");
      }
    } catch (error) {
      console.error("Error loading sales payment data:", error);
      // Fallback to dispatch bill data
      setCustomerName(dispatchBill.contactName || dispatchBill.contact?.contactName || "");
      setCustomerPhone(dispatchBill.phone || dispatchBill.contact?.phone || "");
    }
  };


  // Add this useEffect to fix data structure on load
useEffect(() => {
  const fixDispatchDataStructure = () => {
    try {
      const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
      if (dispatchData) {
        const parsed = JSON.parse(dispatchData);
        
        // If it's an object (old structure), convert to array
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          console.log("Converting old dispatch structure to array...");
          const newArray = [];
          
          // Flatten all entries into a single array
          Object.keys(parsed).forEach(key => {
            if (Array.isArray(parsed[key])) {
              newArray.push(...parsed[key]);
            } else if (parsed[key]) {
              newArray.push(parsed[key]);
            }
          });
          
          localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(newArray));
          console.log("Converted to array with", newArray.length, "entries");
        }
      }
    } catch (error) {
      console.error("Error fixing dispatch data structure:", error);
    }
  };
  
  fixDispatchDataStructure();
}, []);

  // Handle LR input change with autocomplete
  const handleLrInputChange = (e) => {
    const value = e.target.value;
    setLrNumber(value);

    const filtered = LR_NUMBER_OPTIONS.filter((lr) =>
      lr.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredLRNumbers(filtered);
    setLrDropdownOpen(true);
  };

  // Handle LR selection from dropdown
  const handleLrSelect = (lr) => {
    setLrNumber(lr);
    setLrDropdownOpen(false);
    setFilteredLRNumbers(LR_NUMBER_OPTIONS);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB");
        return;
      }

      setLrDocument(file);
      setLrDocumentName(file.name);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLrDocumentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setLrDocumentPreview("pdf");
      }
    }
  };

  // Remove LR document
  const removeLrDocument = () => {
    setLrDocument(null);
    setLrDocumentPreview(null);
    setLrDocumentName("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (lrInputRef.current && !lrInputRef.current.contains(event.target)) {
        setLrDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validate form
  const validateForm = () => {
    if (!lrNumber.trim()) {
      alert("Please enter LR Number");
      return false;
    }

    if (!customerName.trim()) {
      alert("Please enter Customer Name");
      return false;
    }

    if (!customerPhone.trim()) {
      alert("Please enter Customer Phone");
      return false;
    }

    if (!dispatchDate) {
      alert("Please select Dispatch Date");
      return false;
    }

    return true;
  };

const reloadSavedData = () => {
  try {
    const savedBill = localStorage.getItem("editing_dispatch_bill");
    if (savedBill) {
      const parsed = JSON.parse(savedBill);
      console.log("Reloading from editing_dispatch_bill:", parsed);
      
      // Update all form fields with saved data
      setLrNumber(parsed.lrNumber || "");
      setLrDocumentName(parsed.lrDocumentName || "");
      
      // Handle lrDocument preview if exists
      if (parsed.lrDocument) {
        if (parsed.lrDocument.data) {
          setLrDocumentPreview(parsed.lrDocument.data);
        } else if (parsed.lrDocument.isPdf) {
          setLrDocumentPreview("pdf");
        }
      }
      
      setTransporterName(parsed.transporterName || "");
      setVehicleNumber(parsed.vehicleNumber || "");
      setDriverName(parsed.driverName || "");
      setDriverPhone(parsed.driverPhone || "");
      setDispatchDate(parsed.dispatchDate || getTodayDate());
      setRemarks(parsed.remarks || "");
      
      // Update customer details if they exist in saved bill
      if (parsed.customerName) setCustomerName(parsed.customerName);
      if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
      
      // Also update billData state
      setBillData(parsed);
    }
    
    // Check the main dispatch storage
    const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
    if (dispatchData) {
      const parsedDispatch = JSON.parse(dispatchData);
      console.log("Main dispatch storage:", parsedDispatch);
      console.log("Number of dispatch entries:", parsedDispatch.length);
      
      // If we have a billData, check if it exists in the array
      if (billData) {
        const foundBill = parsedDispatch.find(
          b => b.id === billData.id || 
          b.dispatchId === billData.dispatchId || 
          b.salesBillId === billData.salesBillId
        );
        console.log("Found bill in main storage?", foundBill ? "YES" : "NO");
      }
    }
  } catch (error) {
    console.error("Error reloading saved data:", error);
  }
};

// Update the handleSave function to call reloadSavedData immediately
const handleSave = () => {
  if (!validateForm()) return;

  if (!window.confirm("Save dispatch details?")) {
    return;
  }

  try {
    updateDispatchData(false);
    // Immediately reload and update form fields
    reloadSavedData();
    alert("Dispatch details saved successfully!");
  } catch (error) {
    console.error("Error saving dispatch details:", error);
    alert("An error occurred. Please try again.");
  }
};


  // Handle Mark as Dispatched
  const handleMarkAsDispatched = () => {
    if (!validateForm()) return;

    if (!window.confirm("Mark this bill as Dispatched?\nThis action cannot be undone.")) {
      return;
    }

    try {
      updateDispatchData(true);
      alert("Bill marked as Dispatched successfully!");
      navigate("/screen-printing/dispatch");
    } catch (error) {
      console.error("Error marking as dispatched:", error);
      alert("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
  if (billData) {
    console.log("Current billData:", billData);
    console.log("billData.id:", billData.id);
    console.log("billData.dispatchId:", billData.dispatchId);
    
    // Check dispatch storage structure
    const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
    if (dispatchData) {
      const parsed = JSON.parse(dispatchData);
      console.log("Dispatch storage keys:", Object.keys(parsed));
      
      // Check each key for our bill
      Object.keys(parsed).forEach(key => {
        if (Array.isArray(parsed[key])) {
          const foundBill = parsed[key].find(
            b => b.id === billData.id || b.dispatchId === billData.dispatchId || b.dispatchId === billData.id
          );
          if (foundBill) {
            console.log(`Found bill in key "${key}":`, foundBill);
          }
        }
      });
    }
  }
}, [billData]);


 // Update dispatch data - FIXED VERSION
const updateDispatchData = (markAsDispatched) => {
  try {
    const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
    let allDispatch = dispatchData ? JSON.parse(dispatchData) : [];

    console.log("Current dispatch data structure:", allDispatch);
    console.log("Is array?", Array.isArray(allDispatch));
    console.log("Bill data:", billData);
    console.log("Bill id:", billData.id);
    console.log("Bill dispatchId:", billData.dispatchId);

    // Find the bill in the array - check for multiple possible identifiers
    const billIndex = allDispatch.findIndex(
      (b) => 
        b.id === billData.id || 
        b.dispatchId === billData.dispatchId || 
        b.dispatchId === billData.id ||
        b.salesBillId === billData.salesBillId ||
        (b.orderNumber === billData.orderNumber && b.salesBillId === billData.salesBillId)
    );
    
    console.log(`Found bill at index: ${billIndex}`);

    // Get the existing bill if found, otherwise use current billData
    const existingBill = billIndex >= 0 ? allDispatch[billIndex] : billData;
    
    // Create updated bill object
    const updatedBill = {
      ...existingBill,
      id: billData.id || existingBill.id || `DISPATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dispatchId: billData.dispatchId || existingBill.dispatchId || billData.id,
      billingId: billData.billingId || existingBill.billingId,
      salesBillId: billData.salesBillId || existingBill.salesBillId,
      orderNumber: billData.orderNumber || existingBill.orderNumber,
      companyName: billData.companyName || existingBill.companyName,
      lrNumber,
      // Handle lrDocument - store metadata only
      lrDocument: lrDocument ? {
        name: lrDocument.name,
        type: lrDocument.type,
        size: lrDocument.size,
        uploadedAt: new Date().toISOString(),
        data: lrDocumentPreview && lrDocumentPreview !== "pdf" ? lrDocumentPreview : null,
        isPdf: lrDocumentPreview === "pdf"
      } : existingBill.lrDocument,
      lrDocumentName: lrDocument ? lrDocument.name : (lrDocumentName || existingBill.lrDocumentName),
      customerName: customerName || existingBill.customerName,
      customerPhone: customerPhone || existingBill.customerPhone,
      transporterName: transporterName || existingBill.transporterName,
      vehicleNumber: vehicleNumber || existingBill.vehicleNumber,
      driverName: driverName || existingBill.driverName,
      driverPhone: driverPhone || existingBill.driverPhone,
      dispatchDate: dispatchDate || existingBill.dispatchDate,
      remarks: remarks || existingBill.remarks,
      estimatedValue: billData.estimatedValue || existingBill.estimatedValue,
      paymentStatus: billData.paymentStatus || existingBill.paymentStatus,
      products: billData.products || existingBill.products,
      contact: billData.contact || existingBill.contact,
      dispatchStatus: markAsDispatched ? "dispatched" : (existingBill.dispatchStatus || "pending"),
      updatedAt: new Date().toISOString(),
      createdAt: billData.createdAt || existingBill.createdAt || new Date().toISOString(),
    };

    // Add dispatchedAt if marking as dispatched
    if (markAsDispatched) {
      updatedBill.dispatchedAt = new Date().toISOString();
    }

    // Update or add the bill
    if (billIndex >= 0) {
      allDispatch[billIndex] = updatedBill;
    } else {
      allDispatch.push(updatedBill);
    }

    // Save back to localStorage
    localStorage.setItem(DISPATCH_STORAGE_KEY, JSON.stringify(allDispatch));

    // Also update the editing bill in localStorage
    localStorage.setItem("editing_dispatch_bill", JSON.stringify(updatedBill));

    // Update local state
    setBillData(updatedBill);
    
    console.log("Dispatch data updated successfully. New structure:", allDispatch);
    console.log("Updated bill saved with ID:", updatedBill.id);
    
    // Verify it was saved
    const savedData = JSON.parse(localStorage.getItem(DISPATCH_STORAGE_KEY) || '[]');
    const found = savedData.find(b => b.id === updatedBill.id);
    console.log("Verification - Found in storage:", found ? "YES" : "NO");
    
  } catch (error) {
    console.error("Error updating dispatch data:", error);
    alert(`Error saving dispatch data: ${error.message}`);
    throw error;
  }
};


  useEffect(() => {
  const dispatchData = localStorage.getItem(DISPATCH_STORAGE_KEY);
  if (dispatchData) {
    console.log("Full dispatch data structure:", JSON.parse(dispatchData));
  }
}, []);

  // Handle back
  const handleBack = () => {
    navigate("/screen-printing/dispatch");
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!billData) return { totalQuantity: 0 };

    const totalQuantity = billData.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    return { totalQuantity };
  };

  
  // Initialize dispatch date to today if not set
  useEffect(() => {
    if (!dispatchDate) {
      setDispatchDate(getTodayDate());
    }
  }, [dispatchDate]);

  if (!billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[1.2vw] text-gray-600">Loading...</div>
      </div>
    );
  }

  const totals = calculateTotals();
  const isDispatched = billData.dispatchStatus === "dispatched";

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
        {/* Header */}
        <div className="flex items-center p-[1vw] px-[1.5vw] border-b border-gray-200 relative">
          <button
            className="flex gap-[.5vw] items-center cursor-pointer hover:text-green-600 transition-colors"
            onClick={handleBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[1vw] h-[1vw]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-[1vw]">Back</span>
          </button>
          <div className="text-center w-full">
            <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
              🚚 Screen Printing Dispatch Bill Details
            </h1>
            <p className="text-[.85vw] text-gray-600 mt-1">
              Bill ID: {billData.dispatchId} • Order: #{billData.orderNumber}
            </p>
            
          </div>
        </div>

        <div className="p-[1.5vw] space-y-[1.5vw] max-h-[75vh] overflow-y-auto">
          {/* Dispatch Status Warning */}
          {isDispatched && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-[0.6vw] p-[1vw]">
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
                    ✓ Bill Already Dispatched
                  </p>
                  <p className="text-[0.85vw] text-green-600 mt-[0.25vw]">
                    This bill was dispatched on{" "}
                    {billData.dispatchedAt &&
                      new Date(billData.dispatchedAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order & Bill Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-green-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📋</span> Bill Information
            </h3>
            <div className="grid grid-cols-3 gap-[1vw]">
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Company Name
                </label>
                <input
                  type="text"
                  value={billData.companyName || "NA"}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Order Number
                </label>
                <input
                  type="text"
                  value={billData.orderNumber || "NA"}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Payment Status
                </label>
                <input
                  type="text"
                  value={billData.paymentStatus === "Paid" ? "✓ Paid" : "○ Pending"}
                  disabled
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border rounded-[0.4vw] font-bold ${billData.paymentStatus === "Paid"
                    ? "bg-green-100 border-green-300 text-green-800"
                    : "bg-yellow-100 border-yellow-300 text-yellow-800"
                    }`}
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Bill Created
                </label>
                <input
                  type="text"
                  value={billData.createdAt ? new Date(billData.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "N/A"}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-medium"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Estimated Value
                </label>
                <input
                  type="text"
                  value={`₹${billData.estimatedValue?.toLocaleString() || "0"}`}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800"
                />
              </div>
              <div>
                <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                  Total Products
                </label>
                <input
                  type="text"
                  value={`${billData.products.length} products`}
                  disabled
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-bold text-blue-800"
                />
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📦</span> Products to Dispatch ({billData.products.length} products)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-300 max-h-[40vh]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      S.No
                    </th>
                    <th className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Product Name
                    </th>
                    <th className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Size
                    </th>
                    <th className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Printing Name
                    </th>
                    <th className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-left text-[0.85vw] font-semibold">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billData.products.map((product, idx) => (
                    <tr key={idx} className="hover:bg-amber-50">
                      <td className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-[0.85vw]">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-[0.85vw] font-semibold text-purple-700">
                        {product.productName}
                      </td>
                      <td className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-[0.85vw]">
                        {product.size}
                      </td>
                      <td className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-[0.85vw]">
                        {product.printingName}
                      </td>
                      <td className="border border-gray-300 px-[0.8vw] py-[0.6vw] text-[0.85vw] font-bold text-green-700">
                        {product.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="mt-[1vw] p-[0.8vw] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-center">
                <p className="text-[0.75vw] text-gray-600">Total Quantity</p>
                <p className="text-[1.3vw] font-bold text-blue-600">
                  {totals.totalQuantity}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Dispatch Details */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">📍</span> Customer Dispatch Details
              {salesPaymentData && (
                <span className="text-[0.7vw] text-green-600 font-normal ml-2">
                  (Loaded from Sales Payment)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-[1vw]">
              {/* Customer Name */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  readOnly
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
                {salesPaymentData?.customerDetails?.customerName && (
                  <p className="text-[0.6vw] text-green-600 mt-1">
                    From Sales: {salesPaymentData.customerDetails.customerName}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  readOnly
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw] font-semibold"
                />
                {salesPaymentData?.customerDetails?.phoneNo && (
                  <p className="text-[0.6vw] text-green-600 mt-1">
                    From Sales: {salesPaymentData.customerDetails.phoneNo}
                  </p>
                )}
              </div>

              {/* Preferred Location */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={customerDetails.preferredLocation || ""}
                  readOnly
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
                {salesPaymentData?.customerDetails?.preferredLocation && (
                  <p className="text-[0.6vw] text-green-600 mt-1">
                    From Sales: {salesPaymentData.customerDetails.preferredLocation}
                  </p>
                )}
              </div>

              {/* Preferred Transport */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Preferred Transport
                </label>
                <input
                  type="text"
                  value={customerDetails.preferredTransport || ""}
                  readOnly
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-gray-100 border border-gray-300 rounded-[0.4vw]"
                />
                {salesPaymentData?.customerDetails?.preferredTransport && (
                  <p className="text-[0.6vw] text-green-600 mt-1">
                    From Sales: {salesPaymentData.customerDetails.preferredTransport}
                  </p>
                )}
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Delivery Method
                </label>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-1 rounded text-[0.7vw] font-medium ${salesPaymentData?.customerDetails?.deliveryMethod === "doorstep"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    Doorstep
                  </span>
                  <span className={`px-2 py-1 rounded text-[0.7vw] font-medium ${salesPaymentData?.customerDetails?.deliveryMethod === "godown"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    Godown
                  </span>
                  <span className={`px-2 py-1 rounded text-[0.7vw] font-medium ${salesPaymentData?.customerDetails?.deliveryMethod === "ownpickup"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    Own Pickup
                  </span>
                </div>
                {salesPaymentData?.customerDetails?.deliveryMethod && (
                  <p className="text-[0.6vw] text-blue-600 mt-1">
                    Selected: { salesPaymentData.customerDetails.deliveryMethod === "doorstep" ? "Doorstep Delivery" : salesPaymentData.customerDetails.deliveryMethod === "godown" ? "Godown Pickup" : "Own Pickup" }
                  </p>
                )}
              </div>

              {/* Credit Information */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Credit Information
                </label>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-1 rounded text-[0.7vw] font-medium ${salesPaymentData?.isCredit
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    {salesPaymentData?.isCredit ? `Credit: ${salesPaymentData.creditDays || 0} days` : "No Credit"}
                  </span>
                </div>
                {salesPaymentData?.isCredit && (
                  <p className="text-[0.6vw] text-amber-600 mt-1">
                    Credit period: {salesPaymentData.creditDays} days
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* LR Details */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">🚛</span> LR (Lorry Receipt) Details
            </h3>
            <div className="grid grid-cols-2 gap-[1vw]">
              {/* LR Number */}
              <div className="relative" ref={lrInputRef}>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  LR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={handleLrInputChange}
                  onFocus={() => setLrDropdownOpen(true)}
                  placeholder="Type or select LR number..."
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-blue-300"
                    }`}
                />

                {/* Autocomplete Dropdown */}
                {lrDropdownOpen && filteredLRNumbers.length > 0 && !isDispatched && (
                  <div className="absolute z-50 w-full mt-[0.2vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-lg max-h-[12vw] overflow-y-auto">
                    {filteredLRNumbers.map((lr) => (
                      <div
                        key={lr}
                        onClick={() => handleLrSelect(lr)}
                        className="px-[0.75vw] py-[0.5vw] text-[.85vw] hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        {lr}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LR Document Upload */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  LR Document
                </label>
                {!isDispatched ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="lr-document-upload"
                    />
                    <label
                      htmlFor="lr-document-upload"
                      className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-blue-300 rounded-[0.4vw] flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-gray-600">
                        {lrDocumentName || "Upload LR document..."}
                      </span>
                      <span className="text-blue-600">📎</span>
                    </label>

                    {lrDocument && (
                      <button
                        onClick={removeLrDocument}
                        className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.7vw] hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-blue-300 rounded-[0.4vw] p-[0.75vw] bg-gray-100">
                    {billData.lrDocumentName || billData.lrDocument?.name || "No document uploaded"}
                  </div>
                )}

                {lrDocumentPreview && (
                  <div className="mt-[0.5vw]">
                    {lrDocumentPreview === "pdf" ? (
                      <div className="flex items-center gap-[0.5vw] text-green-600 text-[0.7vw]">
                        <span>📄</span>
                        <span>PDF document uploaded</span>
                      </div>
                    ) : (
                      <div className="w-full h-32 border border-gray-300 rounded-[0.4vw] overflow-hidden">
                        <img
                          src={lrDocumentPreview}
                          alt="LR Document Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transport Details */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
            <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
              <span className="text-[1.3vw]">🚚</span> Transport Details
            </h3>
            <div className="grid grid-cols-2 gap-[1vw]">
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Transporter Name
                </label>
                <input
                  type="text"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="Enter transporter name"
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-amber-300"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number"
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-amber-300"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-amber-300"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Driver Phone
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Enter driver phone"
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-amber-300"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Dispatch Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  min={getTodayDate()}
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-amber-300"
                    }`}
                />
                
              </div>

              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  disabled={isDispatched}
                  className={`w-full text-[.85vw] px-[0.75vw] py-[0.4vw] border-2 rounded-[0.4vw] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${isDispatched
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                    : "bg-white border-amber-300"
                    }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {!isDispatched && (
              <div className="flex gap-[1vw] justify-end mt-[1.5vw]">
                <button
                  onClick={handleSave}
                  className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md cursor-pointer"
                >
                  💾 Save Details
                </button>
                <button
                  onClick={handleMarkAsDispatched}
                  className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer"
                >
                  ✓ Mark as Dispatched
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}