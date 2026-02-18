// ProductionManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_LABEL_QTY = "iml_label_quantity_received";
const STORAGE_KEY_PRODUCTION = "iml_production_data";
const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";

const ProductionManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [productionData, setProductionData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");

  const [activeSheet, setActiveSheet] = useState("tracking");

  // Expand states
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSizes, setExpandedSizes] = useState({});
  const [expandedColors, setExpandedColors] = useState({});

  const toNumber = (value) => {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === "number") return value;

    // Remove commas and convert to number
    const numStr = String(value).replace(/,/g, "");
    const num = Number(numStr);

    // Return 0 if not a valid number, otherwise return the number
    return isNaN(num) ? 0 : num;
  };

  const getAllocationData = (orderId, productId) => {
    try {
      const allocationKey = `${orderId}_${productId}`;
      const existingAllocations = JSON.parse(
        localStorage.getItem("iml_production_allocation") || "{}",
      );

      const allocations = existingAllocations[allocationKey] || [];
      const totalAllocated = allocations.reduce(
        (sum, alloc) => sum + (Number(alloc.allocatedQty) || 0),
        0,
      );

      return {
        allocations: allocations,
        totalAllocated: totalAllocated,
        origin: allocations.length > 0 ? "Remaining Allocation" : "Main Order",
      };
    } catch (error) {
      console.error("Error getting allocation data:", error);
      return { allocations: [], totalAllocated: 0, origin: "Main Order" };
    }
  };

  const getTotalLabels = (orderId, productId, imlType) => {
    const labelData = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}",
    );
    const exactKey = `${orderId}_${productId}`;
    const item = labelData[exactKey];

    // FIX: Return default values if item doesn't exist
    if (!item) {
      console.log(`❌ No data found for key: ${exactKey}`);
      return { lidTotal: 0, tubTotal: 0, total: 0 };
    }

    let lidTotal = 0;
    let tubTotal = 0;

    // FIX: Check if history exists and is an array - SUM ALL ENTRIES
    if (item.history && Array.isArray(item.history)) {
      console.log(
        `🔢 Summing ${item.history.length} history entries for ${exactKey}, imlType: ${imlType}`,
      );

      item.history.forEach((h, index) => {
        console.log(`  Entry ${index + 1}:`, h);

        // ALWAYS read receivedQuantity first - this is the main quantity field
        const receivedQty = Number(h.receivedQuantity || 0);
        const lidQty = Number(h.lidReceivedQuantity || 0);
        const tubQty = Number(h.tubReceivedQuantity || 0);

        console.log(
          `    receivedQty: ${receivedQty}, lidQty: ${lidQty}, tubQty: ${tubQty}`,
        );

        if (h.imlType === "LID & TUB") {
          // LID & TUB: Use separate counts if available, otherwise split receivedQty
          if (lidQty > 0 || tubQty > 0) {
            lidTotal += lidQty;
            tubTotal += tubQty;
            console.log(
              `    LID & TUB: +${lidQty} LID, +${tubQty} TUB (from separate fields)`,
            );
          } else {
            // Split evenly if only receivedQuantity is provided
            lidTotal += Math.floor(receivedQty / 2);
            tubTotal += receivedQty - Math.floor(receivedQty / 2);
            console.log(`    LID & TUB: Split ${receivedQty} evenly`);
          }
        } else if (h.imlType === "LID" || imlType === "LID") {
          // LID only: use receivedQuantity (or lidReceivedQuantity if available)
          const qty = lidQty > 0 ? lidQty : receivedQty;
          lidTotal += qty;
          console.log(`    LID: +${qty}`);
        } else if (h.imlType === "TUB" || imlType === "TUB") {
          // TUB only: use receivedQuantity (or tubReceivedQuantity if available)
          const qty = tubQty > 0 ? tubQty : receivedQty;
          tubTotal += qty;
          console.log(`    TUB: +${qty}`);
        } else {
          // For backward compatibility - single type, add to both
          const qty = receivedQty;
          lidTotal += qty;
          tubTotal += qty;
          console.log(`    Single/Other: +${qty} to both`);
        }
      });
    } else {
      // Fallback to top-level receivedQuantity
      const qty = Number(item.receivedQuantity || 0);

      // Distribute based on imlType
      if (imlType === "LID") {
        lidTotal = qty;
        console.log(`  No history, LID type: ${qty}`);
      } else if (imlType === "TUB") {
        tubTotal = qty;
        console.log(`  No history, TUB type: ${qty}`);
      } else if (imlType === "LID & TUB") {
        lidTotal = Math.floor(qty / 2);
        tubTotal = qty - lidTotal;
        console.log(
          `  No history, LID & TUB type: ${qty} -> LID:${lidTotal}, TUB:${tubTotal}`,
        );
      } else {
        lidTotal = qty;
        tubTotal = qty;
        console.log(`  No history, Single type: ${qty} to both`);
      }
    }

    const total = lidTotal + tubTotal;
    console.log(
      `✅ Final totals for ${exactKey}: LID=${lidTotal}, TUB=${tubTotal}, Total=${total}`,
    );
    return { lidTotal, tubTotal, total };
  };

  // Load production data
  const loadProductionData = () => {
    console.log("🔄 Loading production data...");

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const storedLabelQty = localStorage.getItem(STORAGE_KEY_LABEL_QTY);

    // Add this at the beginning of loadProductionData to debug
    console.log("=== DEBUG: Checking label quantity data ===");
    const debugLabelData = JSON.parse(
      localStorage.getItem(STORAGE_KEY_LABEL_QTY) || "{}",
    );
    Object.keys(debugLabelData).forEach((key) => {
      const item = debugLabelData[key];
      if (item && item.history && Array.isArray(item.history)) {
        console.log(`Key: ${key}`);
        console.log(`  Top-level receivedQuantity: ${item.receivedQuantity}`);
        console.log(`  History entries: ${item.history.length}`);
        let sum = 0;
        item.history.forEach((h, i) => {
          console.log(
            `  Entry ${i + 1}: receivedQuantity=${h.receivedQuantity}, imlType=${h.imlType}`,
          );
          sum += Number(h.receivedQuantity || 0);
        });
        console.log(`  Sum of history receivedQuantity: ${sum}`);
      }
    });

    if (!storedOrders || !storedLabelQty) {
      console.warn("⚠️ No orders or label quantities found");
      setProductionData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const labelData = JSON.parse(storedLabelQty);
      const productionItems = [];

      // Process each order
      allOrders.forEach((order) => {
        order.products?.forEach((product) => {
          const key = `${order.id}_${product.id}`;
          const labelInfo = labelData[key];

          // Skip if no label data AND no allocation data
          const allocationData = getAllocationData(order.id, product.id);
          const hasAllocations = allocationData.totalAllocated > 0;

          if (!labelInfo && !hasAllocations) {
            console.log(`Skipping ${key}: No label or allocation data`);
            return;
          }

          // **MAIN ORDER PROCESSING** - Only if labelInfo exists
          if (labelInfo) {
            console.log(`Processing main order for ${key}:`, labelInfo);

            // Get main order production data
            const mainStoredProduction = localStorage.getItem(
              STORAGE_KEY_PRODUCTION_FOLLOWUPS,
            );
            const mainProductionData = mainStoredProduction
              ? JSON.parse(mainStoredProduction)
              : {};
            const mainFollowups = Array.isArray(mainProductionData[key])
              ? mainProductionData[key]
              : [];

            // USE getTotalLabels function
            const labelTotals = getTotalLabels(
              order.id,
              product.id,
              product.imlType,
            );

            const mainLidTotal = labelTotals.lidTotal;
            const mainTubTotal = labelTotals.tubTotal;
            const mainTotal = labelTotals.total;

            console.log(
              `Main order totals for ${key}: LID=${mainLidTotal}, TUB=${mainTubTotal}, Total=${mainTotal}`,
            );
            console.log(
              `Main followups count: ${mainFollowups.length}`,
              mainFollowups,
            );

            // Calculate used quantities from main followups
            let mainLidUsed = 0;
            let mainTubUsed = 0;
            let totalUsed = 0;

            if (product.imlType === "LID & TUB") {
              mainFollowups.forEach((e) => {
                const accepted = toNumber(e.acceptedComponents || 0);
                if (e.componentType === "LID") {
                  mainLidUsed += accepted;
                } else if (e.componentType === "TUB") {
                  mainTubUsed += accepted;
                } else {
                  mainLidUsed += accepted;
                  mainTubUsed += accepted;
                }
              });
              totalUsed = mainLidUsed + mainTubUsed;
            } else {
              // For LID/TUB/single types
              totalUsed = mainFollowups.reduce((sum, e) => {
                const accepted = toNumber(e.acceptedComponents || 0);
                return sum + accepted;
              }, 0);
              mainLidUsed = totalUsed;
              mainTubUsed = totalUsed;
            }

            console.log(`Total used from followups: ${totalUsed}`);

            const mainLidRemaining = Math.max(mainLidTotal - mainLidUsed, 0);
            const mainTubRemaining = Math.max(mainTubTotal - mainTubUsed, 0);
            const mainRemainingTotal = Math.max(mainTotal - totalUsed, 0);

            console.log(
              `Remaining calculation: ${mainTotal} - ${totalUsed} = ${mainRemainingTotal}`,
            );

            // Add main order item ONLY if there are labels to produce
            if (mainTotal > 0) {
              const mainItem = {
                id: `${key}_main`,
                originalId: key,
                orderId: order.id,
                productId: product.id,
                orderNumber: order.orderNumber,
                companyName: order.contact.company,
                productCategory: product.productName,
                size: product.size,
                imlName: product.imlName,
                imlType: product.imlType,
                lidColor: product.lidColor || "N/A",
                tubColor: product.tubColor || "N/A",
                labelType: labelInfo.imlType || product.imlType,
                orderQuantity: labelInfo.orderQuantity || 0,
                // Show the TOTAL sum from getTotalLabels
                receivedQuantity: mainTotal,
                allReceived: labelInfo.allReceived || false,
                lidTotal: mainLidTotal,
                tubTotal: mainTubTotal,
                lidRemaining: mainLidRemaining,
                tubRemaining: mainTubRemaining,
                remainingLabels: mainRemainingTotal,
                origin: "Main Order",
                isFromRemaining: false,
                followups: mainFollowups.length,
                // Add history count for debugging
                historyCount: labelInfo.history ? labelInfo.history.length : 0,
              };
              productionItems.push(mainItem);
              console.log(
                `Added main order item: ${key}_main, Total Received: ${mainTotal}, Remaining: ${mainRemainingTotal}, Used: ${totalUsed}`,
              );
            }
          }

          // **REMAINING ALLOCATION PROCESSING** - Only if allocations exist
          // **REMAINING ALLOCATION PROCESSING** - Only if allocations exist
          if (hasAllocations) {
            console.log(
              `Processing remaining allocation for ${key}:`,
              allocationData,
            );

            // Get remaining production data
            const remainingStoredProduction = localStorage.getItem(
              "iml_remaining_production_followups",
            );
            const remainingProductionData = remainingStoredProduction
              ? JSON.parse(remainingStoredProduction)
              : {};
            const remainingFollowups = Array.isArray(
              remainingProductionData[key],
            )
              ? remainingProductionData[key]
              : [];

            // Calculate remaining allocation totals
            const allocatedTotal = allocationData.totalAllocated;
            let allocLidTotal = 0;
            let allocTubTotal = 0;

            // Use the same logic as getTotalLabels for consistency
            if (product.imlType === "LID & TUB") {
              allocLidTotal = Math.floor(allocatedTotal / 2);
              allocTubTotal = allocatedTotal - allocLidTotal;
            } else if (product.imlType === "LID") {
              allocLidTotal = allocatedTotal;
            } else if (product.imlType === "TUB") {
              allocTubTotal = allocatedTotal;
            } else {
              // Single type - distribute to both
              allocLidTotal = allocatedTotal;
              allocTubTotal = allocatedTotal;
            }

            // Calculate used quantities from remaining followups
            let allocLidUsed = 0;
            let allocTubUsed = 0;

            if (product.imlType === "LID & TUB") {
              remainingFollowups.forEach((e) => {
                const accepted = toNumber(e.acceptedComponents || 0);
                if (e.componentType === "LID") {
                  allocLidUsed += accepted;
                } else if (e.componentType === "TUB") {
                  allocTubUsed += accepted;
                }
              });
            } else {
              allocLidUsed = remainingFollowups.reduce((sum, e) => {
                const accepted = toNumber(e.acceptedComponents || 0);
                return sum + accepted;
              }, 0);
              allocTubUsed = allocLidUsed;
            }

            const allocLidRemaining = Math.max(allocLidTotal - allocLidUsed, 0);
            const allocTubRemaining = Math.max(allocTubTotal - allocTubUsed, 0);
            const allocRemainingTotal = Math.max(
              allocatedTotal - (allocLidUsed + allocTubUsed),
              0,
            );

            // Add remaining allocation item
            const remainingItem = {
              id: `${key}_remaining`,
              originalId: key,
              orderId: order.id,
              productId: product.id,
              orderNumber: order.orderNumber,
              companyName: order.contact.company,
              productCategory: product.productName,
              size: product.size,
              imlName: `${product.imlName}`,
              imlType: product.imlType,
              lidColor: product.lidColor || "N/A",
              tubColor: product.tubColor || "N/A",
              labelType: product.imlType,
              orderQuantity: 0,
              receivedQuantity: allocatedTotal,
              allReceived: true,
              lidTotal: allocLidTotal,
              tubTotal: allocTubTotal,
              lidRemaining: allocLidRemaining,
              tubRemaining: allocTubRemaining,
              remainingLabels: allocRemainingTotal,
              origin: "Remaining Allocation",
              isFromRemaining: true,
              followups: remainingFollowups.length,
            };
            productionItems.push(remainingItem);
            console.log(
              `Added remaining allocation item: ${key}_remaining, Allocated: ${allocatedTotal}`,
            );
          }
        });
      });

      console.log("✅ Total production items loaded:", productionItems.length);
      console.log("📊 All items:", productionItems);
      setProductionData(productionItems);
    } catch (error) {
      console.error("❌ Error loading production data:", error);
      setProductionData([]);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🚀 ProductionManagement mounted");
    loadProductionData();
  }, []);

  // Reload when location state changes
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log("🔃 Refresh flag detected");
      loadProductionData();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-expand on load
  useEffect(() => {
    if (productionData.length > 0) {
      const grouped = groupByHierarchy();
      const newExpandedCategories = {};
      const newExpandedSizes = {};
      const newExpandedColors = {};

      Object.entries(grouped).forEach(([category, sizes]) => {
        newExpandedCategories[category] = true;
        Object.entries(sizes).forEach(([size, colors]) => {
          const sizeKey = `${category}-${size}`;
          newExpandedSizes[sizeKey] = true;
          Object.keys(colors).forEach((color) => {
            const colorKey = `${category}-${size}-${color}`;
            newExpandedColors[colorKey] = true;
          });
        });
      });

      setExpandedCategories(newExpandedCategories);
      setExpandedSizes(newExpandedSizes);
      setExpandedColors(newExpandedColors);
    }
  }, [productionData]);

  // ✅ AUTO UPDATE ORDER STATUS WHEN REMAINING = 0


  // Get production status
  const getProductionStatus = (itemId) => {
    const item = productionData.find((item) => item.id === itemId);
    if (!item) return "Pending";

    // Get followups from correct storage based on origin
    const storageKey = item.isFromRemaining
      ? "iml_remaining_production_followups"
      : STORAGE_KEY_PRODUCTION_FOLLOWUPS;

    const storedFollowups = localStorage.getItem(storageKey);
    const allProductionData = storedFollowups
      ? JSON.parse(storedFollowups)
      : {};

    const followups = Array.isArray(allProductionData[itemId])
      ? allProductionData[itemId]
      : [];

    const isLidTub = item.imlType === "LID & TUB";
    const isLidOnly = item.imlType === "LID";
    const isTubOnly = item.imlType === "TUB";

    if (followups.length === 0) return "Pending";

    if (isLidTub) {
      // For LID & TUB, check both lid and tub remaining
      if (item.lidRemaining === 0 && item.tubRemaining === 0)
        return "Completed";
    } else if (isLidOnly) {
      // For LID only, check lid remaining
      if (item.lidRemaining === 0) return "Completed";
    } else if (isTubOnly) {
      // For TUB only, check tub remaining
      if (item.tubRemaining === 0) return "Completed";
    } else {
      // For other types (single/combined), check remainingLabels
      if (item.remainingLabels === 0) return "Completed";
    }

    return "In Progress";
  };

  // Group by hierarchy: Category → Size → Color
  const groupByHierarchy = () => {
    const grouped = {};

    productionData.forEach((item) => {
      const category = item.productCategory;
      const size = item.size;
      // Include source in color key to separate them
      const color = item.isFromRemaining
        ? `Lid: ${item.lidColor} / Tub: ${item.tubColor} `
        : `Lid: ${item.lidColor} / Tub: ${item.tubColor}`;

      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][size]) {
        grouped[category][size] = {};
      }
      if (!grouped[category][size][color]) {
        grouped[category][size][color] = [];
      }

      grouped[category][size][color].push(item);
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    productionData.forEach((item) => {
      products.add(item.productCategory);
    });
    return Array.from(products).sort();
  }, [productionData]);

  // Get unique sizes
  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    productionData.forEach((item) => {
      if (!selectedProduct || item.productCategory === selectedProduct) {
        sizes.add(item.size);
      }
    });
    return Array.from(sizes).sort();
  }, [productionData, selectedProduct]);

  // Filter data
  const getFilteredHierarchy = () => {
    const allGrouped = groupByHierarchy();
    const filtered = {};

    Object.entries(allGrouped).forEach(([category, sizes]) => {
      // Apply product filter
      if (selectedProduct && category !== selectedProduct) {
        return;
      }

      Object.entries(sizes).forEach(([size, colors]) => {
        // Apply size filter
        if (selectedSize && size !== selectedSize) {
          return;
        }

        Object.entries(colors).forEach(([color, items]) => {
          // Apply search filter
          const filteredItems = items.filter((item) => {
            if (!searchTerm) return true;

            const searchLower = searchTerm.toLowerCase();
            return (
              item.companyName.toLowerCase().includes(searchLower) ||
              item.imlName.toLowerCase().includes(searchLower) ||
              item.orderNumber.toLowerCase().includes(searchLower)
            );
          });

          // Apply origin filter
          const originFilteredItems = filteredItems.filter((item) => {
            if (!selectedOrigin) return true;
            return item.origin === selectedOrigin;
          });

          if (originFilteredItems.length > 0) {
            if (!filtered[category]) {
              filtered[category] = {};
            }
            if (!filtered[category][size]) {
              filtered[category][size] = {};
            }

            // Create separate color entries for main and remaining
            const mainItems = originFilteredItems.filter(
              (item) => !item.isFromRemaining,
            );
            const remainingItems = originFilteredItems.filter(
              (item) => item.isFromRemaining,
            );

            // Add main items under original color
            if (mainItems.length > 0) {
              filtered[category][size][color] = mainItems;
            }

            // Add remaining items under a modified color name
            if (remainingItems.length > 0) {
              const remainingColor = `${color} (Remaining)`;
              filtered[category][size][remainingColor] = remainingItems;
            }
          }
        });
      });
    });

    return filtered;
  };

  // Toggle functions
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleSize = (category, size) => {
    const key = `${category}-${size}`;
    setExpandedSizes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleColor = (category, size, color) => {
    const key = `${category}-${size}-${color}`;
    setExpandedColors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Open production details
  // ProductionManagement2.jsx - Update handleViewDetails function
const handleViewDetails = (item) => {
  navigate("/iml/production/details", {
    state: {
      entry: {
        id: item.originalId,
        orderId: item.orderId,
        productId: item.productId,
        orderNumber: item.orderNumber,
        company: item.companyName,
        product: item.productCategory,
        size: item.size,
        imlName: item.imlName.replace(" (Remaining)", ""),
        imlType: item.imlType,
        containerColor: `Lid: ${item.lidColor}, Tub: ${item.tubColor}`,
        // PASS THE ALREADY-CALCULATED VALUES
        lidRemaining: item.lidRemaining,
        tubRemaining: item.tubRemaining,
        lidTotalLabels: item.lidTotal,    // This is already calculated
        tubTotalLabels: item.tubTotal,    // This is already calculated
        noOfLabels: item.receivedQuantity, // Total received quantity
        sourceType: item.isFromRemaining ? "remaining" : "main",
        // ADD THESE NEW PROPERTIES
        calculatedLidTotal: item.lidTotal,
        calculatedTubTotal: item.tubTotal,
        calculatedTotal: item.receivedQuantity,
        calculatedLidRemaining: item.lidRemaining,
        calculatedTubRemaining: item.tubRemaining,
        isFromRemaining: item.isFromRemaining,
      },
    },
  });
};

  const filteredHierarchy = getFilteredHierarchy();
  const hasData = Object.keys(filteredHierarchy).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.5vw]">
          <div className="flex items-center gap-[.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">
              Production Management
            </h1>

            <button
              onClick={() => {
                console.log("🔄 Manual refresh clicked");
                loadProductionData();
              }}
              className="px-[.75vw] py-[.4vw] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[.75vw] font-medium transition-all flex items-center gap-1 cursor-pointer"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            <span className="text-[.75vw] bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {productionData.length} items loaded
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
          <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company, IML name..."
                  className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 text-[.8vw]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-[0.9vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Filter by Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setSelectedSize("");
                }}
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white text-[.8vw]"
              >
                <option value="">All Products</option>
                {getUniqueProducts.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Filter by Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                disabled={!selectedProduct}
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 text-[.8vw]"
              >
                <option value="">All Sizes</option>
                {getUniqueSizesForProduct.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Filter by Origin
              </label>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 bg-white text-[.8vw]"
              >
                <option value="">All Origins</option>
                <option value="Main Order">Main Order</option>
                <option value="Remaining Allocation">
                  Remaining Allocation
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedProduct("");
                  setSelectedSize("");
                  setSelectedOrigin("");
                }}
                className="w-full px-[.85vw] py-[0.6vw] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-[.8vw] cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Display */}
      {!hasData ? (
        <div className="bg-white rounded-xl shadow-sm p-[2vw] text-center border border-gray-200">
          <div className="w-[4vw] h-[4vw] bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-[0.8vw]">
            <svg
              className="w-[2vw] h-[2vw] text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-[2vw] font-semibold text-gray-900 mb-2">
            No Production Data Found
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedProduct || selectedSize
              ? "No items match your filters"
              : "No labels have been received yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {Object.entries(filteredHierarchy).map(([category, sizes]) => (
            <div
              key={category}
              className="bg-white rounded-lg shadow-sm border-2 border-neutral-200 overflow-hidden"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category)}
                className="bg-neutral-600 px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-neutral-700 transition-all flex items-center gap-4"
              >
                <svg
                  className={`w-[1.2vw] h-[1.2vw] text-white transition-transform duration-200 ${
                    expandedCategories[category] ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <h3 className="text-[1.15vw] font-bold text-white flex items-center gap-2">
                    <span className="text-[1.3vw]">
                      <svg
                        className="w-[1.3vw] h-[1.3vw] mr-1 text-slate-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="8" width="18" height="12" rx="2" />
                        <path d="M2 8h20" />
                        <path d="M8 4h8" />
                      </svg>
                    </span>{" "}
                    {category}
                  </h3>
                  <p className="text-[.85vw] text-purple-100">
                    {Object.keys(sizes).length} Size
                    {Object.keys(sizes).length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Sizes */}
              {expandedCategories[category] && (
                <div className="p-[1vw] space-y-[1vw]">
                  {Object.entries(sizes).map(([size, colors]) => {
                    const sizeKey = `${category}-${size}`;
                    const isSizeExpanded = expandedSizes[sizeKey];

                    return (
                      <div
                        key={size}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[0.6vw] border border-blue-200 overflow-hidden"
                      >
                        {/* Size Header */}
                        <div
                          onClick={() => toggleSize(category, size)}
                          className="px-[1vw] py-[.75vw] cursor-pointer hover:bg-blue-100 transition-all flex items-center gap-3"
                        >
                          <svg
                            className={`w-[1vw] h-[1vw] text-blue-700 transition-transform duration-200 ${
                              isSizeExpanded ? "rotate-90" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <h4 className="text-[1vw] font-semibold text-blue-900 flex items-center gap-2">
                            <span className="text-[1.1vw]">📏</span> {size}
                          </h4>
                          <span className="text-[.8vw] text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                            {Object.keys(colors).length} Color Combination
                            {Object.keys(colors).length > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Colors */}
                        {isSizeExpanded && (
                          <div className="px-[1vw] pb-[1vw] space-y-[0.75vw]">
                            {Object.entries(colors).map(([color, items]) => {
                              const colorKey = `${category}-${size}-${color}`;
                              const isColorExpanded = expandedColors[colorKey];

                              return (
                                <div
                                  key={color}
                                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.5vw] border border-green-200 overflow-hidden"
                                >
                                  {/* Color Header */}
                                  <div
                                    onClick={() =>
                                      toggleColor(category, size, color)
                                    }
                                    className="px-[0.85vw] py-[.6vw] cursor-pointer hover:bg-green-100 transition-all flex items-center gap-2"
                                  >
                                    <svg
                                      className={`w-[0.9vw] h-[0.9vw] text-green-700 transition-transform duration-200 ${
                                        isColorExpanded ? "rotate-90" : ""
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                    <h5 className="text-[.9vw] font-semibold text-green-900 flex items-center gap-2">
                                      <span className="text-[1vw]">🎨</span> Lid
                                      & Tub: {color}
                                    </h5>
                                    <span className="text-[.75vw] text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                                      {items.length} Item
                                      {items.length > 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  {/* Items Table */}
                                  {/* Items Table */}
                                  {isColorExpanded && (
                                    <div className="px-[0.85vw] pb-[0.85vw]">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-gray-200">
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              S.No
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Order No
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Company Name
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              IML Name
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              IML Type
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Label Type
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Available Labels
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold">
                                              Origin
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold">
                                              Production Status
                                            </th>
                                            <th className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center text-[.8vw] font-semibold">
                                              Action
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {items.map((item, idx) => {
                                            const status = getProductionStatus(
                                              item.id,
                                            );
                                            return (
                                              <tr
                                                key={idx}
                                                className="hover:bg-white transition-colors"
                                              >
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  {idx + 1}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-medium">
                                                  {item.orderNumber}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold">
                                                  {item.companyName}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold">
                                                  {item.imlName}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">
                                                    {item.imlType}
                                                  </span>
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  {item.labelType}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  {item.imlType ===
                                                  "LID & TUB" ? (
                                                    <div className="space-y-0.5">
                                                      <div className="font-semibold text-green-700">
                                                        LID: {item.lidRemaining}{" "}
                                                        / {item.lidTotal}
                                                      </div>
                                                      <div className="font-semibold text-blue-700">
                                                        TUB: {item.tubRemaining}{" "}
                                                        / {item.tubTotal}
                                                      </div>
                                                      <div className="text-[0.7vw] text-gray-500 mt-1">
                                                        {item.isFromRemaining
                                                          ? `Allocated: ${item.receivedQuantity}`
                                                          : `Total: ${item.lidTotal + item.tubTotal}`}
                                                        {!item.isFromRemaining &&
                                                          item.historyCount >
                                                            1 && (
                                                            <span className="ml-1">
                                                              (
                                                              {
                                                                item.historyCount
                                                              }{" "}
                                                              receipts)
                                                            </span>
                                                          )}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div>
                                                      <div className="font-semibold text-blue-700">
                                                        {item.remainingLabels} /{" "}
                                                        {item.receivedQuantity}
                                                      </div>
                                                      <div className="text-[0.7vw] text-gray-500 mt-1">
                                                        {item.isFromRemaining
                                                          ? `Allocated from remaining`
                                                          : `Sum of all receipts`}
                                                        {!item.isFromRemaining &&
                                                          item.historyCount >
                                                            1 && (
                                                            <span className="ml-1">
                                                              (
                                                              {
                                                                item.historyCount
                                                              }{" "}
                                                              receipts)
                                                            </span>
                                                          )}
                                                      </div>
                                                    </div>
                                                  )}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                  <span
                                                    className={`inline-block px-2 py-0.5 rounded text-[.75vw] font-semibold ${
                                                      item.isFromRemaining
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-green-100 text-green-700"
                                                    }`}
                                                  >
                                                    {item.origin}
                                                  </span>
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                  {status === "Pending" ? (
                                                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[.75vw] font-semibold">
                                                      ⏳ Pending
                                                    </span>
                                                  ) : status === "Completed" ? (
                                                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[.75vw] font-semibold">
                                                      ✅ Completed
                                                    </span>
                                                  ) : (
                                                    <span className="inline-block px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[.75vw] font-semibold">
                                                      🔄 In Progress
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="border border-gray-300 px-[0.75vw] py-[.6vw] text-center">
                                                  <button
                                                    onClick={() =>
                                                      handleViewDetails(item)
                                                    }
                                                    className="px-[1vw] py-[.35vw] bg-indigo-600 text-white rounded-[0.4vw] text-[.8vw] font-medium hover:bg-indigo-700 cursor-pointer transition-all inline-flex items-center gap-[0.4vw]"
                                                  >
                                                    <span>👁️</span> View
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionManagement;
