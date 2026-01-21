import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NewOrder from "./NewOrder";

// Mock data storage (In production, this would be an API/Database)
const DATA_VERSION = "2.0"; // Increment this when structure changes
const STORAGE_KEY = "imlorders";
const VERSION_KEY = "imlorders_version";

// Product size options for initial expansion
const PRODUCT_SIZE_OPTIONS = {
  Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
  "Round Square": ["450ml", "500ml"],
  Rectangle: ["500ml", "650ml", "750ml"],
  "Sweet Box": ["250gms", "500gms"],
  "Sweet Box TE": ["TE 250gms", "TE 500gms"],
};

export default function OrdersManagement2() {
  console.log("OrdersManagement2 component rendered");

  const [view, setView] = useState("dashboard"); // 'dashboard' or 'form'
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState("all"); // "all" or "remaining"
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

   const [previewModal, setPreviewModal] = useState({
      isOpen: false,
      type: null,
      path: null,
      name: null,
    });
  
    const previewModalRef = useRef(null);

  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== DATA_VERSION) {
      console.log(`Data version mismatch. Clearing old data...`);
      console.log(
        `Old version: ${storedVersion}, New version: ${DATA_VERSION}`
      );

      // Clear old data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);

      // Initialize with fresh dummy data
      initializeDummyData();

      alert(
        `Data structure updated to version ${DATA_VERSION}. Old data has been cleared.`
      );
    }
  }, []);

  // Initialize with dummy data if no orders exist
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedOrders = JSON.parse(stored);
      setOrders(parsedOrders);

      // If no orders exist, initialize with dummy data
      if (parsedOrders.length === 0) {
        initializeDummyData();
      }
    } else {
      initializeDummyData();
    }
  }, []);

  // Initialize dummy data
  const initializeDummyData = () => {
    const dummyOrders = [
      {
        id: "ORD-10134",
        contact: {
          company: "ABC Industries",
          contactName: "John Smith",
          phone: "9876543210",
          priority: "high",
        },
        orderNumber: "ORD-1298-002-141",
        orderEstimate: {
          estimatedNumber: "EST-001",
          estimatedValue: 45000,
        },
        products: [
          {
            id: 1,
            productName: "Round",
            size: "300ml",
            imlName: "Premium IML Labels", // MOVED HERE
            imlType: "LID",
            lidColor: "red",
            tubColor: "transparent",
            lidLabelQty: "1000",
            lidProductionQty: "600",
            lidStock: 400,
            tubLabelQty: "",
            tubProductionQty: "",
            tubStock: 0,
            budget: 20000,
            approvedDate: "2025-12-10",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToPurchase: false,
          },
          {
            id: 2,
            productName: "Round Square",
            size: "500ml",
            imlName: "Quality IML Solutions", // Different IML name for this product
            imlType: "TUB",
            lidColor: "transparent",
            tubColor: "blue",
            lidLabelQty: "",
            lidProductionQty: "",
            lidStock: 0,
            tubLabelQty: "1500",
            tubProductionQty: "1200",
            tubStock: 300,
            budget: 25000,
            approvedDate: "2025-12-11",
            designSharedMail: true,
            designStatus: "pending",
            designType: "new",
            moveToPurchase: false,
          },
        ],
        payment: {
          totalEstimated: 45000,
          remarks: "Advance received",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-10T10:30:00.000Z",
            paymentType: "advance",
            method: "Cash",
            amount: 10000,
            remarks: "Advance payment",
            createdAt: "2025-12-10T10:30:00.000Z",
          },
          {
            timestamp: "2025-12-12T09:00:00.000Z",
            paymentType: "advance",
            method: "UPI",
            amount: 15000,
            remarks: "Second installment",
            createdAt: "2025-12-12T09:00:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-10T08:00:00.000Z",
      },
      {
        id: "ORD-10135",
        contact: {
          company: "XYZ Corporation",
          contactName: "Jane Doe",
          phone: "9123456780",
          priority: "medium",
        },
        orderNumber: "ORD-1298-202-541",
        orderEstimate: {
          estimatedNumber: "EST-002",
          estimatedValue: 35000,
        },
        products: [
          {
            id: 3,
            productName: "Sweet Box",
            size: "250gms",
            imlName: "Eco IML Series", // MOVED HERE
            imlType: "TUB",
            lidColor: "transparent",
            tubColor: "yellow",
            lidLabelQty: "",
            lidProductionQty: "",
            lidStock: 0,
            tubLabelQty: "1500",
            tubProductionQty: "1200",
            tubStock: 300,
            budget: 35000,
            approvedDate: "2025-12-13",
            designSharedMail: false,
            designStatus: "in-progress",
            designType: "new",
            moveToPurchase: false,
          },
        ],
        payment: {
          totalEstimated: 35000,
          remarks: "",
        },
        paymentRecords: [],
        status: "pending",
        createdAt: "2025-12-11T09:30:00.000Z",
      },
      {
        id: "ORD-10136",
        contact: {
          company: "LMN Packaging",
          contactName: "Rahul Mehta",
          phone: "9001122334",
          priority: "low",
        },
        orderNumber: "ORD-1298-302-541",
        orderEstimate: {
          estimatedNumber: "EST-003",
          estimatedValue: 18000,
        },
        products: [
          {
            id: 4,
            productName: "Rectangle",
            size: "750ml",
            imlName: "Standard IML", // MOVED HERE
            imlType: "LID",
            lidColor: "green",
            tubColor: "transparent",
            lidLabelQty: "800",
            lidProductionQty: "800",
            lidStock: 0,
            tubLabelQty: "",
            tubProductionQty: "",
            tubStock: 0,
            budget: 18000,
            approvedDate: "2025-12-12",
            designSharedMail: true,
            designStatus: "approved",
            designType: "existing",
            moveToPurchase: false,
          },
        ],
        payment: {
          totalEstimated: 18000,
          remarks: "Full payment received",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-12T11:15:00.000Z",
            paymentType: "advance",
            method: "Bank Transfer",
            amount: 18000,
            remarks: "Complete payment",
            createdAt: "2025-12-12T11:15:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-12T08:00:00.000Z",
      },
      {
        id: "ORD-10137",
        contact: {
          company: "OPQ Labels",
          contactName: "Simran Kaur",
          phone: "9988776655",
          priority: "medium",
        },
        orderNumber: "ORD-3298-502-541",
        orderEstimate: {
          estimatedNumber: "EST-004",
          estimatedValue: 60000,
        },
        products: [
          {
            id: 5,
            productName: "Round",
            size: "1000ml",
            imlName: "Premium Plus IML", // MOVED HERE
            imlType: "LID TUB",
            lidColor: "orange",
            tubColor: "white",
            lidLabelQty: "1200",
            lidProductionQty: "1000",
            lidStock: 200,
            tubLabelQty: "1200",
            tubProductionQty: "900",
            tubStock: 300,
            budget: 40000,
            approvedDate: "2025-12-13",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToPurchase: false,
          },
          {
            id: 6,
            productName: "Rectangle",
            size: "500ml",
            imlName: "Classic IML Design", // Different IML name
            imlType: "LID",
            lidColor: "golden",
            tubColor: "transparent",
            lidLabelQty: "800",
            lidProductionQty: "400",
            lidStock: 400,
            tubLabelQty: "",
            tubProductionQty: "",
            tubStock: 0,
            budget: 20000,
            approvedDate: "2025-12-14",
            designSharedMail: false,
            designStatus: "pending",
            designType: "new",
            moveToPurchase: false,
          },
        ],
        payment: {
          totalEstimated: 60000,
          remarks: "Partial payment done",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-13T09:00:00.000Z",
            paymentType: "advance",
            method: "Cash",
            amount: 20000,
            remarks: "First advance",
            createdAt: "2025-12-13T09:00:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-13T08:00:00.000Z",
      },
      {
        id: "ORD-10138",
        contact: {
          company: "RST Products",
          contactName: "Anil Kumar",
          phone: "9876501234",
          priority: "high",
        },
        orderNumber: "ORD-5798-302-541",
        orderEstimate: {
          estimatedNumber: "EST-005",
          estimatedValue: 75000,
        },
        products: [
          {
            id: 7,
            productName: "Sweet Box TE",
            size: "TE 500gms",
            imlName: "Modern IML Tech", // MOVED HERE
            imlType: "TUB",
            lidColor: "transparent",
            tubColor: "white",
            lidLabelQty: "",
            lidProductionQty: "",
            lidStock: 0,
            tubLabelQty: "3000",
            tubProductionQty: "2000",
            tubStock: 1000,
            budget: 75000,
            approvedDate: "2025-12-14",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToPurchase: false,
          },
        ],
        payment: {
          totalEstimated: 75000,
          remarks: "Full payment done",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-14T10:00:00.000Z",
            paymentType: "advance",
            method: "Bank Transfer",
            amount: 75000,
            remarks: "Paid in full",
            createdAt: "2025-12-14T10:00:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-14T08:00:00.000Z",
      },
      {
        id: "ORD-10139",
        contact: {
          company: "Global Packaging",
          contactName: "Emily Davis",
          phone: "9765432100",
          priority: "high",
        },
        orderNumber: "ORD-6798-402-641",
        orderEstimate: {
          estimatedNumber: "EST-006",
          estimatedValue: 90000,
        },
        products: [
          {
            id: 8,
            productName: "Round Square",
            size: "450ml",
            imlName: "Premium IML Labels", // Same IML name as another order
            imlType: "LID TUB",
            lidColor: "black",
            tubColor: "golden",
            lidLabelQty: "2000",
            lidProductionQty: "1500",
            lidStock: 500,
            tubLabelQty: "2000",
            tubProductionQty: "1800",
            tubStock: 200,
            budget: 50000,
            approvedDate: "2025-12-15",
            designSharedMail: true,
            designStatus: "in-progress",
            designType: "existing",
            moveToPurchase: false,
          },
          {
            id: 9,
            productName: "Rectangle",
            size: "650ml",
            imlName: "Eco IML Series", // Same as another order
            imlType: "TUB",
            lidColor: "transparent",
            tubColor: "red",
            lidLabelQty: "",
            lidProductionQty: "",
            lidStock: 0,
            tubLabelQty: "1800",
            tubProductionQty: "1800",
            tubStock: 0,
            budget: 40000,
            approvedDate: "2025-12-16",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToPurchase: false,
          },
        ],
        payment: {
          totalEstimated: 90000,
          remarks: "Awaiting payment",
        },
        paymentRecords: [],
        status: "pending",
        createdAt: "2025-12-15T08:00:00.000Z",
      },
    ];

    setOrders(dummyOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyOrders));
  };

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  // Auto-expand companies and first order on load
  useEffect(() => {
    if (orders.length > 0) {
      const groupedOrders = groupOrdersByCompany();
      const newExpandedCompanies = {};
      const newExpandedOrders = {};

      // Expand all companies
      Object.entries(groupedOrders).forEach(([companyName, orders]) => {
        newExpandedCompanies[companyName] = true;

        // Expand first order for each company
        Object.keys(orders).forEach((orderKey) => {
          newExpandedOrders[`${companyName}:::${orderKey}`] = true;
        });
      });

      setExpandedCompanies(newExpandedCompanies);
      setExpandedOrders(newExpandedOrders);
    }
  }, [orders.length]);

  // Auto-expand when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const newExpandedCompanies = {};
      const newExpandedOrders = {};
      const groupedOrders = groupOrdersByCompany();

      Object.entries(groupedOrders).forEach(([companyName, orders]) => {
        const companyMatchesSearch = companyName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (companyMatchesSearch) {
          newExpandedCompanies[companyName] = true;

          // Expand all orders for matching company
          Object.keys(orders).forEach((orderKey) => {
            newExpandedOrders[`${companyName}:::${orderKey}`] = true;
          });
        }
      });

      setExpandedCompanies(newExpandedCompanies);
      setExpandedOrders(newExpandedOrders);
    }
  }, [searchTerm, orders]);

  // Handle create new order
  const handleNewOrder = () => {
    setEditingOrder(null);
    setView("form");
  };

  // Handle edit order
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setView("form");
  };

  // Handle delete order
  const handleDeleteOrder = (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter((order) => order.id !== orderId));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders.filter((order) => order.id !== orderId))
      );
    }
  };

  // Handle move to purchase
  const handleMoveToPurchase = (order) => {
    // Check if any products in this order
    if (!order.products || order.products.length === 0) {
      alert("This order has no products to move.");
      return;
    }

    // Check if already moved
    const alreadyMoved = order.products.every((p) => p.moveToPurchase === true);

    if (alreadyMoved) {
      alert("This order has already been moved to Purchase Management.");
      return;
    }

    const confirmMessage = `Are you sure you want to move this order to Purchase Management?\n\nCompany: ${order.contact.company}\nProducts: ${order.products.length}`;

    if (window.confirm(confirmMessage)) {
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            products: o.products.map((p) => ({
              ...p,
              moveToPurchase: true,
            })),
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

      // **NEW: Trigger custom event**
      window.dispatchEvent(new Event("ordersUpdated"));

      alert("Order successfully moved to Purchase Management!");
    }
  };

  // Function to calculate remaining labels for a product
  const calculateRemainingLabels = (product) => {
    console.log("🔍 Checking product:", product.productName, product);

    let remaining = 0;

    if (product.imlType === "LID" || product.imlType === "LID TUB") {
      const lidOrdered = parseInt(product.lidLabelQty) || 0;
      const lidProduced = parseInt(product.lidProductionQty) || 0;
      remaining += lidOrdered - lidProduced;
      console.log(
        `  LID: ${lidOrdered} ordered - ${lidProduced} produced = ${
          lidOrdered - lidProduced
        }`
      );
    }

    if (product.imlType === "TUB" || product.imlType === "LID TUB") {
      const tubOrdered = parseInt(product.tubLabelQty) || 0;
      const tubProduced = parseInt(product.tubProductionQty) || 0;
      remaining += tubOrdered - tubProduced;
      console.log(
        `  TUB: ${tubOrdered} ordered - ${tubProduced} produced = ${
          tubOrdered - tubProduced
        }`
      );
    }

    console.log(`  ✅ Total remaining: ${remaining}`);
    return remaining;
  };

    const PreviewModal = () => {
    if (!previewModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50000 flex items-center justify-center p-4">
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

  // Check if order has remaining labels
  const hasRemainingLabels = (order) => {
    console.log("📦 Checking order:", order.orderNumber || order.id, order);

    if (!order.products || order.products.length === 0) {
      console.log("  ❌ No products found");
      return false;
    }

    const hasRemaining = order.products.some((product) => {
      const remaining = calculateRemainingLabels(product);
      return remaining > 0;
    });

    console.log(
      `  Result: ${hasRemaining ? "✅ HAS" : "❌ NO"} remaining labels`
    );
    return hasRemaining;
  };

  // Handle form submission from NewOrder component
  const handleOrderSubmit = (orderData) => {
    let isNotShowAlert = false;
    if (editingOrder) {
      // Update existing order
      const isValidDate = (date) => {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
      };

      const updatedOrders = orders.map((order) =>
        order.id === editingOrder.id
          ? {
              ...orderData,
              ...orderData,
              id: editingOrder.id,
              createdAt: isValidDate(order.createdAt)
                ? order.createdAt
                : isValidDate(editingOrder.createdAt)
                ? editingOrder.createdAt
                : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : order
      );
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));
      isNotShowAlert = true;
      alert("Your order has been updated");
    } else {
      // Add new order
      const now = new Date().toISOString();

      const newOrder = {
        ...orderData,
        id: Date.now(),
        createdAt: now,
        updatedAt: now,
      };
      setOrders([...orders, newOrder]);
    }

    setView("dashboard");
    if (!isNotShowAlert) {
      alert("Your order has been created");
    }
    setEditingOrder(null);
  };

  // Handle cancel from form
  const handleCancel = () => {
    setView("dashboard");
    setEditingOrder(null);
  };

  // Handle cancel from form
  const handleBack = () => {
    setView("dashboard");
    setEditingOrder(null);
  };

  const toggleCompany = (companyName) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyName]: !prev[companyName],
    }));
  };

  // Toggle order expansion within a company
  const toggleOrder = (companyName, orderKey) => {
    const key = `${companyName}:::${orderKey}`;
    setExpandedOrders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // NEW: Group orders by Company → Order ID & IML Name
  const groupOrdersByCompany = () => {
    const grouped = {};

    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });

    sortedOrders.forEach((order) => {
      const companyName = order.contact.company || "Unknown Company";
      const orderNumber = order.orderNumber || "N/A";

      // Create company group if doesn't exist
      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      // Create unique key for order: "OrderID | IML Name"
      const orderKey = `${orderNumber}`;

      // Store the entire order under this key
      grouped[companyName][orderKey] = order;
    });

    return grouped;
  };

  // Get unique product names from all orders
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

  // Get unique sizes for a specific product
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

  // Filter orders based on search, status, product, and size
  const filterOrders = (ordersList) => {
    return ordersList.filter((order) => {
      const matchesSearch =
        order.contact.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.contact.contactName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.contact.imlName.toLowerCase().includes(searchTerm.toLowerCase());

      const artworkStatus = getArtworkStatusForOrder(order);

      const matchesStatus =
        filterStatus === "all" || artworkStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  // Filter orders within the new grouping structure

  const getFilteredGroupedOrders = () => {
    const allGrouped = groupOrdersByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, order]) => {
        // 1. SEARCH FILTER - Check company name, contact name, and product IML names
        let matchesSearch = true;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          matchesSearch =
            companyName.toLowerCase().includes(searchLower) ||
            order.contact.contactName.toLowerCase().includes(searchLower) ||
            order.contact.phone.toLowerCase().includes(searchLower) ||
            // NEW: Search in product IML names
            order.products?.some((product) =>
              product.imlName?.toLowerCase().includes(searchLower)
            );
        }

        // 2. ARTWORK STATUS FILTER
        const artworkStatus = getArtworkStatusForOrder(order);
        const matchesStatus =
          filterStatus === "all" || artworkStatus === filterStatus;

        // 3. PRODUCT FILTER - Check if any product matches selected product
        let matchesProduct = true;
        if (selectedProduct) {
          matchesProduct = order.products?.some(
            (product) => product.productName === selectedProduct
          );
        }

        // 4. SIZE FILTER - Check if any product matches selected size
        let matchesSize = true;
        if (selectedSize && selectedProduct) {
          matchesSize = order.products?.some(
            (product) =>
              product.productName === selectedProduct &&
              product.size === selectedSize
          );
        }

        // 5. VIEW MODE FILTER - Remaining orders only
        const matchesViewMode = viewMode === "all" || hasRemainingLabels(order);

        // Apply all filters
        if (
          matchesSearch &&
          matchesStatus &&
          matchesProduct &&
          matchesSize &&
          matchesViewMode
        ) {
          if (!filtered[companyName]) {
            filtered[companyName] = {};
          }
          filtered[companyName][orderKey] = order;
        }
      });
    });

    return filtered;
  };

  const hasMovedToPurchase = (order) => {
    return (
      order.products?.some((product) => product.moveToPurchase === true) ||
      false
    );
  };

  const getArtworkStatusForOrder = (order) => {
    if (!order.products || order.products.length === 0) return "pending";

    // you can change the rule here if needed (e.g., prioritize in-progress over pending)
    const statuses = order.products.map((p) =>
      (p.designStatus || "pending").toLowerCase()
    );

    if (statuses.includes("in-progress")) return "in-progress";
    if (statuses.includes("approved")) return "approved";
    return "pending";
  };

  // Calculate statistics

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,

    movedToPurchase: orders.reduce((count, order) => {
      if (!order.products) return count;
      const moved = order.products.some((p) => p.moveToPurchase === true);
      return moved ? count + 1 : count;
    }, 0),

    // Artwork status counts (per ORDER, using normalized status)
    artworkPending: orders.filter(
      (order) => getArtworkStatusForOrder(order) === "pending"
    ).length,
    artworkInProgress: orders.filter(
      (order) => getArtworkStatusForOrder(order) === "in-progress"
    ).length,
    artworkApproved: orders.filter(
      (order) => getArtworkStatusForOrder(order) === "approved"
    ).length,
  };

  // Reset size filter when product changes
  useEffect(() => {
    setSelectedSize("");
  }, [selectedProduct]);

  if (view === "form") {
    return (
      <div className="min-h-screen bg-gray-50 p-[1vw]">
        <NewOrder
          existingOrder={editingOrder}
          onSubmit={handleOrderSubmit}
          onCancel={handleCancel}
          onBack={handleBack}
        />
      </div>
    );
  }

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const hasOrders = Object.keys(filteredGroupedOrders).length > 0;

  const PaymentManagementModal = ({ order, onClose, onSave }) => {
    if (!order) return null;

    const [bulkPayment, setBulkPayment] = useState({
      paymentType: "advance",
      method: "",
      amount: "",
      remarks: "",
      file: null, // NEW: uploaded screenshot/document
    });

    // FIXED: Access payment records from correct location
    const existingPaymentRecords = order.paymentRecords || [];

    // FIXED: Get estimated value from the correct location
    const estimatedValue = (() => {
      // From NewOrder: orderEstimate.estimatedValue (NEW ORDERS)
      if (order.orderEstimate?.estimatedValue) {
        console.log(
          "Found estimatedValue in orderEstimate.estimatedValue:",
          order.orderEstimate.estimatedValue
        );
        return parseFloat(order.orderEstimate.estimatedValue);
      }

      // From dummy data: payment[0].totalEstimated (DUMMY ORDERS)
      if (
        order.payment &&
        Array.isArray(order.payment) &&
        order.payment[0]?.totalEstimated
      ) {
        console.log(
          "Found estimatedValue in payment[0].totalEstimated:",
          order.payment[0].totalEstimated
        );
        return parseFloat(order.payment[0].totalEstimated);
      }

      // From payment object: payment.totalEstimated (IF STORED AS OBJECT)
      if (
        order.payment &&
        !Array.isArray(order.payment) &&
        order.payment.totalEstimated
      ) {
        console.log(
          "Found estimatedValue in payment.totalEstimated:",
          order.payment.totalEstimated
        );
        return parseFloat(order.payment.totalEstimated);
      }

      // Fallback to 0
      console.warn("No estimated value found in order:", order);
      return 0;
    })();

    console.log("Final estimated value:", estimatedValue);

    const calculateTotals = () => {
      const totalPaid = existingPaymentRecords.reduce((sum, record) => {
        return sum + (parseFloat(record.amount) || 0);
      }, 0);
      return {
        totalPaid,
        balance: estimatedValue - totalPaid,
      };
    };

    const addPaymentRecord = () => {
      // Validation
      if (bulkPayment.paymentType === "advance") {
        if (!bulkPayment.method) {
          alert("Please select a payment method");
          return;
        }
        if (!bulkPayment.amount || parseFloat(bulkPayment.amount) <= 0) {
          alert("Please enter a valid payment amount");
          return;
        }
      }

      if (bulkPayment.paymentType === "po" && !bulkPayment.remarks.trim()) {
        alert("Please enter PO details");
        return;
      }

      const newRecord = {
        timestamp: new Date().toISOString(),
        paymentType: bulkPayment.paymentType,
        method:
          bulkPayment.paymentType === "advance" ? bulkPayment.method : "PO",
        amount:
          bulkPayment.paymentType === "advance"
            ? parseFloat(bulkPayment.amount)
            : 0,
        remarks: bulkPayment.remarks,
        file: bulkPayment.file, // NEW
        createdAt: new Date().toISOString(),
      };

      const updatedOrder = {
        ...order,
        paymentRecords: [...existingPaymentRecords, newRecord],
      };

      onSave(updatedOrder);

      // Show success message
      alert(
        bulkPayment.paymentType === "advance"
          ? "Payment recorded successfully!"
          : "PO recorded successfully!"
      );

      // OPTION 1: Reset form and keep modal open with updated data
      setBulkPayment({
        paymentType: "advance",
        method: "",
        amount: "",
        remarks: "",
        purchaseOrder: null,
      });

      // OPTION 2: Close modal after save (uncomment if you prefer this)
      // onClose();
    };

    const deletePaymentRecord = (index) => {
      if (!window.confirm("Delete this payment record?")) return;

      const updatedRecords = existingPaymentRecords.filter(
        (_, i) => i !== index
      );
      const updatedOrder = {
        ...order,
        paymentRecords: updatedRecords,
      };

      onSave(updatedOrder);
    };

    const totals = calculateTotals();

    return (
      <div className="fixed inset-0 bg-[#00000096] bg-opacity-50 flex items-center justify-center z-[9999] p-[1vw]">
        <div className="bg-white rounded-[1vw] w-full max-w-[70vw] max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-[1.25vw] py-[1vw] rounded-t-[1vw] flex justify-between items-center">
            <h2 className="text-[1.35vw] font-semibold">Payment Management</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-blue-600 rounded-full w-[2vw] h-[2vw] flex items-center justify-center text-[1.15vw] transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-[1.5vw]">
            {/* Order Details - View Only */}
            <div className="mb-[2vw]">
              <h3 className="text-[1.15vw] font-semibold mb-[1vw] text-gray-700 border-b pb-[0.5vw]">
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-[1vw] bg-gray-50 p-[1vw] rounded-[0.5vw]">
                <div>
                  <p className="text-[0.8vw] text-gray-500">Company</p>
                  <p className="text-[.9vw] font-medium">
                    {order.contact?.company || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Contact Person</p>
                  <p className="text-[.9vw] font-medium">
                    {order.contact?.contactName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Phone</p>
                  <p className="text-[.9vw] font-medium">
                    {order.contact?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">IML Name</p>
                  <p className="text-[.9vw] font-medium">
                    {order.contact?.imlName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Order Number</p>
                  <p className="text-[.9vw] font-medium">
                    {order.orderNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Estimated Value</p>
                  <p className="text-[.9vw] font-medium text-green-600">
                    ₹{estimatedValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Products Details - View Only */}
            <div className="mb-[2vw]">
              <h3 className="text-[1.15vw] font-semibold mb-[1vw] text-gray-700 border-b pb-[0.5vw]">
                Products
              </h3>
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full border-collapse text-[0.85vw]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        Product Name
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        Size
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        IML Name
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        IML Type
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        LID Order Qty
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        TUB Order Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products && order.products.length > 0 ? (
                      order.products.map((product, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.productName || "N/A"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.size || "N/A"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.imlName || "N/A"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.imlType || "N/A"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.lidLabelQty || "-"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.tubLabelQty || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-[1vw] text-center text-gray-500"
                        >
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Section - Interactable */}
            <div className="mb-[2vw]">
              <h3 className="text-[1.2vw] font-semibold mb-[1vw] text-gray-700 border-b pb-[0.5vw]">
                Add Payment
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-[1.5vw] rounded-[0.5vw] border border-blue-200">
                {/* Payment Type Radio Buttons */}
                <div className="flex gap-[1.2vw] mb-[1.25vw]">
                  <label className="flex items-center gap-[0.75vw] cursor-pointer">
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
                      className="w-[1vw] h-[1vw] cursor-pointer"
                    />
                    <span className="text-[1vw] font-medium text-gray-700">
                      Advance Received
                    </span>
                  </label>
                  <label className="flex items-center gap-[0.75vw] cursor-pointer">
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
                      className="w-[1vw] h-[1vw] cursor-pointer"
                    />
                    <span className="text-[1vw] font-medium text-gray-700">
                      PO
                    </span>
                  </label>
                </div>

                {/* Advance Payment Fields */}
                {bulkPayment.paymentType === "advance" && (
                  <div className="space-y-[1vw]">
                    <div className="grid grid-cols-2 gap-[2vw]">
                      <div>
                        <label className="block text-[1vw] font-medium text-gray-700 mb-[0.5vw]">
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
                          className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.3vw] text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        <label className="block text-[1vw] font-medium text-gray-700 mb-[0.5vw]">
                          Amount Received{" "}
                          <span className="text-red-500">*</span>
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
                          className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.3vw] text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[1vw] font-medium text-gray-700 mb-[0.5vw]">
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
                        className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.3vw] text-[1vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-[1vw] font-medium text-gray-700 mb-[0.5vw]">
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
                      className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.3vw] text-[1vw] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload PO Document
                      </label>
                      <div className="grid-grid-cols-2 gap-[1vw]">
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
                              {bulkPayment.file.name} (click to view after
                              saving)
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                {bulkPayment.paymentType && (
                  <div className="bg-white rounded-[0.5vw] p-[1vw] mt-[1vw] border border-gray-200">
                    <h4 className="text-[1vw] font-semibold text-gray-700 mb-[0.5vw]">
                      Payment Summary
                    </h4>
                    <div className="space-y-[0.5vw]">
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
                      <div className="flex justify-between text-[1vw] pt-[0.5vw] border-t">
                        <span className="text-gray-600">Current Balance:</span>
                        <span className="font-bold text-orange-600">
                          ₹{totals.balance.toFixed(2)}
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
                                totals.balance -
                                  parseFloat(bulkPayment.amount || 0),
                                0
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                <button
                  onClick={addPaymentRecord}
                  className="bg-green-600 text-white px-[2vw] py-[0.7vw] rounded-[0.4vw] text-[1vw] font-medium hover:bg-green-700 transition-colors mt-[1vw] w-full cursor-pointer"
                >
                  {bulkPayment.paymentType === "advance"
                    ? "💰 Record Payment"
                    : "📄 Record PO"}
                </button>
              </div>
            </div>

            {/* Payment Records */}
            <div>
              <h3 className="text-[1.2vw] font-semibold mb-[1vw] text-gray-700 border-b pb-[0.5vw]">
                Payment History
              </h3>
              {existingPaymentRecords.length === 0 ? (
                <p className="text-[0.9vw] text-gray-500 text-center py-[2vw] bg-gray-50 rounded-[0.5vw]">
                  No payment records yet
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full text-[0.85vw] border border-gray-200 ">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <tr>
                        <th className="border border-gray-300 p-[0.75vw] text-left border-b border-gray-300">
                          Date & Time
                        </th>
                        <th className="border border-gray-300 p-[0.75vw] text-left border-b border-gray-300">
                          Type
                        </th>
                        <th className="border border-gray-300 p-[0.75vw] text-left border-b border-gray-300">
                          Method
                        </th>
                        <th className="border border-gray-300 p-[0.75vw] text-left border-b border-gray-300">
                          Amount
                        </th>
                        <th className="border border-gray-300 p-[0.75vw] text-left border-b border-gray-300">
                          Remarks
                        </th>
                        <th className="border border-gray-300 p-[0.75vw] text-left border-b border-gray-300">
                          Attachments
                        </th>
                        <th className="border border-gray-300 p-[0.75vw] text-center border-b border-gray-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingPaymentRecords.map((record, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="border border-gray-300 p-[0.75vw]">
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
                          <td className="border border-gray-300 p-[0.75vw]">
                            <span
                              className={`px-[0.5vw] py-[0.2vw] rounded-[0.3vw] text-[0.8vw] font-medium ${
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
                          <td className="border border-gray-300 p-[0.75vw]">
                            {record.method}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw] font-medium text-green-600">
                            {record.paymentType === "advance"
                              ? `₹${record.amount.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {record.remarks || "-"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
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
                                      name: record?.file.name,
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
                          <td className="border border-gray-300 p-[0.75vw] text-center">
                            <button
                              onClick={() => deletePaymentRecord(idx)}
                              className="text-red-600 hover:bg-red-50 px-[0.75vw] py-[0.3vw] rounded-[0.3vw] text-[0.75vw] font-medium transition-colors cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Summary */}
              <div className="mt-[1vw] bg-gradient-to-r from-gray-50 to-blue-50 p-[1.5vw] rounded-[0.5vw] grid grid-cols-3 gap-[1vw] border border-gray-200">
                <div>
                  <p className="text-[0.8vw] text-gray-500 mb-[0.3vw]">
                    Total Estimated
                  </p>
                  <p className="text-[1.3vw] font-bold text-blue-600">
                    ₹{estimatedValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500 mb-[0.3vw]">
                    Total Received
                  </p>
                  <p className="text-[1.3vw] font-bold text-green-600">
                    ₹{totals.totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500 mb-[0.3vw]">
                    Balance Due
                  </p>
                  <p className="text-[1.3vw] font-bold text-orange-600">
                    ₹{totals.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle opening payment modal
  const handleOpenPaymentModal = (order) => {
    setPaymentModalOrder(order);
  };

  // Handle closing payment modal
  const handleClosePaymentModal = () => {
    setPaymentModalOrder(null);
  };

  // Handle saving payment updates
  const handleSavePayment = (updatedOrder) => {
    const updatedOrders = orders.map((o) =>
      o.id === updatedOrder.id
        ? { ...updatedOrder, updatedAt: new Date().toISOString() }
        : o
    );
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

    // FIXED: Update the modal's order reference to show new data immediately
    setPaymentModalOrder(updatedOrder);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}

      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[.25vw]">
          <div className="flex justify-between items-center gap-[.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">
              Orders Management (IML)
            </h1>
            <div className="flex items-center-justify-center gap-[1vw]">
              <div className="flex gap-[1vw]">
                <button
                  onClick={() => setViewMode("all")}
                  className={`flex-1 px-[1vw] py-[0.65vw] rounded-lg font-semibold text-[.8vw] transition-all duration-200 cursor-pointer border-2 ${
                    viewMode === "all"
                      ? "bg-blue-600 text-white border-blue-700 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-[1.2vw] h-[1.2vw]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                    <span>All Orders</span>
                  </div>
                </button>

                <button
                  onClick={() => setViewMode("remaining")}
                  className={`flex-1 px-[1vw] py-[0.65vw] rounded-lg font-semibold text-[.8vw] transition-all duration-200 cursor-pointer border-2 w-fit ${
                    viewMode === "remaining"
                      ? "bg-orange-500 text-white border-orange-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 min-w-[9vw]">
                    <svg
                      className="w-[1.2vw] h-[1.2vw]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Remaining Orders</span>
                  </div>
                </button>
              </div>

              {/* Active Filter Indicator */}
              {viewMode === "remaining" && (
                <div className="flex items-center gap-2 px-[1vw] py-[0.6vw] bg-orange-50 border-l-4 border-orange-500 rounded">
                  <svg
                    className="w-[1.2vw] h-[1.2vw] text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[.85vw] text-orange-800 font-medium">
                    Showing only orders with remaining labels to produce
                  </span>
                </div>
              )}
            </div>
          </div>

          {viewMode === "all" && (
            <button
              onClick={handleNewOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white px-[.85vw] py-[0.45vw] rounded-[0.6vw] font-medium shadow-md hover:shadow-lg transition-all text-[0.9vw] cursor-pointer"
            >
              + New Order
            </button>
          )}
        </div>
      </div>

      {/* Filters - UPDATED with proper width for size dropdown */}

      <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}

          <div>
            <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
              Search Orders
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name, IML name or contact"
                className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[.8vw]"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-[0.9vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}

          <div>
            <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
              Artwork Status
            </label>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[.8vw]"
            >
              <option value="all">All Status</option>

              <option value="pending">Pending</option>

              <option value="approved">Approved</option>
            </select>
          </div>

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

          {/* Size Filter - UPDATED with max-width */}

          <div>
            <label className="block text-[.8vw] font-medium text-gray-700 mb-2">
              Filter by Size
            </label>

            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={!selectedProduct}
              className="w-full border border-gray-300 rounded-lg px-[.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-[.8vw]"
              style={{ maxWidth: "100%" }}
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

      {/* Orders Display */}

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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Orders Found
          </h3>

          <p className="text-gray-600 mb-6">
            {searchTerm ||
            filterStatus !== "all" ||
            selectedProduct ||
            selectedSize
              ? `No orders found matching your filters`
              : "Get started by creating your first order"}
          </p>

          {!searchTerm &&
            filterStatus === "all" &&
            !selectedProduct &&
            !selectedSize && (
              <button
                onClick={handleNewOrder}
                className="bg-[#388ce3] hover:bg-[#2f74c9] text-white px-[1vw] py-[0.6vw] rounded-[0.6vw] font-medium text-[0.9vw]"
              >
                Create New Order
              </button>
            )}
        </div>
      ) : (
        <div className="space-y-[1.5vw] max-h-[59vh] overflow-y-auto">
          {/* Render grouped orders by Company → Order → Products */}
          {Object.entries(getFilteredGroupedOrders()).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(getFilteredGroupedOrders()).map(
                ([companyName, orders]) => (
                  <div
                    key={companyName}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* LEVEL 1: Company Header */}
                    <div
                      onClick={() => toggleCompany(companyName)}
                      className="bg-[#3d64bb] text-white px-[1.5vw] py-[.85vw] cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <svg
                          className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 ${
                            expandedCompanies[companyName] ? "rotate-90" : ""
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
                          <h3 className="text-[1.15vw] font-bold">
                            {companyName}
                          </h3>
                          <p className="text-[.9vw] text-blue-100 ">
                            {Object.keys(orders).length} Order(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-[.85vw] bg-white/20 px-4 py-2 rounded-full">
                        Total Orders: {Object.keys(orders).length}
                      </div>
                    </div>

                    {/* LEVEL 2: Orders within Company */}
                    {expandedCompanies[companyName] && (
                      <div className="space-y-[1.25vw] p-[1vw]">
                        {Object.entries(orders).map(([orderKey, order]) => {
                          const isOrderExpanded =
                            expandedOrders[`${companyName}:::${orderKey}`];

                          return (
                            <div
                              key={orderKey}
                              className="bg-gray-50 border border-1 border-gray-400 rounded-lg overflow-hidden"
                            >
                              {/* Order Header */}
                              <div
                                onClick={() =>
                                  toggleOrder(companyName, orderKey)
                                }
                                className="bg-gray-200 px-[1.5vw] py-[.85vw] cursor-pointer transition-all flex justify-between items-center "
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <svg
                                    className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 text-gray-600 ${
                                      isOrderExpanded ? "rotate-90" : ""
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

                                  <div className="flex-1">
                                    <div className="flex items-center gap-4 flex-wrap">
                                      <h4 className="text-[1.05vw] font-semibold text-gray-800">
                                        {orderKey}
                                      </h4>
                                    </div>

                                    <div className="flex gap-6 mt-2 text-[.9vw] text-gray-600">
                                      <span>
                                        <strong>Contact:</strong>{" "}
                                        {order.contact.contactName}
                                      </span>
                                      <span>
                                        <strong>Phone:</strong>{" "}
                                        {order.contact.phone}
                                      </span>
                                      <span>
                                        <strong>Products:</strong>{" "}
                                        {order.products?.length || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div
                                  className="flex gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {viewMode === "all" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleOpenPaymentModal(order)
                                        }
                                        className="px-[1vw] py-[.35vw] cursor-pointer bg-gray-600 text-white rounded hover:bg-gray-700 text-[.85vw] font-medium transition-all cursor-pointer flex items-center justify-center"
                                        title="Add Payment"
                                      >
                                        💳 Payment
                                      </button>

                                      <button
                                        onClick={() => handleEditOrder(order)}
                                        className="px-[1vw] py-[.35vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[.85vw] font-medium transition-all"
                                      >
                                        {hasMovedToPurchase(order)
                                          ? "Change Request"
                                          : "Edit"}
                                      </button>
                                      {!hasMovedToPurchase(order) && (
                                        <button
                                          onClick={() =>
                                            handleDeleteOrder(order.id)
                                          }
                                          className="px-[1vw] py-[.35vw] cursor-pointer bg-red-600 text-white rounded hover:bg-red-700 text-[.85vw] font-medium transition-all"
                                        >
                                          Delete
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleMoveToPurchase(order)
                                        }
                                        className="px-[1vw] py-[.35vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-[.85vw] font-medium transition-all"
                                      >
                                        Move to Purchase
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* LEVEL 3: Products Table */}
                              {isOrderExpanded && (
                                <div className="p-[1.5vw] bg-white">
                                  {order.products &&
                                  order.products.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-gray-200">
                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              S.No
                                            </th>
                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              Product Name
                                            </th>
                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              Size
                                            </th>
                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              IML Name
                                            </th>
                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              IML Type
                                            </th>
                                            {viewMode === "remaining" ? (
                                              <>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Total Ordered
                                                </th>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Produced
                                                </th>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Remaining
                                                </th>
                                              </>
                                            ) : (
                                              <>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  LID Order Qty
                                                </th>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  TUB Order Qty
                                                </th>
                                              </>
                                            )}

                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              Design Status
                                            </th>

                                            {viewMode === "remaining" && (
                                              <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                                Action
                                              </th>
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {order.products.map(
                                            (product, idx) => {
                                              // Calculate values for this product
                                              const remaining =
                                                calculateRemainingLabels(
                                                  product
                                                );

                                              // Calculate total ordered and produced
                                              const totalOrdered =
                                                product.imlType === "LID" ||
                                                product.imlType === "LID TUB"
                                                  ? parseInt(
                                                      product.lidLabelQty
                                                    ) || 0
                                                  : product.imlType === "TUB"
                                                  ? parseInt(
                                                      product.tubLabelQty
                                                    ) || 0
                                                  : 0;

                                              const totalProduced =
                                                product.imlType === "LID" ||
                                                product.imlType === "LID TUB"
                                                  ? parseInt(
                                                      product.lidProductionQty
                                                    ) || 0
                                                  : product.imlType === "TUB"
                                                  ? parseInt(
                                                      product.tubProductionQty
                                                    ) || 0
                                                  : 0;

                                              return (
                                                <tr
                                                  key={product.id || idx}
                                                  className="hover:bg-gray-50"
                                                >
                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                    {idx + 1}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-medium">
                                                    {product.productName ||
                                                      "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                    {product.size || "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                    {product.imlName || "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                                      {product.imlType || "N/A"}
                                                    </span>
                                                  </td>
                                                  {viewMode === "remaining" ? (
                                                    <>
                                                      {/* Total Ordered */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-semibold">
                                                        {totalOrdered > 0
                                                          ? totalOrdered.toLocaleString()
                                                          : "-"}
                                                      </td>

                                                      {/* Produced */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                        {totalProduced > 0
                                                          ? totalProduced.toLocaleString()
                                                          : "-"}
                                                      </td>

                                                      {/* Remaining */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                        {remaining > 0
                                                          ? `${remaining.toLocaleString()}`
                                                          : "-"}
                                                      </td>
                                                    </>
                                                  ) : (
                                                    <>
                                                      {/* LID Qty (Normal view) */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                        {product.lidLabelQty ||
                                                          "-"}
                                                      </td>

                                                      {/* TUB Qty (Normal view) */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                        {product.tubLabelQty ||
                                                          "-"}
                                                      </td>
                                                    </>
                                                  )}

                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                    {(() => {
                                                      const status = (
                                                        product.designStatus ||
                                                        "pending"
                                                      ).toLowerCase();
                                                      const colorClasses =
                                                        status === "approved"
                                                          ? "bg-green-100 text-green-700"
                                                          : status ===
                                                            "in-progress"
                                                          ? "bg-yellow-100 text-yellow-700"
                                                          : "bg-orange-100 text-orange-700";
                                                      return (
                                                        <span
                                                          className={`inline-block px-[1vw] py-[.3vw] rounded-full text-[.85vw] font-semibold ${colorClasses}`}
                                                        >
                                                          {status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            status.slice(1)}
                                                        </span>
                                                      );
                                                    })()}
                                                  </td>
                                                  {viewMode === "remaining" && (
                                                    <td className="border border-gray-300 px-1.25vw py-.75vw text-center">
                                                      <button
                                                        onClick={() =>
                                                          handleMoveToProduction(
                                                            order,
                                                            product
                                                          )
                                                        }
                                                        className="px-[1vw] py-[0.4vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-[.8vw] font-medium transition-all"
                                                      >
                                                        Move to Production
                                                      </button>
                                                    </td>
                                                  )}
                                                </tr>
                                              );
                                            }
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-center py-8">
                                      No products in this order
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">
                {searchTerm || filterStatus !== "all"
                  ? "No orders found matching your filters"
                  : "Get started by creating your first order"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search Results Info */}

      {searchTerm && !hasOrders && (
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            No result found matching{" "}
            <span className="font-semibold">"{searchTerm}"</span>
          </p>
        </div>
      )}

      {paymentModalOrder && (
        <PaymentManagementModal
          order={paymentModalOrder}
          onClose={handleClosePaymentModal}
          onSave={handleSavePayment}
        />
      )}

      <PreviewModal />
    </div>
  );

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
          alert(
            "Please upload only images (JPEG, PNG, GIF, WebP) or PDF files"
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

 
}
