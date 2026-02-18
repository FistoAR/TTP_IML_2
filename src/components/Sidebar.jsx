import React, { useState, useRef, useEffect } from "react";

import {
  IconLogo,
  IconDashboard,
  IconCart,
  IconChevronDown,
  IconFilePlus,
  IconBox,
  IconSettings,
  IconBarChart,
} from "./MainIcons.jsx";

import TerraTechPacks from "../assets/TerraTechPacks.png";
import { Link, useLocation } from "react-router-dom";

// --- Helper Components ---

// Smooth Collapse Container for submenus
const SmoothCollapse = ({ isOpen, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState("0px");

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        if (contentRef.current) {
          setHeight(`${contentRef.current.scrollHeight}px`);
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      setHeight("0px");
    }
  }, [isOpen]);

  return (
    <div
      ref={contentRef}
      style={{ height, overflow: "hidden" }}
      className="transition-all duration-300 ease-in-out"
    >
      <div className="py-[0.15vw] space-y-[0.2vw]">{children}</div>
    </div>
  );
};

// MenuItem (Note: removed outer padding div here to let the parent container handle spacing)
const MenuItem = ({ icon: IconComponent, text, isActive, hasSub, onClick }) => {
  const baseClasses = `flex items-center gap-[0.7vw] w-full px-[1.2vw] py-[0.8vw] rounded-[0.4vw] cursor-pointer transition-all`;

  // Active style: Cyan background
  const activeClasses = "bg-[#22d3ee] shadow-lg text-white font-medium";

  // Inactive style
  const inactiveClasses = "hover:bg-white/10 text-white/90";

  return (
    <div
      className={`
                ${baseClasses} 
                ${isActive ? activeClasses : inactiveClasses}
            `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-[0.7vw]">
          <IconComponent className="w-[1.2vw] h-[1.2vw] min-w-[1.2vw]" />

          <span className="text-[.85vw]">{text}</span>
        </div>

        {hasSub && (
          <IconChevronDown
            className={`w-[0.9vw] h-[0.9vw] transition-transform ${
              isActive ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
    </div>
  );
};

// SubMenuItem
const SubMenuItem = ({ text, icon: IconComponent, isSelected }) => (
  // Added subtle horizontal padding to indent subitems slightly inside the border
  <div className={`px-[0vw] mt-[0.1vw]`}>
    <div
      className={`flex items-center gap-[0.7vw] w-full px-[1.2vw] py-[0.8vw] rounded-[0.4vw] cursor-pointer transition-colors text-[.85vw]
                ${
                  isSelected
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }
            `}
    >
      <IconComponent className="w-[1.2vw] h-[1.2vw] min-w-[1.2vw]" />

      <span>{text}</span>
    </div>
  </div>
);

// --- Main Sidebar Component ---

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const location = useLocation();
  const currentPath = location.pathname;

  // Active menu detection
  const isOverviewActive = currentPath === '/overview';

  const isOrdersActive = currentPath.startsWith("/iml");
  const isScreenPrintingActive = currentPath.startsWith("/screen");

  // IML link boolean
  const isNewOrder = currentPath === "/iml/new-order";

  const isPurchase = currentPath === "/iml/purchaseManagement" || currentPath === "/iml/purchase-details" || currentPath === "/iml/purchase" || currentPath === "iml/purchase/label-quantity-sheet" || currentPath === "/iml/purchase/po-details" || currentPath === "/iml/purchase/label-quantity-sheet";

  const isProduction = currentPath === "/iml/productionManagement" || currentPath === "/iml/production-details" || currentPath === "/iml/production" || currentPath === "/iml/production/details";

  const isInventory = currentPath === "/iml/inventoryManagement" || currentPath === "/iml/inventory-details" || currentPath === "/iml/inventory" || currentPath === "/iml/inventory/details";

  const isSales = currentPath === "/iml/sales" || currentPath === "/iml/sales-details" || currentPath === "/iml/sales-payment/details";

  const isBilling = currentPath === "/iml/billingManagement" || currentPath === "/iml/billing-details";

  const isDispatch = currentPath === "/iml/dispatchManagement" || currentPath === "/iml/dispatch-details";
  const isStocks = currentPath === "/iml/stocks";

  // Screen Printing link boolean
  const isScreenNewOrder = currentPath === "/screen-printing/orders" || currentPath === "screen-printing/order-details";
  const isStocksCheck = currentPath === "/screen-printing/jobwork" || currentPath === "/screen-printing/jobwork-details" || currentPath === "/screen-printing/goods-returned";
  const isScreenBilling = currentPath === "/screen-printing/billing" || currentPath === "/screen-printing/billing/details";
  const isScreenDispatch = currentPath === "/screen-printing/dispatch" || currentPath === "/screen-printing/dispatch/details";
  const isScreenStocks = currentPath === "/screen-printing/stocks" || currentPath === "/screen-printing/stocks/details";

  const isScreenSales = currentPath === "/screen-printing/sales-payment" || currentPath === "/screen-printing/sales-payment/details";

  const isPlainStocks = currentPath === "/stock";
  const isReports = currentPath === "/reports";

  useEffect(() => {
    if (isOrdersActive) {
      setOpenMenu("orders");
    } else if (isScreenPrintingActive) {
      setOpenMenu("screenPrinting");
    } else {
      setOpenMenu(null);
    }
  }, [currentPath]);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Helper function to get classes for the wrapper
  // This applies the border, background, and padding when open
  const getWrapperClass = (menuName) => {
    const isOpen = openMenu === menuName;
    return `
            transition-all duration-300 ease-in-out px-[0.5vw]
            ${
              isOpen
                ? "border-[0.1vw] border-white/30 bg-white/5 rounded-[0.8vw] px-[0vw] my-[0.5vw] mx-[0.5vw]" // Open styles
                : "border-transparent py-[0.2vw]" // Closed styles (keeps layout stable)
            }
        `;
  };

  return (
    <aside
      className="w-[15%] left-0 top-0 h-screen text-white flex flex-col overflow-y-auto z-50 shadow-2xl"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, #2638A0 60%, #2485B8 100%)",
      }}
    >
      {/* Brand */}

      <div className="h-[5vw] flex items-center px-[1.5vw] border-b border-white/10 justify-center">
        <div className="h-[5vw] flex items-center">
          <img
            src={TerraTechPacks}
            alt="TerraTech Packs Logo"
            className="w-[9.5vw] "
          />
        </div>
      </div>

      {/* Menu */}

      <nav className="flex-1 py-[1.5vw] flex flex-col gap-[0.25vw] max-h-full overflow-y-auto custom-scrollbar ">
        {/* Standard Item (Wrapper added for alignment consistency) */}

        <div className="px-[0.5vw]">
          <Link to='/overview'>
            <MenuItem
              icon={IconDashboard}
              text="Overview"
              isActive={isOverviewActive}
              onClick={() => {}}
            />
          </Link>
        </div>

        {/* --- IML / ORDERS SECTION --- */}

        <div className={getWrapperClass("orders")}>
          <MenuItem
            icon={IconCart}
            text="IML / Orders"
            hasSub={true}
            isActive={isOrdersActive}
            onClick={() => toggleMenu("orders")}
          />

          <SmoothCollapse isOpen={openMenu === "orders"}>
            <Link to="/iml/new-order">
              <SubMenuItem
                text="New order"
                icon={IconFilePlus}
                isSelected={isNewOrder}
              />
            </Link>

            <Link to="/iml/purchase">
              <SubMenuItem
                text="Purchase"
                icon={IconBox}
                isSelected={isPurchase}
              />
            </Link>

            <Link to="/iml/production">
              <SubMenuItem
                text="Production"
                icon={IconSettings}
                isSelected={isProduction}
              />
            </Link>

            <Link to="/iml/inventory">
              <SubMenuItem text="Inventory" icon={IconBox} isSelected={isInventory} />
            </Link>
            
            <Link to="/iml/sales">
              <SubMenuItem text="Sales Payment" icon={IconBox} isSelected={isSales} />
            </Link>

            <Link to="/iml/billingManagement">
              <SubMenuItem
                text="Billings"
                icon={IconDashboard}
                isSelected={isBilling}
              />
            </Link>

            <Link to="/iml/dispatchManagement">
              <SubMenuItem
                text="Dispatch"
                icon={IconDashboard}
                isSelected={isDispatch}
              />
            </Link>

            <Link to="/iml/stocks">
              <SubMenuItem
                text="Stocks"
                icon={IconDashboard}
                isSelected={isStocks}
              />
            </Link>
          </SmoothCollapse>
        </div>

        {/* --- SCREEN PRINTING SECTION --- */}

        <div className={getWrapperClass("screenPrinting")}>
          <MenuItem
            icon={IconSettings}
            text="Screen Printing"
            hasSub={true}
            isActive={isScreenPrintingActive}
            onClick={() => toggleMenu("screenPrinting")}
          />

          <SmoothCollapse isOpen={openMenu === "screenPrinting"}>
            <Link to="/screen-printing/orders">
              <SubMenuItem
                text="New order"
                icon={IconFilePlus}
                isSelected={isScreenNewOrder}
              />
            </Link>

            <Link to="/screen-printing/jobwork">
                <SubMenuItem
                  text="Screen Printing"
                  icon={IconBox}
                  isSelected={isStocksCheck}
                />
            </Link>

              <Link to="/screen-printing/stocks">
              <SubMenuItem
                text="Stocks"
                icon={IconDashboard}
                isSelected={isScreenStocks}
              />
            </Link>

            <Link to="/screen-printing/sales-payment">
              <SubMenuItem
                text="Sales Payment"
                icon={IconDashboard}
                isSelected={isScreenSales}
              />
            </Link>
            <Link to="/screen-printing/billing">
              <SubMenuItem
                text="Billing"
                icon={IconDashboard}
                isSelected={isScreenBilling}
              />
            </Link>

            <Link to="/screen-printing/dispatch">
              <SubMenuItem
                text="Dispatch"
                icon={IconDashboard}
                isSelected={isScreenDispatch}
              />
            </Link>

          
          </SmoothCollapse>
        </div>

        {/* Standard Item */}

        <div className="px-[0.5vw]">
          <Link to="/stock">
            <MenuItem
              icon={IconDashboard}
              text="Stocks"
              isActive={isPlainStocks}
              onClick={() => {}}
            />
          </Link>
        </div>

        <div className="px-[0.5vw]">
          <Link to="/reports">
            <MenuItem
              icon={IconBarChart}
              text="Reports"
              isActive={isReports}
              onClick={() => {}}
            />
          </Link>
        </div>
      </nav>

      {/* Profile */}

      <div className="sticky bottom-[0] p-[1.5vw] border-t border-white/10 flex items-center gap-[1vw] bg-black/10">
        <div className="w-[3vw] h-[3vw] rounded-full bg-gray-300 border-[0.15vw] border-white overflow-hidden shadow-md">
          <img
            src="https://i.pravatar.cc/150?img=12"
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <div className="text-[.95vw] font-semibold">User Name</div>

          <div className="text-[0.8vw] opacity-70">Admin</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
