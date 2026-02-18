import { useState, useEffect } from "react";

const Reports = () => {
  // Product categories with sizes
  const PRODUCT_CATEGORIES = {
    Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
    Rectangle: ["500ml", "650ml", "750ml"],
    "Sweet Box": ["250gms", "500gms"],
    "Sweet Box TE": ["TE 250gms", "TE 500gms"],
    "Round Square": ["450ml", "500ml"],
  };

  // Unique diverse data for each product-size combination
  const REPORTS_DATA = {
    Round: {
      "120ml": [
        {
          sNo: 1,
          companyName: "XYZ Corp",
          orderId: "ORD-1736373252-255",
          labelQty: 20000,
          productionQty: 11387,
          artwork: "Revision Required",
          paymentStatus: "Advance",
        },
        {
          sNo: 2,
          companyName: "Delta Foods",
          orderId: "ORD-1739995980-466",
          labelQty: 20000,
          productionQty: 14563,
          artwork: "In Review",
          paymentStatus: "Paid",
        },
        {
          sNo: 3,
          companyName: "Sunshine Enterprises",
          orderId: "ORD-1731876138-430",
          labelQty: 15000,
          productionQty: 10149,
          artwork: "Approved",
          paymentStatus: "Advance",
        },
        {
          sNo: 4,
          companyName: "Urban Packaging",
          orderId: "ORD-1738161641-936",
          labelQty: 2000,
          productionQty: 11958,
          artwork: "In Review",
          paymentStatus: "Advance",
        },
        {
          sNo: 5,
          companyName: "ABC Industries",
          orderId: "ORD-1735562017-793",
          labelQty: 5000,
          productionQty: 10623,
          artwork: "Pending",
          paymentStatus: "Paid",
        },
      ],
      "250ml": [
        {
          sNo: 1,
          companyName: "Quality Containers",
          orderId: "ORD-1737430713-764",
          labelQty: 15000,
          productionQty: 18748,
          artwork: "Pending",
          paymentStatus: "Advance",
        },
        {
          sNo: 2,
          companyName: "Metro Packaging",
          orderId: "ORD-1731126724-843",
          labelQty: 15000,
          productionQty: 15635,
          artwork: "Approved",
          paymentStatus: "Pending",
        },
        {
          sNo: 3,
          companyName: "Golden Pack",
          orderId: "ORD-1733609810-852",
          labelQty: 5000,
          productionQty: 11508,
          artwork: "Approved",
          paymentStatus: "Paid",
        },
        {
          sNo: 4,
          companyName: "Delta Foods",
          orderId: "ORD-1734665671-851",
          labelQty: 3000,
          productionQty: 10021,
          artwork: "Pending",
          paymentStatus: "Paid",
        },
      ],
      "300ml": [
        {
          sNo: 1,
          companyName: "Supreme Plastics",
          orderId: "ORD-1738679152-768",
          labelQty: 10000,
          productionQty: 9083,
          artwork: "Approved",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Delta Foods",
          orderId: "ORD-1732252335-871",
          labelQty: 10000,
          productionQty: 17746,
          artwork: "Revision Required",
          paymentStatus: "Pending",
        },
        {
          sNo: 3,
          companyName: "Sunshine Enterprises",
          orderId: "ORD-1731862547-445",
          labelQty: 10000,
          productionQty: 11784,
          artwork: "Approved",
          paymentStatus: "Partial",
        },
        {
          sNo: 4,
          companyName: "Golden Pack",
          orderId: "ORD-1733866394-396",
          labelQty: 5000,
          productionQty: 5536,
          artwork: "Revision Required",
          paymentStatus: "Paid",
        },
        {
          sNo: 5,
          companyName: "XYZ Corp",
          orderId: "ORD-1731578070-581",
          labelQty: 3000,
          productionQty: 8431,
          artwork: "Revision Required",
          paymentStatus: "Partial",
        },
      ],
      "500ml": [
        {
          sNo: 1,
          companyName: "Sunshine Enterprises",
          orderId: "ORD-1739004230-426",
          labelQty: 15000,
          productionQty: 14911,
          artwork: "Approved",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Urban Packaging",
          orderId: "ORD-1734340089-502",
          labelQty: 3000,
          productionQty: 16624,
          artwork: "Revision Required",
          paymentStatus: "Partial",
        },
        {
          sNo: 3,
          companyName: "Fresh Foods Inc",
          orderId: "ORD-1736657752-248",
          labelQty: 5000,
          productionQty: 15855,
          artwork: "Pending",
          paymentStatus: "Partial",
        },
      ],
      "1000ml": [
        {
          sNo: 1,
          companyName: "ABC Industries",
          orderId: "ORD-1733695851-165",
          labelQty: 5000,
          productionQty: 14673,
          artwork: "In Review",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Precision Pack",
          orderId: "ORD-1738016423-888",
          labelQty: 3000,
          productionQty: 17889,
          artwork: "In Review",
          paymentStatus: "Advance",
        },
        {
          sNo: 3,
          companyName: "XYZ Corp",
          orderId: "ORD-1734941736-371",
          labelQty: 2000,
          productionQty: 10946,
          artwork: "In Review",
          paymentStatus: "Paid",
        },
        {
          sNo: 4,
          companyName: "Urban Packaging",
          orderId: "ORD-1735862685-175",
          labelQty: 15000,
          productionQty: 19282,
          artwork: "In Review",
          paymentStatus: "Pending",
        },
        {
          sNo: 5,
          companyName: "Silver Line Ltd",
          orderId: "ORD-1733878468-924",
          labelQty: 7500,
          productionQty: 14241,
          artwork: "Revision Required",
          paymentStatus: "Advance",
        },
        {
          sNo: 6,
          companyName: "Green Valley Foods",
          orderId: "ORD-1737810993-196",
          labelQty: 5000,
          productionQty: 4581,
          artwork: "Pending",
          paymentStatus: "Pending",
        },
      ],
    },
    Rectangle: {
      "500ml": [
        {
          sNo: 1,
          companyName: "Omega Packaging",
          orderId: "ORD-1738744993-668",
          labelQty: 3000,
          productionQty: 9701,
          artwork: "Revision Required",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Prime Containers",
          orderId: "ORD-1732058656-343",
          labelQty: 5000,
          productionQty: 3099,
          artwork: "Approved",
          paymentStatus: "Partial",
        },
        {
          sNo: 3,
          companyName: "Precision Pack",
          orderId: "ORD-1736891103-501",
          labelQty: 10000,
          productionQty: 12765,
          artwork: "Pending",
          paymentStatus: "Pending",
        },
        {
          sNo: 4,
          companyName: "Mountain View Corp",
          orderId: "ORD-1733327963-715",
          labelQty: 10000,
          productionQty: 9882,
          artwork: "Pending",
          paymentStatus: "Advance",
        },
        {
          sNo: 5,
          companyName: "Fresh Foods Inc",
          orderId: "ORD-1735764021-177",
          labelQty: 3000,
          productionQty: 16473,
          artwork: "Approved",
          paymentStatus: "Partial",
        },
        {
          sNo: 6,
          companyName: "Sunshine Enterprises",
          orderId: "ORD-1739967845-407",
          labelQty: 3000,
          productionQty: 13649,
          artwork: "Approved",
          paymentStatus: "Partial",
        },
      ],
      "650ml": [
        {
          sNo: 1,
          companyName: "ABC Industries",
          orderId: "ORD-1732086653-624",
          labelQty: 3000,
          productionQty: 19248,
          artwork: "In Review",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Royal Plastics",
          orderId: "ORD-1732923124-964",
          labelQty: 15000,
          productionQty: 14180,
          artwork: "Pending",
          paymentStatus: "Paid",
        },
        {
          sNo: 3,
          companyName: "Galaxy Industries",
          orderId: "ORD-1731900480-645",
          labelQty: 15000,
          productionQty: 14103,
          artwork: "Revision Required",
          paymentStatus: "Partial",
        },
        {
          sNo: 4,
          companyName: "Metro Packaging",
          orderId: "ORD-1731945025-921",
          labelQty: 10000,
          productionQty: 8047,
          artwork: "In Review",
          paymentStatus: "Advance",
        },
      ],
      "750ml": [
        {
          sNo: 1,
          companyName: "Sunshine Enterprises",
          orderId: "ORD-1732507748-788",
          labelQty: 3000,
          productionQty: 13715,
          artwork: "Revision Required",
          paymentStatus: "Partial",
        },
        {
          sNo: 2,
          companyName: "Quality Containers",
          orderId: "ORD-1736117534-707",
          labelQty: 10000,
          productionQty: 19584,
          artwork: "Approved",
          paymentStatus: "Partial",
        },
        {
          sNo: 3,
          companyName: "Omega Packaging",
          orderId: "ORD-1732585284-730",
          labelQty: 2000,
          productionQty: 4735,
          artwork: "Approved",
          paymentStatus: "Advance",
        },
        {
          sNo: 4,
          companyName: "Green Valley Foods",
          orderId: "ORD-1735984455-972",
          labelQty: 10000,
          productionQty: 9004,
          artwork: "Revision Required",
          paymentStatus: "Paid",
        },
      ],
    },
    "Sweet Box": {
      "250gms": [
        {
          sNo: 1,
          companyName: "Coastal Industries",
          orderId: "ORD-1733765258-706",
          labelQty: 7500,
          productionQty: 18860,
          artwork: "Pending",
          paymentStatus: "Paid",
        },
        {
          sNo: 2,
          companyName: "XYZ Corp",
          orderId: "ORD-1738243883-844",
          labelQty: 5000,
          productionQty: 6142,
          artwork: "Revision Required",
          paymentStatus: "Advance",
        },
        {
          sNo: 3,
          companyName: "Precision Pack",
          orderId: "ORD-1732916390-149",
          labelQty: 2000,
          productionQty: 12860,
          artwork: "In Review",
          paymentStatus: "Pending",
        },
      ],
      "500gms": [
        {
          sNo: 1,
          companyName: "Omega Packaging",
          orderId: "ORD-1737045863-632",
          labelQty: 3000,
          productionQty: 8567,
          artwork: "Pending",
          paymentStatus: "Partial",
        },
        {
          sNo: 2,
          companyName: "Golden Pack",
          orderId: "ORD-1739886796-464",
          labelQty: 7500,
          productionQty: 1821,
          artwork: "Pending",
          paymentStatus: "Pending",
        },
        {
          sNo: 3,
          companyName: "Silver Line Ltd",
          orderId: "ORD-1737266176-809",
          labelQty: 7500,
          productionQty: 2017,
          artwork: "Pending",
          paymentStatus: "Paid",
        },
      ],
    },
    "Sweet Box TE": {
      "TE 250gms": [
        {
          sNo: 1,
          companyName: "Golden Pack",
          orderId: "ORD-1731261481-983",
          labelQty: 3000,
          productionQty: 9547,
          artwork: "Revision Required",
          paymentStatus: "Paid",
        },
        {
          sNo: 2,
          companyName: "ABC Industries",
          orderId: "ORD-1734534340-587",
          labelQty: 7500,
          productionQty: 14501,
          artwork: "Pending",
          paymentStatus: "Paid",
        },
        {
          sNo: 3,
          companyName: "Delta Foods",
          orderId: "ORD-1739236019-515",
          labelQty: 20000,
          productionQty: 13823,
          artwork: "Revision Required",
          paymentStatus: "Partial",
        },
      ],
      "TE 500gms": [
        {
          sNo: 1,
          companyName: "Mountain View Corp",
          orderId: "ORD-1735509549-173",
          labelQty: 5000,
          productionQty: 10832,
          artwork: "In Review",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Green Valley Foods",
          orderId: "ORD-1738524997-398",
          labelQty: 10000,
          productionQty: 8884,
          artwork: "In Review",
          paymentStatus: "Paid",
        },
        {
          sNo: 3,
          companyName: "Quality Containers",
          orderId: "ORD-1736389578-806",
          labelQty: 5000,
          productionQty: 8784,
          artwork: "Approved",
          paymentStatus: "Partial",
        },
      ],
    },
    "Round Square": {
      "450ml": [
        {
          sNo: 1,
          companyName: "XYZ Corp",
          orderId: "ORD-1735204456-420",
          labelQty: 2000,
          productionQty: 12298,
          artwork: "Approved",
          paymentStatus: "Advance",
        },
        {
          sNo: 2,
          companyName: "Blue Ocean Co",
          orderId: "ORD-1738957234-984",
          labelQty: 5000,
          productionQty: 13472,
          artwork: "Revision Required",
          paymentStatus: "Paid",
        },
        {
          sNo: 3,
          companyName: "Galaxy Industries",
          orderId: "ORD-1739279613-767",
          labelQty: 3000,
          productionQty: 18180,
          artwork: "In Review",
          paymentStatus: "Partial",
        },
        {
          sNo: 4,
          companyName: "ABC Industries",
          orderId: "ORD-1732251338-946",
          labelQty: 7500,
          productionQty: 6032,
          artwork: "Revision Required",
          paymentStatus: "Paid",
        },
      ],
      "500ml": [
        {
          sNo: 1,
          companyName: "Coastal Industries",
          orderId: "ORD-1732660499-107",
          labelQty: 5000,
          productionQty: 6797,
          artwork: "Approved",
          paymentStatus: "Pending",
        },
        {
          sNo: 2,
          companyName: "Fresh Foods Inc",
          orderId: "ORD-1736524337-239",
          labelQty: 2000,
          productionQty: 15005,
          artwork: "Revision Required",
          paymentStatus: "Pending",
        },
        {
          sNo: 3,
          companyName: "Supreme Plastics",
          orderId: "ORD-1735380602-160",
          labelQty: 10000,
          productionQty: 12221,
          artwork: "Approved",
          paymentStatus: "Paid",
        },
        {
          sNo: 4,
          companyName: "Prime Containers",
          orderId: "ORD-1738916468-245",
          labelQty: 7500,
          productionQty: 15336,
          artwork: "Revision Required",
          paymentStatus: "Paid",
        },
        {
          sNo: 5,
          companyName: "Blue Ocean Co",
          orderId: "ORD-1739817122-866",
          labelQty: 7500,
          productionQty: 17242,
          artwork: "Revision Required",
          paymentStatus: "Partial",
        },
        {
          sNo: 6,
          companyName: "Delta Foods",
          orderId: "ORD-1732203508-247",
          labelQty: 7500,
          productionQty: 10983,
          artwork: "Revision Required",
          paymentStatus: "Advance",
        },
      ],
    },
  };

  const [searchCompany, setSearchCompany] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSizes, setExpandedSizes] = useState({});

  // Auto-expand categories and sizes when searching
  useEffect(() => {
    if (searchCompany.trim()) {
      const newExpandedCategories = {};
      const newExpandedSizes = {};

      Object.entries(PRODUCT_CATEGORIES).forEach(([productName, sizes]) => {
        let hasMatch = false;
        sizes.forEach((size) => {
          const data = REPORTS_DATA[productName]?.[size] || [];
          const hasCompanyMatch = data.some((record) =>
            record.companyName
              .toLowerCase()
              .includes(searchCompany.toLowerCase())
          );
          if (hasCompanyMatch) {
            hasMatch = true;
            newExpandedSizes[`${productName}-${size}`] = true;
          }
        });
        if (hasMatch) {
          newExpandedCategories[productName] = true;
        }
      });

      setExpandedCategories(newExpandedCategories);
      setExpandedSizes(newExpandedSizes);
    }
  }, [searchCompany]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Toggle size expansion
  const toggleSize = (category, size) => {
    const key = `${category}-${size}`;
    setExpandedSizes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter data by company search
  const filterDataByCompany = (data) => {
    if (!searchCompany.trim()) return data;
    return data.filter((record) =>
      record.companyName.toLowerCase().includes(searchCompany.toLowerCase())
    );
  };

  // Get available sizes based on selected product
  const getAvailableSizes = () => {
    if (!selectedProduct) return [];
    return PRODUCT_CATEGORIES[selectedProduct] || [];
  };

  // Filter products to display
  const getFilteredProducts = () => {
    if (!selectedProduct) {
      return Object.keys(PRODUCT_CATEGORIES);
    }
    return [selectedProduct];
  };

  // Filter sizes to display
  const getFilteredSizes = (productName) => {
    const allSizes = PRODUCT_CATEGORIES[productName];
    if (!selectedSize) return allSizes;
    return allSizes.filter((size) => size === selectedSize);
  };

  // Reset size filter when product changes
  useEffect(() => {
    setSelectedSize("");
  }, [selectedProduct]);

  return (
    <div className="min-h-screen bg-gray-50 p-0">
      <div className="max-w-[90vw] mx-auto bg-white rounded-[0.8vw] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-[1vw_1.5vw] border-b-2 border-gray-300 bg-white">
          <h1 className="text-[1.8vw] font-bold text-gray-800 m-0">
            📊 Reports Dashboard
          </h1>
          <div className="relative w-[22vw]">
            <svg
              className="absolute left-[0.8vw] top-[50%] translate-y-[-50%] w-[1.2vw] h-[1.2vw] text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              className="w-full pl-[2.5vw] pr-[0.45vw] py-[0.45vw] border-2 border-gray-300 bg-white rounded-[0.5vw] text-[0.9vw] outline-none box-border focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex gap-[1.5vw] p-[1.5vw_2vw] bg-white border-b border-gray-300">
          <div className="flex items-center gap-[0.8vw]">
            <label className="text-[0.9vw] font-semibold text-gray-700 whitespace-nowrap">
              Filter by Product:
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-[1vw] py-[0.6vw] border-2 border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none cursor-pointer focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm min-w-[12vw]"
            >
              <option value="">All Products</option>
              {Object.keys(PRODUCT_CATEGORIES).map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-[0.8vw]">
            <label className="text-[0.9vw] font-semibold text-gray-700 whitespace-nowrap">
              Filter by Size:
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={!selectedProduct}
              className="px-[1vw] py-[0.6vw] border-2 border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none cursor-pointer focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm min-w-[10vw] disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <option value="">All Sizes</option>
              {getAvailableSizes().map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {(selectedProduct || selectedSize) && (
            <button
              onClick={() => {
                setSelectedProduct("");
                setSelectedSize("");
              }}
              className="ml-auto px-[1.2vw] py-[0.6vw] bg-red-500 hover:bg-red-600 text-white rounded-[0.5vw] text-[0.85vw] font-medium transition-all shadow-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-[1.5vw] max-h-[65vh] overflow-y-auto">
          {getFilteredProducts().map((productName) => {
            const sizes = getFilteredSizes(productName);
            return (
              <div key={productName} className="mb-[2vw]">
                {/* Product Category Header */}
                <div
                  className="bg-[#3d64bb] text-white px-[1vw] py-[1vw] rounded-[0.6vw] text-[1.1vw] font-semibold cursor-pointer flex justify-between items-center transition-all shadow-md"
                  onClick={() => toggleCategory(productName)}
                >
                  <span className="flex items-center gap-[0.8vw]">
                    <span className="text-[1.3vw]">
                      <svg
                        className="w-[1.3vw] h-[1.3vw]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </span>
                    {productName}
                  </span>
                  <svg
                    className={`w-[1.3vw] h-[1.3vw] transition-transform duration-300 ${
                      expandedCategories[productName] ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Category Content */}
                {expandedCategories[productName] && (
                  <div className="bg-white rounded-b-[0.6vw] border-2 border-gray-300 border-t-0 shadow-sm">
                    {sizes.map((size) => {
                      const sizeKey = `${productName}-${size}`;
                      const rawData = REPORTS_DATA[productName][size] || [];
                      const filteredData = filterDataByCompany(rawData);

                      return (
                        <div
                          key={size}
                          className="p-[1vw] border-b-2 border-gray-200 last:border-b-0"
                        >
                          {/* Size Header */}
                          <div
                            className="bg-[#41a5b5] text-white px-[1.3vw] py-[0.7vw] rounded-[0.5vw] text-[1vw] font-semibold cursor-pointer flex justify-between items-center transition-all shadow-sm"
                            onClick={() => toggleSize(productName, size)}
                          >
                            <span className="flex items-center gap-[0.6vw]">
                              <span className="text-[1.1vw]">
                                <svg
                                  className="w-[1.1vw] h-[1.1vw]"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                              {size}
                            </span>
                            <svg
                              className={`w-[1.1vw] h-[1.1vw] transition-transform duration-300 ${
                                expandedSizes[sizeKey] ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>

                          {/* Table */}
                          {expandedSizes[sizeKey] && (
                            <div className="mt-[1.2vw] overflow-x-auto">
                              {filteredData.length > 0 ? (
                                <table className="w-full border-collapse bg-white rounded-[0.6vw] overflow-hidden shadow-md border-2 border-gray-300">
                                  <thead>
                                    <tr className="bg-slate-700 text-white">
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        S. No
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        Company Name
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        Order ID
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        Label Qty
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        Production Qty
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        Artwork
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold">
                                        Payment Status
                                      </th>
                                      <th className="border border-gray-400 px-[1.2vw] py-[0.8vw] text-left text-[0.9vw] font-bold ">
                                        View
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredData.map((record, index) => (
                                      <tr
                                        key={record.sNo}
                                        className={`${
                                          index % 2 === 0
                                            ? "bg-gray-50"
                                            : "bg-white"
                                        } hover:bg-blue-50 transition-colors`}
                                      >
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.85vw] text-gray-800 font-medium">
                                          {record.sNo}
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.85vw] text-gray-800 font-semibold">
                                          {record.companyName}
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.8vw] text-gray-600 font-mono">
                                          {record.orderId}
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.85vw] text-gray-800 font-medium">
                                          {record.labelQty.toLocaleString()}
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.85vw] text-gray-800 font-medium">
                                          {record.productionQty.toLocaleString()}
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.8vw]">
                                          <span
                                            className={`px-[0.8vw] py-[0.3vw] rounded-[0.3vw] text-[0.8vw] font-bold ${
                                              record.artwork === "Approved"
                                                ? "bg-green-100 text-green-600 border border-green-300"
                                                : record.artwork === "In Review"
                                                ? "bg-blue-100 text-blue-600 border border-blue-300"
                                                : record.artwork ===
                                                  "Revision Required"
                                                ? "bg-orange-100 text-orange-600 border border-orange-300"
                                                : "bg-yellow-100 text-yellow-600 border border-yellow-300"
                                            }`}
                                          >
                                            {record.artwork}
                                          </span>
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.8vw]">
                                          <span
                                            className={`px-[0.8vw] py-[0.3vw] rounded-[0.3vw] text-[0.8vw] font-bold ${
                                              record.paymentStatus === "Paid"
                                                ? "bg-green-100 text-green-600 border border-green-300"
                                                : record.paymentStatus ===
                                                  "Advance"
                                                ? "bg-blue-100 text-blue-600 border border-blue-300"
                                                : record.paymentStatus ===
                                                  "Partial"
                                                ? "bg-purple-100 text-purple-600 border border-purple-300"
                                                : "bg-red-100 text-red-600 border border-red-300"
                                            }`}
                                          >
                                            {record.paymentStatus}
                                          </span>
                                        </td>
                                        <td className="border border-gray-300 px-[1.2vw] py-[0.7vw] text-[0.8vw] text-center">
                                          <button className="px-[1vw] py-[0.4vw] bg-[#388ce3] text-white rounded-[0.4vw] text-[0.8vw] font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer">
                                            View
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="bg-gray-50 rounded-[0.6vw] p-[2.5vw] text-center border-2 border-gray-300">
                                  <svg
                                    className="mx-auto w-[3vw] h-[3vw] text-gray-400 mb-[1vw]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <p className="text-[1vw] text-gray-600 font-semibold">
                                    No company found matching "{searchCompany}"
                                  </p>
                                </div>
                              )}
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
      </div>
    </div>
  );
};

export default Reports;
