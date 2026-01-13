import { Routes, Route, Navigate  } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import NewOrder from "./pages/IML/OrderManagement/NewOrder";
import ScrollToTop from "./ScrollToTop";
import LoginPage from './pages/LoginPage';

// Overview
import Overview from './pages/Overview'

// IML PAGES IMPORT
// order management
import OrdersManagement from "./pages/IML/OrderManagement/OrdersManagement";
// purchase management
import PurchaseDetails2 from "./pages/IML/PurchaseManagement/PurchaseDetails2";
import PODetails from "./pages/IML/PurchaseManagement/PODetails";
import LabelQuantitySheet from "./pages/IML/PurchaseManagement/LabelQuantitySheet";
// production management
import ProductionManagement2 from "./pages/IML/ProductionManagement/ProductionManagement2";
import ProductionDetails2 from "./pages/IML/ProductionManagement/ProductionDetails2";
// inventory management
import InventoryManagement2 from "./pages/IML/InventoryManagement/InventoryManagement2";
import InventoryDetails2 from "./pages/IML/InventoryManagement/InventoryDetails2";
// Sales payment management
import SalesPayment from "./pages/IML/SalesPaymentManagement/SalesPayment";
import SalesPaymentDetails from "./pages/IML/SalesPaymentManagement/SalesPaymentDetails";
// Billings management
import BillingManagement from "./pages/IML/BillingsManagement/BillingManagement";
import BillingDetails from "./pages/IML/BillingsManagement/BillingDetails";
// Dispatch management
import DispatchManagement from "./pages/IML/DispatchManagement/DispatchManagement";
import DispatchDetails from "./pages/IML/DispatchManagement/DispatchDetails";
import IMLStocks from './pages/IML/Stocks';

// SCREEN PRINTING PAGES IMPORT
// order management
import ScreenPrintingOrders from "./pages/ScreenPrinting/OrderManagement/ScreenPrintingOrders";
import ScreenPrintingOrderDetails from "./pages/ScreenPrinting/OrderManagement/ScreenPrintingOrderDetails";
// screen printing management
import ScreenPrintingJobWork from "./pages/ScreenPrinting/ScreenPrintingManagement/ScreenPrintingJobWork";
import JobWorkDetails from "./pages/ScreenPrinting/ScreenPrintingManagement/JobWorkDetails";
import GoodsReturned from "./pages/ScreenPrinting/ScreenPrintingManagement/GoodsReturned";
// stocks management
import ScreenPrintingStocks from './pages/ScreenPrinting/StocksManagement/Stocks';
import StocksDetails from "./pages/ScreenPrinting/StocksManagement/StocksDetails";
// Sales payment management
import ScreenSalesPayment from "./pages/ScreenPrinting/SalesPaymentManagement/SalesPayment";
import ScreenSalesPaymentDetails from "./pages/ScreenPrinting/SalesPaymentManagement/SalesPaymentDetails";
// billing management
import ScreenBilling from "./pages/ScreenPrinting/BillingManagement/Billing";
import ScreenBillingDetails from "./pages/ScreenPrinting/BillingManagement/BillingDetails";
// dispatch management
import ScreenDispatch from "./pages/ScreenPrinting/DispatchManagement/Dispatch";
import ScreenDispatchDetails from "./pages/ScreenPrinting/DispatchManagement/DispatchDetails";

// STOKC
import Stock from "./pages/Stock";

// REPORTS
import Reports from "./pages/Reports";

function App() {
  return (
    <>
      <ScrollToTop />   {/* ✅ Correct: OUTSIDE Routes */}

      <Routes>
        <Route path="/" element={<MainLayout />}>

          {/* ✅ Default redirect */}
          <Route index element={<Navigate to="iml/new-order" replace />} />

          {/* Overview */}
          <Route path='overview' element={<Overview />} />
          
          {/* IML Routes */}
          {/* New order management */}
          <Route path="iml/new-order" element={<OrdersManagement />} />

          {/* Purchase Management */}
          <Route path="iml/purchase" element={<PurchaseDetails2 />} />
          <Route path="iml/purchase/po-details" element={<PODetails />} />
          <Route path="iml/purchase/label-quantity-sheet" element={<LabelQuantitySheet />} />
          
          {/* Production Management */}
          <Route path="iml/production" element={<ProductionManagement2 />} />
          <Route path="iml/production/details" element={<ProductionDetails2 />} />
          
          {/* Inventory Management */}          
          <Route path="iml/inventory" element={<InventoryManagement2 />} />
          <Route path="iml/inventory/details" element={<InventoryDetails2 />} />

          {/* Sales payment management */}
          <Route path="iml/sales" element={<SalesPayment />} />
          <Route path="iml/sales-details" element={<SalesPaymentDetails />} />


          {/* Billing Management */}
          <Route path="iml/billingManagement" element={<BillingManagement />} />
          <Route path="iml/billing-details" element={<BillingDetails />} />
          {/* Dispatch Management */}
          <Route path="iml/dispatchManagement" element={<DispatchManagement />} />
          <Route path="iml/dispatch-details" element={<DispatchDetails />} />
          {/* IML Stocks */}
          <Route path="iml/stocks" element={<IMLStocks />} />


          {/* Screen Printing Routes */}
          {/* Order Management */}
          <Route path="screen-printing/orders" element={<ScreenPrintingOrders />} />
          <Route path="screen-printing/order-details" element={<ScreenPrintingOrderDetails />} />
          {/* Screen Printing - Job Work / Goods Returned */}
          <Route path="screen-printing/jobwork" element={<ScreenPrintingJobWork />} />
          <Route path="screen-printing/jobwork-details" element={<JobWorkDetails />} />
          <Route path="screen-printing/goods-returned" element={<GoodsReturned />} />
          
          {/* Screen Printing Stocks */}
          <Route path="screen-printing/stocks" element={<ScreenPrintingStocks />} />
          <Route path="screen-printing/stocks/details" element={<StocksDetails />} />
          {/* Sales Payment Management */}
          <Route path="screen-printing/sales-payment" element={<ScreenSalesPayment />} />
          <Route path="screen-printing/sales-payment/details" element={<ScreenSalesPaymentDetails />} />
          {/* Billing Management */}
          <Route path="screen-printing/billing" element={<ScreenBilling />} />
          <Route path="screen-printing/billing/details" element={<ScreenBillingDetails />} />
          {/* Dispatch Management */}
          <Route path="screen-printing/dispatch" element={<ScreenDispatch />} />
          <Route path="screen-printing/dispatch/details" element={<ScreenDispatchDetails />} />
          

          {/* Stock - Plain box */}
          <Route path="stock" element={<Stock />} />
          {/* Reports */}
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  );
}

export default App;
