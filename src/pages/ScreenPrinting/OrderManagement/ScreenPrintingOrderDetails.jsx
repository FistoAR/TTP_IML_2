import { useState, useRef, useEffect } from "react";
import { RgbaColorPicker } from "react-colorful";
import * as pdfjsLib from "pdfjs-dist";

import design1PDF from "../../../assets/pdf/design1.pdf";
import design2PDF from "../../../assets/pdf/design2.pdf";
import design3PDF from "../../../assets/pdf/design3.pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Dummy company data
const DUMMY_COMPANIES = [
  { company: "ABC Industries", contactName: "John Smith", phone: "9876543210" },
  { company: "XYZ Corporation", contactName: "Jane Doe", phone: "9123456780" },
  {
    company: "Tech Solutions Ltd",
    contactName: "Robert Brown",
    phone: "9988776655",
  },
  {
    company: "Global Packaging",
    contactName: "Emily Davis",
    phone: "9765432100",
  },
  {
    company: "Prime Manufacturing",
    contactName: "Michael Wilson",
    phone: "9456789012",
  },
];

const AutocompleteInput = ({ value, onChange, options, placeholder }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const autocompleteInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteInputRef.current &&
        !autocompleteInputRef.current.contains(event.target)
      ) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [value, options]);

  return (
    <div ref={autocompleteInputRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowOptions(true)}
        placeholder={placeholder}
        className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />
      {showOptions && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-[0.25vw] bg-white border border-gray-300 rounded-[0.5vw] shadow-lg max-h-[15vw] overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                onChange(option);
                setShowOptions(false);
              }}
              className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-[0.85vw]"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add Payment Modal Component (same as NewOrder.jsx)
