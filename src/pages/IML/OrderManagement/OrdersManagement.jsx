import { useState, useRef, useEffect } from "react";
import { useCallback } from "react"; // Add this import at top
import { useNavigate } from "react-router-dom";
import NewOrder from "./NewOrder";
import FileUploadBox from "./modals/FileUploadBox";
import * as pdfjsLib from "pdfjs-dist";
import InvoiceTable from './modals/InvoiceTable';
import DeletedRequestsTable from "./modals/DeletedRequestsTable ";
import ConfirmModal from "../../../components/ConfirmModal";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

import design1PDF from "../../../assets/pdf/design1.pdf";
import design2PDF from "../../../assets/pdf/design2.pdf";
import design3PDF from "../../../assets/pdf/design3.pdf";

const OLD_DESIGN_FILES = [
  { id: 1, name: "Design 1", path: design1PDF, type: "pdf" },
  { id: 2, name: "Design 2", path: design2PDF, type: "pdf" },
  { id: 3, name: "Design 3", path: design3PDF, type: "pdf" },
];

// Mock data storage (In production, this would be an API/Database)
const DATA_VERSION = "4.2"; // Increment this when structure changes
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
  const [allInvoicesTab, setAllInvoicesTab] = useState('deleteHistory'); // 'active' | 'deleted'
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
    isOpenPO: false,
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

  // 🔥 NEW: Refund modal for delete order with payment records
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    orderId: null,
    order: null,
    refundRemarks: "",
    refundDocument: null,
    refundDocumentName: "",
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

const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: "",
    onYes: () => {},
    onNo: () => {setConfirmState({isOpen: false})},
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

  const getAllowedIMLType = (category, size) => {
    const value = IML_TYPE_MAP?.[category]?.[size];
    console.log(`value: ${value}`);

    if (!value) return [];

    if (value === "LID & TUB") {
      return ["LID", "TUB", "LID & TUB"];
    }

    return [value];
  };

// const allowedIMLType = getAllowedIMLType(
//   formData.category,
//   formData.size
// );

  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== DATA_VERSION) {
      // Clear old data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);

      // Initialize with fresh dummy data
      initializeDummyData();

      // alert(
      //   `Data structure updated to version ${DATA_VERSION}. Old data has been cleared.`,
      // );
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
            designSharedMail: false,
            orderStatus: "Artwork Pending",
            designStatus: "pending",
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
            designSharedMail: false,
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
            designSharedMail: false,
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
            designSharedMail: false,
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
            orderStatus: "Artwork Pending",
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
            designSharedMail: false,
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
            designSharedMail: false,
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
            designSharedMail: false,
            designStatus: "pending",
            orderStatus: "Artwork Pending",
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
    if (!order) return;

    const hasPaymentRecords = order.paymentRecords && order.paymentRecords.length > 0;
    const hasMovedToPurchase = order.products?.some((p) => p.moveToPurchase === true);

    console.log(`Has payment records: ${hasPaymentRecords}`);
    console.log(`Has moved to purchase records: ${hasMovedToPurchase}`);

    // Case 1: No payment records AND nothing moved to purchase → direct delete
    if (!hasPaymentRecords && !hasMovedToPurchase) {
      setConfirmState({
        isOpen: true,
        message: `Are you sure you want to delete order "${order.orderNumber || order.id}"? This cannot be undone.`,
        onYes: () => {
          const updatedOrders = orders.filter((o) => o.id !== orderId);
          setOrders(updatedOrders);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
          window.dispatchEvent(new Event("ordersUpdated"));
          setConfirmState({ isOpen: false, message: "", onYes: () => {}, onNo: () => {} });
        },
        onNo: () => setConfirmState({ isOpen: false, message: "", onYes: () => {}, onNo: () => {} }),
      });
      return;
    }

    // Case 2: Payment records exist but not moved to purchase → show refund modal
    if (hasPaymentRecords && !hasMovedToPurchase) {
      setRefundModal({
        isOpen: true,
        orderId,
        order,
        refundRemarks: "",
        refundDocument: null,
        refundDocumentName: "",
      });
      return;
    }

    // Case 3: Moved to purchase → use existing delete request modal
    if (window.confirm("Do you want to send a delete request to the admin for this order?")) {
      // Use functional setState to avoid variable shadowing
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(o =>
          o.id === orderId
            ? { ...o, productDeleted: true, deleteRequestedAt: new Date().toISOString() }
            : o
        );

        // Update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        window.dispatchEvent(new Event('ordersUpdated'));

        return updatedOrders;
      });

      alert("✅ Delete request sent! Admin will review this request.");
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

  const updateOrderProductBatch = useCallback((orderId, productId, updates) => {
  const updatedOrders = orders.map((o) =>
    o.id === orderId
      ? {
          ...o,
          products: o.products.map((p) =>
            p.id === productId ? { ...p, ...updates } : p
          ),
        }
      : o
  );
  setOrders(updatedOrders);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  console.log('Product batch updated:', updates);
}, [orders, setOrders, STORAGE_KEY]);



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
    const isEditMode = sessionStorage.getItem("isEditMode") === "true";

    if (isEditMode) {
      // 🔥 CHANGE 1: In edit/re-edit mode, collect revised estimate then delete directly
      const revisedEstimateNo = prompt("Enter Revised Estimated Number:");
      if (!revisedEstimateNo || !revisedEstimateNo.trim()) {
        alert("Revised Estimated Number is required.");
        return;
      }
      const revisedEstimateValueStr = prompt("Enter Revised Estimated Value:");
      const revisedEstimateValue = parseFloat(revisedEstimateValueStr);
      if (isNaN(revisedEstimateValue) || revisedEstimateValue <= 0) {
        alert("Please enter a valid Revised Estimated Value.");
        return;
      }

      // Directly delete the product and update estimate — no change request
      const updatedOrders = orders.map((o) =>
        o.id === changeRequestModal.order.id
          ? {
              ...o,
              orderEstimate: {
                ...o.orderEstimate,
                estimatedNumber: revisedEstimateNo.trim(),
                estimatedValue: revisedEstimateValue,
              },
              products: o.products.filter(
                (p) => p.id !== changeRequestModal.product.id
              ),
              invoices: [
                ...(o.invoices || [])
              ],
            }
          : o
      );

      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));
      sessionStorage.removeItem("isEditMode");
      handleCloseChangeRequest();
      alert(`✅ Product deleted directly!\nEstimate: ${revisedEstimateNo}\nValue: ₹${revisedEstimateValue}`);
      return;
    }

    // 🔥 Original flow for non-edit mode (change request)
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
        forceBlankEstimate: true, // 🔥 CHANGE 2: Force blank on delete
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

    // 🔥 CHANGE 2: Check if order quantity changed → force blank revised estimate
    const qtyChanged =
      localProduct.lidLabelQty !== originalProduct.lidLabelQty ||
      localProduct.tubLabelQty !== originalProduct.tubLabelQty ||
      localProduct.lidProductionQty !== originalProduct.lidProductionQty ||
      localProduct.tubProductionQty !== originalProduct.tubProductionQty;

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
        forceBlankEstimate: qtyChanged, // 🔥 CHANGE 2: Force blank if qty changed
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
                // options={["LID", "TUB", "LID & TUB"]}
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
                    updateLocalField("designType", "existing");
                    updateLocalField("lidDesignFile", null);
                    updateLocalField("tubDesignFile", null);

                    setTimeout(() => {
                      console.info(`Product type: ${localProduct.designType}`);
                    }, 500);
                  }}
                  className={`px-[2vw] py-[0.6vw] rounded-[0.4vw] cursor-pointer text-[0.85vw] font-medium transition-all duration-200 ${localProduct.designType === "existing"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Existing Design
                </button>

                <button
                  onClick={() => {
                    updateLocalField("designType", "new");
                    updateLocalField("lidSelectedOldDesign", null);
                    updateLocalField("tubSelectedOldDesign", null);
                    updateLocalField("lidDesignFile", null);
                    updateLocalField("tubDesignFile", null);
                  }}
                  className={`px-[2vw] py-[0.6vw] rounded-[0.4vw] cursor-pointer text-[0.85vw] font-medium transition-all duration-200 ${localProduct.designType === "new"
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

              {(localProduct.imlType === "LID & TUB" && !localProduct.designSharedMail) && (
                <label className="flex items-center gap-[0.6vw] mb-[1vw] font-medium text-gray-700 cursor-pointer text-[.85vw]">
                  <input
                    type="checkbox"
                    checked={localProduct.singleImlDesign || false}
                    onChange={(e) =>
                      updateLocalField(
                        "singleImlDesign",
                        e.target.checked,
                      )
                    }
                    className="w-[1.1vw] h-[1.1vw]"
                  />
                  <span>Select Single IML Design for LID & TUB</span>
                </label>
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
                                      updateProductWithDesignStatus(
                                        localProduct.id,
                                        "lidSelectedOldDesign",
                                        file.id,
                                      )
                                    }
                                  >
                                    <div
                                      className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${localProduct.lidSelectedOldDesign === file.id
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
                                        name={`lid-design-${localProduct.id}`}
                                        checked={
                                          localProduct.lidSelectedOldDesign ===
                                          file.id
                                        }
                                        onChange={() =>
                                          updateProductWithDesignStatus(
                                            localProduct.id,
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
                                      updateProductWithDesignStatus(
                                        localProduct.id,
                                        "tubSelectedOldDesign",
                                        file.id,
                                      )
                                    }
                                  >
                                    <div
                                      className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${localProduct.tubSelectedOldDesign === file.id
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
                                        name={`tub-design-${localProduct.id}`}
                                        checked={
                                          localProduct.tubSelectedOldDesign ===
                                          file.id
                                        }
                                        onChange={() =>
                                          updateLocalField(
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
                                  updateProductWithDesignStatus(
                                    localProduct.id,
                                    "lidSelectedOldDesign",
                                    file.id,
                                  )
                                }
                              >
                                <div
                                  className={`w-[6vw] h-[6vw] mx-auto bg-gray-100 rounded-[0.6vw] flex items-center justify-center text-[3vw] mb-[0.8vw] border-2 ${localProduct.lidSelectedOldDesign === file.id
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
                                    name={`design-${localProduct.id}`}
                                    checked={
                                      localProduct.lidSelectedOldDesign === file.id
                                    }
                                    onChange={() =>
                                      updateProductWithDesignStatus(
                                        localProduct.id,
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
                                        className={`inline-block px-3 py-1 rounded text-[0.75vw] font-medium ${selectedFile.type === "pdf"
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
                        checked={localProduct.designSharedMail}
                        onChange={(e) => {
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
                            updateLocalField("approvedDate", e.target.value)
                          }
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
                                  <FileUploadBox
                                    file={localProduct.lidDesignFile}
                                    onFileChange={(file) => {
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
                                  />
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
                                    <FileUploadBox
                                      file={localProduct.tubDesignFile}
                                      onFileChange={(file) => {
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
                                    />
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
                                <FileUploadBox
                                  file={localProduct.lidDesignFile}
                                  onFileChange={(file) => {
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
                                />
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
                // Validation Logic
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

                  // 3. Design Validation
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
                      } else {
                        if (!prod.lidDesignFile) {
                          alert("Please upload a design file.");
                          return false;
                        }
                      }
                    }
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
      !viewRequestModal.order
    ) {
      return null;
    }

    const { order, product: modalProduct } = viewRequestModal;
    const isOrderLevel = !modalProduct; // true when opened from order card

    // ✅ SAFER LOOKUP with fallback
    const currentOrder = localOrders.find((o) => o.id === order.id);

    // For order-level: collect all products with change requests
    // For product-level: single product as before
    const productsWithRequests = isOrderLevel
      ? (currentOrder?.products || []).filter(p => p.changeRequests && p.changeRequests.length > 0)
      : [];

    const currentProduct = isOrderLevel
      ? null
      : (currentOrder?.products?.find((p) => p.id === modalProduct.id) || modalProduct);

    // ✅ EARLY GUARD
    if (!isOrderLevel && !currentProduct) {
      return null;
    }

    const changeRequests = isOrderLevel
      ? [] // not used in order-level mode
      : (currentProduct.changeRequests || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );

    // ✅ Remarks modal state
    const [remarksModal, setRemarksModal] = useState({
      isOpen: false,
      requestIndex: -1,
      action: "",
    });
    // Accordion: all products open by default
    const [expandedProducts, setExpandedProducts] = useState(() =>
      Object.fromEntries((productsWithRequests || []).map(p => [p.id, true]))
    );
    const toggleProduct = (prodId) =>
      setExpandedProducts(prev => ({ ...prev, [prodId]: !prev[prodId] }));
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

    // ✅ Compute targetProduct at component level so it's available in JSX render too
    const targetProductId = remarksModal.productId || currentProduct?.id;
    const targetProduct = isOrderLevel
      ? (currentOrder?.products?.find(p => p.id === targetProductId) || currentProduct)
      : currentProduct;

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
      const targetChangeRequests = targetProduct?.changeRequests || [];
      const request = targetChangeRequests[requestIndex];

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
              p.id === targetProduct.id
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
                  (p) => p.id !== targetProduct.id,
                ),
                invoices: [
                  ...(o.invoices || []),
                  {
                    id: `INV-${Date.now()}`,
                    productId: targetProduct.id,
                    productName:
                      targetProduct.productName ||
                      targetProduct.productName,
                    size: targetProduct.size || targetProduct.size,
                    invoiceNo: invoiceNumber,
                    invoiceDate: new Date().toISOString(),
                    amount:
                      currentProduct.budget || currentProduct.budget || 0,
                    imlName: targetProduct.imlName || targetProduct.imlName,
                    imlType: targetProduct.imlType || targetProduct.imlType,
                    lidColor: targetProduct.lidColor || targetProduct.lidColor,
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
                  p.id === targetProduct.id
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
        // ✅ DECLINE - Update request status AND set orderStatus to PO Raised
        updatedOrders = localOrders.map((o) =>
          o.id === order.id
            ? {
              ...o,
              products: o.products.map((p) =>
                p.id === targetProduct.id
                  ? {
                    ...p,
                    orderStatus: "PO Raised & Labels in Process",
                    changeRequests: p.changeRequests.map((req, idx) =>
                      idx === requestIndex
                        ? {
                          ...req,
                          status: "DECLINED",
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
      <div className="fixed inset-0 bg-[#000000b3] z-[50001] flex items-center justify-center p-[1.5vw]">
        <div className="bg-white rounded-[1vw] max-w-[60vw] w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-[1vw] border-b border-gray-300 bg-gray-50">
            <h2 className="text-[1.25vw] font-semibold text-gray-800">
              {isOrderLevel
                ? `Change Requests - Order ${currentOrder?.orderNumber || order.id}`
                : `Change Request History - ${currentProduct.productName} ${currentProduct.size}`}
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

          <div className="p-[1.5vw] space-y-[1vw]">
            {/* ✅ Company Details Header */}
            <div className="bg-blue-50 p-[1vw] rounded-[0.5vw] border border-blue-200 mb-[0.5vw]">
              <div className="grid grid-cols-3 gap-[1vw]">
                <div>
                  <span className="text-[0.7vw] text-gray-500 block font-medium uppercase tracking-wider mb-[0.2vw]">
                    Company
                  </span>
                  <span className="text-[1vw] font-bold text-blue-900 border-l-2 border-blue-300 pl-[0.5vw] block leading-tight">
                    {currentOrder?.contact?.company || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[0.7vw] text-gray-500 block font-medium uppercase tracking-wider mb-[0.2vw]">
                    Contact Person
                  </span>
                  <span className="text-[1vw] font-semibold text-gray-800 border-l-2 border-gray-300 pl-[0.5vw] block leading-tight">
                    {currentOrder?.contact?.contactName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[0.7vw] text-gray-500 block font-medium uppercase tracking-wider mb-[0.2vw]">
                    Phone
                  </span>
                  <span className="text-[1vw] font-semibold text-gray-800 border-l-2 border-gray-300 pl-[0.5vw] block leading-tight">
                    {currentOrder?.contact?.phone || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* ORDER-LEVEL: Show all products with their requests */}
            {isOrderLevel ? (
              productsWithRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-[2vw] text-[1vw]">
                  No change requests found for this order.
                </p>
              ) : (
                <div className="space-y-[1.5vw] max-h-[70vh] overflow-y-auto pt-[1vw] pb-[3.25vw]">
                  {productsWithRequests.map((prod) => {
                    const prodRequests = (prod.changeRequests || []).sort(
                      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
                    );
                    const pendingProdCount = prodRequests.filter(r => !r.status || (r.status !== "ACCEPTED" && r.status !== "DECLINED")).length;
                    return (
                      <div key={prod.id} className="border-2 border-purple-200 rounded-[0.75vw] overflow-hidden">
                        {/* ── Accordion header ── */}
                        <div
                          className="bg-purple-50 px-[1.25vw] py-[0.75vw] border-b border-purple-200 flex items-center justify-between cursor-pointer select-none hover:bg-purple-100 transition-colors"
                          onClick={() => toggleProduct(prod.id)}
                        >
                          <div className="flex items-center gap-[0.6vw]">
                            <svg
                              className={`w-[0.9vw] h-[0.9vw] text-purple-500 flex-shrink-0 transition-transform duration-200 ${expandedProducts[prod.id] ? "rotate-180" : "rotate-0"}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="text-[1vw] font-bold text-purple-900">{prod.productName} — {prod.size}</span>
                            <span className="text-[0.8vw] text-gray-500">{prod.imlType}</span>
                          </div>
                          <div className="flex items-center gap-[0.6vw]">
                            {pendingProdCount > 0 && (
                              <span className="bg-red-500 text-white text-[0.75vw] font-bold px-[0.6vw] py-[0.2vw] rounded-full">
                                {pendingProdCount} Pending
                              </span>
                            )}
                            <span className="text-[0.72vw] text-purple-400">
                              {prodRequests.length} request{prodRequests.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        {/* ── Accordion body ── */}
                        <div className={`overflow-hidden transition-all duration-200 ${expandedProducts[prod.id] ? "max-h-[9999px]" : "max-h-0"}`}>
                        <div className="p-[1vw] space-y-[1vw] bg-white">
                          {prodRequests.map((request, index) => {
                            const realIndex = prod.changeRequests.indexOf(request);
                            const orig = request.originalDetails || {};
                            const changes = request.requestedChanges || {};
                            // Build changed fields list (text-only, skip file objects)
                            const changedFields = Object.entries(changes)
                              .filter(([k, v]) => v !== null && v !== undefined && typeof v !== "object")
                              .map(([k, v]) => {
                                const labels = {
                                  productName: "Product Name",
                                  size: "Size",
                                  imlName: "IML Name",
                                  imlType: "IML Type",
                                  lidColor: "LID Color",
                                  tubColor: "TUB Color",
                                  lidLabelQty: "LID Label Qty",
                                  lidProductionQty: "LID Prod Qty",
                                  tubLabelQty: "TUB Label Qty",
                                  tubProductionQty: "TUB Prod Qty",
                                };
                                return { label: labels[k] || k, value: v };
                              });
                            return (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-[0.5vw] p-[1.25vw] bg-gray-50 hover:shadow-md transition-all"
                            >
                              {/* Header row: badge + timestamp */}
                              <div className="flex justify-between items-start mb-[1vw]">
                                <span className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.85vw] font-bold ${
                                  request.status === "ACCEPTED" ? "bg-green-100 text-green-800"
                                  : request.status === "DECLINED" ? "bg-red-100 text-red-800"
                                  : request.type === "delete" ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                                }`}>
                                  {request.type === "delete" ? "DELETE REQUEST" : "CHANGE REQUEST"}
                                  {request.status && ` — ${request.status}`}
                                </span>
                                <span className="text-[0.8vw] text-gray-400">
                                  {request.timestamp ? new Date(request.timestamp).toLocaleString() : ""}
                                </span>
                              </div>

                              {/* Original Details + Requested Changes - side by side */}
                              {request.type !== "delete" && (
                                <div className="grid grid-cols-2 gap-[1vw] mb-[1vw]">
                                  {/* Original Details */}
                                  <div className="bg-white border border-gray-200 rounded-[0.5vw] p-[1vw]">
                                    <h4 className="text-[0.85vw] font-bold text-gray-700 mb-[0.6vw] border-b pb-[0.3vw]">Original Details</h4>
                                    <div className="space-y-[0.3vw] text-[0.82vw] text-gray-700">
                                      {(orig.imlName || prod.imlName) && <p><strong>IML Name:</strong> {orig.imlName || prod.imlName}</p>}
                                      {(orig.lidColor || prod.lidColor) && <p><strong>LID Color:</strong> {orig.lidColor || prod.lidColor}</p>}
                                      {(orig.tubColor || prod.tubColor) && <p><strong>TUB Color:</strong> {orig.tubColor || prod.tubColor}</p>}
                                      {(orig.imlType || prod.imlType) && <p><strong>IML Type:</strong> {orig.imlType || prod.imlType}</p>}
                                      {(orig.lidLabelQty || prod.lidLabelQty) && <p><strong>LID Label Qty:</strong> {orig.lidLabelQty ?? prod.lidLabelQty}</p>}
                                      {(orig.tubLabelQty || prod.tubLabelQty) && <p><strong>TUB Label Qty:</strong> {orig.tubLabelQty ?? prod.tubLabelQty}</p>}
                                      {(orig.lidProductionQty || prod.lidProductionQty) && <p><strong>LID Prod Qty:</strong> {orig.lidProductionQty ?? prod.lidProductionQty}</p>}
                                      {(orig.tubProductionQty || prod.tubProductionQty) && <p><strong>TUB Prod Qty:</strong> {orig.tubProductionQty ?? prod.tubProductionQty}</p>}
                                    </div>
                                  </div>

                                  {/* Requested Changes */}
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-[0.5vw] p-[1vw]">
                                    <h4 className="text-[0.85vw] font-bold text-indigo-700 mb-[0.6vw] border-b border-indigo-200 pb-[0.3vw]">Requested Changes</h4>
                                    <div className="space-y-[0.3vw] text-[0.82vw]">
                                      {changedFields.map((f, i) => (
                                        <p key={i} className="bg-indigo-100 px-[0.5vw] py-[0.25vw] rounded text-indigo-900 font-medium">
                                          {f.label}: {f.value}
                                        </p>
                                      ))}
                                      {(changes.lidDesignFile || changes.tubDesignFile) && (
                                        <p className="bg-indigo-100 px-[0.5vw] py-[0.25vw] rounded text-indigo-900 font-medium">
                                          📎 Design file(s) attached
                                        </p>
                                      )}
                                      {request.revisedEstimate && (
                                        <div className="mt-[0.5vw] pt-[0.5vw] border-t border-indigo-200 text-[0.82vw] font-medium text-gray-800 space-y-[0.2vw]">
                                          <p>Revised Estimated No: {request.revisedEstimate.estimatedNumber}</p>
                                          <p>Revised Estimated Value: {request.revisedEstimate.estimatedValue}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* DELETE REQUEST details */}
                              {request.type === "delete" && (
                                <div className="bg-red-50 border border-red-200 p-[1vw] rounded-[0.5vw] mb-[0.75vw]">
                                  <h4 className="font-semibold text-red-800 mb-[0.5vw] text-[0.9vw]">Product to Delete:</h4>
                                  <div className="grid grid-cols-2 gap-[0.5vw] text-[0.82vw] text-gray-700">
                                    <p><strong>Product:</strong> {prod.productName} {prod.size}</p>
                                    <p><strong>IML Name:</strong> {prod.imlName}</p>
                                    <p><strong>IML Type:</strong> {prod.imlType}</p>
                                    <p><strong>LID Color:</strong> {prod.lidColor}</p>
                                    <p><strong>TUB Color:</strong> {prod.tubColor}</p>
                                    {request.revisedEstimate && (
                                      <>
                                        <p><strong>Revised Est. No:</strong> {request.revisedEstimate.estimatedNumber}</p>
                                        <p><strong>Revised Est. Value:</strong> {request.revisedEstimate.estimatedValue}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Remarks (if processed) */}
                              {request.remarks && (
                                <div className="text-[0.82vw] text-gray-600 bg-yellow-50 px-[0.75vw] py-[0.4vw] rounded border border-yellow-200 mb-[0.5vw]">
                                  <strong>Remarks:</strong> {request.remarks}
                                </div>
                              )}

                              {/* Accept / Decline buttons */}
                              {(!request.status || (request.status !== "ACCEPTED" && request.status !== "DECLINED")) && (
                                <div className="flex gap-[0.75vw] mt-[0.75vw] pt-[0.75vw] border-t border-gray-200">
                                  <button
                                    onClick={() => {
                                      setRemarksModal({ isOpen: true, requestIndex: realIndex, action: "accept", productId: prod.id });
                                      setRemarks("");
                                    }}
                                    className="flex-1 px-[1vw] py-[0.5vw] bg-green-600 text-white rounded-[0.4vw] text-[0.82vw] font-bold hover:bg-green-700 cursor-pointer transition-all shadow-sm"
                                  >
                                    ✅ Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRemarksModal({ isOpen: true, requestIndex: realIndex, action: "decline", productId: prod.id });
                                      setRemarks("");
                                    }}
                                    className="flex-1 px-[1vw] py-[0.5vw] bg-red-600 text-white rounded-[0.4vw] text-[0.82vw] font-bold hover:bg-red-700 cursor-pointer transition-all shadow-sm"
                                  >
                                    ❌ Decline
                                  </button>
                                </div>
                              )}

                              {/* Status badge (if processed) */}
                              {request.status && (
                                <div className={`mt-[0.75vw] px-[1vw] py-[0.5vw] rounded-[0.4vw] text-[0.82vw] border ${
                                  request.status === "ACCEPTED" ? "bg-green-50 border-green-300 text-green-800"
                                  : "bg-red-50 border-red-300 text-red-800"
                                }`}>
                                  <strong>Status:</strong> {request.status}
                                  {request.remarks && <span className="ml-[0.75vw] text-gray-600">— {request.remarks}</span>}
                                  {request.processedAt && <span className="ml-[0.75vw] text-gray-400 text-[0.75vw]">{new Date(request.processedAt).toLocaleString()}</span>}
                                </div>
                              )}
                            </div>
                          )})}
                        </div>
                        </div>{/* end accordion body */}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
            /* PRODUCT-LEVEL: original single-product render */
            changeRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-[2vw] text-[1vw]">
                No change requests found.
              </p>
            ) : (
              <div className="space-y-[1vw] max-h-[70vh] overflow-y-auto">
                {changeRequests.map((request, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-[0.5vw] p-[1.5vw] bg-gray-50 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-[1vw]">
                      <div>
                        <span
                          className={`px-[0.75vw] py-[0.25vw] rounded-full text-[0.85vw] font-bold ${request.status === "ACCEPTED"
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
                          <span className="ml-[0.5vw] text-[0.75vw] text-gray-500">
                            {new Date(request.processedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[0.85vw] text-gray-500">
                        {new Date(request.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* ✅ DELETE REQUEST - FIXED: Use current product data */}
                    {request.type === "delete" ? (
                      <div className="space-y-[0.75vw]">
                        <div className="bg-red-50 border border-red-200 p-[1vw] rounded-[0.5vw]">
                          <h4 className="font-semibold text-red-800 mb-[0.75vw] text-[0.9vw]">
                            Product Details to Delete:
                          </h4>
                          <div className="grid grid-cols-2 gap-[1vw] text-[.8vw]">
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
                        {/* {request.remarks && (
                          <div className="bg-orange-50 p-[0.75vw] rounded border border-orange-200 text-[.8vw]">
                            <strong>Previous Remarks:</strong> {request.remarks}
                          </div>
                        )} */}
                      </div>
                    ) : (
                      /* ✅ CHANGE REQUEST - Original vs Requested */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.5vw]">
                        <div className="bg-white p-[1vw] rounded-[0.5vw] border text-[.8vw]">
                          <h4 className="font-semibold text-gray-800 mb-[0.75vw] text-[0.9vw]">
                            Original Details
                          </h4>
                          <div className="space-y-[0.25vw] text-[0.85vw]">
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
                        <div className="bg-indigo-50 p-[1vw] rounded-[0.5vw] border border-indigo-200">
                          <h4 className="font-semibold text-indigo-800 mb-[0.75vw] text-[0.9vw]">
                            Requested Changes
                          </h4>
                          {/* 🔥 DESIGN FILES - With ACTUAL IMAGE PREVIEW */}
                          {/* 🔥 SAFE DESIGN FILES PREVIEW */}
                          {(request.requestedChanges?.lidDesignFile || request.requestedChanges?.tubDesignFile) && (
                            <div className="mb-[1.5vw] space-y-[1vw]">
                              <h5 className="font-medium text-indigo-900 mb-[0.75vw] flex items-center gap-[0.5vw] text-[0.9vw]">
                                📄 Design Files
                              </h5>

                              <div className="grid">
                                {/* 🔥 LID DESIGN */}
                                {request.requestedChanges?.lidDesignFile && (
                                  <div className="bg-white border border-indigo-200 rounded-[0.75vw] p-[1vw] hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-[0.75vw] mb-[0.75vw]">
                                      <div className={`w-[2.5vw] h-[2.5vw] rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium flex-shrink-0 ${request.requestedChanges.lidDesignFile.type?.includes('pdf')
                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                        : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                        }`}>
                                        {request.requestedChanges.lidDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-indigo-900 truncate pr-[0.5vw] text-[0.9vw]">
                                          {request.requestedChanges.lidDesignFile.name}
                                        </div>
                                        <div className="text-[0.75vw] text-gray-500">
                                          {Math.round(request.requestedChanges.lidDesignFile.size / 1024)} KB
                                        </div>
                                      </div>
                                    </div>

                                    {/* 🔥 SAFE IMAGE PREVIEW */}
                                    <div className="w-full h-[12vw] bg-gradient-to-br from-gray-50 to-gray-100 rounded-[0.5vw] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
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
                                            <div className="text-center p-[1.5vw] text-gray-400">
                                              <div className="w-[5vw] h-[5vw] mx-auto mb-[0.75vw] bg-gradient-to-br from-gray-300 to-gray-400 rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium">
                                                {request.requestedChanges.lidDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                              </div>
                                              <div className="text-[0.85vw] font-medium">Preview Unavailable</div>
                                              <div className="text-[0.75vw] mt-[0.25vw]">File not loaded</div>
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* 🔥 TUB DESIGN - SAME PATTERN */}
                                {request.requestedChanges?.tubDesignFile && (
                                  <div className="bg-white border border-indigo-200 rounded-[0.75vw] p-[1vw] hover:shadow-lg transition-all mt-[0.5vw]">
                                    <div className="flex items-start gap-[0.75vw] mb-[0.75vw]">
                                      <div className={`w-[2.5vw] h-[2.5vw] rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium flex-shrink-0 ${request.requestedChanges.tubDesignFile.type?.includes('pdf')
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-orange-500 to-red-600'
                                        }`}>
                                        {request.requestedChanges.tubDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-indigo-900 truncate pr-[0.5vw] text-[0.9vw]">
                                          {request.requestedChanges.tubDesignFile.name}
                                        </div>
                                        <div className="text-[0.75vw] text-gray-500">
                                          {Math.round(request.requestedChanges.tubDesignFile.size / 1024)} KB
                                        </div>
                                      </div>
                                    </div>

                                    <div className="w-full h-[12vw]  bg-gradient-to-br from-gray-50 to-gray-100 rounded-[0.5vw] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
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
                                            <div className="text-center p-[1.5vw] text-gray-400">
                                              <div className="w-[4vw] h-[4vw] mx-auto mb-[0.75vw] bg-gradient-to-br from-gray-300 to-gray-400 rounded-[0.5vw] flex items-center justify-center text-white text-[0.85vw] font-medium">
                                                {request.requestedChanges.tubDesignFile.type?.includes('pdf') ? 'PDF' : 'IMG'}
                                              </div>
                                              <div className="text-[0.85vw] font-medium">Preview Unavailable</div>
                                              <div className="text-[0.75vw] mt-[0.25vw]">File not loaded</div>
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


                          <div className="space-y-[0.25vw] text-[0.85vw]">
                            {getChangedFields(request).map((field, idx) => (
                              <>
                                <p
                                  key={idx}
                                  className="bg-indigo-100 px-[0.5vw] py-[0.25vw] rounded text-indigo-900 font-medium"
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
                        (inv) => inv.productId === targetProduct?.id,
                      ) && (
                        <div className="mt-[0.75vw] p-[0.75vw] bg-blue-50 border rounded-[0.5vw]">
                          <button
                            onClick={() =>
                              setInvoiceModal({
                                isOpen: true,
                                requestIndex: index,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 font-medium text-[0.85vw] flex items-center gap-[0.25vw]"
                          >
                            📄 View Generated Invoice
                          </button>
                        </div>
                      )}

                    {/* ✅ ACTION BUTTONS - Only for unprocessed */}
                    {!request.status && (
                      <div className="flex gap-[0.75vw] mt-[1.5vw] pt-[1vw] border-t border-gray-200">
                        <button
                          onClick={() => handleAction(index, "accept")}
                          className="flex-1 px-[1.5vw] py-[0.75vw] bg-green-600 text-white rounded-[0.5vw] hover:bg-green-700 font-semibold transition-all shadow-md text-[0.9vw]"
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleAction(index, "decline")}
                          className="flex-1 px-[1.5vw] py-[0.75vw] bg-red-600 text-white rounded-[0.5vw] hover:bg-red-700 font-semibold transition-all shadow-md text-[0.9vw]"
                        >
                          ❌ Decline
                        </button>
                      </div>
                    )}

                    {request.status && (
                      <div className="mt-[1vw] p-[1vw] bg-gray-100 rounded-[0.5vw] text-[0.85vw] border">
                        <div className="flex items-center justify-between">
                          <span>
                            <strong>Status:</strong> {request.status}
                          </span>
                          {request.remarks && (
                            <span className="text-[.7vw] bg-yellow-200 px-[0.5vw] py-[0.25vw] rounded-[0.25vw]">
                              Remarks Added
                            </span>
                          )}
                        </div>
                        {request.remarks && (
                          <p className="mt-[0.25vw] text-[.8vw] text-gray-900 bg-white p-[0.5vw] rounded-[0.25vw] mt-[0.5vw]">
                            {request.remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
            )/* end product-level */}
          </div>
        </div>

        {/* ✅ REMARKS MODAL */}
        {remarksModal.isOpen && (
          <div className="fixed inset-0 bg-[#000000b3] z-[50002] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {(remarksModal.action === "accept")
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
                  {((targetProduct || currentProduct)?.changeRequests?.[remarksModal.requestIndex]
                    ?.type === "delete" && remarksModal.action === "accept")
                    ? "Enter Invoice Details"
                    : "Remarks"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                 placeholder={
                    remarksModal.action === "accept" &&
                    (targetProduct || currentProduct)?.changeRequests?.[remarksModal.requestIndex]?.type === "delete"
                      ? "Enter Invoice Details"
                      : "Enter Remarks"
                  }
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
          <div className="fixed inset-0 bg-[#000000b3] z-[50003] flex items-center justify-center p-[1vw]">
            <div className="bg-white rounded-[1vw] max-w-[40vw] w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-[1vw] border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-[1vw]">
                <h3 className="text-[1.1vw] font-semibold">Invoice Details</h3>
                <button
                  onClick={() =>
                    setInvoiceModal({ isOpen: false, requestIndex: -1 })
                  }
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-[2vw] h-[2vw] flex items-center justify-center text-[1.2vw]"
                >
                  ×
                </button>
              </div>
              <div className="p-[1.5vw]">
                {currentOrder.invoices?.map(
                  (invoice) =>
                    invoice.productId === modalProduct.id && (
                      <div
                        key={invoice.id}
                        className="border rounded-[0.5vw] p-[1.5vw] bg-gradient-to-br from-blue-50 to-indigo-50"
                      >
                        <div className="grid grid-cols-2 gap-[1.5vw] mb-[1vw]">
                          <div>
                            <p className="text-[0.85vw] text-gray-600">Invoice ID</p>
                            <p className="font-bold text-[1.1vw] text-blue-900">
                              {invoice.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.85vw] text-gray-600">Date</p>
                            <p className="font-bold text-[1.1vw]">
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-[0.5vw] mb-[1vw] text-[0.9vw]">
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
                          <p className="text-[0.85vw] text-gray-600">
                            Remarks: {invoice.remarks}
                          </p>
                        </div>
                        <div className="text-center pt-[1vw] border-t">
                          <span className="bg-green-100 text-green-800 px-[1vw] py-[0.5vw] rounded-full font-medium text-[0.85vw]">
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
        <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] rounded-lg overflow-hidden">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-[1vw]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[1.35vw] font-medium">
                  Deleted Products
                </h2>

              </div>
              <button
                onClick={() =>
                  setInvoiceModal({ isOpen: false, orderId: null })
                }
                className="text-white cursor-pointer rounded w-14 h-14 flex items-center justify-center text-[1.5vw] font-bold transition-all"
              >
                ×
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8  overflow-y-auto max-h-[50vh]">
            {orders.find((o) => o.id === invoiceModal.orderId)?.invoices
              ?.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-400 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm font-semibold border-b border-gray-200">
                      <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">S. No.</th>
                      <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">Product Name</th>
                      <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">Product Size</th>
                      <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">IML Name</th>
                      <th className="p-4 whitespace-nowrap bg-gray-600 text-white border-r border-gray-400 border-b">Invoice Details</th>

                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-600 divide-y divide-gray-100">
                    {orders
                      .find((o) => o.id === invoiceModal.orderId)
                      ?.invoices?.slice() // make a copy
                      .reverse() // reverse order
                      .map((invoice, i) => {
                        console.log(invoice);
                        return (
                          <tr
                            key={invoice.id}
                            className="hover:bg-blue-50 transition-colors"
                          >
                            <td className="p-4 font-medium text-gray-900 border-r border-b border-gray-400">
                            <div className="text-[.85vw] text-gray-500 mt-1">
                              {i + 1}
                            </div>
                          </td>
                          <td className="p-4 border-r border-b border-gray-400">
                            <div className="font-semibold text-gray-800">
                              {invoice.productName}
                            </div>
                          </td>
                          <td className="p-4 border-r border-b border-gray-400">
                            <div className="text-[.85vw]">{invoice.size}</div>
                          </td>
                          <td className="p-4 border-r border-b border-gray-400">
                            {invoice.imlName}
                          </td>

                          <td className="p-4 max-w-[.85vw] truncate border-r border-b border-gray-400" title={invoice.remarks}>
                            {invoice.remarks || "-"}
                          </td>

                        </tr>
                      )
                      })}
                  </tbody>
                </table>
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
    // 🔥 CHANGE 3: If the product was re-edited (had _wasArtworkApproved flag),
    // restore its status to "Artwork Approved" after saving
    const order = orders.find((o) => o.id === tempChangeRequest.orderId);
    const originalProduct = order?.products?.find((p) => p.id === tempChangeRequest.productId);
    const wasArtworkApproved = originalProduct?._wasArtworkApproved === true;

    console.log(`originalProduct?.artworkStatus: ${originalProduct?.artworkStatus}`);

    const finalProduct = wasArtworkApproved
      ? {
          ...localProduct,
          orderStatus: "Artwork Approved",
          designStatus: "approved",
          _wasArtworkApproved: undefined, // clear flag
        }
        : originalProduct?.designStatus == "approved" ?  {
          ...localProduct,
          orderStatus: "Artwork Approved",
          designStatus: "approved",
          _wasArtworkApproved: undefined, // clear flag
        }
      : { ...localProduct, _wasArtworkApproved: undefined };

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
              ? { ...p, ...finalProduct } // ✅ Apply all changes
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
                    type: changeRequest.type || "change", // ✅ DYNAMIC TYPE
                    timestamp: now,
                    originalDetails: { ...changeRequest.productDetails },
                    requestedChanges: changeRequest.requestedChanges,
                    revisedEstimate: {
                      estimatedNumber: revisedEstimateNo, // ✅ FIXED KEY NAME
                      estimatedValue: revisedEstimateValue, // ✅ FIXED KEY NAME
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

    // 🔥 FIX 3: CORRECT useEffect - populate from original estimate, or blank if forced
    useEffect(() => {
      if (revision?.originalEstimate) {
        // 🔥 CHANGE 2: If qty changed or delete, force blank so user must enter new values
        if (revision.forceBlankEstimate) {
          setLocalRevisedEstimate({
            estimatedNumber: "",
            estimatedValue: "",
          });
        } else {
          setLocalRevisedEstimate({
            estimatedNumber: revision.originalEstimate.estimatedNumber || "",
            estimatedValue: revision.originalEstimate.estimatedValue || "",
          });
        }
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

      console.log(`Tempchangeresquest plain: ${tempChangeRequest}`);
      console.log(`Tempchangeresquest JSON: ${JSON.stringify(tempChangeRequest, null, 2)}`);

      if (hasMovedToPurchase(order)) {
        setConfirmState({
            isOpen: true,
            message: "Do you want to update the PO details associated with this order?",
            onYes: () => {
              // navigate to po details page with the order details sent
              navigate("/iml/purchase/po-details", {
              state: { orderId: order.id, fromOrdersManagement: false },
            });
          },
          onNo: () => setConfirmState({isOpen: false})
        });
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
              <h3 className="text-[1vw] font-semibold text-blue-800 mb-4">
                Revised Estimate
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[.85vw] font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[.85vw]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[.85vw] font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[.85vw]"
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
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-600 hover:text-white font-medium transition-colors cursor-pointer"
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
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-all disabled:opacity-50 cursor-pointer"
            >
              {isEditMode ? "Save Directly" : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🔥 NEW: Refund Modal - shown when order with payment records is being deleted
  const RefundModal = () => {
    const [localRemarks, setLocalRemarks] = useState(refundModal.refundRemarks || "");
    const [localDoc, setLocalDoc] = useState(refundModal.refundDocument || null);
    const [localDocName, setLocalDocName] = useState(refundModal.refundDocumentName || "");
    const fileInputRef = useRef(null);

    if (!refundModal.isOpen) return null;

    const handleDocUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLocalDoc(ev.target.result);
        setLocalDocName(file.name);
      };
      reader.readAsDataURL(file);
    };

    const handleSubmit = () => {
      if (!localRemarks.trim()) {
        alert("Please enter refund remarks.");
        return;
      }
      if (!localDoc) {
        alert("Please upload a payment/refund document.");
        return;
      }
      // Send delete request with refund info
      const updatedOrders = orders.map((o) =>
        o.id === refundModal.orderId
          ? {
              ...o,
              productDeleted: true,
              deleteRequestedAt: new Date().toISOString(),
              refundInfo: {
                remarks: localRemarks,
                document: localDoc,
                documentName: localDocName,
                submittedAt: new Date().toISOString(),
              },
            }
          : o,
      );
      setOrders(updatedOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("ordersUpdated"));
      setRefundModal({ isOpen: false, orderId: null, order: null, refundRemarks: "", refundDocument: null, refundDocumentName: "" });
      alert("✅ Delete request with refund details sent! Admin will review this request.");
    };

    return (
      <div className="fixed inset-0 bg-[#000000b3] z-[50008] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-[1.5vw] py-[1vw] flex items-center justify-between">
            <div>
              <h2 className="text-[1.25vw] font-bold text-white">🔴 Delete Order Request</h2>
              <p className="text-[0.85vw] text-orange-100 mt-[0.2vw]">
                Order: <strong>{refundModal.order?.orderNumber || refundModal.orderId}</strong>
              </p>
            </div>
            <button
              onClick={() => setRefundModal({ isOpen: false, orderId: null, order: null, refundRemarks: "", refundDocument: null, refundDocumentName: "" })}
              className="text-white hover:text-orange-200 text-[1.8vw] font-bold cursor-pointer leading-none"
            >×</button>
          </div>

          {/* Notice */}
          <div className="bg-amber-50 border-b border-amber-200 px-[1.5vw] py-[0.75vw]">
            <p className="text-[0.85vw] text-amber-800 font-medium">
              ⚠️ This order has payment records. To request deletion, you must provide refund details. The admin will review before confirming.
            </p>
          </div>

         

          {/* Form */}
          <div className="px-[1.5vw] py-[1vw] space-y-[1vw]">
            {/* Refund Remarks */}
            <div>
              <label className="block text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                Refund Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={localRemarks}
                onChange={(e) => setLocalRemarks(e.target.value)}
                rows={3}
                placeholder="Explain the reason for deletion and refund details..."
                className="w-full border border-gray-300 rounded-lg px-[0.75vw] py-[0.5vw] text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-[0.85vw] font-semibold text-gray-700 mb-[0.4vw]">
                Payment/Refund Document <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDocUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              {localDoc ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-lg px-[1vw] py-[0.6vw]">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="text-green-600 text-[1vw]">📎</span>
                    <span className="text-[0.85vw] text-green-800 font-medium">{localDocName}</span>
                  </div>
                  <button
                    onClick={() => { setLocalDoc(null); setLocalDocName(""); }}
                    className="text-red-500 hover:text-red-700 text-[0.8vw] cursor-pointer font-medium"
                  >Remove</button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg px-[1vw] py-[1vw] text-[0.85vw] text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer text-center"
                >
                  📤 Click to upload document (PDF, Image, Word)
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-[0.75vw] px-[1.5vw] py-[1vw] border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setRefundModal({ isOpen: false, orderId: null, order: null, refundRemarks: "", refundDocument: null, refundDocumentName: "" })}
              className="px-[1.25vw] py-[0.5vw] text-[0.85vw] bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!localRemarks.trim() || !localDoc}
              className={`px-[1.25vw] py-[0.5vw] text-[0.85vw] rounded-lg font-bold transition-all cursor-pointer ${
                localRemarks.trim() && localDoc
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Send Delete Request
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
      <div className="fixed inset-0 bg-black/60 z-[50005] flex items-center justify-center p-[1.5vw]">
        <div className="bg-white rounded-[1.8vw] p-[2vw] max-w-[30vw] w-full shadow-2xl">
          <div className="text-center mb-[2vw]">
            <div className="w-[5vw] h-[5vw] bg-red-100 rounded-[1.5vw] flex items-center justify-center mx-auto mb-[1.5vw]">
              <span className="text-[2.5vw] text-red-600">🗑️</span>
            </div>
            <h2 className="text-[1.6vw] font-black text-gray-900 mb-[1vw]">
              Soft Delete Product?
            </h2>
            <p className="text-[1.1vw] text-gray-700 mb-[0.5vw]">
              <strong>{productName}</strong> will be <span className="text-red-600 font-bold">hidden</span> from dashboard
            </p>
            <p className="text-[0.85vw] text-gray-500">Invoice will be generated for admin review</p>
          </div>

          <div className="flex gap-[1vw]">
            <button
              onClick={() => setProductDeleteConfirm({ isOpen: false, orderId: null, productId: null, productName: "" })}
              className="flex-1 px-[1.5vw] py-[0.75vw] bg-gray-300 text-gray-800 rounded-[0.8vw] hover:bg-gray-400 text-[1vw] font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSoftDelete}
              className="flex-1 px-[1.5vw] py-[0.75vw] bg-gradient-to-r from-red-500 to-red-600 text-white rounded-[0.8vw] hover:shadow-xl text-[1vw] font-bold transition-all"
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

    // Filter orders for Delete Requests (productDeleted: true, NOT confirmed yet)
    const deleteRequestOrders = orders.filter(o => o.productDeleted && !o.orderConfirmDelete);

    // Filter orders for Delete History (orderConfirmDelete: true)
    const deleteHistoryOrders = orders.filter(o => o.orderConfirmDelete);

    // Group by company
    const groupByCompany = (ordersList) => {
      return ordersList.reduce((acc, order) => {
        const companyName = order.contact?.company || 'Unknown Company';
        if (!acc[companyName]) {
          acc[companyName] = [];
        }
        acc[companyName].push(order);
        return acc;
      }, {});
    };

    const deleteRequestsByCompany = groupByCompany(deleteRequestOrders);
    const deleteHistoryByCompany = groupByCompany(deleteHistoryOrders);

    // Accept delete request - sets orderConfirmDelete: true
    const handleAcceptDelete = (order) => {
      const invoiceNumber = prompt(`Enter Invoice Number for deleted order:\n${order.orderNumber || order.id}`);
      if (invoiceNumber && invoiceNumber.trim()) {
        const updatedOrders = orders.map(o =>
          o.id === order.id
            ? {
              ...o,
              orderConfirmDelete: true,
              deletionConfirmedAt: new Date().toISOString(),
              deletionInvoiceNumber: invoiceNumber.trim()
            }
            : o
        );
        setOrders(updatedOrders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        window.dispatchEvent(new Event('ordersUpdated'));
        alert('✅ Delete request accepted! Order moved to Delete History.');
      }
    };

    // Reject delete request - sets productDeleted: false
    const handleRejectDelete = (order) => {
      if (window.confirm(`Are you sure you want to reject the delete request for:\n${order.orderNumber || order.id}?`)) {
        const updatedOrders = orders.map(o =>
          o.id === order.id
            ? {
              ...o,
              productDeleted: false,
              deleteRequestedAt: undefined
            }
            : o
        );
        setOrders(updatedOrders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        window.dispatchEvent(new Event('ordersUpdated'));
        alert('✅ Delete request rejected! Order restored to active state.');
      }
    };

    // Product Table Component
    const ProductTable = ({ products }) => (
      <div className="overflow-x-auto mt-[1vw]">
        <table className="w-full border-collapse bg-white rounded">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">Product Name</th>
              <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">Size</th>
              <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">Quantity</th>
              <th className="text-left px-[1vw] py-[0.6vw] text-[.85vw] border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300 font-bold text-gray-700">IML Details</th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.map((product, idx) => {
                console.log(`Product: ${JSON.stringify(product, null, 2)}`);
                return (
                  <tr key={product.id || idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-800 font-medium border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                      {product.productName || 'N/A'}
                    </td>
                    <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-700 border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                      {product.size || 'N/A'}
                    </td>
                    <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-700 border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                      {(() => {
                        const imlType = product.imlType || '';
                        const isLidAndTub = imlType.toUpperCase().includes('LID') && imlType.toUpperCase().includes('TUB');
                        const isLidOnly = imlType.toUpperCase().includes('LID') && !imlType.toUpperCase().includes('TUB');
                        const isTubOnly = imlType.toUpperCase().includes('TUB') && !imlType.toUpperCase().includes('LID');

                        if (isLidAndTub) {
                          // Show both lid and tub quantities
                          const lidQty = product.lidLabelQty || 'N/A';
                          const tubQty = product.tubLabelQty || 'N/A';
                          return (
                            <div className="flex flex-col gap-[0.2vw]">
                              <span className="text-[.85vw]"><strong>Lid:</strong> {lidQty}</span>
                              <span className="text-[.85vw]"><strong>Tub:</strong> {tubQty}</span>
                            </div>
                          );
                        } else if (isLidOnly) {
                          // Show only lid quantity
                          const lidQty = product.lidLabelQty || 'N/A';
                          return lidQty;
                        } else if (isTubOnly) {
                          // Show only tub quantity
                          const tubQty = product.tubLabelQty || 'N/A';
                          return tubQty;
                        } else {
                          // Fallback to general quantity
                          return product.tubLabelQty || 'N/A';
                        }
                      })()}
                    </td>

                    <td className="px-[1vw] py-[0.7vw] text-[.85vw] text-gray-700 border border-l-[0] border-t-[0] border-b-[0] border-r-gray-300">
                      <div className="flex flex-col gap-[0.2vw]">
                        <span className="text-[.85vw]"><strong>Name:</strong> {product.imlName || 'N/A'}</span>
                        <span className="text-[.85vw]"><strong>Type:</strong> {product.imlType || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-[1vw] py-[1.5vw] text-center text-[.9vw] text-gray-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-[50010] flex items-center justify-center p-[1.5vw]">
          <div className="bg-white rounded-[1.8vw] max-w-[92vw] w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">

            {/* TABS - Only 2 tabs */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white p-[1.8vw] rounded-t-[1.8vw]">
              <div className="flex gap-[1.2vw]">
                <button
                  onClick={() => setAllInvoicesTab('deleteRequests')}
                  className={`px-[1.25vw] py-[0.75vw] font-bold rounded-full transition-all text-[0.95vw] flex items-center gap-[0.5vw] cursor-pointer  ${allInvoicesTab === 'deleteRequests'
                    ? 'bg-white text-orange-700 shadow-[0_0.4vw_1vw_rgba(0,0,0,0.3)]'
                    : 'hover:bg-white/30 hover:scale-[1.02]'
                    }`}
                >
                  Delete Requests ({deleteRequestOrders.length})
                </button>
                <button
                  onClick={() => setAllInvoicesTab('deleteHistory')}
                  className={`px-[1.25vw] py-[0.75vw] font-bold rounded-full transition-all text-[0.95vw] flex items-center gap-[0.5vw] cursor-pointer  ${allInvoicesTab === 'deleteHistory'
                    ? 'bg-white text-gray-700 shadow-[0_0.4vw_1vw_rgba(0,0,0,0.3)]'
                    : 'hover:bg-white/30 hover:scale-[1.02]'
                    }`}
                >
                  Delete History ({deleteHistoryOrders.length})
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-[2vw] space-y-[1.5vw]">
              {allInvoicesTab === 'deleteRequests' ? (
                // DELETE REQUESTS TAB
                Object.keys(deleteRequestsByCompany).length > 0 ? (
                  <div className="space-y-[1.5vw]">
                    {Object.entries(deleteRequestsByCompany).map(([companyName, companyOrders]) => (
                      <div key={companyName} className="bg-white rounded-lg shadow-md border border-orange-200 overflow-hidden">
                        {/* Company Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-[1.5vw] py-[1vw]">
                          <h3 className="text-[1.2vw] font-bold">{companyName}</h3>
                          <p className="text-[.9vw] text-orange-100">{companyOrders.length} Delete Request(s)</p>
                        </div>

                        {/* Orders */}
                        <div className="p-[1.5vw] space-y-[1.5vw]">
                          {companyOrders.map(order => (
                            <div key={order.id} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-[1.5vw]">
                              {/* Order Header */}
                              <div className="flex justify-between items-start mb-[1vw] pb-[1vw] border-b border-orange-200">
                                <div className="flex-1">
                                  <h4 className="text-[1.1vw] font-bold text-gray-800 mb-[0.5vw]">
                                    📦 {order.orderNumber || order.id}
                                  </h4>
                                  <div className="grid grid-cols-3 gap-x-[2vw] gap-y-[0.3vw] text-[.9vw] text-gray-700">
                                    <span><strong>Contact:</strong> {order.contact?.contactName || 'N/A'}</span>
                                    <span><strong>Phone:</strong> {order.contact?.phone || 'N/A'}</span>
                                    <span><strong>Requested:</strong> {order.deleteRequestedAt ? new Date(order.deleteRequestedAt).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                  {order.orderEstimate && (
                                    <div className="mt-[0.5vw] text-[.9vw] text-gray-700 bg-white px-[1vw] py-[0.5vw] rounded border border-orange-200">
                                      <span><strong>Estimate No.:</strong> {order.orderEstimate.estimatedNumber || 'N/A'}</span>
                                      <span className="ml-[2vw]"><strong>Estimate Value:</strong> ₹{order.orderEstimate.estimatedValue || '0'}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Product Table */}
                              <div className="mb-[1vw]">
                                <h5 className="text-[1vw] font-semibold text-gray-800 mb-[0.5vw]">Products:</h5>
                                <ProductTable products={order.products} />
                              </div>

                              {/* 🔥 Refund Info - shown if present */}
                              {order.refundInfo && (
                                <div className="mb-[1vw] bg-blue-50 border-2 border-blue-300 rounded-lg p-[1vw]">
                                  <h5 className="text-[0.95vw] font-bold text-blue-800 mb-[0.5vw]">💰 Refund Details</h5>
                                  <div className="space-y-[0.4vw]">
                                    <div>
                                      <span className="text-[0.8vw] font-semibold text-gray-600">Remarks: </span>
                                      <span className="text-[0.85vw] text-gray-800">{order.refundInfo.remarks}</span>
                                    </div>
                                    {order.refundInfo.documentName && (
                                      <div className="flex items-center gap-[0.5vw]">
                                        <span className="text-[0.8vw] font-semibold text-gray-600">Document: </span>
                                        <a
                                          href={order.refundInfo.document}
                                          download={order.refundInfo.documentName}
                                          className="text-[0.85vw] text-blue-600 hover:text-blue-800 underline flex items-center gap-[0.3vw]"
                                        >
                                          📎 {order.refundInfo.documentName}
                                        </a>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-[0.8vw] font-semibold text-gray-600">Submitted: </span>
                                      <span className="text-[0.8vw] text-gray-600">{order.refundInfo.submittedAt ? new Date(order.refundInfo.submittedAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex justify-end gap-[1vw] mt-[1vw] pt-[1vw] border-t border-orange-200">
                                <button
                                  onClick={() => handleAcceptDelete(order)}
                                  className="px-[1vw] py-[0.55vw] bg-green-600 text-white rounded-lg hover:bg-green-700 text-[.95vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                                >
                                  Accept & Generate Invoice
                                </button>
                                <button
                                  onClick={() => handleRejectDelete(order)}
                                  className="px-[1vw] py-[0.55vw] bg-red-600 text-white rounded-lg hover:bg-red-700 text-[.95vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                                >
                                  Reject Request
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-[5vw]">
                    <div className="w-[7vw] h-[7vw] mx-auto mb-[2vw] flex items-center justify-center rounded-2xl bg-orange-100 shadow-lg">
                      <svg className="w-[3.5vw] h-[3.5vw] text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-[1.3vw] font-bold text-gray-900 mb-[0.5vw]">No Delete Requests</h3>
                    <p className="text-[0.9vw] text-gray-500">All delete requests have been processed.</p>
                  </div>
                )
              ) : (
                // DELETE HISTORY TAB
                Object.keys(deleteHistoryByCompany).length > 0 ? (
                  <div className="space-y-[1.5vw]">
                    {Object.entries(deleteHistoryByCompany).map(([companyName, companyOrders]) => (
                      <div key={companyName} className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                        {/* Company Header */}
                        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-[1.5vw] py-[1vw]">
                          <h3 className="text-[1.2vw] font-bold">{companyName}</h3>
                          <p className="text-[.9vw] text-gray-200">{companyOrders.length} Confirmed Deletion(s)</p>
                        </div>

                        {/* Orders */}
                        <div className="p-[1.5vw] space-y-[1.5vw]">
                          {companyOrders.map(order => (
                            <div key={order.id} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-[1.5vw]">
                              {/* Order Header */}
                              <div className="flex justify-between items-start mb-[1vw] pb-[1vw] border-b border-gray-300">
                                <div className="flex-1">
                                  <h4 className="text-[1.1vw] font-bold text-gray-800 mb-[0.5vw]">
                                    📦 {order.orderNumber || order.id}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-x-[2vw] gap-y-[0.3vw] text-[.9vw] text-gray-700">
                                    <span><strong>Contact:</strong> {order.contact?.contactName || 'N/A'}</span>
                                    <span><strong>Phone:</strong> {order.contact?.phone || 'N/A'}</span>
                                    <span><strong>Email:</strong> {order.contact?.email || 'N/A'}</span>
                                    <span><strong>Confirmed:</strong> {order.deletionConfirmedAt ? new Date(order.deletionConfirmedAt).toLocaleDateString() : 'N/A'}</span>
                                  </div>

                                  {/* Invoice Info */}
                                  {order.deletionInvoiceNumber && (
                                    <div className="mt-[1vw] bg-green-100 border-2 border-green-400 rounded-lg p-[1vw]">
                                      <div className="flex items-center gap-[1vw]">
                                        <svg className="w-[1.5vw] h-[1.5vw] text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                          <p className="text-[1vw] font-bold text-green-800">
                                            Invoice Generated: {order.deletionInvoiceNumber}
                                          </p>
                                          <p className="text-[.85vw] text-green-700">
                                            Deletion confirmed and processed
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Product Table */}
                              <div>
                                <h5 className="text-[1vw] font-semibold text-gray-800 mb-[0.5vw]">Products:</h5>
                                <ProductTable products={order.products} />
                              </div>

                              {/* 🔥 Refund Info in history */}
                              {order.refundInfo && (
                                <div className="mt-[1vw] bg-blue-50 border-2 border-blue-300 rounded-lg p-[1vw]">
                                  <h5 className="text-[0.95vw] font-bold text-blue-800 mb-[0.5vw]">💰 Refund Details</h5>
                                  <div className="space-y-[0.4vw]">
                                    <div>
                                      <span className="text-[0.8vw] font-semibold text-gray-600">Remarks: </span>
                                      <span className="text-[0.85vw] text-gray-800">{order.refundInfo.remarks}</span>
                                    </div>
                                    {order.refundInfo.documentName && (
                                      <div className="flex items-center gap-[0.5vw]">
                                        <span className="text-[0.8vw] font-semibold text-gray-600">Document: </span>
                                        <a
                                          href={order.refundInfo.document}
                                          download={order.refundInfo.documentName}
                                          className="text-[0.85vw] text-blue-600 hover:text-blue-800 underline flex items-center gap-[0.3vw]"
                                        >
                                          📎 {order.refundInfo.documentName}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-[5vw]">
                    <div className="w-[7vw] h-[7vw] mx-auto mb-[2vw] flex items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
                      <svg className="w-[3.5vw] h-[3.5vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-[1.3vw] font-bold text-gray-900 mb-[0.5vw]">No Delete History</h3>
                    <p className="text-[0.9vw] text-gray-500">No orders have been confirmed for deletion yet.</p>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="py-[1.25vw] px-[1vw] border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-end justify-end">
              <button
                onClick={() => setAllInvoicesModal({ isOpen: false, invoices: [], deletedInvoices: [] })}
                className="px-[.8vw] py-[.35vw] bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded font-bold text-[.85vw] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
      const matchesConfirmDelete = !order.orderConfirmDelete;  // Hide if true


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
          matchesConfirmDelete &&
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
                              className={`px-[0.5vw] py-[0.2vw] rounded-[0.3vw] text-[0.8vw] font-medium ${record.paymentType === "advance"
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
                  className={`flex-1 px-[1vw] py-[0.65vw] rounded-lg font-semibold text-[.8vw] transition-all duration-200 cursor-pointer border-2 ${viewMode === "all"
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
                  className={`flex-1 px-[1vw] py-[0.65vw] rounded-lg font-semibold text-[.8vw] transition-all duration-200 cursor-pointer border-2 w-fit ${viewMode === "remaining"
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
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-[1.25vw] py-[.5vw] rounded-lg font-bold shadow-lg text-[.9vw] cursor-pointer"
                >
                  📋 Order Delete Request
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
                          className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 ${expandedCompanies[companyName] ? "rotate-90" : ""
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
                                    className={`w-[1.2vw] h-[1.2vw] transition-transform duration-200 text-gray-600 ${isOrderExpanded ? "rotate-90" : ""
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
                                        className="px-[1.25vw] py-[.35vw] cursor-pointer bg-gray-600 text-white rounded-full hover:bg-gray-700 text-[.8vw] font-medium transition-all cursor-pointer flex items-center justify-center"
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
                                            className="text-white bg-amber-500 rounded-full font-medium text-[.8vw] flex items-center gap-1 py-[.35vw] px-[1.25vw] cursor-pointer"
                                          >
                                            📄 View Deleted Products
                                          </button>
                                        )}

                                      {!(order.paymentRecords && order.paymentRecords.length > 0) && !hasMovedToPurchase(order) && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleEditOrder(order)
                                            }
                                            className="px-[1.25vw] py-[.35vw] cursor-pointer bg-blue-600 text-white rounded-full hover:bg-blue-700 text-[.8vw] font-medium transition-all"
                                          >
                                            Edit
                                          </button>
                                        </>
                                      )}
                                      {/* View Request Button - Order Level */}
                                      {(() => {
                                        const allRequests = order.products?.flatMap(p => p.changeRequests || []) || [];
                                        const pendingCount = allRequests.filter(r => !r.status || (r.status !== "ACCEPTED" && r.status !== "DECLINED")).length;
                                        return allRequests.length > 0 ? (
                                          <button
                                            onClick={() =>
                                              setViewRequestModal({
                                                isOpen: true,
                                                order,
                                                product: null,
                                              })
                                            }
                                            className="relative px-[1.25vw] py-[.35vw] cursor-pointer bg-purple-600 text-white rounded-full hover:bg-purple-700 text-[.8vw] font-medium transition-all flex items-center gap-[0.4vw]"
                                          >
                                            🔔 View Requests
                                            {pendingCount > 0 && (
                                              <span className="absolute -top-[0.5vw] -right-[0.5vw] bg-red-500 text-white text-[0.65vw] font-bold rounded-full min-w-[1.2vw] h-[1.2vw] flex items-center justify-center px-[0.2vw]">
                                                {pendingCount}
                                              </span>
                                            )}
                                          </button>
                                        ) : null;
                                      })()}

                                      <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="px-[1.25vw] py-[.5vw] text-[.85vw] bg-red-500 text-white rounded-full transition-all cursor-pointer font-medium"
                                      >
                                        Delete Order
                                      </button>
                                      {isOrderDesignApproved(order) &&
                                        !isOrderMovedToPurchase(order) && (
                                          <button
                                            onClick={() =>
                                              handleMoveToPurchase(order)
                                            }
                                            className="px-[1.25vw] py-[.35vw] cursor-pointer bg-green-600 text-white rounded-full hover:bg-green-700 text-[.85vw] font-medium transition-all"
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
                                                      className={`inline-block px-[.8vw] py-[.25vw] text-[.8vw] rounded font-semibold whitespace-pre ${product.orderStatus ===
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
                                                            "In Production" && product.orderStatus !==
                                                            "Order Pending" &&
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
                                                            {(order.paymentRecords && order.paymentRecords.length > 0) &&  ((product.orderStatus ===
                                                            "Artwork Pending" || product.orderStatus === "Order Pending")) && (
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
                                                            )}
                                                          {(product.orderStatus ===
                                                              "Artwork Approved") && (
                                                                <>
                                                                  <button
                                                                    onClick={() =>
                                                                      {
                                                                        const confirm1 = confirm("Do you want to re-edit this product?")
                                                                        if (confirm1) {
                                                                          // 🔥 CHANGE 3: Set "Order Pending" (not "Artwork Pending"), and do NOT clear design files
                                                                          const updates = {
                                                                            orderStatus: "Order Pending",
                                                                            designStatus: "approved",
                                                                            designSharedMail: false,
                                                                            _wasArtworkApproved: true, // 🔥 Flag to restore after save
                                                                          };

                                                                          updateOrderProductBatch(order.id, product.id, updates);
                                                                          
                                                                          console.log(`Product info: ${JSON.stringify(product, null, 2)}`);
                                                                          
                                                                         const stored = localStorage.getItem(STORAGE_KEY);
                                                                        const orders = JSON.parse(stored || '[]');
                                                                        
                                                                        // Apply updates
                                                                        const updatedOrders = orders.map(o => 
                                                                          o.id === order.id 
                                                                            ? { ...o, 
                                                                                products: o.products.map(p => 
                                                                                  p.id === product.id ? { ...p, ...updates } : p 
                                                                                ) 
                                                                              }
                                                                            : o
                                                                        );

                                                                        // 🔥 SAVE back + trigger global update
                                                                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
                                                                        window.dispatchEvent(new Event('ordersUpdated'));

                                                                        console.log('✅ Updates applied:', updates);

                                                                        // 🔥 IMMEDIATE modal open with FRESH data from localStorage
                                                                        setTimeout(() => {
                                                                          const freshOrders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                                                                          const freshOrder = freshOrders.find(o => o.id === order.id);
                                                                          const freshProduct = freshOrder?.products?.find(p => p.id === product.id);
                                                                          
                                                                          console.log('🔥 FRESH product:', freshProduct);
                                                                          
                                                                          // Now call handler with fresh data
                                                                          handleEditRequest(freshOrder, freshProduct);
                                                                        }, 50);  // Tiny delay ensures localStorage sync

                                                                        }
                                                                    }
                                                                    }
                                                                    className="px-[1vw] py-[0.4vw] cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 text-[.75vw] font-medium transition-all whitespace-pre"
                                                                  >
                                                                    Re-Edit
                                                                  </button>
                                                                </>
                                                              )}
                                                          {product.designStatus ===
                                                            "approved" && (product.orderStatus !== "Order Pending")  && 
                                                            !product.moveToPurchase &&
                                                            (order.paymentRecords && order.paymentRecords.length > 0) ? (
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
      {refundModal.isOpen && <RefundModal />}


      {changeRequestModal.isOpen && <ChangeRequestModal />}
      {viewRequestModal.isOpen && <ViewRequestModal />}
      {estimateRevisionModal.isOpen && <EstimateRevisionModal />}
      {invoiceModal.isOpen && <ViewInvoice />}
      {invoiceCreateModal.isOpen && <InvoiceModal />}
      {deleteOrderModal.isOpen && <OrderDeletionModal />}
      {orderInvoiceModal.isOpen && <OrderDeleteInvoiceModal />}
      {deletedOrderInvoicesModal.isOpen && <OrderInvoiceModalView />}
       <ConfirmModal
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onYes={confirmState.onYes}
        onNo={confirmState.onNo}
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
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full text-[.9vw] px-[0.75vw] py-[0.45vw] pr-[2.5vw] border border-gray-300 rounded-[0.5vw] text-[0.85vw] outline-none bg-white box-border appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${disabled ? "bg-white cursor-not-allowed" : "cursor-pointer"
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
            className={`px-2 py-0.5 rounded text-0.65vw font-medium ${file?.type === "application/pdf"
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