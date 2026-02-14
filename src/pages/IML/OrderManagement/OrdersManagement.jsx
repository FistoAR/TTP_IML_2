import { useState, useRef, useEffect } from "react";
import { useCallback } from "react"; // Add this import at top
import { useNavigate } from "react-router-dom";
import NewOrder from "./NewOrder";
import FileUploadBox from "./modals/FileUploadBox";
import * as pdfjsLib from "pdfjs-dist";
import InvoiceTable from './modals/InvoiceTable';
import DeletedRequestsTable from "./modals/DeletedRequestsTable ";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
const OLDDESIGNFILES = [
  { id: 1, name: "Design 1", path: "/assets/pdf/design1.pdf", type: "pdf" },
  { id: 2, name: "Design 2", path: "/assets/pdf/design2.pdf", type: "pdf" },
  { id: 3, name: "Design 3", path: "/assets/pdf/design3.pdf", type: "pdf" },
];

// Mock data storage (In production, this would be an API/Database)
const DATA_VERSION = "3.0"; // Increment this when structure changes
const STORAGE_KEY = "imlorders";
const VERSION_KEY = "imlorders_version";

const STORAGE_KEY_PRODUCTION_ALLOCATION = "iml_production_allocation";

export default function OrdersManagement2() {
  const [view, setView] = useState("dashboard"); // 'dashboard' or 'form'
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [isFromSuggestion, setIsFromSuggestion] = useState(false);
  const [pdfPreviews, setPdfPreviews] = useState({});
  const [allInvoicesTab, setAllInvoicesTab] = useState('active'); // 'active' | 'deleted'
const [allInvoicesModal, setAllInvoicesModal] = useState({ isOpen: false, invoices: [] });

// 🔥 ADD THESE STATES (after other modal states)
const [productDeleteConfirm, setProductDeleteConfirm] = useState({
  isOpen: false,
  orderId: null,
  productId: null,
  productName: ""
});

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

  const [productionModal, setProductionModal] = useState({
    isOpen: false,
    order: null,
    product: null,
    remainingQty: 0,
    sendToProductionQty: "",
    finalRemainingQty: 0,
  });

  const [productionHistoryModal, setProductionHistoryModal] = useState({
    isOpen: false,
    order: null,
    product: null,
    history: [],
  });

  const [changeRequestModal, setChangeRequestModal] = useState({
    isOpen: false,
    order: null,
    product: null,
  });

  const [viewRequestModal, setViewRequestModal] = useState({
    isOpen: false,
    order: null,
    product: null,
  });

  const [estimateRevisionModal, setEstimateRevisionModal] = useState({
    isOpen: false,
    revision: null,
  });

  const PRIORITY_OPTIONS = [
    { value: "low", label: "Low (5-6 weeks)" },
    { value: "medium", label: "Medium (4-5 weeks)" },
    { value: "high", label: "High (<4 weeks)" },
  ];

  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    orderId: null,
  });

  // ✅ Add these 2 states
  const [invoiceCreateModal, setInvoiceCreateModal] = useState({
    isOpen: false,
    product: null,
    orderId: null,
  });

  const [invoiceViewerModal, setInvoiceViewerModal] = useState({
    isOpen: false,
    orderId: null,
  });

  const [deleteOrderModal, setDeleteOrderModal] = useState({
    isOpen: false,
    orderId: null,
    order: null,
  });

  const [orderInvoiceModal, setOrderInvoiceModal] = useState({
    isOpen: false,
    order: null,
  });

  // Add with your other modal states
  const [deletedOrderInvoicesModal, setDeletedOrderInvoicesModal] = useState({
    isOpen: false,
    orderId: null,
    orderNumber: null,
    invoices: [],
  });

  const [tempChangeRequest, setTempChangeRequest] = useState(null);

  const IMLNAME_OPTIONS = [
    "Premium IML Labels",
    "Quality IML Solutions",
    "Eco IML Series",
    "Standard IML",
    "Premium Plus IML",
    "Custom IML Design",
    "Classic IML",
    "Modern IML Tech",
  ];

  const COLOR_OPTIONS = [
    "transparent",
    "black",
    "white",
    "golden",
    "red",
    "blue",
    "green",
    "orange",
    "yellow",
    "pink",
  ];

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

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
      designStatus: "approved",
      orderStatus: "Artwork Approved",
      showLidColorPicker: false,
      showTubColorPicker: false,
      designType: "new",
      moveToPurchase: false,
      singleImlDesign: false,
      isCollapsed: false,
    },
  ]);

  const IML_TYPE_MAP = {
    // Rectangle (all sizes)
    Rectangle: { "500ml": "LID", "650ml": "LID", "750ml": "LID" },
    // Round Square (all sizes)
    "Round Square": { "450ml": "TUB", "500ml": "TUB" },
    // Sweet Boxes (all sizes)
    "Sweet Box": {
      "250gms": "LID & TUB",
      "500gms": "LID & TUB",
      "1kg": "LID & TUB",
    },
    "Sweet Box TE": { "TE 250gms": "LID & TUB", "TE 500gms": "LID & TUB" },
    // Glass Round
    "Glass Round": { "250ml": "TUB" },
    // Round (size-specific)
    Round: {
      "120ml": "TUB",
      "200ml": "LID & TUB",
      "250ml": "TUB",
      "300ml": "TUB",
      "500ml": "TUB",
      "750ml": "TUB",
      "1000ml": "TUB",
    },
  };

  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== DATA_VERSION) {
      // Clear old data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);

      // Initialize with fresh dummy data
      initializeDummyData();

      alert(
        `Data structure updated to version ${DATA_VERSION}. Old data has been cleared.`,
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
            imlType: "LID & TUB",
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
            imlType: "LID & TUB",
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
    const order = orders.find((o) => o.id === orderId);
    setDeleteOrderModal({
      isOpen: true,
      orderId,
      order,
    });
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

      navigate("/iml/purchase/po-details", {
        state: { orderId: order.id, fromOrdersManagement: true },
      });

      // **NEW: Trigger custom event**
      window.dispatchEvent(new Event("ordersUpdated"));

      alert("Order successfully moved to Purchase Management!");
    }
  };

  const handleMoveProductToPurchase = (orderId, productId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const product = order.products.find((p) => p.id === productId);
    if (!product) {
      alert("Product not found.");
      return;
    }

    if (product.moveToPurchase) {
      alert("This product has already been moved to Purchase Management.");
      return;
    }

    const confirmMessage =
      `Are you sure you want to move this product to Purchase Management?\n\n` +
      `Company: ${order.contact.company}\n` +
      `Product: ${product.productName || product.name}`;

    if (!window.confirm(confirmMessage)) return;

    // 1️⃣ Update only THIS product
    const updatedOrders = orders.map((o) => {
      if (o.id !== orderId) return o;

      return {
        ...o,
        products: o.products.map((p) =>
          p.id === productId ? { ...p, moveToPurchase: true } : p,
        ),
      };
    });

    // 2️⃣ Persist
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

    // 3️⃣ Notify listeners
    window.dispatchEvent(new Event("ordersUpdated"));

    // 4️⃣ Navigate to PO Details — IMPORTANT PART
    navigate("/iml/purchase/po-details", {
      state: {
        orderId,
        fromOrdersManagement: true,
        movedProductId: productId, // ⭐ THIS is the key addition
        mode: "single-product",
      },
    });
  };

  const handleEditRequest = (order, product) => {
    sessionStorage.setItem("isEditMode", "true"); // 🔥 FORCE REQUEST MODE

    setChangeRequestModal({
      isOpen: true,
      order,
      product: { ...product }, // Snapshot current product details
    });
  };

  const handleChangeRequest = (order, product) => {
    sessionStorage.setItem("isEditMode", "false"); // 🔥 FORCE REQUEST MODE

    setChangeRequestModal({
      isOpen: true,
      order,
      product: { ...product }, // Snapshot current product details
    });
  };

  // Modal handlers
  const handleCloseChangeRequest = () => {
    console.log(`Change request close triggered`);
    setChangeRequestModal({ isOpen: false, order: null, product: null });
  };

  // const handleDeleteRequest = () => {
  //   const now = new Date().toISOString();
  //   const updatedOrders = orders.map((o) =>
  //     o.id === changeRequestModal.order.id
  //       ? {
  //           ...o,
  //           products: o.products.map((p) =>
  //             p.id === changeRequestModal.product.id
  //               ? {
  //                   ...p,
  //                   changeRequests: [
  //                     ...(p.changeRequests || []),
  //                     { type: "delete", timestamp: now },
  //                   ],
  //                 }
  //               : p,
  //           ),
  //         }
  //       : o,
  //   );
  //   setOrders(updatedOrders);
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  //   window.dispatchEvent(new Event("ordersUpdated"));
  //   handleCloseChangeRequest();
  //   setEstimateRevisionModal({
  //     isOpen: true,
  //     revision: {
  //       orderId: changeRequestModal.order.id,
  //       productId: changeRequestModal.product.id,
  //       productDetails: changeRequestModal.product,
  //       triggerType: "delete",
  //       timestamp: now,
  //       originalEstimate: changeRequestModal.order.orderEstimate,
  //     },
  //   });
  // };

  const handleDeleteRequest = () => {
    const now = new Date().toISOString();
    // TEMP ONLY - don't persist yet
    setTempChangeRequest({
      type: "delete",
      timestamp: now,
      orderId: changeRequestModal.order.id,
      productId: changeRequestModal.product.id,
      productDetails: changeRequestModal.product,
      originalEstimate: changeRequestModal.order.orderEstimate,
    });
    handleCloseChangeRequest(); // Close without persisting
    // Open estimate modal
    setEstimateRevisionModal({
      isOpen: true,
      revision: {
        orderId: changeRequestModal.order.id,
        productId: changeRequestModal.product.id,
        productDetails: changeRequestModal.product,
        triggerType: "delete",
        timestamp: now,
        originalEstimate: changeRequestModal.order.orderEstimate,
      },
    });
  };

  // const handleSubmitRequest = (localProduct) => {
  //   // ✅ Pass localProduct as param
  //   const now = new Date().toISOString();
  //   const originalProduct = changeRequestModal.product;

  //   // ✅ CAPTURE CHANGES - Compare original vs edited
  //   const requestedChanges = {
  //     productName:
  //       localProduct.productName !== originalProduct.productName
  //         ? localProduct.productName
  //         : undefined,
  //     size:
  //       localProduct.size !== originalProduct.size
  //         ? localProduct.size
  //         : undefined,
  //     imlName:
  //       localProduct.imlName !== originalProduct.imlName
  //         ? localProduct.imlName
  //         : undefined,
  //     imlType:
  //       localProduct.imlType !== originalProduct.imlType
  //         ? localProduct.imlType
  //         : undefined,
  //     lidColor:
  //       localProduct.lidColor !== originalProduct.lidColor
  //         ? localProduct.lidColor
  //         : undefined,
  //     tubColor:
  //       localProduct.tubColor !== originalProduct.tubColor
  //         ? localProduct.tubColor
  //         : undefined,
  //     lidLabelQty:
  //       localProduct.lidLabelQty !== originalProduct.lidLabelQty
  //         ? localProduct.lidLabelQty
  //         : undefined,
  //     lidProductionQty:
  //       localProduct.lidProductionQty !== originalProduct.lidProductionQty
  //         ? localProduct.lidProductionQty
  //         : undefined,
  //     tubLabelQty:
  //       localProduct.tubLabelQty !== originalProduct.tubLabelQty
  //         ? localProduct.tubLabelQty
  //         : undefined,
  //     tubProductionQty:
  //       localProduct.tubProductionQty !== originalProduct.tubProductionQty
  //         ? localProduct.tubProductionQty
  //         : undefined,
  //     // Add more fields as needed
  //   };

  //   // ✅ Remove undefined values (clean object)
  //   const cleanRequestedChanges = Object.fromEntries(
  //     Object.entries(requestedChanges).filter(([_, v]) => v !== undefined),
  //   );

  //   const updatedOrders = orders.map((o) =>
  //     o.id === changeRequestModal.order.id
  //       ? {
  //           ...o,
  //           products: o.products.map((p) =>
  //             p.id === originalProduct.id
  //               ? {
  //                   ...p,
  //                   orderStatus: "CR Approval Pending",
  //                   changeRequests: [
  //                     ...(p.changeRequests || []),
  //                     {
  //                       type: "change",
  //                       timestamp: now,
  //                       originalDetails: { ...originalProduct }, // Clone to avoid mutation
  //                       requestedChanges: cleanRequestedChanges, // ✅ Now populated!
  //                     },
  //                   ],
  //                 }
  //               : p,
  //           ),
  //         }
  //       : o,
  //   );

  //   setOrders(updatedOrders);
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  //   window.dispatchEvent(new Event("ordersUpdated"));

  //   handleCloseChangeRequest();

  //   // ✅ Pass localProduct details to revision modal
  //   setEstimateRevisionModal({
  //     isOpen: true,
  //     revision: {
  //       orderId: changeRequestModal.order.id,
  //       productId: changeRequestModal.product.id,
  //       productDetails: {
  //         ...originalProduct,
  //         requestedChanges: cleanRequestedChanges,
  //       }, // ✅ Include changes
  //       triggerType: "submit",
  //       timestamp: now,
  //       originalEstimate: changeRequestModal.order.orderEstimate,
  //     },
  //   });
  // };

  const updateProduct = useCallback((id, field, value) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }, []);

  // Add this new function after updateProduct
  const updateProductWithDesignStatus = useCallback((id, field, value) => {
    setProducts((prevProducts) => {
      const newProducts = prevProducts.map((p) => {
        if (p.id === id) {
          const updates = { [field]: value };

          // ✅ If selecting an existing design, auto-approve
          if (
            (field === "lidSelectedOldDesign" ||
              field === "tubSelectedOldDesign") &&
            value
          ) {
            updates.designStatus = "approved";
            updates.orderStatus = "Artwork Approved";
            updates.approvedDate = getTodayDate();
          }

          return { ...p, ...updates };
        }
        return p;
      });

      // ✅ DEBUG: Log the UPDATED product to verify state change
      const updatedProduct = newProducts.find((p) => p.id === id);
      console.log("Updated Product:", updatedProduct);
      console.log(`Field ${field} set to:`, value);

      return newProducts;
    });
  }, []);

  // handle move to production

  const handleSubmitRequest = (localProduct) => {
    const isEditMode = sessionStorage.getItem("isEditMode") === "true";
    const now = new Date().toISOString();
    const originalProduct = changeRequestModal.product;

    // ✅ CAPTURE CHANGES (SAME LOGIC - works for BOTH modes)
    const requestedChanges = {
      productName:
        localProduct.productName !== originalProduct.productName
          ? localProduct.productName
          : undefined,
      size:
        localProduct.size !== originalProduct.size
          ? localProduct.size
          : undefined,
      imlName:
        localProduct.imlName !== originalProduct.imlName
          ? localProduct.imlName
          : undefined,
      imlType:
        localProduct.imlType !== originalProduct.imlType
          ? localProduct.imlType
          : undefined,
      lidColor:
        localProduct.lidColor !== originalProduct.lidColor
          ? localProduct.lidColor
          : undefined,
      tubColor:
        localProduct.tubColor !== originalProduct.tubColor
          ? localProduct.tubColor
          : undefined,
      lidLabelQty:
        localProduct.lidLabelQty !== originalProduct.lidLabelQty
          ? localProduct.lidLabelQty
          : undefined,
      lidProductionQty:
        localProduct.lidProductionQty !== originalProduct.lidProductionQty
          ? localProduct.lidProductionQty
          : undefined,
      tubLabelQty:
        localProduct.tubLabelQty !== originalProduct.tubLabelQty
          ? localProduct.tubLabelQty
          : undefined,
      tubProductionQty:
        localProduct.tubProductionQty !== originalProduct.tubProductionQty
          ? localProduct.tubProductionQty
          : undefined,
      lidDesignFile:
        localProduct.lidDesignFile !== originalProduct.lidDesignFile ||
        (localProduct.lidDesignFile &&
          localProduct.lidDesignFile.name !==
            originalProduct.lidDesignFile?.name)
          ? {
              name: localProduct.lidDesignFile?.name || "NEW_FILE",
              size: localProduct.lidDesignFile?.size || 0,
              type: localProduct.lidDesignFile?.type || "file",
            }
          : undefined,

      tubDesignFile:
        localProduct.tubDesignFile !== originalProduct.tubDesignFile ||
        (localProduct.tubDesignFile &&
          localProduct.tubDesignFile.name !==
            originalProduct.tubDesignFile?.name)
          ? {
              name: localProduct.tubDesignFile?.name || "NEW_FILE",
              size: localProduct.tubDesignFile?.size || 0,
              type: localProduct.tubDesignFile?.type || "file",
            }
          : undefined,

      lidSelectedOldDesign:
        localProduct.lidSelectedOldDesign !==
        originalProduct.lidSelectedOldDesign
          ? localProduct.lidSelectedOldDesign
          : undefined,
      tubSelectedOldDesign:
        localProduct.tubSelectedOldDesign !==
        originalProduct.tubSelectedOldDesign
          ? localProduct.tubSelectedOldDesign
          : undefined,
    };

    const cleanRequestedChanges = Object.fromEntries(
      Object.entries(requestedChanges).filter(([_, v]) => v !== undefined),
    );

    // 🔥 NEW: Pass localProduct + mode to Estimate Modal
    setTempChangeRequest({
      type: "change",
      timestamp: now,
      orderId: changeRequestModal.order.id,
      productId: changeRequestModal.product.id,
      productDetails: { ...originalProduct },
      requestedChanges: cleanRequestedChanges,
      originalEstimate: changeRequestModal.order.orderEstimate,
      localProductChanges: localProduct, // ✅ FULL edited product
      isEditMode: isEditMode, // 🔥 MODE FLAG
    });

    handleCloseChangeRequest();

    // ✅ ALWAYS open estimate modal (for BOTH modes)
    setEstimateRevisionModal({
      isOpen: true,
      revision: {
        orderId: changeRequestModal.order.id,
        productId: changeRequestModal.product.id,
        productDetails: {
          ...originalProduct,
          requestedChanges: cleanRequestedChanges,
        },
        triggerType: "submit",
        timestamp: now,
        originalEstimate: changeRequestModal.order.orderEstimate,
        isEditMode: isEditMode, // 🔥 PASS MODE TO MODAL
      },
    });
  };

  const handleMoveToProduction = (order, product) => {
    const remaining = calculateRemainingLabels(product);

    if (remaining <= 0) {
      alert("No remaining labels to allocate");
      return;
    }

    // Get allocation history for this product
    const orderKey = `${order.id}_${product.id}`;
    const existingAllocations = JSON.parse(
      localStorage.getItem(STORAGE_KEY_PRODUCTION_ALLOCATION) || "{}",
    );
    const history = existingAllocations[orderKey] || [];

    setProductionModal({
      isOpen: true,
      order: order,
      product: product,
      remainingQty: remaining,
      sendToProductionQty: "",
      finalRemainingQty: remaining,
    });
  };

  const handleViewHistory = (order, product) => {
    const orderKey = `${order.id}_${product.id}`;
    const existingAllocations = JSON.parse(
      localStorage.getItem(STORAGE_KEY_PRODUCTION_ALLOCATION) || "{}",
    );
    const history = existingAllocations[orderKey] || [];

    setProductionHistoryModal({
      isOpen: true,
      order: order,
      product: product,
      history: history,
    });
  };

  // Function to calculate remaining labels for a product
  const calculateRemainingLabels = (product) => {
    let remaining = 0;

    if (product.imlType === "LID" || product.imlType === "LID & TUB") {
      const lidOrdered = parseInt(product.lidLabelQty) || 0;
      const lidProduced = parseInt(product.lidProductionQty) || 0;
      remaining += lidOrdered - lidProduced;
    }

    if (product.imlType === "TUB" || product.imlType === "LID & TUB") {
      const tubOrdered = parseInt(product.tubLabelQty) || 0;
      const tubProduced = parseInt(product.tubProductionQty) || 0;
      remaining += tubOrdered - tubProduced;
    }

    return remaining;
  };

  const PreviewModal = () => {
    if (!previewModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-5000000 flex items-center justify-center p-4">
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
              className="text-gray-500 hover:text-gray-800 text-[2vw] font-bold cursor-pointer"
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

  const ChangeRequestModal = () => {
    if (
      !changeRequestModal.isOpen ||
      !changeRequestModal.order ||
      !changeRequestModal.product
    )
      return null;

    const { product } = changeRequestModal;
    const [localProduct, setLocalProduct] = useState({ ...product });
    const [pdfPreviews, setPdfPreviews] = useState({});

    const updateProductWithDesignStatus = useCallback((id, field, value) => {
      setLocalProduct((prev) => {
        const newProducts = prev; // Single product
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

        console.log("Updated field:", field, "to:", value);
        return { ...newProducts, ...updates };
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
      const pdfDesigns = OLDDESIGNFILES.filter(
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

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-[50%] w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
            <h2 className="text-[1.25vw] font-semibold text-gray-800">
              Change Request - {product.productName} {product.size}
            </h2>
            <button
              onClick={handleCloseChangeRequest}
              className="text-gray-500 hover:text-gray-800 text-[2vw] font-bold cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
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
                options={["LID", "TUB", "LID & TUB"]}
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
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
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
                {isFromSuggestion && (
                  <button
                    onClick={() => {
                      updateProduct(product.id, "designType", "existing");
                      updateProduct(product.id, "lidDesignFile", null);
                      updateProduct(product.id, "tubDesignFile", null);
                    }}
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
                  onClick={() => {
                    updateProduct(product.id, "designType", "new");
                    updateProduct(product.id, "lidSelectedOldDesign", null);
                    updateProduct(product.id, "tubSelectedOldDesign", null);
                    updateProduct(product.id, "lidDesignFile", null);
                    updateProduct(product.id, "tubDesignFile", null);
                  }}
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

              {/* {product.imlType === "LID & TUB" && (
                <label className="flex items-center gap-[0.6vw] mb-[1vw] font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.singleImlDesign || false}
                    onChange={(e) =>
                      updateProduct(
                        product.id,
                        "singleImlDesign",
                        e.target.checked,
                      )
                    }
                    className="w-[1.1vw] h-[1.1vw]"
                  />
                  <span>Select Single IML Design for LID & TUB</span>
                </label>
              )} */}

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
                                      updateProductWithDesignStatus(
                                        product.id,
                                        "lidSelectedOldDesign",
                                        file.id,
                                      )
                                    }
                                  >
                                    <div
                                      className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                        product.lidSelectedOldDesign === file.id
                                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                                          : "border-gray-300"
                                      } overflow-hidden cursor-pointer hover:border-blue-400 transition-all`}
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
                                        name={`lid-design-${product.id}`}
                                        checked={
                                          product.lidSelectedOldDesign ===
                                          file.id
                                        }
                                        onChange={() =>
                                          updateProductWithDesignStatus(
                                            product.id,
                                            "lidSelectedOldDesign",
                                            file.id,
                                          )
                                        }
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
                                  const selectedFile = OLD_DESIGN_FILES.find(
                                    (f) =>
                                      f.id === product.lidSelectedOldDesign,
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
                      {!product.singleImlDesign && (
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
                                      updateProductWithDesignStatus(
                                        product.id,
                                        "tubSelectedOldDesign",
                                        file.id,
                                      )
                                    }
                                  >
                                    <div
                                      className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                        product.tubSelectedOldDesign === file.id
                                          ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300"
                                          : "border-gray-300"
                                      } overflow-hidden cursor-pointer hover:border-purple-400 transition-all`}
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
                                        name={`tub-design-${product.id}`}
                                        checked={
                                          product.tubSelectedOldDesign ===
                                          file.id
                                        }
                                        onChange={() =>
                                          updateProduct(
                                            product.id,
                                            "tubSelectedOldDesign",
                                            file.id,
                                          )
                                        }
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
                                    const selectedFile = OLD_DESIGN_FILES.find(
                                      (f) =>
                                        f.id === product.tubSelectedOldDesign,
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
                                  updateProductWithDesignStatus(
                                    product.id,
                                    "lidSelectedOldDesign",
                                    file.id,
                                  )
                                }
                              >
                                <div
                                  className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${
                                    product.lidSelectedOldDesign === file.id
                                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300"
                                      : "border-gray-300"
                                  } overflow-hidden cursor-pointer hover:border-purple-400 transition-all`}
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
                                    name={`design-${product.id}`}
                                    checked={
                                      product.lidSelectedOldDesign === file.id
                                    }
                                    onChange={() =>
                                      updateProductWithDesignStatus(
                                        product.id,
                                        "lidSelectedOldDesign",
                                        file.id,
                                      )
                                    }
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
                                const selectedFile = OLD_DESIGN_FILES.find(
                                  (f) => f.id === product.lidSelectedOldDesign,
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
                        onChange={(e) => {
                          updateProduct(
                            product.id,
                            "designSharedMail",
                            e.target.checked,
                          );
                          const newValue = e.target.checked
                            ? "pending"
                            : "approved";
                          updateProduct(product.id, "designStatus", newValue);
                          const productIsPOUpdated =
                            product.orderStatus &&
                            product.orderStatus !== "Artwork Pending" &&
                            product.orderStatus !== "Artwork Approved";
                          const orderStatusV = e.target.checked
                            ? "Artwork Pending"
                            : "Artwork Approved";
                          if (!productIsPOUpdated) {
                            updateProduct(
                              product.id,
                              "orderStatus",
                              orderStatusV,
                            );
                          }
                        }}
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
                        options={
                          product.designSharedMail
                            ? ["Pending"] // Checked → ONLY Pending
                            : ["Approved"] // Unchecked → ONLY Approved
                        }
                        value={
                          product.designStatus === "pending"
                            ? "Pending"
                            : product.designStatus === "approved"
                              ? "Approved"
                              : ""
                        }
                        onChange={(e) => {
                          const newValue = e.target.value.toLowerCase();
                        }}
                      />
                    </div>

                    {product.designStatus === "approved" && (
                      <div>
                        <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
                          Approve Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={product.approvedDate}
                          onChange={(e) =>
                            updateProduct(
                              product.id,
                              "approvedDate",
                              e.target.value,
                            )
                          }
                          className="w-full px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Design Upload Section - Conditional based on imlType */}
                  {(product.designStatus === "approved" ||
                    !product.designSharedMail) && (
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
                                  file={localProduct.lidDesignFile}
                                  onFileChange={(file) => {
                                    updateLocalField("lidDesignFile", file); // ✅ updateLocalField (not parent updateProduct)
                                    if (file?.type === "application/pdf") {
                                      generatePdfThumbnail(
                                        file,
                                        `${product.id}-lid`,
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
                          {!product.singleImlDesign && (
                            <div>
                              <label className="block text-[0.9vw] font-medium text-gray-700 mb-[0.5vw]">
                                Upload TUB Design File{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="grid grid-cols-2 gap-[2vw]">
                                <div>
                                  <FileUploadBox
                                    file={localProduct.tubDesignFile}
                                    onFileChange={(file) => {
                                      updateLocalField("tubDesignFile", file); // ✅ localProduct
                                      if (file?.type === "application/pdf") {
                                        generatePdfThumbnail(
                                          file,
                                          `${product.id}-tub`,
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
                              <FileUploadBox
                                file={localProduct.lidDesignFile}
                                onFileChange={(file) => {
                                  updateProductWithDesignStatus(
                                    localProduct.id,
                                    "lidDesignFile",
                                    file,
                                  );
                                  if (file && file.type === "application/pdf") {
                                    generatePdfThumbnail(file, localProduct.id);
                                  }
                                }}
                                productId={localProduct.id}
                                small
                              />
                            </div>
                            <div>
                              {product.lidDesignFile && (
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
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded cursor-pointer hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRequest}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => {
                // Update handleSubmitRequest to use localProduct
                handleSubmitRequest(localProduct);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ViewRequestModal = () => {
    // ✅ ADD LOCAL STATE for immediate updates
    const [localOrders, setLocalOrders] = useState(orders);
    const [invoiceNumber, setInvoiceNumber] = useState("");

    useEffect(() => {
      // Sync with parent orders
      setLocalOrders(orders);
    }, [orders]);

    if (
      !viewRequestModal.isOpen ||
      !viewRequestModal.order ||
      !viewRequestModal.product
    ) {
      return null;
    }

    const { order, product: modalProduct } = viewRequestModal; // Rename for clarity

    // ✅ SAFER LOOKUP with fallback
    const currentOrder = localOrders.find((o) => o.id === order.id);
    const currentProduct =
      currentOrder?.products?.find((p) => p.id === modalProduct.id) ||
      modalProduct;

    // ✅ EARLY GUARD - Prevent render if no valid product
    if (!currentProduct) {
      console.warn("No currentProduct found for ViewRequestModal", {
        orderId: order.id,
        productId: modalProduct.id,
      });
      return null;
    }

    const changeRequests = (currentProduct.changeRequests || []).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    // ✅ Remarks modal state
    const [remarksModal, setRemarksModal] = useState({
      isOpen: false,
      requestIndex: -1,
      action: "",
    });
    const [remarks, setRemarks] = useState("");
    const [invoiceModal, setInvoiceModal] = useState({
      isOpen: false,
      requestIndex: -1,
    });

    console.log(`Current Product: ${JSON.stringify(currentProduct, null, 2)}`);

    console.log(
      `Revised estimate : ${JSON.stringify(currentProduct?.revisedEstimate, null, 2)}`,
    );
    console.log(
      `Estimated number: ${currentProduct?.revisedEstimate?.estimatedNumber}`,
    );
    console.log(
      `Estimated value: ${currentProduct?.revisedEstimate?.estimatedValue}`,
    );

    // ✅ UPDATED handleAction - uses local state
    const handleAction = (requestIndex, action) => {
      setRemarksModal({
        isOpen: true,
        requestIndex,
        action,
      });
      setRemarks("");
    };

    const submitRemarks = () => {
      const requestIndex = remarksModal.requestIndex;
      const action = remarksModal.action;
      const request = changeRequests[requestIndex];

      // ✅ EARLY GUARDS
      if (!request) {
        alert("Invalid request");
        return;
      }

      let updatedOrders = localOrders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              products: o.products.map((p) =>
                p.id === currentProduct.id
                  ? {
                      ...p,
                      changeRequests: p.changeRequests.map((req, idx) =>
                        idx === requestIndex
                          ? {
                              ...req,
                              status: action.toUpperCase(),
                              remarks: remarks,
                              processedAt: new Date().toISOString(),
                            }
                          : req,
                      ),
                    }
                  : p,
              ),
            }
          : o,
      );

      // ✅ SPECIAL HANDLING FOR ACTIONS
      if (action === "accept") {
        if (request.type === "delete") {
          // ✅ DELETE PRODUCT FROM ORDER + CREATE DRAFT INVOICE
          updatedOrders = localOrders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  orderEstimate: {
                    ...o.orderEstimate,
                    estimatedNumber:
                      request.revisedEstimate?.estimatedNumber ||
                      o.orderEstimate.estimatedNumber,
                    estimatedValue: parseInt(
                      request.revisedEstimate?.estimatedValue ||
                        o.orderEstimate.estimatedValue,
                    ),
                  },
                  products: o.products.filter(
                    (p) => p.id !== currentProduct.id,
                  ),
                  invoices: [
                    ...(o.invoices || []),
                    {
                      id: `INV-${Date.now()}`,
                      productId: currentProduct.id,
                      productName:
                        currentProduct.productName ||
                        currentProduct.productName,
                      size: currentProduct.size || currentProduct.size,
                      invoiceNo: invoiceNumber,
                      invoiceDate: new Date().toISOString(),
                      amount:
                        currentProduct.budget || currentProduct.budget || 0,
                      reason: "Product Deleted",
                      remarks: remarks,
                      status: "Draft",
                    },
                  ],
                }
              : o,
          );
        } else {
          // ✅ APPLY CHANGE REQUEST TO PRODUCT (USE CURRENT PRODUCT)
          const changes = request.requestedChanges || {};
          updatedOrders = localOrders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  orderEstimate: {
                    ...o.orderEstimate,
                    estimatedNumber:
                      request.revisedEstimate?.estimatedNumber ||
                      o.orderEstimate.estimatedNumber,
                    estimatedValue: parseInt(
                      request.revisedEstimate?.estimatedValue ||
                        o.orderEstimate.estimatedValue,
                    ),
                  },
                  products: o.products.map((p) =>
                    p.id === currentProduct.id
                      ? {
                          ...p,
                          orderStatus: "PO Raised & Labels in Process",
                          productName: changes.productName || p.productName,
                          size: changes.size || p.size,
                          imlName: changes.imlName || p.imlName,
                          imlType: changes.imlType || p.imlType,
                          lidColor: changes.lidColor || p.lidColor,
                          tubColor: changes.tubColor || p.tubColor,
                          lidLabelQty:
                            changes.lidLabelQty !== undefined
                              ? changes.lidLabelQty
                              : p.lidLabelQty,
                          lidProductionQty:
                            changes.lidProductionQty !== undefined
                              ? changes.lidProductionQty
                              : p.lidProductionQty,
                          tubLabelQty:
                            changes.tubLabelQty !== undefined
                              ? changes.tubLabelQty
                              : p.tubLabelQty,
                          tubProductionQty:
                            changes.tubProductionQty !== undefined
                              ? changes.tubProductionQty
                              : p.tubProductionQty,
                          changeRequests: p.changeRequests.map((req, idx) =>
                            idx === requestIndex
                              ? {
                                  ...req,
                                  status: "ACCEPTED",
                                  remarks: remarks,
                                  processedAt: new Date().toISOString(),
                                }
                              : req,
                          ),
                        }
                      : p,
                  ),
                }
              : o,
          );
        }

        // ✅ UPDATE LOCAL STATE IMMEDIATELY
        setLocalOrders(updatedOrders);

        // ✅ Save to parent + localStorage
        setOrders(updatedOrders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        window.dispatchEvent(new Event("ordersUpdated"));

        if (action === "accept") {
          if (request.type === "delete") {
            alert("Product deleted!!");
            setViewRequestModal({ isOpen: false, order: null, product: null });
          }
        }
      } else {
        // ✅ DECLINE - Just update status (no product changes)
        setLocalOrders(updatedOrders);
        setOrders(updatedOrders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        window.dispatchEvent(new Event("ordersUpdated"));
      }

      // Close remarks
      setRemarksModal({ isOpen: false, requestIndex: -1, action: "" });

      setRemarks("");
    };

    // ✅ Helper to get changed fields
    const getChangedFields = (request) => {
      const changes = request.requestedChanges || {};
      const fields = [];

      // ✅ EXISTING FIELDS (keep all)
      if (changes.productName)
        fields.push(`Product Name: ${changes.productName}`);
      if (changes.size) fields.push(`Size: ${changes.size}`);
      if (changes.imlName) fields.push(`IML Name: ${changes.imlName}`);
      if (changes.imlType) fields.push(`IML Type: ${changes.imlType}`);
      if (changes.lidColor) fields.push(`LID Color: ${changes.lidColor}`);
      if (changes.tubColor) fields.push(`TUB Color: ${changes.tubColor}`);
      if (changes.lidLabelQty !== undefined)
        fields.push(`LID Label Qty: ${changes.lidLabelQty}`);
      if (changes.lidProductionQty !== undefined)
        fields.push(`LID Prod Qty: ${changes.lidProductionQty}`);
      if (changes.tubLabelQty !== undefined)
        fields.push(`TUB Label Qty: ${changes.tubLabelQty}`);
      if (changes.tubProductionQty !== undefined)
        fields.push(`TUB Prod Qty: ${changes.tubProductionQty}`);

      // 🔥 NEW: DESIGN FILE CHANGES
      if (changes.lidDesignFile) {
        fields.push(
          `LID Design: ${changes.lidDesignFile.name} (${Math.round(changes.lidDesignFile.size / 1024)}KB)`,
        );
      }
      if (changes.tubDesignFile) {
        fields.push(
          `TUB Design: ${changes.tubDesignFile.name} (${Math.round(changes.tubDesignFile.size / 1024)}KB)`,
        );
      }
      if (changes.lidSelectedOldDesign)
        fields.push(`LID Old Design: ${changes.lidSelectedOldDesign}`);
      if (changes.tubSelectedOldDesign)
        fields.push(`TUB Old Design: ${changes.tubSelectedOldDesign}`);

      return fields.length > 0 ? fields : ["No specific changes recorded"];
    };

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50001] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
            <h2 className="text-[1.25vw] font-semibold text-gray-800">
              Change Request History - {currentProduct.productName}{" "}
              {currentProduct.size}
            </h2>
            <button
              onClick={() =>
                setViewRequestModal({
                  isOpen: false,
                  order: null,
                  product: null,
                })
              }
              className="text-gray-500 hover:text-gray-800 text-[2vw] font-bold cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            {changeRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No change requests found.
              </p>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {changeRequests.map((request, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            request.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : request.status === "DECLINED"
                                ? "bg-red-100 text-red-800"
                                : request.type === "delete"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {request.type === "delete"
                            ? "DELETE REQUEST"
                            : "CHANGE REQUEST"}
                          {request.status && ` - ${request.status}`}
                        </span>
                        {request.status && (
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(request.processedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(request.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* ✅ DELETE REQUEST - FIXED: Use current product data */}
                    {request.type === "delete" ? (
                      <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-3">
                            Product Details to Delete:
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-[.8vw]">
                            <div>
                              <p>
                                <strong>Product:</strong>{" "}
                                {currentProduct.productName}{" "}
                                {currentProduct.size}
                              </p>
                              <p>
                                <strong>IML Name:</strong>{" "}
                                {currentProduct.imlName ||
                                  currentProduct?.changeRequests?.productDetails
                                    ?.imlName}
                              </p>
                              <p>
                                <strong>IML Type:</strong>{" "}
                                {currentProduct.imlType ||
                                  currentProduct?.changeRequests?.productDetails
                                    ?.imlType}
                              </p>
                            </div>
                            <div>
                              <p>
                                <strong>LID Color:</strong>{" "}
                                {currentProduct.lidColor ||
                                  currentProduct?.changeRequests?.productDetails
                                    ?.lidColor}
                              </p>
                              <p>
                                <strong>TUB Color:</strong>{" "}
                                {currentProduct.tubColor ||
                                  currentProduct?.changeRequests?.productDetails
                                    ?.tubColor}
                              </p>

                              {currentProduct.imlType === "LID" && (
                                <p>
                                  <strong>LID Label Qty:</strong>{" "}
                                  {currentProduct.lidLabelQty ||
                                    currentProduct?.changeRequests
                                      ?.productDetails?.lidLabelQty ||
                                    "N/A"}
                                </p>
                              )}
                              {currentProduct.imlType === "TUB" && (
                                <p>
                                  <strong>TUB Label Qty:</strong>{" "}
                                  {currentProduct.tubLabelQty ||
                                    currentProduct?.changeRequests
                                      ?.productDetails?.tubLabelQty ||
                                    "N/A"}
                                </p>
                              )}
                              {currentProduct.imlType === "LID & TUB" && (
                                <>
                                  <p>
                                    <strong>LID Label Qty:</strong>{" "}
                                    {currentProduct.lidLabelQty ||
                                      currentProduct?.changeRequests
                                        ?.productDetails?.lidLabelQty ||
                                      "N/A"}
                                  </p>
                                  <p>
                                    <strong>TUB Label Qty:</strong>{" "}
                                    {currentProduct.tubLabelQty ||
                                      currentProduct?.changeRequests
                                        ?.productDetails?.tubLabelQty ||
                                      "N/A"}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {request.remarks && (
                          <div className="bg-orange-50 p-3 rounded border border-orange-200 text-[.8vw]">
                            <strong>Previous Remarks:</strong> {request.remarks}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ✅ CHANGE REQUEST - Original vs Requested */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border text-[.8vw]">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Original Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>IML Name:</strong>{" "}
                              {request.originalDetails?.imlName ||
                                currentProduct?.imlName}
                            </p>
                            <p>
                              <strong>LID Color:</strong>{" "}
                              {request.originalDetails?.lidColor ||
                                currentProduct?.lidColor}
                            </p>
                            <p>
                              <strong>TUB Color:</strong>{" "}
                              {request.originalDetails?.tubColor ||
                                currentProduct?.tubColor}
                            </p>
                            <p>
                              <strong>IML Type:</strong>{" "}
                              {request.originalDetails?.imlType ||
                                currentProduct?.imlType}
                            </p>
                          </div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                          <h4 className="font-semibold text-indigo-800 mb-3">
                            Requested Changes
                          </h4>
                          {/* 🔥 DESIGN FILES - With ACTUAL IMAGE PREVIEW */}
                          {/* 🔥 SAFE DESIGN FILES PREVIEW */}
{(request.requestedChanges?.lidDesignFile || request.requestedChanges?.tubDesignFile) && (
  <div className="mb-6 space-y-4">
    <h5 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
      📄 Design Files 
    </h5>
    
    <div className="grid">
      {/* 🔥 LID DESIGN */}
      {request.requestedChanges?.lidDesignFile && (
        <div className="bg-white border border-indigo-200 rounded-xl p-4 hover:shadow-lg transition-all">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
              request.requestedChanges.lidDesignFile.type?.includes('pdf') 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'bg-gradient-to-br from-purple-500 to-pink-600'
            }`}>
              {request.requestedChanges.lidDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-indigo-900 truncate pr-2">
                {request.requestedChanges.lidDesignFile.name}
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(request.requestedChanges.lidDesignFile.size / 1024)} KB
              </div>
            </div>
          </div>

          {/* 🔥 SAFE IMAGE PREVIEW */}
          <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
            {(() => {
              // 🔥 SAFE VALIDATION
              const isValidImageFile = currentProduct.lidDesignFile && 
                                     (currentProduct.lidDesignFile instanceof File || 
                                      currentProduct.lidDesignFile instanceof Blob) &&
                                     currentProduct.lidDesignFile.type?.startsWith('image/');
              
              if (isValidImageFile) {
                return (
                  <img 
                    src={URL.createObjectURL(currentProduct.lidDesignFile)} 
                    alt="LID Design Preview"
                    className="w-full h-full object-contain bg-white"
                  />
                );
              } else {
                return (
                  <div className="text-center p-6 text-gray-400">
                    <div className="w-[5vw] h-[5vw] mx-auto mb-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                      {request.requestedChanges.lidDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                    </div>
                    <div className="text-sm font-medium">Preview Unavailable</div>
                    <div className="text-xs mt-1">File not loaded</div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* 🔥 TUB DESIGN - SAME PATTERN */}
      {request.requestedChanges?.tubDesignFile && (
        <div className="bg-white border border-indigo-200 rounded-xl p-4 hover:shadow-lg transition-all mt-[.5vw]">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
              request.requestedChanges.tubDesignFile.type?.includes('pdf') 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-orange-500 to-red-600'
            }`}>
              {request.requestedChanges.tubDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-indigo-900 truncate pr-2">
                {request.requestedChanges.tubDesignFile.name}
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(request.requestedChanges.tubDesignFile.size / 1024)} KB
              </div>
            </div>
          </div>

          <div className="w-full h-48  bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
            {(() => {
              const isValidImageFile = currentProduct.tubDesignFile && 
                                     (currentProduct.tubDesignFile instanceof File || 
                                      currentProduct.tubDesignFile instanceof Blob) &&
                                     currentProduct.tubDesignFile.type?.startsWith('image/');
              
              if (isValidImageFile) {
                return (
                  <img 
                    src={URL.createObjectURL(currentProduct.tubDesignFile)} 
                    alt="TUB Design Preview"
                    className="w-full h-full object-contain bg-white"
                  />
                );
              } else {
                return (
                  <div className="text-center p-6 text-gray-400">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                      {request.requestedChanges.tubDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                    </div>
                    <div className="text-sm font-medium">Preview Unavailable</div>
                    <div className="text-xs mt-1">File not loaded</div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  </div>
)}


                          <div className="space-y-1 text-sm">
                            {getChangedFields(request).map((field, idx) => (
                              <>
                                <p
                                  key={idx}
                                  className="bg-indigo-100 px-2 py-1 rounded text-indigo-900 font-medium"
                                >
                                  {field}
                                </p>
                              </>
                            ))}
                            <div className="space-y-[.25vw] text-[.8vw] text-black font-medium mt-[1vw]">
                              <p>
                                Revised Estimated No:{" "}
                                {request.revisedEstimate?.estimatedNumber}
                              </p>
                              <p>
                                Revised Estimated Value:{" "}
                                {request.revisedEstimate?.estimatedValue}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ INVOICE BUTTON - If exists */}
                    {request.status === "ACCEPTED" &&
                      request.type === "delete" &&
                      currentOrder.invoices?.some(
                        (inv) => inv.productId === currentProduct.id,
                      ) && (
                        <div className="mt-3 p-3 bg-blue-50 border rounded">
                          <button
                            onClick={() =>
                              setInvoiceModal({
                                isOpen: true,
                                requestIndex: index,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                          >
                            📄 View Generated Invoice
                          </button>
                        </div>
                      )}

                    {/* ✅ ACTION BUTTONS - Only for unprocessed */}
                    {!request.status && (
                      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleAction(index, "accept")}
                          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all shadow-md"
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleAction(index, "decline")}
                          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all shadow-md"
                        >
                          ❌ Decline
                        </button>
                      </div>
                    )}

                    {request.status && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm border">
                        <div className="flex items-center justify-between">
                          <span>
                            <strong>Status:</strong> {request.status}
                          </span>
                          {request.remarks && (
                            <span className="text-[.7vw] bg-yellow-200 px-2 py-1 rounded">
                              Remarks Added
                            </span>
                          )}
                        </div>
                        {request.remarks && (
                          <p className="mt-1 text-[.7vw] text-gray-700 bg-white p-2 rounded mt-2">
                            {request.remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ✅ REMARKS MODAL */}
        {remarksModal.isOpen && (
          <div className="fixed inset-0 bg-[#000000b3] z-[50002] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {remarksModal.action === "accept"
                    ? "Accept Request"
                    : "Decline Request"}
                </h3>
                <button
                  onClick={() =>
                    setRemarksModal({
                      isOpen: false,
                      requestIndex: -1,
                      action: "",
                    })
                  }
                  className="text-gray-500 hover:text-gray-800 text-2xl font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
              {/* remarks field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={`Enter remarks for ${remarksModal.action === "accept" ? "approval" : "rejection"}...`}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                />
              </div>

              {/* ✅ INVOICE NUMBER - ONLY FOR DELETE + ACCEPT */}
              

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setRemarksModal({
                      isOpen: false,
                      requestIndex: -1,
                      action: "",
                    })
                  }
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRemarks}
                  disabled={!remarks.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {remarksModal.action.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ INVOICE MODAL */}
        {invoiceModal.isOpen && (
          <div className="fixed inset-0 bg-[#000000b3] z-[50003] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <h3 className="text-lg font-semibold">Invoice Details</h3>
                <button
                  onClick={() =>
                    setInvoiceModal({ isOpen: false, requestIndex: -1 })
                  }
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                {currentOrder.invoices?.map(
                  (invoice) =>
                    invoice.productId === product.id && (
                      <div
                        key={invoice.id}
                        className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50"
                      >
                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Invoice ID</p>
                            <p className="font-bold text-lg text-blue-900">
                              {invoice.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-bold text-lg">
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <p>
                            <strong>Product:</strong> {invoice.productName}{" "}
                            {invoice.size}
                          </p>
                          <p>
                            <strong>Reason:</strong> {invoice.reason}
                          </p>
                          <p>
                            <strong>Amount:</strong> ₹
                            {invoice.amount?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Remarks: {invoice.remarks}
                          </p>
                        </div>
                        <div className="text-center pt-4 border-t">
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const InvoiceModal = () => {
    // ✅ LOCAL FORM STATE - FIXES FOCUS LOSS
    const [formData, setFormData] = useState({
      invoiceNo: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      amount: invoiceCreateModal.product?.budget || 0,
    });

    // Reset form when modal opens
    useEffect(() => {
      if (invoiceCreateModal.isOpen && invoiceCreateModal.product) {
        setFormData({
          invoiceNo: "",
          invoiceDate: new Date().toISOString().split("T")[0],
          amount: invoiceCreateModal.product.budget || 0,
        });
      }
    }, [invoiceCreateModal]);

    const handleSubmit = () => {
      // ✅ PROPER VALIDATION
      if (!formData.invoiceNo.trim()) {
        alert("Invoice No is required");
        return;
      }
      if (!formData.invoiceDate) {
        alert("Invoice Date is required");
        return;
      }
      if (!formData.amount || formData.amount <= 0) {
        alert("Valid amount is required");
        return;
      }

      // ✅ UPDATE INVOICES - Find the draft invoice by productId
      const draftInvoice = orders
        .find((o) => o.id === invoiceCreateModal.orderId)
        ?.invoices?.find(
          (inv) => inv.productId === invoiceCreateModal.product.id,
        );

      if (!draftInvoice) {
        alert("Draft invoice not found");
        return;
      }

      const updatedOrders = orders.map((o) =>
        o.id === invoiceCreateModal.orderId
          ? {
              ...o,
              invoices: o.invoices.map((inv) =>
                inv.id === draftInvoice.id
                  ? {
                      ...inv,
                      invoiceNo: formData.invoiceNo,
                      invoiceDate: formData.invoiceDate,
                      amount: parseFloat(formData.amount),
                      status: "Generated",
                    }
                  : inv,
              ),
            }
          : o,
      );

      // ✅ SAVE
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));

      // ✅ OPEN VIEWER + CLOSE CREATE
      setInvoiceViewerModal({
        isOpen: true,
        orderId: invoiceCreateModal.orderId,
      });
      setInvoiceCreateModal({ isOpen: false, product: null, orderId: null });
      alert(`Invoice created!!`);
      setViewRequestModal({ isOpen: false, order: null, product: null });
    };

    if (!invoiceCreateModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50006] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-blue-200">
            <div>
              <h2 className="text-3xl font-black text-gray-900">
                Create Invoice
              </h2>
              <p className="text-lg text-gray-600 mt-1">
                For deleted product:{" "}
                <strong>
                  {invoiceCreateModal.product?.productName}{" "}
                  {invoiceCreateModal.product?.size}
                </strong>
              </p>
            </div>
            <button
              onClick={() =>
                setInvoiceCreateModal({
                  isOpen: false,
                  product: null,
                  orderId: null,
                })
              }
              className="text-gray-500 hover:text-gray-800 text-3xl font-bold cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* FORM */}
          <div className="space-y-6">
            {/* Invoice No */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Invoice No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.invoiceNo}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNo: e.target.value })
                }
                placeholder="INV-2026-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg font-semibold"
              />
            </div>

            {/* Invoice Date & Amount */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="25000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 text-lg font-semibold text-right"
                />
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <h4 className="font-bold text-xl text-blue-900 mb-4">
                Product Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <strong>IML Name:</strong>{" "}
                  {invoiceCreateModal.product?.imlName}
                </div>
                <div>
                  <strong>LID Color:</strong>{" "}
                  {invoiceCreateModal.product?.lidColor}
                </div>
                <div>
                  <strong>TUB Color:</strong>{" "}
                  {invoiceCreateModal.product?.tubColor}
                </div>
                <div>
                  <strong>Type:</strong> {invoiceCreateModal.product?.imlType}
                </div>
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-12 pt-8 border-t-4 border-gray-200">
            <button
              onClick={() =>
                setInvoiceCreateModal({
                  isOpen: false,
                  product: null,
                  orderId: null,
                })
              }
              className="flex-1 px-8 py-4 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold text-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-2xl hover:scale-[1.02] font-bold text-lg transition-all"
            >
              ✅ Generate Invoice
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ViewInvoice = () => {
    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50005] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-blue-200">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[1.5vw] font-black tracking-tight">
                  INVOICES
                </h2>
                <p className="opacity-90 text-[1vw]">
                  Generated from Product Deletions
                </p>
              </div>
              <button
                onClick={() =>
                  setInvoiceModal({ isOpen: false, orderId: null })
                }
                className="text-white cursor-pointer rounded-2xl w-14 h-14 flex items-center justify-center text-[2vw] font-bold transition-all"
              >
                ×
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8">
            {orders.find((o) => o.id === invoiceModal.orderId)?.invoices
              ?.length > 0 ? (
              <div className="space-y-4">
                {orders
                  .find((o) => o.id === invoiceModal.orderId)
                  ?.invoices?.slice() // make a copy
                  .reverse() // reverse order
                  .map((invoice, index) => (
                    <div
                      key={invoice.id}
                      className="group border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-8 bg-gradient-to-br from-slate-50 to-blue-50 hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      {/* TOP ROW */}
                      <div className="flex items-start justify-between mb-6 pb-4 border-b border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            💰
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {invoice.id}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(invoice.date).toLocaleDateString(
                                "en-IN",
                              )}{" "}
                              •{" "}
                              {new Date(invoice.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-4xl font-black text-emerald-600 mb-1">
                            ₹{invoice.amount?.toLocaleString() || "0"}
                          </div>
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold ${
                              invoice.status === "Generated"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </div>

                      {/* PRODUCT & REASON */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <h4 className="font-bold text-xl text-gray-800 mb-3">
                            Product Deleted
                          </h4>
                          <p className="text-lg">
                            <strong>{invoice.productName}</strong>{" "}
                            {invoice.size}
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5">
                          <h4 className="font-bold text-orange-900 mb-2">
                            Reason
                          </h4>
                          <p className="text-sm text-orange-900">
                            {invoice.reason}
                          </p>
                        </div>
                      </div>

                      {/* REMARKS */}
                      {invoice.remarks && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                          <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                            💬 Remarks
                          </h4>
                          <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed">
                            {invoice.remarks}
                          </p>
                        </div>
                      )}

                      {/* FOOTER */}
                      <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-500 items-center justify-between">
                        <div>
                          <p>Generated via Change Request System</p>
                          <p className="text-gray-400">
                            Auto-generated on deletion
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm transition-all"
                          >
                            🖨️ Print
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  No Invoices Found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Invoices are generated when products are deleted via change
                  requests.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Add this function in your main component (with other handlers)
  // const handleSaveEstimateRevision = (revision, localRevisedEstimate) => {
  //   // Store in order.estimateRevisions array
  //   const updatedOrders = orders.map((o) =>
  //     o.id === revision.orderId
  //       ? {
  //           ...o,
  //           estimateRevisions: [
  //             ...(o.estimateRevisions || []),
  //             {
  //               ...localRevisedEstimate,
  //               triggeredByProduct: revision.productDetails,
  //               originalEstimate: revision.originalEstimate,
  //               timestamp: new Date().toISOString(),
  //             },
  //           ],
  //         }
  //       : o,
  //   );

  //   setOrders(updatedOrders);
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  //   window.dispatchEvent(new Event("ordersUpdated"));
  //   setEstimateRevisionModal({ isOpen: false, revision: null });
  // };
  const handleSaveEstimateRevision = (revision, localRevisedEstimate) => {
    const now = new Date().toISOString();
    const order = orders.find((o) => o.id === revision.orderId);
    const product = order.products.find((p) => p.id === revision.productId);

    // 1. Add change request to product
    const changeRequest = {
      ...tempChangeRequest,
      revisedEstimate: localRevisedEstimate, // Link them
    };

    // 2. Persist change request + revised estimate
    const updatedOrders = orders.map((o) =>
      o.id === revision.orderId
        ? {
            ...o,
            // orderEstimate: { ...o.orderEstimate, ...localRevisedEstimate }, // Update estimate
            products: o.products.map((p) =>
              p.id === revision.productId
                ? {
                    ...p,
                    changeRequests: [
                      ...(p.changeRequests || []),
                      changeRequest,
                    ],
                    revisedEstimate: {
                      // 🔥 NEW - Per request
                      ...o.orderEstimate,
                      ...localRevisedEstimate,
                    },
                  }
                : p,
            ),
          }
        : o,
    );

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));
    setTempChangeRequest(null); // Clear temp
    setEstimateRevisionModal({ isOpen: false, revision: null });
  };

  // const EstimateRevisionModal = () => {
  //   if (!estimateRevisionModal.isOpen) return null;

  //   const { revision, isOpen } = estimateRevisionModal;
  // const isEditMode = revision?.isEditMode || false;

  //   const handleSaveRevisedEstimate = () => {
  //   const revisedEstimateNo = document.getElementById('revisedEstimateNo')?.value || '';
  //   const revisedEstimateValue = parseFloat(document.getElementById('revisedEstimateValue')?.value) || 0;

  //   if (!revisedEstimateNo || !revisedEstimateValue) {
  //     alert('Please enter both Revised Estimate No & Value');
  //     return;
  //   }

  //   if (isEditMode) {
  //     // 🚀 EDIT MODE: DIRECT SAVE
  //     handleDirectSave(tempChangeRequest.localProductChanges, revisedEstimateNo, revisedEstimateValue);
  //   } else {
  //     // 📤 REQUEST MODE: Send as Request
  //     handleSendAsRequest(tempChangeRequest, revisedEstimateNo, revisedEstimateValue);
  //   }
  // };

  //   const order = orders.find((o) => o.id === revision.orderId);

  //   const [localRevisedEstimate, setLocalRevisedEstimate] = useState({
  //     estimatedNumber: revision.originalEstimate?.estimatedNumber || "",
  //     estimatedValue: revision.originalEstimate?.estimatedValue || "",
  //   });

  //   useEffect(() => {
  //     if (revision?.originalEstimate) {
  //       setLocalRevisedEstimate({
  //         estimatedNumber: 0,
  //         estimatedValue: 0,
  //       });
  //     }
  //   }, [revision]);

  //   // ✅ PASS DATA UP - Don't save here
  //   const handleSaveClick = () => {
  //     if (
  //       !localRevisedEstimate.estimatedNumber?.trim() ||
  //       !localRevisedEstimate.estimatedValue?.trim()
  //     ) {
  //       alert(
  //         "Revised estimated no & value are required to submit change request.",
  //       );
  //       return;
  //     }

  //     // Call parent handler with data
  //     handleSaveEstimateRevision(revision, localRevisedEstimate);
  //   };

  //   return (
  //     <div className="fixed inset-0 bg-[#000000b3] z-[50001] flex items-center justify-center p-4">
  //       <div className="bg-white rounded-lg max-w-3xl w-full p-6">
  //         {/* Header */}
  //         <div className="flex items-center justify-between mb-6">
  //           <h2 className="text-xl font-semibold">Revised Estimate Details</h2>
  //           <button
  //             onClick={() =>
  //               setEstimateRevisionModal({ isOpen: false, revision: null })
  //             }
  //             className="text-2xl font-bold cursor-pointer"
  //           >
  //             ×
  //           </button>
  //         </div>

  //         {/* Order Info */}
  //         <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto">
  //           <Input
  //             label="Company Name"
  //             value={order?.contact.company || ""}
  //             disabled={true}
  //           />
  //           <Input
  //             label="Contact Name"
  //             value={order?.contact.contactName || ""}
  //             disabled={true}
  //           />
  //           <Input
  //             label="Contact Number"
  //             value={order?.contact.phone || ""}
  //             disabled={true}
  //           />
  //           <Select
  //             label="Priority"
  //             value={order?.contact.priority}
  //             disabled={true}
  //             options={PRIORITY_OPTIONS}
  //           />
  //           <Input
  //             label="Order Number"
  //             value={order?.orderNumber || ""}
  //             disabled={true}
  //           />
  //           <Input
  //             label="Original Estimated Number"
  //             value={order.orderEstimate?.estimatedNumber || ""}
  //             disabled={true}
  //           />
  //           <Input
  //             label="Original Estimated Value"
  //             value={
  //               order.orderEstimate?.estimatedValue?.toLocaleString() || ""
  //             }
  //             disabled={true}
  //           />
  //         </div>

  //         {/* Editable Fields */}
  //         <div className="grid grid-cols-2 gap-4 mb-6">
  //           <Input
  //             label="Revised Estimated Number"
  //             value={localRevisedEstimate.estimatedNumber}
  //             type="number"
  //             onChange={(e) =>
  //               setLocalRevisedEstimate({
  //                 ...localRevisedEstimate,
  //                 estimatedNumber: e.target.value,
  //               })
  //             }
  //             placeholder="EST-001"
  //           />
  //           <Input
  //             label="Revised Estimated Value"
  //             value={localRevisedEstimate.estimatedValue}
  //             type="number"
  //             onChange={(e) =>
  //               setLocalRevisedEstimate({
  //                 ...localRevisedEstimate,
  //                 estimatedValue: e.target.value,
  //               })
  //             }
  //             placeholder="45000"
  //           />
  //         </div>

  //         {/* ✅ Fixed Button */}
  //         {/* <button
  //           onClick={handleSaveClick} // ✅ Calls parent function
  //           disabled={
  //             !localRevisedEstimate.estimatedNumber ||
  //             !localRevisedEstimate.estimatedValue
  //           }
  //           className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
  //         >
  //           Save Revised Estimate
  //         </button> */}
  //          <button
  //           onClick={handleSaveRevisedEstimate}
  //           className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
  //         >
  //           {isEditMode ? '💾 Save Directly' : '📤 Send Request'}
  //         </button>
  //       </div>
  //     </div>
  //   );
  // };

  // 🔥 NEW FUNCTIONS - Add these to OrdersManagement2
  const handleDirectSave = (
    localProduct,
    revisedEstimateNo,
    revisedEstimateValue,
  ) => {
    const updatedOrders = orders.map((o) =>
      o.id === tempChangeRequest.orderId
        ? {
            ...o,
            orderEstimate: {
              ...o.orderEstimate,
              estimatedNumber: revisedEstimateNo,
              estimatedValue: revisedEstimateValue,
            },
            products: o.products.map((p) =>
              p.id === tempChangeRequest.productId
                ? { ...p, ...localProduct } // ✅ Apply all changes
                : p,
            ),
          }
        : o,
    );

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));

    setEstimateRevisionModal({ isOpen: false, revision: null });
    sessionStorage.removeItem("isEditMode");

    alert(
      `✅ Order updated directly!\nEstimate: ${revisedEstimateNo}\nValue: ₹${revisedEstimateValue}`,
    );
  };

  const handleSendAsRequest = (
    changeRequest,
    revisedEstimateNo,
    revisedEstimateValue,
  ) => {
    // ✅ YOUR ORIGINAL REQUEST LOGIC (enhanced with estimate)
    const now = new Date().toISOString();

    const updatedOrders = orders.map((o) =>
      o.id === changeRequest.orderId
        ? {
            ...o,
            products: o.products.map((p) =>
              p.id === changeRequest.productId
                ? {
                    ...p,
                    orderStatus: "CR Approval Pending",
                    changeRequests: [
                      ...(p.changeRequests || []),
                      {
                        type: "change",
                        timestamp: now,
                        originalDetails: { ...changeRequest.productDetails },
                        requestedChanges: changeRequest.requestedChanges,
                        revisedEstimate: {
                          estimateNo: revisedEstimateNo,
                          estimateValue: revisedEstimateValue,
                        },
                      },
                    ],
                  }
                : p,
            ),
          }
        : o,
    );

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));

    setEstimateRevisionModal({ isOpen: false, revision: null });
    alert(
      `📤 Request sent!\nEstimate: ${revisedEstimateNo}\nValue: ₹${revisedEstimateValue}`,
    );
  };

  const EstimateRevisionModal = () => {
    if (!estimateRevisionModal.isOpen || !estimateRevisionModal.revision)
      return null;

    const { revision } = estimateRevisionModal;
    const isEditMode = revision?.isEditMode || false;

    // 🔥 FIX 1: Get order from PARENT scope (not local)
    const order = orders.find((o) => o.id === revision.orderId);

    // 🔥 FIX 2: Proper local state initialization
    const [localRevisedEstimate, setLocalRevisedEstimate] = useState({
      estimatedNumber: "",
      estimatedValue: "",
    });

    // 🔥 FIX 3: CORRECT useEffect - populate from original estimate
    useEffect(() => {
      if (revision?.originalEstimate) {
        setLocalRevisedEstimate({
          estimatedNumber: revision.originalEstimate.estimatedNumber || "",
          estimatedValue: revision.originalEstimate.estimatedValue || "",
        });
      }
    }, [revision]);

    // 🔥 FIX 4: NO DOM queries - use controlled inputs
    const handleSaveRevisedEstimate = () => {
      const { estimatedNumber, estimatedValue } = localRevisedEstimate;

      if (
        !estimatedNumber?.trim() ||
        !estimatedValue ||
        parseFloat(estimatedValue) <= 0
      ) {
        alert("Please enter both valid Revised Estimate No & Value");
        return;
      }

      // 🔥 FIX 5: Access tempChangeRequest from parent scope
      if (isEditMode && tempChangeRequest?.localProductChanges) {
        // 🚀 EDIT MODE: DIRECT SAVE
        handleDirectSave(
          tempChangeRequest.localProductChanges,
          estimatedNumber,
          parseFloat(estimatedValue),
        );
      } else if (tempChangeRequest) {
        // 📤 REQUEST MODE
        handleSendAsRequest(
          tempChangeRequest,
          estimatedNumber,
          parseFloat(estimatedValue),
        );
      } else {
        alert("Error: Missing change data");
      }
    };

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50001] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {isEditMode
                ? "💾 Save Revised Estimate"
                : "📤 Send Change Request"}
            </h2>
            <button
              onClick={() =>
                setEstimateRevisionModal({ isOpen: false, revision: null })
              }
              className="text-2xl font-bold cursor-pointer hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Info - Read Only */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <Input
                label="Company Name"
                value={order?.contact.company || ""}
                disabled
              />
              <Input
                label="Contact Name"
                value={order?.contact.contactName || ""}
                disabled
              />
              <Input
                label="Contact Number"
                value={order?.contact.phone || ""}
                disabled
              />
              <Input
                label="Order Number"
                value={order?.orderNumber || ""}
                disabled
              />
              <Input
                label="Original Estimate No"
                value={order?.orderEstimate?.estimatedNumber || ""}
                disabled
              />
              <Input
                label="Original Estimate Value"
                value={(
                  order?.orderEstimate?.estimatedValue || 0
                ).toLocaleString()}
                disabled
              />
            </div>

            {/* 🔥 REVISED FIELDS - Editable */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Revised Estimate
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revised Estimate Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="revisedEstimateNo"
                    type="text"
                    value={localRevisedEstimate.estimatedNumber}
                    onChange={(e) =>
                      setLocalRevisedEstimate({
                        ...localRevisedEstimate,
                        estimatedNumber: e.target.value,
                      })
                    }
                    placeholder="EST-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revised Estimate Value{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="revisedEstimateValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={localRevisedEstimate.estimatedValue}
                    onChange={(e) =>
                      setLocalRevisedEstimate({
                        ...localRevisedEstimate,
                        estimatedValue: e.target.value,
                      })
                    }
                    placeholder="45000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Changes Summary */}
            {revision.requestedChanges && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Changes Requested:
                </h4>
                <pre className="text-xs bg-white p-3 rounded text-gray-800 max-h-32 overflow-y-auto">
                  {JSON.stringify(revision.requestedChanges, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() =>
                setEstimateRevisionModal({ isOpen: false, revision: null })
              }
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRevisedEstimate}
              disabled={
                !localRevisedEstimate.estimatedNumber?.trim() ||
                !localRevisedEstimate.estimatedValue ||
                parseFloat(localRevisedEstimate.estimatedValue) <= 0
              }
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-all disabled:opacity-50"
            >
              {isEditMode ? "💾 Save Directly" : "📤 Send Request"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OrderDeletionModal = () => {
    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50007] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-red-600">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              Delete Order?
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Order: <strong>{deleteOrderModal.order?.orderNumber}</strong>
            </p>
            <p className="text-gray-600">
              This will <strong>permanently delete</strong>{" "}
              {deleteOrderModal.order?.products?.length || 0} products.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() =>
                setDeleteOrderModal({
                  isOpen: false,
                  orderId: null,
                  order: null,
                })
              }
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // ✅ PROCEED TO INVOICE CREATION
                setOrderInvoiceModal({
                  isOpen: true,
                  order: deleteOrderModal.order,
                });
                setDeleteOrderModal({
                  isOpen: false,
                  orderId: null,
                  order: null,
                });
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl font-bold transition-all"
            >
              Continue to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OrderDeleteInvoiceModal = () => {
    // ✅ ADD LOCAL STATE FOR FORM
    const [bulkInvoicePrefix, setBulkInvoicePrefix] = useState("INV-ORD-");
    const [invoiceDate, setInvoiceDate] = useState(
      new Date().toISOString().split("T")[0],
    );

    // ✅ Track custom amounts per product
    const [productAmounts, setProductAmounts] = useState({});

    const updateProductAmount = (productId, amount) => {
      setProductAmounts((prev) => ({
        ...prev,
        [productId]: parseFloat(amount) || 0,
      }));
    };

    const handleConfirmDelete = () => {
      const order = orderInvoiceModal.order;

      // ✅ USE CUSTOM AMOUNTS OR FALLBACK TO BUDGET
      const invoices = order.products.map((product, index) => ({
        id: `INV-ORD-${order.id}-${Date.now()}-${index}`,
        productId: product.id,
        productName: product.productName,
        size: product.size,
        invoiceNo: `${bulkInvoicePrefix}${order.orderNumber}-${String(index + 1).padStart(3, "0")}`,
        invoiceDate: invoiceDate,
        amount: productAmounts[product.id] || product.budget || 0,
        reason: "Order Deleted",
        remarks: `Bulk deletion of Order ${order.orderNumber}`,
        status: "Generated",
      }));

      // ✅ ADD INVOICES TO LAST REMAINING ORDER (or create dummy order for invoices)
      const updatedOrders = orders
        .filter((o) => o.id !== order.id)
        .map((o) => ({
          ...o,
          invoices: [...(o.invoices || []), ...invoices],
        }));

      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));

      setOrderInvoiceModal({ isOpen: false, order: null });
      alert("Order Deleted!!");
    };

    if (!orderInvoiceModal.isOpen || !orderInvoiceModal.order) return null;

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50008] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Bulk Invoice Creation</h2>
                <p className="opacity-90">
                  Order: <strong>{orderInvoiceModal.order?.orderNumber}</strong>{" "}
                  -{orderInvoiceModal.order?.products?.length} products
                </p>
              </div>
              <button
                onClick={() =>
                  setOrderInvoiceModal({ isOpen: false, order: null })
                }
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-2xl w-14 h-14 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* ✅ FIXED BULK INVOICE FIELDS */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Invoice No Prefix
                </label>
                <input
                  type="text"
                  value={bulkInvoicePrefix}
                  onChange={(e) => setBulkInvoicePrefix(e.target.value)}
                  placeholder="INV-ORD-"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* PRODUCTS TABLE */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">
                Products to Invoice
              </h3>
              {orderInvoiceModal.order?.products?.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border rounded-xl p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">
                        {product.productName} {product.size}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {product.imlName} | {product.imlType} | LID:{" "}
                        {product.lidColor} | TUB: {product.tubColor}
                      </p>
                    </div>
                    <div className="text-right">
                      <input
                        type="number"
                        value={
                          productAmounts[product.id] || product.budget || ""
                        }
                        onChange={(e) =>
                          updateProductAmount(product.id, e.target.value)
                        }
                        placeholder="Amount"
                        className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-right font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TOTAL & BUTTONS */}
            <div className="pt-6 border-t-4 border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl">
              <div>
                <p className="text-2xl font-black text-gray-900">
                  Total:{" "}
                  <span className="text-emerald-600">
                    ₹
                    {orderInvoiceModal.order?.products
                      ?.reduce((sum, p) => {
                        return sum + (productAmounts[p.id] || p.budget || 0);
                      }, 0)
                      .toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteOrderModal({
                      isOpen: true,
                      orderId: orderInvoiceModal.order.id,
                      order: orderInvoiceModal.order,
                    });
                    setOrderInvoiceModal({ isOpen: false, order: null });
                  }}
                  className="px-8 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-12 py-4 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-2xl hover:shadow-2xl font-black text-lg transition-all"
                >
                  ✅ Delete Order & Generate Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OrderInvoiceModalView = () => {
    // ✅ GROUP INVOICES BY ORDER
    const groupedInvoices = deletedOrderInvoicesModal.invoices.reduce(
      (acc, invoice) => {
        const orderNum =
          invoice.orderNumber ||
          deletedOrderInvoicesModal.orderNumber ||
          "Unknown Order";
        if (!acc[orderNum]) {
          acc[orderNum] = [];
        }
        acc[orderNum].push(invoice);
        return acc;
      },
      {},
    );

    const ordersList = Object.entries(groupedInvoices)
      .map(([orderNumber, invoices]) => ({
        orderNumber,
        invoices,
        total: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      }))
      .sort(
        (a, b) =>
          new Date(b.invoices[0].invoiceDate) -
          new Date(a.invoices[0].invoiceDate),
      );

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50009] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Deleted Order Invoices</h2>
                <p className="opacity-90 text-lg">
                  {ordersList.length} Orders •{" "}
                  {deletedOrderInvoicesModal.invoices.length} Invoices
                </p>
              </div>
              <button
                onClick={() =>
                  setDeletedOrderInvoicesModal({
                    isOpen: false,
                    orderId: null,
                    orderNumber: null,
                    invoices: [],
                  })
                }
                className="text-white rounded-2xl flex items-center justify-center text-[2vw] cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* ORDERS ACCORDION */}
            <div className="space-y-3">
              {ordersList.map((orderGroup, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* ORDER HEADER */}
                  <div
                    className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:shadow-md transition-all flex justify-between items-center"
                    onClick={() => {
                      /* Add toggle state if needed */
                    }}
                  >
                    <div>
                      <h3 className="text-xl font-black text-gray-900">
                        {orderGroup.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {orderGroup.invoices.length} Invoices
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-700">
                        ₹{orderGroup.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* INVOICES TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="p-4 text-left font-bold">
                            Invoice No
                          </th>
                          <th className="p-4 text-left font-bold">Product</th>
                          <th className="p-4 text-center font-bold">Date</th>
                          <th className="p-4 text-right font-bold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderGroup.invoices.map((invoice, idx) => (
                          <tr
                            key={invoice.id}
                            className="hover:bg-gray-50 border-t"
                          >
                            <td className="p-4 font-semibold text-blue-600">
                              {invoice.invoiceNo}
                            </td>
                            <td className="p-4">
                              <div className="font-medium">
                                {invoice.productName}
                              </div>
                              {invoice.size && (
                                <div className="text-sm text-gray-600">
                                  {invoice.size}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {new Date(invoice.invoiceDate).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                            <td className="p-4 text-right font-bold text-emerald-600">
                              ₹{invoice.amount?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* GRAND TOTAL */}
            {ordersList.length > 0 && (
              <div className="p-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl border-4 border-emerald-200 shadow-2xl">
                <div className="flex justify-between items-center text-center">
                  <span className="text-3xl font-black text-gray-900">
                    GRAND TOTAL
                  </span>
                  <span className="text-4xl font-black text-emerald-700 bg-emerald-100 px-6 py-3 rounded-2xl shadow-lg">
                    ₹
                    {deletedOrderInvoicesModal.invoices
                      .reduce((sum, inv) => sum + (inv.amount || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {ordersList.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl text-gray-400">📄</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  No Deleted Order Invoices
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Invoices from deleted orders will appear here. Generate
                  invoices before deleting orders.
                </p>
              </div>
            )}

            {/* CLOSE BUTTON */}
            <div className="flex justify-end mt-12 pt-8 border-t-4 border-gray-200">
              <button
                onClick={() =>
                  setDeletedOrderInvoicesModal({
                    isOpen: false,
                    orderId: null,
                    orderNumber: null,
                    invoices: [],
                  })
                }
                className="px-16 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-3xl hover:shadow-2xl font-black text-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // production modal
  const ProductionAllocationModal = () => {
    if (
      !productionModal.isOpen ||
      !productionModal.order ||
      !productionModal.product
    )
      return null;

    const { order, product, remainingQty, sendToProductionQty } =
      productionModal;

    // FIXED: Calculate current remaining after previous allocations
    const calculateCurrentRemaining = () => {
      const orderKey = `${order.id}_${product.id}`;
      const existingAllocations = JSON.parse(
        localStorage.getItem(STORAGE_KEY_PRODUCTION_ALLOCATION) || "{}",
      );

      const allocations = existingAllocations[orderKey] || [];
      const totalAlreadyAllocated = allocations.reduce(
        (sum, alloc) => sum + (alloc.allocatedQty || 0),
        0,
      );

      // Current remaining = original remaining - already allocated
      return Math.max(remainingQty - totalAlreadyAllocated, 0);
    };

    const currentRemainingQty = calculateCurrentRemaining();

    const handleSendToProduction = () => {
      const qty = parseInt(sendToProductionQty) || 0;

      if (qty <= 0) {
        alert("Please enter a valid quantity");
        return;
      }

      if (qty > currentRemainingQty) {
        alert(`Cannot send more than ${currentRemainingQty} labels`);
        return;
      }

      // Generate unique ID for this allocation
      const allocationId = `alloc_${Date.now()}`;

      // Load existing allocations
      const existingAllocations = JSON.parse(
        localStorage.getItem(STORAGE_KEY_PRODUCTION_ALLOCATION) || "{}",
      );

      const orderKey = `${order.id}_${product.id}`;

      if (!existingAllocations[orderKey]) {
        existingAllocations[orderKey] = [];
      }

      // Calculate remaining after this allocation
      const remainingAfter = currentRemainingQty - qty;

      // Add new allocation
      const allocation = {
        id: allocationId,
        timestamp: new Date().toISOString(),
        orderId: order.id,
        productId: product.id,
        orderNumber: order.orderNumber,
        company: order.contact.company,
        imlName: product.imlName,
        productName: product.productName,
        size: product.size,
        imlType: product.imlType,
        currentRemaining: currentRemainingQty, // NEW: Store current remaining
        allocatedQty: qty,
        remainingAfter: remainingAfter,
        type: "remaining_allocation",
      };

      existingAllocations[orderKey].push(allocation);

      // Save to localStorage
      localStorage.setItem(
        STORAGE_KEY_PRODUCTION_ALLOCATION,
        JSON.stringify(existingAllocations),
      );

      // Update order's remaining quantity in production records
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            products: o.products.map((p) => {
              if (p.id === product.id) {
                // Store production allocation info
                const prodAllocations = p.productionAllocations || [];
                return {
                  ...p,
                  productionAllocations: [...prodAllocations, allocation],
                  remainingAfterAllocation: remainingAfter,
                };
              }
              return p;
            }),
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));

      // Close modal and refresh
      setProductionModal({
        isOpen: false,
        order: null,
        product: null,
        remainingQty: 0,
        sendToProductionQty: "",
        finalRemainingQty: 0,
      });

      alert(`${qty} labels allocated to production successfully!`);
    };

    const handleClose = () => {
      setProductionModal({
        isOpen: false,
        order: null,
        product: null,
        remainingQty: 0,
        sendToProductionQty: "",
        finalRemainingQty: 0,
      });
    };

    // FIXED: Updated handleQtyChange
    const handleQtyChange = (e) => {
      const inputValue = e.target.value;

      // Allow empty input
      if (inputValue === "") {
        setProductionModal((prev) => ({
          ...prev,
          sendToProductionQty: "",
          finalRemainingQty: currentRemainingQty, // Use currentRemainingQty
        }));
        return;
      }

      // Only allow numbers
      const numericValue = inputValue.replace(/[^0-9]/g, "");

      if (numericValue === "") {
        setProductionModal((prev) => ({
          ...prev,
          sendToProductionQty: "",
          finalRemainingQty: currentRemainingQty,
        }));
        return;
      }

      const value = parseInt(numericValue, 10);

      if (isNaN(value)) {
        setProductionModal((prev) => ({
          ...prev,
          sendToProductionQty: "",
          finalRemainingQty: currentRemainingQty,
        }));
        return;
      }

      // Calculate final remaining
      const finalRemaining = Math.max(currentRemainingQty - value, 0);

      // If value exceeds remaining, cap it at currentRemainingQty
      const displayValue =
        value > currentRemainingQty ? currentRemainingQty : value;
      const displayRemaining = value > currentRemainingQty ? 0 : finalRemaining;

      setProductionModal((prev) => ({
        ...prev,
        sendToProductionQty: displayValue.toString(),
        finalRemainingQty: displayRemaining,
      }));
    };

    // FIXED: Calculate order and produced quantities correctly
    const calculateOrderQuantity = () => {
      let orderQty = 0;
      if (product.imlType === "LID" || product.imlType === "LID & TUB") {
        orderQty += parseInt(product.lidLabelQty) || 0;
      }
      if (product.imlType === "TUB" || product.imlType === "LID & TUB") {
        orderQty += parseInt(product.tubLabelQty) || 0;
      }
      return orderQty;
    };

    const calculateProducedQuantity = () => {
      let producedQty = 0;
      if (product.imlType === "LID" || product.imlType === "LID & TUB") {
        producedQty += parseInt(product.lidProductionQty) || 0;
      }
      if (product.imlType === "TUB" || product.imlType === "LID & TUB") {
        producedQty += parseInt(product.tubProductionQty) || 0;
      }
      return producedQty;
    };

    return (
      <div
        className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50000 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <h2 className="text-[1.25vw] font-semibold">
              Allocate to Production
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-all cursor-pointer"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Order Details */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Company Name
                  </label>
                  <p className="text-base font-semibold">
                    {order.contact.company}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Order Number
                  </label>
                  <p className="text-base font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Product Name
                  </label>
                  <p className="text-base font-semibold">
                    {product.productName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Size
                  </label>
                  <p className="text-base font-semibold">{product.size}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    IML Name
                  </label>
                  <p className="text-base font-semibold">{product.imlName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    IML Type
                  </label>
                  <p className="text-base font-semibold">{product.imlType}</p>
                </div>
              </div>
            </div>

            {/* Quantity Information - UPDATED with 4 columns */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Quantity Information
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Order Quantity
                  </label>
                  <p className="text-xl font-bold text-blue-600">
                    {calculateOrderQuantity().toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Produced Quantity
                  </label>
                  <p className="text-xl font-bold text-orange-600">
                    {calculateProducedQuantity().toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Current Remaining
                  </label>
                  <p className="text-xl font-bold text-purple-600">
                    {currentRemainingQty.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (After previous allocations)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Original Remaining
                  </label>
                  <p className="text-xl font-bold text-red-600">
                    {remainingQty.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Allocation Form */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Allocation Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Send to Production Quantity *
                  </label>
                  <input
                    type="text"
                    value={sendToProductionQty}
                    onChange={handleQtyChange}
                    onKeyDown={(e) => {
                      // Allow only numbers and control keys
                      if (
                        !/[\d\b\t\n]|Arrow|Delete|Backspace|Enter/.test(
                          e.key,
                        ) &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    placeholder="Enter quantity"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Final Remaining After Allocation
                  </label>
                  <input
                    type="text"
                    value={currentRemainingQty.toLocaleString()}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    = Current Remaining ({currentRemainingQty.toLocaleString()})
                    - Allocated
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleSendToProduction}
                    disabled={
                      !sendToProductionQty || parseInt(sendToProductionQty) <= 0
                    }
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Allocate to Production
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                * Maximum: {currentRemainingQty.toLocaleString()} labels
                available
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // production history modal
  const ProductionHistoryModal = () => {
    if (
      !productionHistoryModal.isOpen ||
      !productionHistoryModal.order ||
      !productionHistoryModal.product
    )
      return null;

    const { order, product, history } = productionHistoryModal;

    const handleClose = () => {
      setProductionHistoryModal({
        isOpen: false,
        order: null,
        product: null,
        history: [],
      });
    };

    // Calculate totals
    const totalAllocated = history.reduce(
      (sum, item) => sum + (item.allocatedQty || 0),
      0,
    );
    const currentRemaining =
      product.remainingAfterAllocation || calculateRemainingLabels(product);

    return (
      <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-50000 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[80vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <h2 className="text-[1.25vw] font-semibold">
              Production Allocation History
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Summary Card */}
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Allocation Summary
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">
                    Total Allocated
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalAllocated}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">
                    Current Remaining
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {currentRemaining}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Product</p>
                  <p className="text-lg font-semibold">{product.productName}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Company</p>
                  <p className="text-lg font-semibold">
                    {order.contact.company}
                  </p>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Date & Time
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Allocation ID
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Remaining Before
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Allocated Qty
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Remaining After
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                      >
                        No allocation history found
                      </td>
                    </tr>
                  ) : (
                    history.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          {new Date(item.timestamp).toLocaleString("en-IN")}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-mono text-sm">
                          {item.id}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {item.remainingBefore}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-600">
                          {item.allocatedQty}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {item.remainingAfter}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {item.type === "remaining_allocation"
                              ? "Remaining Allocation"
                              : "Main Order"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {history.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan="3"
                        className="border border-gray-300 px-4 py-3 text-right font-semibold"
                      >
                        Total Allocated:
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-700">
                        {totalAllocated}
                      </td>
                      <td
                        colSpan="2"
                        className="border border-gray-300 px-4 py-3"
                      ></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔥 SIMPLE DELETE CONFIRM MODAL
  const ProductDeleteConfirmModal = () => {
    if (!productDeleteConfirm.isOpen) return null;
    
    const { orderId, productId, productName } = productDeleteConfirm;
    const order = orders.find(o => o.id === orderId);
    const product = order?.products?.find(p => p.id === productId);

    const handleSoftDelete = () => {
      // 🔥 STEP 1: Set productDeleted flag (NO removal)
      const updatedOrders = orders.map(o =>
        o.id === orderId
          ? {
              ...o,
              products: o.products.map(p =>
                p.id === productId
                  ? { ...p, productDeleted: true }  // 🔥 SOFT FLAG
                  : p
              )
            }
          : o
      );
      
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      
      // 🔥 STEP 2: Invoice number prompt
      const invoiceNumber = prompt(`Enter Invoice Number for deleted product:\n${productName}`);
      if (invoiceNumber) {
        const finalOrders = updatedOrders.map(o =>
          o.id === orderId
            ? {
                ...o,
                invoices: [
                  ...o.invoices,
                  {
                    id: `INV-DEL-${Date.now()}`,
                    productId,
                    productName,
                    invoiceNo: invoiceNumber,
                    amount: product.budget || 0,
                    reason: "Product Soft Deleted",
                    status: "Generated",
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            : o
        );
        setOrders(finalOrders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrders));
      }
      
      // 🔥 CLOSE MODAL
      setProductDeleteConfirm({ isOpen: false, orderId: null, productId: null, productName: "" });
      window.dispatchEvent(new Event('ordersUpdated'));
    };

    return (
      <div className="fixed inset-0 bg-black/60 z-[50005] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-red-600">🗑️</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              Soft Delete Product?
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              <strong>{productName}</strong> will be <span className="text-red-600 font-bold">hidden</span> from dashboard
            </p>
            <p className="text-sm text-gray-500">Invoice will be generated for admin review</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setProductDeleteConfirm({ isOpen: false, orderId: null, productId: null, productName: "" })}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSoftDelete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl font-bold transition-all"
            >
              Confirm Soft Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

const AllInvoicesModal = () => {
  if (!allInvoicesModal.isOpen) return null;
  
  const { invoices = [], deletedInvoices = [] } = allInvoicesModal;
  
  // FIXED grouping (same as before)
  const groupedInvoices = invoices.reduce((acc, invoice, index) => {
    let orderId = invoice.orderId || invoice.order?.id;
    if (!orderId && invoice.invoiceNo) {
      const match = invoice.invoiceNo.match(/ORD-[^-]+/);
      orderId = match ? match[0] : null;
    }
    if (!orderId && invoice.orderNumber) {
      orderId = invoice.orderNumber;
    }
    if (!orderId) {
      orderId = invoice.invoiceNo || `invoice-${index}`;
    }
    
    const orderNumber = invoice.orderNumber || invoice.invoiceNo || `Order ${orderId.slice(-8)}`;
    const company = invoice.company || invoice.order?.contact?.company || 
                   (invoice.invoiceNo ? invoice.invoiceNo.split('-')[0] : 'Unknown Company');
    
    if (!acc[orderId]) {
      acc[orderId] = {
        orderId,
        orderNumber,
        company,
        totalAmount: 0,
        invoices: []
      };
    }
    
    acc[orderId].invoices.push(invoice);
    acc[orderId].totalAmount += parseFloat(invoice.amount || invoice.total || 0);
    
    return acc;
  }, {});

  // Delete state & handlers (unchanged)
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    invoiceId: null,
    orderId: null,
    orderNumber: '',
    invoiceDetails: null
  });

  const handleDeleteConfirm = (invoiceId, orderId, orderNumber, invoiceDetails) => {
    setDeleteConfirm({ isOpen: true, invoiceId, orderId, orderNumber, invoiceDetails });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm.invoiceId || !deleteConfirm.orderId) return;
    
    const updatedOrders = orders.map(order => 
      order.id === deleteConfirm.orderId
        ? {
            ...order,
            products: order.products.map(product => ({
              ...product,
              invoices: product.invoices?.filter(inv => inv.id !== deleteConfirm.invoiceId) || []
            }))
          }
        : order
    );
    
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("ordersUpdated"));
    
    setDeleteConfirm({ isOpen: false, invoiceId: null, orderId: null, orderNumber: '', invoiceDetails: null });
    alert("Invoice deleted successfully!");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[50010] flex items-center justify-center p-[1.5vw]">
        <div className="bg-white rounded-[1.8vw] max-w-[92vw] w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
          
          {/* TABS */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-[1.8vw] rounded-t-[1.8vw]">
            <div className="flex gap-[1.2vw]">
              <button onClick={() => setAllInvoicesTab('active')} className={`px-[2.5vw] py-[1vw] font-bold rounded-[1.2vw] transition-all text-[0.95vw] flex items-center gap-[0.5vw] ${
                allInvoicesTab === 'active' ? 'bg-white text-indigo-700 shadow-[0_0.4vw_1vw_rgba(0,0,0,0.3)]' : 'hover:bg-white/30 hover:scale-[1.02]'
              }`}>
                📋 Active ({Object.keys(groupedInvoices).length})
              </button>
              <button onClick={() => setAllInvoicesTab('deleted')} className={`px-[2.5vw] py-[1vw] font-bold rounded-[1.2vw] transition-all text-[0.95vw] flex items-center gap-[0.5vw] ${
                allInvoicesTab === 'deleted' ? 'bg-white text-red-600 shadow-[0_0.4vw_1vw_rgba(0,0,0,0.3)]' : 'hover:bg-white/30 hover:scale-[1.02]'
              }`}>
                🗑️ Deleted ({deletedInvoices.length})
              </button>
            </div>
          </div>
          
          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-[2vw] space-y-[1.5vw]">
            {allInvoicesTab === 'active' ? (
              Object.keys(groupedInvoices).length > 0 ? (
                Object.values(groupedInvoices).map((group) => {
                  const firstInvoice = group.invoices[0];
                  
                  return (
                    <div key={group.orderId} className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-[1.2vw] p-[1.8vw] border border-blue-100 shadow-lg hover:shadow-xl transition-all">
                      
                      {/* 🔥 ORDER + PRODUCT HEADER */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.2vw] mb-[1.5vw] pb-[1.2vw] border-b border-blue-200">
                        
                        {/* 🏢 Order Info */}
                        <div className="flex items-center gap-[0.8vw]">
                          <div className="w-[2.2vw] h-[2.2vw] bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md border-[0.2vw] border-white">
                            <svg className="w-[1.2vw] h-[1.2vw] text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-[1.1vw] font-black text-gray-900 leading-tight">
                              <span className="text-[0.9vw] font-normal text-gray-600 mr-[0.4vw]">#</span>
                              {group.orderNumber}
                            </h3>
                            <p className="text-[0.85vw] text-gray-700 font-semibold bg-blue-100 px-[0.7vw] py-[0.2vw] rounded-full inline-block mt-[0.1vw]">
                              {group.company}
                            </p>
                          </div>
                        </div>
                        
                        {/* 📦 Product Details */}
                        <div className="lg:col-span-2">
                          <div className="flex flex-wrap items-center gap-[0.8vw] bg-gradient-to-r from-emerald-50 to-green-50 rounded-[0.8vw] p-[1vw] border border-emerald-200">
                            <div className="w-[1.8vw] h-[1.8vw] bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                              <svg className="w-[1vw] h-[1vw] text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 000 2v8a2 2 0 002 2h10a2 2 0 002-2V6a1 1 0 100-2H3z"/>
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[0.85vw] font-bold text-emerald-800 truncate">
                                {firstInvoice.productName || firstInvoice.product?.productName || 'Product Details'}
                              </p>
                              <p className="text-[0.75vw] text-emerald-700 flex flex-wrap gap-[0.3vw] items-center">
                                <span className="inline-flex items-center gap-[0.2vw] bg-white px-[0.5vw] py-[0.1vw] rounded text-[0.65vw]">
                                  📏 {firstInvoice.size || firstInvoice.product?.size || 'N/A'}
                                </span>
                                <span className="inline-flex items-center gap-[0.2vw] bg-white px-[0.5vw] py-[0.1vw] rounded text-[0.65vw]">
                                  🏷️ {firstInvoice.imlName || firstInvoice.product?.imlName || 'N/A'}
                                </span>
                                <span className="inline-flex items-center gap-[0.2vw] bg-white px-[0.5vw] py-[0.1vw] rounded text-[0.65vw]">
                                  {firstInvoice.imlType || firstInvoice.product?.imlType || 'N/A'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 💰 TOTALS */}
                      <div className="flex justify-between items-center mb-[1.5vw] pt-[1vw] border-t border-blue-200">
                        <span className="text-[0.8vw] text-gray-500">Total • {group.invoices.length} invoice{group.invoices.length > 1 ? 's' : ''}</span>
                        <div className="text-[1.4vw] font-black text-emerald-600 bg-gradient-to-r from-emerald-100 to-emerald-200 px-[1vw] py-[0.3vw] rounded-[0.7vw]">
                          ₹{Math.round(group.totalAmount).toLocaleString()}
                        </div>
                      </div>
                      
                      {/* 📋 INVOICE CARDS */}
                      <div className="grid grid-cols-1 gap-[1vw]">
                        {group.invoices.map((invoice) => (
                          <div key={invoice.id} className="group bg-white/90 backdrop-blur-sm rounded-[0.9vw] p-[1.3vw] shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-[0.1vw] transition-all duration-200 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">
                            <div className="flex items-start justify-between">
                              
                              {/* Invoice Info */}
                              <div className="flex-1 min-w-0 pr-[1vw]">
                                <div className="flex items-start gap-[0.6vw] mb-[0.5vw]">
                                  <div className="w-[1.6vw] h-[1.6vw] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm mt-[0.1vw] flex-shrink-0">
                                    <svg className="w-[0.9vw] h-[0.9vw] text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-[0.9vw] text-gray-900 truncate leading-tight">
                                      {invoice.invoiceNo || `INV-${invoice.id?.slice(-6) || 'XXXXXX'}`}
                                    </h4>
                                    <p className="text-[0.75vw] text-gray-500 flex items-center gap-[0.3vw]">
                                      📅 {new Date(invoice.invoiceDate || invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-[0.4vw] mb-[0.6vw]">
                                  <div className="text-[0.95vw] font-bold text-emerald-600 flex items-baseline gap-[0.2vw]">
                                    <span>₹</span>
                                    <span>{parseFloat(invoice.amount || invoice.total || 0).toLocaleString()}</span>
                                  </div>
                                  
                                  <p className="text-[0.7vw] text-gray-600 line-clamp-2 leading-relaxed">
                                    {invoice.reason || invoice.remarks || invoice.description || 'No description'}
                                  </p>
                                </div>
                                
                                <div className={`inline-flex px-[0.6vw] py-[0.25vw] rounded-full text-[0.65vw] font-semibold shadow-sm border ${
                                  invoice.status === 'Generated' 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                    : invoice.status?.includes('Pending') || invoice.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                  {invoice.status || 'Active'}
                                </div>
                              </div>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteConfirm(invoice.id, group.orderId, group.orderNumber, invoice)}
                                className="text-red-400 hover:text-red-600 hover:scale-110 text-[1.1vw] font-bold p-[0.4vw] rounded-full hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm ml-[0.5vw] flex-shrink-0"
                                title="Delete Invoice"
                              >
                                <svg className="w-[1vw] h-[1vw]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a1 1 0 011-1h12a1 1 0 110 2H5a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm10 1a1 1 0 100-2H7a1 1 0 100 2h6z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-[5vw]">
                  <div className="w-[7vw] h-[7vw] mx-auto mb-[2vw] flex items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
                    <svg className="w-[3.5vw] h-[3.5vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[1.3vw] font-bold text-gray-900 mb-[0.5vw]">No Active Invoices</h3>
                  <p className="text-[0.9vw] text-gray-500">All invoices processed or deleted.</p>
                </div>
              )
            ) : (
              // Deleted tab (simplified)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.2vw]">
                {deletedInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-gradient-to-br from-rose-50/80 to-red-50/80 backdrop-blur-sm border border-red-200 rounded-[1vw] p-[1.5vw]">
                    <h4 className="font-bold text-[1vw] text-red-800 mb-[0.5vw]">{invoice.invoiceNo}</h4>
                    <p className="text-[1.1vw] font-bold text-red-700">₹{parseFloat(invoice.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-[1.8vw] border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <button 
              onClick={() => setAllInvoicesModal({ isOpen: false, invoices: [], deletedInvoices: [] })}
              className="px-[4vw] py-[1.2vw] bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-[1.5vw] font-bold text-[1vw] shadow-lg hover:shadow-xl transition-all duration-200 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 DELETE CONFIRM MODAL - COMPACT */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/75 z-[50020] flex items-center justify-center p-[2vw]">
          <div className="bg-gradient-to-br from-rose-50 via-red-50 to-red-100 border-[0.25vw] border-red-300 rounded-[2vw] w-[45vw] max-w-[45vw] p-[2.5vw] shadow-2xl">
            <div className="flex items-center justify-between mb-[1.8vw]">
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[2vw] h-[2vw] bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-[1.1vw] h-[1.1vw] text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-[1.4vw] font-black text-red-800">Confirm Delete</h2>
              </div>
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, invoiceId: null, orderId: null, orderNumber: '', invoiceDetails: null })}
                className="text-[2vw] font-bold text-gray-500 hover:text-gray-900 hover:rotate-90 transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-[1.2vw] mb-[2vw]">
              <div className="bg-red-50 border-[0.15vw] border-red-200 rounded-[1.2vw] p-[1.8vw]">
                <p className="text-[0.95vw] text-red-700 font-semibold mb-[1vw]">
                  This action will permanently delete the invoice:
                </p>
                <div className="space-y-[0.6vw] text-[0.9vw] text-red-600">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="font-black">📄</span>
                    <span>{deleteConfirm.invoiceDetails?.invoiceNo || 'Invoice'}</span>
                  </div>
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="font-black">📦</span>
                    <span>{deleteConfirm.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="font-black">💰</span>
                    <span>₹{parseFloat(deleteConfirm.invoiceDetails?.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-[0.6vw] p-[1vw] bg-amber-50 border border-amber-200 rounded-[0.8vw]">
                <svg className="w-[1.1vw] h-[1.1vw] text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-[0.85vw] font-medium text-amber-800">
                  This action cannot be undone!
                </p>
              </div>
            </div>
            
            <div className="flex gap-[1.2vw] justify-end pt-[1vw] border-t border-red-200">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, invoiceId: null, orderId: null, orderNumber: '', invoiceDetails: null })}
                className="flex-1 px-[2.5vw] py-[1vw] bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-[1vw] font-bold text-[0.95vw] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-[0.5vw]"
              >
                <svg className="w-[1.1vw] h-[1.1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-[2.5vw] py-[1vw] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-[1vw] font-bold text-[0.95vw] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-[0.5vw]"
              >
                <svg className="w-[1.1vw] h-[1.1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};




  // Check if order has remaining labels
  const hasRemainingLabels = (order) => {
    if (!order.products || order.products.length === 0) {
      return false;
    }

    const hasRemaining = order.products.some((product) => {
      const remaining = calculateRemainingLabels(product);
      return remaining > 0;
    });

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
          : order,
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
              product.imlName?.toLowerCase().includes(searchLower),
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
            (product) => product.productName === selectedProduct,
          );
        }

        // 4. SIZE FILTER - Check if any product matches selected size
        let matchesSize = true;
        if (selectedSize && selectedProduct) {
          matchesSize = order.products?.some(
            (product) =>
              product.productName === selectedProduct &&
              product.size === selectedSize,
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

  const isOrderDesignApproved = (order) => {
    if (!order?.products || order.products.length === 0) return false;

    return order.products.every(
      (product) => product.designStatus === "approved",
    );
  };

  const isOrderMovedToPurchase = (order) => {
    if (!order?.products || order.products.length === 0) return false;

    return order.products.every((product) => product.moveToPurchase === true);
  };

  const getArtworkStatusForOrder = (order) => {
    if (!order.products || order.products.length === 0) return "pending";

    // you can change the rule here if needed (e.g., prioritize in-progress over pending)
    const statuses = order.products.map((p) =>
      (p.designStatus || "pending").toLowerCase(),
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
        return parseFloat(order.orderEstimate.estimatedValue);
      }

      // From dummy data: payment[0].totalEstimated (DUMMY ORDERS)
      if (
        order.payment &&
        Array.isArray(order.payment) &&
        order.payment[0]?.totalEstimated
      ) {
        return parseFloat(order.payment[0].totalEstimated);
      }

      // From payment object: payment.totalEstimated (IF STORED AS OBJECT)
      if (
        order.payment &&
        !Array.isArray(order.payment) &&
        order.payment.totalEstimated
      ) {
        return parseFloat(order.payment.totalEstimated);
      }

      // Fallback to 0

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
          : "PO recorded successfully!",
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
        (_, i) => i !== index,
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
                                0,
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
                              },
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
        : o,
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
            <>
              <div className="flex gap-[1vw]">
                <button 
  onClick={() => {
    // 🔥 Collect ALL invoices + filter deleted ones
    const allInvoices = [];
    orders.forEach(order => {
      order.invoices?.forEach(inv => allInvoices.push({ ...inv, orderNumber: order.orderNumber }));
    });
    const deletedInvoices = allInvoices.filter(inv => 
      inv.reason?.includes('Deleted') || 
      inv.productDetails?.productConfirmDelete
    );
    
    setAllInvoicesModal({ isOpen: true, invoices: allInvoices, deletedInvoices });
  }}
  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
>
  📋 All Invoices (Active + Deleted)
</button>

                <button
                  onClick={handleNewOrder}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-[.85vw] py-[0.45vw] rounded-[0.6vw] font-medium shadow-md hover:shadow-lg transition-all text-[0.9vw] cursor-pointer"
                >
                  + New Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters - UPDATED with proper width for size dropdown */}

      <div className="bg-white rounded-xl shadow-sm p-[1vw] mb-[1vw] border border-gray-200">
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-4">
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

          <h3 className="text-[2vw] font-semibold text-gray-900 mb-2">
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
                                    <div className="flex gap-6 mt-2 text-[.9vw] text-gray-600">
                                      <span>
                                        <strong>Esimated No.:</strong>{" "}
                                        {order.orderEstimate?.estimatedNumber}
                                      </span>
                                      <span>
                                        <strong>Esimated Value:</strong>{" "}
                                        {order.orderEstimate?.estimatedValue}
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
                                        className="px-[.9vw] py-[.35vw] cursor-pointer bg-gray-600 text-white rounded hover:bg-gray-700 text-[.8vw] font-medium transition-all cursor-pointer flex items-center justify-center"
                                        title="Add Payment"
                                      >
                                        💳 Payment
                                      </button>

                                      {order.invoices &&
                                        order.invoices.length > 0 && (
                                          <button
                                            onClick={() =>
                                              setInvoiceModal({
                                                isOpen: true,
                                                orderId: order.id,
                                              })
                                            } // ✅ USE THIS
                                            className="text-white bg-amber-500 rounded font-medium text-[.8vw] flex items-center gap-1 py-[.35vw] px-[.9vw] cursor-pointer"
                                          >
                                            📄 View Generated Invoice
                                          </button>
                                        )}

                                      {!hasMovedToPurchase(order) && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleEditOrder(order)
                                            }
                                            className="px-[1vw] py-[.35vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[.8vw] font-medium transition-all"
                                          >
                                            Edit
                                          </button>
                                        </>
                                      )}
                                      {/* {!hasMovedToPurchase(order) && ( */}
                                      {/* <button
                                        onClick={() =>
                                          handleDeleteOrder(order.id)
                                        }
                                        className="px-[1vw] py-[.35vw] cursor-pointer bg-red-600 text-white rounded hover:bg-red-700 text-[.8vw] font-medium transition-all"
                                      >
                                        Delete
                                      </button> */}
                                     <button 
  onClick={() => {
    if (window.confirm("Do you want to send a delete request to the admin for this product?")) {
      // 🔥 CURRENT 'order' object is ALWAYS available here
      const firstActiveProduct = order?.products?.find(p => !p?.productDeleted);
      
      if (!firstActiveProduct) {
        alert("❌ No active products to delete!");
        return;
      }
      
      // 🔥 STEP 1: Update THIS order only
      const updatedOrder = {
        ...order,
        products: order.products.map(p =>
          p.id === firstActiveProduct.id
            ? { ...p, productDeleted: true, deleteRequestSent: true }
            : p
        )
      };
      
      // 🔥 STEP 2: Replace order in parent orders (let React handle state)
      const tempOrders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const finalOrders = tempOrders.map(o => o.id === order.id ? updatedOrder : o);
      
      // 🔥 STEP 3: Invoice
      

        const finalOrderWithInvoice = {
          ...updatedOrder,
          invoices: [
            ...(updatedOrder.invoices || []),
            {
              id: `DEL-REQ-${Date.now()}`,
              productId: firstActiveProduct.id,
              productName: `${firstActiveProduct.productName} (${firstActiveProduct.size})`,
              orderNumber: order.orderNumber,
              invoiceNo: "",
              amount: firstActiveProduct.budget || 0,
              reason: "Delete Request Sent ✅",
              status: "Pending Admin Review",
              createdAt: new Date().toISOString()
            }
          ]
        };
        
        const finalOrdersWithInvoice = tempOrders.map(o => 
          o.id === order.id ? finalOrderWithInvoice : o
        );
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrdersWithInvoice));
      
      
      // 🔥 REFRESH
      window.dispatchEvent(new Event('ordersUpdated'));
      alert("✅ Delete request sent! Product hidden + invoice created.");
    }
  }}
  className="px-[.75vw] py-[.5vw] bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all text-[1vw]"
>
  Send Delete Request
</button>


                                      {/* )} */}
                                      {isOrderDesignApproved(order) &&
                                        !isOrderMovedToPurchase(order) && (
                                          <button
                                            onClick={() =>
                                              handleMoveToPurchase(order)
                                            }
                                            className="px-[1vw] py-[.35vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-[.85vw] font-medium transition-all"
                                          >
                                            Move All to Purchase
                                          </button>
                                        )}
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
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Allocated to Production
                                                </th>
                                                <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-left text-[.85vw] font-semibold">
                                                  Current Remaining
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

                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                              Order Status
                                            </th>

                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                              Action
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {order.products.map(
                                            (product, idx) => {
                                              // Calculate values for this product
                                              const remaining =
                                                calculateRemainingLabels(
                                                  product,
                                                );

                                              // Calculate total ordered and produced
                                              const totalOrdered =
                                                product.imlType === "LID" ||
                                                product.imlType === "LID & TUB"
                                                  ? parseInt(
                                                      product.lidLabelQty,
                                                    ) || 0
                                                  : product.imlType === "TUB"
                                                    ? parseInt(
                                                        product.tubLabelQty,
                                                      ) || 0
                                                    : 0;

                                              const totalProduced =
                                                product.imlType === "LID" ||
                                                product.imlType === "LID & TUB"
                                                  ? parseInt(
                                                      product.lidProductionQty,
                                                    ) || 0
                                                  : product.imlType === "TUB"
                                                    ? parseInt(
                                                        product.tubProductionQty,
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
                                                  <td className="border border-gray-300 px-[1vw] py-[.75vw] text-[.85vw]">
                                                    <span className="inline-block px-[.5vw] py-[0.25vw] bg-blue-100 text-blue-700 rounded font-semibold whitespace-pre">
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
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-bold text-green-600">
                                                        {(() => {
                                                          const orderKey = `${order.id}_${product.id}`;
                                                          const existingAllocations =
                                                            JSON.parse(
                                                              localStorage.getItem(
                                                                STORAGE_KEY_PRODUCTION_ALLOCATION,
                                                              ) || "{}",
                                                            );
                                                          const allocations =
                                                            existingAllocations[
                                                              orderKey
                                                            ] || [];
                                                          const totalAllocated =
                                                            allocations.reduce(
                                                              (sum, alloc) =>
                                                                sum +
                                                                (alloc.allocatedQty ||
                                                                  0),
                                                              0,
                                                            );
                                                          return totalAllocated >
                                                            0
                                                            ? totalAllocated.toLocaleString()
                                                            : "-";
                                                        })()}
                                                      </td>
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.85vw] font-bold text-red-600">
                                                        {(() => {
                                                          const remaining =
                                                            calculateRemainingLabels(
                                                              product,
                                                            );
                                                          const orderKey = `${order.id}_${product.id}`;
                                                          const existingAllocations =
                                                            JSON.parse(
                                                              localStorage.getItem(
                                                                STORAGE_KEY_PRODUCTION_ALLOCATION,
                                                              ) || "{}",
                                                            );
                                                          const allocations =
                                                            existingAllocations[
                                                              orderKey
                                                            ] || [];
                                                          const totalAllocated =
                                                            allocations.reduce(
                                                              (sum, alloc) =>
                                                                sum +
                                                                (alloc.allocatedQty ||
                                                                  0),
                                                              0,
                                                            );
                                                          return remaining -
                                                            totalAllocated >
                                                            0
                                                            ? (
                                                                remaining -
                                                                totalAllocated
                                                              ).toLocaleString()
                                                            : "0";
                                                        })()}
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
                                                    {/* {(() => {
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
                                                    })()} */}
                                                    <span
                                                      className={`inline-block px-[.8vw] py-[.25vw] text-[.8vw] rounded font-semibold whitespace-pre ${
                                                        product.orderStatus ===
                                                        "Artwork Approved"
                                                          ? "bg-green-100 text-green-700"
                                                          : "bg-gray-100 text-gray-700"
                                                      }`}
                                                    >
                                                      {product.orderStatus ||
                                                        "Artwork Pending"}
                                                    </span>
                                                  </td>
                                                  {viewMode === "remaining" ? (
                                                    <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center">
                                                      <div className="flex gap-2 items-center">
                                                        <button
                                                          onClick={() =>
                                                            handleMoveToProduction(
                                                              order,
                                                              product,
                                                            )
                                                          }
                                                          className="px-[1vw] py-[0.4vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-[.75vw] font-medium transition-all w-full"
                                                        >
                                                          Move to Production
                                                        </button>
                                                        <button
                                                          onClick={() =>
                                                            handleViewHistory(
                                                              order,
                                                              product,
                                                            )
                                                          }
                                                          className="px-[1vw] py-[0.4vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[.75vw] font-medium transition-all w-full"
                                                        >
                                                          View History
                                                        </button>
                                                      </div>
                                                    </td>
                                                  ) : (
                                                    <>
                                                      <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center">
                                                        <div className="flex gap-2 items-center">
                                                          {product.orderStatus !==
                                                            "Artwork Pending" &&
                                                            product.orderStatus !==
                                                              "Artwork Approved" &&
                                                            product.orderStatus !==
                                                              "In Production" &&
                                                            product.orderStatus && (
                                                              <>
                                                                <button
                                                                  onClick={() =>
                                                                    handleChangeRequest(
                                                                      order,
                                                                      product,
                                                                    )
                                                                  }
                                                                  className="px-[.75vw] py-[0.4vw] cursor-pointer bg-orange-600 text-white rounded hover:bg-orange-700 text-[.75vw] font-medium transition-all w-full whitespace-pre"
                                                                >
                                                                  Change request
                                                                </button>
                                                              </>
                                                            )}
                                                          {product.orderStatus ===
                                                            "Artwork Pending" ||
                                                            (product.orderStatus ===
                                                              "Artwork Approved" && (
                                                              <>
                                                                <button
                                                                  onClick={() =>
                                                                    handleEditRequest(
                                                                      order,
                                                                      product,
                                                                    )
                                                                  }
                                                                  className="px-[1vw] py-[0.4vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[.75vw] font-medium transition-all whitespace-pre"
                                                                >
                                                                  Edit
                                                                </button>
                                                              </>
                                                            ))}
                                                          {product.changeRequests &&
                                                            product
                                                              .changeRequests
                                                              .length > 0 && (
                                                              <button
                                                                onClick={() =>
                                                                  setViewRequestModal(
                                                                    {
                                                                      isOpen: true,
                                                                      order,
                                                                      product,
                                                                    },
                                                                  )
                                                                }
                                                                className="px-[.75vw] py-[0.4vw] cursor-pointer bg-purple-600 text-white rounded hover:bg-purple-700 text-[.75vw] font-medium transition-all w-full whitespace-pre"
                                                              >
                                                                View Request
                                                              </button>
                                                            )}
                                                          {product.designStatus ===
                                                            "approved" &&
                                                          !product.moveToPurchase ? (
                                                            <button
                                                              onClick={() =>
                                                                handleMoveProductToPurchase(
                                                                  order.id,
                                                                  product.id,
                                                                )
                                                              }
                                                              className="px-[.2vw] py-[0.4vw] cursor-pointer bg-green-600 text-white rounded hover:bg-green-700 text-[.75vw] font-medium transition-all w-full"
                                                            >
                                                              Move to Purchase
                                                            </button>
                                                          ) : (
                                                            <p className="w-full text-center">
                                                              {" "}
                                                            </p>
                                                          )}
                                                        </div>
                                                      </td>
                                                    </>
                                                  )}
                                                </tr>
                                              );
                                            },
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
                ),
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

      {/* Search Results  */}

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

      <ProductionAllocationModal />
      <ProductionHistoryModal />
      <ProductDeleteConfirmModal />
      <AllInvoicesModal />


      {changeRequestModal.isOpen && <ChangeRequestModal />}
      {viewRequestModal.isOpen && <ViewRequestModal />}
      {estimateRevisionModal.isOpen && <EstimateRevisionModal />}
      {invoiceModal.isOpen && <ViewInvoice />}
      {invoiceCreateModal.isOpen && <InvoiceModal />}
      {deleteOrderModal.isOpen && <OrderDeletionModal />}
      {orderInvoiceModal.isOpen && <OrderDeleteInvoiceModal />}
      {deletedOrderInvoicesModal.isOpen && <OrderInvoiceModalView />}
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
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full text-[.9vw] px-[0.75vw] py-[0.45vw] pr-[2.5vw] border border-gray-300 rounded-[0.5vw] text-[0.85vw] outline-none bg-white box-border appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            disabled ? "bg-white cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={typeof option === "object" ? option.value : option}
              value={typeof option === "object" ? option.value : option}
            >
              {typeof option === "object" ? option.label : option}
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
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        {...(type === "number" ? { min: "0" } : {})}
        className="w-full text-[.8vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function DesignPreview({ file, productId, pdfPreviews, setPreviewModal }) {
  return (
    <div className="p-[1vw] bg-gray-50 rounded-[0.5vw] border-2 border-gray-300 h-full relative">
      <p className="text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        Preview:
      </p>

      {file?.type === "application/pdf" ? (
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
          <span className="text-gray-600 truncate pr-2">{file?.name}</span>
        </div>
        <div className="flex items-center justify-between text-0.7vw mt-1">
          <span className="text-gray-500">
            {(file?.size / 1024).toFixed(2)} KB
          </span>
          <span
            className={`px-2 py-0.5 rounded text-0.65vw font-medium ${
              file?.type === "application/pdf"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {file?.type === "application/pdf" ? "PDF" : "Image"}
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          let fileUrl = null;

          if (file) {
            fileUrl = URL.createObjectURL(file);
          }

          setPreviewModal({
            isOpen: true,
            type: file?.type === "application/pdf" ? "pdf" : "image",
            path: fileUrl,
            name: file?.name,
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
