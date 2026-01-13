// PODetails.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_PO = "iml_purchase_po_details";

// Predefined options for autocomplete
const LABEL_TYPE_OPTIONS = [
  "Paper Label",
  "Vinyl Label",
  "Polyester Label",
  "Thermal Transfer",
  "Direct Thermal",
  "IML Label",
  "Shrink Sleeve",
  "Wrap Around Label",
];

const SUPPLIER_OPTIONS = [
  "Global Suppliers Inc.",
  "Prime Materials Ltd.",
  "Quality Distributors",
  "Elite Label Solutions",
  "Premium Print Co.",
  "Advanced Packaging",
  "Reliable Labels",
  "Express Suppliers",
];

const PODetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { orderId, returnSheet } = location.state || {};

  // State for order data
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for "Apply to All" fields
  const [globalPONumber, setGlobalPONumber] = useState("");
  const [globalLabelType, setGlobalLabelType] = useState("");
  const [globalSupplier, setGlobalSupplier] = useState("");

  // State for individual product PO details
  const [productPODetails, setProductPODetails] = useState({});

  // State for view modal
  const [viewingProduct, setViewingProduct] = useState(null);

  // Autocomplete states for global inputs
  const [filteredGlobalLabels, setFilteredGlobalLabels] = useState([]);
  const [filteredGlobalSuppliers, setFilteredGlobalSuppliers] = useState([]);
  const [showGlobalLabelSuggestions, setShowGlobalLabelSuggestions] =
    useState(false);
  const [showGlobalSupplierSuggestions, setShowGlobalSupplierSuggestions] =
    useState(false);

  // Autocomplete states for individual product rows
  const [activeAutocomplete, setActiveAutocomplete] = useState(null);

  // Refs
  const globalLabelRef = useRef(null);
  const globalSupplierRef = useRef(null);

  // Load fresh order data from localStorage
  useEffect(() => {
    console.log("🔍 PODetails - orderId received:", orderId);

    if (!orderId) {
      console.error("❌ No orderId provided");
      setLoading(false);
      return;
    }

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);

    if (!storedOrders) {
      console.error("❌ No orders in localStorage");
      setLoading(false);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const foundOrder = allOrders.find((o) => o.id === orderId);

      if (foundOrder) {
        console.log("✅ Order found:", foundOrder);
        setOrder(foundOrder);

        // Initialize product PO details
        const initialDetails = {};
        foundOrder.products
          ?.filter((p) => p.moveToPurchase)
          .forEach((product) => {
            initialDetails[product.id] =
              product.imlType === "LID & TUB"
                ? {
                    lid: { poNumber: "", labelType: "", supplier: "" },
                    tub: { poNumber: "", labelType: "", supplier: "" },
                  }
                : { poNumber: "", labelType: "", supplier: "" };
          });
        setProductPODetails(initialDetails);
      } else {
        console.error("❌ Order not found with ID:", orderId);
      }
    } catch (error) {
      console.error("❌ Error loading order:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Load existing PO details
  useEffect(() => {
    if (order) {
      const storedPO = localStorage.getItem(STORAGE_KEY_PO);
      if (storedPO) {
        const allPODetails = JSON.parse(storedPO);
        const existingPO = allPODetails[order.id];

        if (existingPO?.products) {
          setProductPODetails(existingPO.products);
        }
      }
    }
  }, [order]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        globalLabelRef.current &&
        !globalLabelRef.current.contains(event.target)
      ) {
        setShowGlobalLabelSuggestions(false);
      }
      if (
        globalSupplierRef.current &&
        !globalSupplierRef.current.contains(event.target)
      ) {
        setShowGlobalSupplierSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle global label type input
  const handleGlobalLabelInput = (value) => {
    setGlobalLabelType(value);

    if (!value.trim()) {
      setFilteredGlobalLabels([]);
      setShowGlobalLabelSuggestions(false);
      return;
    }

    const filtered = LABEL_TYPE_OPTIONS.filter((type) =>
      type.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredGlobalLabels(filtered);
    setShowGlobalLabelSuggestions(filtered.length > 0);
  };

  // Handle global supplier input
  const handleGlobalSupplierInput = (value) => {
    setGlobalSupplier(value);

    if (!value.trim()) {
      setFilteredGlobalSuppliers([]);
      setShowGlobalSupplierSuggestions(false);
      return;
    }

    const filtered = SUPPLIER_OPTIONS.filter((supplier) =>
      supplier.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredGlobalSuppliers(filtered);
    setShowGlobalSupplierSuggestions(filtered.length > 0);
  };

  // Apply global values to all products
  const handleApplyToAll = () => {
    if (!globalPONumber && !globalLabelType && !globalSupplier) {
      alert("Please enter at least one value to apply to all products");
      return;
    }

    const updatedDetails = { ...productPODetails };
    Object.keys(updatedDetails).forEach((productId) => {
      const product = order.products.find((p) => p.id === parseInt(productId));
      if (!product) return;

      if (product.imlType === "LID & TUB") {
        if (globalPONumber) {
          updatedDetails[productId].lid.poNumber = globalPONumber;
          updatedDetails[productId].tub.poNumber = globalPONumber;
        }
        if (globalLabelType) {
          updatedDetails[productId].lid.labelType = globalLabelType;
          updatedDetails[productId].tub.labelType = globalLabelType;
        }
        if (globalSupplier) {
          updatedDetails[productId].lid.supplier = globalSupplier;
          updatedDetails[productId].tub.supplier = globalSupplier;
        }
      } else {
        if (globalPONumber) updatedDetails[productId].poNumber = globalPONumber;
        if (globalLabelType)
          updatedDetails[productId].labelType = globalLabelType;
        if (globalSupplier) updatedDetails[productId].supplier = globalSupplier;
      }
    });

    setProductPODetails(updatedDetails);
    alert("✅ Values applied to all products!");
  };

  // Update individual product field
  const updateProductField = (productId, field, value, part = null) => {
    setProductPODetails((prev) => {
      const productDetails = prev[productId] || {};
      if (part) {
        return {
          ...prev,
          [productId]: {
            ...productDetails,
            [part]: {
              ...productDetails[part],
              [field]: value,
            },
          },
        };
      }
      return {
        ...prev,
        [productId]: {
          ...productDetails,
          [field]: value,
        },
      };
    });
  };

  // Handle autocomplete for product row
  const handleProductAutocomplete = (productId, field, value, part = null) => {
    updateProductField(productId, field, value, part);

    if (!value.trim()) {
      setActiveAutocomplete(null);
      return;
    }

    const options =
      field === "labelType" ? LABEL_TYPE_OPTIONS : SUPPLIER_OPTIONS;
    const filtered = options.filter((opt) =>
      opt.toLowerCase().includes(value.toLowerCase())
    );

    if (filtered.length > 0) {
      setActiveAutocomplete({
        productId,
        field: part ? `${field}-${part}` : field,
        options: filtered,
      });
    } else {
      setActiveAutocomplete(null);
    }
  };

  const selectProductAutocomplete = (productId, field, value, part = null) => {
    updateProductField(productId, field, value, part);
    setActiveAutocomplete(null);
  };

  // Open view modal
  const handleViewProduct = (product) => {
    setViewingProduct(product);
  };

  // Close view modal
  const closeViewModal = () => {
    setViewingProduct(null);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate that all products have required fields
    const purchaseProducts =
      order.products?.filter((p) => p.moveToPurchase) || [];
    const missingFields = [];

    purchaseProducts.forEach((product) => {
      const details = productPODetails[product.id];
      if (product.imlType === "LID & TUB") {
        const lid = details.lid || {};
        const tub = details.tub || {};
        if (
          !lid.poNumber ||
          !lid.labelType ||
          !lid.supplier ||
          !tub.poNumber ||
          !tub.labelType ||
          !tub.supplier
        ) {
          missingFields.push(`${product.productName} (LID/TUB)`);
        }
      } else {
        if (!details?.poNumber || !details?.labelType || !details?.supplier) {
          missingFields.push(product.productName);
        }
      }
    });

    if (missingFields.length > 0) {
      // alert(`⚠️ Please fill all fields for:\n${missingFields.join("\n")}`);
      // return;
    }

    // Save to localStorage
    const storedPO = localStorage.getItem(STORAGE_KEY_PO);
    const allPODetails = storedPO ? JSON.parse(storedPO) : {};

    allPODetails[order.id] = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      company: order.contact.company,
      products: productPODetails,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_PO, JSON.stringify(allPODetails));

    console.log("✅ PO saved:", allPODetails[order.id]);
    alert("✅ PO Details saved successfully!");

    navigate("/iml/purchase", {
      state: { refreshOrders: true },
    });
  };

  const handleBack = () => {
    navigate("/iml/purchase", {
      state: { refreshOrders: true },
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // No order found
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Order Data Found
          </h2>
          <p className="text-gray-600 mb-4">
            {orderId
              ? `Order ID "${orderId}" not found`
              : "No order ID provided"}
          </p>
          <button
            onClick={() => navigate("/iml/purchase")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
          >
            Back to Purchase Management
          </button>
        </div>
      </div>
    );
  }

  const purchaseProducts =
    order.products?.filter((p) => p.moveToPurchase) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      <div className="max-w-[95vw] mx-auto bg-white rounded-[0.8vw] shadow-sm pb-[.75vw]">
        {/* Header */}
        <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
          <button
            className="flex gap-[.5vw] items-center cursor-pointer hover:text-blue-600 transition-colors"
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
            Purchase Order Details
          </h1>
          <div className="w-[3vw]"></div>
        </div>

        <div className="px-[1.5vw] py-[1vw] max-h-[75vh] overflow-auto">
          {/* Order Basic Details */}
          <div className="bg-white rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mb-[1vw]">
            <h3 className="text-[1vw] font-semibold text-blue-900 mb-[1vw]">
              Order Information
            </h3>
            <div className="grid grid-cols-4 gap-[1.5vw]">
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Order Number
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-gray-50 rounded-[0.5vw]">
                  {order.orderNumber || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Company Name
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-gray-50 rounded-[0.5vw]">
                  {order.contact?.company || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Contact Name
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-gray-50 rounded-[0.5vw]">
                  {order.contact?.contactName || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Contact Number
                </label>
                <div className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-gray-50 rounded-[0.5vw]">
                  {order.contact?.phone || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Products with Individual PO Details */}
          <div className="bg-white rounded-[0.6vw] border-2 border-purple-200 p-[1vw] mb-[1vw]">
            <h3 className="text-[1vw] font-semibold text-purple-900 mb-[1vw]">
              Product PO Details
            </h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      S.No
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Product
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Size
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      IML Name
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Type
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Lid Order Qty
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Tub Order Qty
                    </th>
                    <th className="border border-gray-300 px-[1.2vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      PO Number <span className="text-red-500">*</span>
                    </th>
                    <th className="border border-gray-300 px-[1.2vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Label Type <span className="text-red-500">*</span>
                    </th>
                    <th className="border border-gray-300 px-[1.2vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                      Supplier <span className="text-red-500">*</span>
                    </th>
                    <th className="border border-gray-300 px-[1vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseProducts.map((product, idx) => {
                    const details = productPODetails[product.id] || {};
                    const quantityLid = product.imlType.includes("LID")
                      ? product.lidLabelQty
                      : "-";
                    const quantityTub = product.imlType.includes("TUB")
                      ? product.tubLabelQty
                      : "-";

                    return (
                      <tr key={product.id || idx} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw]">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw] font-medium">
                          {product.productName}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw]">
                          {product.size}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw]">
                          {product.imlName}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw]">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {product.imlType}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw] font-semibold">
                          {quantityLid}
                        </td>
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw] font-semibold">
                          {quantityTub}
                        </td>

                        {/* PO Number Input */}
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw] font-semibold">

                          {product.imlType === "LID & TUB" ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-[1vw]">
                                <p>LID: </p>
                                <input
                                  type="text"
                                  placeholder="PO # (Lid)"
                                  value={details.lid?.poNumber || ""}
                                  onChange={(e) =>
                                    updateProductField(
                                      product.id,
                                      "poNumber",
                                      e.target.value,
                                      "lid"
                                    )
                                  }
                                  className="border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              <div className="flex gap-[.7vw]">
                                <p>TUB: </p>
                                <input
                                  type="text"
                                  placeholder="PO # (Tub)"
                                  value={details.tub?.poNumber || ""}
                                  onChange={(e) =>
                                    updateProductField(
                                      product.id,
                                      "poNumber",
                                      e.target.value,
                                      "tub"
                                    )
                                  }
                                  className="border px-2 py-1 rounded text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="PO #"
                              value={details.poNumber || ""}
                              onChange={(e) =>
                                updateProductField(
                                  product.id,
                                  "poNumber",
                                  e.target.value
                                )
                              }
                              className="border px-2 py-1 rounded text-sm"
                            />
                          )}
                        </td>

                        {/* Label Type Input with Autocomplete */}
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw] font-semibold">
                          {product.imlType === "LID & TUB" ? (
                            <div className="flex flex-col gap-1 relative">
                              {/* Lid Label Type */}
                              <div className="flex gap-[1vw]">
                                <p>LID: </p>
                                <input
                                  type="text"
                                  placeholder="Label Type (Lid)"
                                  value={details.lid?.labelType || ""}
                                  onChange={(e) =>
                                    handleProductAutocomplete(
                                      product.id,
                                      "labelType",
                                      e.target.value,
                                      "lid"
                                    )
                                  }
                                  className="border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id &&
                                activeAutocomplete?.field ===
                                  "labelType-lid" && (
                                  <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto">
                                    {activeAutocomplete.options.map(
                                      (opt, i) => (
                                        <div
                                          key={i}
                                          onClick={() =>
                                            selectProductAutocomplete(
                                              product.id,
                                              "labelType",
                                              opt,
                                              "lid"
                                            )
                                          }
                                          className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                                        >
                                          {opt}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                              {/* Tub Label Type */}
                              <div className="flex gap-[.7vw]">
                                <p>TUB: </p>
                                <input
                                  type="text"
                                  placeholder="Label Type (Tub)"
                                  value={details.tub?.labelType || ""}
                                  onChange={(e) =>
                                    handleProductAutocomplete(
                                      product.id,
                                      "labelType",
                                      e.target.value,
                                      "tub"
                                    )
                                  }
                                  className="border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id &&
                                activeAutocomplete?.field ===
                                  "labelType-tub" && (
                                  <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto">
                                    {activeAutocomplete.options.map(
                                      (opt, i) => (
                                        <div
                                          key={i}
                                          onClick={() =>
                                            selectProductAutocomplete(
                                              product.id,
                                              "labelType",
                                              opt,
                                              "tub"
                                            )
                                          }
                                          className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                                        >
                                          {opt}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Label Type"
                                value={details.labelType || ""}
                                onChange={(e) =>
                                  handleProductAutocomplete(
                                    product.id,
                                    "labelType",
                                    e.target.value
                                  )
                                }
                                className="border px-2 py-1 rounded text-sm"
                              />
                              {activeAutocomplete?.productId === product.id &&
                                activeAutocomplete?.field === "labelType" && (
                                  <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto">
                                    {activeAutocomplete.options.map(
                                      (opt, i) => (
                                        <div
                                          key={i}
                                          onClick={() =>
                                            selectProductAutocomplete(
                                              product.id,
                                              "labelType",
                                              opt
                                            )
                                          }
                                          className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                                        >
                                          {opt}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
                        </td>

                        {/* Supplier Input with Autocomplete */}
                        <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw] font-semibold">
                          {product.imlType === "LID & TUB" ? (
                            <div className="flex flex-col gap-1 relative">
                              {/* Lid Supplier */}
                              <div className="flex gap-[1vw]">
                                <p>LID: </p>
                                <input
                                  type="text"
                                  placeholder="Supplier (Lid)"
                                  value={details.lid?.supplier || ""}
                                  onChange={(e) =>
                                    handleProductAutocomplete(
                                      product.id,
                                      "supplier",
                                      e.target.value,
                                      "lid"
                                    )
                                  }
                                  className="border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id &&
                                activeAutocomplete?.field ===
                                  "supplier-lid" && (
                                  <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto">
                                    {activeAutocomplete.options.map(
                                      (opt, i) => (
                                        <div
                                          key={i}
                                          onClick={() =>
                                            selectProductAutocomplete(
                                              product.id,
                                              "supplier",
                                              opt,
                                              "lid"
                                            )
                                          }
                                          className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                                        >
                                          {opt}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                              {/* Tub Supplier */}
                              <div className="flex gap-[.7vw]">
                                <p>TUB: </p>
                                <input
                                  type="text"
                                  placeholder="Supplier (Tub)"
                                  value={details.tub?.supplier || ""}
                                  onChange={(e) =>
                                    handleProductAutocomplete(
                                      product.id,
                                      "supplier",
                                      e.target.value,
                                      "tub"
                                    )
                                  }
                                  className="border px-2 py-1 rounded text-sm"
                                />
                              </div>
                              {activeAutocomplete?.productId === product.id &&
                                activeAutocomplete?.field ===
                                  "supplier-tub" && (
                                  <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto">
                                    {activeAutocomplete.options.map(
                                      (opt, i) => (
                                        <div
                                          key={i}
                                          onClick={() =>
                                            selectProductAutocomplete(
                                              product.id,
                                              "supplier",
                                              opt,
                                              "tub"
                                            )
                                          }
                                          className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                                        >
                                          {opt}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Supplier"
                                value={details.supplier || ""}
                                onChange={(e) =>
                                  handleProductAutocomplete(
                                    product.id,
                                    "supplier",
                                    e.target.value
                                  )
                                }
                                className="border px-2 py-1 rounded text-sm"
                              />
                              {activeAutocomplete?.productId === product.id &&
                                activeAutocomplete?.field === "supplier" && (
                                  <div className="absolute z-50 bg-white border rounded shadow max-h-40 overflow-y-auto">
                                    {activeAutocomplete.options.map(
                                      (opt, i) => (
                                        <div
                                          key={i}
                                          onClick={() =>
                                            selectProductAutocomplete(
                                              product.id,
                                              "supplier",
                                              opt
                                            )
                                          }
                                          className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                                        >
                                          {opt}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
                        </td>

                        {/* Action - View Button */}
                        <td className="border border-gray-300 px-[.5vw] py-[.5vw] text-center">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="px-[0.75vw] py-[0.35vw] bg-indigo-600 text-white rounded hover:bg-indigo-700 text-[.8vw] font-medium cursor-pointer transition-all"
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Apply to All Section - MOVED AFTER TABLE */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-300 p-[1vw] mb-[1vw]">
            <div className="flex justify-between items-center mb-[1vw]">
              <h3 className="text-[1vw] font-semibold text-amber-900">
                🎯 Apply to All Products
              </h3>
              <button
                onClick={handleApplyToAll}
                className="px-[1.2vw] py-[.5vw] bg-amber-600 text-white rounded-[0.5vw] font-semibold text-[.85vw] hover:bg-amber-700 transition-all shadow-md cursor-pointer"
              >
                Apply to All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[1.5vw]">
              {/* Global PO Number */}
              <div>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  PO Number
                </label>
                <input
                  type="text"
                  placeholder="Enter PO Number"
                  value={globalPONumber}
                  onChange={(e) => setGlobalPONumber(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Global Label Type */}
              <div className="relative" ref={globalLabelRef}>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Label Type
                </label>
                <input
                  type="text"
                  placeholder="Enter or Select"
                  value={globalLabelType}
                  onChange={(e) => handleGlobalLabelInput(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showGlobalLabelSuggestions &&
                  filteredGlobalLabels.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredGlobalLabels.map((type, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setGlobalLabelType(type);
                            setShowGlobalLabelSuggestions(false);
                          }}
                          className="px-[1vw] py-[0.6vw] hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-[.85vw] font-medium text-gray-800">
                            {type}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Global Supplier */}
              <div className="relative" ref={globalSupplierRef}>
                <label className="block text-[.85vw] font-medium text-gray-700 mb-[0.5vw]">
                  Supplier Name
                </label>
                <input
                  type="text"
                  placeholder="Enter or Select"
                  value={globalSupplier}
                  onChange={(e) => handleGlobalSupplierInput(e.target.value)}
                  className="w-full text-[.85vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showGlobalSupplierSuggestions &&
                  filteredGlobalSuppliers.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                      {filteredGlobalSuppliers.map((supplier, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setGlobalSupplier(supplier);
                            setShowGlobalSupplierSuggestions(false);
                          }}
                          className="px-[1vw] py-[0.6vw] hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-[.85vw] font-medium text-gray-800">
                            {supplier}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-[1vw] mt-[1.25vw]">
            <button
              onClick={handleBack}
              className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-[1.5vw] py-[.6vw] bg-green-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:bg-green-700 transition-all shadow-md cursor-pointer"
            >
              Save PO Details
            </button>
          </div>
        </div>
      </div>

      {/* View Product Modal */}
      {viewingProduct &&
        (() => {
          // Determine which quantities to show
          const hasLidQty =
            viewingProduct.lidLabelQty && viewingProduct.lidLabelQty > 0;
          const hasTubQty =
            viewingProduct.tubLabelQty && viewingProduct.tubLabelQty > 0;
          const showBoth = hasLidQty && hasTubQty;

          return (
            <div className="fixed inset-0 bg-[#00000096] bg-opacity-50 flex items-center justify-center z-50 p-[2vw]">
              <div className="bg-white rounded-[0.8vw] shadow-2xl max-w-[50vw] w-full max-h-[85vh] overflow-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-[1.5vw] py-[1vw] rounded-t-[0.8vw] flex justify-between items-center sticky top-0 z-10">
                  <h2 className="text-[1.3vw] font-bold">
                    Product Full Details
                  </h2>
                  <button
                    onClick={closeViewModal}
                    className="text-white hover:text-gray-200 text-[1.5vw] font-bold cursor-pointer w-[2vw] h-[2vw] flex items-center justify-center rounded-full hover:bg-white/20 transition-all"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-[1.5vw]">
                  {/* Product Basic Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw] mb-[1vw]">
                    <h3 className="text-[1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
                      <span className="text-[1.2vw]">📦</span> Product
                      Information
                    </h3>
                    <div className="grid grid-cols-2 gap-[1vw]">
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          Product Category
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                          {viewingProduct.productName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          Size
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                          {viewingProduct.size}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          IML Name
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800">
                          {viewingProduct.imlName}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          IML Type
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-semibold text-blue-800">
                          {viewingProduct.imlType}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Details - CONDITIONAL RENDERING */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw] mb-[1vw]">
                    <h3 className="text-[1vw] font-semibold text-green-900 mb-[1vw] flex items-center gap-2">
                      <span className="text-[1.2vw]">📊</span> Quantity
                      Information
                    </h3>

                    {showBoth ? (
                      // Show both LID and TUB in 2 rows
                      <div className="space-y-[1vw]">
                        {/* LID Row */}
                        <div>
                          <h4 className="text-[.9vw] font-semibold text-green-800 mb-[0.5vw] flex items-center gap-2">
                            <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[.75vw]">
                              LID
                            </span>
                          </h4>
                          <div className="grid grid-cols-3 gap-[1vw]">
                            <div>
                              <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                Label Order Qty
                              </label>
                              <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-green-700">
                                {viewingProduct.lidLabelQty || "0"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                Production Qty
                              </label>
                              <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-blue-700">
                                {viewingProduct.lidProductionQty || "0"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                Remaining Stock
                              </label>
                              <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-orange-700">
                                {viewingProduct.lidStock || "0"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* TUB Row */}
                        <div>
                          <h4 className="text-[.9vw] font-semibold text-green-800 mb-[0.5vw] flex items-center gap-2">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[.75vw]">
                              TUB
                            </span>
                          </h4>
                          <div className="grid grid-cols-3 gap-[1vw]">
                            <div>
                              <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                Label Order Qty
                              </label>
                              <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-green-700">
                                {viewingProduct.tubLabelQty || "0"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                Production Qty
                              </label>
                              <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-blue-700">
                                {viewingProduct.tubProductionQty || "0"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                Remaining Stock
                              </label>
                              <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-orange-700">
                                {viewingProduct.tubStock || "0"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show only LID or TUB
                      <div className="grid grid-cols-3 gap-[1vw]">
                        <div>
                          <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                            {hasLidQty
                              ? "LID Label Order Qty"
                              : "TUB Label Order Qty"}
                          </label>
                          <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-green-700">
                            {hasLidQty
                              ? viewingProduct.lidLabelQty || "0"
                              : viewingProduct.tubLabelQty || "0"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                            {hasLidQty
                              ? "LID Production Qty"
                              : "TUB Production Qty"}
                          </label>
                          <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-blue-700">
                            {hasLidQty
                              ? viewingProduct.lidProductionQty || "0"
                              : viewingProduct.tubProductionQty || "0"}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                            {hasLidQty
                              ? "LID Remaining Stock"
                              : "TUB Remaining Stock"}
                          </label>
                          <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-bold text-orange-700">
                            {hasLidQty
                              ? viewingProduct.lidStock || "0"
                              : viewingProduct.tubStock || "0"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[0.6vw] border-2 border-pink-200 p-[1vw] mb-[1vw]">
                    <h3 className="text-[1vw] font-semibold text-pink-900 mb-[1vw] flex items-center gap-2">
                      <span className="text-[1.2vw]">🎨</span> Color Information
                    </h3>
                    <div className="grid grid-cols-2 gap-[1vw]">
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          LID Color
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[.85vw] font-semibold capitalize bg-white px-[1vw] py-[.25vw] border border-gray-200 rounded">
                            {viewingProduct.lidColor || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          TUB Color
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[.85vw] font-semibold capitalize bg-white px-[1vw] py-[.25vw] border border-gray-200 rounded">
                            {viewingProduct.tubColor || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PO Details */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
                    <h3 className="text-[1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
                      <span className="text-[1.2vw]">📋</span> Purchase Order
                      Details
                    </h3>
                    <div className="grid grid-cols-3 gap-[1vw]">
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          PO Number
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                          {productPODetails[viewingProduct.id]?.poNumber ||
                            "Not Set"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          Label Type
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                          {productPODetails[viewingProduct.id]?.labelType ||
                            "Not Set"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                          Supplier Name
                        </label>
                        <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                          {productPODetails[viewingProduct.id]?.supplier ||
                            "Not Set"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-[1.5vw] py-[1vw] bg-gray-50 rounded-b-[0.8vw] flex justify-end border-t border-gray-200">
                  <button
                    onClick={closeViewModal}
                    className="px-[1.5vw] py-[.6vw] bg-gray-600 text-white rounded-[0.5vw] font-semibold text-[.9vw] hover:bg-gray-700 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default PODetails;
