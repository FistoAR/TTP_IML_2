import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock data storage (In production, this would be an API/Database)
const STORAGE_KEY = "iml_orders";

// Product size options for initial expansion
const PRODUCT_SIZE_OPTIONS = {
  Round: ["120ml", "250ml", "300ml", "500ml", "1000ml"],
  "Round Square": ["450ml", "500ml"],
  Rectangle: ["500ml", "650ml", "750ml"],
  "Sweet Box": ["250gms", "500gms"],
  "Sweet Box TE": ["TE 250gms", "TE 500gms"],
}; 

const Overview = () => {
    

  const [orders, setOrders] = useState([]);
 

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
        id: 1702456789001,
        contact: {
          company: "ABC Industries",
          contactName: "John Smith",
          phone: "9876543210",
          imlName: "Premium IML Labels",
          priority: "high",
        },
        products: [
          {
            id: 1,
            orderNumber: "ORD-1702456789001-123",
            productName: "Round",
            size: "500ml",
            lidColor: { r: 255, g: 100, b: 100, a: 1 },
            tubColor: { r: 100, g: 150, b: 255, a: 1 },
            imlType: "LID",
            lidLabelQty: "10000",
            lidProductionQty: "9500",
            lidStock: 500,
            tubLabelQty: "",
            tubProductionQty: "",
            tubStock: 0,
            budget: 25000,
            approvedDate: "2025-12-10",
            designSharedMail: true,
            designStatus: "approved",
          },
        ],
        payment: {
          totalEstimated: "25000",
          remarks: "First payment received",
        },
        paymentRecords: [
          {
            timestamp: "2025-12-10T10:30:00.000Z",
            paymentType: "advance",
            method: "UPI",
            amount: "10000",
            remarks: "Advance payment",
            productIds: [1],
          },
        ],
        status: "pending",
        createdAt: "2025-12-10T08:00:00.000Z",
      },
      {
        id: 1702456789002,
        contact: {
          company: "XYZ Corporation",
          contactName: "Jane Doe",
          phone: "9123456780",
          imlName: "Quality IML Solutions",
          priority: "medium",
        },
        products: [
          {
            id: 1,
            orderNumber: "ORD-1702456789002-456",
            productName: "Rectangle",
            size: "750ml",
            lidColor: { r: 100, g: 255, b: 100, a: 1 },
            tubColor: { r: 255, g: 200, b: 50, a: 1 },
            imlType: "TUB",
            lidLabelQty: "",
            lidProductionQty: "",
            lidStock: 0,
            tubLabelQty: "15000",
            tubProductionQty: "14500",
            tubStock: 500,
            budget: 35000,
            approvedDate: "2025-12-11",
            designSharedMail: true,
            designStatus: "pending",
          },
        ],
        payment: {
          totalEstimated: "35000",
          remarks: "",
        },
        paymentRecords: [],
        status: "pending",
        createdAt: "2025-12-11T09:30:00.000Z",
      },
    ];

    setOrders(dummyOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyOrders));
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


    return(
        <div className="p-[1vw]">
             {/* Dashboard Stats Cards with SVG Icons */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-[1vw]">
        {/* Total Orders Card */}

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-[0.75vw] border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-medium text-[.9vw]">
              Total Orders
            </span>

            <div className="w-[2vw] h-[2vw] bg-[#3d64bb] rounded-[0.5vw] flex items-center justify-center">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-white"
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
          </div>

          <div className="text-[1.25vw] font-bold text-blue-900">
            {stats.total}
          </div>
        </div>

        {/* Pending Card */}

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-[0.75vw] border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 font-medium text-[.9vw]">
              Artwork Pending
            </span>

            <div className="w-[2vw] h-[2vw] bg-orange-500 rounded-[0.5vw] flex items-center justify-center">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="text-[1.25vw] font-bold text-orange-900">
            {stats.artworkPending}
          </div>
        </div>

        {/* Completed Card */}

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-[0.75vw] border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium text-[.9vw]">
              Artwork Approved
            </span>

            <div className="w-[2vw] h-[2vw] bg-green-500 rounded-[0.5vw] flex items-center justify-center">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="text-[1.25vw] font-bold text-green-900">
            {stats.artworkApproved}
          </div>
        </div>

        {/* In Progress Card */}

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-[0.75vw] border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-yellow-700 font-medium text-[.9vw]">
              Moved to Purchase
            </span>

            <div className="w-[2vw] h-[2vw] bg-yellow-500 rounded-[0.5vw] flex items-center justify-center">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <div className="text-[1.25vw] font-bold text-yellow-900">
            {stats.movedToPurchase}
          </div>
        </div>
      </div>
        </div>
    );
}

export default Overview;