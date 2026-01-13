import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScreenPrintingOrderDetails from "./ScreenPrintingOrderDetails";

// Mock data storage (In production, this would be an API/Database)
const DATA_VERSION = "2.12"; // Increment this when structure changes
const STORAGE_KEY = "screen_printing_orders";
const VERSION_KEY = "screen_printing_orders_version";

// Product size options for initial expansion
const PRODUCT_SIZE_OPTIONS = {
  Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
  "Round Square": ["450ml", "500ml"],
  Rectangle: ["500ml", "650ml", "750ml"],
  "Sweet Box": ["250gms", "500gms"],
  "Sweet Box TE": ["TE 250gms", "TE 500gms"],
};

export default function ScreenPrintingOrders() {
  console.log("ScreenPrintingOrders component rendered");
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

  // Check version and initialize data
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
        id: "SP-ORD-10134",
        contact: {
          company: "PrintTech Solutions",
          contactName: "Rajesh Kumar",
          phone: "9876543210",
          priority: "high",
        },
        orderNumber: "SP-1298-002-141",
        orderEstimate: {
          estimatedNumber: "SP-EST-001",
          estimatedValue: 35000,
        },
        products: [
          {
            id: 1,
            productName: "Round",
            size: "500ml",
            printingName: "Premium Screen Print Labels",
            printType: "LID",
            quantity: "5000",
            printedQuantity: "3500",
            stock: 1500,
            colors: ["Red", "Blue", "White"],
            meshCount: "120T",
            budget: 20000,
            approvedDate: "2025-12-10",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToScreenPrinting: false,
          },
          {
            id: 2,
            productName: "Rectangle",
            size: "750ml",
            printingName: "Standard Screen Labels",
            printType: "TUB",
            quantity: "3000",
            printedQuantity: "2000",
            stock: 1000,
            colors: ["Black"],
            meshCount: "110T",
            budget: 15000,
            approvedDate: "2025-12-11",
            designSharedMail: true,
            designStatus: "pending",
            designType: "new",
            moveToScreenPrinting: false,
          },
        ],
        payment: {
          totalEstimated: 35000,
          remarks: "Advance received",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-10T10:30:00.000Z",
            paymentType: "advance",
            method: "Cash",
            amount: 15000,
            remarks: "Initial advance payment",
            createdAt: "2025-12-10T10:30:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-10T08:00:00.000Z",
      },
      {
        id: "SP-ORD-10135",
        contact: {
          company: "Creative Prints Ltd",
          contactName: "Priya Sharma",
          phone: "9123456780",
          priority: "medium",
        },
        orderNumber: "SP-1298-202-541",
        orderEstimate: {
          estimatedNumber: "SP-EST-002",
          estimatedValue: 28000,
        },
        products: [
          {
            id: 3,
            productName: "Sweet Box",
            size: "500gms",
            printingName: "Festive Screen Print",
            printType: "LID",
            quantity: "4000",
            printedQuantity: "4000",
            stock: 0,
            colors: ["Gold", "Red", "Green"],
            meshCount: "150T",
            budget: 28000,
            approvedDate: "2025-12-12",
            designSharedMail: true,
            designStatus: "approved",
            designType: "existing",
            moveToScreenPrinting: true,
          },
        ],
        payment: {
          totalEstimated: 28000,
          remarks: "Payment pending",
        },
        paymentRecords: [],
        status: "pending",
        createdAt: "2025-12-11T09:30:00.000Z",
      },
      {
        id: "SP-ORD-10136",
        contact: {
          company: "Quality Packaging Inc",
          contactName: "Amit Patel",
          phone: "9001122334",
          priority: "low",
        },
        orderNumber: "SP-1298-302-541",
        orderEstimate: {
          estimatedNumber: "SP-EST-003",
          estimatedValue: 22000,
        },
        products: [
          {
            id: 4,
            productName: "Round Square",
            size: "450ml",
            printingName: "Economy Screen Labels",
            printType: "TUB",
            quantity: "6000",
            printedQuantity: "1500",
            stock: 4500,
            colors: ["Blue"],
            meshCount: "90T",
            budget: 22000,
            approvedDate: "2025-12-13",
            designSharedMail: false,
            designStatus: "pending",
            designType: "new",
            moveToScreenPrinting: false,
          },
        ],
        payment: {
          totalEstimated: 22000,
          remarks: "Full payment on delivery",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-13T14:00:00.000Z",
            paymentType: "advance",
            method: "Bank Transfer",
            amount: 22000,
            remarks: "Complete payment",
            createdAt: "2025-12-13T14:00:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-12T08:00:00.000Z",
      },
      {
        id: "SP-ORD-10137",
        contact: {
          company: "PrintTech Solutions",
          contactName: "Rajesh Kumar",
          phone: "9876543210",
          priority: "high",
        },
        orderNumber: "SP-3298-502-541",
        orderEstimate: {
          estimatedNumber: "SP-EST-004",
          estimatedValue: 45000,
        },
        products: [
          {
            id: 5,
            productName: "Rectangle",
            size: "650ml",
            printingName: "Premium Gloss Screen Print",
            printType: "LID",
            quantity: "7000",
            printedQuantity: "5000",
            stock: 2000,
            colors: ["Red", "Yellow", "Blue", "Black"],
            meshCount: "140T",
            budget: 30000,
            approvedDate: "2025-12-14",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToScreenPrinting: false,
          },
          {
            id: 6,
            productName: "Round",
            size: "1000ml",
            printingName: "Luxury Screen Labels",
            printType: "LID",
            quantity: "3000",
            printedQuantity: "500",
            stock: 2500,
            colors: ["Silver", "Black"],
            meshCount: "160T",
            budget: 15000,
            approvedDate: "2025-12-15",
            designSharedMail: true,
            designStatus: "pending",
            designType: "existing",
            moveToScreenPrinting: false,
          },
        ],
        payment: {
          totalEstimated: 45000,
          remarks: "Partial payment received",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-14T11:00:00.000Z",
            paymentType: "advance",
            method: "UPI",
            amount: 20000,
            remarks: "First installment",
            createdAt: "2025-12-14T11:00:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-13T08:00:00.000Z",
      },
      {
        id: "SP-ORD-10138",
        contact: {
          company: "Modern Graphics",
          contactName: "Sneha Reddy",
          phone: "9765432100",
          priority: "medium",
        },
        orderNumber: "SP-5798-302-541",
        orderEstimate: {
          estimatedNumber: "SP-EST-005",
          estimatedValue: 32000,
        },
        products: [
          {
            id: 7,
            productName: "Sweet Box TE",
            size: "TE 250gms",
            printingName: "Deluxe Screen Print Series",
            printType: "LID & TUB",
            quantity: "5000",
            printedQuantity: "3000",
            stock: 2000,
            colors: ["Gold", "Maroon", "White"],
            meshCount: "130T",
            budget: 32000,
            approvedDate: "2025-12-15",
            designSharedMail: true,
            designStatus: "approved",
            designType: "new",
            moveToScreenPrinting: false,
          },
        ],
        payment: {
          totalEstimated: 32000,
          remarks: "Payment in progress",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-15T10:30:00.000Z",
            paymentType: "advance",
            method: "Cash",
            amount: 10000,
            remarks: "Initial payment",
            createdAt: "2025-12-15T10:30:00.000Z",
          },
        ],
        status: "pending",
        createdAt: "2025-12-14T08:00:00.000Z",
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
        const orderKeys = Object.keys(orders);
        if (orderKeys.length > 0) {
          const firstOrderKey = orderKeys[0];
          newExpandedOrders[`${companyName}:::${firstOrderKey}`] = true;
        }
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
console.log("Editing order:", order); // Debug log
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

  // Handle move to production
  const handlemoveToScreenPrinting = (order) => {
    // Check if any products in this order
    if (!order.products || order.products.length === 0) {
      alert("This order has no products to move.");
      return;
    }

    // Check if already moved
    const alreadyMoved = order.products.every(
      (p) => p.moveToScreenPrinting === true
    );
    if (alreadyMoved) {
      alert("This order has already been moved to Screen Printing.");
      return;
    }

    const confirmMessage = `Are you sure you want to move this order to Screen Printing?\n\nCompany: ${order.contact.company}\nProducts: ${order.products.length}`;

    if (window.confirm(confirmMessage)) {
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            products: o.products.map((p) => ({
              ...p,
              moveToScreenPrinting: true,
            })),
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      alert("Order successfully moved to Screen Printing!");
    }
  };

  // Function to calculate remaining items for a product
  const calculateRemainingItems = (product) => {
    const ordered = parseInt(product.quantity) || 0;
    const printed = parseInt(product.printedQuantity) || 0;
    return ordered - printed;
  };

  // Check if order has remaining items
  const hasRemainingItems = (order) => {
    if (!order.products || order.products.length === 0) {
      return false;
    }

    const hasRemaining = order.products.some((product) => {
      const remaining = calculateRemainingItems(product);
      return remaining > 0;
    });

    return hasRemaining;
  };

  // Handle form submission
  const handleOrderSubmit = (orderData) => {
    if (editingOrder) {
      const isValidDate = (date) => {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
      };

      // Update existing order
      const updatedOrders = orders.map((order) =>
        order.id === editingOrder.id
          ? {
              ...orderData,
              id: editingOrder.id,
              createdAt: isValidDate(order.createdAt)
                ? order.createdAt
                : isValidDate(editingOrder.createdAt)
                ? editingOrder.createdAt
                : new Date().toISOString(),
            }
          : order
      );
      setOrders(updatedOrders);
    } else {
      // Add new order
      const newOrder = {
        ...orderData,
        id: `SP-ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setOrders([...orders, newOrder]);
    }
    setView("dashboard");
    setEditingOrder(null);
  };

  // Handle cancel from form
  const handleCancel = () => {
    setView("dashboard");
    setEditingOrder(null);
  };

  // Handle back from form
  const handleBack = () => {
    setView("dashboard");
    setEditingOrder(null);
  };

  // Toggle company expansion
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

  // Group orders by Company → Order Number
  const groupOrdersByCompany = () => {
    const grouped = {};

    // First, sort orders by createdAt (latest first)
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Descending order (latest first)
    });

    sortedOrders.forEach((order) => {
      const companyName = order.contact?.company || "Unknown Company";
      const orderNumber = order.orderNumber || "NA";

      // Create company group if doesn't exist
      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }

      // Store the entire order under this key
      grouped[companyName][orderNumber] = order;
    });

    // Sort companies by the latest order date in each company
    const sortedGrouped = {};
    const companiesWithLatestDate = Object.entries(grouped).map(
      ([companyName, orders]) => {
        const latestDate = Math.max(
          ...Object.values(orders).map((order) =>
            new Date(order.createdAt || 0).getTime()
          )
        );
        return { companyName, orders, latestDate };
      }
    );

    // Sort companies by latest date (descending)
    companiesWithLatestDate
      .sort((a, b) => b.latestDate - a.latestDate)
      .forEach(({ companyName, orders }) => {
        sortedGrouped[companyName] = orders;
      });

    return sortedGrouped;
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

  // Filter orders within the new grouping structure
  const getFilteredGroupedOrders = () => {
    const allGrouped = groupOrdersByCompany();
    const filtered = {};

    Object.entries(allGrouped).forEach(([companyName, orders]) => {
      Object.entries(orders).forEach(([orderKey, order]) => {
        // 1. SEARCH FILTER
        let matchesSearch = true;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          matchesSearch =
            companyName.toLowerCase().includes(searchLower) ||
            order.contact.contactName.toLowerCase().includes(searchLower) ||
            order.contact.phone.toLowerCase().includes(searchLower) ||
            order.products?.some((product) =>
              product.printingName?.toLowerCase().includes(searchLower)
            );
        }

        // 2. ARTWORK STATUS FILTER
        const artworkStatus = getArtworkStatusForOrder(order);
        const matchesStatus =
          filterStatus === "all" || artworkStatus === filterStatus;

        // 3. PRODUCT FILTER
        let matchesProduct = true;
        if (selectedProduct) {
          matchesProduct = order.products?.some(
            (product) => product.productName === selectedProduct
          );
        }

        // 4. SIZE FILTER
        let matchesSize = true;
        if (selectedSize && selectedProduct) {
          matchesSize = order.products?.some(
            (product) =>
              product.productName === selectedProduct &&
              product.size === selectedSize
          );
        }

        // 5. VIEW MODE FILTER
        const matchesViewMode = viewMode === "all" || hasRemainingItems(order);

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

  const getArtworkStatusForOrder = (order) => {
    if (!order.products || order.products.length === 0) return "pending";

    const statuses = order.products.map((p) =>
      (p.designStatus || "pending").toLowerCase()
    );

    if (statuses.includes("in-progress")) return "in-progress";
    if (statuses.includes("approved")) return "approved";
    return "pending";
  };

  // Reset size filter when product changes
  useEffect(() => {
    setSelectedSize("");
  }, [selectedProduct]);

  if (view === "form") {
    return (
      <div className="min-h-screen bg-gray-50 p-[1vw]">
        <ScreenPrintingOrderDetails
        existingOrder={editingOrder}  // ✅ CORRECT
        existingOrders={orders}  
        onSubmit={handleOrderSubmit}
        onCancel={handleCancel}
        onBack={handleBack}
      />
      </div>
    );
  }

  const filteredGroupedOrders = getFilteredGroupedOrders();
  const hasOrders = Object.keys(filteredGroupedOrders).length > 0;

  // Payment Modal Component
  const PaymentManagementModal = ({ order, onClose, onSave }) => {
    if (!order) return null;

    const [bulkPayment, setBulkPayment] = useState({
      paymentType: "advance",
      method: "",
      amount: "",
      remarks: "",
      purchaseOrder: null,
    });

    const existingPaymentRecords = order.paymentRecords || [];

    const estimatedValue = (() => {
      if (order.orderEstimate?.estimatedValue) {
        return parseFloat(order.orderEstimate.estimatedValue);
      }
      if (
        order.payment &&
        !Array.isArray(order.payment) &&
        order.payment.totalEstimated
      ) {
        return parseFloat(order.payment.totalEstimated);
      }
      return 0;
    })();

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
        createdAt: new Date().toISOString(),
      };

      const updatedOrder = {
        ...order,
        paymentRecords: [...existingPaymentRecords, newRecord],
      };

      onSave(updatedOrder);
      alert(
        bulkPayment.paymentType === "advance"
          ? "Payment recorded successfully!"
          : "PO recorded successfully!"
      );

      setBulkPayment({
        paymentType: "advance",
        method: "",
        amount: "",
        remarks: "",
        purchaseOrder: null,
      });
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
            {/* Order Details */}
            <div className="mb-[2vw]">
              <h3 className="text-[1.15vw] font-semibold mb-[1vw] text-gray-700 border-b pb-[0.5vw]">
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-[1vw] bg-gray-50 p-[1vw] rounded-[0.5vw]">
                <div>
                  <p className="text-[0.8vw] text-gray-500">Company</p>
                  <p className="text-[0.9vw] font-medium">
                    {order.contact?.company || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Contact Person</p>
                  <p className="text-[0.9vw] font-medium">
                    {order.contact?.contactName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Phone</p>
                  <p className="text-[0.9vw] font-medium">
                    {order.contact?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Order Number</p>
                  <p className="text-[0.9vw] font-medium">
                    {order.orderNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[0.8vw] text-gray-500">Estimated Value</p>
                  <p className="text-[0.9vw] font-medium text-green-600">
                    ₹{estimatedValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Products Details */}
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
                        Printing Name
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        Printing Color Type
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        Quantity
                      </th>
                      <th className="border border-gray-300 p-[0.75vw] text-left">
                        Printed
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
                            {product.printingName || "N/A"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.printType || "N/A"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.quantity || "-"}
                          </td>
                          <td className="border border-gray-300 p-[0.75vw]">
                            {product.printedQuantity || "-"}
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

            {/* Payment Section */}
            <div className="mb-2vw">
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
                        <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
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
                          className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-0.3vw text-[0.9vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
                          Amount Received{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={bulkPayment.amount}
                          onChange={(e) =>
                            setBulkPayment({
                              ...bulkPayment,
                              amount: e.target.value,
                            })
                          }
                          className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.3vw] text-[0.9vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
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
                        className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-0.3vw text-[0.9vw] outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* PO Fields */}
                {bulkPayment.paymentType === "po" && (
                  <div>
                    <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
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
                      className="w-full px-[0.75vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.3vw] text-[0.9vw] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}

                {/* Payment Summary */}
                {bulkPayment.paymentType && (
                  <div className="bg-white rounded-[0.5vw] p-[1vw] mt-[1vw] border border-gray-200">
                    <h4 className="text-[0.9vw] font-semibold text-gray-700 mb-[0.5vw]">
                      Payment Summary
                    </h4>
                    <div className="space-y-[0.5vw]">
                      <div className="flex justify-between text-[0.9vw]">
                        <span className="text-gray-600">Type</span>
                        <span className="font-medium">
                          {bulkPayment.paymentType === "advance"
                            ? "Advance Payment"
                            : "Purchase Order"}
                        </span>
                      </div>
                      {bulkPayment.paymentType === "advance" &&
                        bulkPayment.amount && (
                          <div className="flex justify-between text-[0.9vw]">
                            <span className="text-gray-600">Amount</span>
                            <span className="font-bold text-green-600">
                              ₹{parseFloat(bulkPayment.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between text-[0.9vw] pt-[0.5vw] border-t">
                        <span className="text-gray-600">Current Balance</span>
                        <span className="font-bold text-orange-600">
                          ₹{totals.balance.toFixed(2)}
                        </span>
                      </div>
                      {bulkPayment.paymentType === "advance" &&
                        bulkPayment.amount && (
                          <div className="flex justify-between text-[0.9vw]">
                            <span className="text-gray-600">
                              Balance After Payment
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
                  className="bg-green-600 text-white px-[2vw] py-[0.7vw] rounded-[0.4vw] text-[0.9vw] font-medium hover:bg-green-700 transition-colors mt-[1vw] w-full cursor-pointer"
                >
                  {bulkPayment.paymentType === "advance"
                    ? "Record Payment"
                    : "Record PO"}
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
                  <table className="w-full text-[0.85vw] border border-gray-200">
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
                          <td className="border border-gray-300 p-[0.75vw] text-center">
                            <button
                              onClick={() => deletePaymentRecord(idx)}
                              className="text-red-600 hover:bg-red-50 px-[0.75vw] py-0.3vw rounded-0.3vw text-[0.75vw] font-medium transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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
      o.id === updatedOrder.id ? updatedOrder : o
    );
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    setPaymentModalOrder(updatedOrder);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-[1vw]">
      {/* Header */}
      <div className="mb-[1vw]">
        <div className="flex justify-between items-center mb-[0.25vw]">
          <div className="flex justify-between items-center gap-[0.75vw]">
            <h1 className="text-[1.6vw] font-bold text-gray-900">
              Screen Printing Orders
            </h1>
            <div className="flex items-center justify-center gap-[1vw]">
              <div className="flex gap-[1vw]">
                <button
                  onClick={() => setViewMode("all")}
                  className={`flex-1 px-[1vw] py-[0.65vw] rounded-lg font-semibold text-[0.8vw] transition-all duration-200 cursor-pointer border-2 ${
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
                  className={`flex-1 px-[1vw] py-[0.65vw] rounded-lg font-semibold text-[0.8vw] transition-all duration-200 cursor-pointer border-2 w-fit ${
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
                  <span className="text-[0.85vw] text-orange-800 font-medium">
                    Showing only orders with remaining items to print
                  </span>
                </div>
              )}
            </div>
          </div>

          {viewMode === "all" && (
            <button
              onClick={handleNewOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white px-[0.85vw] py-[0.45vw] rounded-[0.6vw] font-medium shadow-md hover:shadow-lg transition-all text-[0.9vw] cursor-pointer"
            >
              + New Order
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
              Search Orders
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name, printing name or contact"
                className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[0.8vw]"
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
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
              Artwork Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[0.8vw]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
              Filter by Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-[0.8vw]"
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
            <label className="block text-[0.8vw] font-medium text-gray-700 mb-2">
              Filter by Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={!selectedProduct}
              className="w-full border border-gray-300 rounded-lg px-[0.85vw] py-[0.6vw] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-[0.8vw]"
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
          <h3 className="text-[1.05vw] font-semibold text-gray-900 mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-600 mb-6 text-[.9vw]">
            {searchTerm ||
            filterStatus !== "all" ||
            selectedProduct ||
            selectedSize
              ? "No orders found matching your filters"
              : "Get started by creating your first order"}
          </p>
          {!searchTerm &&
            filterStatus === "all" &&
            !selectedProduct &&
            !selectedSize && (
              <button
                onClick={handleNewOrder}
                className="bg-[#388ce3] hover:bg-[#2f74c9] text-white px-[1vw] py-0.6vw rounded-0.6vw font-medium text-0.9vw"
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
              {Object.entries(filteredGroupedOrders).map(
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
                          <p className="text-[0.9vw] text-blue-100">
                            {Object.keys(orders).length} Orders
                          </p>
                        </div>
                      </div>
                      <div className="text-[0.85vw] bg-white/20 px-4 py-2 rounded-full">
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
                              className="bg-gray-50 border border-gray-400 rounded-lg overflow-hidden"
                            >
                              {/* Order Header */}
                              <div
                                onClick={() =>
                                  toggleOrder(companyName, orderKey)
                                }
                                className="bg-gray-200 px-[1.5vw] py-[0.85vw] cursor-pointer transition-all flex justify-between items-center"
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
                                    <div className="flex gap-6 mt-2 text-[0.9vw] text-gray-600">
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
                                    <button
                                      onClick={() =>
                                        handleOpenPaymentModal(order)
                                      }
                                      className="px-[1vw] py-[0.35vw] cursor-pointer bg-gray-600 text-white rounded hover:bg-gray-700 text-[0.85vw] font-medium transition-all cursor-pointer flex items-center justify-center"
                                      title="Add Payment"
                                    >
                                      Payment
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEditOrder(order)}
                                    className="px-[1vw] py-[0.35vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[0.85vw] font-medium transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="px-[1vw] py-[0.35vw] cursor-pointer bg-red-600 text-white rounded hover:bg-red-700 text-[0.85vw] font-medium transition-all"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() =>
                                      handlemoveToScreenPrinting(order)
                                    }
                                    className="px-[1vw] py-[0.35vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-[0.85vw] font-medium transition-all"
                                  >
                                    Move to Screen Printing
                                  </button>
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
                                              Printing Name
                                            </th>
                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                              Printing Color Type
                                            </th>
                                            {viewMode === "remaining" ? (
                                              <>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Total Ordered
                                                </th>

                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Remaining
                                                </th>
                                              </>
                                            ) : (
                                              <>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Order Quantity
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
                                                calculateRemainingItems(
                                                  product
                                                );

                                              // Calculate total ordered and produced
                                              const totalOrdered =
                                                parseInt(product.quantity) || 0;
                                              const totalPrinted =
                                                parseInt(
                                                  product.printedQuantity
                                                ) || 0;

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
                                                    {product.printingName ||
                                                      "N/A"}
                                                  </td>
                                                  <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                    {product.printType || "N/A"}
                                                  </td>
                                                  {viewMode === "remaining" ? (
                                                    <>
                                                      {/* Total Ordered */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-semibold">
                                                        {totalOrdered > 0
                                                          ? totalOrdered.toLocaleString()
                                                          : "-"}
                                                      </td>
                                                      {/* Printed */}

                                                      {/* Remaining */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                        {remaining > 0
                                                          ? remaining.toLocaleString()
                                                          : "-"}
                                                      </td>
                                                    </>
                                                  ) : (
                                                    <>
                                                      {/* Quantity (Normal view) */}
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw]">
                                                        {product.quantity ||
                                                          "-"}
                                                      </td>
                                                      {/* Printed (Normal view) */}
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
                                                    <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center">
                                                      <button
                                                        onClick={() =>
                                                          handlemoveToScreenPrinting(
                                                            order,
                                                            product
                                                          )
                                                        }
                                                        className="px-[1vw] py-[0.4vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-.8vw font-medium transition-all"
                                                      >
                                                        Move to Screen Printing
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
        <div className="mt-6 text-center text-[.9vw]">
          <p className="text-gray-600">
            No result found matching{" "}
            <span className="font-semibold">"{searchTerm}"</span>
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOrder && (
        <PaymentManagementModal
          order={paymentModalOrder}
          onClose={handleClosePaymentModal}
          onSave={handleSavePayment}
        />
      )}
    </div>
  );
}
