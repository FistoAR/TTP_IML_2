import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar';
import DashboardContent from './Dashboard.jsx';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="flex h-[100vh] w-[100%] bg-[#F1F5F9] font-sans">
      {/* Fixed Sider */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="w-[85%] flex-1 flex flex-col">
        <Navbar />

        {/* Main Content Area */}
        <main id='mainContent' className="p-[.15vw] overflow-hidden">
          {/* This component acts as the main page content */}
          {/* <DashboardContent /> */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;