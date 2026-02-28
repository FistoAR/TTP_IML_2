import React from 'react';
// Corrected import path to include the .jsx extension
import { IconChevronDown, IconFilter, IconBox } from '../components/MainIcons.jsx';

const DashboardContent = () => {
    // Colors matching the original image cards
    const cardData = [
        { count: '1198', title: 'Total Orders', subtitle: 'Active Orders', color: 'bg-[#5942c7]', icon: '⚡' },
        { count: '240', title: 'Pending Approvals', subtitle: '3x Urgent Approvals', color: 'bg-[#a352ff]', icon: '⏳' },
        { count: '70', title: 'Artwork in Process', subtitle: 'Design Stage', color: 'bg-[#ff953f]', icon: '🎨' },
        { count: '140', title: 'Design Approved', subtitle: 'Ready to Proceed', color: 'bg-[#21b979]', icon: '✅' },
    ];

    const actionButton = (text, color, icon) => (
        <button className={`w-full ${color} text-white font-semibold py-[1vw] rounded-[0.5vw] text-[1vw] shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2`}>
            {icon} {text}
        </button>
    );

    const AlertItem = ({ title, time, isCritical = false }) => (
        <div className="bg-white p-3 rounded-lg flex items-center justify-between text-[0.85vw] shadow-sm border-l-4 border-yellow-500">
            <div className='flex flex-col'>
                <p className='font-medium text-gray-700'>{title}</p>
                <p className='text-gray-500 text-[0.75vw]'>{time}</p>
            </div>
            {isCritical && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
        </div>
    );

    return (
        <div className="grid grid-cols-12 gap-[1.5vw] h-full">
            {/* Main Content Area (9/12 width) */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-[1.5vw]">
                {/* Header */}
                <h1 className="text-[1.8vw] font-bold text-gray-800">Orders Pipeline Status</h1>
                <p className="text-[1vw] text-gray-500 -mt-2">Click Any Stage to Filter the Orders Below</p>

                {/* Status Cards */}
                <div className="grid grid-cols-4 gap-[1.5vw]">
                    {cardData.map((card, index) => (
                        <div key={index} className={`p-[1.5vw] rounded-[0.8vw] text-white shadow-xl ${card.color}`}>
                            <div className="text-[3vw] font-extrabold leading-none">{card.count}</div>
                            <div className="text-[1.2vw] font-semibold mt-1">{card.title}</div>
                            <div className="text-[0.9vw] opacity-80 mt-1">{card.subtitle}</div>
                        </div>
                    ))}
                </div>

                {/* Filters and Actions Bar */}
                <div className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between text-[1vw] font-medium">
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-gray-700 border border-gray-300 rounded-lg px-3 py-1 hover:bg-gray-50">All Products <IconChevronDown className="w-3 h-3"/></button>
                        <button className="flex items-center gap-1 text-gray-700 border border-gray-300 rounded-lg px-3 py-1 hover:bg-gray-50">All Status <IconChevronDown className="w-3 h-3"/></button>
                        <button className="flex items-center gap-1 text-gray-700 border border-gray-300 rounded-lg px-3 py-1 hover:bg-gray-50">All Priority <IconChevronDown className="w-3 h-3"/></button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-500 hover:text-[#1a3594] flex items-center gap-1">
                            <IconFilter className="w-4 h-4" /> Filter
                        </button>
                        <button className="bg-blue-600 text-white rounded-lg px-4 py-1.5 hover:bg-blue-700 font-semibold flex items-center gap-1">
                            <IconBox className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* Orders List Placeholder */}
                <div className="bg-white p-4 rounded-lg shadow-lg flex-1">
                    <h2 className="text-[1.5vw] font-semibold text-gray-800 mb-4">Orders List</h2>
                    {/* Simplified table structure */}
                    <div className="space-y-3">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="flex justify-between items-center text-[0.9vw] p-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-md">
                                <div className="w-1/5 font-medium text-gray-800">ORD-NO-1234<span className='block text-xs text-gray-500 font-normal'>ORD-NO-1234</span></div>
                                <div className="w-1/5 text-gray-600">Sri/Sweets <span className='block text-xs text-gray-500 font-normal'>5+ Orders</span></div>
                                <div className="w-1/6 text-gray-600">10,000<span className='block text-xs text-gray-500 font-normal'>5000</span></div>
                                <div className="w-1/6">
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-600">processing</span>
                                </div>
                                <div className="w-1/6">
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-600">completed</span>
                                </div>
                                <div className="w-1/12 text-gray-400 cursor-pointer hover:text-gray-700 text-lg">
                                    ...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Side Panel (3/12 width) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-[1.5vw]">
                {/* Quick Actions */}
                <div className="p-4 bg-white rounded-lg shadow-lg">
                    <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-3">Quick Actions</h2>
                    <div className="space-y-3">
                        {actionButton('+ New Order', 'bg-blue-600', '✨')}
                        {actionButton('Pending Approval', 'bg-[#a352ff]', '⏳')}
                        {actionButton('Generate Report', 'bg-[#ff953f]', '📈')}
                    </div>
                </div>

                {/* Alerts & Remainders */}
                <div className="p-4 bg-white rounded-lg shadow-lg">
                    <h2 className="text-[1.2vw] font-semibold text-gray-800 mb-3">Alerts & Remainders</h2>
                    <div className="space-y-3">
                        <AlertItem title="Design Approval Pending for More than 3 Days" time="3 days ago" isCritical={true} />
                        <AlertItem title="Order Stock Value is Down: 8500/2000" time="1 hour ago" />
                        <AlertItem title="Design Approval Pending for More than 3 Days" time="3 days ago" isCritical={true} />
                        <AlertItem title="Last Order Stock Value is Down" time="3 days ago" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardContent;