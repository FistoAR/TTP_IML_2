// InventoryDetails.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY_INVENTORY_FOLLOWUPS = "iml_inventory_followups";
const STORAGE_KEY_PRODUCTION_FOLLOWUPS = "iml_production_followups";

const InventoryDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { entry } = location.state || {};

    const [form, setForm] = useState({
        company: "",
        imlName: "",
        productCategory: "",
        productSize: "",
        productionQty: 0,
        finalQty: "",
        samplesTaken: "0",
        remarks: "",
    });

    const [maxFinalQty, setMaxFinalQty] = useState(0);

    const [followups, setFollowups] = useState([]);
    const [currentProductionQty, setCurrentProductionQty] = useState(0);

    // Load data & followups
    useEffect(() => {
        if (!entry) return;

        const entryId = entry.id;

        // Load current production quantity
        const storedProduction = localStorage.getItem(STORAGE_KEY_PRODUCTION_FOLLOWUPS);
        if (storedProduction) {
            const productionData = JSON.parse(storedProduction);
            const productionEntries = productionData[entryId] || [];

            const totalProduced = productionEntries.reduce((sum, e) => {
                const accepted = parseInt(e.acceptedComponents) || 0;
                return sum + accepted;
            }, 0);

            setCurrentProductionQty(totalProduced);
        }

        // Prefill form
        setForm({
            company: entry.company || "",
            imlName: entry.imlName || "",
            productCategory: entry.productCategory || "",
            productSize: entry.size || "",
            productionQty: entry.producedQuantity || 0,
            finalQty: "",
            samplesTaken: "0",
            remarks: "",
        });

        // Load followup history
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY_FOLLOWUPS);
        const allData = stored ? JSON.parse(stored) : {};
        const history = allData[entryId] || [];
        setFollowups(history);

        // Calculate max final qty (production qty - sum of all previous final qty in history)
        const totalBilledQty = history.reduce((sum, f) => {
            return sum + (parseInt(f.finalQty) || 0);
        }, 0);

        const availableQty = (entry.producedQuantity || 0) - totalBilledQty;
        setMaxFinalQty(Math.max(availableQty, 0));

    }, [entry]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validate finalQty doesn't exceed available quantity
        if (name === "finalQty") {
            const qty = parseInt(value) || 0;
            if (qty > maxFinalQty) {
                alert(`Final quantity cannot exceed available quantity (${maxFinalQty.toLocaleString("en-IN")})`);
                return;
            }
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleSave = () => {
        if (!form.finalQty) {
            alert("Please enter final quantity for billing");
            return;
        }

        if (!form.remarks) {
            alert("Please enter remarks");
            return;
        }

        const finalQty = parseInt(form.finalQty) || 0;
        const samplesTaken = parseInt(form.samplesTaken) || 0;

        if (finalQty > maxFinalQty) {
            alert(`Final quantity cannot exceed available quantity (${maxFinalQty.toLocaleString("en-IN")})`);
            return;
        }


        const newFollowup = {
            date: new Date().toLocaleDateString("en-IN"),
            time: new Date().toLocaleTimeString("en-IN", {
                hour: '2-digit',
                minute: '2-digit'
            }),
            productionQty: form.productionQty,
            finalQty: finalQty,
            samplesTaken: samplesTaken,
            remarks: form.remarks,
        };

        const updated = [...followups, newFollowup];
        setFollowups(updated);

        const entryId = entry.id;
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY_FOLLOWUPS);
        const allData = stored ? JSON.parse(stored) : {};
        allData[entryId] = updated;
        localStorage.setItem(
            STORAGE_KEY_INVENTORY_FOLLOWUPS,
            JSON.stringify(allData)
        );

        // Update max final qty
        const newMaxFinalQty = maxFinalQty - finalQty;
        setMaxFinalQty(Math.max(newMaxFinalQty, 0));

        // Clear only input fields
        setForm((prev) => ({
            ...prev,
            finalQty: "",
            samplesTaken: "0",
            remarks: "",
        }));

        alert("✅ Quantity verified and sent to Billing & Dispatch!");

    };

    const handleBack = () => {
        navigate("/iml/inventory", {
            state: { refreshData: true }
        });
    };

    // Check if production quantity has changed
    useEffect(() => {
        if (currentProductionQty > 0 && entry) {
            const storedProduction = localStorage.getItem(STORAGE_KEY_PRODUCTION_FOLLOWUPS);
            if (storedProduction) {
                const productionData = JSON.parse(storedProduction);
                const productionEntries = productionData[entry.id] || [];

                const totalProduced = productionEntries.reduce((sum, e) => {
                    const accepted = parseInt(e.acceptedComponents) || 0;
                    return sum + accepted;
                }, 0);

                if (totalProduced !== currentProductionQty) {
                    setCurrentProductionQty(totalProduced);
                    setForm(prev => ({
                        ...prev,
                        productionQty: totalProduced
                    }));
                }
            }
        }
    }, [currentProductionQty, entry]);

    if (!entry) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Invalid Access
                    </h2>
                    <p className="text-gray-600 mb-4">No entry information provided</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
                    >
                        Back to Inventory Management
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
                            Inventory Verification & Billing
                        </h1>
                        <p className="text-[.85vw] text-gray-600 mt-1">
                            {form.company} - {form.imlName}
                        </p>
                    </div>
                    <div className="w-[3vw]"></div>
                </div>

                <div className="p-[1.5vw]">
                    <div className="space-y-[1.5vw] max-h-[65vh] overflow-y-auto">
                        {/* Product Information */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[0.6vw] border-2 border-purple-200 p-[1vw]">
                            <h3 className="text-[1.1vw] font-semibold text-purple-900 mb-[1vw] flex items-center gap-2">
                                <span className="text-[1.3vw]">📦</span> Product Information
                            </h3>
                            <div className="grid grid-cols-5 gap-[1vw]">
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Company Name
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] font-semibold">
                                        {form.company}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        IML Name
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-purple-100 border border-purple-300 rounded-[0.4vw] font-semibold text-purple-800">
                                        {form.imlName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Product Category
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-blue-100 border border-blue-300 rounded-[0.4vw] font-semibold text-blue-800">
                                        {form.productCategory}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Product Size
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-cyan-100 border border-cyan-300 rounded-[0.4vw] font-semibold text-cyan-800">
                                        {form.productSize}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Production Quantity
                                    </label>
                                    <div className="text-[.85vw] px-[0.75vw] py-[0.4vw] bg-green-100 border border-green-300 rounded-[0.4vw] font-bold text-green-800">
                                        {form.productionQty.toLocaleString("en-IN")}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Billing Form */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[0.6vw] border-2 border-blue-200 p-[1vw]">
                            <h3 className="text-[1.1vw] font-semibold text-blue-900 mb-[1vw] flex items-center gap-2">
                                <span className="text-[1.3vw]">📋</span> Billing Details
                            </h3>
                            <div className="grid grid-cols-3 gap-[1vw]">
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Final Qty for Billing <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="finalQty"
                                        value={form.finalQty}
                                        onChange={handleChange}
                                        placeholder="Enter final quantity"
                                        min="0"
                                        max={maxFinalQty}
                                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-[.7vw] text-gray-700 mt-1">
                                        Available: {maxFinalQty.toLocaleString("en-IN")}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Samples Taken
                                    </label>
                                    <input
                                        type="number"
                                        name="samplesTaken"
                                        value={form.samplesTaken}
                                        onChange={handleChange}
                                        placeholder="Enter samples taken"
                                        min="0"
                                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[.8vw] font-medium text-gray-700 mb-[0.3vw]">
                                        Remarks <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="remarks"
                                        value={form.remarks}
                                        onChange={handleChange}
                                        placeholder="Enter remarks"
                                        className="w-full text-[.85vw] px-[0.75vw] py-[0.4vw] bg-white border-2 border-gray-300 rounded-[0.4vw] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-[1vw] flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-[1.5vw] py-[.6vw] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-[0.6vw] font-semibold text-[.9vw] hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md cursor-pointer"
                                >
                                    💾 Save & Send to Billing
                                </button>
                            </div>
                        </div>

                        {/* History Table */}
                        {followups.length > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[0.6vw] border-2 border-amber-200 p-[1vw]">
                                <h3 className="text-[1.1vw] font-semibold text-amber-900 mb-[1vw] flex items-center gap-2">
                                    <span className="text-[1.3vw]">📊</span> Billing History
                                </h3>
                                <div className="overflow-auto max-h-[35vh]">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-amber-100 sticky top-0">
                                                <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                                                    Date & Time
                                                </th>
                                                <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                                                    Production Qty
                                                </th>
                                                <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                                                    Final Qty
                                                </th>
                                                <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                                                    Samples
                                                </th>
                                                <th className="border border-amber-300 px-[0.75vw] py-[.6vw] text-left text-[.8vw] font-semibold text-amber-900">
                                                    Remarks
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {followups.slice().reverse().map((f, idx) => (
                                                <tr key={idx} className="hover:bg-amber-50">
                                                    <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw]">
                                                        {f.date} {f.time}
                                                    </td>
                                                    <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-semibold text-gray-700">
                                                        {parseInt(f.productionQty).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] font-bold text-green-700">
                                                        {parseInt(f.finalQty).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] text-gray-700">
                                                        {parseInt(f.samplesTaken).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="border border-amber-300 px-[0.75vw] py-[.6vw] text-[.8vw] text-gray-700">
                                                        {f.remarks}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryDetails;