const PaymentModal = ({
  showPaymentModal,
  setShowPaymentModal,
  bulkPayment,
  setBulkPayment,
  addPaymentRecord,
  calculateTotals,
}) => {
  if (!showPaymentModal) return null;

  return (
    <div className="fixed inset-0 bg-[#000000ba] z-50 flex items-center justify-center p-[1vw]">
      <div className="bg-white rounded-lg overflow-hidden max-w-[70%] w-full max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-[1.2vw] font-bold text-gray-800">
            Add New Payment
          </h2>
          <button
            onClick={() => {
              setShowPaymentModal(false);
              // Reset form
              setBulkPayment({
                paymentType: null,
                method: "",
                amount: "",
                remarks: "",
              });
            }}
            className="text-gray-500 hover:text-gray-800 text-[1.2vw] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-[1.25vw]">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-[1.5vw]">
            <h3 className="text-[1.15vw] font-semibold text-green-900 mb-4">
              Record Payment
            </h3>

            {/* Payment Type Selection */}
            <div className="flex gap-[1.2vw] mb-[1.25vw]">
              <label className="flex items-center gap-[.75vw] cursor-pointer">
                <input
                  type="radio"
                  name="modalPaymentType"
                  value="advance"
                  checked={bulkPayment.paymentType === "advance"}
                  onChange={(e) =>
                    setBulkPayment({
                      ...bulkPayment,
                      paymentType: e.target.value,
                    })
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-[1vw] font-medium text-gray-700">
                  Advance Received
                </span>
              </label>
              <label className="flex items-center gap-[.75vw] cursor-pointer">
                <input
                  type="radio"
                  name="modalPaymentType"
                  value="po"
                  checked={bulkPayment.paymentType === "po"}
                  onChange={(e) =>
                    setBulkPayment({
                      ...bulkPayment,
                      paymentType: e.target.value,
                    })
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-[1vw] font-medium text-gray-700">PO</span>
              </label>
            </div>

            {/* Advance Payment Fields */}
            {bulkPayment.paymentType === "advance" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-[2vw]">
                  <div>
                    <label className="block text-[1vw] font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[1vw] font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[1vw] font-medium text-gray-700 mb-2">
                    Payment Remarks
                  </label>
                  <textarea
                    placeholder="Enter payment notes or reference..."
                    value={bulkPayment.remarks}
                    onChange={(e) =>
                      setBulkPayment({
                        ...bulkPayment,
                        remarks: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* PO Fields */}
            {bulkPayment.paymentType === "po" && (
              <div>
                <label className="block text-[1vw] font-medium text-gray-700 mb-2">
                  PO Details / Reference
                </label>
                <textarea
                  placeholder="Enter PO number, date, or other details..."
                  value={bulkPayment.remarks}
                  onChange={(e) =>
                    setBulkPayment({
                      ...bulkPayment,
                      remarks: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[1vw] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            )}

            {/* Payment Summary */}
            {bulkPayment.paymentType && (
              <div className="bg-white rounded p-4 mt-4 border border-gray-200">
                <h4 className="text-[1.05vw] font-semibold text-gray-700 mb-2">
                  Payment Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-[1vw]">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">
                      {bulkPayment.paymentType === "advance"
                        ? "Advance Payment"
                        : "Purchase Order"}
                    </span>
                  </div>
                  {bulkPayment.paymentType === "advance" &&
                    bulkPayment.amount && (
                      <div className="flex justify-between text-[1vw]">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-bold text-green-600">
                          ₹ {parseFloat(bulkPayment.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between text-[1vw] pt-2 border-t">
                    <span className="text-gray-600">Current Balance</span>
                    <span className="font-bold text-orange-600">
                      ₹ {calculateTotals().balance.toFixed(2)}
                    </span>
                  </div>
                  {bulkPayment.paymentType === "advance" &&
                    bulkPayment.amount && (
                      <div className="flex justify-between text-[1vw]">
                        <span className="text-gray-600">
                          Balance After Payment
                        </span>
                        <span className="font-bold text-blue-600">
                          ₹{" "}
                          {Math.max(
                            calculateTotals().balance -
                              parseFloat(bulkPayment.amount || 0),
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-300 bg-gray-50">
          <button
            onClick={() => {
              setShowPaymentModal(false);
              setBulkPayment({
                paymentType: null,
                method: "",
                amount: "",
                remarks: "",
              });
            }}
            className="px-[.95vw] py-[.5vw] text-[1vw] cursor-pointer border-2 border-gray-300 text-gray-700 bg-white rounded font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              addPaymentRecord();
              setShowPaymentModal(false);
            }}
            className="px-[.95vw] py-[.5vw] text-[1vw] cursor-pointer bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition-all shadow-md"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ScreenPrintingOrderDetails({
  existingOrder,
  existingOrders = [],
  onSubmit,
  onCancel,
  onBack,
}) {
  const [contact, setContact] = useState({
    company: "",
    contactName: "",
    phone: "",
    priority: "medium",
  });

  // ADD THIS NEW STATE after contact state
  const [orderDetails, setOrderDetails] = useState({
    orderNumber: "",
    estimatedNumber: "",
    estimatedValue: "",
  });

  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFromSuggestion, setIsFromSuggestion] = useState(false);
  const autocompleteRef = useRef(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Product size options mapping
  const PRODUCT_SIZE_OPTIONS = {
    Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
    "Round Square": ["450ml", "500ml"],
    Rectangle: ["500ml", "650ml", "750ml"],
    "Sweet Box": ["250gms", "500gms"],
    "Sweet Box TE": ["TE 250gms", "TE 500gms"],
  };

  const PRINTING_NAME_OPTIONS = [
    "Premium Screen Print",
    "Standard Labels",
    "Economy Print",
    "Luxury Series",
    "Festive Design",
    "Custom Print",
  ];

  const PRINTING_COLOR_OPTIONS = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Black",
    "White",
    "Orange",
    "Purple",
    "Pink",
    "Brown",
    "Gray",
    "Gold",
    "Silver",
    "Cyan",
    "Magenta",
    "Maroon",
    "Navy",
  ];

  const OLD_DESIGN_FILES = [
    { id: 1, name: "Design 1", path: design1PDF, type: "pdf" },
    { id: 2, name: "Design 2", path: design2PDF, type: "pdf" },
    { id: 3, name: "Design 3", path: design3PDF, type: "pdf" },
  ];

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  const [products, setProducts] = useState([
    {
      id: 1,
      // Remove orderNumber: generateOrderNumber(),
      productName: "",
      size: "",
      printingName: "",
      lidColor: "transparent",
      tubColor: "white",
      printType: "LID",
      printingColor1: "",
      printingColor2: "",
      printingColor3: "",
      lidLabelQty: "",
      lidProductionQty: "",
      lidStock: 0,
      tubLabelQty: "",
      tubProductionQty: "",
      tubStock: 0,
      budget: 0,
      estimatedNumber: 0,
      estimatedValue: 0,
      quantity: "",
      lidDesignFile: null,
      lidSelectedOldDesign: null,
      tubDesignFile: null,
      tubSelectedOldDesign: null,
      approvedDate: getTodayDate(),
      designSharedMail: false,
      designStatus: "pending",
      showLidColorPicker: false,
      showTubColorPicker: false,
      designType: "new",
      moveToScreenPrinting: false, // CHANGED from moveToPurchase
      isCollapsed: false,
    },
  ]);

  const [payment, setPayment] = useState({
    totalEstimated: "",
    remarks: "",
  });

  const [pdfPreviews, setPdfPreviews] = useState({});
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    type: null,
    path: null,
    name: null,
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkPayment, setBulkPayment] = useState({
    paymentType: null,
    method: "",
    amount: "",
    remarks: "",
  });
  const [paymentRecords, setPaymentRecords] = useState([]);

  // Extract unique companies from existing orders
  const getUniqueCompaniesFromOrders = () => {
    if (!existingOrders || existingOrders.length === 0) return [];

    const uniqueCompanies = new Map();

    existingOrders.forEach((order) => {
      if (order.contact && order.contact.company) {
        const companyKey = order.contact.company.toLowerCase();

        // Only add if not already exists
        if (!uniqueCompanies.has(companyKey)) {
          uniqueCompanies.set(companyKey, {
            company: order.contact.company,
            contactName: order.contact.contactName || "",
            phone: order.contact.phone || "",
          });
        }
      }
    });

    return Array.from(uniqueCompanies.values());
  };

  // Combine dummy data with existing orders data
  const getAllCompanies = () => {
    const existingCompanies = getUniqueCompaniesFromOrders();
    const allCompanies = [...DUMMY_COMPANIES, ...existingCompanies];

    // Remove duplicates based on company name
    const uniqueMap = new Map();
    allCompanies.forEach((company) => {
      const key = company.company.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, company);
      }
    });

    return Array.from(uniqueMap.values());
  };

  // Initialize with existing order data if editing
  useEffect(() => {
    if (existingOrder) {
      console.log("Loading existing order:", existingOrder); // Debug log

      // Set contact details - FIXED
      setContact({
        company: existingOrder.contact?.company || "",
        contactName: existingOrder.contact?.contactName || "",
        phone: existingOrder.contact?.phone || "",
        priority: existingOrder.contact?.priority || "medium",
      });

      // Set order details
      setOrderDetails({
        orderNumber: existingOrder.orderNumber || "",
        estimatedNumber: existingOrder.orderEstimate?.estimatedNumber || "",
        estimatedValue: existingOrder.orderEstimate?.estimatedValue || 0,
      });

      // Set products with proper structure
      if (existingOrder.products && Array.isArray(existingOrder.products)) {
        const mappedProducts = existingOrder.products.map((product, index) => ({
          id: product.id || index + 1,
          productName: product.productName || "",
          size: product.size || "",
          printingName: product.printingName || "",
          lidColor: product.lidColor || "transparent",
          tubColor: product.tubColor || "white",
          printType: product.printType || product.printType || "LID",
          printingColor1: product.printingColor1 || product.colors?.[0] || "",
          printingColor2: product.printingColor2 || product.colors?.[1] || "",
          printingColor3: product.printingColor3 || product.colors?.[2] || "",
          lidLabelQty: product.lidLabelQty || "",
          lidProductionQty: product.lidProductionQty || "",
          lidStock: product.lidStock || 0,
          tubLabelQty: product.tubLabelQty || "",
          tubProductionQty: product.tubProductionQty || "",
          tubStock: product.tubStock || 0,
          budget: product.budget || 0,
          estimatedNumber: product.estimatedNumber || 0,
          estimatedValue: product.estimatedValue || 0,
          quantity: product.quantity || product.quantity || "",
          lidDesignFile: product.lidDesignFile || null,
          lidSelectedOldDesign: product.lidSelectedOldDesign || null,
          tubDesignFile: product.tubDesignFile || null,
          tubSelectedOldDesign: product.tubSelectedOldDesign || null,
          approvedDate: product.approvedDate || getTodayDate(),
          designSharedMail: product.designSharedMail || false,
          designStatus: product.designStatus || "pending",
          showLidColorPicker: false,
          showTubColorPicker: false,
          designType: product.designType || "new",
          moveToScreenPrinting:
            product.moveToScreenPrinting || false,
          isCollapsed: index !== 0,
        }));
        setProducts(mappedProducts);
        console.log("Mapped products:", mappedProducts); // Debug log
      }

      // Set payment details
      setPayment(
        existingOrder.payment || {
          totalEstimated: "",
          remarks: "",
        }
      );

      // Set payment records
      setPaymentRecords(existingOrder.paymentRecords || []);
      console.log("Data loading complete"); // Debug log
    } else {
      // Generate order number for new orders
      setOrderDetails((prev) => ({
        ...prev,
        orderNumber: generateOrderNumber(),
      }));
    }
  }, [existingOrder]);

  // FIXED: Handle company name input - clear fields when empty
  const handleCompanyInput = (value) => {
    setContact({ ...contact, company: value });

    if (!value.trim()) {
      // Clear contact fields when company name is removed
      setContact({
        company: "",
        contactName: "",
        phone: "",
        priority: contact.priority,
      });
      setIsFromSuggestion(false);
      setFilteredCompanies([]);
      setShowSuggestions(false);
      return;
    }

    // ✅ UPDATED: Filter from all companies (dummy + existing)
    const allCompanies = getAllCompanies();
    const filtered = allCompanies.filter((company) =>
      company.company.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredCompanies(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (company) => {
    setContact({
      ...contact,
      company: company.company,
      contactName: company.contactName,
      phone: company.phone,
    });
    setIsFromSuggestion(true);
    setShowSuggestions(false);
  };

  // FIXED: Properly toggle design buttons
  useEffect(() => {
    // Reset isFromSuggestion when company is manually cleared
    if (contact.company.trim() === "" && contact.contactName.trim() === "") {
      setIsFromSuggestion(false);
    }
  }, [contact.company, contact.contactName]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update product field
  const updateProduct = (id, field, value) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // UPDATED: Handle quantities for LID & TUB separately
  const updateQuantity = (id, type, field, value) => {
    setProducts(
      products.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [`${type}${field}`]: value };

          // Calculate stock for the specific type
          const calculatedStock =
            (parseInt(updated[`${type}LabelQty`]) || 0) -
            (parseInt(updated[`${type}ProductionQty`]) || 0);
          updated[`${type}Stock`] = Math.max(calculatedStock, 0);

          return updated;
        }
        return p;
      })
    );
  };

  // UPDATED: Validate duplicate products
  const isDuplicateProduct = (productName, size, imlType) => {
    return products.some(
      (p) =>
        p.productName === productName &&
        p.size === size &&
        p.imlType === imlType
    );
  };

  // UPDATED: Add new product with collapse feature
  const addProduct = () => {
    // Collapse all existing products
    setProducts(products.map((p) => ({ ...p, isCollapsed: true })));

    const newProduct = {
      id: products.length + 1,
      // orderNumber: generateOrderNumber(), // REMOVE THIS - no separate order number for products
      productName: "",
      size: "",
      printingName: "",
      lidColor: "transparent",
      tubColor: "white",
      printType: "LID",
      printingColor1: "",
      printingColor2: "",
      printingColor3: "",
      lidLabelQty: "",
      lidProductionQty: "",
      lidStock: 0,
      tubLabelQty: "",
      tubProductionQty: "",
      tubStock: 0,
      budget: 0,
      estimatedNumber: 0,
      estimatedValue: 0,
      quantity: "",
      lidDesignFile: null,
      lidSelectedOldDesign: null,
      tubDesignFile: null,
      tubSelectedOldDesign: null,
      approvedDate: getTodayDate(),
      designSharedMail: false,
      designStatus: "pending",
      showLidColorPicker: false,
      showTubColorPicker: false,
      designType: "new",
      moveToScreenPrinting: false, // CHANGED from moveToPurchase
      isCollapsed: false,
    };
    setProducts([...products, newProduct]);
  };

  // Remove product
  const removeProduct = (id) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // Toggle collapse state
  const toggleCollapse = (id) => {
    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p
      )
    );
  };

  const submitForm = () => {
    const orderData = {
      contact,
      orderNumber: orderDetails.orderNumber, // ADD THIS
      orderEstimate: {
        // ADD THIS
        estimatedNumber: orderDetails.estimatedNumber,
        estimatedValue: parseFloat(orderDetails.estimatedValue) || 0,
      },
      products,
      payment,
      paymentRecords,
      status: existingOrder?.status || "pending",
    };

    if (onSubmit) {
      onSubmit(orderData);
    } else {
      console.log(orderData);
      alert("Form submitted successfully!");
    }
  };

  // Convert RGBA to CSS string
  const rgbaToString = (rgba) => {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  };

  // Generate PDF thumbnail functions (keeping existing implementation)
  const generatePdfThumbnail = async (file, previewId) => {
    try {
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        try {
          const typedArray = new Uint8Array(this.result);
          const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          const thumbnailUrl = canvas.toDataURL("image/png");

          setPdfPreviews((prev) => ({
            ...prev,
            [previewId]: thumbnailUrl,
          }));
        } catch (error) {
          console.error("Error rendering PDF:", error);
          setPdfPreviews((prev) => ({
            ...prev,
            [previewId]: "error",
          }));
        }
      };

      fileReader.onerror = function (error) {
        console.error("FileReader error:", error);
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error generating PDF thumbnail:", error);
    }
  };

  const generatePdfThumbnailFromUrl = async (pdfUrl, previewId) => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();

      const fileReader = new FileReader();

      fileReader.onload = async function () {
        try {
          const typedArray = new Uint8Array(this.result);
          const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          const thumbnailUrl = canvas.toDataURL("image/png");

          setPdfPreviews((prev) => ({
            ...prev,
            [previewId]: thumbnailUrl,
          }));
        } catch (error) {
          console.error("Error rendering PDF:", error);
          setPdfPreviews((prev) => ({
            ...prev,
            [previewId]: "error",
          }));
        }
      };

      fileReader.onerror = function (error) {
        console.error("FileReader error:", error);
      };

      fileReader.readAsArrayBuffer(blob);
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };

  useEffect(() => {
    const pdfDesigns = OLD_DESIGN_FILES.filter(
      (design) => design.type === "pdf"
    );

    pdfDesigns.forEach((design) => {
      if (!pdfPreviews[`old-${design.id}`]) {
        generatePdfThumbnailFromUrl(design.path, `old-${design.id}`);
      }
    });
  }, []);

  // Preview Modal Component
  const PreviewModal = () => {
    if (!previewModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg overflow-hidden max-w-6xl w-full max-h-90vh flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
            <h2 className="text-[1.25vw] font-semibold text-gray-800">
              Preview: {previewModal.name}
            </h2>
            <button
              onClick={() =>
                setPreviewModal({
                  isOpen: false,
                  type: null,
                  path: null,
                  name: null,
                })
              }
              className="text-gray-500 hover:text-gray-800 text-2vw font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {previewModal.type === "pdf" ? (
              <iframe
                src={`${previewModal.path}#toolbar=1&navpanes=0`}
                title={previewModal.name}
                className="w-full h-full border-0"
                style={{ minHeight: "60vh" }}
              />
            ) : (
              <img
                src={previewModal.path}
                alt={previewModal.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-gray-300 bg-gray-50">
            <button
              onClick={() =>
                setPreviewModal({
                  isOpen: false,
                  type: null,
                  path: null,
                  name: null,
                })
              }
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-[0.4vw] cursor-pointer hover:bg-gray-400 hover:text-white font-medium text-0.9vw"
            >
              Close
            </button>
            <a
              href={previewModal.path}
              download={previewModal.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-[0.4vw] hover:bg-blue-700 font-medium text-0.9vw"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Payment functions
  const hasPaymentRecord = (productId) => {
    return paymentRecords.some((record) =>
      record.productIds.includes(productId)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const unpaidProducts = products
        .filter((p) => !hasPaymentRecord(p.id))
        .map((p) => p.id);
      setSelectedProducts(unpaidProducts);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleProductSelect = (productId, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const addPaymentRecord = () => {
    if (!bulkPayment.paymentType) {
      alert("Please select payment type (Advance or PO)");
      return;
    }

    if (bulkPayment.paymentType === "advance") {
      if (!bulkPayment.method || !bulkPayment.amount) {
        alert("Please fill in payment method and amount for Advance payment");
        return;
      }
    }

    const newRecord = {
      id: Date.now(),
      productIds: [...selectedProducts],
      paymentType: bulkPayment.paymentType,
      method: bulkPayment.method,
      amount: bulkPayment.amount,
      remarks: bulkPayment.remarks,
      timestamp: new Date().toISOString(),
    };

    setPaymentRecords([...paymentRecords, newRecord]);

    setSelectedProducts([]);
    setBulkPayment({
      paymentType: null,
      method: "",
      amount: "",
      remarks: "",
    });

    alert("Payment record added successfully!");
  };

  const removePaymentRecord = (recordId) => {
    if (confirm("Are you sure you want to remove this payment record?")) {
      setPaymentRecords(paymentRecords.filter((r) => r.id !== recordId));
    }
  };

  const getProductPayment = (productId) => {
    return paymentRecords.find((record) =>
      record.productIds.includes(productId)
    );
  };

  const calculateTotals = () => {
    // Use orderDetails.estimatedValue as the total budget
    const totalEstimated = parseFloat(orderDetails.estimatedValue || 0);

    const totalPaid = paymentRecords
      .filter((r) => r.paymentType === "advance")
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const productsWithPayment = new Set(
      paymentRecords.flatMap((r) => r.productIds)
    ).size;
    const productsWithoutPayment = products.length - productsWithPayment;

    return {
      totalEstimated, // Use estimated value
      totalPaid,
      productsWithPayment,
      productsWithoutPayment,
      balance: Math.max(totalEstimated - totalPaid, 0),
    };
  };

  // UPDATED: Calculate total estimate for selected products
  const calculateSelectedTotal = () => {
    return selectedProducts.reduce((sum, id) => {
      const product = products.find((p) => p.id === id);
      return sum + (parseFloat(product?.budget) || 0);
    }, 0);
  };

  const handleBack = () => {
    if (onBack) onBack();
  };


  return (
    <div className="bg-gray-50 p-0">
      <div className="max-w-[90vw] mx-auto bg-white rounded-[0.8vw] shadow-sm pb-[.75vw]">
        {/* Header */}
        <div className="flex justify-between items-baseline p-[1vw_1.5vw] border-b border-gray-200">
          <button
            className="flex gap-[.5vw] items-center cursor-pointer"
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
          <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
            Orders/IML Details
          </h1>
        </div>

        <div className="px-[1.5vw] max-h-[65vh] overflow-auto">
          {/* Contact Details with Priority */}
          <Section title="Contact Details">
            <div className="grid grid-cols-5 gap-[1.5vw]">
              {/* Company Name with Autocomplete */}
              <div className="relative" ref={autocompleteRef}>
                <Input
                  label="Company Name"
                  required
                  placeholder="Enter Company Name"
                  value={contact.company}
                  onChange={(e) => handleCompanyInput(e.target.value)}
                />
                {showSuggestions && filteredCompanies.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[15vw] overflow-y-auto">
                    {filteredCompanies.map((company, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(company)}
                        className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-[0.85vw] font-medium text-gray-800">
                          {company.company}
                        </p>
                        <p className="text-[0.75vw] text-gray-500">
                          {company.contactName} • {company.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="Contact Name"
                required
                placeholder="Enter Contact Name"
                value={contact.contactName}
                onChange={(e) =>
                  setContact({ ...contact, contactName: e.target.value })
                }
              />
              <Input
                label="Contact Number"
                required
                placeholder="Enter Contact Number"
                value={contact.phone}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
              />

              {/* NEW: Priority Field */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Priority
                </label>
                <select
                  value={contact.priority}
                  onChange={(e) =>
                    setContact({ ...contact, priority: e.target.value })
                  }
                  className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="low">Low (10 - 15 days)</option>
                  <option value="medium">Medium (7 - 10 days)</option>
                  <option value="high">High (5 - 7 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderDetails.orderNumber}
                  disabled
                  className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-gray-100 rounded-[0.5vw] text-[0.85vw] outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-[1.5vw] mt-[1vw]">
              {/* Order Number - Read Only */}

              {/* Estimated Number */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Estimated Number
                </label>
                <input
                  type="text"
                  value={orderDetails.estimatedNumber}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      estimatedNumber: e.target.value,
                    })
                  }
                  placeholder="Enter estimated number"
                  className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Estimated Value */}
              <div>
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Estimated Value
                </label>
                <input
                  type="number"
                  value={orderDetails.estimatedValue}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      estimatedValue: e.target.value,
                    })
                  }
                  placeholder="Enter estimated value"
                  className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </Section>

          {/* Products List */}
          {products.map((product, index) => (
            <div key={product.id} className="mt-[1vw]">
              <Section
                title={
                  <div className="flex justify-between items-center w-full">
                    <span>
                      {product.isCollapsed &&
                      product.productName &&
                      product.size
                        ? `Order ${index + 1}: ${product.productName} - ${
                            product.size
                          }`
                        : `Order & Design Details ${index + 1}`}
                    </span>
                    <svg
                      className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 ${
                        product.isCollapsed ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                }
                onClick={() => toggleCollapse(product.id)}
                isCollapsed={product.isCollapsed}
              >
                {!product.isCollapsed && (
                  <>
                    {/* Product Basic Details Section */}
                    <div className="bg-white rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mb-[1vw]">
                      <h3 className="text-[1vw] font-semibold text-blue-900 mb-[1vw]">
                        Product Basic Details
                      </h3>

                      <div className="grid grid-cols-4 gap-[1.5vw]">
                        <Select
                          label="Product Name"
                          required
                          placeholder="Select Product"
                          options={[
                            "Round",
                            "Round Square",
                            "Rectangle",
                            "Sweet Box",
                            "Sweet Box TE",
                          ]}
                          value={product.productName}
                          onChange={(e) => {
                            setProducts(
                              products.map((p) =>
                                p.id === product.id
                                  ? {
                                      ...p,
                                      productName: e.target.value,
                                      size: "",
                                    }
                                  : p
                              )
                            );
                          }}
                        />

                        <Select
                          label="Size"
                          required
                          placeholder="Select Size"
                          options={
                            product.productName
                              ? PRODUCT_SIZE_OPTIONS[product.productName] || []
                              : []
                          }
                          value={product.size}
                          onChange={(e) => {
                            const newSize = e.target.value;
                            // Check for duplicates
                            if (
                              isDuplicateProduct(
                                product.productName,
                                newSize,
                                product.printType
                              )
                            ) {
                              alert(
                                `This product combination (${product.productName} - ${newSize} - ${product.printType}) already exists!`
                              );
                              return;
                            }
                            updateProduct(product.id, "size", newSize);
                          }}
                          disabled={!product.productName}
                        />

                        <Select
                          label="Printing Color Type"
                          required
                          placeholder="Select Type"
                          options={["LID", "TUB", "LID & TUB"]}
                          value={product.printType}
                          onChange={(e) => {
                            const newImlType = e.target.value;
                            // Check for duplicates
                            if (
                              product.productName &&
                              product.size &&
                              isDuplicateProduct(
                                product.productName,
                                product.size,
                                newImlType
                              )
                            ) {
                              alert(
                                `This product combination (${product.productName} - ${product.size} - ${newImlType}) already exists!`
                              );
                              return;
                            }
                            setProducts(
                              products.map((p) =>
                                p.id === product.id
                                  ? {
                                      ...p,
                                      printType: newImlType,
                                      showLidColorPicker: false,
                                      showTubColorPicker: false,
                                    }
                                  : p
                              )
                            );
                          }}
                        />

                        <div>
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            Printing Name
                          </label>
                          <AutocompleteInput
                            value={product.printingName}
                            onChange={(value) =>
                              updateProduct(product.id, "printingName", value)
                            }
                            options={PRINTING_NAME_OPTIONS}
                            placeholder="Enter or select printing name"
                          />
                        </div>
                      </div>

                      {/* Color Picker Section */}
                      <div className="grid grid-cols-4 gap-[1.5vw] mt-[1vw]">
                        <Input
                          label="LID Color"
                          required
                          placeholder=""
                          value={product.lidColor}
                          onChange={(e) => {
                            updateProduct(
                              product.id,
                              "lidColor",
                              e.target.value
                            );
                          }}
                          disabled={false}
                        />

                        <Input
                          label="TUB Color"
                          required
                          placeholder=""
                          value={product.tubColor}
                          onChange={(e) => {
                            updateProduct(
                              product.id,
                              "tubColor",
                              e.target.value
                            );
                          }}
                          disabled={false}
                        />

                        <Input
                          label="Order Quantity"
                          required
                          placeholder=""
                          value={product.quantity}
                          onChange={(e) => {
                            updateProduct(
                              product.id,
                              "quantity",
                              e.target.value
                            );
                          }}
                          disabled={false}
                        />
                      </div>

                      <div className=" mt-[1vw] mb-[0.5vw]">
                        <p className="text-[0.9vw] font-medium text-blue-900">
                          Printing Color
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-[1.5vw]">
                        <div>
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            Color 1
                          </label>
                          <AutocompleteInput
                            value={product.printingColor1}
                            onChange={(value) =>
                              updateProduct(product.id, "printingColor1", value)
                            }
                            options={PRINTING_COLOR_OPTIONS}
                            placeholder="Select color 1"
                          />
                        </div>

                        <div>
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            Color 2
                          </label>
                          <AutocompleteInput
                            value={product.printingColor2}
                            onChange={(value) =>
                              updateProduct(product.id, "printingColor2", value)
                            }
                            options={PRINTING_COLOR_OPTIONS}
                            placeholder="Select color 2"
                          />
                        </div>

                        <div>
                          <label className="block text-0.85vw font-medium text-gray-700 mb-0.5vw">
                            Color 3
                          </label>
                          <AutocompleteInput
                            value={product.printingColor3}
                            onChange={(value) =>
                              updateProduct(product.id, "printingColor3", value)
                            }
                            options={PRINTING_COLOR_OPTIONS}
                            placeholder="Select color 3"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Design Selection Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw] mb-[0] relative">
                      {/* Design Type Toggle - Conditional Display */}
                      <div className="flex justify-end gap-[0.8vw] mb-[1vw] absolute top-[1vw] right-[1vw]">
                        {isFromSuggestion && (
                          <button
                            onClick={() =>
                              updateProduct(
                                product.id,
                                "designType",
                                "existing"
                              )
                            }
                            className={`px-[2vw] py-[0.6vw] rounded-[0.4vw] cursor-pointer text-[0.85vw] font-medium transition-all duration-200 ${
                              product.designType === "existing"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            Existing Design
                          </button>
                        )}
                        <button
                          onClick={() =>
                            updateProduct(product.id, "designType", "new")
                          }
                          className={`px-[2vw] py-[0.6vw] rounded-[0.4vw] cursor-pointer text-[0.85vw] font-medium transition-all duration-200 ${
                            product.designType === "new"
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          New Design
                        </button>
                      </div>
                      <h3 className="text-[1vw] font-semibold text-purple-900 mb-[1vw]">
                        Design Selection
                      </h3>

                      {product.designType === "existing" ? (
                        <div>
                          {/* For LID & TUB - Show two separate design selections */}
                          {product.printType === "LID & TUB" ? (
                            <div className="space-y-1.5vw">
                              {/* LID Design Selection */}
                              <div className="grid grid-cols-2 gap-[1vw]">
                                <div>
                                  <div>
                                    <label className="block text-[0.9vw] font-medium text-purple-700 mb-[0.75vw]">
                                      Select LID Design{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="border-2 border-dashed border-purple-300 rounded-[0.6vw] p-[1vw] bg-white">
                                      <div className="grid grid-cols-3 gap-[1.5vw]">
                                        {OLD_DESIGN_FILES.map((file) => (
                                          <div
                                            key={file.id}
                                            className="text-center"
                                            onClick={() =>
                                              updateProduct(
                                                product.id,
                                                "lidSelectedOldDesign",
                                                file.id
                                              )
                                            }
                                          >
                                            <div
                                              className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                                product.lidSelectedOldDesign ===
                                                file.id
                                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                                                  : "border-gray-300"
                                              } overflow-hidden cursor-pointer hover:border-blue-400 transition-all`}
                                            >
                                              {file.type === "pdf" ? (
                                                pdfPreviews[
                                                  `old-${file.id}`
                                                ] ? (
                                                  <img
                                                    src={
                                                      pdfPreviews[
                                                        `old-${file.id}`
                                                      ]
                                                    }
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                  />
                                                ) : (
                                                  <div className="flex flex-col items-center">
                                                    <svg
                                                      className="w-[3vw] h-[3vw] text-red-500"
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
                                                    <span className="text-[0.6vw] text-gray-500 mt-1">
                                                      Loading...
                                                    </span>
                                                  </div>
                                                )
                                              ) : (
                                                <img
                                                  src={file.path}
                                                  alt={file.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              )}
                                            </div>
                                            <label className="flex items-center justify-center gap-[0.4vw] text-[0.75vw] text-gray-500 cursor-pointer">
                                              <input
                                                type="radio"
                                                name={`lid-design-${product.id}`}
                                                checked={
                                                  product.lidSelectedOldDesign ===
                                                  file.id
                                                }
                                                onChange={() =>
                                                  updateProduct(
                                                    product.id,
                                                    "lidSelectedOldDesign",
                                                    file.id
                                                  )
                                                }
                                                onClick={(e) => {
                                                  if (
                                                    file.type === "pdf" &&
                                                    !pdfPreviews[
                                                      `old-${file.id}`
                                                    ]
                                                  ) {
                                                    generatePdfThumbnailFromUrl(
                                                      file.path,
                                                      `old-${file.id}`
                                                    );
                                                  }
                                                }}
                                                className="w-[0.9vw] h-[0.9vw] cursor-pointer"
                                              />
                                              <span className="text-[0.75vw] font-medium">
                                                {file.name}
                                              </span>
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="">
                                  {/* LID Design Preview */}
                                  {product.lidSelectedOldDesign && (
                                    <div className="h-[85.5%]">
                                      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                                        LID Design Preview
                                      </label>
                                      <div className="border-2 relative border-blue-300 rounded-[0.6vw] p-1vw bg-blue-50 flex items-center justify-center h-full">
                                        {(() => {
                                          const selectedFile =
                                            OLD_DESIGN_FILES.find(
                                              (f) =>
                                                f.id ===
                                                product.lidSelectedOldDesign
                                            );
                                          return (
                                            <div className="text-center w-full">
                                              <div className="w-full h-auto max-h-[12vw] mx-auto rounded-[0.6vw] flex items-center justify-center mb-[1vw] overflow-hidden">
                                                {selectedFile.type === "pdf" ? (
                                                  pdfPreviews[
                                                    `old-${selectedFile.id}`
                                                  ] ? (
                                                    <img
                                                      src={
                                                        pdfPreviews[
                                                          `old-${selectedFile.id}`
                                                        ]
                                                      }
                                                      alt={selectedFile.name}
                                                      className="w-full h-auto max-h-[4.5vw] object-contain"
                                                    />
                                                  ) : (
                                                    <div className="flex flex-col items-center py-4">
                                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                                      <p className="text-gray-500 text-[0.8vw]">
                                                        Loading PDF preview...
                                                      </p>
                                                    </div>
                                                  )
                                                ) : (
                                                  <img
                                                    src={selectedFile.path}
                                                    alt={selectedFile.name}
                                                    className="w-full h-auto max-h-[12vw] object-contain"
                                                  />
                                                )}
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setPreviewModal({
                                                    isOpen: true,
                                                    type: selectedFile.type,
                                                    path: selectedFile.path,
                                                    name: selectedFile.name,
                                                  });
                                                }}
                                                className="px-[1vw] py-[0.4vw] cursor-pointer bg-blue-600 text-white rounded-[0.4vw] hover:bg-blue-700 font-medium text-[0.75vw] transition-all duration-200"
                                              >
                                                Preview Full
                                              </button>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* TUB Design Selection - Optional */}
                              <div className="grid grid-cols-2 gap-[1vw] mt-[1vw]">
                                <div>
                                  <label className="block text-[0.9vw] font-medium text-purple-700 mb-[0.75vw]">
                                    Select TUB Design (Optional)
                                  </label>
                                  <div className="border-2 border-dashed border-purple-300 rounded-[0.6vw] p-[1vw] bg-white">
                                    <div className="grid grid-cols-3 gap-[1.5vw]">
                                      {OLD_DESIGN_FILES.map((file) => (
                                        <div
                                          key={file.id}
                                          className="text-center"
                                          onClick={() =>
                                            updateProduct(
                                              product.id,
                                              "tubSelectedOldDesign",
                                              file.id
                                            )
                                          }
                                        >
                                          <div
                                            className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                              product.tubSelectedOldDesign ===
                                              file.id
                                                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300"
                                                : "border-gray-300"
                                            } overflow-hidden cursor-pointer hover:border-purple-400 transition-all`}
                                          >
                                            {file.type === "pdf" ? (
                                              pdfPreviews[`old-${file.id}`] ? (
                                                <img
                                                  src={
                                                    pdfPreviews[
                                                      `old-${file.id}`
                                                    ]
                                                  }
                                                  alt={file.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex flex-col items-center">
                                                  <svg
                                                    className="w-[3vw] h-[3vw] text-red-500"
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
                                                  <span className="text-[0.6vw] text-gray-500 mt-1">
                                                    Loading...
                                                  </span>
                                                </div>
                                              )
                                            ) : (
                                              <img
                                                src={file.path}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                              />
                                            )}
                                          </div>
                                          <label className="flex items-center justify-center gap-[0.4vw] text-[0.75vw] text-gray-500 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`tub-design-${product.id}`}
                                              checked={
                                                product.tubSelectedOldDesign ===
                                                file.id
                                              }
                                              onChange={() =>
                                                updateProduct(
                                                  product.id,
                                                  "tubSelectedOldDesign",
                                                  file.id
                                                )
                                              }
                                              onClick={(e) => {
                                                if (
                                                  file.type === "pdf" &&
                                                  !pdfPreviews[`old-${file.id}`]
                                                ) {
                                                  generatePdfThumbnailFromUrl(
                                                    file.path,
                                                    `old-${file.id}`
                                                  );
                                                }
                                              }}
                                              className="w-[0.9vw] h-[0.9vw] cursor-pointer"
                                            />
                                            <span className="text-[0.75vw] font-medium">
                                              {file.name}
                                            </span>
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="h-full">
                                  {/* TUB Design Preview */}
                                  {product.tubSelectedOldDesign && (
                                    <div className="h-full">
                                      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.75vw]">
                                        TUB Design Preview
                                      </label>
                                      <div className="border-2 relative border-purple-300 rounded-[0.6vw] p-[1vw] bg-purple-50 flex items-center justify-center h-[84%]">
                                        {(() => {
                                          const selectedFile =
                                            OLD_DESIGN_FILES.find(
                                              (f) =>
                                                f.id ===
                                                product.tubSelectedOldDesign
                                            );
                                          return (
                                            <div className="text-center w-full h-full">
                                              <div className="w-full h-auto max-h-[12vw] mx-auto rounded-[0.6vw] flex items-center justify-center mb-[1vw] overflow-hidden">
                                                {selectedFile.type === "pdf" ? (
                                                  pdfPreviews[
                                                    `old-${selectedFile.id}`
                                                  ] ? (
                                                    <img
                                                      src={
                                                        pdfPreviews[
                                                          `old-${selectedFile.id}`
                                                        ]
                                                      }
                                                      alt={selectedFile.name}
                                                      className="w-full h-auto max-h-[4.5vw] object-contain"
                                                    />
                                                  ) : (
                                                    <div className="flex flex-col items-center py-4">
                                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                                                      <p className="text-gray-500 text-[0.8vw]">
                                                        Loading PDF preview...
                                                      </p>
                                                    </div>
                                                  )
                                                ) : (
                                                  <img
                                                    src={selectedFile.path}
                                                    alt={selectedFile.name}
                                                    className="w-full h-auto max-h-[12vw] object-contain"
                                                  />
                                                )}
                                              </div>
                                              <button
                                                onClick={() => {
                                                  setPreviewModal({
                                                    isOpen: true,
                                                    type: selectedFile.type,
                                                    path: selectedFile.path,
                                                    name: selectedFile.name,
                                                  });
                                                }}
                                                className="px-[1vw] py-[0.4vw] cursor-pointer bg-purple-600 text-white rounded-[0.4vw] hover:bg-purple-700 font-medium text-[0.75vw] transition-all duration-200"
                                              >
                                                Preview Full
                                              </button>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Single Design Selection for LID or TUB only */
                            <div className="grid grid-cols-2 gap-[1vw]">
                              <div>
                                <label className="block text-[0.9vw] font-medium text-purple-700 mb-[0.75vw]">
                                  Select Design{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-purple-300 rounded-[0.6vw] p-[1vw] bg-white">
                                  <div className="grid grid-cols-3 gap-[1.5vw]">
                                    {OLD_DESIGN_FILES.map((file) => (
                                      <div
                                        key={file.id}
                                        className="text-center"
                                        onClick={() =>
                                          updateProduct(
                                            product.id,
                                            "lidSelectedOldDesign",
                                            file.id
                                          )
                                        }
                                      >
                                        <div
                                          className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                            product.lidSelectedOldDesign ===
                                            file.id
                                              ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300"
                                              : "border-gray-300"
                                          } overflow-hidden cursor-pointer hover:border-purple-400 transition-all`}
                                        >
                                          {/* Image/PDF Preview */}
                                          {file.type === "pdf" ? (
                                            pdfPreviews[`old-${file.id}`] ? (
                                              <img
                                                src={
                                                  pdfPreviews[`old-${file.id}`]
                                                }
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex flex-col items-center">
                                                <svg
                                                  className="w-[3vw] h-[3vw] text-red-500"
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
                                                <span className="text-[0.6vw] text-gray-500 mt-1">
                                                  Loading...
                                                </span>
                                              </div>
                                            )
                                          ) : (
                                            <img
                                              src={file.path}
                                              alt={file.name}
                                              className="w-full h-full object-cover"
                                            />
                                          )}
                                        </div>
                                        <label className="flex items-center justify-center gap-[0.4vw] text-[0.75vw] text-gray-500 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`design-${product.id}`}
                                            checked={
                                              product.lidSelectedOldDesign ===
                                              file.id
                                            }
                                            onChange={() =>
                                              updateProduct(
                                                product.id,
                                                "lidSelectedOldDesign",
                                                file.id
                                              )
                                            }
                                            onClick={(e) => {
                                              if (
                                                file.type === "pdf" &&
                                                !pdfPreviews[`old-${file.id}`]
                                              ) {
                                                generatePdfThumbnailFromUrl(
                                                  file.path,
                                                  `old-${file.id}`
                                                );
                                              }
                                            }}
                                            className="w-[0.9vw] h-[0.9vw] cursor-pointer"
                                          />
                                          <span className="text-[0.75vw] font-medium">
                                            {file.name}
                                          </span>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                {/* Design Preview */}
                                {product.lidSelectedOldDesign && (
                                  <div>
                                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                                      Selected Design Preview
                                    </label>
                                    <div className="border-2 relative border-purple-300 rounded-[0.6vw] p-[1vw] bg-purple-50 flex items-center justify-center">
                                      {(() => {
                                        const selectedFile =
                                          OLD_DESIGN_FILES.find(
                                            (f) =>
                                              f.id ===
                                              product.lidSelectedOldDesign
                                          );
                                        if (!selectedFile) return null;

                                        return (
                                          <div className="text-center w-full">
                                            <div className="w-full h-auto min-h-[12.15vh] max-h-[12.15vh] mx-auto rounded-[0.6vw] flex items-center justify-center mb-[1vw] overflow-hidden">
                                              {selectedFile.type === "pdf" ? (
                                                pdfPreviews[
                                                  `old-${selectedFile.id}`
                                                ] ? (
                                                  <img
                                                    src={
                                                      pdfPreviews[
                                                        `old-${selectedFile.id}`
                                                      ]
                                                    }
                                                    alt={selectedFile.name}
                                                    className="w-full h-auto min-h-[12vh] max-h-[15vh] object-contain"
                                                  />
                                                ) : (
                                                  <div className="flex flex-col items-center py-4">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                                                    <p className="text-gray-500 text-[0.8vw]">
                                                      Loading PDF preview...
                                                    </p>
                                                  </div>
                                                )
                                              ) : (
                                                <img
                                                  src={selectedFile.path}
                                                  alt={selectedFile.name}
                                                  className="w-full h-auto max-h-[12vw] object-contain"
                                                />
                                              )}
                                            </div>
                                            <div className="flex justify-center align-center gap-[0.5vw]">
                                              <p className="text-[0.85vw] text-gray-700 font-medium">
                                                {selectedFile.name}
                                              </p>
                                              <span
                                                className={`inline-block px-3 py-1 rounded text-[0.75vw] font-medium ${
                                                  selectedFile.type === "pdf"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-blue-100 text-blue-700"
                                                }`}
                                              >
                                                {selectedFile.type === "pdf"
                                                  ? "PDF"
                                                  : "Image"}
                                              </span>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setPreviewModal({
                                                  isOpen: true,
                                                  type: selectedFile.type,
                                                  path: selectedFile.path,
                                                  name: selectedFile.name,
                                                });
                                              }}
                                              className="px-[1vw] py-[0.4vw] cursor-pointer bg-purple-600 text-white rounded-[0.4vw] hover:bg-purple-700 font-medium text-[0.85vw] transition-all duration-200 shadow-sm hover:shadow-md absolute right-[2vw] top-[1.5vw]"
                                            >
                                              <svg
                                                className="w-[1vw] h-[1vw] inline-block mr-[0.3vw]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                              </svg>
                                              Preview Full
                                            </button>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* NEW DESIGN SECTION */
                        <div>
                          <div className="mb-[1.25vw]">
                            <label className="flex items-center gap-[0.6vw] text-[0.85vw] text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={product.designSharedMail}
                                onChange={(e) =>
                                  updateProduct(
                                    product.id,
                                    "designSharedMail",
                                    e.target.checked
                                  )
                                }
                                className="w-[1.1vw] h-[1.1vw] cursor-pointer"
                              />
                              <span className="text-[0.85vw] font-medium">
                                Design Shared In Mail On Last Meeting
                              </span>
                            </label>
                          </div>

                          <div className="grid grid-cols-3 gap-[2vw]">
                            <div>
                              <Select
                                label="Design Status"
                                required
                                placeholder="Select Status"
                                options={["Pending", "Approved"]}
                                value={
                                  product.designStatus === "pending"
                                    ? "Pending"
                                    : product.designStatus === "approved"
                                    ? "Approved"
                                    : ""
                                }
                                onChange={(e) => {
                                  const newValue = e.target.value.toLowerCase();
                                  updateProduct(
                                    product.id,
                                    "designStatus",
                                    newValue
                                  );
                                }}
                              />
                            </div>

                            {product.designStatus === "approved" && (
                              <div>
                                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                                  Approve Date{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={product.approvedDate}
                                  onChange={(e) =>
                                    updateProduct(
                                      product.id,
                                      "approvedDate",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                              </div>
                            )}
                          </div>

                          {/* Design Upload Section - Conditional based on imlType */}
                          {product.designStatus === "approved" && (
                            <div className="mt-[1vw]">
                              {product.printType === "LID & TUB" ? (
                                // Show two separate upload sections for LID & TUB
                                <div className="space-y-[1.5vw]">
                                  {/* LID Design Upload */}
                                  <div>
                                    <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
                                      Upload LID Design File{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-[2vw]">
                                      <div>
                                        <FileUploadBox
                                          file={product.lidDesignFile}
                                          onFileChange={(file) => {
                                            updateProduct(
                                              product.id,
                                              "lidDesignFile",
                                              file
                                            );
                                            if (
                                              file &&
                                              file.type === "application/pdf"
                                            ) {
                                              generatePdfThumbnail(
                                                file,
                                                `${product.id}-lid`
                                              );
                                            }
                                          }}
                                          productId={`${product.id}-lid`}
                                          small
                                        />
                                      </div>
                                      <div>
                                        {product.lidDesignFile && (
                                          <DesignPreview
                                            file={product.lidDesignFile}
                                            productId={`${product.id}-lid`}
                                            pdfPreviews={pdfPreviews}
                                            setPreviewModal={setPreviewModal}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* TUB Design Upload - Optional */}
                                  <div>
                                    <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
                                      Upload TUB Design File (Optional)
                                    </label>
                                    <div className="grid grid-cols-2 gap-[2vw]">
                                      <div>
                                        <FileUploadBox
                                          file={product.tubDesignFile}
                                          onFileChange={(file) => {
                                            updateProduct(
                                              product.id,
                                              "tubDesignFile",
                                              file
                                            );
                                            if (
                                              file &&
                                              file.type === "application/pdf"
                                            ) {
                                              generatePdfThumbnail(
                                                file,
                                                `${product.id}-tub`
                                              );
                                            }
                                          }}
                                          productId={`${product.id}-tub`}
                                          small
                                        />
                                      </div>
                                      <div>
                                        {product.tubDesignFile && (
                                          <DesignPreview
                                            file={product.tubDesignFile}
                                            productId={`${product.id}-tub`}
                                            pdfPreviews={pdfPreviews}
                                            setPreviewModal={setPreviewModal}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Show single upload for LID or TUB only
                                <div>
                                  <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
                                    Upload Design File{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <div className="grid grid-cols-2 gap-[2vw]">
                                    <div>
                                      <FileUploadBox
                                        file={product.lidDesignFile}
                                        onFileChange={(file) => {
                                          updateProduct(
                                            product.id,
                                            "lidDesignFile",
                                            file
                                          );
                                          if (
                                            file &&
                                            file.type === "application/pdf"
                                          ) {
                                            generatePdfThumbnail(
                                              file,
                                              product.id
                                            );
                                          }
                                        }}
                                        productId={product.id}
                                        small
                                      />
                                    </div>
                                    <div>
                                      {product.lidDesignFile && (
                                        <DesignPreview
                                          file={product.lidDesignFile}
                                          productId={product.id}
                                          pdfPreviews={pdfPreviews}
                                          setPreviewModal={setPreviewModal}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {products.length > 1 && (
                      <div className="flex justify-end mt-[0.75vw]">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="px-[2vw] py-[0.7vw] border border-red-500 text-red-500 bg-white rounded-[0.5vw] text-[0.85vw] cursor-pointer transition-all duration-200 hover:bg-red-50"
                        >
                          Remove Product
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Section>
            </div>
          ))}

          <div className="flex justify-end mt-[1vw]">
            <button
              onClick={addProduct}
              className="px-[1vw] py-[0.5vw] bg-blue-600 text-white border-none rounded-[0.5vw] text-[0.85vw] font-medium cursor-pointer flex items-center gap-[0.6vw] transition-all duration-200 hover:bg-blue-700 shadow-md hover:shadow-lg"
            >
              <span className="text-[1.2vw]">+</span> Add Another Product
            </button>
          </div>

          {/* Payment Details - UPDATED with Total Estimate for Selected */}
          <Section
            title="Payment Details - Client Payments"
            styles={{ position: "relative" }}
          >
            {/* Compact Summary Bar */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-[0.5vw] px-[.5vw] py-[.75vw] mb-[1vw] w-fit pr-[2vw] ">
              <div className="flex items-center gap-[2vw]">
                <div className="flex items-center gap-[0.25vw]">
                  <div className="px-[2vw] flex gap-[.25vw] items-center">
                    <span className="text-[1vw] text-blue-600 font-medium">
                      Total Products
                    </span>
                    <span className="text-[1.15vw] font-bold text-blue-700">
                      {products.length}
                    </span>
                  </div>
                </div>
                <div className="border-l-2 border-blue-300 px-[2vw] flex gap-[.25vw] items-center">
                  <span className="text-[1vw] text-green-600 font-medium">
                    Payment Received
                  </span>
                  <span className="text-[1.15vw] font-bold text-green-700">
                    {calculateTotals().productsWithPayment}
                  </span>
                </div>
              </div>
            </div>

            {/* Add Payment Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-[.8vw] py-[.65vw] bg-green-600 text-white text-[.9vw] rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 absolute top-[4vw] right-2 cursor-pointer"
            >
              <span className="text-[1vw]">+</span>
              Add New Payment
            </button>

            {/* Payment Records - Compact Table View */}
            {paymentRecords.length > 0 && (
              <div className="mt-[.25vw]">
                <h3 className="text-[0.9vw] font-semibold text-gray-800 mb-[0.75vw]">
                  Payment History ({paymentRecords.length} records)
                </h3>
                <div className="border-2 border-gray-200 rounded-[0.5vw] overflow-hidden max-h-[15vw] overflow-y-auto">
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
                          Method / Details
                        </th>
                        <th className="text-right px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                          Amount
                        </th>
                        <th className="text-center px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-[1vw] py-[0.7vw] text-[0.8vw] text-gray-600">
                            {new Date(record.timestamp).toLocaleString(
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
                          <td className="px-[1vw] py-[0.7vw]">
                            <span
                              className={`inline-block px-[0.6vw] py-[0.25vw] rounded-[0.3vw] text-[0.8vw] font-semibold ${
                                record.paymentType === "advance"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {record.paymentType === "advance"
                                ? "Advance"
                                : "PO"}
                            </span>
                          </td>
                          <td className="px-[1vw] py-[0.7vw] text-[0.75vw] text-gray-700">
                            {record.paymentType === "advance" ? (
                              <div>
                                <span className="font-medium">
                                  {record.method}
                                </span>
                                {record.remarks && (
                                  <p className="text-[0.8vw] text-gray-500 mt-[0.15vw] truncate max-w-[12vw]">
                                    {record.remarks}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[0.8vw] text-gray-500 truncate max-w-[12vw] block">
                                {record.remarks || "PO Payment"}
                              </span>
                            )}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] text-right text-[0.8vw] font-bold text-green-700">
                            {record.paymentType === "advance"
                              ? `₹ ${record.amount}`
                              : "-"}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] text-center">
                            <button
                              onClick={() => removePaymentRecord(record.id)}
                              className="px-[0.75vw] py-[0.35vw] bg-red-500 text-white rounded-[0.3vw] text-[0.8vw] font-medium cursor-pointer hover:bg-red-600 transition-all"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compact Footer Summary */}
            <div className="grid grid-cols-3 gap-[1vw] mt-[1.25vw]">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-[0.5vw] p-[1vw]">
                <label className="block text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                  Total Estimated Amount
                </label>
                <input
                  type="number"
                  placeholder="₹ 0.00"
                  value={orderDetails.estimatedValue}
                  onChange={(e) =>
                    setOrderDetails({
                      ...orderDetails,
                      estimatedValue: e.target.value,
                    })
                  }
                  disabled={true}
                  className="w-full px-[0.75vw] py-[0.6vw] border border-gray-300 bg-white rounded-[0.4vw] text-[0.85vw] font-semibold outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-[0.5vw] p-[1vw]">
                <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                  Total Received
                </p>
                <p className="text-[1.5vw] font-bold text-green-700">
                  ₹ {calculateTotals().totalPaid.toFixed(2)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-[0.5vw] p-[1vw]">
                <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                  Balance Due
                </p>
                <p className="text-[1.5vw] font-bold text-orange-700">
                  ₹ {calculateTotals().balance.toFixed(2)}
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-[1vw] mt-[1.25vw] px-[1.5vw]">
          <button
            className="px-[1.5vw] py-[0.65vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.5vw] text-[0.85vw] font-medium cursor-pointer transition-all duration-200 hover:bg-gray-50"
            onClick={() => {
              if (onCancel) {
                onCancel();
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={submitForm}
            className="px-[1.5vw] py-[0.65vw] bg-green-600 text-white border-none rounded-[0.5vw] text-[0.85vw] font-semibold cursor-pointer transition-all duration-200 hover:bg-green-700 shadow-md"
          >
            Submit Order
          </button>
        </div>
      </div>
      <PreviewModal />
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

// Design Preview Component (NEW)
function DesignPreview({ file, productId, pdfPreviews, setPreviewModal }) {
  return (
    <div className="p-[1vw] bg-gray-50 rounded-[0.5vw] border-2 border-gray-300 h-full relative">
      <p className="text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        Preview:
      </p>

      {file.type === "application/pdf" ? (
        <div className="mb-[1vw]">
          {pdfPreviews[productId] ? (
            <img
              src={pdfPreviews[productId]}
              alt="PDF Preview"
              className="w-full h-auto border border-gray-300 rounded"
              style={{
                maxHeight: "150px",
                objectFit: "contain",
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-32 bg-gray-200 rounded">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-500 text-0.8vw">Generating preview...</p>
            </div>
          )}
        </div>
      ) : (
        file?.type?.startsWith("image/") && (
          <img
            src={URL.createObjectURL(file)}
            alt="Design Preview"
            className="w-full h-auto mb-1vw border border-gray-300 rounded"
            style={{
              maxHeight: "9vw",
              objectFit: "contain",
            }}
          />
        )
      )}

      <div className="mt-2">
        <div className="flex items-center justify-between text-0.75vw">
          <span className="text-gray-600 truncate pr-2">{file.name}</span>
        </div>
        <div className="flex items-center justify-between text-0.7vw mt-1">
          <span className="text-gray-500">
            {(file.size / 1024).toFixed(2)} KB
          </span>
          <span
            className={`px-2 py-0.5 rounded text-0.65vw font-medium ${
              file.type === "application/pdf"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {file.type === "application/pdf" ? "PDF" : "Image"}
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          const fileUrl = URL.createObjectURL(file);
          setPreviewModal({
            isOpen: true,
            type: file.type === "application/pdf" ? "pdf" : "image",
            path: fileUrl,
            name: file.name,
          });
        }}
        className="px-[1vw] py-[0.4vw] bg-green-600 text-white rounded-[0.4vw] hover:bg-green-700 font-medium text-[0.75vw] transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-[0.3vw] justify-center ml-[auto] mt-[.75vw] absolute top-[-.30vw] right-[1vw]"
      >
        <svg
          className="w-[0.9vw] h-[0.9vw]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        Preview
      </button>
    </div>
  );
}

// File Upload Component (same as before - keeping your existing implementation)
function FileUploadBox({ file, onFileChange, productId, small }) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      onFileChange(selectedFile);

      const type = selectedFile.type;
      setFileType(type);

      if (type.startsWith("image/")) {
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
        alert("Please upload only images (JPEG, PNG, GIF, WebP) or PDF files");
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
      } rounded-[0.6vw] p-[2vw] bg-white ${
        small ? "min-h-[10vw]" : "min-h-[15vw]"
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
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              onFileChange(file); // Just pass the file to parent
            }
          }}
          className="hidden"
          id={`file-upload-${productId}`}
        />

        {!file ? (
          <label
            htmlFor={`file-upload-${productId}`}
            className="cursor-pointer flex flex-col items-center w-full"
          >
            <div
              className={`w-[3.5vw] h-[3.5vw] ${
                isDragging ? "bg-blue-200" : "bg-gray-200"
              } rounded-full flex items-center justify-center mb-[0.8vw] transition-all`}
            >
              <svg
                className={`w-[2vw] h-[2vw] ${
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
              className={`text-[0.85vw] ${
                isDragging ? "text-blue-600 font-medium" : "text-gray-500"
              } my-[0.2vw]`}
            >
              {isDragging ? "Drop file here" : "Upload Design File"}
            </p>
            <p className="text-[0.75vw] text-gray-400 my-[0.2vw]">
              Click to browse or drag & drop
            </p>
            <p className="text-[0.7vw] text-gray-400 mt-[0.5vw]">
              Supports: JPG, PNG, GIF, WebP, PDF
            </p>
          </label>
        ) : (
          <div className="w-full">
            {fileType && fileType.startsWith("image/") && previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[12vw] object-contain rounded-[0.4vw] border border-gray-200"
                />
                <button
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                  title="Remove file"
                >
                  ×
                </button>
                <div className="mt-2 text-center">
                  <p className="text-[0.8vw] text-gray-700 font-medium truncate">
                    {file.name}
                  </p>
                  <p className="text-[0.7vw] text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ) : fileType === "application/pdf" ? (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-[8vw] h-[10vw] bg-red-50 rounded-[0.4vw] border-2 border-red-200 flex flex-col items-center justify-center">
                    <svg
                      className="w-[4vw] h-[4vw] text-red-500"
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
                    <span className="text-[0.85vw] font-bold text-red-600 mt-1">
                      PDF
                    </span>
                  </div>
                  <button
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-2 text-center max-w-full">
                  <p className="text-[0.8vw] text-gray-700 font-medium truncate px-2">
                    {file.name}
                  </p>
                  <p className="text-[0.7vw] text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-[6.5vw] h-[8vw] bg-gray-100 rounded-[0.4vw] border-2 border-gray-300 flex flex-col items-center justify-center">
                    <svg
                      className="w-[4vw] h-[4vw] text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    </svg>
                  </div>
                  <button
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[0.8vw] text-gray-700 font-medium truncate">
                    {file.name}
                  </p>
                  <p className="text-[0.7vw] text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}

            <label
              htmlFor={`file-upload-${productId}`}
              className="mt-3 block w-full"
            >
              <div className="cursor-pointer text-center px-3 py-2 border border-blue-500 text-blue-600 rounded-[0.4vw] text-[0.8vw] font-medium hover:bg-blue-50 transition-all">
                Change File
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, onClick, isCollapsed }) {
  return (
    <div className="mt-[1vw] relative">
      <div
        className={`bg-blue-600 text-white px-[1.5vw] py-[0.8vw] rounded-t-[0.6vw] text-[1vw] font-medium ${
          onClick ? "cursor-pointer" : ""
        }`}
        onClick={onClick}
      >
        {title}
      </div>
      <div className="bg-gray-50 p-[1.25vw] rounded-b-[0.6vw] border border-gray-300 border-t-0">
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  required,
  placeholder,
  value,
  onChange,
  disabled,
  onBlur,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        {label} {required}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full text-[.8vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function Select({
  label,
  required,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}) {
  return (
    <div>
      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        {label} {required}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full text-[.9vw] px-[0.75vw] py-[0.45vw] pr-[2.5vw] border border-gray-300 rounded-[0.5vw] text-[0.85vw] outline-none bg-white box-border appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer ${
            disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute right-[1vw] top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-[1vw] h-[1vw] text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
