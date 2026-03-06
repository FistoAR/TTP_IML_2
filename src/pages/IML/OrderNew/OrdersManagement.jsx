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

// --- Modal Components (extracted to separate files) ---
import PreviewModal from "./modals/PreviewModal";
import ChangeRequestModal from "./modals/ChangeRequestModal";
import ViewRequestModal from "./modals/ViewRequestModal";
import InvoiceModal from "./modals/InvoiceModal";
import ViewInvoice from "./modals/ViewInvoice";
import EstimateRevisionModal from "./modals/EstimateRevisionModal";
import RefundModal from "./modals/RefundModal";
import RefundDetailsModal from "./modals/RefundDetailsModal";
import OrderDeletionModal from "./modals/OrderDeletionModal";
import OrderDeleteInvoiceModal from "./modals/OrderDeleteInvoiceModal";
import OrderInvoiceModalView from "./modals/OrderInvoiceModalView";
import ProductionAllocationModal from "./modals/ProductionAllocationModal";
import ProductionHistoryModal from "./modals/ProductionHistoryModal";
import ProductDeleteConfirmModal from "./modals/ProductDeleteConfirmModal";
import AllInvoicesModal from "./modals/AllInvoicesModal";
import { Select, Input, DesignPreview } from "./modals/OrderFormUtils";


const OLD_DESIGN_FILES = [
  { id: 1, name: "Design 1", path: design1PDF, type: "pdf" },
  { id: 2, name: "Design 2", path: design2PDF, type: "pdf" },
  { id: 3, name: "Design 3", path: design3PDF, type: "pdf" },
];

