import { useState, useEffect } from "react";

// Product size options
const PRODUCT_SIZE_OPTIONS = {
  Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
  "Round Square": ["450ml", "500ml"],
  Rectangle: ["500ml", "650ml", "750ml"],
  "Sweet Box": ["250gms", "500gms"],
  "Sweet Box TE": ["TE 250gms", "TE 500gms"],
};

export default function Stock() {
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});

  // Initialize with dummy data on component mount
  useEffect(() => {
    initializeDummyData();
  }, []);

  // Initialize comprehensive dummy data
  const initializeDummyData = () => {
    const dummyOrders = [
      // Round - 120ml

      {
        id: 1702456789002,
        products: [
          {
            id: 1,
            productName: "Round",
            size: "120ml",
            lidStock: 320,
            tubStock: 80,
          },
        ],
        createdAt: "2025-10-10T09:30:00.000Z",
        updatedAt: "2025-12-18T14:20:00.000Z",
      },
      // Round - 250ml
      {
        id: 1702456789003,
        products: [
          {
            id: 1,
            productName: "Round",
            size: "250ml",
            lidStock: 600,
            tubStock: 400,
          },
        ],
        createdAt: "2025-11-20T10:00:00.000Z",
        updatedAt: "2025-12-22T11:00:00.000Z",
      },
      // Round - 300ml
      {
        id: 1702456789005,
        products: [
          {
            id: 1,
            productName: "Round",
            size: "300ml",
            lidStock: 60,
            tubStock: 300,
          },
        ],
        createdAt: "2025-11-05T12:00:00.000Z",
        updatedAt: "2025-12-25T09:30:00.000Z",
      },
      // Round - 500ml
      {
        id: 1702456789007,
        products: [
          {
            id: 1,
            productName: "Round",
            size: "500ml",
            lidStock: 1500,
            tubStock: 1200,
          },
        ],
        createdAt: "2025-11-12T14:30:00.000Z",
        updatedAt: "2025-12-28T10:00:00.000Z",
      },
      // Round - 1000ml
      {
        id: 1702456789010,
        products: [
          {
            id: 1,
            productName: "Round",
            size: "1000ml",
            lidStock: 0,
            tubStock: 0,
          },
        ],
        createdAt: "2025-11-18T10:30:00.000Z",
        updatedAt: "2025-12-27T14:50:00.000Z",
      },

      // Round Square - 450ml
      {
        id: 1702456789012,
        products: [
          {
            id: 1,
            productName: "Round Square",
            size: "450ml",
            lidStock: 900,
            tubStock: 700,
          },
        ],
        createdAt: "2025-11-10T11:00:00.000Z",
        updatedAt: "2025-12-24T15:20:00.000Z",
      },
      // Round Square - 500ml
      {
        id: 1702456789014,
        products: [
          {
            id: 1,
            productName: "Round Square",
            size: "500ml",
            lidStock: 1250,
            tubStock: 1050,
          },
        ],
        createdAt: "2025-11-22T14:15:00.000Z",
        updatedAt: "2025-12-29T10:30:00.000Z",
      },

      {
        id: 1702456789017,
        products: [
          {
            id: 1,
            productName: "Rectangle",
            size: "500ml",
            lidStock: 870,
            tubStock: 730,
          },
        ],
        createdAt: "2025-10-22T10:15:00.000Z",
        updatedAt: "2025-12-19T11:20:00.000Z",
      },
      // Rectangle - 650ml
      {
        id: 1702456789018,
        products: [
          {
            id: 1,
            productName: "Rectangle",
            size: "650ml",
            lidStock: 1150,
            tubStock: 950,
          },
        ],
        createdAt: "2025-11-25T15:40:00.000Z",
        updatedAt: "2025-12-26T14:10:00.000Z",
      },

      // Rectangle - 750ml
      {
        id: 1702456789021,
        products: [
          {
            id: 1,
            productName: "Rectangle",
            size: "750ml",
            lidStock: 1600,
            tubStock: 1400,
          },
        ],
        createdAt: "2025-11-28T13:20:00.000Z",
        updatedAt: "2025-12-29T15:40:00.000Z",
      },

      // Sweet Box - 250gms
      {
        id: 1702456789023,
        products: [
          {
            id: 1,
            productName: "Sweet Box",
            size: "250gms",
            lidStock: 700,
            tubStock: 500,
          },
        ],
        createdAt: "2025-11-17T10:50:00.000Z",
        updatedAt: "2025-12-25T11:30:00.000Z",
      },
      // Sweet Box - 500gms
      {
        id: 1702456789026,
        products: [
          {
            id: 1,
            productName: "Sweet Box",
            size: "500gms",
            lidStock: 1200,
            tubStock: 1000,
          },
        ],
        createdAt: "2025-11-20T09:15:00.000Z",
        updatedAt: "2025-12-27T10:25:00.000Z",
      },

      // Sweet Box TE - TE 250gms
      {
        id: 1702456789028,
        products: [
          {
            id: 1,
            productName: "Sweet Box TE",
            size: "TE 250gms",
            lidStock: 650,
            tubStock: 550,
          },
        ],
        createdAt: "2025-11-13T15:30:00.000Z",
        updatedAt: "2025-12-26T16:10:00.000Z",
      },

      // Sweet Box TE - TE 500gms
      {
        id: 1702456789031,
        products: [
          {
            id: 1,
            productName: "Sweet Box TE",
            size: "TE 500gms",
            lidStock: 1100,
            tubStock: 900,
          },
        ],
        createdAt: "2025-11-24T08:40:00.000Z",
        updatedAt: "2025-12-28T09:20:00.000Z",
      },
    ];

    setOrders(dummyOrders);
  };

  // Initialize expanded categories
  useEffect(() => {
    if (orders.length > 0) {
      const groupedOrders = groupOrdersByProduct();
      const newExpandedCategories = {};

      Object.keys(groupedOrders).forEach((productName) => {
        newExpandedCategories[productName] = true;
      });

      setExpandedCategories(newExpandedCategories);
    }
  }, [orders.length]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group orders by product category
  const groupOrdersByProduct = () => {
    const grouped = {};

    orders.forEach((order) => {
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          const productName = product.productName || "Uncategorized";

          if (!grouped[productName]) {
            grouped[productName] = [];
          }

          const totalStock = (product.lidStock || 0) + (product.tubStock || 0);

          grouped[productName].push({
            orderId: order.id,
            productName: product.productName,
            size: product.size || "No Size",
            availableStock: totalStock,
            updatedAt: order.updatedAt || order.createdAt,
          });
        });
      }
    });

    return grouped;
  };

  // Get unique products
  const getUniqueProducts = () => {
    const products = new Set();
    orders.forEach((order) => {
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          products.add(product.productName || "Uncategorized");
        });
      }
    });
    return Array.from(products).sort();
  };

  // Get unique sizes for a product
  const getUniqueSizesForProduct = (productName) => {
    const sizes = new Set();
    orders.forEach((order) => {
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          if (product.productName === productName) {
            sizes.add(product.size || "No Size");
          }
        });
      }
    });
    return Array.from(sizes).sort();
  };

  // Calculate total available stock for a product
  const getTotalStockForProduct = (productName) => {
    let totalStock = 0;
    orders.forEach((order) => {
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          if (product.productName === productName) {
            totalStock += (product.lidStock || 0) + (product.tubStock || 0);
          }
        });
      }
    });
    return totalStock;
  };

  // Filter grouped orders
  const getFilteredGroupedOrders = () => {
    const allGrouped = groupOrdersByProduct();
    const filtered = {};

    Object.entries(allGrouped).forEach(([productName, stockItems]) => {
      if (selectedProduct && productName !== selectedProduct) {
        return;
      }

      const filteredItems = stockItems.filter((item) => {
        if (selectedSize && item.size !== selectedSize) {
          return false;
        }
        return true;
      });

      if (filteredItems.length > 0) {
        filtered[productName] = filteredItems;
      }
    });

    return filtered;
  };

  const getStatusFromStock = (stockCount) => {
  const base =
    'inline-flex items-center text-[0.75vw] px-[0.6vw] py-[0.25vw] rounded-full font-medium whitespace-nowrap';

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


  // Reset size filter when product changes
  useEffect(() => {
    setSelectedSize("");
  }, [selectedProduct]);

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const hasOrders = Object.keys(filteredGroupedOrders).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.25vw]">
          <h1 className="text-[1.6vw] font-bold text-gray-900">
            Stocks - Plain Box
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Filter */}
          <div>
            <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
              Filter by Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[.8vw]"
            >
              <option value="">All Products</option>
              {getUniqueProducts().map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
              Filter by Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={!selectedProduct}
              className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-[.8vw]"
            >
              <option value="">All Sizes</option>
              {selectedProduct &&
                getUniqueSizesForProduct(selectedProduct).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Display */}
      {!hasOrders ? (
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
          <h3 className="text-[1.2vw] font-semibold text-gray-900 mb-[0.5vw]">
            No Stock Found
          </h3>
          <p className="text-[0.9vw] text-gray-600">
            {selectedProduct || selectedSize
              ? "No stock items found matching your filters"
              : "No stock items available"}
          </p>
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {Object.keys(PRODUCT_SIZE_OPTIONS)
            .filter((productName) => filteredGroupedOrders[productName])
            .map((productName) => {
              const stockItems = filteredGroupedOrders[productName];
              const totalStock = getTotalStockForProduct(productName);

              return (
                <div
                  key={productName}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Product Category Header */}
                  <button
                    onClick={() => toggleCategory(productName)}
                    className="w-full bg-green-600 text-white px-[0.75vw] py-[0.5vw] flex items-center justify-between transition-colors border-b border-[#3555a0] cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center gap-[0.8vw]">
                      <div className="w-[2.6vw] h-[2.6vw] bg-green-700 rounded-[0.5vw] flex items-center justify-center">
                        <svg
                          className="w-[1.5vw] h-[1.5vw] text-white"
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
                      <span className="font-bold text-[1vw]">
                        {productName}
                      </span>
                      <span className="bg-gray-200 text-black px-[0.6vw] py-[0.35vw] rounded-full text-[0.8vw] font-medium">
                        {stockItems.length} Items
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-[0.6vw] py-[0.35vw] rounded-full text-[0.8vw] font-bold">
                        Available: {totalStock.toLocaleString()}
                      </span>
                    </div>
                    <svg
                      className={`w-[1.2vw] h-[1.2vw] text-white transition-transform ${
                        expandedCategories[productName] ? "rotate-180" : ""
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
                  </button>

                  {/* Stock Table */}
                  {expandedCategories[productName] && (
                    <div className="p-[0.8vw]">
                      <div className="overflow-x-auto rounded-[0.5vw] border border-gray-300">
                        <table className="w-full text-[0.9vw] border-collapse">
                          <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                              <th className="text-center px-[0.8vw] py-[0.7vw] font-semibold text-gray-700 border border-gray-300">
                                S. No.
                              </th>
                              <th className="text-center px-[0.8vw] py-[0.7vw] font-semibold text-gray-700 border border-gray-300">
                                Last Updated
                              </th>
                              <th className="text-center px-[0.8vw] py-[0.7vw] font-semibold text-gray-700 border border-gray-300">
                                Product Category
                              </th>
                              <th className="text-center px-[0.8vw] py-[0.7vw] font-semibold text-gray-700 border border-gray-300">
                                Size
                              </th>
                              <th className="text-center px-[0.8vw] py-[0.7vw] font-semibold text-gray-700 border border-gray-300">
                                Available Stock
                              </th>
                              <th className="text-center px-[0.8vw] py-[0.7vw] font-semibold text-gray-700 border border-gray-300">
                                 Stock Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {stockItems.map((item, index) => (
                              <tr
                                key={`${item.orderId}-${index}`}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="text-center px-[0.8vw] py-[0.65vw] text-gray-900 border border-gray-300">
                                  {index + 1}
                                </td>
                                <td className="text-center px-[0.8vw] py-[0.65vw] text-gray-900 border border-gray-300">
                                  {new Date(item.updatedAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </td>
                                <td className="text-center px-[0.8vw] py-[0.65vw] text-gray-900 border border-gray-300">
                                  {item.productName}
                                </td>
                                <td className="text-center px-[0.8vw] py-[0.65vw] text-gray-900 border border-gray-300">
                                  {item.size}
                                </td>
                                <td className="text-center px-[0.8vw] py-[0.65vw] text-gray-900 border border-gray-300">
                                  {item.availableStock.toLocaleString()}
                                </td>
                                <td className="text-center px-[0.8vw] py-[0.65vw] text-gray-900 border border-gray-300">
                                  {getStatusFromStock(item.availableStock)}
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
}
