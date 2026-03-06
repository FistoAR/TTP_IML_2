// Auto-extracted from OrdersManagement.jsx
import { Select, Input, DesignPreview } from "./OrderFormUtils";
import { useState, useEffect, useCallback } from "react";
import FileUploadBox from './FileUploadBox.jsx';

import design1PDF from "../../../../assets/pdf/design1.pdf";
import design2PDF from "../../../../assets/pdf/design1.pdf";
import design3PDF from "../../../../assets/pdf/design1.pdf";
// import design1PDF from "../../../assets/pdf/design1.pdf";
// import design2PDF from "../../../assets/pdf/design2.pdf";
// import design3PDF from "../../../assets/pdf/design3.pdf";

const OLD_DESIGN_FILES = [
  { id: 1, name: "Design 1", path: design1PDF, type: "pdf" },
  { id: 2, name: "Design 2", path: design2PDF, type: "pdf" },
  { id: 3, name: "Design 3", path: design3PDF, type: "pdf" },
];


export default function ChangeRequestModal({ changeRequestModal, setPreviewModal,
  handleCloseChangeRequest, handleSubmitRequest, handleDeleteRequest,
  getTodayDate, getAllowedIMLType, COLOR_OPTIONS, IMLNAME_OPTIONS }) {
if (
  !changeRequestModal.isOpen ||
  !changeRequestModal.order ||
  !changeRequestModal.product
)
  return null;

const { product, order: modalOrder } = changeRequestModal;
const [localProduct, setLocalProduct] = useState({ ...product });
const [pdfPreviews, setPdfPreviews] = useState({});

  const findMatchingProductsInOrder = (currentProduct, order, currentProductId) => {
  if (!currentProduct.productName || !currentProduct.size || !currentProduct.imlType || !currentProduct.imlName) {
    return [];
  }
  
  // Get the index of the current product
  const currentIndex = order.products.findIndex(p => p.id === currentProductId);
  
  return order.products.filter((p, idx) => 
    idx < currentIndex && // Only products with lower index (earlier in the list)
    p.id !== currentProduct.id &&
    p.productName === currentProduct.productName &&
    p.size === currentProduct.size &&
    p.imlType === currentProduct.imlType &&
    p.imlName === currentProduct.imlName
  );
};

// Pass the current product ID to the function
const matchingProducts = findMatchingProductsInOrder(localProduct, modalOrder, localProduct.id);
const hasMatchingProducts = matchingProducts.length > 0;

// Check if design is approved and designSharedMail is false (showing approve date)
const showLinkedDesignOption = hasMatchingProducts && 
  localProduct.designStatus === "approved" && 
  !localProduct.designSharedMail;

// NEW: Handle linked design toggle
const handleLinkedDesignToggle = (checked) => {
  if (checked) {
    // Find the first matching product to link to
    if (matchingProducts.length > 0) {
      const sourceProduct = matchingProducts[0];
      const sourceIndex = modalOrder.products.findIndex(p => p.id === sourceProduct.id);
      
      // Copy design from source product
      setLocalProduct(prev => ({
        ...prev,
        useLinkedDesign: true,
        linkedDesignSource: {
          productId: sourceProduct.id,
          productIndex: sourceIndex + 1 // +1 for display
        },
        // Copy design fields
        designType: sourceProduct.designType,
        lidDesignFile: sourceProduct.lidDesignFile,
        lidSelectedOldDesign: sourceProduct.lidSelectedOldDesign,
        tubDesignFile: sourceProduct.tubDesignFile,
        tubSelectedOldDesign: sourceProduct.tubSelectedOldDesign,
        designStatus: sourceProduct.designStatus,
        orderStatus: sourceProduct.orderStatus,
        approvedDate: sourceProduct.approvedDate,
        designSharedMail: sourceProduct.designSharedMail,
        singleImlDesign: sourceProduct.singleImlDesign,
      }));
    }
  } else {
    // ✅ UNLINK - Clear ALL design fields back to defaults
    setLocalProduct(prev => ({
      ...prev,
      useLinkedDesign: false,
      linkedDesignSource: null,
      // Clear all design files
      lidDesignFile: null,
      tubDesignFile: null,
      // Clear existing design selections
      lidSelectedOldDesign: null,
      tubSelectedOldDesign: null,
      // Reset design type back to "new"
      designType: "new",
      // Keep status as approved but clear the date to today
      designStatus: "approved",
      orderStatus: "Artwork Approved",
      approvedDate: getTodayDate(),
      designSharedMail: false,
      singleImlDesign: false,
    }));
  }
};


const updateProductWithDesignStatus = useCallback((id, field, value) => {
  setLocalProduct((prev) => {
    const updates = { [field]: value };

    // Auto-approve existing designs
    if (
      field === "lidSelectedOldDesign" ||
      field === "tubSelectedOldDesign"
    ) {
      updates.designStatus = "approved";
      updates.orderStatus = "Artwork Approved";
      updates.approvedDate = getTodayDate();
    }
    
    // If uploading a new design file, auto-approve
    if ((field === 'lidDesignFile' || field === 'tubDesignFile') && value) {
      updates.designStatus = 'approved';
      updates.orderStatus = 'Artwork Approved';
      updates.approvedDate = getTodayDate();
      
      // Clear the old design selection for the same part
      if (field === 'lidDesignFile') {
        updates.lidSelectedOldDesign = null;
      }
      if (field === 'tubDesignFile') {
        updates.tubSelectedOldDesign = null;
      }
    }

    console.log("Updated field:", field, "to:", value);
    return { ...prev, ...updates };
  });
}, []);

const generatePdfThumbnail = async (file, previewId) => {
  try {
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      try {
        const typedArray = new Uint8Array(this.result);
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          cMapUrl:
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
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
          cMapUrl:
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
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
    (design) => design.type === "pdf",
  );
  pdfDesigns.forEach((design) => {
    if (!pdfPreviews[`old-${design.id}`]) {
      generatePdfThumbnailFromUrl(design.path, `old-${design.id}`);
    }
  });
}, []);

// Reset local state when product changes
useEffect(() => {
  setLocalProduct({ ...product });
}, [product]);

// Update local field
const updateLocalField = (field, value) => {
  // Don't allow updates to design fields if linked
  const designFields = [
    'lidDesignFile', 'tubDesignFile', 'lidSelectedOldDesign', 'tubSelectedOldDesign',
    'designType', 'designStatus', 'singleImlDesign', 'designSharedMail'
  ];
  
  if (localProduct.useLinkedDesign && designFields.includes(field)) {
    console.log('Cannot update design fields when linked');
    return;
  }
  
  setLocalProduct((prev) => ({ ...prev, [field]: value }));
};

// Autocomplete handlers - FIXED with local state
const [filteredImlNames, setFilteredImlNames] = useState([]);
const [showImlNameSuggestions, setShowImlNameSuggestions] = useState(false);
const [filteredLidColors, setFilteredLidColors] = useState([]);
const [showLidColorSuggestions, setShowLidColorSuggestions] =
  useState(false);
const [filteredTubColors, setFilteredTubColors] = useState([]);
const [showTubColorSuggestions, setShowTubColorSuggestions] =
  useState(false);

const handleImlNameInput = (value) => {
  updateLocalField("imlName", value);
  if (!value.trim()) {
    setShowImlNameSuggestions(false);
    setFilteredImlNames([]);
    return;
  }
  const filtered = IMLNAME_OPTIONS.filter((name) =>
    name.toLowerCase().includes(value.toLowerCase()),
  );
  setFilteredImlNames(filtered);
  setShowImlNameSuggestions(filtered.length > 0);
};

const handleImlNameSelect = (name) => {
  updateLocalField("imlName", name);
  setShowImlNameSuggestions(false);
  setFilteredImlNames([]);
};

const handleLidColorInput = (value) => {
  updateLocalField("lidColor", value);
  if (!value.trim()) {
    setShowLidColorSuggestions(false);
    setFilteredLidColors([]);
    return;
  }
  const filtered = COLOR_OPTIONS.filter((color) =>
    color.toLowerCase().includes(value.toLowerCase()),
  );
  setFilteredLidColors(filtered);
  setShowLidColorSuggestions(filtered.length > 0);
};

const handleLidColorSelect = (color) => {
  updateLocalField("lidColor", color);
  setShowLidColorSuggestions(false);
  setFilteredLidColors([]);
};

const handleTubColorInput = (value) => {
  updateLocalField("tubColor", value);
  if (!value.trim()) {
    setShowTubColorSuggestions(false);
    setFilteredTubColors([]);
    return;
  }
  const filtered = COLOR_OPTIONS.filter((color) =>
    color.toLowerCase().includes(value.toLowerCase()),
  );
  setFilteredTubColors(filtered);
  setShowTubColorSuggestions(filtered.length > 0);
};

const handleTubColorSelect = (color) => {
  updateLocalField("tubColor", color);
  setShowTubColorSuggestions(false);
  setFilteredTubColors([]);
};

// Click outside handler - SIMPLIFIED (no refs needed)
useEffect(() => {
  const handleClickOutside = (event) => {
    const modal = event.target.closest(".fixed.inset-0");
    if (modal) return; // Click inside modal

    setShowImlNameSuggestions(false);
    setShowLidColorSuggestions(false);
    setShowTubColorSuggestions(false);
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Automatic Stock Calculation
useEffect(() => {
  const calculateStock = (labelQty, prodQty) => {
    return Math.max(0, (parseInt(labelQty || 0) - parseInt(prodQty || 0)));
  };

  if (localProduct.imlType === "LID & TUB") {
    const newLidStock = calculateStock(localProduct.lidLabelQty, localProduct.lidProductionQty);
    const newTubStock = calculateStock(localProduct.tubLabelQty, localProduct.tubProductionQty);

    if (localProduct.lidStock !== newLidStock) updateLocalField("lidStock", newLidStock);
    if (localProduct.tubStock !== newTubStock) updateLocalField("tubStock", newTubStock);
  } else {
    const labelQty = localProduct.imlType === "LID" ? localProduct.lidLabelQty : localProduct.tubLabelQty;
    const prodQty = localProduct.imlType === "LID" ? localProduct.lidProductionQty : localProduct.tubProductionQty;
    const newStock = calculateStock(labelQty, prodQty);

    const stockField = localProduct.imlType === "LID" ? "lidStock" : "tubStock";
    if (localProduct[stockField] !== newStock) updateLocalField(stockField, newStock);
  }
}, [
  localProduct.imlType,
  localProduct.lidLabelQty,
  localProduct.lidProductionQty,
  localProduct.tubLabelQty,
  localProduct.tubProductionQty
]);

const isEditMode = sessionStorage.getItem("isEditMode") === "true";

return (
  <div className="fixed inset-0 bg-[#000000b3] z-[50000] flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-[50%] w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
        <h2 className="text-[1.25vw] font-semibold text-gray-800">
          {isEditMode ? "Edit ": "Change Request "}- {product.productName} {product.size}
        </h2>
        <button
          onClick={handleCloseChangeRequest}
          className="text-gray-500 hover:text-gray-800 text-[2vw] font-bold cursor-pointer"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Product Name & Size - FIXED clickable */}
        <div className="grid grid-cols-2 gap-[1.5vw] mb-6">
          <Input
            label="Product Name"
            value={localProduct.productName || ""}
            disabled={true}
            onChange={(e) =>
              updateLocalField("productName", e.target.value)
            }
          />
          <Input
            label="Size"
            value={localProduct.size || ""}
            disabled={true}
            onChange={(e) => updateLocalField("size", e.target.value)}
          />
        </div>

        {/* IML Type Dropdown & IML Name Autocomplete */}
        <div className="grid grid-cols-2 gap-[1.5vw] mb-6">
          <Select
            label="IML Type"
            value={localProduct.imlType || ""}
            onChange={(e) => updateLocalField("imlType", e.target.value)}
            options={getAllowedIMLType(localProduct.productName, localProduct.size)}
            placeholder="Select IML Type"
          />
          <div className="relative">
            <Input
              label="IML Name"
              required
              value={localProduct.imlName || ""}
              onChange={(e) => handleImlNameInput(e.target.value)}
              placeholder="Enter or Select IML Name"
            />
            {showImlNameSuggestions && filteredImlNames.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                {filteredImlNames.map((name, index) => (
                  <div
                    key={index}
                    onClick={() => handleImlNameSelect(name)}
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

        {/* Colors Autocomplete */}
        <div className="grid grid-cols-2 gap-[1.5vw] mb-6">
          <div className="relative">
            <Input
              label="LID Color"
              value={localProduct.lidColor || ""}
              onChange={(e) => handleLidColorInput(e.target.value)}
              placeholder="Enter or Select Color"
            />
            {showLidColorSuggestions && filteredLidColors.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                {filteredLidColors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => handleLidColorSelect(color)}
                    className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-[0.5vw]"
                  >
                    <p className="text-[0.85vw] font-medium text-gray-800 capitalize">
                      {color}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <Input
              label="TUB Color"
              value={localProduct.tubColor || ""}
              onChange={(e) => handleTubColorInput(e.target.value)}
              placeholder="Enter or Select Color"
            />
            {showTubColorSuggestions && filteredTubColors.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-[0.5vw] mt-[0.25vw] shadow-lg max-h-[12vw] overflow-y-auto">
                {filteredTubColors.map((color, index) => (
                  <div
                    key={index}
                    onClick={() => handleTubColorSelect(color)}
                    className="px-[1vw] py-[0.6vw] hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-[0.5vw]"
                  >
                    <p className="text-[0.85vw] font-medium text-gray-800 capitalize">
                      {color}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quantities Section - Conditional based on IML Type */}
        {localProduct.imlType === "LID & TUB" ? (
          <>
            {/* LID Quantities */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="text-[0.9vw] font-semibold text-blue-800 mb-[0.75vw]">
                LID Quantities
              </h4>
              <div className="grid grid-cols-3 gap-[1.5vw]">
                <Input
                  label="Labels Order Qty (LID)"
                  required
                  placeholder="Enter Label Quantity"
                  value={localProduct.lidLabelQty || ""}
                  onChange={(e) =>
                    updateLocalField("lidLabelQty", e.target.value)
                  }
                  type="number"
                />
                <Input
                  label="Production Qty (LID)"
                  required
                  placeholder="Enter Production Quantity"
                  value={localProduct.lidProductionQty || ""}
                  onChange={(e) =>
                    updateLocalField("lidProductionQty", e.target.value)
                  }
                  type="number"
                />
                <Input
                  label="Stock (LID)"
                  placeholder="Stock"
                  value={localProduct.lidStock || ""}
                  disabled={true}
                />
              </div>
            </div>

            {/* TUB Quantities */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-[0.9vw] font-semibold text-green-800 mb-[0.75vw]">
                TUB Quantities
              </h4>
              <div className="grid grid-cols-3 gap-[1.5vw]">
                <Input
                  label="Labels Order Qty (TUB)"
                  required
                  placeholder="Enter Label Quantity"
                  value={localProduct.tubLabelQty || ""}
                  onChange={(e) =>
                    updateLocalField("tubLabelQty", e.target.value)
                  }
                  type="number"
                />
                <Input
                  label="Production Qty (TUB)"
                  required
                  placeholder="Enter Production Quantity"
                  value={localProduct.tubProductionQty || ""}
                  onChange={(e) =>
                    updateLocalField("tubProductionQty", e.target.value)
                  }
                  type="number"
                />
                <Input
                  label="Stock (TUB)"
                  placeholder="Stock"
                  value={localProduct.tubStock || ""}
                  disabled={true}
                />
              </div>
            </div>
          </>
        ) : (
          /* Single IML Type Quantities */
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-[1vw] font-semibold text-blue-900 mb-4">
              {localProduct.imlType} Quantities
            </h3>
            <div className="grid grid-cols-3 gap-[1.5vw]">
              <Input
                label={`Labels Order Qty (${localProduct.imlType})`}
                required
                placeholder="Enter Label Quantity"
                value={
                  localProduct.imlType === "LID"
                    ? localProduct.lidLabelQty || ""
                    : localProduct.tubLabelQty || ""
                }
                onChange={(e) => {
                  const field =
                    localProduct.imlType === "LID"
                      ? "lidLabelQty"
                      : "tubLabelQty";
                  updateLocalField(field, e.target.value);
                }}
                type="number"
              />
              <Input
                label={`Production Qty (${localProduct.imlType})`}
                required
                placeholder="Enter Production Quantity"
                value={
                  localProduct.imlType === "LID"
                    ? localProduct.lidProductionQty || ""
                    : localProduct.tubProductionQty || ""
                }
                onChange={(e) => {
                  const field =
                    localProduct.imlType === "LID"
                      ? "lidProductionQty"
                      : "tubProductionQty";
                  updateLocalField(field, e.target.value);
                }}
                type="number"
              />
              <Input
                label={`Stock (${localProduct.imlType})`}
                placeholder="Stock"
                value={
                  localProduct.imlType === "LID"
                    ? localProduct.lidStock || ""
                    : localProduct.tubStock || ""
                }
                disabled={true}
              />
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw] mb-[0] relative">
          {/* Design Type Toggle - Conditional Display */}
          <div className="flex justify-end gap-[0.8vw] mb-[1vw] absolute top-[1vw] right-[1vw]">
            <button
              onClick={() => {
                if (localProduct.useLinkedDesign) return;
                updateLocalField("designType", "existing");
                updateLocalField("lidDesignFile", null);
                updateLocalField("tubDesignFile", null);

                setTimeout(() => {
                  console.info(`Product type: ${localProduct.designType}`);
                }, 500);
              }}
              className={`px-[2vw] py-[0.6vw] rounded-[0.4vw] cursor-pointer text-[0.85vw] font-medium transition-all duration-200 ${
                localProduct.designType === "existing"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${localProduct.useLinkedDesign ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={localProduct.useLinkedDesign}
            >
              Existing Design
            </button>

            <button
              onClick={() => {
                if (localProduct.useLinkedDesign) return;
                updateLocalField("designType", "new");
                updateLocalField("lidSelectedOldDesign", null);
                updateLocalField("tubSelectedOldDesign", null);
                updateLocalField("lidDesignFile", null);
                updateLocalField("tubDesignFile", null);
              }}
              className={`px-[2vw] py-[0.6vw] rounded-[0.4vw] cursor-pointer text-[0.85vw] font-medium transition-all duration-200 ${
                localProduct.designType === "new"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${localProduct.useLinkedDesign ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={localProduct.useLinkedDesign}
            >
              New Design
            </button>
          </div>
          <h3 className="text-[1vw] font-semibold text-purple-900 mb-[1vw]">
            Design Selection
          </h3>

          {(localProduct.imlType === "LID & TUB" && !localProduct.designSharedMail) && (
            <label className="flex items-center gap-[0.6vw] mb-[1vw] font-medium text-gray-700 cursor-pointer text-[.85vw]">
              <input
                type="checkbox"
                checked={localProduct.singleImlDesign || false}
                onChange={(e) =>
                  !localProduct.useLinkedDesign && updateLocalField(
                    "singleImlDesign",
                    e.target.checked,
                  )
                }
                disabled={localProduct.useLinkedDesign}
                className="w-[1.1vw] h-[1.1vw]"
              />
              <span>Select Single IML Design for LID & TUB</span>
            </label>
          )}

          {/* NEW: Link to existing product checkbox - only show if design is approved and not shared in mail */}
          {showLinkedDesignOption && !localProduct.useLinkedDesign && (
            <div className="mb-[1vw] mt-[1.5vw] p-[0.8vw] bg-blue-50 border border-blue-300 rounded-lg">
              <label className="flex items-center gap-[0.6vw] cursor-pointer">
                <input
                  type="checkbox"
                  checked={localProduct.useLinkedDesign || false}
                  onChange={(e) => handleLinkedDesignToggle(e.target.checked)}
                  className="w-[1.1vw] h-[1.1vw] text-blue-600"
                />
                <span className="text-[0.9vw] font-medium text-blue-800">
                  Use same design as Product #{modalOrder.products.findIndex(p => p.id === matchingProducts[0].id) + 1}
                </span>
              </label>
              <p className="text-[0.75vw] text-blue-600 mt-[0.3vw] ml-[1.7vw]">
                This will link to: {matchingProducts[0].productName} - {matchingProducts[0].size} ({matchingProducts[0].imlType})
              </p>
            </div>
          )}

          {/* Show linked design info if enabled */}
          {localProduct.useLinkedDesign && localProduct.linkedDesignSource && (
            <div className="mb-[1vw] mt-[1.5vw] p-[0.8vw] bg-green-50 border border-green-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[0.6vw]">
                  <svg className="w-[1.2vw] h-[1.2vw] text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-[0.9vw] font-medium text-green-800">
                    Using design from Product #{localProduct.linkedDesignSource.productIndex}
                  </span>
                </div>
                <button
                  onClick={() => handleLinkedDesignToggle(false)}
                  className="text-[0.75vw] text-red-600 hover:text-red-800 underline cursor-pointer"
                >
                  Unlink
                </button>
              </div>
            </div>
          )}

          {localProduct.designType === "existing" ? (
            <div>
              {/* For LID & TUB - Show two separate design selections */}

              {localProduct.imlType === "LID & TUB" ? (
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
                                  !localProduct.useLinkedDesign && updateProductWithDesignStatus(
                                    localProduct.id,
                                    "lidSelectedOldDesign",
                                    file.id,
                                  )
                                }
                              >
                                <div
                                  className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                    localProduct.lidSelectedOldDesign === file.id
                                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                                      : "border-gray-300"
                                    } overflow-hidden ${
                                      localProduct.useLinkedDesign ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-blue-400"
                                    } transition-all`}
                                >
                                  {file.type === "pdf" ? (
                                    pdfPreviews[`old-${file.id}`] ? (
                                      <img
                                        src={pdfPreviews[`old-${file.id}`]}
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
                                    name={`lid-design-${localProduct.id}`}
                                    checked={
                                      localProduct.lidSelectedOldDesign === file.id
                                    }
                                    onChange={() =>
                                      !localProduct.useLinkedDesign && updateProductWithDesignStatus(
                                        localProduct.id,
                                        "lidSelectedOldDesign",
                                        file.id,
                                      )
                                    }
                                    disabled={localProduct.useLinkedDesign}
                                    onClick={(e) => {
                                      if (
                                        file.type === "pdf" &&
                                        !pdfPreviews[`old-${file.id}`]
                                      ) {
                                        generatePdfThumbnailFromUrl(
                                          file.path,
                                          `old-${file.id}`,
                                        );
                                      }
                                    }}
                                    className="w-[0.9vw] h-[0.9vw] cursor-pointer disabled:cursor-not-allowed"
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
                      {localProduct.lidSelectedOldDesign && (
                        <div className="h-[85.5%]">
                          <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                            LID Design Preview
                          </label>
                          <div className="border-2 relative border-blue-300 rounded-[0.6vw] p-1vw bg-blue-50 flex items-center justify-center h-full">
                            {(() => {
                              const selectedFile = OLD_DESIGN_FILES.find(
                                (f) =>
                                  f.id === localProduct.lidSelectedOldDesign,
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
                  {!localProduct.singleImlDesign && (
                    <div className="grid grid-cols-2 gap-[1vw] mt-[1vw]">
                      <div>
                        <label className="block text-[0.9vw] font-medium text-purple-700 mb-[0.75vw]">
                          Select TUB Design{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-purple-300 rounded-[0.6vw] p-[1vw] bg-white">
                          <div className="grid grid-cols-3 gap-[1.5vw]">
                            {OLD_DESIGN_FILES.map((file) => (
                              <div
                                key={file.id}
                                className="text-center"
                                onClick={() =>
                                  !localProduct.useLinkedDesign && updateProductWithDesignStatus(
                                    localProduct.id,
                                    "tubSelectedOldDesign",
                                    file.id,
                                  )
                                }
                              >
                                <div
                                  className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                    localProduct.tubSelectedOldDesign === file.id
                                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300"
                                      : "border-gray-300"
                                    } overflow-hidden ${
                                      localProduct.useLinkedDesign ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-purple-400"
                                    } transition-all`}
                                >
                                  {file.type === "pdf" ? (
                                    pdfPreviews[`old-${file.id}`] ? (
                                      <img
                                        src={pdfPreviews[`old-${file.id}`]}
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
                                    name={`tub-design-${localProduct.id}`}
                                    checked={
                                      localProduct.tubSelectedOldDesign === file.id
                                    }
                                    onChange={() =>
                                      !localProduct.useLinkedDesign && updateProductWithDesignStatus(
                                        localProduct.id,
                                        "tubSelectedOldDesign",
                                        file.id,
                                      )
                                    }
                                    disabled={localProduct.useLinkedDesign}
                                    onClick={(e) => {
                                      if (
                                        file.type === "pdf" &&
                                        !pdfPreviews[`old-${file.id}`]
                                      ) {
                                        generatePdfThumbnailFromUrl(
                                          file.path,
                                          `old-${file.id}`,
                                        );
                                      }
                                    }}
                                    className="w-[0.9vw] h-[0.9vw] cursor-pointer disabled:cursor-not-allowed"
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
                        {localProduct.tubSelectedOldDesign && (
                          <div className="h-full">
                            <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.75vw]">
                              TUB Design Preview
                            </label>
                            <div className="border-2 relative border-purple-300 rounded-[0.6vw] p-[1vw] bg-purple-50 flex items-center justify-center h-[84%]">
                              {(() => {
                                const selectedFile = OLD_DESIGN_FILES.find(
                                  (f) =>
                                    f.id === localProduct.tubSelectedOldDesign,
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
                  )}
                </div>
              ) : (
                /* Single Design Selection for LID or TUB only */
                <div className="grid grid-cols-2 gap-[1vw]">
                  <div>
                    <label className="block text-[0.9vw] font-medium text-purple-700 mb-[0.75vw]">
                      Select Design <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-purple-300 rounded-[0.6vw] p-[1vw] bg-white">
                      <div className="grid grid-cols-3 gap-[1.5vw]">
                        {OLD_DESIGN_FILES.map((file) => (
                          <div
                            key={file.id}
                            className="text-center"
                            onClick={() =>
                              !localProduct.useLinkedDesign && updateProductWithDesignStatus(
                                localProduct.id,
                                "lidSelectedOldDesign",
                                file.id,
                              )
                            }
                          >
                            <div
                              className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                localProduct.lidSelectedOldDesign === file.id
                                  ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300"
                                  : "border-gray-300"
                                } overflow-hidden ${
                                  localProduct.useLinkedDesign ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-purple-400"
                                } transition-all`}
                            >
                              {/* Image/PDF Preview */}
                              {file.type === "pdf" ? (
                                pdfPreviews[`old-${file.id}`] ? (
                                  <img
                                    src={pdfPreviews[`old-${file.id}`]}
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
                                name={`design-${localProduct.id}`}
                                checked={
                                  localProduct.lidSelectedOldDesign === file.id
                                }
                                onChange={() =>
                                  !localProduct.useLinkedDesign && updateProductWithDesignStatus(
                                    localProduct.id,
                                    "lidSelectedOldDesign",
                                    file.id,
                                  )
                                }
                                disabled={localProduct.useLinkedDesign}
                                onClick={(e) => {
                                  if (
                                    file.type === "pdf" &&
                                    !pdfPreviews[`old-${file.id}`]
                                  ) {
                                    generatePdfThumbnailFromUrl(
                                      file.path,
                                      `old-${file.id}`,
                                    );
                                  }
                                }}
                                className="w-[0.9vw] h-[0.9vw] cursor-pointer disabled:cursor-not-allowed"
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
                    {localProduct.lidSelectedOldDesign && (
                      <div>
                        <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                          Selected Design Preview
                        </label>
                        <div className="border-2 relative border-purple-300 rounded-[0.6vw] p-[1vw] bg-purple-50 flex items-center justify-center">
                          {(() => {
                            const selectedFile = OLD_DESIGN_FILES.find(
                              (f) => f.id === localProduct.lidSelectedOldDesign,
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
              {!localProduct.useLinkedDesign && (
                <div className="mb-[1.25vw]">
                  <label className="flex items-center gap-[0.6vw] text-[0.85vw] text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localProduct.designSharedMail}
                      onChange={(e) => {
                        if (localProduct.useLinkedDesign) return;
                        updateLocalField("designSharedMail", e.target.checked);
                        const newValue = e.target.checked
                          ? "pending"
                          : "approved";
                        updateLocalField("designStatus", newValue);

                        const productIsPOUpdated =
                          localProduct.orderStatus &&
                          localProduct.orderStatus !== "Artwork Pending" &&
                          localProduct.orderStatus !== "Artwork Approved";
                        const orderStatusV = e.target.checked
                          ? "Artwork Pending"
                          : "Artwork Approved";
                        if (!productIsPOUpdated) {
                          updateLocalField("orderStatus", orderStatusV);
                        }
                      }}
                      disabled={localProduct.useLinkedDesign}
                      className="w-[1.1vw] h-[1.1vw] cursor-pointer"
                    />
                    <span className="text-[0.85vw] font-medium">
                      Design Shared In Mail On Last Meeting
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-3 gap-[2vw]">
                <div>
                  <Select
                    label="Design Status"
                    required
                    placeholder="Select Status"
                    options={
                      localProduct.designSharedMail
                        ? ["Pending"] // Checked → ONLY Pending
                        : ["Approved"] // Unchecked → ONLY Approved
                    }
                    value={
                      localProduct.designStatus === "pending"
                        ? "Pending"
                        : localProduct.designStatus === "approved"
                          ? "Approved"
                          : ""
                    }
                    onChange={(e) => {
                      if (localProduct.useLinkedDesign) return;
                      const newValue = e.target.value.toLowerCase();
                      updateLocalField("designStatus", newValue);
                    }}
                  />
                </div>

                {localProduct.designStatus === "approved" && (
                  <div>
                    <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                      Approve Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={localProduct.approvedDate}
                      onChange={(e) =>
                        !localProduct.useLinkedDesign && updateLocalField("approvedDate", e.target.value)
                      }
                      disabled={localProduct.useLinkedDesign}
                      className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Design Upload Section - Conditional based on imlType */}
              {(localProduct.designStatus === "approved" ||
                !localProduct.designSharedMail) && (
                  <div className="mt-[1vw]">
                    {localProduct.imlType === "LID & TUB" ? (
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
                              <div className="relative">
                                <FileUploadBox
                                  file={localProduct.lidDesignFile}
                                  onFileChange={(file) => {
                                    if (localProduct.useLinkedDesign) return;
                                    updateLocalField("lidDesignFile", file);
                                    if (file?.type === "application/pdf") {
                                      generatePdfThumbnail(
                                        file,
                                        `${localProduct.id}-lid`,
                                      );
                                    }
                                  }}
                                  productId={`${localProduct.id}-lid`}
                                  small
                                  disabled={localProduct.useLinkedDesign}
                                />
                                {localProduct.useLinkedDesign && (
                                  <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex flex-col items-center justify-center gap-[0.3vw] border-2 border-gray-300 border-dashed cursor-not-allowed z-10">
                                    <svg className="w-[1.4vw] h-[1.4vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-[0.72vw] text-gray-500 font-medium text-center px-[0.5vw]">Locked — Unlink to change</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              {localProduct.lidDesignFile && (
                                <DesignPreview
                                  file={localProduct.lidDesignFile}
                                  productId={`${localProduct.id}-lid`}
                                  pdfPreviews={pdfPreviews}
                                  setPreviewModal={setPreviewModal}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* TUB Design Upload - Optional */}
                        {!localProduct.singleImlDesign && (
                          <div>
                            <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
                              Upload TUB Design File{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-[2vw]">
                              <div>
                                <div className="relative">
                                <FileUploadBox
                                  file={localProduct.tubDesignFile}
                                  onFileChange={(file) => {
                                    if (localProduct.useLinkedDesign) return;
                                    updateLocalField("tubDesignFile", file);
                                    if (file?.type === "application/pdf") {
                                      generatePdfThumbnail(
                                        file,
                                        `${localProduct.id}-tub`,
                                      );
                                    }
                                  }}
                                  productId={`${localProduct.id}-tub`}
                                  small
                                  disabled={localProduct.useLinkedDesign}
                                />
                                {localProduct.useLinkedDesign && (
                                  <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex flex-col items-center justify-center gap-[0.3vw] border-2 border-gray-300 border-dashed cursor-not-allowed z-10">
                                    <svg className="w-[1.4vw] h-[1.4vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-[0.72vw] text-gray-500 font-medium text-center px-[0.5vw]">Locked — Unlink to change</span>
                                  </div>
                                )}
                                </div>
                              </div>
                              <div>
                                {localProduct.tubDesignFile && (
                                  <DesignPreview
                                    file={localProduct.tubDesignFile}
                                    productId={`${localProduct.id}-tub`}
                                    pdfPreviews={pdfPreviews}
                                    setPreviewModal={setPreviewModal}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
                            <div className="relative">
                            <FileUploadBox
                              file={localProduct.lidDesignFile}
                              onFileChange={(file) => {
                                if (localProduct.useLinkedDesign) return;
                                updateLocalField(
                                  "lidDesignFile",
                                  file,
                                );
                                if (file && file.type === "application/pdf") {
                                  generatePdfThumbnail(file, localProduct.id);
                                }
                              }}
                              productId={localProduct.id}
                              small
                              disabled={localProduct.useLinkedDesign}
                            />
                            {localProduct.useLinkedDesign && (
                              <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex flex-col items-center justify-center gap-[0.3vw] border-2 border-gray-300 border-dashed cursor-not-allowed z-10">
                                <svg className="w-[1.4vw] h-[1.4vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-[0.72vw] text-gray-500 font-medium text-center px-[0.5vw]">Locked — Unlink to change</span>
                              </div>
                            )}
                            </div>
                          </div>
                          <div>
                            {localProduct.lidDesignFile && (
                              <DesignPreview
                                file={localProduct.lidDesignFile}
                                productId={localProduct.id}
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
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-300 bg-gray-50">
        <button
          onClick={handleCloseChangeRequest}
          className="px-6 py-2 bg-gray-300 text-gray-700 text-[.9vw] rounded cursor-pointer hover:bg-gray-400 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteRequest}
          className="px-6 py-2 bg-red-600 text-white text-[.9vw] cursor-pointer rounded hover:bg-red-700 font-medium"
        >
          Delete
        </button>
        <button
          onClick={() => {
            // Validation Logic - skip design validation if linked
            const validateChangeRequest = (prod) => {
              // 1. IML Name Validation
              if (!prod.imlName) {
                alert("Please enter IML Name.");
                return false;
              }

              // 2. Quantity & Stock Validation
              if (prod.imlType === "LID & TUB") {
                if (!prod.lidLabelQty || !prod.lidProductionQty || !prod.tubLabelQty || !prod.tubProductionQty) {
                  alert("Please enter all Label and Production quantities for LID & TUB.");
                  return false;
                }
                if (Number(prod.lidLabelQty) < Number(prod.lidProductionQty)) {
                  alert("LID: Please enter valid order and production quantity (Order Qty cannot be less than Production Qty).");
                  return false;
                }
                if (Number(prod.tubLabelQty) < Number(prod.tubProductionQty)) {
                  alert("TUB: Please enter valid order and production quantity (Order Qty cannot be less than Production Qty).");
                  return false;
                }
              } else {
                const labelQty = prod.imlType === "LID" ? prod.lidLabelQty : prod.tubLabelQty;
                const prodQty = prod.imlType === "LID" ? prod.lidProductionQty : prod.tubProductionQty;

                if (!labelQty || !prodQty) {
                  alert(`Please enter Label and Production quantities for ${prod.imlType}.`);
                  return false;
                }
                if (Number(labelQty) < Number(prodQty)) {
                  alert(`${prod.imlType}: Please enter valid order and production quantity (Order Qty cannot be less than Production Qty).`);
                  return false;
                }
              }

              // 3. Design Validation - ONLY if NOT using linked design
              if (!prod.useLinkedDesign) {
                if (prod.designType === "existing") {
                  if (prod.imlType === "LID & TUB" && !prod.singleImlDesign) {
                    if (!prod.lidSelectedOldDesign) {
                      alert("Please select a LID design.");
                      return false;
                    }
                    if (!prod.tubSelectedOldDesign) {
                      alert("Please select a TUB design.");
                      return false;
                    }
                  } else {
                    if (!prod.lidSelectedOldDesign) {
                      alert("Please select a design.");
                      return false;
                    }
                  }
                } else if (prod.designType === "new") {
                  if (prod.designStatus === "approved") {
                    if (!prod.approvedDate) {
                      alert("Please select an approval date.");
                      return false;
                    }
                    if (prod.imlType === "LID & TUB" && !prod.singleImlDesign) {
                      if (!prod.lidDesignFile) {
                        alert("Please upload a LID design file.");
                        return false;
                      }
                      if (!prod.tubDesignFile) {
                        alert("Please upload a TUB design file.");
                        return false;
                      }
                    } else if (prod.imlType === "LID") {
                      if (!prod.lidDesignFile) {
                        alert("Please upload a design file.");
                        return false;
                      }
                    } else if (prod.imlType === "TUB") {
                      // ✅ FIX: For TUB type, check both lidDesignFile and tubDesignFile
                      if (!prod.lidDesignFile && !prod.tubDesignFile) {
                        alert("Please upload a design file for TUB.");
                        return false;
                      }
                    }
                  }
                }
              } else {
                // When using linked design, show info message
                console.log('Using linked design - skipping design validation');
              }
              return true;
            };

            if (validateChangeRequest(localProduct)) {
              handleSubmitRequest(localProduct);
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white text-[.9vw] cursor-pointer rounded hover:bg-blue-700 font-medium"
        >
          {isEditMode ? "Save Changes": "Submit Request"}
        </button>
      </div>
    </div>
  </div>
);
}