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
            💳 Add New Payment
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
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[1vw] font-medium text-gray-700 mb-2">
                    Upload Screenshot
                  </label>
                  <div className="grid grid-cols-2 items-center gap-[1vw]">
                    <FileUploadBox
                      file={bulkPayment.file}
                      onFileChange={(file) => {
                        setBulkPayment({ ...bulkPayment, file });
                        if (file && file.type === "application/pdf") {
                          generatePdfThumbnail(file, "advance-payment");
                        }
                      }}
                      productId="advance-payment"
                      small
                    />
                    {bulkPayment.file &&
                      bulkPayment.file.type.includes("image") && (
                        <img
                          src={URL.createObjectURL(bulkPayment.file)}
                          alt="Screenshot Preview"
                          className="mt-2 max-h-[200px] rounded border"
                        />
                      )}
                  </div>
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
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-[1vw] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />

                <div className="mt-4">
                  <label className="block text-[1vw] font-medium text-gray-700 mb-2">
                    Upload PO Document
                  </label>
                  <div className="grid grid-cols-2 items-center gap-[1vw]">
                    <FileUploadBox
                      file={bulkPayment.file}
                      onFileChange={(file) => {
                        setBulkPayment({ ...bulkPayment, file });
                        if (file && file.type === "application/pdf") {
                          generatePdfThumbnail(file, "po-payment");
                        }
                      }}
                      productId="po-payment"
                      small
                    />
                    {bulkPayment.file &&
                      bulkPayment.file.type.includes("image") && (
                        <img
                          src={URL.createObjectURL(bulkPayment.file)}
                          alt="PO Preview"
                          className="mt-2 max-h-[200px] rounded border"
                        />
                      )}
                    {bulkPayment.file &&
                      !bulkPayment.file.type.includes("image") && (
                        <p className="text-sm text-gray-600">
                          {bulkPayment.file.name} (click to view after saving)
                        </p>
                      )}
                  </div>
                </div>
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
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {bulkPayment.paymentType === "advance"
                        ? "Advance Payment"
                        : "Purchase Order"}
                    </span>
                  </div>
                  {bulkPayment.paymentType === "advance" &&
                    bulkPayment.amount && (
                      <div className="flex justify-between text-[1vw]">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-green-600">
                          ₹{parseFloat(bulkPayment.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between text-[1vw] pt-2 border-t">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-bold text-orange-600">
                      ₹{calculateTotals().balance.toFixed(2)}
                    </span>
                  </div>
                  {bulkPayment.paymentType === "advance" &&
                    bulkPayment.amount && (
                      <div className="flex justify-between text-[1vw]">
                        <span className="text-gray-600">
                          Balance After Payment:
                        </span>
                        <span className="font-bold text-blue-600">
                          ₹
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

export default function NewOrder({
  existingOrder,
  onSubmit,
  onCancel,
  onBack,
}) {
  const [contact, setContact] = useState({
    company: "",
    contactName: "",
    phone: "",
    // imlName: "",
    priority: "medium", // NEW: Priority field
  });

  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFromSuggestion, setIsFromSuggestion] = useState(false);
  const autocompleteRef = useRef(null);
  const COLOR_OPTIONS = ["transparent", "black", "white", "golden", "red"];
  // Color autocomplete states
  const [filteredLidColors, setFilteredLidColors] = useState([]);
  const [filteredTubColors, setFilteredTubColors] = useState([]);
  const [showLidColorSuggestions, setShowLidColorSuggestions] = useState({});
  const [showTubColorSuggestions, setShowTubColorSuggestions] = useState({});
  const lidColorRefs = useRef({});
  const tubColorRefs = useRef({});

  const IML_NAME_OPTIONS = [
    "Premium IML Labels",
    "Quality IML Solutions",
    "Eco IML Series",
    "Standard IML",
    "Premium Plus IML",
    "Custom IML Design",
    "Classic IML",
    "Modern IML",
  ];

  // Add state for IML name autocomplete (after color autocomplete states)
  const [filteredImlNames, setFilteredImlNames] = useState({});
  const [showImlNameSuggestions, setShowImlNameSuggestions] = useState({});
  const imlNameRefs = useRef({});

  // Product size options mapping
  const PRODUCT_SIZE_OPTIONS = {
    Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
    "Round Square": ["450ml", "500ml"],
    Rectangle: ["500ml", "650ml", "750ml"],
    "Sweet Box": ["250gms", "500gms"],
    "Sweet Box TE": ["TE 250gms", "TE 500gms"],
  };

  const OLD_DESIGN_FILES = [
    { id: 1, name: "Design 1", path: design1PDF, type: "pdf" },
    { id: 2, name: "Design 2", path: design2PDF, type: "pdf" },
    { id: 3, name: "Design 3", path: design3PDF, type: "pdf" },
  ];

  const PRIORITY_OPTIONS = [
    "Low (5-6 weeks)",
    "Medium (4-5 weeks)",
    "High (Less than 4 weeks)",
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
      productName: "",
      size: "",
      imlName: "",
      lidColor: "transparent",
      tubColor: "white",
      imlType: "LID",
      // LID quantities
      lidLabelQty: "",
      lidProductionQty: "",
      lidStock: 0,
      // TUB quantities
      tubLabelQty: "",
      tubProductionQty: "",
      tubStock: 0,
      budget: 0,
      // LID design
      lidDesignFile: null,
      lidSelectedOldDesign: null,
      // TUB design
      tubDesignFile: null,
      tubSelectedOldDesign: null,
      approvedDate: getTodayDate(),
      designSharedMail: false,
      designStatus: "pending",
      showLidColorPicker: false,
      showTubColorPicker: false,
      designType: "new",
      moveToPurchase: false,

      isCollapsed: false,
    },
  ]);

  const [orderNumber, setOrderNumber] = useState("");

  const [orderEstimate, setOrderEstimate] = useState({
    estimatedNumber: "",
    estimatedValue: 0,
  });

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

  const previewModalRef = useRef(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkPayment, setBulkPayment] = useState({
    paymentType: null,
    method: "",
    amount: "",
    remarks: "",
    file: null, // NEW: uploaded screenshot/document
  });
  const [paymentRecords, setPaymentRecords] = useState([]);

  // Initialize on mount:
  useEffect(() => {
    if (!existingOrder) {
      setOrderNumber(generateOrderNumber());
    } else {
      setOrderNumber(existingOrder.orderNumber || generateOrderNumber());
    }
  }, []);

  // Initialize with existing order data if editing
  useEffect(() => {
    if (existingOrder) {
      setContact(existingOrder.contact);
      setProducts(existingOrder.products);
      setPayment(existingOrder.payment);
      setPaymentRecords(existingOrder.paymentRecords || []);
      setOrderEstimate(
        existingOrder.orderEstimate || {
          estimatedNumber: "",
          estimatedValue: 0,
        }
      ); // NEW
    }
  }, [existingOrder]);

  // FIXED: Handle company name input - clear fields when empty
  const handleCompanyInput = (value) => {
    setContact({ ...contact, company: value });

    if (value.trim() === "") {
      // Clear contact fields when company name is removed
      setContact({
        company: "",
        contactName: "",
        phone: "",
        imlName: contact.imlName,
        priority: contact.priority,
      });
      setIsFromSuggestion(false);
      setFilteredCompanies([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = DUMMY_COMPANIES.filter((company) =>
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
      productName: "",
      size: "",
      imlName: "",
      lidColor: "transparent",
      tubColor: "white",
      imlType: "LID",
      lidLabelQty: "",
      lidProductionQty: "",
      lidStock: 0,
      tubLabelQty: "",
      tubProductionQty: "",
      tubStock: 0,
      budget: 0,
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
      moveToPurchase: false,

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

  const handleLidColorInput = (productId, value) => {
    updateProduct(productId, "lidColor", value);

    if (value.trim() === "") {
      setFilteredLidColors([]);
      setShowLidColorSuggestions({
        ...showLidColorSuggestions,
        [productId]: false,
      });
      return;
    }

    const filtered = COLOR_OPTIONS.filter((color) =>
      color.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredLidColors(filtered);
    setShowLidColorSuggestions({
      ...showLidColorSuggestions,
      [productId]: filtered.length > 0,
    });
  };

  // Handle Tub Color input with autocomplete
  const handleTubColorInput = (productId, value) => {
    updateProduct(productId, "tubColor", value);

    if (value.trim() === "") {
      setFilteredTubColors([]);
      setShowTubColorSuggestions({
        ...showTubColorSuggestions,
        [productId]: false,
      });
      return;
    }

    const filtered = COLOR_OPTIONS.filter((color) =>
      color.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredTubColors(filtered);
    setShowTubColorSuggestions({
      ...showTubColorSuggestions,
      [productId]: filtered.length > 0,
    });
  };

  // Handle Lid Color suggestion click
  const handleLidColorSelect = (productId, color) => {
    updateProduct(productId, "lidColor", color);
    setShowLidColorSuggestions({
      ...showLidColorSuggestions,
      [productId]: false,
    });
  };

  // Handle Tub Color suggestion click
  const handleTubColorSelect = (productId, color) => {
    updateProduct(productId, "tubColor", color);
    setShowTubColorSuggestions({
      ...showTubColorSuggestions,
      [productId]: false,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check Lid Color refs
      Object.keys(lidColorRefs.current).forEach((productId) => {
        if (
          lidColorRefs.current[productId] &&
          !lidColorRefs.current[productId].contains(event.target)
        ) {
          setShowLidColorSuggestions((prev) => ({
            ...prev,
            [productId]: false,
          }));
        }
      });

      // Check Tub Color refs
      Object.keys(tubColorRefs.current).forEach((productId) => {
        if (
          tubColorRefs.current[productId] &&
          !tubColorRefs.current[productId].contains(event.target)
        ) {
          setShowTubColorSuggestions((prev) => ({
            ...prev,
            [productId]: false,
          }));
        }
      });

      Object.keys(imlNameRefs.current).forEach((productId) => {
        if (
          imlNameRefs.current[productId] &&
          !imlNameRefs.current[productId].contains(event.target)
        ) {
          setShowImlNameSuggestions((prev) => ({
            ...prev,
            [productId]: false,
          }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle IML Name input with autocomplete
  const handleImlNameInput = (productId, value) => {
    updateProduct(productId, "imlName", value);

    if (!value.trim()) {
      setFilteredImlNames({});
      setShowImlNameSuggestions({
        ...showImlNameSuggestions,
        [productId]: false,
      });
      return;
    }

    const filtered = IML_NAME_OPTIONS.filter((name) =>
      name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredImlNames(filtered);
    setShowImlNameSuggestions({
      ...showImlNameSuggestions,
      [productId]: filtered.length > 0,
    });
  };

  // Handle IML Name suggestion click
  const handleImlNameSelect = (productId, name) => {
    updateProduct(productId, "imlName", name);
    setShowImlNameSuggestions({
      ...showImlNameSuggestions,
      [productId]: false,
    });
  };

  const submitForm = () => {
    const orderData = {
      orderNumber,
      contact,
      products,
      orderEstimate,
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

  const isProductLocked = (product) => {
    return product.moveToPurchase === true;
  };
  const isProductLocked2 = (product) => {
    return false;
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

  const PreviewModal = () => {
    if (!previewModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div
          ref={previewModalRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-white rounded-lg overflow-hidden max-w-6xl w-full max-h-90vh flex flex-col"
        >
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

  // Payment Modal Component

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

    // const newRecord = {
    //   id: Date.now(),

    //   paymentType: bulkPayment.paymentType,
    //   method: bulkPayment.method,
    //   amount: bulkPayment.amount,
    //   remarks: bulkPayment.remarks,
    //   timestamp: new Date().toISOString(),
    // };

    const newRecord = {
      ...bulkPayment,
      id: Date.now(),
      dateTime: new Date().toLocaleString(), // human-readable
      timestamp: new Date().toISOString(), // machine-readable
    };

    setPaymentRecords([...paymentRecords, newRecord]);

    setSelectedProducts([]);
    // reset
    setBulkPayment({
      paymentType: null,
      method: "",
      amount: "",
      remarks: "",
      file: null,
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
    const totalBudget = products.reduce(
      (sum, p) => sum + (parseFloat(p.budget) || 0),
      0
    );

    const totalPaid = paymentRecords
      .filter((r) => r.paymentType === "advance")
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    const productsWithPayment = new Set(
      paymentRecords.flatMap((r) => r.productIds)
    ).size;

    const productsWithoutPayment = products.length - productsWithPayment;

    // Get total estimated amount from payment state
    const totalEstimated = parseFloat(payment.totalEstimated) || 0;

    return {
      totalBudget,
      totalPaid,
      totalEstimated, // ✅ ADD THIS
      productsWithPayment,
      productsWithoutPayment,
      balance: Math.max(totalEstimated - totalPaid, 0), // ✅ FIXED - now uses totalEstimated
    };
  };

  // UPDATED: Calculate total estimate for selected products
  const calculateSelectedTotal = () => {
    return selectedProducts.reduce((sum, id) => {
      const product = products.find((p) => p.id === id);
      return sum + (parseFloat(product?.estimatedValue) || 0);
    }, 0);
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  const [isManualTotal, setIsManualTotal] = useState(false);

  // auto set total estimated amount input field
  useEffect(() => {
    // Only auto-fill if no payments have been recorded yet
    if (paymentRecords.length === 0 && orderEstimate.estimatedValue > 0) {
      setPayment((prev) => ({
        ...prev,
        totalEstimated: orderEstimate.estimatedValue,
      }));
    }
  }, [orderEstimate.estimatedValue, paymentRecords.length]);

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
              {/* <Input
                label="IML Name"
                required
                placeholder="Enter IML Name"
                value={contact.imlName}
                onChange={(e) =>
                  setContact({ ...contact, imlName: e.target.value })
                }
              /> */}
              {/* NEW: Priority Field */}
              <Select
                label="Priority"
                required
                placeholder="Select Priority"
                options={PRIORITY_OPTIONS}
                value={contact.priority}
                onChange={(e) =>
                  setContact({ ...contact, priority: e.target.value })
                }
              />

              <Input
                label="Order Number"
                required
                placeholder=""
                value={orderNumber}
                disabled={true}
                onChange={(e) => {
                  return null;
                }}
                type="text"
              />
            </div>
            <div className="grid grid-cols-5 gap-[1.5vw] mt-[1vw]">
              <Input
                label="Estimated Number"
                required
                placeholder="Enter Estimated Number"
                value={orderEstimate.estimatedNumber}
                onChange={(e) =>
                  setOrderEstimate({
                    ...orderEstimate,
                    estimatedNumber: e.target.value,
                  })
                }
                type="number"
              />
              <Input
                label="Estimated Value"
                required
                placeholder="Enter Estimated Value"
                value={orderEstimate.estimatedValue}
                onChange={(e) =>
                  setOrderEstimate({
                    ...orderEstimate,
                    estimatedValue: e.target.value,
                  })
                }
                type="number"
              />
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
                          disabled={isProductLocked(product)}
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
                                product.imlType
                              )
                            ) {
                              alert(
                                `This product combination (${product.productName} - ${newSize} - ${product.imlType}) already exists!`
                              );
                              return;
                            }
                            updateProduct(product.id, "size", newSize);
                          }}
                          disabled={isProductLocked(product)}
                        />

                        <Select
                          label="IML Type"
                          required
                          placeholder="Select Type"
                          options={["LID", "TUB", "LID & TUB"]}
                          value={product.imlType}
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
                                      imlType: newImlType,
                                      showLidColorPicker: false,
                                      showTubColorPicker: false,
                                    }
                                  : p
                              )
                            );
                          }}
                          disabled={isProductLocked(product)}
                        />

                        {/* NEW: IML Name with Autocomplete */}
                        <div
                          className="relative"
                          ref={(el) => (imlNameRefs.current[product.id] = el)}
                        >
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            IML Name
                          </label>
                          <input
                            type="text"
                            placeholder="Enter or Select IML Name"
                            value={product.imlName}
                            onChange={(e) =>
                              handleImlNameInput(product.id, e.target.value)
                            }
                            className="w-full text-[0.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            disabled={isProductLocked(product)}
                          />

                          {/* Suggestions Dropdown */}
                          {showImlNameSuggestions[product.id] &&
                            filteredImlNames.length > 0 && (
                              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                                {filteredImlNames.map((name, index) => (
                                  <div
                                    key={index}
                                    onClick={() =>
                                      handleImlNameSelect(product.id, name)
                                    }
                                    className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <p className="text-[0.85vw] font-medium text-gray-800">
                                      {name}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-[1.5vw] mt-[1vw]">
                        {/* LID Color Autocomplete */}
                        <div
                          className="relative"
                          ref={(el) => (lidColorRefs.current[product.id] = el)}
                        >
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            LID Color
                          </label>
                          <input
                            type="text"
                            placeholder="Enter or Select Color"
                            value={product.lidColor}
                            onChange={(e) =>
                              handleLidColorInput(product.id, e.target.value)
                            }
                            className={`w-full text-[0.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              isProductLocked2(product)
                                ? "cursor-not-allowed"
                                : ""
                            }`}
                            disabled={isProductLocked2(product)}
                          />

                          {/* Suggestions Dropdown */}
                          {showLidColorSuggestions[product.id] &&
                            filteredLidColors.length > 0 && (
                              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                                {filteredLidColors.map((color, index) => (
                                  <div
                                    key={index}
                                    onClick={() =>
                                      handleLidColorSelect(product.id, color)
                                    }
                                    className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center gap-[0.5vw]">
                                      <p className="text-[0.85vw] font-medium text-gray-800 capitalize">
                                        {color}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>

                        {/* TUB Color Autocomplete */}
                        <div
                          className="relative"
                          ref={(el) => (tubColorRefs.current[product.id] = el)}
                        >
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            TUB Color
                          </label>
                          <input
                            type="text"
                            placeholder="Enter or Select Color"
                            value={product.tubColor}
                            onChange={(e) =>
                              handleTubColorInput(product.id, e.target.value)
                            }
                            className={`w-full text-[0.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              isProductLocked2(product)
                                ? "cursor-not-allowed"
                                : ""
                            }`}
                            disabled={isProductLocked2(product)}
                          />

                          {/* Suggestions Dropdown */}
                          {showTubColorSuggestions[product.id] &&
                            filteredTubColors.length > 0 && (
                              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                                {filteredTubColors.map((color, index) => (
                                  <div
                                    key={index}
                                    onClick={() =>
                                      handleTubColorSelect(product.id, color)
                                    }
                                    className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center gap-[0.5vw]">
                                      <p className="text-[0.85vw] font-medium text-gray-800 capitalize">
                                        {color}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Color Picker Section */}
                      <div className="grid grid-cols-4 gap-[1.5vw] mt-[1vw] hidden">
                        <div className="grid grid-cols-4 gap-1.5vw mt-1vw">
                          <div>
                            <label className="block text-0.85vw font-medium text-gray-700 mb-0.5vw">
                              LID Color <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              list={`lid-colors-${product.id}`}
                              placeholder="Select or type color"
                              value={product.lidColor}
                              onChange={(e) =>
                                updateProduct(
                                  product.id,
                                  "lidColor",
                                  e.target.value
                                )
                              }
                              className="w-full px-0.75vw py-0.45vw border border-gray-300 bg-white rounded-0.5vw text-0.85vw outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <datalist id={`lid-colors-${product.id}`}>
                              {COLOR_OPTIONS.map((color) => (
                                <option key={color} value={color} />
                              ))}
                            </datalist>
                          </div>

                          <div>
                            <label className="block text-0.85vw font-medium text-gray-700 mb-0.5vw">
                              TUB Color <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              list={`tub-colors-${product.id}`}
                              placeholder="Select or type color"
                              value={product.tubColor}
                              onChange={(e) =>
                                updateProduct(
                                  product.id,
                                  "tubColor",
                                  e.target.value
                                )
                              }
                              className="w-full px-0.75vw py-0.45vw border border-gray-300 bg-white rounded-0.5vw text-0.85vw outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <datalist id={`tub-colors-${product.id}`}>
                              {COLOR_OPTIONS.map((color) => (
                                <option key={color} value={color} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </div>

                      {/* UPDATED: Separate Quantity Details for LID & TUB */}
                      {product.imlType === "LID & TUB" ? (
                        <>
                          {/* LID Quantities */}
                          <div className="mt-[1vw]">
                            <h4 className="text-[0.9vw] font-semibold text-blue-800 mb-[0.75vw]">
                              LID Quantities
                            </h4>
                            <div className="grid grid-cols-3 gap-[1.5vw]">
                              <Input
                                label="Labels Order Qty (LID)"
                                required
                                placeholder="Enter Label Quantity"
                                value={product.lidLabelQty}
                                onChange={(e) =>
                                  updateQuantity(
                                    product.id,
                                    "lid",
                                    "LabelQty",
                                    e.target.value
                                  )
                                }
                              />
                              <Input
                                label="Production Qty (LID)"
                                required
                                placeholder="Enter Production Quantity"
                                value={product.lidProductionQty}
                                onChange={(e) =>
                                  updateQuantity(
                                    product.id,
                                    "lid",
                                    "ProductionQty",
                                    e.target.value
                                  )
                                }
                              />
                              <Input
                                label="Stock (LID)"
                                required
                                placeholder="Stock"
                                value={product.lidStock}
                                onChange={(e) => {}}
                                disabled
                              />
                            </div>
                          </div>

                          {/* TUB Quantities */}
                          <div className="mt-[1vw]">
                            <h4 className="text-[0.9vw] font-semibold text-blue-800 mb-[0.75vw]">
                              TUB Quantities
                            </h4>
                            <div className="grid grid-cols-3 gap-[1.5vw]">
                              <Input
                                label="Labels Order Qty (TUB)"
                                required
                                placeholder="Enter Label Quantity"
                                value={product.tubLabelQty}
                                onChange={(e) =>
                                  updateQuantity(
                                    product.id,
                                    "tub",
                                    "LabelQty",
                                    e.target.value
                                  )
                                }
                              />
                              <Input
                                label="Production Qty (TUB)"
                                required
                                placeholder="Enter Production Quantity"
                                value={product.tubProductionQty}
                                onChange={(e) =>
                                  updateQuantity(
                                    product.id,
                                    "tub",
                                    "ProductionQty",
                                    e.target.value
                                  )
                                }
                              />
                              <Input
                                label="Stock (TUB)"
                                required
                                placeholder="Stock"
                                value={product.tubStock}
                                onChange={(e) => {}}
                                disabled
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Single IML Type Quantities */
                        <div className="grid grid-cols-4 gap-[1.5vw] mt-[1vw]">
                          <Input
                            label={`Labels Order Qty${
                              product.imlType !== "LID" &&
                              product.imlType !== "TUB"
                                ? ""
                                : ` (${product.imlType})`
                            }`}
                            required
                            placeholder="Enter Label Quantity"
                            value={
                              product.imlType === "LID"
                                ? product.lidLabelQty
                                : product.tubLabelQty
                            }
                            onChange={(e) => {
                              const type =
                                product.imlType === "LID" ? "lid" : "tub";
                              updateQuantity(
                                product.id,
                                type,
                                "LabelQty",
                                e.target.value
                              );
                            }}
                          />
                          <Input
                            label={`Production Qty${
                              product.imlType !== "LID" &&
                              product.imlType !== "TUB"
                                ? ""
                                : ` (${product.imlType})`
                            }`}
                            required
                            placeholder="Enter Production Quantity"
                            value={
                              product.imlType === "LID"
                                ? product.lidProductionQty
                                : product.tubProductionQty
                            }
                            onChange={(e) => {
                              const type =
                                product.imlType === "LID" ? "lid" : "tub";
                              updateQuantity(
                                product.id,
                                type,
                                "ProductionQty",
                                e.target.value
                              );
                            }}
                          />
                          <Input
                            label={`Stock${
                              product.imlType !== "LID" &&
                              product.imlType !== "TUB"
                                ? ""
                                : ` (${product.imlType})`
                            }`}
                            required
                            placeholder="Stock"
                            value={
                              product.imlType === "LID"
                                ? product.lidStock
                                : product.tubStock
                            }
                            onChange={(e) => {}}
                            disabled
                          />
                        </div>
                      )}
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

                          {product.imlType === "LID & TUB" ? (
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
                              {product.imlType === "LID & TUB" ? (
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
                      <>
                        {!isProductLocked(product) && (
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
                  </>
                )}
              </Section>
            </div>
          ))}

          <div className="flex justify-end mt-[1vw]">
            <button
              onClick={addProduct}
              className="px-[.8vw] py-[0.3vw] border border-[0.17vw] border-blue-600 bg-white text-blue-600 rounded-[0.5vw] text-[0.85vw] font-bold cursor-pointer flex items-center gap-[0.6vw] transition-all duration-200 hover:bg-blue-600 hover:text-white shadow-md hover:shadow-lg animate-pulse-scale"
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
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-[0.5vw] px-[.5vw] py-[.75vw] mb-[1vw] w-fit pr-[2vw]">
              <div className="flex items-center gap-[2vw]">
                <div className="flex items-center gap-[0.25vw]">
                  <div className="px-[2vw]">
                    <span className="text-[1vw] text-blue-600 font-medium">
                      Total Products:{" "}
                    </span>
                    <span className="text-[1.15vw] font-bold text-blue-700">
                      {products.length}
                    </span>
                  </div>

                  <div className="border-l-2 border-blue-300 px-[2vw]">
                    <span className="text-[1vw] text-green-600 font-medium">
                      Payment Received:{" "}
                    </span>
                    <span className="text-[1.15vw] font-bold text-green-700">
                      {calculateTotals().productsWithPayment}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-[.8vw] py-[.65vw] bg-green-600 text-white text-[.9vw] rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 absolute top-[4vw] right-[2%] cursor-pointer"
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
                        <th className="text-right px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold text-gray-700 border-b-2 border-gray-300">
                          Attachement
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
                              ? `₹${record.amount}`
                              : "-"}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] text-right text-[0.8vw] font-bold text-green-700">
                            {record.file ? (
                              record?.file?.type?.includes("image") ? (
                                <button
                                  onClick={() =>
                                    setPreviewModal({
                                      isOpen: true,
                                      type: "image",
                                      path: URL.createObjectURL(record?.file),
                                      name: record?.file?.name,
                                    })
                                  }
                                  className="text-blue-600 underline cursor-pointer"
                                >
                                  View Screenshot
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setPreviewModal({
                                      isOpen: true,
                                      type: "pdf",
                                      path: URL.createObjectURL(record?.file),
                                      name: record?.file?.name,
                                    })
                                  }
                                  className="text-blue-600 underline cursor-pointer"
                                >
                                  View Document
                                </button>
                              )
                            ) : (
                              <span className="text-gray-400">No file</span>
                            )}
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
                  value={payment.totalEstimated}
                  onChange={(e) => {
                    setPayment({ ...payment, totalEstimated: e.target.value });
                    setIsManualTotal(true); // Mark as manually entered
                  }}
                  className="w-full px-[0.75vw] py-[0.6vw] border border-gray-300 bg-white rounded-[0.4vw] text-[0.85vw] font-semibold outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-[0.5vw] p-[1vw]">
                <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                  Total Received
                </p>
                <p className="text-[1.5vw] font-bold text-green-700">
                  ₹{calculateTotals().totalPaid.toFixed(2)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-[0.5vw] p-[1vw]">
                <p className="text-[0.75vw] font-medium text-gray-700 mb-[0.4vw]">
                  Balance Due
                </p>
                <p className="text-[1.5vw] font-bold text-orange-700">
                  ₹{calculateTotals().balance.toFixed(2)}
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
        file.type?.startsWith("image/") && (
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
            {fileType && fileType?.startsWith("image/") && previewUrl ? (
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
                    ✕
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

function Section({ title, styles = null, children, onClick, isCollapsed }) {
  return (
    <div className={`mt-[1vw]`} style={styles ?? undefined}>
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
        {...(type === "number" ? { min: "0" } : {})}
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
          className={`w-full text-[.9vw] px-[0.75vw] py-[0.45vw] pr-[2.5vw] border border-gray-300 rounded-[0.5vw] text-[0.85vw] outline-none bg-white box-border appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all  ${
            disabled ? "bg-white cursor-not-allowed" : "cursor-pointer"
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
