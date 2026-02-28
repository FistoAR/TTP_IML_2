import React from 'react';
// Corrected the import path to explicitly include the .jsx extension
import { IconSearch, IconFilter, IconBell, IconSettings, IconLogout } from './MainIcons.jsx';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="h-[5vw] min-h-[5vw] bg-white shadow-sm flex items-center justify-between px-[2vw] sticky top-0 z-40 border-b border-gray-100">
      {/* Search */}
      <div className="relative w-[35vw] opacity-0 pointer-events-none">
        <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-400">
          <IconSearch className="w-[1.1vw] h-[1.1vw]" />
        </div>
        <input
          type="text"
          placeholder="Search company name, orders id"
          className="w-full bg-[#f1f5f9] rounded-full pl-[2.8vw] pr-[2.5vw] py-[0.7vw] text-[1vw] focus:outline-none focus:ring-[0.1vw] focus:ring-[#22d3ee] placeholder-gray-400 font-medium transition-all"
        />
        <div className="absolute right-[1vw] top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
          <IconFilter className="w-[1.1vw] h-[1.1vw]" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[1.5vw] text-gray-500">
        <div className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer hover:text-[#1a3594] transition-colors">
          <IconBell className="w-[1.3vw] h-[1.3vw]" />
          <span className="absolute top-1 right-1 w-[0.7vw] h-[0.7vw] bg-red-500 rounded-full border-[0.15vw] border-white"></span>
        </div>
        <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer hover:text-[#1a3594] transition-colors">
          <IconSettings className="w-[1.3vw] h-[1.3vw]" />
        </div>
        <div className="flex items-center gap-[0.5vw] cursor-pointer hover:text-red-500 rounded-lg transition-colors">
          <Link to='/login' className="flex align-center justify-center gap-[.5vw]">
          <IconLogout className="w-[1.3vw] h-[1.3vw]" />
          <span className="text-[1vw] font-medium hidden sm:block">Logout</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;