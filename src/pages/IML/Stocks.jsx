// Stocks.jsx
import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY_ORDERS = "imlorders";
const STORAGE_KEY_INVENTORY_FOLLOWUPS = "iml_inventory_followups";

const PRODUCT_SIZE_OPTIONS = {
  Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
  "Round Square": ["450ml", "500ml"],
  Rectangle: ["500ml", "650ml", "750ml"],
  "Sweet Box": ["250gms", "500gms"],
  "Sweet Box TE": ["TE 250gms", "TE 500gms"],
};

export default function Stocks() {
  const [stockData, setStockData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedSizes, setExpandedSizes] = useState({});

  // Load stock data from inventory
  const loadStockData = () => {
    console.log("🔄 Loading stock data...");

    const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
    const storedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY_FOLLOWUPS);

    if (!storedOrders || !storedInventory) {
      console.warn("⚠️ No orders or inventory data found");
      setStockData([]);
      return;
    }

    try {
      const allOrders = JSON.parse(storedOrders);
      const inventoryData = JSON.parse(storedInventory);

      const stockItems = [];

      // Process each order
      allOrders.forEach((order) => {
        order.products?.forEach((product) => {
          if (product.moveToPurchase) {
            const key = `${order.id}_${product.id}`;
            const inventoryHistory = inventoryData[key];

            // Only include if inventory verification has been done
            if (inventoryHistory && inventoryHistory.length > 0) {
              // Get latest entry for last updated date
              const latestEntry = inventoryHistory[inventoryHistory.length - 1];

              // Calculate total final quantity (available stock)
              const totalStock = inventoryHistory.reduce((sum, entry) => {
                return sum + (parseInt(entry.finalQty) || 0);
              }, 0);

              stockItems.push({
                id: key,
                orderId: order.id,
                productId: product.id,
                companyName: order.contact.company,
                imlName: product.imlName,
                imlType: product.imlType,
                productCategory: product.productName,
                size: product.size,
                availableStock: totalStock,
                lastUpdated: latestEntry.date || new Date().toLocaleDateString("en-IN"),
              });
            }
          }
        });
      });

      console.log("✅ Stock items loaded:", stockItems.length);
      setStockData(stockItems);
    } catch (error) {
      console.error("❌ Error loading stock data:", error);
      setStockData([]);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🚀 Stocks mounted");
    loadStockData();
  }, []);

  // Auto-expand products and first size
  useEffect(() => {
    if (stockData.length > 0) {
      const grouped = groupByProductAndSize();
      const newExpandedProducts = {};
      const newExpandedSizes = {};

      Object.entries(grouped).forEach(([productName, sizeMap]) => {
        newExpandedProducts[productName] = true;
        const sizes = Object.keys(sizeMap);
        if (sizes.length > 0) {
          newExpandedSizes[`${productName}-${sizes[0]}`] = true;
        }
      });

      setExpandedProducts(newExpandedProducts);
      setExpandedSizes(newExpandedSizes);
    }
  }, [stockData]);

  // Group by product → size
  const groupByProductAndSize = () => {
    const grouped = {};

    stockData.forEach((item) => {
      const productName = item.productCategory;
      const size = item.size;

      if (!grouped[productName]) {
        grouped[productName] = {};
      }

      if (!grouped[productName][size]) {
        grouped[productName][size] = [];
      }

      grouped[productName][size].push(item);
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = useMemo(() => {
    const products = new Set();
    stockData.forEach((item) => {
      products.add(item.productCategory);
    });
    return Array.from(products).sort();
  }, [stockData]);

  // Get unique sizes for selected product
  const getUniqueSizesForProduct = useMemo(() => {
    const sizes = new Set();
    stockData.forEach((item) => {
      if (!selectedProduct || item.productCategory === selectedProduct) {
        sizes.add(item.size);
      }
    });
    return Array.from(sizes).sort();
  }, [stockData, selectedProduct]);

  // Filter data
  const getFilteredGroupedData = () => {
    const allGrouped = groupByProductAndSize();
    const filtered = {};

    Object.entries(allGrouped).forEach(([productName, sizeMap]) => {
      // Product filter
      if (selectedProduct && productName !== selectedProduct) {
        return;
      }

      Object.entries(sizeMap).forEach(([size, items]) => {
        // Size filter
        if (selectedSize && size !== selectedSize) {
          return;
        }

        const filteredItems = items.filter((item) => {
          // Search filter (company or IML name)
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
              item.companyName.toLowerCase().includes(searchLower) ||
              item.imlName.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }

          return true;
        });

        if (filteredItems.length > 0) {
          if (!filtered[productName]) {
            filtered[productName] = {};
          }
          filtered[productName][size] = filteredItems;
        }
      });
    });

    return filtered;
  };

  // Calculate total stock for a product
  const getTotalStockForProduct = (productName) => {
    return stockData
      .filter((item) => item.productCategory === productName)
      .reduce((sum, item) => sum + item.availableStock, 0);
  };

  // Toggle functions
  const toggleProduct = (productName) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productName]: !prev[productName],
    }));
  };

  const toggleSize = (productName, size) => {
    const key = `${productName}-${size}`;
    setExpandedSizes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Get status badge
  const getStatusFromStock = (stockCount) => {
    const base =
      "inline-flex items-center text-[0.75vw] px-[0.6vw] py-[0.25vw] rounded-full font-medium whitespace-nowrap";

    if (stockCount === 0) {
      return (
        <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>
          Out of Stock
        </span>
      );
    }

    if (stockCount > 500) {
      return (
        <span className={`${base} bg-green-100 text-green-700 border border-green-300`}>
          Available
        </span>
      );
    }

    return (
      <span className={`${base} bg-amber-100 text-amber-700 border border-amber-300`}>
        Low Stock
      </span>
    );
  };

  const filteredGroupedData = getFilteredGroupedData();
  const hasData = Object.keys(filteredGroupedData).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.5vw]">
          <div className="flex items-center gap-[.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">
              Stocks Management
            </h1>

            <button
              onClick={() => {
                console.log("🔄 Manual refresh clicked");
                loadStockData();
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
              {stockData.length} items loaded
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
                Search by Company / IML Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search company or IML name..."
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

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedProduct("");
                  setSelectedSize("");
                }}
                className="w-full px-[.85vw] py-[0.6vw] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-[.8vw] cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Display */}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Stock Data Found
          </h3>
          <p className="text-gray-600">
            {searchTerm || selectedProduct || selectedSize
              ? "No items match your filters"
              : "No stock available yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {Object.entries(filteredGroupedData).map(([productName, sizeMap]) => {
            const totalStock = getTotalStockForProduct(productName);

            return (
              <div
                key={productName}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Product Header */}
                <div
                  onClick={() => toggleProduct(productName)}
                  className="bg-green-600 text-white px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-green-700 transition-all flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 ${
                        expandedProducts[productName] ? "rotate-90" : ""
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
                      <h3 className="text-[1.15vw] font-bold">{productName}</h3>
                      <p className="text-[.9vw] text-green-100">
                        Total Stock: {totalStock.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sizes within Product */}
                {expandedProducts[productName] && (
                  <div className="space-y-[1.25vw] p-[1vw]">
                    {Object.entries(sizeMap).map(([size, items]) => {
                      const isSizeExpanded = expandedSizes[`${productName}-${size}`];
                      const sizeTotal = items.reduce(
                        (sum, item) => sum + item.availableStock,
                        0
                      );

                      return (
                        <div
                          key={size}
                          className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                        >
                          {/* Size Header */}
                          <div
                            onClick={() => toggleSize(productName, size)}
                            className="bg-gray-200 px-[1.5vw] py-[.85vw] cursor-pointer hover:bg-gray-300 transition-all flex justify-between items-center"
                          >
                            <div className="flex items-center gap-4">
                              <svg
                                className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 text-gray-600 ${
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
                              <div>
                                <h4 className="text-[1.05vw] font-semibold text-gray-800">
                                  Size: {size}
                                </h4>
                                <div className="flex gap-6 mt-2 text-[.9vw] text-gray-600">
                                  <span>
                                    <strong>Items:</strong> {items.length}
                                  </span>
                                  <span>
                                    <strong>Total Stock:</strong>{" "}
                                    {sizeTotal.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stock Table */}
                          {isSizeExpanded && (
                            <div className="p-[1.5vw] bg-white">
                              <div className="overflow-x-auto rounded-lg">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-200">
                                      <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                        S.No
                                      </th>
                                      <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                        Last Updated
                                      </th>
                                      <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                        Company
                                      </th>
                                      <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                        IML Name
                                      </th>
                                      <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                        IML Type
                                      </th>
                                      <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                        Stock
                                      </th>
                                     
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {idx + 1}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          {item.lastUpdated}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-semibold">
                                          {item.companyName}
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          <span className="inline-block px-[0.75vw] py-[0.25vw] bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                            {item.imlName}
                                          </span>
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                            {item.imlType}
                                          </span>
                                        </td>
                                        <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-bold text-green-700">
                                          {item.availableStock.toLocaleString(
                                            "en-IN"
                                          )}
                                        </td>
                                        
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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
  );
}