// Mock data storage (In production, this would be an API/Database)
const DATA_VERSION = "4.3"; // Increment this when structure changes
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
  const scrollPositionRef = useRef(0);

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

  const [refundDetailsModal, setRefundDetailsModal] = useState({ isOpen: false });

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
            imlName: "Premium IML Labels",
            imlType: "TUB",
            lidColor: "transparent",
            tubColor: "red",
            lidLabelQty: "",
            lidProductionQty: "",
            lidStock: 0,
            tubLabelQty: "1000",
            tubProductionQty: "600",
            tubStock: 400,
            budget: 20000,
            approvedDate: "2025-12-10",
            designSharedMail: false,
            orderStatus: "Artwork Approved",
            designStatus: "approved",
            designType: "new",
            moveToPurchase: false,
            singleImlDesign: false,
            isCollapsed: false,
            updatedAt: "2025-12-10T08:00:00.000Z",
          },
          {
            id: 2,
            productName: "Sweet Box",
            size: "500gms",
            imlName: "Quality IML Solutions",
            imlType: "LID & TUB",
            lidColor: "white",
            tubColor: "white",
            lidLabelQty: "1500",
            lidProductionQty: "1200",
            lidStock: 300,
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
            singleImlDesign: false,
            isCollapsed: false,
            updatedAt: "2025-12-11T09:00:00.000Z",
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
        ],
        status: "pending",
        createdAt: "2025-12-10T08:00:00.000Z",
        updatedAt: "2025-12-11T09:00:00.000Z",
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
            productName: "Rectangle",
            size: "750ml",
            imlName: "Eco IML Series",
            imlType: "LID",
            lidColor: "green",
            tubColor: "transparent",
            lidLabelQty: "1500",
            lidProductionQty: "1200",
            lidStock: 300,
            tubLabelQty: "",
            tubProductionQty: "",
            tubStock: 0,
            budget: 35000,
            approvedDate: "2025-12-13",
            designSharedMail: true,
            designStatus: "approved",
            orderStatus: "Artwork Pending",
            designType: "new",
            moveToPurchase: false,
            singleImlDesign: false,
            isCollapsed: false,
            updatedAt: "2025-12-13T10:00:00.000Z",
          },
        ],
        payment: {
          totalEstimated: 35000,
          remarks: "",
        },
        paymentRecords: [],
        status: "pending",
        createdAt: "2025-12-13T08:00:00.000Z",
        updatedAt: "2025-12-13T10:00:00.000Z",
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
    scrollPositionRef.current = window.scrollY;
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

  // Check whether PO details have actually been entered for a product
  const hasPODetailsEntered = (orderId, productId, imlType) => {
    try {
      const raw = localStorage.getItem("iml_purchase_po_details");
      if (!raw) return false;
      const all = JSON.parse(raw);
      const orderPO = all[orderId];
      if (!orderPO?.products) return false;
      const pd = orderPO.products[productId];
      if (!pd) return false;
      if (imlType === "LID & TUB") {
        return !!(pd.lid?.poNumber && pd.lid?.supplier) || !!(pd.tub?.poNumber && pd.tub?.supplier);
      }
      return !!(pd.poNumber && pd.supplier);
    } catch {
      return false;
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
  const handleCloseChangeRequest = (skipRestore = false) => {
    console.log(`Change request close triggered`);
    
    // Check if we're in re-edit mode and need to restore status on cancel
    const isEditMode = sessionStorage.getItem("isEditMode") === "true";
    if (isEditMode && changeRequestModal.order && changeRequestModal.product) {
      const order = changeRequestModal.order;
      const product = changeRequestModal.product;
      
      // Find the current product in orders to check its status
      const currentOrder = orders.find(o => o.id === order.id);
      const currentProduct = currentOrder?.products?.find(p => p.id === product.id);
      
      if (currentProduct && currentProduct.orderStatus === "Order Pending") {
        // Restore based on designStatus: approved → "Artwork Approved", else → "Artwork Pending"
        const restoredStatus = currentProduct.designStatus === "approved"
          ? "Artwork Approved"
          : "Artwork Pending";
        
        const updatedOrders = orders.map(o =>
          o.id === order.id
            ? {
                ...o,
                products: o.products.map(p =>
                  p.id === product.id
                    ? { ...p, orderStatus: restoredStatus }
                    : p
                )
              }
            : o
        );
        setOrders(updatedOrders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
        console.log(`Artwork restored`);
      }
    }
    else {
      console.log(`Artwork not restored`);
    }
    
    sessionStorage.removeItem("isEditMode");
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
    const currentOrder = changeRequestModal.order;
    const currentProduct = changeRequestModal.product;

    if (isEditMode) {
      const remainingProducts = currentOrder.products.filter(
        (p) => p.id !== currentProduct.id
      );

      // 🔥 If this is the LAST product in the order
      if (remainingProducts.length === 0) {
        const hasPaymentRecords = currentOrder.paymentRecords && currentOrder.paymentRecords.length > 0;

        // Close the change request modal first (skip restore since we're deleting)
        handleCloseChangeRequest(true);

        if (!hasPaymentRecords) {
          // No payment → direct delete order modal
          setDeleteOrderModal({
            isOpen: true,
            orderId: currentOrder.id,
            order: currentOrder,
          });
        } else {
          // Has payment → refund modal
          setRefundModal({
            isOpen: true,
            orderId: currentOrder.id,
            order: currentOrder,
            refundRemarks: "",
            refundDocument: null,
            refundDocumentName: "",
          });
        }
        return;
      }

      // 🔥 Multiple products remain → show EstimateRevisionModal (same as edit/change request)
      setTempChangeRequest({
        type: "delete",
        timestamp: now,
        orderId: currentOrder.id,
        productId: currentProduct.id,
        productDetails: currentProduct,
        originalEstimate: currentOrder.orderEstimate,
        isEditMode: true,
      });
      handleCloseChangeRequest(true); // close modal, skip restore
      setEstimateRevisionModal({
        isOpen: true,
        revision: {
          orderId: currentOrder.id,
          productId: currentProduct.id,
          productDetails: currentProduct,
          triggerType: "delete",
          timestamp: now,
          originalEstimate: currentOrder.orderEstimate,
          forceBlankEstimate: true,
          isEditMode: true,
        },
      });
      return;
    }

    // 🔥 Original flow for non-edit mode (change request)
    setTempChangeRequest({
      type: "delete",
      timestamp: now,
      orderId: currentOrder.id,
      productId: currentProduct.id,
      productDetails: currentProduct,
      originalEstimate: currentOrder.orderEstimate,
    });
    handleCloseChangeRequest(true); // Close without persisting
    // Open estimate modal
    setEstimateRevisionModal({
      isOpen: true,
      revision: {
        orderId: currentOrder.id,
        productId: currentProduct.id,
        productDetails: currentProduct,
        triggerType: "delete",
        timestamp: now,
        originalEstimate: currentOrder.orderEstimate,
        forceBlankEstimate: true,
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

    handleCloseChangeRequest(true);

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

    const now = new Date().toISOString();
    const updatedOrders = orders.map((o) =>
      o.id === tempChangeRequest.orderId
        ? {
          ...o,
          updatedAt: now,
          orderEstimate: {
            ...o.orderEstimate,
            estimatedNumber: revisedEstimateNo,
            estimatedValue: revisedEstimateValue,
          },
          products: o.products.map((p) =>
            p.id === tempChangeRequest.productId
              ? { ...p, ...finalProduct, updatedAt: now } // ✅ Apply all changes + stamp date
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


  // 🔥 NEW: Refund Modal - shown when order with payment records is being deleted

  // 🔥 NEW: Refund Details Viewer Modal




  // production modal

  // production history modal

  // 🔥 SIMPLE DELETE CONFIRM MODAL


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
    const now = new Date().toISOString();

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
            id: editingOrder.id,
            createdAt: isValidDate(order.createdAt)
              ? order.createdAt
              : isValidDate(editingOrder.createdAt)
                ? editingOrder.createdAt
                : now,
            updatedAt: now,
            products: (orderData.products || []).map((p) => ({
              ...p,
              updatedAt: p.updatedAt || now,
            })),
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
      const newOrder = {
        ...orderData,
        id: Date.now(),
        createdAt: now,
        updatedAt: now,
        products: (orderData.products || []).map((p) => ({
          ...p,
          updatedAt: now,
        })),
      };
      setOrders([...orders, newOrder]);
    }

    setView("dashboard");
    if (!isNotShowAlert) {
      alert("Your order has been created");
    }
    setEditingOrder(null);
    // Restore scroll position after dashboard renders
    setTimeout(() => { window.scrollTo(0, scrollPositionRef.current); }, 0);
  };

  // Handle cancel from form
  const handleCancel = () => {
    setView("dashboard");
    setEditingOrder(null);
    setTimeout(() => { window.scrollTo(0, scrollPositionRef.current); }, 0);
  };

  // Handle cancel from form
  const handleBack = () => {
    setView("dashboard");
    setEditingOrder(null);
    setTimeout(() => { window.scrollTo(0, scrollPositionRef.current); }, 0);
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
      // const matchesConfirmDelete = !order.orderConfirmDelete;  // Hide if true
      const matchesConfirmDelete = !order.orderConfirmDelete && !order.productDeleted;



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
          <div className="sticky z-[99] top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-[1.25vw] py-[1vw] rounded-t-[1vw] flex justify-between items-center">
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

  const getLabelReceivedStatus = (orderId, productId) => {
    const raw = localStorage.getItem("iml_label_quantity_received");
    if (!raw) return { lidTotal: 0, tubTotal: 0, singleTotal: 0, productComplete: false };
    
    const all = JSON.parse(raw);
    const key = `${orderId}_${productId}`;
    const rec = all[key];
    
    if (!rec) return { lidTotal: 0, tubTotal: 0, singleTotal: 0, productComplete: false };
    
    const history = rec.history || [];
    
    const lidTotal = history.reduce((sum, h) => sum + (h.lidReceivedQuantity ?? 0), 0);
    const tubTotal = history.reduce((sum, h) => sum + (h.tubReceivedQuantity ?? 0), 0);
    const singleTotal = history.reduce((sum, h) => sum + (h.receivedQuantity ?? 0), 0);
    
    return {
      lidTotal,
      tubTotal,
      singleTotal,
      productComplete: rec.productComplete === true,
    };
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
                {(() => {
                  const deleteReqCount = orders.filter(o => o.productDeleted && !o.orderConfirmDelete).length;
                  const refundedOrders = JSON.parse(localStorage.getItem("imlorders_refunded") || "[]");
                  const readIds = new Set(JSON.parse(localStorage.getItem("imlorders_refunded_read") || "[]"));
                  const refundUnread = refundedOrders.filter((o, i) => {
                    const key = o.id || o.orderNumber || String(i);
                    return !readIds.has(key);
                  }).length;

                  return (
                    <>
                      <button
                        onClick={() => {
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
                        className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-[1.25vw] py-[.5vw] rounded-lg font-bold shadow-lg text-[.9vw] cursor-pointer"
                      >
                        📋 Order Delete Request
                        {deleteReqCount > 0 && (
                          <span className="absolute -top-[0.55vw] -right-[0.55vw] bg-red-500 text-white text-[0.62vw] font-bold rounded-full min-w-[1.25vw] h-[1.25vw] flex items-center justify-center px-[0.2vw] shadow-md">
                            {deleteReqCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setRefundDetailsModal({ isOpen: true })}
                        className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-[1.25vw] py-[.5vw] rounded-lg font-bold shadow-lg text-[.9vw] cursor-pointer"
                      >
                        💰 Order Refund Details
                        {refundUnread > 0 && (
                          <span className="absolute -top-[0.55vw] -right-[0.55vw] bg-red-500 text-white text-[0.62vw] font-bold rounded-full min-w-[1.25vw] h-[1.25vw] flex items-center justify-center px-[0.2vw] shadow-md">
                            {refundUnread}
                          </span>
                        )}
                      </button>
                    </>
                  );
                })()}

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
                                    <div className="flex gap-6 mt-2 text-[.85vw] text-gray-500">
                                      {order.createdAt && (
                                        <span>
                                          <strong>Created:</strong>{" "}
                                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                      )}
                                      {order.updatedAt && (
                                        <span>
                                          <strong>Last Updated:</strong>{" "}
                                          {new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                      )}
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
                                              Label Status
                                            </th>

                                            <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                              Order Status
                                            </th>

                                            {viewMode === "all" && (
                                              <th className="border border-gray-300 px-[1.25vw] py-[.75vw] text-center text-[.85vw] font-semibold">
                                                Last Updated
                                              </th>
                                            )}

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

                                              const { lidTotal, tubTotal, singleTotal, productComplete: isProductComplete } = getLabelReceivedStatus(order.id, product.id);
                                              let labelStatusText = 'None';

                                              if (isProductComplete) {
                                                labelStatusText = 'All labels received';
                                              }
                                              else {
                                                if (product.imlType === "LID & TUB") {
                                                  if (lidTotal > 0 || tubTotal > 0) {
                                                    labelStatusText = 'Labels In-Progress';
                                                  }
                                                }
                                                else {
                                                  if (singleTotal > 0) {
                                                    labelStatusText = 'Labels In-Progress';
                                                  }
                                                  else {
                                                    labelStatusText = 'None';
                                                  }
                                                }
                                              }

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
                                                   {
                                                    <>
                                                    <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.8vw] text-gray-900 text-center whitespace-nowrap">
                                                      {labelStatusText}
                                                    </td>
                                                    </>
                                                  }

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
                                                        product.orderStatus === "Artwork Approved"
                                                          ? "bg-green-100 text-green-700"
                                                          : product.orderStatus === "Production Completed"
                                                          ? "bg-emerald-100 text-emerald-700"
                                                          : product.orderStatus === "In Production"
                                                          ? "bg-cyan-100 text-cyan-700"
                                                          : product.orderStatus === "Production Pending"
                                                          ? "bg-amber-100 text-amber-700"
                                                          : product.orderStatus === "PO Raised & Awaiting for Labels"
                                                          ? "bg-yellow-100 text-yellow-700"
                                                          : product.orderStatus === "Dispatch Pending"
                                                          ? "bg-purple-100 text-purple-700"
                                                          : "bg-gray-100 text-gray-700"
                                                      }`}
                                                    >
                                                      {product.orderStatus ||
                                                        "Artwork Pending"}
                                                    </span>
                                                  </td>
                                                  
                                                  {viewMode === "all" && (
                                                    <td className="border border-gray-300 px-[1.25vw] py-[.75vw] text-[.8vw] text-gray-500 text-center whitespace-nowrap">
                                                      {product.updatedAt
                                                        ? new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                        : "—"}
                                                    </td>
                                                  )}
                                                 
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
                                                            (order.paymentRecords && order.paymentRecords.length > 0) ? (
                                                            <>
                                                              {!product.moveToPurchase ? (
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
                                                              ) : !hasPODetailsEntered(order.id, product.id, product.imlType) ? (
                                                                <button
                                                                  onClick={() =>
                                                                    navigate("/iml/purchase/po-details", {
                                                                      state: {
                                                                        orderId: order.id,
                                                                        fromOrdersManagement: true,
                                                                        movedProductId: product.id,
                                                                        mode: "single-product",
                                                                      },
                                                                    })
                                                                  }
                                                                  className="px-[.2vw] py-[0.4vw] cursor-pointer bg-amber-500 text-white rounded hover:bg-amber-600 text-[.75vw] font-medium transition-all w-full whitespace-pre"
                                                                >
                                                                  ⚠️ Enter PO Details
                                                                </button>
                                                              ) : null}
                                                            </>
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

      <PreviewModal
        previewModal={previewModal}
        previewModalRef={previewModalRef}
        setPreviewModal={setPreviewModal}
      />

      <ProductionAllocationModal
        orders={orders}
        productionModal={productionModal}
        setOrders={setOrders}
        setProductionModal={setProductionModal}
      />
      <ProductionHistoryModal
        productionHistoryModal={productionHistoryModal}
        setProductionHistoryModal={setProductionHistoryModal}
        calculateRemainingLabels={calculateRemainingLabels}
      />
      <ProductDeleteConfirmModal
        orders={orders}
        productDeleteConfirm={productDeleteConfirm}
        setOrders={setOrders}
        setProductDeleteConfirm={setProductDeleteConfirm}
      />
      <AllInvoicesModal
        allInvoicesModal={allInvoicesModal}
        allInvoicesTab={allInvoicesTab}
        orders={orders}
        setAllInvoicesModal={setAllInvoicesModal}
        setAllInvoicesTab={setAllInvoicesTab}
        setOrders={setOrders}
      />
      {refundModal.isOpen && <RefundModal
        orders={orders}
        refundModal={refundModal}
        setOrders={setOrders}
        setRefundModal={setRefundModal}
      />}
      <RefundDetailsModal
        orders={orders}
        refundDetailsModal={refundDetailsModal}
        setRefundDetailsModal={setRefundDetailsModal}
      />


      {changeRequestModal.isOpen && <ChangeRequestModal
        changeRequestModal={changeRequestModal}
        setPreviewModal={setPreviewModal}
        handleCloseChangeRequest={handleCloseChangeRequest}
        handleSubmitRequest={handleSubmitRequest}
        handleDeleteRequest={handleDeleteRequest}
        getTodayDate={getTodayDate}
        getAllowedIMLType={getAllowedIMLType}
        COLOR_OPTIONS={COLOR_OPTIONS}
        IMLNAME_OPTIONS={IMLNAME_OPTIONS}
      />}
      {viewRequestModal.isOpen && <ViewRequestModal
        orders={orders}
        setOrders={setOrders}
        setViewRequestModal={setViewRequestModal}
        viewRequestModal={viewRequestModal}
      />}
      {estimateRevisionModal.isOpen && <EstimateRevisionModal
        estimateRevisionModal={estimateRevisionModal}
        orders={orders}
        setConfirmState={setConfirmState}
        setEstimateRevisionModal={setEstimateRevisionModal}
        setOrders={setOrders}
        tempChangeRequest={tempChangeRequest}
        navigate={navigate}
        handleDirectSave={handleDirectSave}
        handleSendAsRequest={handleSendAsRequest}
        hasMovedToPurchase={hasMovedToPurchase}
      />}
      {invoiceModal.isOpen && <ViewInvoice
        invoiceModal={invoiceModal}
        orders={orders}
        setInvoiceModal={setInvoiceModal}
      />}
      {invoiceCreateModal.isOpen && <InvoiceModal
        invoiceCreateModal={invoiceCreateModal}
        orders={orders}
        setInvoiceCreateModal={setInvoiceCreateModal}
        setInvoiceViewerModal={setInvoiceViewerModal}
        setOrders={setOrders}
        setViewRequestModal={setViewRequestModal}
      />}
      {deleteOrderModal.isOpen && <OrderDeletionModal
        deleteOrderModal={deleteOrderModal}
        setDeleteOrderModal={setDeleteOrderModal}
        setOrderInvoiceModal={setOrderInvoiceModal}
      />}
      {orderInvoiceModal.isOpen && <OrderDeleteInvoiceModal
        orderInvoiceModal={orderInvoiceModal}
        orders={orders}
        setDeleteOrderModal={setDeleteOrderModal}
        setOrderInvoiceModal={setOrderInvoiceModal}
        setOrders={setOrders}
      />}
      {deletedOrderInvoicesModal.isOpen && <OrderInvoiceModalView
        deletedOrderInvoicesModal={deletedOrderInvoicesModal}
        orders={orders}
        setDeletedOrderInvoicesModal={setDeletedOrderInvoicesModal}
      />}
       <ConfirmModal
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onYes={confirmState.onYes}
        onNo={confirmState.onNo}
      />
 
    </div>
  );
}