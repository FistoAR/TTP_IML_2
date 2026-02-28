// SalesPaymentDetails.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_SALES_BILLING = "iml_sales_billing";

const SalesPaymentDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { orderDetails, products, companyName } = location.state || {};

    const [form, setForm] = useState({
        estimatedAmount: "",
    });

    const [totalFinalQty, setTotalFinalQty] = useState(0);
    const [estimatedNo, setEstimatedNo] = useState("");
    const [totalEstimatedAmount, setTotalEstimatedAmount] = useState(0);

    useEffect(() => {
    if (products && products.length > 0 && orderDetails) {
        const total = products.reduce((sum, product) => {
            return sum + (product.finalQty || 0);
        }, 0);
        setTotalFinalQty(total);

        // Fetch the complete order data from localStorage to get orderEstimate
        const storedOrders = localStorage.getItem("imlorders");
        if (storedOrders) {
            const allOrders = JSON.parse(storedOrders);
            const currentOrder = allOrders.find(order => order.id === orderDetails.orderId);
            
            if (currentOrder) {
                // Get estimated number from order
                setEstimatedNo(currentOrder.orderEstimate?.estimatedNumber || "N/A");
                
                // Get total estimated amount from order (or default to 0)
                const totalEstAmount = parseFloat(currentOrder.orderEstimate?.estimatedValue) || 0;
                setTotalEstimatedAmount(totalEstAmount);
                
                // Pre-fill final amount with estimated amount
                setForm(prev => ({
                    ...prev,
                    estimatedAmount: totalEstAmount > 0 ? totalEstAmount.toString() : ""
                }));
            } else {
                setEstimatedNo("N/A");
                setTotalEstimatedAmount(0);
                setForm(prev => ({
                    ...prev,
                    estimatedAmount: ""
                }));
            }
        }
    }
}, [products, orderDetails]);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveEstimate = () => {
        if (!form.estimatedAmount) {
            alert("Please enter estimated amount");
            return;
        }

        const amount = parseFloat(form.estimatedAmount);
        if (amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        // Update the order's estimated amount in localStorage
        const storedOrders = localStorage.getItem("imlorders");
        if (storedOrders) {
            const allOrders = JSON.parse(storedOrders);
            const orderIndex = allOrders.findIndex(order => order.id === orderDetails.orderId);

            if (orderIndex !== -1) {
                // Update the estimated amount in the order
                if (!allOrders[orderIndex].orderEstimate) {
                    allOrders[orderIndex].orderEstimate = {};
                }

                allOrders[orderIndex].orderEstimate.estimatedValue = amount;

                // Save back to localStorage
                localStorage.setItem("imlorders", JSON.stringify(allOrders));

                // Update local state
                setTotalEstimatedAmount(amount);

                alert("✅ Estimated amount saved successfully!");
            } else {
                alert("❌ Order not found!");
            }
        }
    };


    const handleSendToBilling = () => {
        if (!form.estimatedAmount) {
            alert("Please enter estimated amount");
            return;
        }

        const amount = parseFloat(form.estimatedAmount);
        if (amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const billingData = {
            id: `${orderDetails.orderId}_${Date.now()}`,
            orderId: orderDetails.orderId,
            orderNumber: orderDetails.orderNumber,
            companyName: companyName,
            contactName: orderDetails.contactName,
            phone: orderDetails.phone,
            email: orderDetails.email,
            address: orderDetails.address,
            products: products,
            totalFinalQty: totalFinalQty,
            estimatedAmount: amount,
            billingDate: new Date().toISOString(),
            status: "Pending Payment",
        };

        // Save to localStorage
        const stored = localStorage.getItem(STORAGE_KEY_SALES_BILLING);
        const allBillingData = stored ? JSON.parse(stored) : [];
        allBillingData.push(billingData);
        localStorage.setItem(
            STORAGE_KEY_SALES_BILLING,
            JSON.stringify(allBillingData)
        );

        alert("✅ Bill sent successfully!");
        navigate("/iml/sales", {
            state: { refreshData: true },
        });
    };

    const handleBack = () => {
        navigate("/iml/sales");
    };

    if (!orderDetails || !products) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Invalid Access
                    </h2>
                    <p className="text-gray-600 mb-4">No order information provided</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
                    >
                        Back to Sales Management
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-[1vw]">
            <div className="max-w-[90vw] mx-auto bg-white rounded-[0.8vw] shadow-sm">
                {/* Header */}
                <div className="flex justify-between items-center p-[1vw] px-[1.5vw] border-b border-gray-200">
                    <button
                        className="flex gap-[.5vw] items-center cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={handleBack}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-[1vw] h-[1vw]"
                        >
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        <span className="text-[1vw]">Back</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-[1.5vw] font-semibold text-gray-800 m-0">
                            Sales Payment & Billing
                        </h1>
                        <p className="text-[.85vw] text-gray-600 mt-1">
                            Order #{orderDetails.orderNumber} - {companyName}
                        </p>
                    </div>
                    <div className="w-[3vw]"></div>
                </div>

                <div className="p-[1.5vw]">
                    <div className="space-y-[1.5vw] max-h-[65vh] overflow-y-auto">
                        {/* Order Details */}
                        {/* Order Details */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
                            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
                                <span className="text-[1.3vw]">📋</span> Order Details
                            </h3>
                            <div className="grid grid-cols-4 gap-[1vw]">
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Company Name
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                                        {companyName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Contact Person
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]">
                                        {orderDetails.contactName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Phone Number
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw]">
                                        {orderDetails.phone}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Estimated No.
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-cyan-100 border border-cyan-300 rounded-[0.4vw] font-semibold text-cyan-800">
                                        {estimatedNo}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Products Table */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
                            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2">
                                <span className="text-[1.3vw]">📦</span> Product Details
                            </h3>
                            <div className="overflow-x-auto rounded-lg">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-purple-100">
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                S.No
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                IML Name
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                Product Category
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                Size
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                IML Type
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                Lid/Tub Color
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                Order Qty
                                            </th>
                                            <th className="border border-purple-300 px-[1vw] py-[.6vw] text-left text-[.8vw] font-semibold text-purple-900">
                                                Final Qty
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, idx) => (
                                            <tr key={idx} className="hover:bg-purple-50">
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw]">
                                                    {idx + 1}
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw] font-semibold text-purple-700">
                                                    {product.imlName}
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw]">
                                                    {product.productCategory}
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw]">
                                                    {product.size}
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw]">
                                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[.75vw] font-semibold">
                                                        {product.imlType}
                                                    </span>
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw]">
                                                    {product.lidColor} / {product.tubColor}
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw] font-semibold text-blue-700">
                                                    {product.orderQuantity.toLocaleString("en-IN")}
                                                </td>
                                                <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.8vw] font-bold text-green-700">
                                                    {product.finalQty.toLocaleString("en-IN")}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-purple-200">
                                            <td
                                                colSpan="7"
                                                className="border border-purple-300 px-[1vw] py-[.6vw] text-right text-[.9vw] font-bold text-purple-900"
                                            >
                                                Total Final Quantity:
                                            </td>
                                            <td className="border border-purple-300 px-[1vw] py-[.6vw] text-[.9vw] font-bold text-green-700">
                                                {totalFinalQty.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Billing Amount */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[0.6vw] border-2 border-green-200 p-[1vw]">
                            <h3 className="text-[1.1vw] font-semibold text-green-900 mb-[1vw] flex items-center gap-2">
                                <span className="text-[1.3vw]">💰</span> Billing Information
                            </h3>
                            <div className="grid grid-cols-3 gap-[1vw]">
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Total Quantity for Billing
                                    </label>
                                    <div className="text-[1vw] px-[0.75vw] py-[0.5vw] bg-blue-100 border-2 border-blue-300 rounded-[0.4vw] font-bold text-blue-800">
                                        {totalFinalQty.toLocaleString("en-IN")} units
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Total Estimated Amount (₹)
                                    </label>
                                    <div className="text-[1vw] px-[0.75vw] py-[0.5vw] bg-amber-100 border-2 border-amber-300 rounded-[0.4vw] font-bold text-amber-800">
                                        ₹ {totalEstimatedAmount.toLocaleString("en-IN")}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Final Amount (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="estimatedAmount"
                                        value={form.estimatedAmount}
                                        onChange={handleChange}
                                        placeholder="Enter final amount"
                                        min="0"
                                        step="0.01"
                                        className="w-full text-[1vw] px-[0.75vw] py-[0.5vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex justify-end gap-[1vw] mt-[1.5vw]">
                            <button
                                onClick={handleBack}
                                className="px-[1.5vw] py-[.6vw] border-2 border-gray-300 text-gray-700 bg-white rounded-[0.6vw] font-medium text-[0.9vw] hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEstimate}
                                className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md cursor-pointer"
                            >
                                💾 Save Estimate
                            </button>
                            <button
                                onClick={handleSendToBilling}
                                className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[0.6vw] font-semibold text-[0.9vw] hover:from-green-700 hover:to-emerald-700 transition-all shadow-md cursor-pointer"
                            >
                                💸 Send to Billing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPaymentDetails;
